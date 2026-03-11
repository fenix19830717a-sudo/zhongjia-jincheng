@echo off
chcp 65001 >nul
echo ========================================
echo   芙蓉出海服务总部港 - 部署脚本
echo ========================================
echo.
echo 服务器信息:
echo   IP: 8.129.110.102
echo   用户: root
echo   密码: G7%%a5rKUnBt9z?3
echo.
echo 由于 Windows SSH 不支持自动密码输入，
echo 请按照以下步骤手动部署：
echo.
echo ========================================
echo  步骤 1: 上传文件到服务器
echo ========================================
echo.
echo 方法 A: 使用 WinSCP 或 FileZilla
echo   - 连接到 8.129.110.102
echo   - 用户名: root
echo   - 密码: G7%%a5rKUnBt9z?3
echo   - 上传所有文件到 /root/lotus-overseas/
echo.
echo 方法 B: 使用 Git（如果已配置）
echo.
echo ========================================
echo  步骤 2: SSH 连接到服务器
echo ========================================
echo.
echo 运行以下命令：
echo   ssh root@8.129.110.102
echo.
echo ========================================
echo  步骤 3: 在服务器上执行部署命令
echo ========================================
echo.
echo 连接成功后，复制粘贴以下命令：
echo.
echo --------------------------------------------------
echo   # 创建目录
echo   mkdir -p /root/lotus-overseas
echo   cd /root/lotus-overseas
echo.
echo   # 检查 Node.js
echo   node --version
echo.
echo   # 如果 Node.js 未安装，执行：
echo   curl -fsSL https://rpm.nodesource.com/setup_20.x ^| bash -
echo   yum install -y nodejs
echo.
echo   # 安装依赖
echo   npm install --production
echo.
echo   # 停止旧服务
echo   pkill -f "node.*server" 2^>/dev/null ^|^| true
echo.
echo   # 启动服务
echo   nohup node server-enhanced.js ^> server.log 2^>^&1 ^&
echo.
echo   # 查看状态
echo   ps aux ^| grep node
echo   tail -f server.log
echo --------------------------------------------------
echo.
echo ========================================
echo  部署完成后访问：
echo ========================================
echo.
echo   首页: http://8.129.110.102:3000
echo   后台: http://8.129.110.102:3000/admin/
echo   账号: admin / admin123
echo.
echo ========================================
echo.
echo 详细部署指南请查看: DEPLOYMENT_GUIDE.md
echo.
pause
