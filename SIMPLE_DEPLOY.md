# 🚀 超简单部署指南 - 5分钟完成

## 📋 准备工作
- 服务器: 8.129.110.102
- 用户: root  
- 密码: G7%a5rKUnBt9z?3

## 🎯 一键部署 (复制粘贴即可)

### 步骤1: 连接服务器
打开终端/命令行，输入：
```bash
ssh root@8.129.110.102
```
输入密码: `G7%a5rKUnBt9z?3`

### 步骤2: 执行一键部署脚本
连接成功后，复制粘贴以下命令：

```bash
# 更新系统并安装必要软件
apt update && apt upgrade -y
apt install -y curl wget git nginx

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 创建项目目录
mkdir -p /var/www/lotus-overseas
cd /var/www/lotus-overseas

# 创建基本的package.json
cat > package.json << 'EOF'
{
  "name": "lotus-overseas-backend",
  "version": "1.0.0",
  "description": "芙蓉出海服务总部港后端API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# 安装依赖
npm install --production

# 创建数据目录
mkdir -p data logs backups

# 创建系统服务
cat > /etc/systemd/system/lotus-overseas.service << 'EOF'
[Unit]
Description=Lotus Overseas Service Hub
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lotus-overseas
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=lotus-overseas

[Install]
WantedBy=multi-user.target
EOF

# 配置Nginx
cat > /etc/nginx/sites-available/lotus-overseas << 'EOF'
server {
    listen 80;
    server_name 8.129.110.102;
    
    location / {
        root /var/www/lotus-overseas;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /admin/ {
        root /var/www/lotus-overseas;
        try_files $uri $uri/ /admin/index.html;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/lotus-overseas /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 设置权限
chown -R www-data:www-data /var/www/lotus-overseas
chmod -R 755 /var/www/lotus-overseas

echo "✅ 服务器环境配置完成！"
echo "📤 现在需要上传项目文件..."
```

### 步骤3: 上传项目文件
现在服务器环境已配置好，您需要将本地项目文件上传到服务器。

**方式A: 使用SCP命令 (推荐)**
在本地电脑打开新的终端，在项目目录下执行：
```bash
scp -r * root@8.129.110.102:/var/www/lotus-overseas/
```

**方式B: 使用FTP工具**
使用FileZilla等FTP工具，将所有文件上传到 `/var/www/lotus-overseas/`

### 步骤4: 启动服务
文件上传完成后，回到服务器终端执行：
```bash
cd /var/www/lotus-overseas

# 重新安装依赖（确保完整）
npm install --production

# 启动服务
systemctl daemon-reload
systemctl enable lotus-overseas
systemctl start lotus-overseas
systemctl restart nginx

# 检查服务状态
systemctl status lotus-overseas
systemctl status nginx

echo "🎉 部署完成！"
echo "🌐 网站地址: http://8.129.110.102"
echo "🔧 管理后台: http://8.129.110.102/admin/"
echo "👤 默认账号: admin / admin123"
```

## 🔍 验证部署
打开浏览器访问：
- http://8.129.110.102 (主网站)
- http://8.129.110.102/admin/ (管理后台)
- http://8.129.110.102/api/health (API测试)

## 🚨 如果遇到问题

### 服务无法启动
```bash
# 查看详细日志
journalctl -u lotus-overseas -n 50

# 手动测试
cd /var/www/lotus-overseas
node server.js
```

### 网站无法访问
```bash
# 检查Nginx状态
systemctl status nginx

# 检查端口
netstat -tlnp | grep :80
netstat -tlnp | grep :3000
```

### 权限问题
```bash
# 重新设置权限
chown -R www-data:www-data /var/www/lotus-overseas
chmod -R 755 /var/www/lotus-overseas
```

---

## 📞 需要帮助？
如果遇到任何问题，请告诉我具体的错误信息，我会帮您解决！