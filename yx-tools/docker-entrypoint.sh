#!/bin/bash
# Docker 容器启动脚本
# 功能：启动 Flask Web 应用并保持容器运行

echo "=========================================="
echo "  Cloudflare Speedtest Web 启动中..."
echo "=========================================="

# 启动 Flask 应用（后台运行）
echo "正在启动 Web 管理界面..."
python /app/app.py &

# 保存 Flask 进程 ID
FLASK_PID=$!

echo "✓ Web 管理界面已启动 (PID: $FLASK_PID)"
echo "✓ 访问地址: http://localhost:2028"
echo "=========================================="

# 监控 Flask 进程，如果退出则重启
while true; do
    if ! kill -0 $FLASK_PID 2>/dev/null; then
        echo "⚠️  Flask 进程已退出，正在重启..."
        python /app/app.py &
        FLASK_PID=$!
        echo "✓ Flask 已重启 (PID: $FLASK_PID)"
    fi
    sleep 10
done
