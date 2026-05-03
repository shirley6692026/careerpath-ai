# PDF简历错误诊断报告
**源文件**: 吴慈航机械助理工程师简历.pdf
**检查时间**: 2026-05-02

## 发现的错误

| # | 错误 | 严重度 | 表现 |
|---|------|--------|------|
| 1 | Page 2 = Page 1 重复 | 🔴 | 第二页完全复制第一页内容 |
| 2 | 内容截断 | 🔴 | 毕业设计、校园履历、实习经历、个人总结全部缺失 |
| 3 | 联系方式 = "可补充电话、邮箱等信息" | 🟡 | 占位符代替真实数据 |
| 4 | 页头设计丢失 | 🟡 | 蓝色渐变header被旧版白色header覆盖 |

## 根因分析

### 错误1&2: 内容截断+重复页面
**根因**: parseResumeToStructured() 在检测"获得荣誉"时(之前缺失的关键词已修复)，
但 headerLines 逻辑新增"个人信息"section导致section索引偏移 +
html2pdf.js 页面渲染异常(负margin触发溢出bug导致第二页复制)

### 错误3: 联系方式占位符
**根因**: AI输出"可补充电话、邮箱等信息"占位符
mergePersonalInfo() 之前只匹配"待补充"不匹配"可补充"

### 错误4: 页头设计丢失
**根因**: 多次CSS迭代中蓝色渐变header被旧版白色header覆盖

## 修复方案

### Fix 1: 恢复header设计
- 蓝色渐变header + 正确margin（不使用负值）

### Fix 2: 增强mergePersonalInfo
- 匹配"可补充|待补充|待提供"多种占位符
- 从原始文本提取电话/邮箱替换

### Fix 3: 修复html2pdf重复
- 添加 pagebreak 配置
- 移除负margin

### Fix 4: 验证section完整性
- parseResumeToStructured输出全部11种section
