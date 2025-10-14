/**
 * H5项目代码质量分析工具
 * 用于检查代码结构、可读性、重复逻辑、MCP规范符合度等
 */

const fs = require('fs');
const path = require('path');

class CodeQualityAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../');
    this.results = {
      files: [],
      issues: [],
      metrics: {
        totalFiles: 0,
        totalLines: 0,
        duplicateBlocks: 0,
        complexFunctions: 0,
        longFunctions: 0,
        unusedVariables: 0,
        missingComments: 0
      },
      summary: {
        score: 0,
        grade: 'F',
        recommendations: []
      }
    };
  }

  /**
   * 执行完整的代码质量分析
   */
  async analyze() {
    console.log('🔍 开始代码质量分析...');
    
    try {
      // 扫描项目文件
      await this.scanProjectFiles();
      
      // 分析各个方面
      await this.analyzeCodeStructure();
      await this.analyzeReadability();
      await this.analyzeDuplication();
      await this.analyzeComplexity();
      await this.analyzeMCPCompliance();
      
      // 计算总体评分
      this.calculateScore();
      
      // 生成报告
      await this.generateReport();
      
      console.log('✅ 代码质量分析完成');
      return this.results;
      
    } catch (error) {
      console.error('❌ 代码质量分析失败:', error);
      throw error;
    }
  }

  /**
   * 扫描项目文件
   */
  async scanProjectFiles() {
    const extensions = ['.html', '.js', '.css'];
    const excludeDirs = ['node_modules', '.git', '测试', '备份', 'admin-system'];
    
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !excludeDirs.some(exclude => file.includes(exclude))) {
          scanDir(filePath);
        } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          
          this.results.files.push({
            path: path.relative(this.projectRoot, filePath),
            name: file,
            extension: path.extname(file),
            size: stat.size,
            lines: lines.length,
            content: content
          });
          
          this.results.metrics.totalFiles++;
          this.results.metrics.totalLines += lines.length;
        }
      });
    };
    
    scanDir(this.projectRoot);
    console.log(`📁 扫描到 ${this.results.metrics.totalFiles} 个文件，共 ${this.results.metrics.totalLines} 行代码`);
  }

  /**
   * 分析代码结构
   */
  async analyzeCodeStructure() {
    console.log('🏗️ 分析代码结构...');
    
    this.results.files.forEach(file => {
      const issues = [];
      
      if (file.extension === '.html') {
        // HTML结构分析
        this.analyzeHTMLStructure(file, issues);
      } else if (file.extension === '.js') {
        // JavaScript结构分析
        this.analyzeJSStructure(file, issues);
      } else if (file.extension === '.css') {
        // CSS结构分析
        this.analyzeCSSStructure(file, issues);
      }
      
      this.results.issues.push(...issues);
    });
  }

  /**
   * 分析HTML结构
   */
  analyzeHTMLStructure(file, issues) {
    const content = file.content;
    
    // 检查HTML5语义化标签使用
    const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    const hasSemanticTags = semanticTags.some(tag => content.includes(`<${tag}`));
    
    if (!hasSemanticTags && file.lines > 100) {
      issues.push({
        file: file.path,
        type: 'structure',
        severity: 'medium',
        message: 'HTML文件缺少语义化标签，建议使用header、main、section等标签',
        line: 1
      });
    }
    
    // 检查内联样式过多
    const inlineStyleCount = (content.match(/style\s*=/g) || []).length;
    if (inlineStyleCount > 20) {
      issues.push({
        file: file.path,
        type: 'structure',
        severity: 'high',
        message: `内联样式过多 (${inlineStyleCount}个)，建议提取到CSS文件`,
        line: 1
      });
    }
    
    // 检查script标签位置
    const scriptInHead = content.match(/<head[\s\S]*?<script[\s\S]*?<\/head>/);
    if (scriptInHead && scriptInHead[0].includes('function')) {
      issues.push({
        file: file.path,
        type: 'structure',
        severity: 'medium',
        message: '建议将JavaScript代码移到body底部或外部文件',
        line: 1
      });
    }
  }

  /**
   * 分析JavaScript结构
   */
  analyzeJSStructure(file, issues) {
    const lines = file.content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 检查函数长度
      if (line.trim().startsWith('function ') || line.includes('function(')) {
        const functionLines = this.getFunctionLength(lines, index);
        if (functionLines > 50) {
          issues.push({
            file: file.path,
            type: 'structure',
            severity: 'high',
            message: `函数过长 (${functionLines}行)，建议拆分为更小的函数`,
            line: lineNum
          });
          this.results.metrics.longFunctions++;
        }
      }
      
      // 检查全局变量
      if (line.trim().startsWith('var ') && !line.includes('function')) {
        issues.push({
          file: file.path,
          type: 'structure',
          severity: 'medium',
          message: '使用了全局变量，建议使用模块化或命名空间',
          line: lineNum
        });
      }
      
      // 检查console.log
      if (line.includes('console.log') && !line.includes('//')) {
        issues.push({
          file: file.path,
          type: 'structure',
          severity: 'low',
          message: '生产代码中包含console.log，建议移除或使用日志系统',
          line: lineNum
        });
      }
    });
  }

  /**
   * 分析CSS结构
   */
  analyzeCSSStructure(file, issues) {
    const content = file.content;
    
    // 检查CSS选择器复杂度
    const complexSelectors = content.match(/[^{]+\{[^}]*\}/g) || [];
    complexSelectors.forEach((selector, index) => {
      const selectorPart = selector.split('{')[0].trim();
      const complexity = (selectorPart.match(/\s+/g) || []).length;
      
      if (complexity > 4) {
        issues.push({
          file: file.path,
          type: 'structure',
          severity: 'medium',
          message: `CSS选择器过于复杂: ${selectorPart.substring(0, 50)}...`,
          line: index + 1
        });
      }
    });
    
    // 检查重复的CSS属性
    const properties = content.match(/[a-z-]+\s*:\s*[^;]+;/g) || [];
    const propertyCount = {};
    properties.forEach(prop => {
      const key = prop.split(':')[0].trim();
      propertyCount[key] = (propertyCount[key] || 0) + 1;
    });
    
    Object.entries(propertyCount).forEach(([prop, count]) => {
      if (count > 10) {
        issues.push({
          file: file.path,
          type: 'structure',
          severity: 'low',
          message: `CSS属性 ${prop} 重复使用 ${count} 次，考虑提取为CSS变量`,
          line: 1
        });
      }
    });
  }

  /**
   * 分析代码可读性
   */
  async analyzeReadability() {
    console.log('📖 分析代码可读性...');
    
    this.results.files.forEach(file => {
      if (file.extension === '.js') {
        this.analyzeJSReadability(file);
      }
    });
  }

  /**
   * 分析JavaScript可读性
   */
  analyzeJSReadability(file) {
    const lines = file.content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // 检查行长度
      if (line.length > 120) {
        issues.push({
          file: file.path,
          type: 'readability',
          severity: 'low',
          message: `代码行过长 (${line.length}字符)，建议控制在120字符内`,
          line: lineNum
        });
      }
      
      // 检查函数注释
      if (trimmed.startsWith('function ') && !this.hasFunctionComment(lines, index)) {
        issues.push({
          file: file.path,
          type: 'readability',
          severity: 'medium',
          message: '函数缺少注释说明',
          line: lineNum
        });
        this.results.metrics.missingComments++;
      }
      
      // 检查变量命名
      const varMatch = trimmed.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (varMatch) {
        const varName = varMatch[1];
        if (varName.length < 3 && !['i', 'j', 'k', 'id'].includes(varName)) {
          issues.push({
            file: file.path,
            type: 'readability',
            severity: 'low',
            message: `变量名过短: ${varName}，建议使用更有意义的名称`,
            line: lineNum
          });
        }
      }
    });
    
    this.results.issues.push(...issues);
  }

  /**
   * 分析代码重复
   */
  async analyzeDuplication() {
    console.log('🔄 分析代码重复...');
    
    const codeBlocks = new Map();
    
    this.results.files.forEach(file => {
      if (file.extension === '.js') {
        const lines = file.content.split('\n');
        
        // 检查重复的代码块（5行以上）
        for (let i = 0; i < lines.length - 4; i++) {
          const block = lines.slice(i, i + 5).join('\n').trim();
          if (block.length > 50) {
            const key = this.normalizeCode(block);
            if (!codeBlocks.has(key)) {
              codeBlocks.set(key, []);
            }
            codeBlocks.get(key).push({
              file: file.path,
              startLine: i + 1,
              block: block
            });
          }
        }
      }
    });
    
    // 找出重复的代码块
    codeBlocks.forEach((occurrences, key) => {
      if (occurrences.length > 1) {
        this.results.metrics.duplicateBlocks++;
        occurrences.forEach(occurrence => {
          this.results.issues.push({
            file: occurrence.file,
            type: 'duplication',
            severity: 'high',
            message: `发现重复代码块，在 ${occurrences.length} 个位置出现`,
            line: occurrence.startLine,
            details: occurrence.block.substring(0, 100) + '...'
          });
        });
      }
    });
  }

  /**
   * 分析代码复杂度
   */
  async analyzeComplexity() {
    console.log('🧮 分析代码复杂度...');
    
    this.results.files.forEach(file => {
      if (file.extension === '.js') {
        this.analyzeJSComplexity(file);
      }
    });
  }

  /**
   * 分析JavaScript复杂度
   */
  analyzeJSComplexity(file) {
    const content = file.content;
    const issues = [];
    
    // 计算圈复杂度
    const functions = this.extractFunctions(content);
    functions.forEach(func => {
      const complexity = this.calculateCyclomaticComplexity(func.body);
      if (complexity > 10) {
        issues.push({
          file: file.path,
          type: 'complexity',
          severity: 'high',
          message: `函数 ${func.name} 圈复杂度过高 (${complexity})，建议重构`,
          line: func.line
        });
        this.results.metrics.complexFunctions++;
      }
    });
    
    this.results.issues.push(...issues);
  }

  /**
   * 分析MCP规范符合度
   */
  async analyzeMCPCompliance() {
    console.log('📋 分析MCP规范符合度...');
    
    const issues = [];
    
    // 检查项目结构
    const requiredFiles = ['index.html', 'login.html', 'themes.css'];
    requiredFiles.forEach(fileName => {
      const exists = this.results.files.some(file => file.name === fileName);
      if (!exists) {
        issues.push({
          file: 'project',
          type: 'mcp-compliance',
          severity: 'high',
          message: `缺少必需文件: ${fileName}`,
          line: 1
        });
      }
    });
    
    // 检查响应式设计
    const cssFiles = this.results.files.filter(f => f.extension === '.css');
    const hasMediaQueries = cssFiles.some(file => 
      file.content.includes('@media') && file.content.includes('max-width')
    );
    
    if (!hasMediaQueries) {
      issues.push({
        file: 'project',
        type: 'mcp-compliance',
        severity: 'medium',
        message: 'CSS文件中缺少响应式媒体查询',
        line: 1
      });
    }
    
    // 检查可访问性
    const htmlFiles = this.results.files.filter(f => f.extension === '.html');
    htmlFiles.forEach(file => {
      if (!file.content.includes('alt=') && file.content.includes('<img')) {
        issues.push({
          file: file.path,
          type: 'mcp-compliance',
          severity: 'medium',
          message: '图片缺少alt属性，影响可访问性',
          line: 1
        });
      }
    });
    
    this.results.issues.push(...issues);
  }

  /**
   * 计算总体评分
   */
  calculateScore() {
    const weights = {
      high: 10,
      medium: 5,
      low: 1
    };
    
    let totalDeductions = 0;
    this.results.issues.forEach(issue => {
      totalDeductions += weights[issue.severity] || 1;
    });
    
    // 基础分100分，根据问题扣分
    const baseScore = 100;
    const score = Math.max(0, baseScore - totalDeductions);
    
    this.results.summary.score = score;
    
    // 评级
    if (score >= 90) this.results.summary.grade = 'A';
    else if (score >= 80) this.results.summary.grade = 'B';
    else if (score >= 70) this.results.summary.grade = 'C';
    else if (score >= 60) this.results.summary.grade = 'D';
    else this.results.summary.grade = 'F';
    
    // 生成建议
    this.generateRecommendations();
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    const issueTypes = {};
    this.results.issues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    });
    
    if (issueTypes.structure > 5) {
      recommendations.push('优化代码结构，减少函数长度和复杂度');
    }
    
    if (issueTypes.duplication > 0) {
      recommendations.push('消除重复代码，提取公共函数或组件');
    }
    
    if (issueTypes.readability > 10) {
      recommendations.push('改善代码可读性，添加注释和使用有意义的变量名');
    }
    
    if (issueTypes.complexity > 3) {
      recommendations.push('降低代码复杂度，拆分复杂函数');
    }
    
    if (issueTypes['mcp-compliance'] > 0) {
      recommendations.push('提高MCP规范符合度，完善项目结构和可访问性');
    }
    
    this.results.summary.recommendations = recommendations;
  }

  /**
   * 生成分析报告
   */
  async generateReport() {
    const reportPath = path.join(__dirname, '../报告/code-quality-report.md');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = this.generateMarkdownReport();
    fs.writeFileSync(reportPath, report, 'utf8');
    
    console.log(`📊 代码质量报告已生成: ${reportPath}`);
  }

  /**
   * 生成Markdown格式报告
   */
  generateMarkdownReport() {
    const { metrics, summary, issues } = this.results;
    const timestamp = new Date().toLocaleString('zh-CN');
    
    return `# H5项目代码质量分析报告

## 📊 总体评分

**评分**: ${summary.score}/100 (${summary.grade}级)
**生成时间**: ${timestamp}

## 📈 代码指标

| 指标 | 数值 |
|------|------|
| 总文件数 | ${metrics.totalFiles} |
| 总代码行数 | ${metrics.totalLines} |
| 重复代码块 | ${metrics.duplicateBlocks} |
| 复杂函数数 | ${metrics.complexFunctions} |
| 过长函数数 | ${metrics.longFunctions} |
| 缺少注释函数 | ${metrics.missingComments} |

## 🎯 优化建议

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔍 问题详情

### 高优先级问题 (${issues.filter(i => i.severity === 'high').length}个)

${this.formatIssues(issues.filter(i => i.severity === 'high'))}

### 中优先级问题 (${issues.filter(i => i.severity === 'medium').length}个)

${this.formatIssues(issues.filter(i => i.severity === 'medium'))}

### 低优先级问题 (${issues.filter(i => i.severity === 'low').length}个)

${this.formatIssues(issues.filter(i => i.severity === 'low'))}

## 📋 问题分类统计

${this.generateIssueStats()}

---

*报告由H5项目测试智能体自动生成*
`;
  }

  /**
   * 格式化问题列表
   */
  formatIssues(issues) {
    if (issues.length === 0) return '无';
    
    return issues.slice(0, 20).map(issue => 
      `- **${issue.file}:${issue.line}** - ${issue.message}`
    ).join('\n') + (issues.length > 20 ? `\n\n*还有 ${issues.length - 20} 个类似问题...*` : '');
  }

  /**
   * 生成问题统计
   */
  generateIssueStats() {
    const stats = {};
    this.results.issues.forEach(issue => {
      stats[issue.type] = (stats[issue.type] || 0) + 1;
    });
    
    return Object.entries(stats)
      .map(([type, count]) => `- ${this.getTypeDisplayName(type)}: ${count}个`)
      .join('\n');
  }

  /**
   * 获取问题类型显示名称
   */
  getTypeDisplayName(type) {
    const names = {
      'structure': '代码结构',
      'readability': '可读性',
      'duplication': '代码重复',
      'complexity': '复杂度',
      'mcp-compliance': 'MCP规范'
    };
    return names[type] || type;
  }

  // 辅助方法
  getFunctionLength(lines, startIndex) {
    let braceCount = 0;
    let length = 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      length++;
      
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount === 0 && i > startIndex) {
        break;
      }
    }
    
    return length;
  }

  hasFunctionComment(lines, functionIndex) {
    for (let i = functionIndex - 1; i >= Math.max(0, functionIndex - 3); i--) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('//') || line.startsWith('*')) {
        return true;
      }
    }
    return false;
  }

  normalizeCode(code) {
    return code
      .replace(/\s+/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .trim();
  }

  extractFunctions(content) {
    const functions = [];
    const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const startIndex = match.index;
      const lines = content.substring(0, startIndex).split('\n');
      
      functions.push({
        name: match[1],
        line: lines.length,
        body: this.extractFunctionBody(content, startIndex)
      });
    }
    
    return functions;
  }

  extractFunctionBody(content, startIndex) {
    let braceCount = 0;
    let i = startIndex;
    
    while (i < content.length) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount === 0 && i > startIndex) break;
      i++;
    }
    
    return content.substring(startIndex, i + 1);
  }

  calculateCyclomaticComplexity(code) {
    const complexityKeywords = ['if', 'else if', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'];
    let complexity = 1; // 基础复杂度
    
    complexityKeywords.forEach(keyword => {
      const matches = code.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const analyzer = new CodeQualityAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = CodeQualityAnalyzer;