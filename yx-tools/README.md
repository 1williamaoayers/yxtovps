# 🚀 Cloudflare 优选 IP 工具 (Web 管理面板版)

一个基于 Docker 的 Cloudflare CDN 节点优选工具，带有 Web 管理界面。

---

## 📦 一键部署

```bash
# 创建目录
mkdir -p /home/yxtovps/data
cd /home/yxtovps

# 启动容器
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v /home/yxtovps/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

浏览器打开：**http://IP地址:2028**

---

## 🔧 常用命令

```bash
# 查看日志
docker logs -f cloudflare-speedtest

# 重启
docker restart cloudflare-speedtest

# 停止
docker stop cloudflare-speedtest

# 删除容器（数据保留）
docker rm -f cloudflare-speedtest

# 删除镜像
docker rmi ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 删除数据
rm -rf /home/yxtovps/data
```

---

## ❓ 故障排除

- **无法访问**：检查防火墙是否放行 2028 端口
- **测速为空**：降低线程数和测试数量
- **上传失败**：检查 Worker URL 格式

---

**最后更新**: 2026-01-21
