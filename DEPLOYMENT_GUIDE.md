# 芙蓉出海服务总部港 - 部署指南

## 服务器信息
- **IP**: 8.129.110.102
- **用户名**: root
- **密码**: G7%a5rKUnBt9z?3
- **部署目录**: /root/lotus-overseas

## 方法一：手动部署（推荐）

### 步骤 1: 连接到服务器
```bash
ssh root@8.129.110.102
# 输入密码: G7%a5rKUnBt9z?3
```

### 步骤 2: 检查服务器环境
```bash
# 检查 Node.js
node --version

# 如果未安装 Node.js，执行以下命令安装：
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 步骤 3: 在服务器上创建目录
```bash
mkdir -p /root/lotus-overseas
cd /root/lotus-overseas
```

### 步骤 4: 上传项目文件到服务器

在本地电脑（Windows PowerShell）执行：
```powershell
# 使用 scp 上传（需要先在本地执行）
scp -r * root@8.129.110.102:/root/lotus-overseas/
```

或者使用 WinSCP / FileZilla 等工具上传。

### 步骤 5: 在服务器上安装依赖
```bash
cd /root/lotus-overseas
npm install --production
```

### 步骤 6: 启动服务
```bash
# 停止旧服务（如果正在运行）
pkill -f "node.*server" 2>/dev/null || true

# 使用 nohup 后台启动服务
nohup node server-enhanced.js > server.log 2>&1 &

# 查看服务状态
ps aux | grep node

# 查看日志
tail -f server.log
```

### 步骤 7: 配置防火墙（如需要）
```bash
# 开放 3000 端口
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# 或者使用 iptables
iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
service iptables save
```

## 方法二：使用 PM2 管理进程（推荐生产环境）

### 安装 PM2
```bash
npm install -g pm2
```

### 使用 PM2 启动服务
```bash
cd /root/lotus-overseas
pm2 start server-enhanced.js --name lotus-overseas

# 查看状态
pm2 status

# 查看日志
pm2 logs lotus-overseas

# 设置开机自启
pm2 startup
pm2 save
```

## 访问网站

部署完成后，可以通过以下地址访问：

- **首页**: http://8.129.110.102:3000
- **管理后台**: http://8.129.110.102:3000/admin/
- **默认管理员账号**: admin / admin123

## 项目结构

```
/root/lotus-overseas/
├── admin/              # 管理后台页面
├── components/         # 通用组件
├── css/                # 样式文件
├── data/               # 数据存储（JSON文件）
├── images/             # 图片资源
├── js/                 # JavaScript文件
├── *.html              # 前端页面
├── server.js           # 基础版后端
├── server-enhanced.js  # 增强版后端（推荐使用）
├── package.json        # 项目配置
└── server.log          # 运行日志
```

## 故障排查

### 服务无法启动
```bash
# 检查端口是否被占用
netstat -tlnp | grep 3000

# 查看详细错误日志
cat server.log
```

### 依赖安装失败
```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --production
```

### 权限问题
```bash
# 确保目录权限正确
chmod -R 755 /root/lotus-overseas
```
