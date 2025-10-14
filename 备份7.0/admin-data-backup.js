/**
 * 数据备份系统
 * 提供自动备份、恢复机制、版本管理功能
 */
class DataBackupSystem {
    constructor() {
        this.currentView = 'overview';
        this.backupData = [];
        this.scheduleData = [];
        this.autoRefreshInterval = null;
    }

    /**
     * 初始化数据备份系统
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadData();
        this.startAutoRefresh();
    }

    /**
     * 渲染主界面
     */
    render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="data-backup-container">
                <div class="data-backup-header">
                    <h2 class="data-backup-title">数据备份系统</h2>
                    <div class="data-backup-actions">
                        <button class="data-backup-btn data-backup-btn-primary" id="createBackupBtn">
                            <i class="fas fa-plus"></i> 创建备份
                        </button>
                        <button class="data-backup-btn data-backup-btn-secondary" id="refreshBtn">
                            <i class="fas fa-sync-alt"></i> 刷新
                        </button>
                    </div>
                </div>

                <div class="data-backup-nav">
                    <button class="data-backup-nav-btn active" data-view="overview">概览</button>
                    <button class="data-backup-nav-btn" data-view="backups">备份列表</button>
                    <button class="data-backup-nav-btn" data-view="schedule">定时任务</button>
                    <button class="data-backup-nav-btn" data-view="restore">恢复管理</button>
                    <button class="data-backup-nav-btn" data-view="settings">系统设置</button>
                </div>

                <div id="data-backup-content" class="data-backup-content">
                    <!-- 内容将通过JavaScript动态加载 -->
                </div>
            </div>

            <!-- 创建备份模态框 -->
            <div id="createBackupModal" class="data-backup-modal">
                <div class="data-backup-modal-content">
                    <div class="data-backup-modal-header">
                        <h3 class="data-backup-modal-title">创建备份</h3>
                        <button class="data-backup-modal-close">&times;</button>
                    </div>
                    <div class="data-backup-modal-body">
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">备份名称</label>
                            <input type="text" class="data-backup-form-control" id="backupName" placeholder="请输入备份名称">
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">备份类型</label>
                            <select class="data-backup-form-control" id="backupType">
                                <option value="full">完整备份</option>
                                <option value="incremental">增量备份</option>
                                <option value="differential">差异备份</option>
                            </select>
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">备份范围</label>
                            <div class="data-backup-checkbox-group">
                                <label><input type="checkbox" value="database" checked> 数据库</label>
                                <label><input type="checkbox" value="files" checked> 文件系统</label>
                                <label><input type="checkbox" value="config" checked> 配置文件</label>
                                <label><input type="checkbox" value="logs"> 日志文件</label>
                            </div>
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">备份描述</label>
                            <textarea class="data-backup-form-control" id="backupDescription" rows="3" placeholder="请输入备份描述"></textarea>
                        </div>
                    </div>
                    <div class="data-backup-modal-footer">
                        <button class="data-backup-btn data-backup-btn-secondary" id="cancelBackupBtn">取消</button>
                        <button class="data-backup-btn data-backup-btn-primary" id="confirmBackupBtn">创建备份</button>
                    </div>
                </div>
            </div>

            <!-- 恢复备份模态框 -->
            <div id="restoreBackupModal" class="data-backup-modal">
                <div class="data-backup-modal-content">
                    <div class="data-backup-modal-header">
                        <h3 class="data-backup-modal-title">恢复备份</h3>
                        <button class="data-backup-modal-close">&times;</button>
                    </div>
                    <div class="data-backup-modal-body">
                        <div class="data-backup-alert data-backup-alert-warning">
                            <strong>警告：</strong>恢复操作将覆盖当前数据，请确保已做好相关准备。
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">恢复选项</label>
                            <div class="data-backup-checkbox-group">
                                <label><input type="checkbox" value="database" checked> 恢复数据库</label>
                                <label><input type="checkbox" value="files" checked> 恢复文件系统</label>
                                <label><input type="checkbox" value="config"> 恢复配置文件</label>
                            </div>
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">确认密码</label>
                            <input type="password" class="data-backup-form-control" id="restorePassword" placeholder="请输入管理员密码">
                        </div>
                    </div>
                    <div class="data-backup-modal-footer">
                        <button class="data-backup-btn data-backup-btn-secondary" id="cancelRestoreBtn">取消</button>
                        <button class="data-backup-btn data-backup-btn-danger" id="confirmRestoreBtn">确认恢复</button>
                    </div>
                </div>
            </div>

            <!-- 定时任务模态框 -->
            <div id="scheduleModal" class="data-backup-modal">
                <div class="data-backup-modal-content">
                    <div class="data-backup-modal-header">
                        <h3 class="data-backup-modal-title">定时备份设置</h3>
                        <button class="data-backup-modal-close">&times;</button>
                    </div>
                    <div class="data-backup-modal-body">
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">任务名称</label>
                            <input type="text" class="data-backup-form-control" id="scheduleName" placeholder="请输入任务名称">
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">执行频率</label>
                            <select class="data-backup-form-control" id="scheduleFrequency">
                                <option value="daily">每日</option>
                                <option value="weekly">每周</option>
                                <option value="monthly">每月</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">执行时间</label>
                            <input type="time" class="data-backup-form-control" id="scheduleTime" value="02:00">
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">保留天数</label>
                            <input type="number" class="data-backup-form-control" id="retentionDays" value="30" min="1" max="365">
                        </div>
                        <div class="data-backup-form-group">
                            <label class="data-backup-form-label">备份类型</label>
                            <select class="data-backup-form-control" id="scheduleBackupType">
                                <option value="full">完整备份</option>
                                <option value="incremental">增量备份</option>
                            </select>
                        </div>
                    </div>
                    <div class="data-backup-modal-footer">
                        <button class="data-backup-btn data-backup-btn-secondary" id="cancelScheduleBtn">取消</button>
                        <button class="data-backup-btn data-backup-btn-primary" id="confirmScheduleBtn">保存设置</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 导航按钮事件
        document.querySelectorAll('.data-backup-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // 创建备份按钮
        document.getElementById('createBackupBtn').addEventListener('click', () => {
            this.showCreateBackupModal();
        });

        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        // 模态框关闭事件
        document.querySelectorAll('.data-backup-modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.data-backup-modal').style.display = 'none';
            });
        });

        // 创建备份模态框事件
        document.getElementById('cancelBackupBtn').addEventListener('click', () => {
            document.getElementById('createBackupModal').style.display = 'none';
        });

        document.getElementById('confirmBackupBtn').addEventListener('click', () => {
            this.createBackup();
        });

        // 恢复备份模态框事件
        document.getElementById('cancelRestoreBtn').addEventListener('click', () => {
            document.getElementById('restoreBackupModal').style.display = 'none';
        });

        document.getElementById('confirmRestoreBtn').addEventListener('click', () => {
            this.restoreBackup();
        });

        // 定时任务模态框事件
        document.getElementById('cancelScheduleBtn').addEventListener('click', () => {
            document.getElementById('scheduleModal').style.display = 'none';
        });

        document.getElementById('confirmScheduleBtn').addEventListener('click', () => {
            this.saveSchedule();
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        this.currentView = view;
        
        // 更新导航按钮状态
        document.querySelectorAll('.data-backup-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 渲染对应视图
        switch(view) {
            case 'overview':
                this.renderOverview();
                break;
            case 'backups':
                this.renderBackupsList();
                break;
            case 'schedule':
                this.renderSchedule();
                break;
            case 'restore':
                this.renderRestore();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    /**
     * 渲染概览视图
     */
    renderOverview() {
        const content = document.getElementById('data-backup-content');
        content.innerHTML = `
            <div class="data-backup-stats">
                <div class="data-backup-stat-card">
                    <div class="data-backup-stat-title">总备份数</div>
                    <div class="data-backup-stat-value">156</div>
                    <div class="data-backup-stat-change success">+12 本月</div>
                </div>
                <div class="data-backup-stat-card">
                    <div class="data-backup-stat-title">存储使用</div>
                    <div class="data-backup-stat-value">2.3TB</div>
                    <div class="data-backup-stat-change warning">+15% 本月</div>
                </div>
                <div class="data-backup-stat-card">
                    <div class="data-backup-stat-title">成功率</div>
                    <div class="data-backup-stat-value">98.5%</div>
                    <div class="data-backup-stat-change success">+0.2% 本月</div>
                </div>
                <div class="data-backup-stat-card">
                    <div class="data-backup-stat-title">最近备份</div>
                    <div class="data-backup-stat-value">2小时前</div>
                    <div class="data-backup-stat-change info">自动备份</div>
                </div>
            </div>

            <div class="data-backup-overview-grid">
                <div class="data-backup-overview-card">
                    <h3>备份趋势</h3>
                    <div class="data-backup-chart-container" id="backupTrendChart">
                        <!-- 图表将在这里渲染 -->
                    </div>
                </div>
                <div class="data-backup-overview-card">
                    <h3>最近备份</h3>
                    <div class="data-backup-recent-list">
                        <div class="data-backup-recent-item">
                            <div class="data-backup-recent-info">
                                <div class="data-backup-recent-name">数据库完整备份</div>
                                <div class="data-backup-recent-time">2024-01-15 14:30:00</div>
                            </div>
                            <div class="data-backup-status success">成功</div>
                        </div>
                        <div class="data-backup-recent-item">
                            <div class="data-backup-recent-info">
                                <div class="data-backup-recent-name">文件系统增量备份</div>
                                <div class="data-backup-recent-time">2024-01-15 12:00:00</div>
                            </div>
                            <div class="data-backup-status success">成功</div>
                        </div>
                        <div class="data-backup-recent-item">
                            <div class="data-backup-recent-info">
                                <div class="data-backup-recent-name">配置文件备份</div>
                                <div class="data-backup-recent-time">2024-01-15 10:15:00</div>
                            </div>
                            <div class="data-backup-status warning">警告</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="data-backup-alerts">
                <h3>系统提醒</h3>
                <div class="data-backup-alert data-backup-alert-info">
                    <strong>信息：</strong>下次自动备份将在今晚 2:00 AM 执行。
                </div>
                <div class="data-backup-alert data-backup-alert-warning">
                    <strong>警告：</strong>备份存储空间使用率已达到 85%，建议清理旧备份。
                </div>
            </div>
        `;

        this.renderBackupTrendChart();
    }

    /**
     * 渲染备份列表视图
     */
    renderBackupsList() {
        const content = document.getElementById('data-backup-content');
        content.innerHTML = `
            <div class="data-backup-controls">
                <div class="data-backup-control-group">
                    <select class="data-backup-select" id="backupTypeFilter">
                        <option value="">所有类型</option>
                        <option value="full">完整备份</option>
                        <option value="incremental">增量备份</option>
                        <option value="differential">差异备份</option>
                    </select>
                    <select class="data-backup-select" id="backupStatusFilter">
                        <option value="">所有状态</option>
                        <option value="success">成功</option>
                        <option value="failed">失败</option>
                        <option value="running">进行中</option>
                    </select>
                    <input type="date" class="data-backup-select" id="backupDateFilter">
                </div>
                <div class="data-backup-control-group">
                    <button class="data-backup-btn data-backup-btn-secondary" id="exportBackupsBtn">
                        <i class="fas fa-download"></i> 导出列表
                    </button>
                </div>
            </div>

            <div class="data-backup-table-container">
                <table class="data-backup-table">
                    <thead>
                        <tr>
                            <th>备份名称</th>
                            <th>类型</th>
                            <th>大小</th>
                            <th>创建时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="backupsTableBody">
                        <!-- 数据将通过JavaScript动态加载 -->
                    </tbody>
                </table>
            </div>

            <div class="data-backup-pagination">
                <button class="data-backup-pagination-btn" id="prevPageBtn" disabled>上一页</button>
                <span class="data-backup-pagination-info">第 1 页，共 10 页</span>
                <button class="data-backup-pagination-btn" id="nextPageBtn">下一页</button>
            </div>
        `;

        this.loadBackupsList();
    }

    /**
     * 渲染定时任务视图
     */
    renderSchedule() {
        const content = document.getElementById('data-backup-content');
        content.innerHTML = `
            <div class="data-backup-controls">
                <div class="data-backup-control-group">
                    <button class="data-backup-btn data-backup-btn-primary" id="addScheduleBtn">
                        <i class="fas fa-plus"></i> 添加定时任务
                    </button>
                </div>
            </div>

            <div class="data-backup-schedule-grid">
                <div class="data-backup-schedule-card">
                    <div class="data-backup-schedule-header">
                        <h4>每日数据库备份</h4>
                        <div class="data-backup-schedule-status active">启用</div>
                    </div>
                    <div class="data-backup-schedule-info">
                        <p><strong>执行时间：</strong>每日 02:00</p>
                        <p><strong>备份类型：</strong>完整备份</p>
                        <p><strong>保留天数：</strong>30天</p>
                        <p><strong>下次执行：</strong>2024-01-16 02:00:00</p>
                    </div>
                    <div class="data-backup-schedule-actions">
                        <button class="data-backup-btn data-backup-btn-sm data-backup-btn-secondary">编辑</button>
                        <button class="data-backup-btn data-backup-btn-sm data-backup-btn-warning">禁用</button>
                        <button class="data-backup-btn data-backup-btn-sm data-backup-btn-danger">删除</button>
                    </div>
                </div>

                <div class="data-backup-schedule-card">
                    <div class="data-backup-schedule-header">
                        <h4>每周文件系统备份</h4>
                        <div class="data-backup-schedule-status active">启用</div>
                    </div>
                    <div class="data-backup-schedule-info">
                        <p><strong>执行时间：</strong>每周日 03:00</p>
                        <p><strong>备份类型：</strong>增量备份</p>
                        <p><strong>保留天数：</strong>60天</p>
                        <p><strong>下次执行：</strong>2024-01-21 03:00:00</p>
                    </div>
                    <div class="data-backup-schedule-actions">
                        <button class="data-backup-btn data-backup-btn-sm data-backup-btn-secondary">编辑</button>
                        <button class="data-backup-btn data-backup-btn-sm data-backup-btn-warning">禁用</button>
                        <button class="data-backup-btn data-backup-btn-sm data-backup-btn-danger">删除</button>
                    </div>
                </div>
            </div>
        `;

        // 绑定添加定时任务按钮事件
        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            this.showScheduleModal();
        });
    }

    /**
     * 渲染恢复管理视图
     */
    renderRestore() {
        const content = document.getElementById('data-backup-content');
        content.innerHTML = `
            <div class="data-backup-restore-section">
                <h3>恢复向导</h3>
                <div class="data-backup-restore-steps">
                    <div class="data-backup-restore-step active">
                        <div class="data-backup-restore-step-number">1</div>
                        <div class="data-backup-restore-step-title">选择备份</div>
                    </div>
                    <div class="data-backup-restore-step">
                        <div class="data-backup-restore-step-number">2</div>
                        <div class="data-backup-restore-step-title">配置选项</div>
                    </div>
                    <div class="data-backup-restore-step">
                        <div class="data-backup-restore-step-number">3</div>
                        <div class="data-backup-restore-step-title">执行恢复</div>
                    </div>
                </div>
            </div>

            <div class="data-backup-restore-content">
                <div class="data-backup-restore-backups">
                    <h4>可用备份</h4>
                    <div class="data-backup-restore-list">
                        <div class="data-backup-restore-item">
                            <input type="radio" name="restoreBackup" value="backup1" id="backup1">
                            <label for="backup1" class="data-backup-restore-label">
                                <div class="data-backup-restore-info">
                                    <div class="data-backup-restore-name">数据库完整备份 - 2024-01-15</div>
                                    <div class="data-backup-restore-details">大小: 1.2GB | 创建时间: 2024-01-15 14:30:00</div>
                                </div>
                                <div class="data-backup-restore-status success">完整</div>
                            </label>
                        </div>
                        <div class="data-backup-restore-item">
                            <input type="radio" name="restoreBackup" value="backup2" id="backup2">
                            <label for="backup2" class="data-backup-restore-label">
                                <div class="data-backup-restore-info">
                                    <div class="data-backup-restore-name">系统完整备份 - 2024-01-14</div>
                                    <div class="data-backup-restore-details">大小: 3.5GB | 创建时间: 2024-01-14 02:00:00</div>
                                </div>
                                <div class="data-backup-restore-status success">完整</div>
                            </label>
                        </div>
                        <div class="data-backup-restore-item">
                            <input type="radio" name="restoreBackup" value="backup3" id="backup3">
                            <label for="backup3" class="data-backup-restore-label">
                                <div class="data-backup-restore-info">
                                    <div class="data-backup-restore-name">增量备份 - 2024-01-13</div>
                                    <div class="data-backup-restore-details">大小: 256MB | 创建时间: 2024-01-13 12:00:00</div>
                                </div>
                                <div class="data-backup-restore-status warning">增量</div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="data-backup-restore-actions">
                    <button class="data-backup-btn data-backup-btn-primary" id="startRestoreBtn">开始恢复</button>
                    <button class="data-backup-btn data-backup-btn-secondary" id="previewRestoreBtn">预览恢复</button>
                </div>
            </div>
        `;

        // 绑定恢复按钮事件
        document.getElementById('startRestoreBtn').addEventListener('click', () => {
            this.showRestoreModal();
        });
    }

    /**
     * 渲染系统设置视图
     */
    renderSettings() {
        const content = document.getElementById('data-backup-content');
        content.innerHTML = `
            <div class="data-backup-settings-section">
                <h3>存储设置</h3>
                <div class="data-backup-settings-card">
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">备份存储路径</label>
                        <input type="text" class="data-backup-form-control" value="/var/backups" readonly>
                        <small class="data-backup-form-text">系统默认备份存储路径</small>
                    </div>
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">最大存储空间 (GB)</label>
                        <input type="number" class="data-backup-form-control" value="1000" min="100">
                    </div>
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">自动清理阈值 (%)</label>
                        <input type="number" class="data-backup-form-control" value="90" min="50" max="95">
                    </div>
                </div>
            </div>

            <div class="data-backup-settings-section">
                <h3>备份策略</h3>
                <div class="data-backup-settings-card">
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">默认保留天数</label>
                        <input type="number" class="data-backup-form-control" value="30" min="1" max="365">
                    </div>
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">压缩级别</label>
                        <select class="data-backup-form-control">
                            <option value="0">无压缩</option>
                            <option value="1">快速压缩</option>
                            <option value="6" selected>标准压缩</option>
                            <option value="9">最大压缩</option>
                        </select>
                    </div>
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">加密设置</label>
                        <div class="data-backup-checkbox-group">
                            <label><input type="checkbox" checked> 启用备份加密</label>
                            <label><input type="checkbox"> 启用传输加密</label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="data-backup-settings-section">
                <h3>通知设置</h3>
                <div class="data-backup-settings-card">
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">通知方式</label>
                        <div class="data-backup-checkbox-group">
                            <label><input type="checkbox" checked> 邮件通知</label>
                            <label><input type="checkbox"> 短信通知</label>
                            <label><input type="checkbox" checked> 系统通知</label>
                        </div>
                    </div>
                    <div class="data-backup-form-group">
                        <label class="data-backup-form-label">通知邮箱</label>
                        <input type="email" class="data-backup-form-control" value="admin@example.com">
                    </div>
                </div>
            </div>

            <div class="data-backup-settings-actions">
                <button class="data-backup-btn data-backup-btn-primary">保存设置</button>
                <button class="data-backup-btn data-backup-btn-secondary">重置默认</button>
            </div>
        `;
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            // 加载备份数据
            const backupResponse = await fetch('/api/admin/data-backup/overview');
            if (backupResponse.ok) {
                this.backupData = await backupResponse.json();
            }

            // 加载定时任务数据
            const scheduleResponse = await fetch('/api/admin/data-backup/schedule');
            if (scheduleResponse.ok) {
                this.scheduleData = await scheduleResponse.json();
            }

            // 刷新当前视图
            this.switchView(this.currentView);
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    /**
     * 加载备份列表
     */
    async loadBackupsList() {
        try {
            const response = await fetch('/api/admin/data-backup/backups');
            if (response.ok) {
                const data = await response.json();
                this.renderBackupsTable(data.backups);
            }
        } catch (error) {
            console.error('加载备份列表失败:', error);
        }
    }

    /**
     * 渲染备份表格
     */
    renderBackupsTable(backups) {
        const tbody = document.getElementById('backupsTableBody');
        tbody.innerHTML = backups.map(backup => `
            <tr>
                <td>${backup.name}</td>
                <td>
                    <span class="data-backup-type-badge ${backup.type}">${this.getBackupTypeText(backup.type)}</span>
                </td>
                <td>${backup.size}</td>
                <td>${backup.createdAt}</td>
                <td>
                    <span class="data-backup-status ${backup.status}">${this.getStatusText(backup.status)}</span>
                </td>
                <td>
                    <button class="data-backup-btn data-backup-btn-sm data-backup-btn-primary" onclick="dataBackupSystem.restoreBackup('${backup.id}')">恢复</button>
                    <button class="data-backup-btn data-backup-btn-sm data-backup-btn-secondary" onclick="dataBackupSystem.downloadBackup('${backup.id}')">下载</button>
                    <button class="data-backup-btn data-backup-btn-sm data-backup-btn-danger" onclick="dataBackupSystem.deleteBackup('${backup.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染备份趋势图表
     */
    renderBackupTrendChart() {
        // 这里可以集成图表库如Chart.js
        const chartContainer = document.getElementById('backupTrendChart');
        chartContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">备份趋势图表</div>';
    }

    /**
     * 显示创建备份模态框
     */
    showCreateBackupModal() {
        document.getElementById('createBackupModal').style.display = 'block';
    }

    /**
     * 显示恢复备份模态框
     */
    showRestoreModal() {
        document.getElementById('restoreBackupModal').style.display = 'block';
    }

    /**
     * 显示定时任务模态框
     */
    showScheduleModal() {
        document.getElementById('scheduleModal').style.display = 'block';
    }

    /**
     * 创建备份
     */
    async createBackup() {
        const name = document.getElementById('backupName').value;
        const type = document.getElementById('backupType').value;
        const description = document.getElementById('backupDescription').value;
        
        const scope = [];
        document.querySelectorAll('.data-backup-checkbox-group input:checked').forEach(checkbox => {
            scope.push(checkbox.value);
        });

        try {
            const response = await fetch('/api/admin/data-backup/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    type,
                    scope,
                    description
                })
            });

            if (response.ok) {
                alert('备份任务已创建');
                document.getElementById('createBackupModal').style.display = 'none';
                this.loadData();
            } else {
                alert('创建备份失败');
            }
        } catch (error) {
            console.error('创建备份失败:', error);
            alert('创建备份失败');
        }
    }

    /**
     * 恢复备份
     */
    async restoreBackup(backupId) {
        const password = document.getElementById('restorePassword').value;
        
        if (!password) {
            alert('请输入管理员密码');
            return;
        }

        try {
            const response = await fetch('/api/admin/data-backup/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    backupId,
                    password
                })
            });

            if (response.ok) {
                alert('恢复任务已启动');
                document.getElementById('restoreBackupModal').style.display = 'none';
            } else {
                alert('恢复失败');
            }
        } catch (error) {
            console.error('恢复失败:', error);
            alert('恢复失败');
        }
    }

    /**
     * 保存定时任务
     */
    async saveSchedule() {
        const name = document.getElementById('scheduleName').value;
        const frequency = document.getElementById('scheduleFrequency').value;
        const time = document.getElementById('scheduleTime').value;
        const retentionDays = document.getElementById('retentionDays').value;
        const backupType = document.getElementById('scheduleBackupType').value;

        try {
            const response = await fetch('/api/admin/data-backup/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    frequency,
                    time,
                    retentionDays,
                    backupType
                })
            });

            if (response.ok) {
                alert('定时任务已保存');
                document.getElementById('scheduleModal').style.display = 'none';
                this.loadData();
            } else {
                alert('保存失败');
            }
        } catch (error) {
            console.error('保存定时任务失败:', error);
            alert('保存失败');
        }
    }

    /**
     * 下载备份
     */
    async downloadBackup(backupId) {
        try {
            const response = await fetch(`/api/admin/data-backup/download/${backupId}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_${backupId}.zip`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('下载备份失败:', error);
            alert('下载失败');
        }
    }

    /**
     * 删除备份
     */
    async deleteBackup(backupId) {
        if (!confirm('确定要删除这个备份吗？此操作不可恢复。')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/data-backup/delete/${backupId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('备份已删除');
                this.loadData();
            } else {
                alert('删除失败');
            }
        } catch (error) {
            console.error('删除备份失败:', error);
            alert('删除失败');
        }
    }

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
        this.autoRefreshInterval = setInterval(() => {
            if (this.currentView === 'overview') {
                this.loadData();
            }
        }, 30000); // 30秒刷新一次
    }

    /**
     * 停止自动刷新
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    /**
     * 导出报告
     */
    async exportReport(type) {
        try {
            const response = await fetch(`/api/admin/data-backup/export?type=${type}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_report_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出报告失败:', error);
            alert('导出失败');
        }
    }

    /**
     * 获取备份类型文本
     */
    getBackupTypeText(type) {
        const types = {
            'full': '完整备份',
            'incremental': '增量备份',
            'differential': '差异备份'
        };
        return types[type] || type;
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statuses = {
            'success': '成功',
            'failed': '失败',
            'running': '进行中',
            'pending': '等待中'
        };
        return statuses[status] || status;
    }

    /**
     * 销毁实例
     */
    destroy() {
        this.stopAutoRefresh();
    }
}

// 全局实例
window.DataBackupSystem = DataBackupSystem;