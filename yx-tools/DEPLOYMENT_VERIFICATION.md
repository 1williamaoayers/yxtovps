# 部署验证指南

本文档提供了验证 ARM32v7 多架构 Docker 镜像部署的详细步骤。

## 📋 验证清单

### 1. GitHub Actions 构建验证

#### 1.1 检查构建状态

访问 GitHub Actions 页面：
```
https://github.com/1williamaoayers/yxtovps/actions
```

**验证项**：
- ✅ 最新的 workflow 运行状态为"成功"（绿色勾号）
- ✅ 构建日志显示两个平台都成功构建：
  - `linux/amd64`
  - `linux/arm/v7`
- ✅ 镜像成功推送到 ghcr.io

#### 1.2 查看构建日志

点击最新的 workflow 运行 → "build-and-push" job

**关键日志检查**：
```
✅ 设置 QEMU - 成功
✅ 设置 Docker Buildx - 成功
✅ 登录到 GitHub Container Registry - 成功
✅ 构建并推送 Docker 镜像 - 成功
  - Building for linux/amd64
  - Building for linux/arm/v7
✅ 生成镜像摘要 - 成功
```

### 2. 镜像仓库验证

#### 2.1 检查 GitHub Packages

访问：
```
https://github.com/1williamaoayers/yxtovps/pkgs/container/yxtovps
```

**验证项**：
- ✅ 镜像可见性为 Public
- ✅ 最新标签 `latest` 存在
- ✅ 镜像大小合理（约 140-160MB）
- ✅ 最后更新时间为最近

#### 2.2 验证多架构支持

在本地执行：
```bash
# 国际用户
docker manifest inspect ghcr.io/1williamaoayers/yxtovps:latest

# 国内用户（使用南京大学镜像源）
docker manifest inspect ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

**预期输出**：
```json
{
  "manifests": [
    {
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      }
    },
    {
      "platform": {
        "architecture": "arm",
        "variant": "v7",
        "os": "linux"
      }
    }
  ]
}
```

### 3. AMD64 设备部署验证

#### 3.1 拉取镜像

```bash
# 国际用户
docker pull ghcr.io/1williamaoayers/yxtovps:latest

# 国内用户（推荐使用南京大学镜像源）
docker pull ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

**验证**：
```bash
# 检查镜像架构（根据使用的镜像源调整命令）
docker image inspect ghcr.io/1williamaoayers/yxtovps:latest | grep Architecture
# 或
docker image inspect ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest | grep Architecture
# 应显示: "Architecture": "amd64"
```

#### 3.2 运行容器

```bash
docker run -d \
  --name cloudflare-speedtest-test \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/test-data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest
```

#### 3.3 功能测试

**1. 检查容器状态**：
```bash
docker ps | grep cloudflare-speedtest-test
# 应显示容器正在运行
```

**2. 检查健康状态**：
```bash
docker inspect cloudflare-speedtest-test | grep -A 5 Health
# 应显示: "Status": "healthy"
```

**3. 访问 Web 界面**：
```bash
curl http://localhost:2028/
# 应返回 HTML 内容
```

或在浏览器中打开：`http://localhost:2028`

**4. 检查日志**：
```bash
docker logs cloudflare-speedtest-test
# 应显示 Flask 应用启动日志
```

**5. 测试 API 端点**：
```bash
# 获取配置
curl http://localhost:2028/api/config

# 获取状态
curl http://localhost:2028/api/status
```

**6. 测试数据持久化**：
```bash
# 检查数据目录
ls -la test-data/
# 应包含: web_config.json, status.json, app.log
```

#### 3.4 清理测试环境

```bash
docker stop cloudflare-speedtest-test
docker rm cloudflare-speedtest-test
rm -rf test-data
```

### 4. ARM32v7 设备部署验证（玩客云）

#### 4.1 准备工作

**SSH 登录到玩客云**：
```bash
ssh root@玩客云IP
```

**检查设备架构**：
```bash
uname -m
# 应显示: armv7l
```

**检查 Docker 版本**：
```bash
docker --version
# 确保 Docker 已安装
```

#### 4.2 拉取镜像

```bash
# 国内用户推荐使用南京大学镜像源（速度更快）
docker pull ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 国际用户使用官方源
# docker pull ghcr.io/1williamaoayers/yxtovps:latest
```

**验证架构**：
```bash
# 根据使用的镜像源调整命令
docker image inspect ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest | grep Architecture
# 应显示: "Architecture": "arm"

docker image inspect ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest | grep Variant
# 应显示: "Variant": "v7"
```

#### 4.3 运行容器

```bash
# 创建工作目录
mkdir -p /opt/cloudflare-speedtest
cd /opt/cloudflare-speedtest

# 运行容器（国内用户推荐使用南京大学镜像源）
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 国际用户使用官方源
# ghcr.io/1williamaoayers/yxtovps:latest
```

#### 4.4 功能测试

**1. 检查容器状态**：
```bash
docker ps | grep cloudflare-speedtest
```

**2. 检查资源使用**：
```bash
# 内存使用
docker stats cloudflare-speedtest --no-stream

# 系统内存
free -h
```

**3. 访问 Web 界面**：
在浏览器中打开：`http://玩客云IP:2028`

**4. 执行测速测试**：
- 在 Web 界面中配置参数：
  - 测试数量：20
  - 线程数：100
  - 速度下限：3 MB/s
  - 延迟阈值：300ms
- 点击"立即运行测速"
- 观察日志输出
- 等待测速完成
- 检查结果表格

**5. 检查日志**：
```bash
docker logs -f cloudflare-speedtest
```

**6. 验证数据持久化**：
```bash
ls -la data/
cat data/result.csv
cat data/app.log
```

**7. 测试容器重启**：
```bash
docker restart cloudflare-speedtest
# 等待 10 秒
docker ps | grep cloudflare-speedtest
# 访问 Web 界面确认配置保留
```

### 5. 性能基准测试

#### 5.1 镜像大小对比

```bash
docker images | grep yxtovps
```

**预期**：
- AMD64: ~150MB
- ARM32v7: ~140MB

#### 5.2 启动时间测试

```bash
time docker run --rm ghcr.io/1williamaoayers/yxtovps:latest python --version
```

**预期**：
- AMD64: < 2 秒
- ARM32v7: < 5 秒

#### 5.3 内存使用测试

```bash
docker stats cloudflare-speedtest --no-stream
```

**预期**：
- 空闲状态: 50-80MB
- 测速运行: 100-200MB（取决于配置）

### 6. 故障排除验证

#### 6.1 测试架构不匹配场景

```bash
# 尝试手动指定错误架构（应该失败）
docker run --platform linux/arm64 ghcr.io/1williamaoayers/yxtovps:latest
# 预期: 错误信息提示不支持该架构
```

#### 6.2 测试端口冲突

```bash
# 启动第二个容器使用相同端口（应该失败）
docker run -d -p 2028:2028 ghcr.io/1williamaoayers/yxtovps:latest
# 预期: 错误信息提示端口已被占用
```

#### 6.3 测试数据卷权限

```bash
# 创建只读目录
mkdir -p readonly-data
chmod 444 readonly-data

# 尝试挂载（应该失败或无法写入）
docker run -d -v $(pwd)/readonly-data:/app/data ghcr.io/1williamaoayers/yxtovps:latest
# 检查日志应显示权限错误
```

### 7. 文档验证

#### 7.1 README.md 验证

**检查项**：
- ✅ 多架构支持徽章显示
- ✅ 玩客云部署章节完整
- ✅ 部署命令正确
- ✅ 故障排除章节包含 ARM32 问题

#### 7.2 TROUBLESHOOTING.md 验证

**检查项**：
- ✅ 架构不匹配问题有解决方案
- ✅ 玩客云特定问题有说明
- ✅ 所有命令可执行
- ✅ 日志示例准确

#### 7.3 CHANGELOG.md 验证

**检查项**：
- ✅ 记录了所有重要变更
- ✅ 迁移指南清晰
- ✅ 版本号和日期正确

### 8. 回归测试

#### 8.1 验证现有功能未受影响

**测试项**：
- ✅ 手动触发测速功能正常
- ✅ 定时任务配置正常
- ✅ Worker 上传功能正常
- ✅ 配置保存和加载正常
- ✅ 日志记录正常

#### 8.2 验证 docker-compose 部署

```bash
# 下载 docker-compose.yml
curl -O https://raw.githubusercontent.com/1williamaoayers/yxtovps/main/yx-tools/docker-compose.yml

# 启动服务
docker-compose up -d

# 验证运行
docker-compose ps
docker-compose logs

# 清理
docker-compose down
```

## 📊 验证报告模板

### 构建验证

- [ ] GitHub Actions 构建成功
- [ ] 两个平台都成功构建
- [ ] 镜像成功推送到 ghcr.io
- [ ] 多架构 manifest 正确

### AMD64 部署验证

- [ ] 镜像拉取成功
- [ ] 容器启动成功
- [ ] Web 界面可访问
- [ ] 健康检查通过
- [ ] 数据持久化正常
- [ ] 所有 API 端点正常

### ARM32v7 部署验证

- [ ] 镜像拉取成功（正确架构）
- [ ] 容器启动成功
- [ ] Web 界面可访问
- [ ] 测速功能正常
- [ ] 内存使用合理
- [ ] 数据持久化正常
- [ ] 容器重启后配置保留

### 文档验证

- [ ] README.md 更新完整
- [ ] TROUBLESHOOTING.md 准确
- [ ] CHANGELOG.md 记录完整
- [ ] docker-compose.yml 正确

### 性能验证

- [ ] 镜像大小合理
- [ ] 启动时间可接受
- [ ] 内存使用正常
- [ ] CPU 使用正常

## 🐛 已知问题

记录在验证过程中发现的任何问题：

1. **问题描述**：
   - 影响范围：
   - 解决方案：
   - 状态：

## ✅ 验证结论

- **构建状态**：✅ 通过 / ❌ 失败
- **AMD64 部署**：✅ 通过 / ❌ 失败
- **ARM32v7 部署**：✅ 通过 / ❌ 失败
- **文档完整性**：✅ 通过 / ❌ 失败
- **性能表现**：✅ 通过 / ❌ 失败

**总体评估**：✅ 可以发布 / ❌ 需要修复

---

**验证人员**：
**验证日期**：
**版本**：v1.0.0-arm32

