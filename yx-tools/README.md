# 🚀 Cloudflare 优选 IP 工具 (Web 管理面板版)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![GitHub Actions](https://github.com/1williamaoayers/yxtovps/workflows/Build%20and%20Publish%20Docker%20Image/badge.svg)](https://github.com/1williamaoayers/yxtovps/actions)

一个基于 Docker 的 Cloudflare CDN 节点优选工具，带有现代化的 Web 管理界面，支持自动测速、定时任务和多 Worker 节点上传。

## ✨ 核心特性

### 🎨 Web 可视化管理
- **现代化操作界面**：基于 Bootstrap 5 的响应式设计
- **实时日志流**：1 秒刷新间隔，自动滚动到最新内容
- **运行状态监控**：实时显示测速进度和任务状态
- **参数可视化配置**：无需手动编辑配置文件

### ⚡ 强大的测速引擎
- **多线程并发测速**：支持 200-500 并发（可配置）
- **IPv4/IPv6 双栈**：支持 IPv6 网络环境
- **智能筛选**：基于速度和延迟的双重过滤
- **精准测速**：调用 CloudflareST 二进制进行高性能测速

### 🔄 自动化运维
- **定时任务**：支持 Cron 表达式，自动化执行测速
- **多 Worker 上传**：测速结果自动推送到多个 Worker 节点
- **持久化存储**：测速结果和日志永久保存

## 📦 快速开始

### 前置要求
- Docker & Docker Compose
- 至少 2GB 可用内存
- 稳定的网络连接

### 部署方式

#### 🚀 方式一：使用预构建镜像（推荐，开箱即用）

如果启用了 GitHub Actions 自动构建，可以直接拉取镜像：

```bash
# 1. 创建工作目录
mkdir cloudflare-speedtest && cd cloudflare-speedtest

# 2. 下载 docker-compose.yml
curl -O https://raw.githubusercontent.com/1williamaoayers/yxtovps/main/yx-tools/docker-compose.yml

# 3. 创建数据目录
mkdir data

# 4. 启动服务
docker-compose up -d

# 5. 访问管理面板
# 浏览器打开: http://localhost:2028
```

**优点**：无需构建，直接使用，节省时间

#### 🛠️ 方式二：本地构建（开发者推荐）

适合需要修改代码或自定义功能的场景：

```bash
# 1. 克隆项目
git clone https://github.com/1williamaoayers/yxtovps.git
cd yxtovps/yx-tools

# 2. 构建并启动服务
docker-compose up -d --build

# 3. 访问管理面板
# 浏览器打开: http://localhost:2028
```

**优点**：
- 可以自由修改代码
- 由于使用了 volume 挂载，修改后重启容器即可生效（无需重新构建）
- 适合开发和调试

就这么简单！🎉

## 🎮 使用指南

### 1️⃣ 配置 Worker 节点（可选）
在 Web 界面的 **"Worker 订阅/管理 URL"** 中粘贴你的 Worker 订阅链接：
```
https://example.com/uuid-key-1
https://example2.com/uuid-key-2
```
- 每行一个 URL
- 测速结果将自动上传到这些节点
- 如果不需要上传，留空即可

### 2️⃣ 调整测速参数
| 参数 | 说明 | 推荐值 |
|------|------|--------|
| **下载速度下限** | 低于此速度的 IP 将被过滤 | 5 MB/s |
| **测试数量** | 总共测速多少个 IP | 20（路由器）/ 100（服务器）|
| **延迟阈值** | 只保留延迟低于此值的 IP | 300 ms |
| **上传数量** | 取前 N 个最快的 IP 上传 | 20 |
| **线程数** | 并发测速线程数 | 200（路由器）/ 500（服务器）|
| **IPv6** | 是否测试 IPv6 地址 | 根据网络环境决定 |

### 3️⃣ 运行测速
- **手动触发**：点击 "▶ 立即运行测速" 按钮
- **自动运行**：设置 Cron 表达式（默认每天凌晨 4 点）

### 4️⃣ 查看结果
- **优选结果表格**：显示最优的 IP、速度、延迟和地区
- **实时日志**：查看测速过程的详细输出
- **CSV 导出**：结果保存在 `data/result.csv`

## 📂 目录结构

```
yx-tools/
├── app/
│   ├── app.py              # Flask 后端服务
│   └── templates/
│       └── index.html      # Web 管理界面
├── data/                   # 持久化数据目录
│   ├── result.csv          # 最新测速结果
│   ├── app.log             # 应用日志
│   ├── status.json         # 运行状态
│   └── web_config.json     # Web 配置文件
├── cloudflare_speedtest.py # 核心测速脚本
├── requirements.txt        # Python 依赖
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 配置
└── README.md               # 本文档
```

## 🔧 高级配置

### 修改默认端口
编辑 `docker-compose.yml`：
```yaml
ports:
  - "2028:2028"  # 改为你想要的端口
```

### 持久化数据
所有重要数据存储在 `./data` 目录，映射到容器的 `/app/data`：
- `result.csv`：测速结果
- `app.log`：详细日志
- `web_config.json`：Web 配置
- `status.json`：运行状态

### Cron 表达式示例
| 表达式 | 说明 |
|--------|------|
| `0 4 * * *` | 每天凌晨 4 点 |
| `0 */6 * * *` | 每 6 小时一次 |
| `0 2 * * 0` | 每周日凌晨 2 点 |
| `*/30 * * * *` | 每 30 分钟一次 |

### 手动运行 CLI 脚本（不使用 Web）
```bash
docker exec -it cloudflare-speedtest python cloudflare_speedtest.py \
  --worker-urls "https://example.com/uuid" \
  --speed 5 \
  --count 20 \
  --delay 300
```

## 🐛 故障排除

### 1. 容器无法启动
```bash
# 查看日志
docker-compose logs -f

# 重新构建
docker-compose down
docker-compose up -d --build
```

### 2. Web 界面无法访问
- 检查端口是否被占用：`netstat -ano | findstr 2028` (Windows)
- 检查防火墙是否放行 2028 端口
- 确认容器正在运行：`docker ps`

### 3. 测速结果为空
- 检查网络连接是否正常
- 降低 `线程数` 和 `测试数量`
- 调高 `延迟阈值` 和降低 `速度下限`

### 4. Worker 上传失败
- 检查 Worker URL 格式是否正确（每行一个完整 URL）
- 查看日志中的具体报错信息
- 确认 Worker 端点可以访问

## 📊 技术栈

- **后端**：Python 3.9 + Flask
- **前端**：Bootstrap 5 + Vanilla JavaScript
- **定时任务**：APScheduler
- **测速引擎**：CloudflareST (Go 二进制)
- **容器化**：Docker + Docker Compose

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境搭建
```bash
# 克隆仓库
git clone https://github.com/yourusername/yxtovps.git
cd yxtovps/yx-tools

# 本地运行（需要 Python 3.9+）
pip install -r requirements.txt
python app/app.py
```

## 📄 许可证

MIT License - 自由使用和修改

## ⭐ 致谢

- [CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest) - 核心测速引擎
- Bootstrap 团队 - 优秀的 UI 框架

---

**💡 提示**：首次运行建议使用较小的 `测试数量` 和 `线程数` 进行测试，确认正常后再调整参数。

**🔗 相关链接**：
- [Issue 反馈](https://github.com/yourusername/yxtovps/issues)
- [更新日志](https://github.com/yourusername/yxtovps/releases)

**最后更新**: 2026-01-20
