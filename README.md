# Cloudflare Worker 优选 IP 订阅生成器 (All-in-One)

这是一个完整的 Cloudflare 优选 IP 解决方案，包含服务端（Worker）和客户端（NAS/Docker）。
它可以帮助你在本地（NAS/电脑）自动筛选最佳的 Cloudflare IP，并上传到你的 Worker，生成专属的优选 IP 订阅链接。

## ✨ 功能特点

- **服务端 (Worker)**: 
  - 提供 VLESS/Trojan/VMess 订阅生成。
  - 支持 KV 存储，接收并保存客户端上传的优选 IP。
  - 提供 API 接口供客户端自动上传。
  - 内置 UUID 认证，防止恶意篡改。

- **客户端 (Docker)**: 
  - 基于 CloudflareSpeedTest 的高性能测速。
  - 自动筛选延迟最低、速度最快的 IP。
  - **全自动模式**: 测速后自动通过 API 上传到服务端。
  - 支持 Docker Compose 一键部署，适合 NAS 用户。

---

## 🚀 部署指南 (保姆级教程)

### 第一步：部署服务端 (Cloudflare Worker)

1. **注册/登录 Cloudflare**: 访问 [dash.cloudflare.com](https://dash.cloudflare.com)。
2. **创建 Worker**:
   - 点击左侧 "Workers & Pages" -> "Create Application" -> "Create Worker"。
   - 命名为 `best-ip` (或者你喜欢的名字) -> "Deploy"。
3. **部署代码**:
   - 点击 "Edit code"。
   - 将本项目根目录下的 `_worker.js` 内容完全复制并覆盖到编辑器中。
   - 点击右上角 "Deploy"。
4. **创建 KV 命名空间 (重要)**:
   - 回到 Worker 详情页 (点击左上角名字返回)。
   - 点击 "Settings" -> "Variables" -> "KV Namespace Bindings"。
   - 点击 "Add Binding" -> "Create new KV Namespace"。
   - 名字输入 `best-ip-kv` -> "Add"。
   - **关键一步**: Variable name (变量名) 必须填 **`C`** (大写C)。
   - 点击 "Save and deploy"。
5. **设置 UUID (认证密钥)**:
   - 在 "Settings" -> "Variables" -> "Environment Variables"。
   - 点击 "Add Variable"。
   - Variable name: `UUID`
   - Value: 生成一个 UUID (可以在线生成，如 `550e8400-e29b-41d4-a716-446655440000`)。
   - 点击 "Save and deploy"。
6. **获取管理地址**:
   - 你的管理地址格式为: `https://你的Worker域名/你的UUID`
   - 例如: `https://best-ip.user.workers.dev/550e8400-e29b-41d4-a716-446655440000`
   - 访问这个地址，你应该能看到控制面板。

---

### 第二步：部署客户端 (NAS / Docker)

客户端负责在你本地网络环境下进行测速，并将结果告诉服务端。这里提供最简单、适合小白的部署方式（参考自 [yx-tools](https://github.com/1williamaoayers/yx-tools)）。

> **特别说明**：我们的镜像已经集成了所有主流设备架构（包括 x86/amd64 的普通电脑、arm64 的树莓派/Mac、以及 arm32 的玩客云等），**Docker 会自动识别你的设备并拉取正确的版本**。

#### 方法一：后台运行 + 定时任务 (最推荐)

适合长期挂在 **NAS、树莓派、软路由** 上，每天自动测速并上传结果。

**1. 默认部署 (推荐)**
直接在 SSH 终端中运行以下命令（数据会保存在当前目录下）：

```bash
# 启动容器（后台运行，重启自动恢复）
# ⚠️ 注意：务必挂载 config 目录，否则重建容器后定时任务会丢失！
docker run -d --name cloudflare-speedtest \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/config \
  --restart unless-stopped \
  --network host \
  ghcr.io/1williamaoayers/yx-tools:latest
```
*注：建议加上 `--network host` 以获得更准确的测速结果。*

**2. 自定义目录部署 (想放哪里放哪里)**
如果你想指定数据存放位置（例如 `/home/yx`）：

1.  先创建文件夹：
    ```bash
    mkdir -p /home/yx
    ```
2.  运行命令：
    ```bash
    docker run -d --name cloudflare-speedtest \
      -v /home/yx/data:/app/data \
      -v /home/yx/config:/app/config \
      --restart unless-stopped \
      --network host \
      ghcr.io/1williamaoayers/yx-tools:latest
    ```

#### 方法二：Docker Compose (NAS 用户常用)

如果你习惯使用 Portainer 或 Docker Compose：

```yaml
version: '3.8'
services:
  cloudflare-speedtest:
    image: ghcr.io/1williamaoayers/yx-tools:latest
    container_name: cloudflare-speedtest
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./data:/app/data
      - ./config:/app/config
    environment:
      - TZ=Asia/Shanghai
    tty: true
    stdin_open: true
```

---

### 第三步：配置自动上传

无论你用哪种方式启动了容器，都需要进行一次初始化配置，告诉客户端把结果上传到哪里。

1.  **进入容器配置菜单**:
    在 SSH 终端运行：
    ```bash
    docker exec -it cloudflare-speedtest python3 /app/cloudflare_speedtest.py
    ```

2.  **设置上传地址**:
    - 菜单中选择 **"5. 结果上报设置"** (或类似选项)。
    - 选择 **"Cloudflare Workers API"**。
    - 输入你在 **第一步** 获取的 **Worker 管理地址** (例如 `https://my-worker.dev/my-uuid`)。
    - 确认保存。

3.  **设置定时任务**:
    - 再次运行配置命令 (如果你退出了)。
    - 选择 **"4. 设置定时任务"**。
    - 按提示选择时间（例如每天凌晨 4 点），脚本会自动设置好 Cron 任务。

---

## ❓ 常见问题 (FAQ) & 避坑指南

**Q: 启动容器后为什么没有出现配置菜单？/ 日志提示"检测到非交互式环境"？**
A: 这是因为使用了 `-d` 参数让容器在**后台静默运行**。
- **正确做法**：先让容器在后台跑着，然后通过命令 `docker exec -it cloudflare-speedtest python3 /app/cloudflare_speedtest.py` 进入容器进行配置。

**Q: 怎么看每天有没有自动测速？**
A: 有两种方法：
1. **查看容器日志** (推荐)：
   ```bash
   docker logs --tail 50 cloudflare-speedtest
   ```
2. **查看 Worker 面板**：
   访问你的 Worker 管理地址，看 "最后更新时间" 是否变化。

**Q: 我是玩客云/机顶盒 (ARM32)，需要自己下载二进制文件吗？**
A: **完全不需要！** Docker 镜像已经内置了专门为 ARM32 编译好的核心组件，自动识别架构。

**Q: 为什么 Worker 提示 "KV存储未配置"?**
A: 请检查 Cloudflare 后台 Worker 设置中，是否正确绑定了 KV 命名空间，且变量名必须为 `C`。

**Q: 客户端测速很慢?**
A: 确保 NAS/服务器网络正常；尝试在启动命令或 Compose 中启用 `host` 网络模式 (`--network host`)。

---

## 🛠️ 高级配置

- **修改测速参数**: 编辑 `yx-tools/cloudflare_speedtest.py` 或相关配置文件。
- **自定义优选域名**: 在 Worker 代码开头修改 `directDomains` 列表。

---

## 🙏 致谢

- 感谢 [joeyblog](https://github.com/byJoey/cfnew) 的项目提供的灵感与基础。

如果本项目对你有帮助，请点击右上角的 ⭐ Star 支持一下！

<!-- Last updated: 2025-12-03 -->
