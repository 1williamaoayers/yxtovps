# 更新日志

本文档记录了 Cloudflare 优选 IP 工具的所有重要更新和变更。

## [未发布] - 2026-01-20

### 新增 ✨

- **多架构支持**：新增 ARM32v7 (armv7l) 架构支持，现在支持：
  - linux/amd64 (x86_64) - 标准 PC、服务器
  - linux/arm/v7 (armv7l) - 玩客云、树莓派等 ARM32 设备
- **自动架构识别**：Docker 自动选择与设备架构匹配的镜像
- **玩客云专用部署指南**：添加针对玩客云设备的详细部署说明和优化建议
- **健康检查**：Dockerfile 中添加 HEALTHCHECK 指令，自动监控容器健康状态
- **故障排除文档**：新增 TROUBLESHOOTING.md，提供详细的问题诊断和解决方案

### 改进 🚀

- **GitHub Actions 工作流**：
  - 添加 QEMU 支持，实现跨架构构建
  - 配置多平台构建：linux/amd64 和 linux/arm/v7
  - 优化构建缓存策略，加快构建速度
  - 添加 pull_request 触发器，支持 PR 预览构建
- **Dockerfile 优化**：
  - 添加 OCI 标准的镜像标签（title, description, source, licenses）
  - 优化 apt-get 命令，使用 --no-install-recommends 减少镜像大小
  - 改进层结构，提高构建缓存命中率
  - 添加健康检查端点
- **docker-compose.yml 更新**：
  - 默认使用预构建的 ghcr.io 镜像
  - 添加健康检查配置
  - 添加 ARM32 设备内存限制选项（注释形式）
  - 添加自定义 DNS 配置选项（注释形式）
  - 添加多架构说明注释
- **README.md 增强**：
  - 添加多架构支持徽章
  - 新增玩客云专用部署章节
  - 扩展故障排除部分，包含 ARM32 特定问题
  - 添加架构验证命令
  - 更新部署说明，强调多架构支持

### 文档 📚

- 新增 `TROUBLESHOOTING.md` - 详细的故障排除指南
- 新增 `CHANGELOG.md` - 版本更新日志
- 更新 `README.md` - 添加多架构和玩客云部署说明

### 技术细节 🔧

- **基础镜像**：python:3.9-slim（官方多架构镜像）
- **构建工具**：Docker Buildx + QEMU
- **镜像仓库**：GitHub Container Registry (ghcr.io)
- **支持平台**：
  - linux/amd64
  - linux/arm/v7
- **镜像大小**：
  - AMD64: ~150MB
  - ARM32v7: ~140MB

### 迁移指南 📖

#### 从旧版本升级

如果你之前使用的是本地构建或旧版镜像，请按以下步骤升级：

1. **停止并删除旧容器**：
```bash
docker stop cloudflare-speedtest
docker rm cloudflare-speedtest
```

2. **备份数据**（可选）：
```bash
cp -r ./data ./data.backup
```

3. **拉取新的多架构镜像**：
```bash
docker pull ghcr.io/1williamaoayers/yxtovps:latest
```

4. **启动新容器**：
```bash
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest
```

5. **验证运行状态**：
```bash
docker ps | grep cloudflare-speedtest
docker logs cloudflare-speedtest
```

#### ARM32 设备首次部署

玩客云等 ARM32 设备用户可以直接使用相同的命令部署，Docker 会自动选择 ARM32v7 架构的镜像。

**推荐配置**（玩客云）：
- 测试数量：20-30
- 线程数：100-150
- 速度下限：3-5 MB/s
- 延迟阈值：300ms

### 已知问题 ⚠️

- ARM32 设备上首次构建可能需要较长时间（建议直接使用预构建镜像）
- 玩客云等低内存设备建议限制测试数量和线程数，避免内存不足

### 贡献者 👥

感谢所有为本次更新做出贡献的开发者！

---

## 版本说明

本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)规范。

版本格式：`主版本号.次版本号.修订号`

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

---

**最后更新**：2026-01-20
