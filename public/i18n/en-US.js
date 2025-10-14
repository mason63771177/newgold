/**
 * 英文语言包
 */

// 导入文本配置
if (typeof require !== 'undefined') {
    var TEXTS = require('../texts.js');
} else if (typeof window !== 'undefined' && window.TEXTS) {
    var TEXTS = window.TEXTS;
}

// 创建英文翻译的辅助函数
function createEnglishTranslations(texts) {
    const result = {};
    
    function processObject(obj, target) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                target[key] = {};
                processObject(obj[key], target[key]);
            } else {
                // 暂时使用中文作为占位符，后续可替换为实际英文翻译
                target[key] = obj[key];
            }
        }
    }
    
    processObject(texts, result);
    return result;
}

const enUS = {
    ...createEnglishTranslations(TEXTS),
    // 测试页面专用英文文本
    ui: {
        ...createEnglishTranslations(TEXTS).ui,
        title: 'I18n System Test Page',
        test_button: 'Run Test',
        loading: 'Loading i18n system...',
        template_test: 'Template Syntax Test',
        welcome_message: 'Welcome to the i18n system!',
        current_time: 'Current Time',
        input_placeholder: 'Please enter content',
        star_icon: 'Star Icon',
        function_test: 'Function Call Test',
        js_loading: 'Waiting for JS update...',
        js_updated: 'JS text updated!',
        update_text: 'Update Text',
        interpolation_test: 'Interpolation Test',
        user_info: 'User {{name}} is {{age}} years old',
        nested_test: 'Nested Key Test'
    }
};

// 导出语言包
if (typeof module !== 'undefined' && module.exports) {
    module.exports = enUS;
} else if (typeof window !== 'undefined') {
    window.enUS = enUS;
}