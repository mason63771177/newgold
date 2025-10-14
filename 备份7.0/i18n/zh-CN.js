/**
 * 中文语言包
 */

// 导入文本配置
let TEXTS_DATA;
if (typeof require !== 'undefined') {
    TEXTS_DATA = require('../texts.js');
} else if (typeof window !== 'undefined' && window.TEXTS) {
    TEXTS_DATA = window.TEXTS;
}

const zhCN = {
    ...(TEXTS_DATA || {}),
    // 测试页面专用文本
    ui: {
        ...(TEXTS_DATA?.ui || {}),
        title: '国际化系统测试页面',
        test_button: '运行测试',
        loading: '正在加载国际化系统...',
        template_test: '模板语法测试',
        welcome_message: '欢迎使用国际化系统！',
        current_time: '当前时间',
        input_placeholder: '请输入内容',
        star_icon: '星星图标',
        function_test: '函数调用测试',
        js_loading: '等待JS更新...',
        js_updated: 'JS文本已更新！',
        update_text: '更新文本',
        interpolation_test: '插值测试',
        user_info: '用户 {{name}} 今年 {{age}} 岁',
        nested_test: '嵌套键值测试'
    }
};

// 导出语言包
if (typeof module !== 'undefined' && module.exports) {
    module.exports = zhCN;
} else if (typeof window !== 'undefined') {
    window.zhCN = zhCN;
}