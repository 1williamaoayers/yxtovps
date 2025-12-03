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

客户端负责在你本地网络环境下进行测速，并将结果告诉服务端。

1. **下载项目**:
   - 下载本项目代码，解压。
   - 找到 `yx-tools` 文件夹，将其上传到你的 NAS 或服务器。

2. **配置 Docker**:
   - 打开 `yx-tools` 文件夹中的 `docker-compose.yml`。
   - 确保配置如下 (初学者建议直接使用构建模式):

   ```yaml
   services:
     cloudflare-speedtest:
       image: ghcr.io/1williamaoayers/yx-tools:latest
       container_name: cloudflare-speedtest
       restart: unless-stopped
       network_mode: host  # 建议使用 host 模式以获得更准确的测速结果
       volumes:
         - ./data:/app/data
       environment:
         - TZ=Asia/Shanghai
         # 自动运行配置 (建议开启)
         - CRON_SCHEDULE=0 */6 * * *  # 每6小时运行一次
         # 填写你在第一步获取的管理地址 (用于自动上传)
         # 注意：如果脚本未支持环境变量，请使用下方的交互模式
         # - WORKER_URL=https://你的Worker域名/你的UUID
       tty: true
       stdin_open: true
   ```

3. **启动容器**:
   - 在 `yx-tools` 目录下打开终端 (SSH)。
   - 运行命令: `docker-compose up -d`
   - 等待构建完成并启动。

4. **首次运行与配置**:
   - 查看日志或进入容器配置 (如果脚本需要交互):
     `docker attach cloudflare-speedtest`
   - 按照提示选择 "Cloudflare Workers API" 上报。
   - 输入你的 Worker 管理地址。
   - 配置完成后，程序会自动保存配置。
   - 按 `Ctrl+P`, `Ctrl+Q` 退出容器但不停止它。

---

## 📖 使用说明

### 获取订阅链接
部署好服务端并成功上传一次 IP 后，你可以使用以下格式的订阅链接：

- **通用订阅**: `https://你的Worker域名/你的UUID/sub`
- **Clash**: `https://你的Worker域名/你的UUID/sub?format=clash` (如果你的转换后端支持)
- **指定优选**: 
  - 默认使用你上传的优选 IP。
  - 也可以手动指定: `...?domain=优选域名`

### 常见问题

1. **为什么 Worker 提示 "KV存储未配置"?**
   - 请检查第一步中是否正确绑定了 KV，且变量名必须为 `C`。

2. **客户端测速很慢?**
   - 确保 NAS 网络正常。
   - 尝试在 `docker-compose.yml` 中启用 `network_mode: host`。

3. **如何查看已上传的 IP?**
   - 访问你的管理地址 `https://你的Worker域名/你的UUID`，在面板中可以查看当前生效的优选 IP 列表。

---

## 🛠️ 高级配置

- **修改测速参数**: 编辑 `yx-tools/cloudflare_speedtest.py` 或相关配置文件。
- **自定义优选域名**: 在 Worker 代码开头修改 `directDomains` 列表。

