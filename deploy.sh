#!/bin/bash
# CareerPath AI 部署脚本

set -e

echo "🚀 开始部署 CareerPath AI..."

# 构建前端
echo "📦 构建前端..."
cd frontend
npm run build

# 部署到服务器（示例配置）
echo "📤 部署到服务器..."
# rsync -avz dist/ user@server:/var/www/careerpath-ai/

echo "✅ 部署完成！"
echo "🌐 访问地址: https://careerpath-ai.example.com"
