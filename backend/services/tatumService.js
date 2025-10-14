const { TatumSDK, Network } = require('@tatumio/tatum');
const { TronWeb } = require('tronweb');
const bip39 = require('bip39');
const HDKey = require('hdkey');
const crypto = require('crypto');

/**
 * Tatum区块链服务类
 * 提供TRC20 USDT相关的区块链操作功能
 */
class TatumService {
  constructor() {
    this.apiKey = process.env.TATUM_API_KEY;
    this.network = process.env.TATUM_NETWORK === 'mainnet' ? Network.TRON : Network.TRON_SHASTA;
    this.masterWalletXPub = process.env.TATUM_MASTER_WALLET_XPUB;
    this.masterWalletMnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;
    this.usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    
    // TronWeb配置 - 修复testnet配置
    this.fullHost = process.env.TATUM_NETWORK === 'mainnet' 
      ? 'https://api.trongrid.io'
      : 'https://api.shasta.trongrid.io';
    
    // 确保fullHost是有效的URL
    if (!this.fullHost || this.fullHost === '') {
      this.fullHost = 'https://api.shasta.trongrid.io'; // 默认使用测试网
    }
    
    this.tronWeb = new TronWeb({
      fullHost: this.fullHost,
      headers: { "TRON-PRO-API-KEY": this.apiKey || '' },
      privateKey: process.env.PAYMENT_PRIVATE_KEY || '01'
    });
    
    this.tatum = null;
    this.initialized = false;
  }

  /**
   * 初始化Tatum SDK
   */
  async init() {
    if (this.initialized) {
      return;
    }
    
    try {
      this.tatum = await TatumSDK.init({
        network: this.network,
        apiKey: {
          v4: this.apiKey
        }
      });
      this.initialized = true;
      console.log('✅ Tatum SDK 初始化成功');
    } catch (error) {
      console.error('❌ Tatum SDK 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 确保SDK已初始化
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * 生成主钱包（只需要执行一次）
   * @returns {Object} 包含mnemonic和xpub的钱包信息
   */
  async generateMasterWallet() {
    try {
      // 生成助记词
      const mnemonic = bip39.generateMnemonic();
      
      // 从助记词生成种子
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // 生成HD钱包根密钥
      const hdkey = HDKey.fromMasterSeed(seed);
      
      // 使用TRON的标准派生路径 m/44'/195'/0'/0
      const masterKey = hdkey.derive("m/44'/195'/0'/0");
      
      console.log('🔐 主钱包生成成功:');
      console.log('助记词:', mnemonic);
      console.log('扩展公钥:', masterKey.publicExtendedKey);
      
      return {
        mnemonic: mnemonic,
        xpub: masterKey.publicExtendedKey
      };
    } catch (error) {
      console.error('❌ 主钱包生成失败:', error);
      throw error;
    }
  }

  /**
   * 为用户生成专属充值地址
   * @param {string|number} userId - 用户ID，用作地址派生索引
   * @returns {Object} 包含地址和私钥的对象
   */
  async generateUserDepositAddress(userId) {
    try {
      if (!this.masterWalletMnemonic) {
        throw new Error('主钱包助记词未配置');
      }

      // 将userId转换为数字索引
      let addressIndex;
      if (typeof userId === 'number') {
        addressIndex = userId;
      } else {
        // 对于字符串userId，使用哈希生成数字索引
        const hash = crypto.createHash('sha256').update(userId.toString()).digest('hex');
        // 取哈希的前8位转换为数字，确保在安全范围内
        addressIndex = parseInt(hash.substring(0, 8), 16) % 2147483647; // 2^31 - 1
      }

      // 从助记词生成种子
      const seed = await bip39.mnemonicToSeed(this.masterWalletMnemonic);
      
      // 生成HD钱包根密钥
      const hdkey = HDKey.fromMasterSeed(seed);
      
      // 使用TRON的标准派生路径 m/44'/195'/0'/0/{addressIndex}
      const childKey = hdkey.derive(`m/44'/195'/0'/0/${addressIndex}`);
      
      // 从私钥生成TRON地址
      const privateKeyHex = childKey.privateKey.toString('hex');
      
      // 创建临时TronWeb实例用于地址生成
      const tempTronWeb = new TronWeb({
        fullHost: this.fullHost,
        headers: this.tronWeb.headers,
        privateKey: privateKeyHex
      });
      
      const address = tempTronWeb.address.fromPrivateKey(privateKeyHex);

      console.log(`✅ 为用户${userId}生成充值地址: ${address}`);
      
      return {
        address: address,
        derivationIndex: addressIndex,
        privateKey: privateKeyHex
      };
    } catch (error) {
      console.error(`❌ 为用户${userId}生成地址失败:`, error);
      throw error;
    }
  }

  /**
   * 获取TRX余额
   * @param {string} address - TRON地址
   * @returns {number} TRX余额（单位：TRX）
   */
  async getTrxBalance(address) {
    try {
      const balance = await this.tronWeb.trx.getBalance(address);
      return this.tronWeb.fromSun(balance);
    } catch (error) {
      console.error(`获取TRX余额失败 (${address}):`, error);
      return 0;
    }
  }

  /**
   * 获取USDT余额
   * @param {string} address - TRON地址
   * @returns {number} USDT余额（单位：USDT）
   */
  async getUsdtBalance(address) {
    try {
      const contract = await this.tronWeb.contract().at(this.usdtContractAddress);
      const balance = await contract.balanceOf(address).call();
      
      // USDT有6位小数
      return parseFloat(balance.toString()) / 1000000;
    } catch (error) {
      console.error(`获取USDT余额失败 (${address}):`, error);
      return 0;
    }
  }

  /**
   * 发送USDT
   * @param {string} fromPrivateKey - 发送方私钥
   * @param {string} toAddress - 接收方地址
   * @param {number} amount - 发送金额（单位：USDT）
   * @returns {string} 交易哈希
   */
  /**
   * 发送USDT
   * @param {string} fromPrivateKey - 发送方私钥
   * @param {string} toAddress - 接收地址
   * @param {number} amount - 金额
   * @returns {string} 交易哈希
   */
  async sendUsdt(fromPrivateKey, toAddress, amount) {
    try {
      // 检查是否为模拟模式
      if (process.env.TATUM_MOCK_MODE === 'true') {
        console.log('🎭 模拟模式：生成模拟交易哈希');
        console.log(`💰 模拟转账: ${amount} USDT`);
        console.log(`📍 目标地址: ${toAddress}`);
        
        // 生成模拟的交易哈希
        const mockTxHash = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log(`✅ 模拟交易成功: ${mockTxHash}`);
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return mockTxHash;
      }

      // 真实的区块链交易逻辑
      const tronWeb = new TronWeb({
        fullHost: this.fullHost,
        headers: { "TRON-PRO-API-KEY": this.apiKey || '' },
        privateKey: fromPrivateKey
      });

      console.log(`🔗 连接到TRON网络: ${this.fullHost}`);
      console.log(`📄 USDT合约地址: ${this.usdtContractAddress}`);
      
      const contract = await tronWeb.contract().at(this.usdtContractAddress);
      
      // USDT有6位小数
      const amountInSun = Math.floor(amount * 1000000);
      
      console.log(`💰 转账金额: ${amount} USDT (${amountInSun} 最小单位)`);
      console.log(`📍 目标地址: ${toAddress}`);
      
      const transaction = await contract.transfer(toAddress, amountInSun).send();
      
      console.log(`✅ USDT转账成功: ${transaction}`);
      return transaction;
    } catch (error) {
      console.error('USDT转账失败:', error);
      console.error('错误详情:', {
        fullHost: this.fullHost,
        contractAddress: this.usdtContractAddress,
        amount: amount,
        toAddress: toAddress,
        mockMode: process.env.TATUM_MOCK_MODE
      });
      throw error;
    }
  }

  /**
   * 获取交易信息
   * @param {string} txHash - 交易哈希
   * @returns {Object} 交易信息
   */
  async getTransaction(txHash) {
    try {
      const transaction = await this.tronWeb.trx.getTransaction(txHash);
      return transaction;
    } catch (error) {
      console.error(`获取交易信息失败 (${txHash}):`, error);
      throw error;
    }
  }

  /**
   * 创建地址订阅（用于监控充值）
   * @param {string} address - 要监控的地址
   * @returns {Object} 订阅信息
   */
  async createAddressSubscription(address) {
    try {
      await this.ensureInitialized();
      
      const subscription = await this.tatum.notification.subscribe.addressEvent({
        address: address,
        chain: 'TRON',
        url: process.env.TATUM_WEBHOOK_URL
      });
      
      console.log(`✅ 地址订阅创建成功: ${address}`);
      return subscription;
    } catch (error) {
      console.error(`创建地址订阅失败 (${address}):`, error);
      throw error;
    }
  }

  /**
   * 批量创建地址订阅
   * @param {Array} addresses - 地址数组
   * @returns {Array} 订阅结果数组
   */
  async createBatchAddressSubscriptions(addresses) {
    const results = [];
    
    for (const address of addresses) {
      try {
        const subscription = await this.createAddressSubscription(address);
        results.push({ address, subscription, success: true });
      } catch (error) {
        results.push({ address, error: error.message, success: false });
      }
    }
    
    return results;
  }

  /**
   * 销毁SDK连接
   */
  async destroy() {
    if (this.tatum) {
      await this.tatum.destroy();
      this.initialized = false;
    }
  }
}

module.exports = TatumService;