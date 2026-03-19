#!/bin/bash

# Agent 辩论场部署脚本

echo "🚀 开始部署..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm install

# 2. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 3. 构建项目
echo "🏗️ 构建项目..."
npm run build

# 4. 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel --prod --yes

echo "✅ 部署完成!"
