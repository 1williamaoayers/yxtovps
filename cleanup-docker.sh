#!/bin/bash
# 玩客云 Docker 深度清理脚本
# 用途：清理所有未使用的 Docker 资源，释放磁盘空间

set -e

echo "=========================================="
echo "  Docker 深度清理脚本"
echo "=========================================="
echo ""

# 显示清理前的磁盘使用情况
echo "📊 清理前的磁盘使用情况："
docker system df
echo ""

# 询问用户确认
read -p "⚠️  这将删除所有未使用的镜像、容器、网络和缓存。是否继续？(y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消清理"
    exit 1
fi

echo ""
echo "🧹 开始清理..."
echo ""

# 1. 停止所有容器
echo "📦 步骤 1/5: 停止所有容器..."
docker stop $(docker ps -aq) 2>/dev/null || echo "ℹ️  没有运行中的容器"
echo ""

# 2. 删除所有停止的容器
echo "🗑️  步骤 2/5: 删除所有停止的容器..."
docker container prune -f
echo ""

# 3. 删除所有未使用的镜像
echo "🗑️  步骤 3/5: 删除所有未使用的镜像..."
docker image prune -a -f
echo ""

# 4. 删除所有未使用的网络
echo "🗑️  步骤 4/5: 删除所有未使用的网络..."
docker network prune -f
echo ""

# 5. 删除所有未使用的卷
echo "🗑️  步骤 5/5: 删除所有未使用的卷..."
docker volume prune -f
echo ""

# 显示清理后的磁盘使用情况
echo "=========================================="
echo "📊 清理后的磁盘使用情况："
docker system df
echo ""
echo "✅ 清理完成！"
echo "=========================================="
