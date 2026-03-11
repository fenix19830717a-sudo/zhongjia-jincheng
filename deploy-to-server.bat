@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 芙蓉出海服务总部港 - 服务器部署
echo ========================================
echo.

:: 检查Git状态
echo 📋 检查Git状态...
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo ❌ 当前目录不是Git仓库
    pause
    exit /b 1
)

:: 添加所有文件到Git
echo 📦 添加文件到Git...
git add .

:: 提交更改
set /p commit_msg="💬 请输入提交信息 (默认: 更新网站): "
if "%commit_msg%"=="" set commit_msg=更新网站

echo 📝 提交更改...
git commit -m "%commit_msg%"

:: 检查是否有远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ⚠️  未配置远程仓库，将直接部署到服务器
    goto :deploy_direct
)

:: 推送到远程仓库
echo 🔄 推送到远程仓库...
git push origin main
if errorlevel 1 (
    echo ❌ 推送失败，将直接部署到服务器
    goto :deploy_direct
)

echo ✅ 代码已推送到远程仓库
goto :deploy_server

:deploy_direct
echo 📤 准备直接部署到服务器...

:deploy_server
echo.
echo ========================================
echo 🌐 部署到服务器
echo ========================================
echo.
echo 服务器信息:
echo   IP: 8.129.110.102
echo   用户: root
echo.

:: 询问是否继续部署
set /p deploy_confirm="是否继续部署到服务器? (y/N): "
if /i not "%deploy_confirm%"=="y" (
    echo 🚫 部署已取消
    pause
    exit /b 0
)

echo.
echo 🔧 部署步骤:
echo   1. 将代码上传到服务器
echo   2. 安装依赖
echo   3. 配置Nginx
echo   4. 启动服务
echo.

:: 创建临时部署脚本
echo 📝 创建部署脚本...
(
echo #!/bin/bash
echo cd /var/www/lotus-overseas
echo git pull origin main ^|^| echo "Git pull failed, using uploaded files"
echo npm install --production
echo systemctl restart lotus-overseas
echo systemctl restart nginx
echo echo "✅ 部署完成"
echo echo "🌐 网站地址: http://8.129.110.102"
echo echo "🔧 管理后台: http://8.129.110.102/admin/"
) > temp_deploy.sh

echo.
echo 📋 接下来需要手动执行以下步骤:
echo.
echo 1. 连接到服务器:
echo    ssh root@8.129.110.102
echo.
echo 2. 首次部署时，执行以下命令:
echo    mkdir -p /var/www/lotus-overseas
echo    cd /var/www/lotus-overseas
echo    git init
echo    git remote add origin [您的Git仓库地址]
echo.
echo 3. 上传并运行部署脚本:
echo    # 将 deploy.sh 上传到服务器
echo    chmod +x deploy.sh
echo    ./deploy.sh
echo.
echo 4. 或者手动部署:
echo    # 将项目文件上传到 /var/www/lotus-overseas
echo    npm install --production
echo    chmod +x deploy.sh
echo    ./deploy.sh
echo.

:: 清理临时文件
del temp_deploy.sh >nul 2>&1

echo ========================================
echo 📋 部署信息
echo ========================================
echo 🌐 网站地址: http://8.129.110.102
echo 🔧 管理后台: http://8.129.110.102/admin/
echo 👤 默认账号: admin / admin123
echo ========================================
echo.

pause