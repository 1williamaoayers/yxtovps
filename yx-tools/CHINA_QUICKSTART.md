# 🇨🇳 国内用户快速开始指南

本指南专为中国大陆用户优化，使用南京大学镜像源加速 Docker 镜像下载。

## 🚀 一键部署

### 玩客云/ARM32 设备

```bash
# 1. SSH 登录到设备
ssh root@设备IP

# 2. 创建工作目录
mkdir -p /opt/cloudflare-speedtest
cd /opt/cloudflare-speedtest

# 3. 一键部署（使用南京大学镜像源）
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 4. 查看运行状态
docker ps | grep cloudflare-speedtest

# 5. 访问 Web 界面
# 浏览器打开: http://设备IP:2028
```

### PC/服务器（AMD64）

```bash
# 1. 创建工作目录
mkdir cloudflare-speedtest
cd cloudflare-speedtest

# 2. 一键部署（使用南京大学镜像源）
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 3. 访问 Web 界面
# 浏览器打开: http://localhost:2028
```

### Windows 用户（PowerShell）

```powershell
# 1. 创建工作目录
mkdir cloudflare-speedtest
cd cloudflare-speedtest

# 2. 一键部署（使用南京大学镜像源）
docker run -d `
  --name cloudflare-speedtest `
  --restart unless-stopped `
  -p 2028:2028 `
  -v ${PWD}/data:/app/data `
  -e TZ=Asia/Shanghai `
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 3. 访问 Web 界面
# 浏览器打开: http://localhost:2028
```

## 📦 使用 Docker Compose

### 1. 创建 docker-compose.yml

```bash
mkdir cloudflare-speedtest
cd cloudflare-speedtest
```

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  cloudflare-speedtest:
    # 使用南京大学镜像源
    image: ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
    
    container_name: cloudflare-speedtest
    restart: unless-stopped
    
    ports:
      - "2028:2028"
    
    volumes:
      - ./data:/app/data
    
    environment:
      - TZ=Asia/Shanghai
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:2028/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 管理服务

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

## 🎮 玩客云推荐配置

玩客云内存较小，建议使用以下配置参数：

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 测试数量 | 20-30 | 避免内存不足 |
| 线程数 | 100-150 | 根据网络情况调整 |
| 速度下限 | 3-5 MB/s | 适合家庭宽带 |
| 延迟阈值 | 300ms | 国内网络环境 |
| 上传数量 | 10 | 减少上传时间 |

### 限制内存使用（可选）

如果玩客云内存紧张，可以限制容器内存：

```bash
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  --memory="256m" \
  --memory-swap="512m" \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

## 🔧 常见问题

### 1. 镜像拉取速度慢

**问题**：使用 `ghcr.io` 下载速度很慢

**解决**：使用南京大学镜像源 `ghcr.nju.edu.cn`

```bash
# 将所有命令中的 ghcr.io 替换为 ghcr.nju.edu.cn
ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

### 2. 备用镜像源

如果南京大学镜像源不可用，可以尝试：

```bash
# 上海交通大学镜像源
ghcr.sjtu.edu.cn/1williamaoayers/yxtovps:latest

# 中国科学技术大学镜像源（如果支持）
ghcr.ustc.edu.cn/1williamaoayers/yxtovps:latest
```

### 3. 玩客云内存不足

**症状**：容器频繁重启或测速失败

**解决方案**：
1. 降低测试数量到 20
2. 降低线程数到 100
3. 限制容器内存（见上文）
4. 关闭其他不必要的服务

### 4. 端口被占用

**错误信息**：`bind: address already in use`

**解决**：更换端口

```bash
# 使用其他端口，例如 8080
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 8080:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 访问: http://设备IP:8080
```

### 5. 验证镜像架构

```bash
# 检查镜像架构
docker image inspect ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest | grep Architecture

# ARM32 设备应显示: "Architecture": "arm"
# AMD64 设备应显示: "Architecture": "amd64"
```

## 📊 性能优化建议

### 玩客云优化

1. **关闭不必要的服务**
```bash
# 查看运行的容器
docker ps

# 停止不需要的容器
docker stop <container_name>
```

2. **定期清理 Docker**
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune
```

3. **监控资源使用**
```bash
# 查看容器资源使用
docker stats cloudflare-speedtest

# 查看系统内存
free -h
```

## 🔗 相关链接

- **GitHub 仓库**: https://github.com/1williamaoayers/yxtovps
- **问题反馈**: https://github.com/1williamaoayers/yxtovps/issues
- **完整文档**: [README.md](README.md)
- **故障排除**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 💡 提示

- 首次运行建议使用较小的测试数量和线程数
- 定时任务默认为每天凌晨 4 点，可在 Web 界面修改
- 所有配置和结果保存在 `data` 目录，容器删除后数据不会丢失
- 建议定期查看日志，及时发现问题

## 🎉 快速验证

部署完成后，执行以下命令验证：

```bash
# 1. 检查容器状态
docker ps | grep cloudflare-speedtest

# 2. 检查日志
docker logs cloudflare-speedtest

# 3. 测试 Web 访问
curl http://localhost:2028/

# 4. 查看数据目录
ls -la data/
```

如果所有命令都正常执行，说明部署成功！🎊

---

**最后更新**: 2026-01-20
**适用版本**: v1.0.0-arm32+

