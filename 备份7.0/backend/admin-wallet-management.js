/**
 * 钱包管理增强模块
 * 实现地址池监控、自动分配、余额预警、批量转账功能
 */
class WalletManagement {
    constructor() {
        this.currentView = 'overview';
        this.walletData = null;
        this.addressPool = [];
        this.alertThresholds = {
            lowBalance: 100,
            highUsage: 80,
            poolDepletion: 10
        };
        this.init();
    }

    /**
     * 初始化钱包管理系统
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadWalletData();
        this.startMonitoring();
    }

    /**
     * 渲染钱包管理页面
     */
    render() {
        const container = document.getElementById('content');
        container.innerHTML = `
            <div class="wallet-management">
                <div class="wallet-header">
                    <h1 class="wallet-title">钱包管理系统</h1>
                    <div class="wallet-controls">
                        <button class="btn btn-primary" onclick="walletManagement.showBatchTransfer()">
                            <i class="fas fa-exchange-alt"></i> 批量转账
                        </button>
                        <button class="btn btn-secondary" onclick="walletManagement.exportWalletData()">
                            <i class="fas fa-download"></i> 导出数据
                        </button>
                        <button class="btn btn-success" onclick="walletManagement.refreshData()">
                            <i class="fas fa-sync-alt"></i> 刷新
                        </button>
                    </div>
                </div>

                <div class="wallet-nav">
                    <button class="wallet-nav-btn ${this.currentView === 'overview' ? 'active' : ''}" 
                            onclick="walletManagement.switchView('overview')">
                        概览
                    </button>
                    <button class="wallet-nav-btn ${this.currentView === 'pool' ? 'active' : ''}" 
                            onclick="walletManagement.switchView('pool')">
                        地址池
                    </button>
                    <button class="wallet-nav-btn ${this.currentView === 'monitoring' ? 'active' : ''}" 
                            onclick="walletManagement.switchView('monitoring')">
                        监控预警
                    </button>
                    <button class="wallet-nav-btn ${this.currentView === 'transfer' ? 'active' : ''}" 
                            onclick="walletManagement.switchView('transfer')">
                        转账记录
                    </button>
                </div>

                <div id="wallet-content">
                    ${this.renderContent()}
                </div>
            </div>

            <!-- 批量转账模态框 -->
            <div id="batchTransferModal" class="wallet-modal">
                <div class="wallet-modal-content">
                    <div class="wallet-modal-header">
                        <h3 class="wallet-modal-title">批量转账</h3>
                        <button class="wallet-modal-close" onclick="walletManagement.closeBatchTransfer()">&times;</button>
                    </div>
                    <div class="wallet-modal-body">
                        <div class="wallet-form-group">
                            <label class="wallet-form-label">转账类型</label>
                            <select class="wallet-form-select" id="transferType">
                                <option value="single">单笔转账</option>
                                <option value="batch">批量转账</option>
                                <option value="distribute">平均分配</option>
                            </select>
                        </div>
                        <div class="wallet-form-group">
                            <label class="wallet-form-label">源钱包地址</label>
                            <select class="wallet-form-select" id="sourceWallet">
                                <option value="">选择源钱包</option>
                            </select>
                        </div>
                        <div class="wallet-form-group">
                            <label class="wallet-form-label">目标地址列表</label>
                            <textarea class="wallet-form-textarea" id="targetAddresses" 
                                    placeholder="每行一个地址，格式：地址,金额（如果是平均分配则只需要地址）"></textarea>
                        </div>
                        <div class="wallet-form-group">
                            <label class="wallet-form-label">总金额（USDT）</label>
                            <input type="number" class="wallet-form-input" id="totalAmount" 
                                   placeholder="输入总转账金额" step="0.01">
                        </div>
                        <div class="wallet-form-group">
                            <label class="wallet-form-label">Gas费用预估</label>
                            <div class="gas-estimate">
                                <span id="gasEstimate">计算中...</span>
                            </div>
                        </div>
                    </div>
                    <div class="wallet-modal-footer">
                        <button class="wallet-btn secondary" onclick="walletManagement.closeBatchTransfer()">取消</button>
                        <button class="wallet-btn primary" onclick="walletManagement.executeBatchTransfer()">执行转账</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染内容区域
     */
    renderContent() {
        switch (this.currentView) {
            case 'overview':
                return this.renderOverview();
            case 'pool':
                return this.renderAddressPool();
            case 'monitoring':
                return this.renderMonitoring();
            case 'transfer':
                return this.renderTransferHistory();
            default:
                return this.renderOverview();
        }
    }

    /**
     * 渲染概览页面
     */
    renderOverview() {
        return `
            <div class="wallet-stats-grid">
                <div class="wallet-stat-card">
                    <h3>总钱包数量</h3>
                    <div class="wallet-stat-value" id="totalWallets">-</div>
                    <div class="wallet-stat-change positive" id="walletsChange">+0</div>
                </div>
                <div class="wallet-stat-card">
                    <h3>总余额 (USDT)</h3>
                    <div class="wallet-stat-value" id="totalBalance">-</div>
                    <div class="wallet-stat-change positive" id="balanceChange">+0</div>
                </div>
                <div class="wallet-stat-card">
                    <h3>可用地址池</h3>
                    <div class="wallet-stat-value" id="availableAddresses">-</div>
                    <div class="wallet-stat-change negative" id="addressesChange">-0</div>
                </div>
                <div class="wallet-stat-card">
                    <h3>今日转账</h3>
                    <div class="wallet-stat-value" id="todayTransfers">-</div>
                    <div class="wallet-stat-change positive" id="transfersChange">+0</div>
                </div>
            </div>

            <div class="wallet-content">
                <div class="wallet-content-header">
                    <h3 class="wallet-content-title">钱包列表</h3>
                    <div class="wallet-search-filters">
                        <input type="text" class="wallet-search-box" placeholder="搜索钱包地址..." 
                               onkeyup="walletManagement.filterWallets(this.value)">
                        <select class="wallet-filter-select" onchange="walletManagement.filterByStatus(this.value)">
                            <option value="">全部状态</option>
                            <option value="active">活跃</option>
                            <option value="inactive">非活跃</option>
                            <option value="warning">余额预警</option>
                        </select>
                    </div>
                </div>
                <div class="wallet-content-body">
                    <table class="wallet-table">
                        <thead>
                            <tr>
                                <th>钱包地址</th>
                                <th>余额 (USDT)</th>
                                <th>状态</th>
                                <th>最后活动</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="walletTableBody">
                            <!-- 钱包数据将在这里动态加载 -->
                        </tbody>
                    </table>
                    <div class="wallet-pagination" id="walletPagination">
                        <!-- 分页控件 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染地址池管理页面
     */
    renderAddressPool() {
        return `
            <div class="address-pool-header">
                <div class="pool-stats">
                    <div class="pool-stat">
                        <span class="pool-stat-label">总地址数</span>
                        <span class="pool-stat-value" id="totalPoolAddresses">-</span>
                    </div>
                    <div class="pool-stat">
                        <span class="pool-stat-label">可用地址</span>
                        <span class="pool-stat-value" id="availablePoolAddresses">-</span>
                    </div>
                    <div class="pool-stat">
                        <span class="pool-stat-label">使用率</span>
                        <span class="pool-stat-value" id="poolUsageRate">-</span>
                    </div>
                </div>
                <div class="pool-controls">
                    <button class="btn btn-primary" onclick="walletManagement.generateAddresses()">
                        <i class="fas fa-plus"></i> 生成地址
                    </button>
                    <button class="btn btn-secondary" onclick="walletManagement.importAddresses()">
                        <i class="fas fa-upload"></i> 导入地址
                    </button>
                </div>
            </div>

            <div class="address-pool-content">
                <div class="pool-filters">
                    <input type="text" class="wallet-search-box" placeholder="搜索地址..." 
                           onkeyup="walletManagement.filterPoolAddresses(this.value)">
                    <select class="wallet-filter-select" onchange="walletManagement.filterPoolByStatus(this.value)">
                        <option value="">全部状态</option>
                        <option value="available">可用</option>
                        <option value="assigned">已分配</option>
                        <option value="used">已使用</option>
                    </select>
                </div>
                
                <table class="wallet-table">
                    <thead>
                        <tr>
                            <th>地址</th>
                            <th>状态</th>
                            <th>分配时间</th>
                            <th>使用次数</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="poolTableBody">
                        <!-- 地址池数据 -->
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * 渲染监控预警页面
     */
    renderMonitoring() {
        return `
            <div class="monitoring-header">
                <h3>监控预警设置</h3>
                <button class="btn btn-primary" onclick="walletManagement.saveAlertSettings()">
                    <i class="fas fa-save"></i> 保存设置
                </button>
            </div>

            <div class="monitoring-content">
                <div class="alert-settings">
                    <div class="alert-setting-group">
                        <label>余额预警阈值 (USDT)</label>
                        <input type="number" class="wallet-form-input" id="lowBalanceThreshold" 
                               value="${this.alertThresholds.lowBalance}" step="0.01">
                    </div>
                    <div class="alert-setting-group">
                        <label>地址池使用率预警 (%)</label>
                        <input type="number" class="wallet-form-input" id="highUsageThreshold" 
                               value="${this.alertThresholds.highUsage}" min="0" max="100">
                    </div>
                    <div class="alert-setting-group">
                        <label>地址池耗尽预警 (个)</label>
                        <input type="number" class="wallet-form-input" id="poolDepletionThreshold" 
                               value="${this.alertThresholds.poolDepletion}" min="1">
                    </div>
                </div>

                <div class="active-alerts">
                    <h4>当前预警</h4>
                    <div id="alertsList">
                        <!-- 预警列表 -->
                    </div>
                </div>

                <div class="monitoring-charts">
                    <div class="chart-container">
                        <h4>余额趋势</h4>
                        <canvas id="balanceTrendChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>地址池使用情况</h4>
                        <canvas id="poolUsageChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染转账记录页面
     */
    renderTransferHistory() {
        return `
            <div class="transfer-history-header">
                <div class="transfer-filters">
                    <input type="date" class="wallet-form-input" id="startDate">
                    <input type="date" class="wallet-form-input" id="endDate">
                    <select class="wallet-filter-select" id="transferStatus">
                        <option value="">全部状态</option>
                        <option value="pending">待处理</option>
                        <option value="success">成功</option>
                        <option value="failed">失败</option>
                    </select>
                    <button class="btn btn-primary" onclick="walletManagement.filterTransfers()">
                        <i class="fas fa-search"></i> 查询
                    </button>
                </div>
            </div>

            <div class="transfer-history-content">
                <table class="wallet-table">
                    <thead>
                        <tr>
                            <th>交易哈希</th>
                            <th>发送方</th>
                            <th>接收方</th>
                            <th>金额 (USDT)</th>
                            <th>状态</th>
                            <th>时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="transferTableBody">
                        <!-- 转账记录 -->
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 实时监控事件
        setInterval(() => {
            this.checkAlerts();
        }, 30000); // 每30秒检查一次预警

        // 页面刷新事件
        window.addEventListener('beforeunload', () => {
            this.saveCurrentState();
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        this.currentView = view;
        document.getElementById('wallet-content').innerHTML = this.renderContent();
        
        // 更新导航按钮状态
        document.querySelectorAll('.wallet-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="walletManagement.switchView('${view}')"]`).classList.add('active');

        // 加载对应数据
        this.loadViewData(view);
    }

    /**
     * 加载钱包数据
     */
    async loadWalletData() {
        try {
            const response = await fetch('/api/admin/wallet-management');
            const data = await response.json();
            
            if (data.success) {
                this.walletData = data.data;
                this.updateOverviewStats();
                this.updateWalletTable();
            }
        } catch (error) {
            console.error('加载钱包数据失败:', error);
            this.showError('加载钱包数据失败');
        }
    }

    /**
     * 更新概览统计
     */
    updateOverviewStats() {
        if (!this.walletData) return;

        const stats = this.walletData.overview;
        document.getElementById('totalWallets').textContent = stats.totalWallets;
        document.getElementById('totalBalance').textContent = stats.totalBalance.toFixed(2);
        document.getElementById('availableAddresses').textContent = stats.availableAddresses;
        document.getElementById('todayTransfers').textContent = stats.todayTransfers;

        // 更新变化指标
        document.getElementById('walletsChange').textContent = `+${stats.walletsChange}`;
        document.getElementById('balanceChange').textContent = `+${stats.balanceChange.toFixed(2)}`;
        document.getElementById('addressesChange').textContent = `-${stats.addressesChange}`;
        document.getElementById('transfersChange').textContent = `+${stats.transfersChange}`;
    }

    /**
     * 更新钱包表格
     */
    updateWalletTable() {
        if (!this.walletData) return;

        const tbody = document.getElementById('walletTableBody');
        tbody.innerHTML = this.walletData.wallets.map(wallet => `
            <tr>
                <td>
                    <div class="wallet-address">
                        ${wallet.address.substring(0, 10)}...${wallet.address.substring(wallet.address.length - 8)}
                        <button class="copy-btn" onclick="walletManagement.copyAddress('${wallet.address}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <span class="balance-amount ${wallet.balance < this.alertThresholds.lowBalance ? 'warning' : ''}">
                        ${wallet.balance.toFixed(2)}
                    </span>
                </td>
                <td>
                    <span class="wallet-status ${wallet.status}">
                        ${this.getStatusText(wallet.status)}
                    </span>
                </td>
                <td>${new Date(wallet.lastActivity).toLocaleString()}</td>
                <td>
                    <div class="wallet-actions">
                        <button class="wallet-action-btn view" onclick="walletManagement.viewWallet('${wallet.address}')">
                            查看
                        </button>
                        <button class="wallet-action-btn transfer" onclick="walletManagement.transferFrom('${wallet.address}')">
                            转账
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 显示批量转账模态框
     */
    showBatchTransfer() {
        const modal = document.getElementById('batchTransferModal');
        modal.classList.add('show');
        
        // 加载源钱包选项
        this.loadSourceWallets();
    }

    /**
     * 关闭批量转账模态框
     */
    closeBatchTransfer() {
        const modal = document.getElementById('batchTransferModal');
        modal.classList.remove('show');
    }

    /**
     * 执行批量转账
     */
    async executeBatchTransfer() {
        const transferType = document.getElementById('transferType').value;
        const sourceWallet = document.getElementById('sourceWallet').value;
        const targetAddresses = document.getElementById('targetAddresses').value;
        const totalAmount = parseFloat(document.getElementById('totalAmount').value);

        if (!sourceWallet || !targetAddresses || !totalAmount) {
            this.showError('请填写完整的转账信息');
            return;
        }

        try {
            const response = await fetch('/api/admin/batch-transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: transferType,
                    sourceWallet,
                    targetAddresses: targetAddresses.split('\n').filter(addr => addr.trim()),
                    totalAmount
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('批量转账已提交，正在处理中...');
                this.closeBatchTransfer();
                this.loadWalletData();
            } else {
                this.showError(result.message || '批量转账失败');
            }
        } catch (error) {
            console.error('批量转账失败:', error);
            this.showError('批量转账失败');
        }
    }

    /**
     * 检查预警
     */
    checkAlerts() {
        if (!this.walletData) return;

        const alerts = [];
        
        // 检查余额预警
        this.walletData.wallets.forEach(wallet => {
            if (wallet.balance < this.alertThresholds.lowBalance) {
                alerts.push({
                    type: 'low_balance',
                    message: `钱包 ${wallet.address} 余额不足 ${this.alertThresholds.lowBalance} USDT`,
                    severity: 'warning'
                });
            }
        });

        // 检查地址池使用率
        const usageRate = (this.walletData.overview.usedAddresses / this.walletData.overview.totalAddresses) * 100;
        if (usageRate > this.alertThresholds.highUsage) {
            alerts.push({
                type: 'high_usage',
                message: `地址池使用率已达 ${usageRate.toFixed(1)}%`,
                severity: 'warning'
            });
        }

        // 检查地址池耗尽
        if (this.walletData.overview.availableAddresses < this.alertThresholds.poolDepletion) {
            alerts.push({
                type: 'pool_depletion',
                message: `可用地址仅剩 ${this.walletData.overview.availableAddresses} 个`,
                severity: 'critical'
            });
        }

        this.displayAlerts(alerts);
    }

    /**
     * 显示预警信息
     */
    displayAlerts(alerts) {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;

        alertsList.innerHTML = alerts.length > 0 ? alerts.map(alert => `
            <div class="alert alert-${alert.severity}">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${alert.message}</span>
                <button class="alert-close" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('') : '<div class="no-alerts">暂无预警信息</div>';
    }

    /**
     * 开始监控
     */
    startMonitoring() {
        // 每分钟刷新一次数据
        setInterval(() => {
            this.loadWalletData();
        }, 60000);
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'active': '活跃',
            'inactive': '非活跃',
            'warning': '预警'
        };
        return statusMap[status] || status;
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        // 实现成功消息显示
        console.log('Success:', message);
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        // 实现错误消息显示
        console.error('Error:', message);
    }

    /**
     * 加载视图数据
     */
    loadViewData(view) {
        switch (view) {
            case 'pool':
                this.loadAddressPoolData();
                break;
            case 'monitoring':
                this.loadMonitoringData();
                break;
            case 'transfer':
                this.loadTransferHistory();
                break;
        }
    }

    /**
     * 加载地址池数据
     */
    async loadAddressPoolData() {
        // 实现地址池数据加载
    }

    /**
     * 加载监控数据
     */
    async loadMonitoringData() {
        // 实现监控数据加载
    }

    /**
     * 加载转账历史
     */
    async loadTransferHistory() {
        // 实现转账历史加载
    }

    /**
     * 刷新数据
     */
    refreshData() {
        this.loadWalletData();
        this.loadViewData(this.currentView);
    }

    /**
     * 导出钱包数据
     */
    async exportWalletData() {
        try {
            const response = await fetch('/api/admin/export-wallet-data', {
                method: 'POST'
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wallet-data-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('钱包数据导出成功');
        } catch (error) {
            console.error('导出失败:', error);
            this.showError('导出钱包数据失败');
        }
    }
}

// 全局实例
let walletManagement;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (typeof WalletManagement !== 'undefined') {
        walletManagement = new WalletManagement();
    }
});