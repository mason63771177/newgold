/**
 * 高级表单组件管理系统
 * 提供动态表单生成、数据验证、文件上传、批量编辑功能
 */
class FormComponents {
    constructor() {
        this.forms = new Map();
        this.validators = new Map();
        this.uploadHandlers = new Map();
        this.currentForm = null;
        this.init();
    }

    /**
     * 初始化表单组件系统
     */
    init() {
        this.setupDefaultValidators();
        this.setupEventListeners();
        this.render();
    }

    /**
     * 渲染主界面
     */
    render() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="form-components">
                <div class="form-header">
                    <h2>高级表单组件</h2>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="formComponents.showFormBuilder()">
                            <i class="fas fa-plus"></i> 创建表单
                        </button>
                        <button class="btn btn-secondary" onclick="formComponents.showTemplates()">
                            <i class="fas fa-file-alt"></i> 表单模板
                        </button>
                        <button class="btn btn-info" onclick="formComponents.showBatchEditor()">
                            <i class="fas fa-edit"></i> 批量编辑
                        </button>
                    </div>
                </div>

                <div class="form-nav">
                    <button class="form-nav-item active" data-view="overview">概览</button>
                    <button class="form-nav-item" data-view="forms">表单管理</button>
                    <button class="form-nav-item" data-view="builder">表单构建器</button>
                    <button class="form-nav-item" data-view="validation">验证规则</button>
                    <button class="form-nav-item" data-view="uploads">文件上传</button>
                </div>

                <div class="form-content">
                    <div id="overviewView" class="form-view active">
                        ${this.renderOverview()}
                    </div>
                    <div id="formsView" class="form-view">
                        ${this.renderFormsView()}
                    </div>
                    <div id="builderView" class="form-view">
                        ${this.renderBuilderView()}
                    </div>
                    <div id="validationView" class="form-view">
                        ${this.renderValidationView()}
                    </div>
                    <div id="uploadsView" class="form-view">
                        ${this.renderUploadsView()}
                    </div>
                </div>
            </div>

            <!-- 表单构建器模态框 -->
            <div id="formBuilderModal" class="form-modal">
                <div class="form-modal-content">
                    <div class="form-modal-header">
                        <h3>表单构建器</h3>
                        <button class="form-modal-close" onclick="formComponents.closeModal('formBuilderModal')">&times;</button>
                    </div>
                    <div class="form-modal-body">
                        ${this.renderFormBuilder()}
                    </div>
                </div>
            </div>

            <!-- 批量编辑模态框 -->
            <div id="batchEditorModal" class="form-modal">
                <div class="form-modal-content">
                    <div class="form-modal-header">
                        <h3>批量编辑</h3>
                        <button class="form-modal-close" onclick="formComponents.closeBatchEditor()">&times;</button>
                    </div>
                    <div class="form-modal-body">
                        ${this.renderBatchEditor()}
                    </div>
                </div>
            </div>

            <!-- 文件上传模态框 -->
            <div id="fileUploadModal" class="form-modal">
                <div class="form-modal-content">
                    <div class="form-modal-header">
                        <h3>文件上传</h3>
                        <button class="form-modal-close" onclick="formComponents.closeModal('fileUploadModal')">&times;</button>
                    </div>
                    <div class="form-modal-body">
                        ${this.renderFileUpload()}
                    </div>
                </div>
            </div>
        `;

        // 绑定事件
        this.bindEvents();
    }

    /**
     * 渲染概览视图
     */
    renderOverview() {
        const stats = this.getFormStats();
        return `
            <div class="form-stats">
                <div class="form-stat-card">
                    <div class="form-stat-number">${stats.totalForms}</div>
                    <div class="form-stat-label">总表单数</div>
                </div>
                <div class="form-stat-card">
                    <div class="form-stat-number">${stats.activeForms}</div>
                    <div class="form-stat-label">活跃表单</div>
                </div>
                <div class="form-stat-card">
                    <div class="form-stat-number">${stats.totalSubmissions}</div>
                    <div class="form-stat-label">总提交数</div>
                </div>
                <div class="form-stat-card">
                    <div class="form-stat-number">${stats.validationRules}</div>
                    <div class="form-stat-label">验证规则</div>
                </div>
            </div>

            <div class="form-recent">
                <h3>最近创建的表单</h3>
                <div class="form-recent-list">
                    ${this.renderRecentForms()}
                </div>
            </div>

            <div class="form-quick-actions">
                <h3>快速操作</h3>
                <div class="quick-action-grid">
                    <div class="quick-action-item" onclick="formComponents.createQuickForm('contact')">
                        <i class="fas fa-envelope"></i>
                        <span>联系表单</span>
                    </div>
                    <div class="quick-action-item" onclick="formComponents.createQuickForm('survey')">
                        <i class="fas fa-poll"></i>
                        <span>调查问卷</span>
                    </div>
                    <div class="quick-action-item" onclick="formComponents.createQuickForm('registration')">
                        <i class="fas fa-user-plus"></i>
                        <span>注册表单</span>
                    </div>
                    <div class="quick-action-item" onclick="formComponents.createQuickForm('feedback')">
                        <i class="fas fa-comment"></i>
                        <span>反馈表单</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染表单管理视图
     */
    renderFormsView() {
        return `
            <div class="form-controls">
                <div class="form-search">
                    <input type="text" id="formSearch" placeholder="搜索表单..." />
                    <select id="formStatusFilter">
                        <option value="">所有状态</option>
                        <option value="active">活跃</option>
                        <option value="inactive">非活跃</option>
                        <option value="draft">草稿</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="formComponents.showFormBuilder()">新建表单</button>
                    <button class="btn btn-secondary" onclick="formComponents.exportForms()">导出表单</button>
                </div>
            </div>

            <div class="form-table">
                <table>
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="selectAllForms" /></th>
                            <th>表单名称</th>
                            <th>类型</th>
                            <th>状态</th>
                            <th>提交数</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="formsTableBody">
                        ${this.renderFormsTable()}
                    </tbody>
                </table>
            </div>

            <div class="form-pagination">
                <button onclick="formComponents.previousPage()" id="prevPageBtn">上一页</button>
                <span id="pageInfo">第 1 页，共 1 页</span>
                <button onclick="formComponents.nextPage()" id="nextPageBtn">下一页</button>
            </div>
        `;
    }

    /**
     * 渲染表单构建器视图
     */
    renderBuilderView() {
        return `
            <div class="form-builder-container">
                <div class="form-builder-sidebar">
                    <h4>组件库</h4>
                    <div class="component-categories">
                        <div class="component-category">
                            <h5>基础组件</h5>
                            <div class="component-list">
                                <div class="component-item" draggable="true" data-type="text">
                                    <i class="fas fa-font"></i> 文本输入
                                </div>
                                <div class="component-item" draggable="true" data-type="textarea">
                                    <i class="fas fa-align-left"></i> 多行文本
                                </div>
                                <div class="component-item" draggable="true" data-type="select">
                                    <i class="fas fa-list"></i> 下拉选择
                                </div>
                                <div class="component-item" draggable="true" data-type="radio">
                                    <i class="fas fa-dot-circle"></i> 单选按钮
                                </div>
                                <div class="component-item" draggable="true" data-type="checkbox">
                                    <i class="fas fa-check-square"></i> 复选框
                                </div>
                            </div>
                        </div>
                        <div class="component-category">
                            <h5>高级组件</h5>
                            <div class="component-list">
                                <div class="component-item" draggable="true" data-type="file">
                                    <i class="fas fa-file-upload"></i> 文件上传
                                </div>
                                <div class="component-item" draggable="true" data-type="date">
                                    <i class="fas fa-calendar"></i> 日期选择
                                </div>
                                <div class="component-item" draggable="true" data-type="number">
                                    <i class="fas fa-hashtag"></i> 数字输入
                                </div>
                                <div class="component-item" draggable="true" data-type="email">
                                    <i class="fas fa-envelope"></i> 邮箱输入
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-builder-canvas">
                    <div class="form-canvas" id="formCanvas">
                        <div class="canvas-placeholder">
                            拖拽组件到这里开始构建表单
                        </div>
                    </div>
                </div>
                <div class="form-builder-properties">
                    <h4>属性面板</h4>
                    <div id="propertiesPanel">
                        <p>选择一个组件来编辑属性</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染验证规则视图
     */
    renderValidationView() {
        return `
            <div class="validation-controls">
                <button class="btn btn-primary" onclick="formComponents.addValidationRule()">
                    <i class="fas fa-plus"></i> 添加验证规则
                </button>
            </div>

            <div class="validation-rules">
                <h3>验证规则列表</h3>
                <div class="validation-table">
                    <table>
                        <thead>
                            <tr>
                                <th>规则名称</th>
                                <th>类型</th>
                                <th>表达式</th>
                                <th>错误消息</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="validationRulesBody">
                            ${this.renderValidationRules()}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="validation-tester">
                <h3>验证测试器</h3>
                <div class="tester-form">
                    <div class="form-group">
                        <label>选择验证规则:</label>
                        <select id="testValidationRule">
                            <option value="">选择规则</option>
                            ${this.renderValidationOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>测试值:</label>
                        <input type="text" id="testValue" placeholder="输入要测试的值" />
                    </div>
                    <button class="btn btn-primary" onclick="formComponents.testValidation()">测试验证</button>
                    <div id="testResult" class="test-result"></div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染文件上传视图
     */
    renderUploadsView() {
        return `
            <div class="upload-controls">
                <button class="btn btn-primary" onclick="formComponents.showFileUpload()">
                    <i class="fas fa-upload"></i> 上传文件
                </button>
                <button class="btn btn-secondary" onclick="formComponents.configureUpload()">
                    <i class="fas fa-cog"></i> 上传配置
                </button>
            </div>

            <div class="upload-stats">
                <div class="upload-stat-card">
                    <div class="upload-stat-number">1.2GB</div>
                    <div class="upload-stat-label">总存储空间</div>
                </div>
                <div class="upload-stat-card">
                    <div class="upload-stat-number">156</div>
                    <div class="upload-stat-label">文件总数</div>
                </div>
                <div class="upload-stat-card">
                    <div class="upload-stat-number">98%</div>
                    <div class="upload-stat-label">上传成功率</div>
                </div>
            </div>

            <div class="upload-files">
                <h3>文件列表</h3>
                <div class="file-filters">
                    <select id="fileTypeFilter">
                        <option value="">所有类型</option>
                        <option value="image">图片</option>
                        <option value="document">文档</option>
                        <option value="video">视频</option>
                        <option value="other">其他</option>
                    </select>
                    <input type="text" id="fileSearch" placeholder="搜索文件..." />
                </div>
                <div class="file-grid" id="fileGrid">
                    ${this.renderFileGrid()}
                </div>
            </div>
        `;
    }

    /**
     * 渲染表单构建器
     */
    renderFormBuilder() {
        return `
            <div class="form-builder-header">
                <input type="text" id="formName" placeholder="表单名称" class="form-name-input" />
                <div class="builder-actions">
                    <button class="btn btn-secondary" onclick="formComponents.previewForm()">预览</button>
                    <button class="btn btn-success" onclick="formComponents.saveForm()">保存</button>
                </div>
            </div>
            ${this.renderBuilderView()}
        `;
    }

    /**
     * 渲染批量编辑器
     */
    renderBatchEditor() {
        return `
            <div class="batch-editor">
                <div class="batch-selector">
                    <h4>选择要编辑的表单</h4>
                    <div class="form-list">
                        ${this.renderFormCheckboxes()}
                    </div>
                </div>
                <div class="batch-operations">
                    <h4>批量操作</h4>
                    <div class="operation-tabs">
                        <button class="operation-tab active" data-tab="status">状态修改</button>
                        <button class="operation-tab" data-tab="properties">属性修改</button>
                        <button class="operation-tab" data-tab="validation">验证规则</button>
                    </div>
                    <div class="operation-content">
                        <div id="statusTab" class="operation-panel active">
                            <div class="form-group">
                                <label>新状态:</label>
                                <select id="batchStatus">
                                    <option value="active">活跃</option>
                                    <option value="inactive">非活跃</option>
                                    <option value="draft">草稿</option>
                                </select>
                            </div>
                        </div>
                        <div id="propertiesTab" class="operation-panel">
                            <div class="form-group">
                                <label>属性名:</label>
                                <input type="text" id="batchPropertyName" placeholder="属性名" />
                            </div>
                            <div class="form-group">
                                <label>属性值:</label>
                                <input type="text" id="batchPropertyValue" placeholder="属性值" />
                            </div>
                        </div>
                        <div id="validationTab" class="operation-panel">
                            <div class="form-group">
                                <label>验证规则:</label>
                                <select id="batchValidationRule">
                                    ${this.renderValidationOptions()}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="batch-actions">
                        <button class="btn btn-primary" onclick="formComponents.applyBatchChanges()">应用更改</button>
                        <button class="btn btn-secondary" onclick="formComponents.closeBatchEditor()">取消</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染文件上传组件
     */
    renderFileUpload() {
        return `
            <div class="file-upload-area">
                <div class="upload-dropzone" id="uploadDropzone">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>拖拽文件到这里或点击选择文件</p>
                    <input type="file" id="fileInput" multiple style="display: none;" />
                </div>
                <div class="upload-progress" id="uploadProgress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">0%</div>
                </div>
                <div class="upload-files-list" id="uploadFilesList"></div>
            </div>
        `;
    }

    /**
     * 设置默认验证器
     */
    setupDefaultValidators() {
        this.validators.set('required', {
            name: '必填',
            validate: (value) => value && value.trim() !== '',
            message: '此字段为必填项'
        });

        this.validators.set('email', {
            name: '邮箱格式',
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: '请输入有效的邮箱地址'
        });

        this.validators.set('phone', {
            name: '手机号码',
            validate: (value) => /^1[3-9]\d{9}$/.test(value),
            message: '请输入有效的手机号码'
        });

        this.validators.set('minLength', {
            name: '最小长度',
            validate: (value, min) => value && value.length >= min,
            message: '长度不能少于{min}个字符'
        });

        this.validators.set('maxLength', {
            name: '最大长度',
            validate: (value, max) => !value || value.length <= max,
            message: '长度不能超过{max}个字符'
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 表单拖拽事件
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 导航切换
        document.querySelectorAll('.form-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // 搜索和过滤
        const searchInput = document.getElementById('formSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        const statusFilter = document.getElementById('formStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', this.handleFilter.bind(this));
        }
    }

    /**
     * 切换视图
     */
    switchView(viewName) {
        // 更新导航状态
        document.querySelectorAll('.form-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // 切换视图内容
        document.querySelectorAll('.form-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');
    }

    /**
     * 获取表单统计数据
     */
    getFormStats() {
        return {
            totalForms: 25,
            activeForms: 18,
            totalSubmissions: 1247,
            validationRules: 12
        };
    }

    /**
     * 渲染最近表单
     */
    renderRecentForms() {
        const recentForms = [
            { name: '用户反馈表单', type: 'feedback', submissions: 45, created: '2024-01-15' },
            { name: '产品调查问卷', type: 'survey', submissions: 128, created: '2024-01-14' },
            { name: '联系我们', type: 'contact', submissions: 23, created: '2024-01-13' }
        ];

        return recentForms.map(form => `
            <div class="recent-form-item">
                <div class="form-info">
                    <h4>${form.name}</h4>
                    <span class="form-type">${form.type}</span>
                </div>
                <div class="form-stats">
                    <span>${form.submissions} 提交</span>
                    <span>${form.created}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染表单表格
     */
    renderFormsTable() {
        const forms = this.loadForms();
        return forms.map(form => `
            <tr>
                <td><input type="checkbox" value="${form.id}" /></td>
                <td>${form.name}</td>
                <td><span class="form-type ${form.type}">${form.type}</span></td>
                <td><span class="form-status ${form.status}">${form.status}</span></td>
                <td>${form.submissions}</td>
                <td>${form.created}</td>
                <td class="form-actions-cell">
                    <button class="form-action-btn edit" onclick="formComponents.editForm('${form.id}')">编辑</button>
                    <button class="form-action-btn view" onclick="formComponents.viewForm('${form.id}')">查看</button>
                    <button class="form-action-btn delete" onclick="formComponents.deleteForm('${form.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染验证规则
     */
    renderValidationRules() {
        const rules = Array.from(this.validators.entries());
        return rules.map(([key, rule]) => `
            <tr>
                <td>${rule.name}</td>
                <td>${key}</td>
                <td><code>${rule.validate.toString()}</code></td>
                <td>${rule.message}</td>
                <td>
                    <button class="form-action-btn edit" onclick="formComponents.editValidationRule('${key}')">编辑</button>
                    <button class="form-action-btn delete" onclick="formComponents.deleteValidationRule('${key}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染验证选项
     */
    renderValidationOptions() {
        const rules = Array.from(this.validators.entries());
        return rules.map(([key, rule]) => `
            <option value="${key}">${rule.name}</option>
        `).join('');
    }

    /**
     * 渲染文件网格
     */
    renderFileGrid() {
        const files = this.loadFiles();
        return files.map(file => `
            <div class="file-item">
                <div class="file-preview">
                    <i class="fas ${this.getFileIcon(file.type)}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${file.size}</div>
                    <div class="file-date">${file.uploaded}</div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn" onclick="formComponents.downloadFile('${file.id}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="file-action-btn" onclick="formComponents.deleteFile('${file.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染表单复选框
     */
    renderFormCheckboxes() {
        const forms = this.loadForms();
        return forms.map(form => `
            <div class="form-checkbox-item">
                <input type="checkbox" id="form_${form.id}" value="${form.id}" />
                <label for="form_${form.id}">${form.name}</label>
            </div>
        `).join('');
    }

    /**
     * 加载表单数据
     */
    loadForms() {
        return [
            { id: '1', name: '用户注册表单', type: 'registration', status: 'active', submissions: 156, created: '2024-01-15' },
            { id: '2', name: '联系我们', type: 'contact', status: 'active', submissions: 89, created: '2024-01-14' },
            { id: '3', name: '产品反馈', type: 'feedback', status: 'inactive', submissions: 234, created: '2024-01-13' },
            { id: '4', name: '满意度调查', type: 'survey', status: 'active', submissions: 67, created: '2024-01-12' },
            { id: '5', name: '申请表单', type: 'application', status: 'draft', submissions: 0, created: '2024-01-11' }
        ];
    }

    /**
     * 加载文件数据
     */
    loadFiles() {
        return [
            { id: '1', name: 'document.pdf', type: 'document', size: '2.3MB', uploaded: '2024-01-15' },
            { id: '2', name: 'image.jpg', type: 'image', size: '1.8MB', uploaded: '2024-01-14' },
            { id: '3', name: 'video.mp4', type: 'video', size: '15.2MB', uploaded: '2024-01-13' },
            { id: '4', name: 'spreadsheet.xlsx', type: 'document', size: '856KB', uploaded: '2024-01-12' }
        ];
    }

    /**
     * 获取文件图标
     */
    getFileIcon(type) {
        const icons = {
            image: 'fa-image',
            document: 'fa-file-alt',
            video: 'fa-video',
            audio: 'fa-music',
            archive: 'fa-file-archive'
        };
        return icons[type] || 'fa-file';
    }

    /**
     * 处理拖拽开始
     */
    handleDragStart(e) {
        if (e.target.classList.contains('component-item')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.type);
        }
    }

    /**
     * 处理拖拽悬停
     */
    handleDragOver(e) {
        e.preventDefault();
    }

    /**
     * 处理拖拽放置
     */
    handleDrop(e) {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('text/plain');
        if (componentType && e.target.closest('#formCanvas')) {
            this.addFormComponent(componentType);
        }
    }

    /**
     * 添加表单组件
     */
    addFormComponent(type) {
        const canvas = document.getElementById('formCanvas');
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const component = this.createFormComponent(type);
        canvas.appendChild(component);
    }

    /**
     * 创建表单组件
     */
    createFormComponent(type) {
        const div = document.createElement('div');
        div.className = 'form-component';
        div.dataset.type = type;

        const componentHTML = this.getComponentHTML(type);
        div.innerHTML = `
            <div class="component-header">
                <span class="component-label">${this.getComponentLabel(type)}</span>
                <div class="component-actions">
                    <button onclick="formComponents.editComponent(this)">编辑</button>
                    <button onclick="formComponents.deleteComponent(this)">删除</button>
                </div>
            </div>
            <div class="component-body">
                ${componentHTML}
            </div>
        `;

        return div;
    }

    /**
     * 获取组件HTML
     */
    getComponentHTML(type) {
        const templates = {
            text: '<input type="text" placeholder="请输入文本" />',
            textarea: '<textarea placeholder="请输入多行文本"></textarea>',
            select: '<select><option>选项1</option><option>选项2</option></select>',
            radio: '<label><input type="radio" name="radio1" /> 选项1</label><label><input type="radio" name="radio1" /> 选项2</label>',
            checkbox: '<label><input type="checkbox" /> 复选框1</label><label><input type="checkbox" /> 复选框2</label>',
            file: '<input type="file" />',
            date: '<input type="date" />',
            number: '<input type="number" placeholder="请输入数字" />',
            email: '<input type="email" placeholder="请输入邮箱" />'
        };
        return templates[type] || '<input type="text" />';
    }

    /**
     * 获取组件标签
     */
    getComponentLabel(type) {
        const labels = {
            text: '文本输入',
            textarea: '多行文本',
            select: '下拉选择',
            radio: '单选按钮',
            checkbox: '复选框',
            file: '文件上传',
            date: '日期选择',
            number: '数字输入',
            email: '邮箱输入'
        };
        return labels[type] || '未知组件';
    }

    /**
     * 处理搜索
     */
    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        // 实现搜索逻辑
        console.log('搜索:', searchTerm);
    }

    /**
     * 处理过滤
     */
    handleFilter(e) {
        const filterValue = e.target.value;
        // 实现过滤逻辑
        console.log('过滤:', filterValue);
    }

    /**
     * 显示表单构建器
     */
    showFormBuilder() {
        document.getElementById('formBuilderModal').classList.add('show');
    }

    /**
     * 显示模板
     */
    showTemplates() {
        alert('模板功能正在开发中...');
    }

    /**
     * 显示批量编辑器
     */
    showBatchEditor() {
        document.getElementById('batchEditorModal').classList.add('show');
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    /**
     * 关闭批量编辑器
     */
    closeBatchEditor() {
        this.closeModal('batchEditorModal');
    }

    /**
     * 创建快速表单
     */
    createQuickForm(type) {
        alert(`创建${type}表单功能正在开发中...`);
    }

    /**
     * 其他方法的占位符实现
     */
    editForm(id) { alert(`编辑表单 ${id}`); }
    viewForm(id) { alert(`查看表单 ${id}`); }
    deleteForm(id) { alert(`删除表单 ${id}`); }
    editComponent(btn) { alert('编辑组件'); }
    deleteComponent(btn) { btn.closest('.form-component').remove(); }
    previewForm() { alert('预览表单'); }
    saveForm() { alert('保存表单'); }
    applyBatchChanges() { alert('应用批量更改'); }
    testValidation() { alert('测试验证'); }
    showFileUpload() { this.closeModal('fileUploadModal'); }
    configureUpload() { alert('配置上传'); }
    downloadFile(id) { alert(`下载文件 ${id}`); }
    deleteFile(id) { alert(`删除文件 ${id}`); }
    exportForms() { alert('导出表单'); }
    addValidationRule() { alert('添加验证规则'); }
    editValidationRule(key) { alert(`编辑验证规则 ${key}`); }
    deleteValidationRule(key) { alert(`删除验证规则 ${key}`); }
    previousPage() { alert('上一页'); }
    nextPage() { alert('下一页'); }
}

// 全局实例
window.FormComponents = FormComponents;
let formComponents;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (typeof FormComponents !== 'undefined') {
        formComponents = new FormComponents();
    }
});