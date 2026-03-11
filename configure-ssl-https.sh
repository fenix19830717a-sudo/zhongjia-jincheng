#!/bin/bash

# 芙蓉出海服务总部港 - SSL证书配置和HTTPS设置脚本

set -e

echo "=========================================="
echo "芙蓉出海服务总部港 - SSL证书配置开始"
echo "=========================================="

# 配置变量
DOMAIN="flocaetp.com"
EMAIL="345649115@qq.com"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
SITE_CONF="flocaetp"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔐 域名: $DOMAIN"
echo "📧 邮箱: $EMAIL"
echo "📁 Nginx配置目录: $NGINX_CONF_DIR"

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请以root权限运行此脚本${NC}"
    echo "使用: sudo bash configure-ssl-https.sh"
    exit 1
fi

# 更新系统包
echo "📦 更新系统包..."
apt update

# 安装Certbot和Nginx插件
echo "🔧 安装Certbot和相关插件..."
apt install -y certbot python3-certbot-nginx

# 检查Nginx配置是否存在
if [ ! -f "$NGINX_CONF_DIR/$SITE_CONF" ]; then
    echo -e "${YELLOW}⚠️  Nginx站点配置不存在，创建基础配置...${NC}"
    
    # 创建基础HTTP配置
    cat > "$NGINX_CONF_DIR/$SITE_CONF" << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/html;
    index index.html index.htm;

    # 基础位置配置
    location / {
        try_files \$uri \$uri/ =404;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

    # 启用站点
    ln -sf "$NGINX_CONF_DIR/$SITE_CONF" "$NGINX_ENABLED_DIR/$SITE_CONF"
    
    # 测试Nginx配置
    nginx -t
    
    # 重新加载Nginx
    systemctl reload nginx
    
    echo -e "${GREEN}✅ 基础Nginx配置已创建${NC}"
fi

# 检查域名解析
echo "🌐 检查域名解析..."
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 域名解析正常${NC}"
else
    echo -e "${YELLOW}⚠️  域名解析可能存在问题${NC}"
    echo "请确保域名 $DOMAIN 已正确解析到服务器IP"
    echo "当前服务器IP: $(curl -s ifconfig.me || echo "无法获取")"
    
    read -p "是否继续SSL配置？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "SSL配置已取消"
        exit 1
    fi
fi

# 获取SSL证书
echo "🔒 获取Let's Encrypt SSL证书..."
echo "域名: $DOMAIN"
echo "邮箱: $EMAIL"

# 使用Certbot获取证书
if certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect; then
    echo -e "${GREEN}✅ SSL证书获取成功${NC}"
else
    echo -e "${RED}❌ SSL证书获取失败${NC}"
    echo "可能的原因："
    echo "1. 域名未正确解析到此服务器"
    echo "2. 防火墙阻止了80/443端口"
    echo "3. Nginx配置有误"
    echo "4. 网络连接问题"
    
    # 尝试使用standalone模式
    echo "🔄 尝试使用standalone模式获取证书..."
    systemctl stop nginx
    
    if certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive; then
        echo -e "${GREEN}✅ SSL证书获取成功（standalone模式）${NC}"
        
        # 手动配置Nginx SSL
        echo "🔧 手动配置Nginx SSL..."
        
        # 备份原配置
        cp "$NGINX_CONF_DIR/$SITE_CONF" "$NGINX_CONF_DIR/$SITE_CONF.backup"
        
        # 创建HTTPS配置
        cat > "$NGINX_CONF_DIR/$SITE_CONF" << HTTPSEOF
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    root /var/www/html;
    index index.html index.htm;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 其他安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 基础位置配置
    location / {
        try_files \$uri \$uri/ =404;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态资源缓存和GZIP
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # GZIP压缩配置
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
HTTPSEOF
        
        systemctl start nginx
    else
        echo -e "${RED}❌ SSL证书获取完全失败${NC}"
        systemctl start nginx
        exit 1
    fi
fi

# 测试Nginx配置
echo "🔍 测试Nginx配置..."
if nginx -t; then
    echo -e "${GREEN}✅ Nginx配置测试通过${NC}"
    systemctl reload nginx
else
    echo -e "${RED}❌ Nginx配置测试失败${NC}"
    exit 1
fi

# 配置自动续期
echo "🔄 配置SSL证书自动续期..."

# 创建续期脚本
cat > /usr/local/bin/renew-ssl.sh << 'RENEWEOF'
#!/bin/bash
# SSL证书自动续期脚本

echo "$(date): 开始检查SSL证书续期..." >> /var/log/ssl-renewal.log

# 尝试续期证书
if certbot renew --quiet --no-self-upgrade; then
    echo "$(date): SSL证书续期检查完成" >> /var/log/ssl-renewal.log
    
    # 重新加载Nginx
    systemctl reload nginx
    echo "$(date): Nginx已重新加载" >> /var/log/ssl-renewal.log
else
    echo "$(date): SSL证书续期失败" >> /var/log/ssl-renewal.log
fi
RENEWEOF

# 设置脚本权限
chmod +x /usr/local/bin/renew-ssl.sh

# 添加到crontab（每天凌晨2点检查）
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/renew-ssl.sh") | crontab -

echo -e "${GREEN}✅ SSL证书自动续期已配置${NC}"

# 检查防火墙设置
echo "🔥 检查防火墙设置..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 'Nginx Full'
    ufw delete allow 'Nginx HTTP' 2>/dev/null || true
    echo -e "${GREEN}✅ 防火墙规则已更新${NC}"
fi

# 验证SSL配置
echo "🔍 验证SSL配置..."
sleep 5

# 测试HTTPS连接
echo "测试HTTPS连接..."
if curl -s -I https://$DOMAIN | grep -q "HTTP/"; then
    echo -e "${GREEN}✅ HTTPS连接测试成功${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS连接测试失败，可能需要等待DNS传播${NC}"
fi

# 测试HTTP重定向
echo "测试HTTP到HTTPS重定向..."
if curl -s -I http://$DOMAIN | grep -q "301\|302"; then
    echo -e "${GREEN}✅ HTTP重定向测试成功${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP重定向可能未正确配置${NC}"
fi

# 显示SSL证书信息
echo "📋 SSL证书信息:"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
fi

echo ""
echo "=========================================="
echo "✅ SSL证书配置完成！"
echo "=========================================="
echo "🌐 HTTPS网站: https://$DOMAIN"
echo "🔒 SSL证书: Let's Encrypt"
echo "🔄 自动续期: 已配置（每日检查）"
echo "📁 证书位置: /etc/letsencrypt/live/$DOMAIN/"
echo "📝 续期日志: /var/log/ssl-renewal.log"
echo ""
echo "🔍 验证步骤:"
echo "1. 访问 https://$DOMAIN 检查HTTPS是否正常"
echo "2. 访问 http://$DOMAIN 检查是否自动重定向到HTTPS"
echo "3. 检查浏览器地址栏是否显示安全锁图标"
echo ""
echo "📝 注意事项:"
echo "- SSL证书有效期90天，已配置自动续期"
echo "- 如果域名解析有变化，可能需要重新获取证书"
echo "- 证书续期日志保存在 /var/log/ssl-renewal.log"
echo ""
echo "🎉 HTTPS配置完成！网站现在支持安全连接。"
