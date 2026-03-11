#!/bin/bash
# 芙蓉出海服务总部港 - 服务器端部署脚本

set -e

echo "========================================"
echo "  芙蓉出海服务总部港 - 服务器部署"
echo "========================================"
echo ""

# 配置
PROJECT_DIR="/root/lotus-overseas"
SERVER_PORT=3000

# 1. 创建项目目录
echo "[1/6] 创建项目目录..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo "✓ 目录创建完成: $PROJECT_DIR"
echo ""

# 2. 检查并安装 Node.js
echo "[2/6] 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "  Node.js 未安装，开始安装..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✓ Node.js: $NODE_VERSION"
echo "✓ npm: $NPM_VERSION"
echo ""

# 3. 检查项目文件
echo "[3/6] 检查项目文件..."
if [ ! -f "package.json" ]; then
    echo "⚠ 警告: 未找到 package.json"
    echo "  请先上传项目文件到 $PROJECT_DIR"
    echo ""
    echo "  上传方法："
    echo "  1. 使用 WinSCP/FileZilla 上传"
    echo "  2. 或使用 scp 命令（在本地执行）："
    echo "     scp -r * root@$(hostname -I | awk '{print $1}'):$PROJECT_DIR/"
    echo ""
    exit 1
fi
echo "✓ 项目文件已就绪"
echo ""

# 4. 安装依赖
echo "[4/6] 安装项目依赖..."
if [ -d "node_modules" ]; then
    echo "  清理旧的 node_modules..."
    rm -rf node_modules package-lock.json
fi
npm install --production
echo "✓ 依赖安装完成"
echo ""

# 5. 停止旧服务
echo "[5/6] 停止旧服务..."
pkill -f "node.*server" 2>/dev/null || true
echo "✓ 旧服务已停止"
echo ""

# 6. 启动新服务
echo "[6/6] 启动服务..."
if [ -f "server-enhanced.js" ]; then
    nohup node server-enhanced.js > server.log 2>&1 &
    SERVER_FILE="server-enhanced.js"
else
    nohup node server.js > server.log 2>&1 &
    SERVER_FILE="server.js"
fi
SERVER_PID=$!
echo "✓ 服务已启动 (PID: $SERVER_PID)"
echo ""

# 等待服务启动
sleep 3

# 检查服务状态
echo "========================================"
echo "  检查服务状态"
echo "========================================"
if ps -p $SERVER_PID > /dev/null; then
    echo "✓ 服务正在运行"
else
    echo "✗ 服务启动失败，请检查日志："
    echo "  tail -f $PROJECT_DIR/server.log"
    exit 1
fi

# 检查端口
if command -v netstat &> /dev/null; then
    if netstat -tlnp | grep -q ":$SERVER_PORT "; then
        echo "✓ 端口 $SERVER_PORT 已开放"
    fi
fi

echo ""
echo "========================================"
echo "  ✓ 部署成功！"
echo "========================================"
echo ""
echo "服务信息："
echo "  项目目录: $PROJECT_DIR"
echo "  服务文件: $SERVER_FILE"
echo "  进程 ID:  $SERVER_PID"
echo "  日志文件: $PROJECT_DIR/server.log"
echo ""
echo "访问地址："
echo "  首页:    http://$(hostname -I | awk '{print $1}'):$SERVER_PORT"
echo "  后台:    http://$(hostname -I | awk '{print $1}'):$SERVER_PORT/admin/"
echo "  账号:    admin / admin123"
echo ""
echo "常用命令："
echo "  查看日志: tail -f $PROJECT_DIR/server.log"
echo "  停止服务: pkill -f 'node.*server'"
echo "  重启服务: cd $PROJECT_DIR && pkill -f 'node.*server' && nohup node $SERVER_FILE > server.log 2>&1 &"
echo ""
