#!/bin/bash

# 芙蓉出海服务总部港 - 服务器部署脚本
# Lotus Overseas Service Hub - Server Deployment Script

set -e

echo "🚀 开始部署芙蓉出海服务总部港..."

# 配置变量
PROJECT_NAME="lotus-overseas"
DEPLOY_PATH="/var/www/$PROJECT_NAME"
SERVICE_NAME="lotus-overseas"
NODE_PORT=3000

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    print_error "请使用root用户运行此脚本"
    exit 1
fi

# 1. 更新系统包
print_status "更新系统包..."
apt update && apt upgrade -y

# 2. 安装必要软件
print_status "安装必要软件..."
apt install -y curl wget git nginx

# 3. 安装Node.js (使用NodeSource仓库)
print_status "安装Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

print_success "Node.js版本: $(node --version)"
print_success "NPM版本: $(npm --version)"

# 4. 创建项目目录
print_status "创建项目目录..."
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH

# 5. 如果是首次部署，克隆代码；否则拉取最新代码
if [ ! -d ".git" ]; then
    print_status "首次部署，等待代码推送..."
    print_warning "请在本地执行 git push 推送代码到服务器"
else
    print_status "拉取最新代码..."
    git pull origin main
fi

# 6. 安装依赖
print_status "安装项目依赖..."
npm install --production

# 7. 创建数据目录
print_status "创建数据目录..."
mkdir -p data logs backups

# 8. 设置权限
print_status "设置文件权限..."
chown -R www-data:www-data $DEPLOY_PATH
chmod -R 755 $DEPLOY_PATH

# 9. 创建systemd服务文件
print_status "创建系统服务..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Lotus Overseas Service Hub
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$DEPLOY_PATH
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$NODE_PORT

# 日志配置
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# 10. 配置Nginx
print_status "配置Nginx..."
cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name 8.129.110.102;
    
    # 静态文件服务
    location / {
        root $DEPLOY_PATH;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:$NODE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 管理后台
    location /admin/ {
        root $DEPLOY_PATH;
        try_files \$uri \$uri/ /admin/index.html;
    }
    
    # 安全配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 11. 启动服务
print_status "启动服务..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME
systemctl restart nginx

# 12. 检查服务状态
print_status "检查服务状态..."
sleep 3

if systemctl is-active --quiet $SERVICE_NAME; then
    print_success "Node.js服务运行正常"
else
    print_error "Node.js服务启动失败"
    systemctl status $SERVICE_NAME
fi

if systemctl is-active --quiet nginx; then
    print_success "Nginx服务运行正常"
else
    print_error "Nginx服务启动失败"
    systemctl status nginx
fi

# 13. 显示部署信息
print_success "🎉 部署完成！"
echo ""
echo "=========================================="
echo "📋 部署信息"
echo "=========================================="
echo "🌐 网站地址: http://8.129.110.102"
echo "🔧 管理后台: http://8.129.110.102/admin/"
echo "📁 项目路径: $DEPLOY_PATH"
echo "🔧 服务名称: $SERVICE_NAME"
echo "📊 端口: $NODE_PORT"
echo ""
echo "🔧 管理命令:"
echo "  启动服务: systemctl start $SERVICE_NAME"
echo "  停止服务: systemctl stop $SERVICE_NAME"
echo "  重启服务: systemctl restart $SERVICE_NAME"
echo "  查看状态: systemctl status $SERVICE_NAME"
echo "  查看日志: journalctl -u $SERVICE_NAME -f"
echo ""
echo "📝 默认管理员账号:"
echo "  用户名: admin"
echo "  密码: admin123"
echo "=========================================="