/**
 * Tatum 钱包管理演示脚本
 * 展示如何为用户生成独有地址并汇总资金到主钱包
 */

const { TatumSDK, Network } = require('@tatumio/tatum');
const { TronWeb } = require('tronweb');
const bip39 = require('bip39');
const HDKey = require('hdkey');
const crypto = require('crypto');
require('dotenv').config();

class WalletManagementDemo {
  constructor() {
    this.apiKey = process.env.TATUM_API_KEY;
    this.network = process.env.TATUM_NETWORK === 'mainnet' ? Network.TRON : Network.TRON_SHASTA;
    this.masterWalletMnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;
    this.usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    
    this.fullHost = process.env.TATUM_NETWORK === 'mainnet' 
      ? 'https://api.trongrid.io'
      : 'https://api.shasta.trongrid.io';
    
    this.tronWeb = new TronWeb({
      fullHost: this.fullHost,
      headers: { "TRON-PRO-API-KEY": this.apiKey || '' },
      privateKey: '01'
    });
    
    this.userAddresses = []; // 存储生成的用户地址
  }

  /**
   * 初始化Tatum SDK
   */
  async init() {
    try {
      this.tatum = await TatumSDK.init({
        network: this.network,
        apiKey: { v4: this.apiKey }
      });
      console.log('✅ Tatum SDK 初始化成功');
      console.log(`🌐 网络: ${this.network}`);
      console.log(`🔗 节点: ${this.fullHost}`);
    } catch (error) {
      console.error('❌ Tatum SDK 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 演示：生成主钱包（仅需执行一次）
   */
  async demoGenerateMasterWallet() {
    console.log('\n🔐 === 主钱包生成演示 ===');
    
    try {
      // 生成助记词
      const mnemonic = bip39.generateMnemonic();
      
      // 从助记词生成种子
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // 生成HD钱包根密钥
      const hdkey = HDKey.fromMasterSeed(seed);
      
      // 使用TRON的标准派生路径 m/44'/195'/0'/0
      const masterKey = hdkey.derive("m/44'/195'/0'/0");
      
      console.log('📝 生成的助记词:', mnemonic);
      console.log('🔑 扩展公钥:', masterKey.publicExtendedKey);
      console.log('⚠️  请将助记词安全保存到环境变量 TATUM_MASTER_WALLET_MNEMONIC 中');
      
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
   * @param {string|number} userId - 用户ID
   * @returns {Object} 地址信息
   */
  async generateUserDepositAddress(userId) {
    try {
      if (!this.masterWalletMnemonic) {
        throw new Error('主钱包助记词未配置，请先设置 TATUM_MASTER_WALLET_MNEMONIC 环境变量');
      }

      // 将userId转换为数字索引
      let addressIndex;
      if (typeof userId === 'number') {
        addressIndex = userId;
      } else {
        // 对于字符串userId，使用哈希生成数字索引
        const hash = crypto.createHash('sha256').update(userId.toString()).digest('hex');
        addressIndex = parseInt(hash.substring(0, 8), 16) % 2147483647;
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

      console.log(`✅ 为用户 ${userId} 生成地址: ${address} (索引: ${addressIndex})`);
      
      return {
        userId: userId,
        address: address,
        derivationIndex: addressIndex,
        privateKey: privateKeyHex
      };
    } catch (error) {
      console.error(`❌ 为用户 ${userId} 生成地址失败:`, error);
      throw error;
    }
  }

  /**
   * 演示：为多个用户生成地址
   */
  async demoGenerateUserAddresses() {
    console.log('\n👥 === 用户地址生成演示 ===');
    
    const userIds = ['user_001', 'user_002', 'user_003', 12345, 67890];
    
    for (const userId of userIds) {
      try {
        const addressInfo = await this.generateUserDepositAddress(userId);
        this.userAddresses.push(addressInfo);
        
        // 显示地址信息
        console.log(`📍 用户 ${userId}:`);
        console.log(`   地址: ${addressInfo.address}`);
        console.log(`   派生索引: ${addressInfo.derivationIndex}`);
        console.log(`   私钥: ${addressInfo.privateKey.substring(0, 10)}...`);
        console.log('');
      } catch (error) {
        console.error(`为用户 ${userId} 生成地址失败:`, error.message);
      }
    }
  }

  /**
   * 获取USDT余额
   * @param {string} address - TRON地址
   * @returns {number} USDT余额
   */
  async getUsdtBalance(address) {
    try {
      const contract = await this.tronWeb.contract().at(this.usdtContractAddress);
      const balance = await contract.balanceOf(address).call();
      
      // 处理BigInt类型转换
      let balanceNumber;
      if (typeof balance === 'bigint') {
        balanceNumber = Number(balance);
      } else if (balance && balance._hex) {
        // 处理十六进制格式
        balanceNumber = parseInt(balance._hex, 16);
      } else {
        balanceNumber = Number(balance) || 0;
      }
      
      return balanceNumber / 1000000; // USDT有6位小数
    } catch (error) {
      console.error(`获取USDT余额失败 (${address}):`, error.message);
      return 0;
    }
  }

  /**
   * 获取TRX余额
   * @param {string} address - TRON地址
   * @returns {number} TRX余额
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
   * 演示：检查用户地址余额
   */
  async demoCheckBalances() {
    console.log('\n💰 === 余额检查演示 ===');
    
    for (const userAddr of this.userAddresses) {
      try {
        const usdtBalance = await this.getUsdtBalance(userAddr.address);
        const trxBalance = await this.getTrxBalance(userAddr.address);
        
        console.log(`👤 用户 ${userAddr.userId} (${userAddr.address}):`);
        console.log(`   USDT余额: ${usdtBalance} USDT`);
        console.log(`   TRX余额: ${trxBalance} TRX`);
        console.log('');
      } catch (error) {
        console.error(`检查用户 ${userAddr.userId} 余额失败:`, error.message);
      }
    }
  }

  /**
   * 资金汇总到主钱包
   * @param {string} userPrivateKey - 用户地址私钥
   * @param {string} masterWalletAddress - 主钱包地址
   * @param {number} amount - 转账金额
   * @returns {string} 交易哈希
   */
  async consolidateUserFunds(userPrivateKey, masterWalletAddress, amount) {
    try {
      // 检查是否为模拟模式
      if (process.env.TATUM_MOCK_MODE === 'true') {
        console.log('🎭 模拟模式：生成模拟汇总交易');
        const mockTxHash = 'consolidate_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log(`✅ 模拟汇总成功: ${mockTxHash}`);
        return mockTxHash;
      }

      // 真实的区块链交易逻辑
      const userTronWeb = new TronWeb({
        fullHost: this.fullHost,
        headers: { "TRON-PRO-API-KEY": this.apiKey },
        privateKey: userPrivateKey
      });

      console.log(`💰 开始汇总资金: ${amount} USDT`);
      console.log(`📍 目标地址: ${masterWalletAddress}`);
      
      const contract = await userTronWeb.contract().at(this.usdtContractAddress);
      
      // USDT有6位小数
      const amountInSun = Math.floor(amount * 1000000);
      
      const transaction = await contract.transfer(masterWalletAddress, amountInSun).send();
      
      console.log(`✅ 资金汇总成功: ${transaction}`);
      return transaction;
    } catch (error) {
      console.error('资金汇总失败:', error);
      throw error;
    }
  }

  /**
   * 演示：批量资金汇总
   */
  async demoBatchConsolidation() {
    console.log('\n🔄 === 批量资金汇总演示 ===');
    
    // 模拟主钱包地址（实际使用时应该是您的真实主钱包地址）
    const masterWalletAddress = 'TYourMasterWalletAddressHere123456789';
    const minAmount = 0.1; // 最小汇总金额阈值
    
    console.log(`🎯 主钱包地址: ${masterWalletAddress}`);
    console.log(`📊 最小汇总金额: ${minAmount} USDT`);
    console.log('');
    
    const results = [];
    
    for (const userAddr of this.userAddresses) {
      try {
        // 检查余额
        const balance = await this.getUsdtBalance(userAddr.address);
        
        console.log(`🔍 检查用户 ${userAddr.userId} 余额: ${balance} USDT`);
        
        if (balance >= minAmount) {
          console.log(`💡 发现可汇总资金，开始汇总...`);
          
          // 执行汇总
          const txHash = await this.consolidateUserFunds(
            userAddr.privateKey,
            masterWalletAddress,
            balance
          );
          
          results.push({
            userId: userAddr.userId,
            address: userAddr.address,
            amount: balance,
            txHash: txHash,
            status: 'success'
          });
        } else {
          console.log(`⏭️  余额不足，跳过汇总`);
          results.push({
            userId: userAddr.userId,
            address: userAddr.address,
            amount: balance,
            status: 'skipped',
            reason: 'insufficient_balance'
          });
        }
        console.log('');
      } catch (error) {
        console.error(`汇总失败 ${userAddr.userId}:`, error.message);
        results.push({
          userId: userAddr.userId,
          address: userAddr.address,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    // 汇总结果
    console.log('📋 === 汇总结果 ===');
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    const skipped = results.filter(r => r.status === 'skipped');
    
    console.log(`✅ 成功: ${successful.length} 笔`);
    console.log(`❌ 失败: ${failed.length} 笔`);
    console.log(`⏭️  跳过: ${skipped.length} 笔`);
    
    if (successful.length > 0) {
      const totalAmount = successful.reduce((sum, r) => sum + r.amount, 0);
      console.log(`💰 总汇总金额: ${totalAmount.toFixed(6)} USDT`);
    }
    
    return results;
  }

  /**
   * 演示地址验证
   */
  async demoAddressValidation() {
    console.log('\n🔍 === 地址验证演示 ===');
    
    const testAddresses = [
      'TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH', // 有效的TRON地址
      'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT合约地址
      'invalid_address_123', // 无效地址
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // Bitcoin地址（无效）
    ];
    
    for (const address of testAddresses) {
      try {
        const isValid = this.tronWeb.isAddress(address);
        console.log(`📍 ${address}: ${isValid ? '✅ 有效' : '❌ 无效'}`);
      } catch (error) {
        console.log(`📍 ${address}: ❌ 验证失败 - ${error.message}`);
      }
    }
  }

  /**
   * 运行完整演示
   */
  async runFullDemo() {
    try {
      console.log('🚀 === Tatum 钱包管理完整演示 ===\n');
      
      // 1. 初始化
      await this.init();
      
      // 2. 主钱包生成演示（如果没有配置助记词）
      if (!this.masterWalletMnemonic) {
        console.log('⚠️  未检测到主钱包助记词，演示主钱包生成...');
        await this.demoGenerateMasterWallet();
        console.log('请将生成的助记词设置到环境变量后重新运行演示');
        return;
      }
      
      // 3. 用户地址生成演示
      await this.demoGenerateUserAddresses();
      
      // 4. 余额检查演示
      await this.demoCheckBalances();
      
      // 5. 地址验证演示
      await this.demoAddressValidation();
      
      // 6. 批量资金汇总演示
      await this.demoBatchConsolidation();
      
      console.log('\n🎉 演示完成！');
      console.log('\n📚 更多信息请参考：');
      console.log('- Tatum文档: https://docs.tatum.io/');
      console.log('- TRON文档: https://developers.tron.network/');
      
    } catch (error) {
      console.error('❌ 演示运行失败:', error);
    } finally {
      // 清理资源
      if (this.tatum) {
        await this.tatum.destroy();
      }
    }
  }
}

// 运行演示
async function main() {
  const demo = new WalletManagementDemo();
  await demo.runFullDemo();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WalletManagementDemo;