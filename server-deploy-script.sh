#!/bin/bash

# 芙蓉出海服务总部港 - 一键部署脚本
echo "🚀 开始部署芙蓉出海服务总部港..."

# 更新系统
echo "📦 更新系统包..."
apt update && apt upgrade -y

# 安装必要软件
echo "🔧 安装必要软件..."
apt install -y curl wget git nginx

# 安装Node.js
echo "📦 安装Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ NPM版本: $(npm --version)"

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /var/www/lotus-overseas
cd /var/www/lotus-overseas

# 创建package.json
echo "📝 创建package.json..."
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
echo "📦 安装项目依赖..."
npm install --production

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data logs backups

# 创建基本的server.js文件
echo "📝 创建基本服务器文件..."
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    message: '芙蓉出海服务总部港 API 运行正常'
  });
});

// 基本路由
app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 芙蓉出海服务总部港</h1>
    <p>服务器运行正常！</p>
    <p>API健康检查: <a href="/api/health">/api/health</a></p>
    <p>时间: ${new Date().toLocaleString()}</p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 芙蓉出海服务总部港服务器启动成功`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🌐 访问地址: http://8.129.110.102`);
  console.log(`🔧 API健康检查: http://8.129.110.102/api/health`);
});
EOF

# 创建系统服务
echo "🔧 创建系统服务..."
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
echo "🌐 配置Nginx..."
cat > /etc/nginx/sites-available/lotus-overseas << 'EOF'
server {
    listen 80;
    server_name 8.129.110.102;
    
    location / {
        root /var/www/lotus-overseas;
        try_files $uri $uri/ @proxy;
        index index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location @proxy {
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
        try_files $uri $uri/ @proxy;
    }
}
EOF

# 启用站点
echo "🔗 启用Nginx站点..."
ln -sf /etc/nginx/sites-available/lotus-overseas /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
echo "🧪 测试Nginx配置..."
nginx -t

# 设置权限
echo "🔐 设置文件权限..."
chown -R www-data:www-data /var/www/lotus-overseas
chmod -R 755 /var/www/lotus-overseas

# 启动服务
echo "🚀 启动服务..."
systemctl daemon-reload
systemctl enable lotus-overseas
systemctl start lotus-overseas
systemctl restart nginx

# 等待服务启动
sleep 3

# 检查服务状态
echo "🔍 检查服务状态..."
if systemctl is-active --quiet lotus-overseas; then
    echo "✅ Node.js服务运行正常"
else
    echo "❌ Node.js服务启动失败"
    systemctl status lotus-overseas
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx服务运行正常"
else
    echo "❌ Nginx服务启动失败"
    systemctl status nginx
fi

# 测试API
echo "🧪 测试API连接..."
curl -s http://localhost:3000/api/health || echo "API测试失败"

echo ""
echo "🎉 基础部署完成！"
echo "=========================================="
echo "📋 部署信息"
echo "=========================================="
echo "🌐 网站地址: http://8.129.110.102"
echo "🔧 API测试: http://8.129.110.102/api/health"
echo "📁 项目路径: /var/www/lotus-overseas"
echo "🔧 服务名称: lotus-overseas"
echo "📊 端口: 3000"
echo ""
echo "🔧 管理命令:"
echo "  查看状态: systemctl status lotus-overseas"
echo "  重启服务: systemctl restart lotus-overseas"
echo "  查看日志: journalctl -u lotus-overseas -f"
echo ""
echo "📤 下一步: 上传您的网站文件到 /var/www/lotus-overseas/"
echo "=========================================="