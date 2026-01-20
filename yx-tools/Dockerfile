# ============================================
# 第一阶段：编译 CloudflareSpeedTest 二进制文件
# ============================================
FROM golang:1.21-alpine AS builder

WORKDIR /src

# 复制 CloudflareSpeedTest 源码
COPY CloudflareSpeedTest .

# 编译三个架构的二进制文件（交叉编译）
# AMD64 (x86_64) - 标准服务器和PC
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o CloudflareST_proxy_linux_amd64 .

# ARM64 (aarch64) - 树莓派4/5、高端ARM设备
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags "-s -w" -o CloudflareST_proxy_linux_arm64 .

# ARM32 (armv7) - 树莓派2/3、玩客云等
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm GOARM=7 go build -ldflags "-s -w" -o CloudflareST_proxy_linux_arm .

# ============================================
# 第二阶段：运行环境
# ============================================
FROM python:3.9-slim

# 元数据标签
LABEL org.opencontainers.image.title="Cloudflare Speedtest Tool"
LABEL org.opencontainers.image.description="Cloudflare CDN IP optimization tool with web management interface"
LABEL org.opencontainers.image.source="https://github.com/1williamaoayers/yxtovps"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# 安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 从构建阶段复制编译好的三个架构的二进制文件
COPY --from=builder /src/CloudflareST_proxy_linux_amd64 /app/CloudflareST_proxy_linux_amd64
COPY --from=builder /src/CloudflareST_proxy_linux_arm64 /app/CloudflareST_proxy_linux_arm64
COPY --from=builder /src/CloudflareST_proxy_linux_arm /app/CloudflareST_proxy_linux_arm

# 赋予所有二进制文件执行权限
RUN chmod +x /app/CloudflareST_proxy_linux_* && \
    echo "✓ Installed CloudflareST binaries:" && \
    ls -lh /app/CloudflareST_proxy_linux_*

# 安装 Python 依赖（单独一层以利用缓存）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app/ /app/
COPY cloudflare_speedtest.py /app/

# 创建数据目录用于持久化
RUN mkdir -p /app/data

# 环境变量
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Shanghai

# 暴露端口
EXPOSE 2028

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:2028/ || exit 1

# 运行应用
CMD ["python", "app.py"]
