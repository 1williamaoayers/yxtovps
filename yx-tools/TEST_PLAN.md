# CloudflareST ARM32 修复测试计划

## 测试目标

验证 CloudflareST 二进制文件已正确预装到 Docker 镜像中，并且在 ARM32v7 设备上可以正常运行。

## 前置条件

- GitHub Actions 构建已完成
- 新镜像已推送到 ghcr.io
- 有一台 ARM32v7 设备（如玩客云）可用于测试

## 测试环境

### 测试设备
- **设备**: 玩客云（或其他 ARM32v7 设备）
- **架构**: linux/arm/v7 (armhf)
- **Docker 版本**: 任意支持多架构的版本

### 镜像信息
- **仓库**: ghcr.io/1williamaoayers/yxtovps
- **标签**: latest
- **国内镜像**: ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

## 测试步骤

### 阶段 1: 镜像验证

#### 1.1 验证多架构支持

```bash
# 在任意设备上运行
docker manifest inspect ghcr.io/1williamaoayers/yxtovps:latest
```

**预期结果**:
- 输出包含 `linux/amd64` 和 `linux/arm/v7` 两个平台
- 每个平台都有对应的 digest

#### 1.2 拉取镜像

```bash
# 在 ARM32 设备上运行
docker pull ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

**预期结果**:
- 成功拉取镜像
- 自动选择 arm/v7 架构
- 镜像大小约 150-200MB

### 阶段 2: 容器启动测试

#### 2.1 清理旧容器

```bash
docker stop cloudflare-speedtest 2>/dev/null || true
docker rm cloudflare-speedtest 2>/dev/null || true
```

#### 2.2 启动新容器

```bash
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

**预期结果**:
- 容器成功启动
- 返回容器 ID

#### 2.3 检查容器状态

```bash
docker ps | grep cloudflare-speedtest
```

**预期结果**:
- 容器状态为 `Up`
- 端口映射显示 `0.0.0.0:2028->2028/tcp`

#### 2.4 检查容器健康状态

```bash
docker inspect cloudflare-speedtest | grep -A 5 Health
```

**预期结果**:
- Health.Status 为 `healthy`（可能需要等待 30 秒）

### 阶段 3: CloudflareST 二进制文件验证

#### 3.1 检查文件是否存在

```bash
docker exec cloudflare-speedtest ls -la /app/CloudflareST_proxy_*
```

**预期结果**:
```
-rwxr-xr-x 1 root root 8388608 Jan 20 12:00 /app/CloudflareST_proxy_linux_arm
```

**验证点**:
- ✅ 文件存在
- ✅ 文件大小约 8MB
- ✅ 文件有执行权限 (x)
- ✅ 文件名正确 (CloudflareST_proxy_linux_arm)

#### 3.2 检查文件类型

```bash
docker exec cloudflare-speedtest file /app/CloudflareST_proxy_linux_arm
```

**预期结果**:
```
/app/CloudflareST_proxy_linux_arm: ELF 32-bit LSB executable, ARM, ...
```

**验证点**:
- ✅ 文件类型为 ELF 32-bit
- ✅ 架构为 ARM

#### 3.3 测试文件可执行性

```bash
docker exec cloudflare-speedtest /app/CloudflareST_proxy_linux_arm -h
```

**预期结果**:
- 输出帮助信息
- 没有 "cannot execute binary file" 错误

### 阶段 4: 应用功能测试

#### 4.1 查看容器日志

```bash
docker logs cloudflare-speedtest
```

**预期结果**:
- 没有 "反代版本不存在" 错误
- 没有 "开始下载反代版本" 消息
- 应用正常启动
- Flask 服务器运行在 2028 端口

**关键日志检查**:
```
❌ 不应该出现: "反代版本不存在，开始下载反代版本..."
❌ 不应该出现: "正在下载: https://github.com/byJoey/CloudflareSpeedTest/..."
❌ 不应该出现: "❌ 下载失败"
✅ 应该出现: "Running on http://0.0.0.0:2028"
```

#### 4.2 访问 Web 界面

```bash
# 在浏览器中访问
http://玩客云IP:2028
```

**预期结果**:
- 页面正常加载
- 显示配置表单
- 显示"立即运行测速"按钮

#### 4.3 运行测速测试

1. 在 Web 界面中点击"立即运行测速"按钮
2. 等待测速完成（约 2-5 分钟）

**预期结果**:
- 测速任务开始执行
- 状态显示"正在运行测速中..."
- 测速完成后显示"测速并上报成功 ✅"

#### 4.4 查看测速日志

```bash
docker exec cloudflare-speedtest tail -n 100 /app/data/app.log
```

**预期结果**:
- 日志显示测速过程
- 没有 CloudflareST 相关错误
- 显示测速结果

**关键日志检查**:
```
✅ 应该出现: "🚀 Starting new speedtest job..."
✅ 应该出现: "Executing: python3 -u /app/cloudflare_speedtest.py..."
✅ 应该出现: "✅ Speedtest job completed."
❌ 不应该出现: "❌ Speedtest job failed"
❌ 不应该出现: "未找到反代版本文件"
```

### 阶段 5: 数据持久化测试

#### 5.1 检查数据目录

```bash
ls -la data/
```

**预期结果**:
- 存在 `result.csv` 文件（测速结果）
- 存在 `app.log` 文件（应用日志）
- 存在 `web_config.json` 文件（配置）
- 存在 `status.json` 文件（状态）

#### 5.2 重启容器测试

```bash
docker restart cloudflare-speedtest
sleep 10
docker logs cloudflare-speedtest
```

**预期结果**:
- 容器成功重启
- 配置保持不变
- 历史数据仍然存在

### 阶段 6: 性能测试

#### 6.1 测试响应时间

```bash
time curl -s http://localhost:2028/ > /dev/null
```

**预期结果**:
- 响应时间 < 2 秒

#### 6.2 测试内存使用

```bash
docker stats cloudflare-speedtest --no-stream
```

**预期结果**:
- 内存使用 < 200MB（空闲时）
- 内存使用 < 500MB（测速时）

#### 6.3 测试 CPU 使用

```bash
docker stats cloudflare-speedtest --no-stream
```

**预期结果**:
- CPU 使用 < 10%（空闲时）
- CPU 使用 < 80%（测速时）

## 测试检查清单

### 构建阶段
- [ ] GitHub Actions 构建成功
- [ ] 两个平台都构建成功（amd64, arm/v7）
- [ ] 镜像推送到 GHCR 成功
- [ ] 构建日志显示 CloudflareST 下载成功

### 部署阶段
- [ ] 镜像拉取成功
- [ ] 容器启动成功
- [ ] 容器健康检查通过
- [ ] Web 界面可访问

### 功能阶段
- [ ] CloudflareST 二进制文件存在
- [ ] CloudflareST 文件可执行
- [ ] 测速功能正常工作
- [ ] 没有下载错误
- [ ] 结果正确保存

### 性能阶段
- [ ] 响应时间正常
- [ ] 内存使用合理
- [ ] CPU 使用合理
- [ ] 数据持久化正常

## 失败场景处理

### 场景 1: CloudflareST 文件不存在

**症状**:
```bash
docker exec cloudflare-speedtest ls -la /app/CloudflareST_proxy_*
# 输出: No such file or directory
```

**诊断步骤**:
1. 检查构建日志中的 CloudflareST 下载部分
2. 查看是否有下载或解压错误
3. 验证 tar.gz 文件的内容

**解决方案**:
- 查看 GitHub Actions 构建日志
- 检查 Dockerfile 中的下载逻辑
- 可能需要调整提取逻辑

### 场景 2: 测速时仍然尝试下载

**症状**:
```
反代版本不存在，开始下载反代版本...
```

**诊断步骤**:
1. 检查文件名是否匹配
2. 检查文件权限
3. 检查工作目录

**解决方案**:
- 验证文件名格式
- 确保文件在 /app 目录
- 检查 cloudflare_speedtest.py 的查找逻辑

### 场景 3: 二进制文件无法执行

**症状**:
```
cannot execute binary file: Exec format error
```

**诊断步骤**:
1. 检查文件架构
2. 验证是否下载了正确的版本

**解决方案**:
- 确认 dpkg --print-architecture 返回 armhf
- 验证下载的是 arm 版本而不是 amd64

## 测试报告模板

```markdown
# CloudflareST ARM32 修复测试报告

## 测试信息
- **测试日期**: YYYY-MM-DD
- **测试人员**: [姓名]
- **测试设备**: [设备型号]
- **镜像版本**: [commit hash]

## 测试结果

### 阶段 1: 镜像验证
- [ ] 通过 / [ ] 失败
- 备注: 

### 阶段 2: 容器启动
- [ ] 通过 / [ ] 失败
- 备注:

### 阶段 3: 二进制文件验证
- [ ] 通过 / [ ] 失败
- 备注:

### 阶段 4: 功能测试
- [ ] 通过 / [ ] 失败
- 备注:

### 阶段 5: 数据持久化
- [ ] 通过 / [ ] 失败
- 备注:

### 阶段 6: 性能测试
- [ ] 通过 / [ ] 失败
- 备注:

## 总体评估
- [ ] 所有测试通过，可以发布
- [ ] 部分测试失败，需要修复
- [ ] 大部分测试失败，需要重新设计

## 问题和建议
[列出发现的问题和改进建议]
```

---

**文档版本**: 1.0
**最后更新**: 2026-01-20
