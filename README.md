# CareerPath AI 🎯

**AI-Native 大学生求职导航系统**

> TRAE SOLO Challenge 2026 参赛作品 · 命题③ 大学生求职迷茫

## 📋 项目概述

CareerPath AI 是一个基于 AI-Native 人力资本三支柱框架（AIC/AHP/ASC）的大学生求职导航系统，帮助大学生理解 AI 时代的招聘逻辑，发现自身可迁移能力，提升人机协作指数（HAIC）。

### 核心功能

| 模块 | 层级 | 功能 |
|:---|:---|:---|
| **JD 翻译官** | 🧠 AIC | JD → 真实工作日常 + 能力提取 + 薪资拆解 |
| **能力雷达** | 🧠 AIC | 技能评估 + 可迁移能力发现 + 差距分析 |
| **求职战报** | 🧠 AIC | 市场热度 + 薪资地图 + 趋势预测 |
| **职业导航仪** | 🤝 AHP | 7×24 AI 职业顾问 + 个性化建议 |
| **AI 面试官** | 🤝 AHP | 企业定制面试 + 实时评分 + 压力面模式 |
| **HAIC 教练** | 🤝 AHP | 5 维人机协作指数评估 + 提升计划 |
| **简历工坊** | ⚡ ASC | AI 优化 + 多版本管理 + 一键投递 |
| **学习路线图** | ⚡ ASC | 1/3/6/12 月个性化学习路径 |
| **求职仪表盘** | ⚡ ASC | 投递追踪 + 进度管理 + 策略建议 |

## 🔧 技术栈

- **前端**: React + Vite + TailwindCSS + Chart.js
- **后端**: Python FastAPI
- **AI**: 火山引擎 ARK (豆包大模型 / DeepSeek / Kimi)
- **数据库**: SQLite → Supabase
- **部署**: Vercel + Railway

## 🚀 快速开始

### 后端
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

## 🔑 环境变量
```
ARK_API_KEY=e2056fa0-1f84-4cc0-9f3e-1f13c493c67e
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

## 📊 模型支持

支持火山引擎 ARK 平台的全部豆包系列 + 开源模型，自动故障转移:

- 🥇 **Doubao1.5-pro-32k** — 主力模型 (中文最优)
- 🥇 **Doubao1.5-think-pro** — 复杂推理
- 🥇 **DeepSeek-V3.2** — 备用开源模型
- 🥇 **Doubao1.5-pro-256k** — 超长文本处理

## 📄 协议

MIT License
