#!/bin/bash
# CareerPath AI 部署脚本

set -e

echo "🚀 CareerPath AI 部署脚本"
echo "=========================="

# 检查依赖
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ 未安装: $1"
    return 1
  fi
  echo "✅ $1 已安装"
  return 0
}

echo ""
echo "📋 检查依赖..."
check_dependency node
check_dependency npm
check_dependency git

# 构建前端
echo ""
echo "📦 构建前端..."
cd frontend
npm install
npm run build

if [ ! -d "dist" ]; then
  echo "❌ 构建失败: dist 目录不存在"
  exit 1
fi

echo "✅ 前端构建完成"

# 部署选项
echo ""
echo "🚀 选择部署方式:"
echo "1) 本地预览 (npm run preview)"
echo "2) 复制到 Nginx 目录"
echo "3) Docker 部署"
echo "4) 退出"

read -p "请选择 (1-4): " choice

case $choice in
  1)
    echo "🌐 启动本地预览服务器..."
    npm run preview
    ;;
  2)
    read -p "Nginx 目录 (默认: /var/www/careerpath-ai): " nginx_dir
    nginx_dir=${nginx_dir:-/var/www/careerpath-ai}
    
    echo "📤 复制到 $nginx_dir..."
    sudo mkdir -p $nginx_dir
    sudo cp -r dist/* $nginx_dir/
    sudo chown -R www-data:www-data $nginx_dir
    
    echo "✅ 部署完成!"
    echo "🌐 访问: http://localhost"
    echo "📋 请确保 Nginx 已配置并重启"
    ;;
  3)
    echo "🐳 Docker 部署..."
    if ! command -v docker &> /dev/null; then
      echo "❌ Docker 未安装"
      exit 1
    fi
    
    docker-compose up -d
    echo "✅ Docker 部署完成!"
    echo "🌐 访问: http://localhost:80"
    ;;
  4)
    echo "👋 退出"
    exit 0
    ;;
  *)
    echo "❌ 无效选择"
    exit 1
    ;;
esac

echo ""
echo "✅ 部署完成!"
echo "🌐 应用已上线"
