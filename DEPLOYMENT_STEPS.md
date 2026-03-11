# 芙蓉出海服务总部港 - 服务器部署指南

## 服务器信息
- **服务器IP**: 8.129.110.102
- **用户**: root
- **密码**: G7%a5rKUnBt9z?3

## 部署方式选择

### 方式一：自动化部署（推荐）
使用我们准备好的部署脚本进行一键部署。

### 方式二：手动部署
逐步手动执行部署命令。

---

## 方式一：自动化部署步骤

### 1. 连接到服务器
```bash
ssh root@8.129.110.102
# 输入密码: G7%a5rKUnBt9z?3
```

### 2. 创建项目目录并上传部署脚本
```bash
mkdir -p /var/www/lotus-overseas
cd /var/www/lotus-overseas
```

### 3. 上传 deploy.sh 脚本到服务器
将本地的 `deploy.sh` 文件上传到服务器的 `/var/www/lotus-overseas/` 目录

### 4. 执行部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. 上传项目文件
将整个项目文件夹上传到 `/var/www/lotus-overseas/`

### 6. 安装依赖并启动服务
```bash
npm install --production
systemctl restart lotus-overseas
systemctl restart nginx
```

---

## 方式二：手动部署步骤

### 1. 连接服务器
```bash
ssh root@8.129.110.102
```

### 2. 更新系统
```bash
apt update && apt upgrade -y
```

### 3. 安装必要软件
```bash
apt install -y curl wget git nginx
```

### 4. 安装 Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### 5. 创建项目目录
```bash
mkdir -p /var/www/lotus-overseas
cd /var/www/lotus-overseas
```

### 6. 上传项目文件
将所有项目文件上传到 `/var/www/lotus-overseas/`

### 7. 安装依赖
```bash
npm install --production
```

### 8. 创建系统服务
```bash
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
```

### 9. 配置 Nginx
```bash
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
```

### 10. 启用站点
```bash
ln -sf /etc/nginx/sites-available/lotus-overseas /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
```

### 11. 设置权限
```bash
chown -R www-data:www-data /var/www/lotus-overseas
chmod -R 755 /var/www/lotus-overseas
```

### 12. 启动服务
```bash
systemctl daemon-reload
systemctl enable lotus-overseas
systemctl start lotus-overseas
systemctl restart nginx
```

### 13. 检查服务状态
```bash
systemctl status lotus-overseas
systemctl status nginx
```

---

## 部署完成后验证

### 1. 检查网站访问
- 主网站: http://8.129.110.102
- 管理后台: http://8.129.110.102/admin/

### 2. 检查API接口
```bash
curl http://8.129.110.102/api/health
```

### 3. 默认管理员账号
- 用户名: admin
- 密码: admin123

---

## 常用管理命令

### 服务管理
```bash
# 启动服务
systemctl start lotus-overseas

# 停止服务
systemctl stop lotus-overseas

# 重启服务
systemctl restart lotus-overseas

# 查看服务状态
systemctl status lotus-overseas

# 查看服务日志
journalctl -u lotus-overseas -f
```

### Nginx管理
```bash
# 重启Nginx
systemctl restart nginx

# 重新加载配置
systemctl reload nginx

# 测试配置
nginx -t
```

---

## 故障排除

### 1. 服务无法启动
```bash
# 查看详细日志
journalctl -u lotus-overseas -n 50

# 检查端口占用
netstat -tlnp | grep :3000

# 手动启动测试
cd /var/www/lotus-overseas
node server.js
```

### 2. Nginx配置问题
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 3. 权限问题
```bash
# 重新设置权限
chown -R www-data:www-data /var/www/lotus-overseas
chmod -R 755 /var/www/lotus-overseas
```

---

## 更新部署

### 1. 更新代码
```bash
cd /var/www/lotus-overseas
# 上传新的文件或使用git pull
git pull origin main
```

### 2. 重启服务
```bash
npm install --production
systemctl restart lotus-overseas
```

---

## 备份建议

### 1. 数据备份
```bash
# 备份数据目录
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/lotus-overseas/data/
```

### 2. 配置备份
```bash
# 备份Nginx配置
cp /etc/nginx/sites-available/lotus-overseas /root/nginx-backup.conf

# 备份系统服务配置
cp /etc/systemd/system/lotus-overseas.service /root/service-backup.service
```