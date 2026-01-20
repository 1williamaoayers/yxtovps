#!/bin/bash
# 玩客云 Docker 镜像更新脚本
# 用途：自动停止旧容器、删除旧镜像、拉取新镜像、启动新容器

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  Cloudflare Speedtest Docker 更新脚本"
echo "=========================================="
echo ""

# 配置变量
CONTAINER_NAME="cloudflare-speedtest"
IMAGE_NAME="ghcr.io/1williamaoayers/yxtovps:latest"
DATA_DIR="$(pwd)/data"
PORT="2028"

# 1. 停止并删除旧容器
echo "📦 步骤 1/5: 停止并删除旧容器..."
if docker ps -a | grep -q $CONTAINER_NAME; then
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo "✅ 旧容器已删除"
else
    echo "ℹ️  没有找到旧容器"
fi
echo ""

# 2. 查看当前镜像
echo "📋 步骤 2/5: 查看当前镜像..."
docker images | grep yxtovps || echo "ℹ️  没有找到旧镜像"
echo ""

# 3. 删除旧镜像（保留最新的）
echo "🗑️  步骤 3/5: 清理旧镜像..."
OLD_IMAGES=$(docker images ghcr.io/1williamaoayers/yxtovps --format "{{.ID}}" | tail -n +2)
if [ -n "$OLD_IMAGES" ]; then
    echo "$OLD_IMAGES" | xargs docker rmi -f 2>/dev/null || true
    echo "✅ 旧镜像已清理"
else
    echo "ℹ️  没有需要清理的旧镜像"
fi
echo ""

# 4. 拉取最新镜像
echo "⬇️  步骤 4/5: 拉取最新镜像..."
docker pull $IMAGE_NAME
echo "✅ 最新镜像已拉取"
echo ""

# 5. 启动新容器
echo "🚀 步骤 5/5: 启动新容器..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:$PORT \
    -v $DATA_DIR:/app/data \
    -e TZ=Asia/Shanghai \
    $IMAGE_NAME

echo "✅ 新容器已启动"
echo ""

# 6. 验证运行状态
echo "=========================================="
echo "  运行状态检查"
echo "=========================================="
echo ""
echo "📊 容器状态："
docker ps | grep $CONTAINER_NAME
echo ""
echo "📝 最近日志："
docker logs --tail 20 $CONTAINER_NAME
echo ""
echo "=========================================="
echo "✅ 更新完成！"
echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "=========================================="
