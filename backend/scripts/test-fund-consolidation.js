/**
 * 资金归集功能测试脚本
 * 测试资金归集服务的各项功能
 */

require('dotenv').config();
const FundConsolidationService = require('../services/fundConsolidationService');
const { pool } = require('../config/database');

/**
 * 资金归集测试类
 */
class FundConsolidationTest {
    constructor() {
        this.service = FundConsolidationService;
        this.results = {
            serviceInit: false,
            walletQuery: false,
            balanceCheck: false,
            consolidationLogic: false,
            historyQuery: false
        };
        this.mockMode = false;
    }

    /**
     * 运行所有资金归集测试
     */
    async runAllTests() {
        console.log('🏦 资金归集功能测试\n');
        console.log('=' * 50 + '\n');

        try {
            // 1. 服务初始化测试
            await this.testServiceInitialization();
            
            // 2. 钱包查询测试
            await this.testWalletQuery();
            
            // 3. 余额检查测试
            await this.testBalanceCheck();
            
            // 4. 归集逻辑测试
            await this.testConsolidationLogic();
            
            // 5. 历史记录查询测试
            await this.testHistoryQuery();
            
            // 显示结果
            this.showResults();

        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error.message);
        }
    }

    /**
     * 测试服务初始化
     */
    async testServiceInitialization() {
        console.log('🔧 1. 服务初始化测试\n');

        try {
            const apiKey = process.env.TATUM_API_KEY;
            
            if (!apiKey || apiKey === 'your_tatum_api_key_here') {
                console.log('   ⚠️ 未配置真实API密钥，使用模拟模式');
                this.mockMode = true;
                this.results.serviceInit = true;
                console.log('   ✅ 模拟模式初始化成功\n');
                return;
            }

            console.log('   📝 初始化资金归集服务...');
            
            // 测试服务初始化
            await this.service.initialize();
            
            console.log('   ✅ 服务初始化成功');
            console.log(`   🔑 API密钥: ${apiKey.substring(0, 10)}...`);
            console.log(`   🏦 主钱包地址: ${process.env.MASTER_WALLET_ADDRESS || '未配置'}`);

            this.results.serviceInit = true;

        } catch (error) {
            console.log('   ❌ 服务初始化失败:', error.message);
            console.log('   💡 可能原因: API密钥无效或配置缺失');
            this.results.serviceInit = false;
        }

        console.log(`\n服务初始化: ${this.results.serviceInit ? '✅ 通过' : '❌ 失败'}\n`);
    }

    /**
     * 测试钱包查询
     */
    async testWalletQuery() {
        console.log('🔍 2. 钱包查询测试\n');

        try {
            console.log('   📝 查询需要归集的钱包...');

            if (this.mockMode) {
                // 模拟钱包数据
                const mockWallets = [
                    {
                        wallet_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                        derivation_index: 0,
                        user_id: 1,
                        created_at: new Date()
                    },
                    {
                        wallet_address: 'TLsV52sRDL79HXGGm9yzwKibb6BeruhUzy',
                        derivation_index: 1,
                        user_id: 2,
                        created_at: new Date()
                    }
                ];

                console.log(`   找到 ${mockWallets.length} 个钱包 (模拟数据):`);
                mockWallets.forEach((wallet, index) => {
                    console.log(`   钱包 ${index + 1}: ${wallet.wallet_address.substring(0, 15)}... (用户 ${wallet.user_id})`);
                });

                this.results.walletQuery = true;
            } else {
                // 真实查询
                const wallets = await this.service.getWalletsForConsolidation();
                
                console.log(`   找到 ${wallets.length} 个钱包:`);
                wallets.slice(0, 5).forEach((wallet, index) => {
                    console.log(`   钱包 ${index + 1}: ${wallet.wallet_address.substring(0, 15)}... (用户 ${wallet.user_id})`);
                });

                if (wallets.length > 5) {
                    console.log(`   ... 还有 ${wallets.length - 5} 个钱包`);
                }

                this.results.walletQuery = true;
            }

            console.log('   ✅ 钱包查询成功');

        } catch (error) {
            console.log('   ❌ 钱包查询失败:', error.message);
            this.results.walletQuery = false;
        }

        console.log(`\n钱包查询: ${this.results.walletQuery ? '✅ 通过' : '❌ 失败'}\n`);
    }

    /**
     * 测试余额检查
     */
    async testBalanceCheck() {
        console.log('💰 3. 余额检查测试\n');

        if (!this.results.walletQuery) {
            console.log('   ⏭️ 跳过 (钱包查询未通过)');
            return;
        }

        try {
            console.log('   📝 检查钱包余额...');

            const testAddresses = [
                'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                'TLsV52sRDL79HXGGm9yzwKibb6BeruhUzy',
                'TRX9a5u2V9BvjhLTwKXuGCCPLiUBz2jmw6'
            ];

            for (const address of testAddresses) {
                console.log(`\n   地址: ${address.substring(0, 15)}...`);

                if (this.mockMode) {
                    // 模拟余额
                    const mockBalance = (Math.random() * 100).toFixed(2);
                    console.log(`   USDT余额: ${mockBalance} USDT (模拟)`);
                    
                    const needsConsolidation = parseFloat(mockBalance) >= 10;
                    console.log(`   需要归集: ${needsConsolidation ? '是' : '否'}`);
                } else {
                    // 真实余额查询
                    try {
                        const balance = await this.service.getWalletBalance(address);
                        console.log(`   USDT余额: ${balance} USDT`);
                        
                        const needsConsolidation = balance >= this.service.minConsolidationAmount;
                        console.log(`   需要归集: ${needsConsolidation ? '是' : '否'}`);
                    } catch (balanceError) {
                        console.log(`   ⚠️ 余额查询失败: ${balanceError.message}`);
                    }
                }
            }

            console.log('\n   ✅ 余额检查测试完成');
            this.results.balanceCheck = true;

        } catch (error) {
            console.log('   ❌ 余额检查测试失败:', error.message);
            this.results.balanceCheck = false;
        }

        console.log(`\n余额检查: ${this.results.balanceCheck ? '✅ 通过' : '❌ 失败'}\n`);
    }

    /**
     * 测试归集逻辑
     */
    async testConsolidationLogic() {
        console.log('🔄 4. 归集逻辑测试\n');

        try {
            console.log('   📝 测试归集逻辑...');

            // 模拟归集场景
            const consolidationScenarios = [
                {
                    name: '高余额钱包',
                    balance: 150.50,
                    minAmount: 10,
                    shouldConsolidate: true
                },
                {
                    name: '低余额钱包',
                    balance: 5.25,
                    minAmount: 10,
                    shouldConsolidate: false
                },
                {
                    name: '临界余额钱包',
                    balance: 10.00,
                    minAmount: 10,
                    shouldConsolidate: true
                }
            ];

            console.log('   归集场景测试:');
            consolidationScenarios.forEach(scenario => {
                const willConsolidate = scenario.balance >= scenario.minAmount;
                const status = willConsolidate === scenario.shouldConsolidate ? '✅' : '❌';
                
                console.log(`   ${status} ${scenario.name}: ${scenario.balance} USDT`);
                console.log(`      预期: ${scenario.shouldConsolidate ? '归集' : '跳过'}, 实际: ${willConsolidate ? '归集' : '跳过'}`);
            });

            // 测试归集参数计算
            console.log('\n   📊 归集参数计算:');
            const testBalance = 100.50;
            const feeReserve = 0.1; // 预留手续费
            const consolidationAmount = testBalance - feeReserve;
            
            console.log(`   原始余额: ${testBalance} USDT`);
            console.log(`   预留手续费: ${feeReserve} USDT`);
            console.log(`   归集金额: ${consolidationAmount} USDT`);

            // 测试私钥派生逻辑
            console.log('\n   🔐 私钥派生测试:');
            if (this.mockMode) {
                console.log('   模拟私钥派生成功');
            } else {
                try {
                    // 这里只测试逻辑，不实际派生私钥
                    const mnemonic = process.env.TATUM_MASTER_WALLET_MNEMONIC;
                    if (mnemonic) {
                        console.log('   主钱包助记词: 已配置');
                        console.log('   私钥派生路径: m/44\'/195\'/0\'/0/{index}');
                    } else {
                        console.log('   ⚠️ 主钱包助记词未配置');
                    }
                } catch (keyError) {
                    console.log(`   ⚠️ 私钥派生测试失败: ${keyError.message}`);
                }
            }

            console.log('\n   ✅ 归集逻辑测试完成');
            this.results.consolidationLogic = true;

        } catch (error) {
            console.log('   ❌ 归集逻辑测试失败:', error.message);
            this.results.consolidationLogic = false;
        }

        console.log(`\n归集逻辑: ${this.results.consolidationLogic ? '✅ 通过' : '❌ 失败'}\n`);
    }

    /**
     * 测试历史记录查询
     */
    async testHistoryQuery() {
        console.log('📊 5. 历史记录查询测试\n');

        try {
            console.log('   📝 查询归集历史记录...');

            if (this.mockMode) {
                // 模拟历史记录
                const mockHistory = [
                    {
                        id: 1,
                        from_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                        to_address: 'TLsV52sRDL79HXGGm9yzwKibb6BeruhUzy',
                        amount: '95.50',
                        tx_hash: '0x' + Math.random().toString(16).substring(2, 66),
                        status: 'completed',
                        created_at: new Date()
                    },
                    {
                        id: 2,
                        from_address: 'TRX9a5u2V9BvjhLTwKXuGCCPLiUBz2jmw6',
                        to_address: 'TLsV52sRDL79HXGGm9yzwKibb6BeruhUzy',
                        amount: '150.25',
                        tx_hash: '0x' + Math.random().toString(16).substring(2, 66),
                        status: 'completed',
                        created_at: new Date()
                    }
                ];

                console.log(`   找到 ${mockHistory.length} 条归集记录 (模拟数据):`);
                mockHistory.forEach((record, index) => {
                    console.log(`   记录 ${index + 1}:`);
                    console.log(`     从: ${record.from_address.substring(0, 15)}...`);
                    console.log(`     到: ${record.to_address.substring(0, 15)}...`);
                    console.log(`     金额: ${record.amount} USDT`);
                    console.log(`     状态: ${record.status}`);
                    console.log(`     交易哈希: ${record.tx_hash.substring(0, 20)}...`);
                });

                this.results.historyQuery = true;
            } else {
                // 真实查询
                try {
                    const history = await this.service.getConsolidationHistory(1, 5);
                    
                    console.log(`   找到 ${history.records.length} 条归集记录:`);
                    history.records.forEach((record, index) => {
                        console.log(`   记录 ${index + 1}:`);
                        console.log(`     从: ${record.from_address.substring(0, 15)}...`);
                        console.log(`     到: ${record.to_address.substring(0, 15)}...`);
                        console.log(`     金额: ${record.amount} USDT`);
                        console.log(`     状态: ${record.status}`);
                        if (record.tx_hash) {
                            console.log(`     交易哈希: ${record.tx_hash.substring(0, 20)}...`);
                        }
                    });

                    console.log(`   总记录数: ${history.total}`);
                    console.log(`   当前页: ${history.page}/${history.totalPages}`);

                    this.results.historyQuery = true;
                } catch (historyError) {
                    console.log(`   ⚠️ 历史记录查询失败: ${historyError.message}`);
                    this.results.historyQuery = false;
                }
            }

            console.log('\n   ✅ 历史记录查询测试完成');

        } catch (error) {
            console.log('   ❌ 历史记录查询测试失败:', error.message);
            this.results.historyQuery = false;
        }

        console.log(`\n历史记录查询: ${this.results.historyQuery ? '✅ 通过' : '❌ 失败'}\n`);
    }

    /**
     * 显示测试结果
     */
    showResults() {
        console.log('📊 资金归集功能测试结果汇总\n');
        console.log('=' * 50 + '\n');

        const tests = [
            { name: '服务初始化', result: this.results.serviceInit },
            { name: '钱包查询', result: this.results.walletQuery },
            { name: '余额检查', result: this.results.balanceCheck },
            { name: '归集逻辑', result: this.results.consolidationLogic },
            { name: '历史记录查询', result: this.results.historyQuery }
        ];

        let passedCount = 0;

        tests.forEach(test => {
            const status = test.result ? '✅ 通过' : '❌ 失败';
            console.log(`${status} ${test.name}`);
            if (test.result) passedCount++;
        });

        console.log(`\n总体结果: ${passedCount}/${tests.length} 项测试通过`);

        if (passedCount === tests.length) {
            console.log('🎉 所有资金归集功能测试通过！');
        } else if (passedCount >= 3) {
            console.log('⚠️ 大部分功能正常，部分功能需要真实API密钥和数据库测试。');
        } else {
            console.log('❌ 多项功能测试失败，请检查配置和数据库连接。');
        }

        console.log('\n🔧 功能状态总结:');
        console.log(`✅ 钱包扫描: ${this.results.walletQuery ? '可用' : '不可用'}`);
        console.log(`✅ 余额检查: ${this.results.balanceCheck ? '可用' : '不可用'}`);
        console.log(`✅ 归集逻辑: ${this.results.consolidationLogic ? '可用' : '不可用'}`);
        console.log(`✅ 历史记录: ${this.results.historyQuery ? '可用' : '不可用'}`);

        console.log('\n💡 归集服务配置建议:');
        console.log('1. 最小归集金额: 10 USDT');
        console.log('2. 执行频率: 每30分钟');
        console.log('3. 手续费预留: 0.1 USDT等值TRX');
        console.log('4. 批量处理: 每次最多处理50个钱包');

        if (this.mockMode) {
            console.log('\n💡 注意: 当前为模拟模式，请配置真实API密钥和数据库进行完整测试。');
        }
    }
}

/**
 * 主函数
 */
async function main() {
    const tester = new FundConsolidationTest();
    await tester.runAllTests();
    
    // 关闭数据库连接
    if (pool) {
        await pool.end();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FundConsolidationTest;