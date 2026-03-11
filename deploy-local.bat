@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 芙蓉出海服务总部港 - 本地部署助手
echo ========================================
echo.

echo 📋 服务器信息:
echo   IP: 8.129.110.102
echo   用户: root
echo   密码: G7%a5rKUnBt9z?3
echo.

echo 🔧 部署选项:
echo   1. 查看部署指南
echo   2. 准备部署文件
echo   3. 生成服务器命令
echo   4. 退出
echo.

set /p choice="请选择操作 (1-4): "

if "%choice%"=="1" goto :show_guide
if "%choice%"=="2" goto :prepare_files
if "%choice%"=="3" goto :generate_commands
if "%choice%"=="4" goto :exit

echo ❌ 无效选择
pause
goto :exit

:show_guide
echo.
echo 📖 部署指南已创建: DEPLOYMENT_STEPS.md
echo 请查看该文件获取详细部署步骤
echo.
pause
goto :exit

:prepare_files
echo.
echo 📦 准备部署文件...
echo.

:: 检查必要文件
if not exist "deploy.sh" (
    echo ❌ deploy.sh 文件不存在
    pause
    goto :exit
)

if not exist "server.js" (
    echo ❌ server.js 文件不存在
    pause
    goto :exit
)

if not exist "package.json" (
    echo ❌ package.json 文件不存在
    pause
    goto :exit
)

echo ✅ 所有必要文件已准备就绪
echo.
echo 📋 需要上传到服务器的文件:
echo   - deploy.sh (部署脚本)
echo   - server.js (主服务器文件)
echo   - server-deploy.js (生产服务器文件)
echo   - package.json (依赖配置)
echo   - 所有HTML、CSS、JS文件
echo   - images/ 目录
echo   - data/ 目录 (如果存在)
echo.
pause
goto :exit

:generate_commands
echo.
echo 📝 生成服务器执行命令...
echo.

(
echo # 芙蓉出海服务总部港 - 服务器部署命令
echo # 请在服务器上依次执行以下命令
echo.
echo # 1. 连接到服务器
echo ssh root@8.129.110.102
echo.
echo # 2. 创建项目目录
echo mkdir -p /var/www/lotus-overseas
echo cd /var/www/lotus-overseas
echo.
echo # 3. 上传 deploy.sh 后执行
echo chmod +x deploy.sh
echo ./deploy.sh
echo.
echo # 4. 上传所有项目文件后执行
echo npm install --production
echo systemctl restart lotus-overseas
echo systemctl restart nginx
echo.
echo # 5. 检查服务状态
echo systemctl status lotus-overseas
echo systemctl status nginx
echo.
echo # 6. 测试访问
echo curl http://8.129.110.102/api/health
echo.
echo # 访问地址:
echo # 主网站: http://8.129.110.102
echo # 管理后台: http://8.129.110.102/admin/
echo # 默认账号: admin / admin123
) > server-commands.txt

echo ✅ 服务器命令已生成: server-commands.txt
echo 请将此文件内容复制到服务器执行
echo.
pause
goto :exit

:exit
echo.
echo 👋 感谢使用芙蓉出海服务总部港部署助手
pause