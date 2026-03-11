# 快速部署指南

## 🚀 5 步完成部署

### 第 1 步：连接服务器
打开 Windows PowerShell 或 CMD，执行：
```bash
ssh root@8.129.110.102
```
密码：`G7%a5rKUnBt9z?3`

### 第 2 步：上传项目文件
**使用 WinSCP 或 FileZilla（推荐）**
- 主机：`8.129.110.102`
- 端口：`22`
- 用户名：`root`
- 密码：`G7%a5rKUnBt9z?3`
- 将所有文件上传到：`/root/lotus-overseas/`

### 第 3 步：在服务器上执行部署
连接到服务器后，执行：
```bash
cd /root/lotus-overseas
chmod +x setup-server.sh
./setup-server.sh
```

### 第 4 步：开放防火墙（如需要）
```bash
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

### 第 5 步：访问网站
- **首页**: http://8.129.110.102:3000
- **后台**: http://8.129.110.102:3000/admin/
- **账号**: `admin` / `admin123`

---

## 📋 如果第 3 步的脚本不工作，手动执行：

```bash
cd /root/lotus-overseas

# 1. 安装 Node.js（如果没有）
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 2. 安装依赖
npm install --production

# 3. 停止旧服务
pkill -f "node.*server" 2>/dev/null || true

# 4. 启动服务
nohup node server-enhanced.js > server.log 2>&1 &

# 5. 查看状态
ps aux | grep node
tail -f server.log
```

---

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `tail -f /root/lotus-overseas/server.log` | 查看实时日志 |
| `pkill -f "node.*server"` | 停止服务 |
| `cd /root/lotus-overseas && nohup node server-enhanced.js > server.log 2>&1 &` | 重启服务 |
| `ps aux \| grep node` | 查看进程状态 |

---

## 📚 更多信息

详细部署文档请查看：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
