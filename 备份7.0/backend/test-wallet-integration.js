const dotenv = require('dotenv');
const tatumWalletService = require('./services/tatumWalletService');
const fundConsolidationService = require('./services/fundConsolidationService');
const { pool, redisClient } = require('./config/database');

// 加载环境变量
dotenv.config();

/**
 * Tatum钱包功能集成测试
 */
class WalletIntegrationTest {
    constructor() {
        this.testUserId = 999; // 测试用户ID
        this.testWalletAddress = null;
        this.testResults = [];
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🚀 开始Tatum钱包功能集成测试...\n');
        
        try {
            // 1. 测试服务初始化
            await this.testServiceInitialization();
            
            // 2. 测试充值地址生成
            await this.testDepositAddressGeneration();
            
            // 3. 测试余额查询
            await this.testBalanceQuery();
            
            // 4. 测试手续费计算
            await this.testFeeCalculation();
            
            // 5. 测试数据库操作
            await this.testDatabaseOperations();
            
            // 6. 测试资金归集服务
            await this.testFundConsolidation();
            
            // 7. 输出测试结果
            this.printTestResults();
            
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        } finally {
            // 清理测试数据
            await this.cleanup();
        }
    }

    /**
     * 测试服务初始化
     */
    async testServiceInitialization() {
        console.log('📋 测试1: 服务初始化');
        
        try {
            // 检查环境变量
            const requiredEnvVars = [
                'TATUM_API_KEY',
                'USDT_CONTRACT_ADDRESS',
                'MASTER_WALLET_ADDRESS'
            ];
            
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
            
            if (missingVars.length > 0) {
                throw new Error(`缺少环境变量: ${missingVars.join(', ')}`);
            }

            // 等待服务初始化完成
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 测试Tatum服务初始化
            const isInitialized = tatumWalletService.isInitialized;
            
            this.addTestResult('服务初始化', isInitialized, '✅ Tatum服务初始化成功');
            
        } catch (error) {
            this.addTestResult('服务初始化', false, `❌ ${error.message}`);
        }
    }

    /**
     * 测试充值地址生成
     */
    async testDepositAddressGeneration() {
        console.log('📋 测试2: 充值地址生成');
        
        try {
            // 生成测试用户的充值地址
            const walletInfo = await tatumWalletService.createDepositAddress(this.testUserId, 1001);
            
            if (walletInfo && walletInfo.address) {
                this.testWalletAddress = walletInfo.address;
                this.addTestResult(
                    '充值地址生成', 
                    true, 
                    `✅ 生成地址: ${walletInfo.address.substring(0, 10)}...`
                );
            } else {
                throw new Error('地址生成失败');
            }
            
        } catch (error) {
            this.addTestResult('充值地址生成', false, `❌ ${error.message}`);
        }
    }

    /**
     * 测试余额查询
     */
    async testBalanceQuery() {
        console.log('📋 测试3: 余额查询');
        
        try {
            if (!this.testWalletAddress) {
                throw new Error('测试钱包地址不存在');
            }
            
            // 查询钱包余额
            const balance = await tatumWalletService.getWalletBalance(this.testWalletAddress);
            
            this.addTestResult(
                '余额查询', 
                typeof balance === 'number', 
                `✅ 钱包余额: ${balance} USDT`
            );
            
            // 查询用户余额
            const userBalance = await tatumWalletService.getUserBalance(this.testUserId);
            
            this.addTestResult(
                '用户余额查询', 
                typeof userBalance === 'number', 
                `✅ 用户余额: ${userBalance} USDT`
            );
            
        } catch (error) {
            this.addTestResult('余额查询', false, `❌ ${error.message}`);
        }
    }

    /**
     * 测试手续费计算
     */
    async testFeeCalculation() {
        console.log('📋 测试4: 手续费计算');
        
        try {
            const testAmounts = [10, 50, 100, 500, 1000];
            
            for (const amount of testAmounts) {
                const feeDetails = tatumWalletService.calculateWithdrawalFee(amount);
                
                const isValid = (
                    feeDetails.fixedFee === 2 &&
                    feeDetails.percentageFee >= amount * 0.01 &&
                    feeDetails.percentageFee <= amount * 0.05 &&
                    feeDetails.totalFee === feeDetails.fixedFee + feeDetails.percentageFee &&
                    feeDetails.netAmount === amount - feeDetails.totalFee
                );
                
                if (!isValid) {
                    throw new Error(`${amount} USDT 手续费计算错误`);
                }
            }
            
            this.addTestResult(
                '手续费计算', 
                true, 
                '✅ 所有金额的手续费计算正确'
            );
            
        } catch (error) {
            this.addTestResult('手续费计算', false, `❌ ${error.message}`);
        }
    }

    /**
     * 测试数据库操作
     */
    async testDatabaseOperations() {
        console.log('📋 测试5: 数据库操作');
        
        try {
            // 测试钱包表查询
            const walletQuery = `
                SELECT COUNT(*) as count 
                FROM user_wallets 
                WHERE user_id = ?
            `;
            const [walletResult] = await pool.execute(walletQuery, [this.testUserId]);
            
            this.addTestResult(
                '钱包表查询', 
                walletResult[0].count >= 0, 
                `✅ 找到 ${walletResult[0].count} 个钱包记录`
            );
            
            // 测试用户表查询
            const userQuery = `
                SELECT balance, frozen_balance 
                FROM users 
                WHERE id = ?
            `;
            const [userResult] = await pool.execute(userQuery, [this.testUserId]);
            
            this.addTestResult(
                '用户表查询', 
                userResult.length >= 0, 
                `✅ 用户表查询成功`
            );
            
            // 测试其他表结构
            const tables = [
                'user_deposits',
                'user_withdrawals', 
                'balance_logs',
                'fund_consolidations',
                'wallet_monitors',
                'wallet_system_config'
            ];
            
            for (const table of tables) {
                const tableQuery = `SHOW TABLES LIKE '${table}'`;
                const [tableResult] = await pool.execute(tableQuery);
                
                if (tableResult.length === 0) {
                    throw new Error(`表 ${table} 不存在`);
                }
            }
            
            this.addTestResult(
                '数据库表结构', 
                true, 
                '✅ 所有必需的表都存在'
            );
            
        } catch (error) {
            this.addTestResult('数据库操作', false, `❌ ${error.message}`);
        }
    }

    /**
     * 测试资金归集服务
     */
    async testFundConsolidation() {
        console.log('📋 测试6: 资金归集服务');
        
        try {
            // 测试获取需要归集的钱包
            const walletsForConsolidation = await fundConsolidationService.getWalletsForConsolidation(0.1);
            
            this.addTestResult(
                '获取归集钱包列表', 
                Array.isArray(walletsForConsolidation), 
                `✅ 找到 ${walletsForConsolidation.length} 个钱包`
            );
            
            // 测试归集历史查询
            const history = await fundConsolidationService.getConsolidationHistory(1, 10);
            
            this.addTestResult(
                '归集历史查询', 
                history && Array.isArray(history.records), 
                `✅ 查询到 ${history.records.length} 条归集记录`
            );
            
            // 注意：不执行实际的资金归集操作，避免在测试环境中产生真实交易
            this.addTestResult(
                '资金归集功能', 
                true, 
                '✅ 资金归集服务可用（未执行实际交易）'
            );
            
        } catch (error) {
            this.addTestResult('资金归集服务', false, `❌ ${error.message}`);
        }
    }

    /**
     * 添加测试结果
     */
    addTestResult(testName, success, message) {
        this.testResults.push({
            name: testName,
            success,
            message
        });
        
        console.log(`   ${message}`);
    }

    /**
     * 打印测试结果汇总
     */
    printTestResults() {
        console.log('\n📊 测试结果汇总:');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        this.testResults.forEach((result, index) => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${result.name}: ${status}`);
        });
        
        console.log('=' .repeat(50));
        console.log(`总计: ${totalTests} | 通过: ${passedTests} | 失败: ${failedTests}`);
        console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests === 0) {
            console.log('\n🎉 所有测试通过！Tatum钱包集成成功！');
        } else {
            console.log('\n⚠️  部分测试失败，请检查配置和实现');
        }
    }

    /**
     * 清理测试数据
     */
    async cleanup() {
        try {
            // 删除测试用户的钱包记录
            const deleteQuery = 'DELETE FROM user_wallets WHERE user_id = ?';
            await pool.execute(deleteQuery, [this.testUserId]);
            
            console.log('\n🧹 测试数据清理完成');
            
        } catch (error) {
            console.log('⚠️  清理测试数据时出错:', error.message);
        }
    }
}

// 运行测试
async function main() {
    const test = new WalletIntegrationTest();
    await test.runAllTests();
    
    // 关闭数据库连接
    process.exit(0);
}

// 直接运行测试
if (require.main === module) {
    main().catch(console.error);
}

module.exports = WalletIntegrationTest;