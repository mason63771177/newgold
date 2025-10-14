#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import os

def remove_chinese_hardcode_with_i18n(file_path):
    """
    移除带有 data-i18n 属性的中文硬编码，只保留 data-i18n 属性
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 匹配带有 data-i18n 属性的中文硬编码模式
    patterns = [
        # 匹配 <span data-i18n="xxx">中文</span> 格式，移除中文内容
        (r'<span([^>]*data-i18n="[^"]*"[^>]*)>[\u4e00-\u9fff][^<]*</span>', 
         lambda m: f'<span{m.group(1)}></span>'),
        
        # 匹配 <div data-i18n="xxx">中文</div> 格式，移除中文内容
        (r'<div([^>]*data-i18n="[^"]*"[^>]*)>[\u4e00-\u9fff][^<]*</div>', 
         lambda m: f'<div{m.group(1)}></div>'),
        
        # 匹配 data-i18n="xxx">中文 格式，移除中文内容
        (r'(data-i18n="[^"]*"[^>]*>)[\u4e00-\u9fff][^<]*', 
         lambda m: f'{m.group(1)}'),
        
        # 特殊处理：移除带有 emoji 和中文的内容，但保留 data-i18n
        (r'<span([^>]*data-i18n="[^"]*"[^>]*)>[^<]*[\u4e00-\u9fff][^<]*</span>', 
         lambda m: f'<span{m.group(1)}></span>'),
        
        # 处理复杂的嵌套情况
        (r'<div class="section-title"([^>]*data-i18n="[^"]*"[^>]*)>[^<]*[\u4e00-\u9fff][^<]*</div>', 
         lambda m: f'<div class="section-title"{m.group(1)}></div>'),
    ]
    
    changes_made = 0
    
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes_made += len(re.findall(pattern, content))
            content = new_content
    
    # 特殊处理一些具体的情况
    specific_replacements = [
        # 移除 "⚡ 挑战倒计时" 中的中文，保留 data-i18n
        (r'data-i18n="challenge\.countdown">⚡ 挑战倒计时', 'data-i18n="challenge.countdown">'),
        
        # 移除 "168小时挑战" 中的中文，保留 data-i18n
        (r'data-i18n="challenge\.hours168">168小时挑战', 'data-i18n="challenge.hours168">'),
        
        # 移除 "剩余 -- 天" 中的中文，保留 data-i18n
        (r'data-i18n="challenge\.remaining">剩余 -- 天', 'data-i18n="challenge.remaining">'),
        
        # 移除 "邀请链接" 中的中文，保留 data-i18n
        (r'data-i18n="invite\.title">邀请链接', 'data-i18n="invite.title">'),
        
        # 移除 "我的专属邀请码" 中的中文，保留 data-i18n
        (r'data-i18n="invite\.myCode">我的专属邀请码', 'data-i18n="invite.myCode">'),
        
        # 移除 "复制码" 中的中文，保留 data-i18n
        (r'data-i18n="invite\.copyCode">复制码', 'data-i18n="invite.copyCode">'),
        
        # 移除 "🔗 邀请链接" 中的中文，保留 data-i18n
        (r'data-i18n="invite\.link">🔗 邀请链接', 'data-i18n="invite.link">'),
        
        # 移除 "复制链接" 中的中文，保留 data-i18n
        (r'data-i18n="invite\.copyLink">复制链接', 'data-i18n="invite.copyLink">'),
        
        # 移除 "我的战绩" 中的中文，保留 data-i18n
        (r'data-i18n="stats\.myRecord">我的战绩', 'data-i18n="stats.myRecord">'),
        
        # 移除 "新手任务" 中的中文，保留 data-i18n
        (r'data-i18n="tasks\.newbie">新手任务', 'data-i18n="tasks.newbie">'),
        
        # 移除 "已完成" 中的中文，保留 data-i18n
        (r'data-i18n="status\.completed">✅ 已完成', 'data-i18n="status.completed">'),
        
        # 移除 "进行中" 中的中文，保留 data-i18n
        (r'data-i18n="status\.inProgress">进行中', 'data-i18n="status.inProgress">'),
        
        # 移除其他常见的中文硬编码
        (r'data-i18n="[^"]*">[\u4e00-\u9fff][^<]*(?=</)', 'data-i18n="\\1">'),
    ]
    
    for old, new in specific_replacements:
        if old in content:
            content = content.replace(old, new)
            changes_made += 1
    
    # 写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"已处理 {changes_made} 个中文硬编码")
        return True
    else:
        print("没有发现需要处理的中文硬编码")
        return False

if __name__ == "__main__":
    file_path = "index.html"
    if os.path.exists(file_path):
        print(f"正在处理 {file_path}...")
        remove_chinese_hardcode_with_i18n(file_path)
        print("处理完成！")
    else:
        print(f"文件 {file_path} 不存在")