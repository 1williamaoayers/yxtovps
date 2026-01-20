# 故障排除指南

本文档提供了 Cloudflare 优选 IP 工具在不同架构设备上的常见问题和解决方案。

## 目录

- [镜像源选择](#镜像源选择)
- [架构相关问题](#架构相关问题)
- [部署问题](#部署问题)
- [运行时问题](#运行时问题)
- [性能问题](#性能问题)
- [网络问题](#网络问题)

## 镜像源选择

### 国内用户推荐使用南京大学镜像源

**为什么使用镜像源？**
- GitHub Container Registry (ghcr.io) 在国内访问速度较慢
- 南京大学提供的 ghcr.nju.edu.cn 镜像源在国内速度更快
- 镜像内容完全相同，只是下载源不同

**如何使用？**

将所有命令中的 `ghcr.io` 替换为 `ghcr.nju.edu.cn`：

```bash
# 官方源（国际用户）
ghcr.io/1williamaoayers/yxtovps:latest

# 南京大学镜像源（国内用户）
ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

**示例**：

```bash
# 国内用户拉取镜像
docker pull ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 国内用户运行容器
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

**其他国内镜像源**：
- 南京大学：`ghcr.nju.edu.cn`
- 上海交通大学：`ghcr.sjtu.edu.cn`（如果南大源不可用）

**验证镜像**：
```bash
# 检查镜像是否正确
docker image inspect ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest | grep Architecture
```

## 架构相关问题

### 问题 1：exec format error

**错误信息**：
```
exec /usr/local/bin/python: exec format error
```

**原因**：
Docker 拉取了错误架构的镜像，例如在 ARM32 设备上拉取了 AMD64 镜像。

**解决方案**：

1. 检查设备架构：
```bash
uname -m
# ARM32v7 设备应显示：armv7l
# AMD64 设备应显示：x86_64
```

2. 删除错误的镜像和容器：
```bash
docker rm -f cloudflare-speedtest
docker rmi ghcr.io/1williamaoayers/yxtovps:latest
```

3. 手动指定平台拉取：
```bash
# ARM32v7 设备
docker pull --platform linux/arm/v7 ghcr.io/1williamaoayers/yxtovps:latest

# AMD64 设备
docker pull --platform linux/amd64 ghcr.io/1williamaoayers/yxtovps:latest
```

4. 重新运行容器：
```bash
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest
```

### 问题 2：验证镜像架构

**如何检查镜像是否支持多架构**：

```bash
# 查看镜像清单
docker manifest inspect ghcr.io/1williamaoayers/yxtovps:latest

# 输出应包含：
# {
#   "architecture": "amd64",
#   "os": "linux"
# }
# 和
# {
#   "architecture": "arm",
#   "variant": "v7",
#   "os": "linux"
# }
```

**检查当前运行容器的架构**：
```bash
docker inspect cloudflare-speedtest | grep Architecture
```

## 部署问题

### 问题 3：端口已被占用

**错误信息**：
```
Error starting userland proxy: listen tcp4 0.0.0.0:2028: bind: address already in use
```

**解决方案**：

1. 检查端口占用：
```bash
# Linux
netstat -tuln | grep 2028
lsof -i :2028

# Windows
netstat -ano | findstr 2028
```

2. 停止占用端口的进程或使用其他端口：
```bash
# 使用其他端口（例如 8080）
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 8080:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest
```

### 问题 4：数据卷权限错误

**错误信息**：
```
PermissionError: [Errno 13] Permission denied: '/app/data/web_config.json'
```

**原因**：
容器内的应用无法写入挂载的数据目录。

**解决方案**：

1. 修改数据目录权限：
```bash
chmod -R 777 ./data
```

2. 或者以 root 用户运行容器：
```bash
docker run -d \
  --user root \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest
```

3. 或者创建目录时设置正确权限：
```bash
mkdir -p data
chmod 777 data
```

### 问题 5：容器无法启动

**检查步骤**：

1. 查看容器状态：
```bash
docker ps -a | grep cloudflare-speedtest
```

2. 查看容器日志：
```bash
docker logs cloudflare-speedtest
```

3. 查看详细错误信息：
```bash
docker inspect cloudflare-speedtest
```

4. 检查健康状态：
```bash
docker inspect cloudflare-speedtest | grep -A 10 Health
```

## 运行时问题

### 问题 6：Web 界面无法访问

**检查清单**：

1. 确认容器正在运行：
```bash
docker ps | grep cloudflare-speedtest
```

2. 检查端口映射：
```bash
docker port cloudflare-speedtest
# 应显示：2028/tcp -> 0.0.0.0:2028
```

3. 测试本地访问：
```bash
curl http://localhost:2028/
```

4. 检查防火墙：
```bash
# Linux (iptables)
sudo iptables -L -n | grep 2028

# Linux (firewalld)
sudo firewall-cmd --list-ports

# 开放端口
sudo firewall-cmd --add-port=2028/tcp --permanent
sudo firewall-cmd --reload
```

5. 检查容器网络：
```bash
docker network inspect bridge
```

### 问题 7：测速结果为空

**可能原因和解决方案**：

1. **网络连接问题**：
```bash
# 进入容器测试网络
docker exec -it cloudflare-speedtest ping -c 4 1.1.1.1
docker exec -it cloudflare-speedtest curl -I https://www.cloudflare.com
```

2. **参数配置过于严格**：
- 降低速度下限（例如从 10 MB/s 降到 3 MB/s）
- 提高延迟阈值（例如从 200ms 提高到 500ms）
- 减少测试数量（例如从 100 降到 20）

3. **查看详细日志**：
```bash
docker logs -f cloudflare-speedtest
# 或查看应用日志
docker exec cloudflare-speedtest cat /app/data/app.log
```

### 问题 8：定时任务不执行

**检查步骤**：

1. 验证 Cron 表达式：
```bash
# 使用在线工具验证：https://crontab.guru/
# 例如：0 4 * * * 表示每天凌晨 4 点
```

2. 检查时区设置：
```bash
docker exec cloudflare-speedtest date
# 应显示正确的时区时间
```

3. 查看调度器日志：
```bash
docker logs cloudflare-speedtest | grep -i scheduler
docker logs cloudflare-speedtest | grep -i cron
```

4. 手动触发测试验证功能：
- 访问 Web 界面
- 点击"立即运行测速"按钮
- 观察是否正常执行

## 性能问题

### 问题 9：ARM32 设备内存不足

**症状**：
- 容器频繁重启
- 测速过程中崩溃
- 系统响应缓慢

**解决方案**：

1. 检查内存使用：
```bash
free -h
docker stats cloudflare-speedtest
```

2. 优化配置参数（玩客云推荐）：
```json
{
  "count": 20,          // 测试数量：20-30
  "thread": 100,        // 线程数：100-150
  "speed": 3,           // 速度下限：3-5 MB/s
  "delay": 300,         // 延迟阈值：300ms
  "upload_count": 10    // 上传数量：10
}
```

3. 限制容器内存使用：
```bash
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  --memory="256m" \
  --memory-swap="512m" \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest
```

4. 关闭其他不必要的服务：
```bash
docker ps
# 停止不需要的容器
docker stop <container_name>
```

### 问题 10：构建速度慢

**针对本地构建的优化**：

1. 使用构建缓存：
```bash
docker-compose build --no-cache  # 首次构建
docker-compose build             # 后续构建使用缓存
```

2. 使用 BuildKit：
```bash
export DOCKER_BUILDKIT=1
docker build -t cloudflare-speedtest .
```

3. 多阶段构建已优化，无需额外操作。

## 网络问题

### 问题 11：Worker 上传失败

**错误信息**：
```
Failed to upload to worker: Connection timeout
Failed to upload to worker: 404 Not Found
```

**解决方案**：

1. 验证 Worker URL 格式：
```
正确格式：https://example.com/uuid-key
错误格式：example.com/uuid-key（缺少 https://）
```

2. 测试 Worker 端点：
```bash
docker exec cloudflare-speedtest curl -I https://your-worker-url.com/uuid
```

3. 检查网络连接：
```bash
docker exec cloudflare-speedtest ping -c 4 your-worker-domain.com
```

4. 查看详细错误日志：
```bash
docker exec cloudflare-speedtest cat /app/data/app.log | grep -i worker
```

### 问题 12：DNS 解析失败

**症状**：
- 无法连接到 Cloudflare
- 测速失败

**解决方案**：

1. 测试 DNS 解析：
```bash
docker exec cloudflare-speedtest nslookup cloudflare.com
```

2. 使用自定义 DNS：
```bash
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  --dns 8.8.8.8 \
  --dns 1.1.1.1 \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest
```

## 日志和调试

### 查看日志的方法

1. **容器标准输出日志**：
```bash
docker logs cloudflare-speedtest
docker logs -f cloudflare-speedtest  # 实时跟踪
docker logs --tail 100 cloudflare-speedtest  # 最后 100 行
```

2. **应用日志文件**：
```bash
# 查看应用日志
docker exec cloudflare-speedtest cat /app/data/app.log

# 实时跟踪应用日志
docker exec cloudflare-speedtest tail -f /app/data/app.log
```

3. **运行状态**：
```bash
docker exec cloudflare-speedtest cat /app/data/status.json
```

4. **配置文件**：
```bash
docker exec cloudflare-speedtest cat /app/data/web_config.json
```

### 进入容器调试

```bash
# 进入容器 shell
docker exec -it cloudflare-speedtest /bin/bash

# 或使用 sh（如果 bash 不可用）
docker exec -it cloudflare-speedtest /bin/sh

# 在容器内执行命令
docker exec cloudflare-speedtest python --version
docker exec cloudflare-speedtest ls -la /app/data
```

## 获取帮助

如果以上方法都无法解决问题，请：

1. **收集信息**：
```bash
# 系统信息
uname -a
docker version
docker info

# 容器信息
docker ps -a
docker logs cloudflare-speedtest > logs.txt
docker inspect cloudflare-speedtest > inspect.txt
```

2. **提交 Issue**：
- 访问：https://github.com/1williamaoayers/yxtovps/issues
- 提供详细的错误信息和日志
- 说明设备架构和操作系统版本

3. **社区支持**：
- 查看已有的 Issues 和 Discussions
- 搜索相似问题的解决方案

---

**最后更新**：2026-01-20
