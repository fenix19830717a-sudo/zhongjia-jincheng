@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 📤 芙蓉出海服务总部港 - 文件上传助手
echo ========================================
echo.

echo 📋 服务器信息:
echo   IP: 8.129.110.102
echo   用户: root
echo   目标目录: /var/www/lotus-overseas/
echo.

echo 🔧 上传方式选择:
echo   1. 使用SCP命令上传 (推荐)
echo   2. 显示FTP上传信息
echo   3. 生成上传命令文件
echo   4. 退出
echo.

set /p choice="请选择上传方式 (1-4): "

if "%choice%"=="1" goto :scp_upload
if "%choice%"=="2" goto :ftp_info
if "%choice%"=="3" goto :generate_commands
if "%choice%"=="4" goto :exit

echo ❌ 无效选择
pause
goto :exit

:scp_upload
echo.
echo 📤 使用SCP上传文件...
echo.
echo 正在执行上传命令...
echo 请输入服务器密码: G7%a5rKUnBt9z?3
echo.

:: 上传所有文件
scp -r *.html *.js *.json *.md *.bat *.sh css js images data admin components root@8.129.110.102:/var/www/lotus-overseas/

if errorlevel 1 (
    echo ❌ 上传失败，请检查网络连接和服务器状态
    echo.
    echo 💡 您也可以手动执行以下命令:
    echo scp -r * root@8.129.110.102:/var/www/lotus-overseas/
) else (
    echo ✅ 文件上传成功！
    echo.
    echo 🎯 下一步: 在服务器上启动服务
    echo ssh root@8.129.110.102
    echo cd /var/www/lotus-overseas
    echo npm install --production
    echo systemctl restart lotus-overseas
    echo systemctl restart nginx
)
echo.
pause
goto :exit

:ftp_info
echo.
echo 📋 FTP上传信息:
echo.
echo 服务器地址: 8.129.110.102
echo 用户名: root
echo 密码: G7%a5rKUnBt9z?3
echo 目标目录: /var/www/lotus-overseas/
echo.
echo 📁 需要上传的文件和目录:
echo   - *.html (所有HTML文件)
echo   - *.js (JavaScript文件)
echo   - *.json (配置文件)
echo   - css/ (样式目录)
echo   - js/ (脚本目录)
echo   - images/ (图片目录)
echo   - data/ (数据目录)
echo   - admin/ (管理后台目录)
echo   - components/ (组件目录)
echo.
echo 💡 推荐FTP工具:
echo   - FileZilla (免费)
echo   - WinSCP (Windows)
echo   - Cyberduck (跨平台)
echo.
pause
goto :exit

:generate_commands
echo.
echo 📝 生成上传命令文件...
echo.

(
echo # 芙蓉出海服务总部港 - 文件上传命令
echo # 请在项目根目录执行以下命令
echo.
echo # 方式1: 上传所有文件
echo scp -r * root@8.129.110.102:/var/www/lotus-overseas/
echo.
echo # 方式2: 分别上传主要文件
echo scp *.html root@8.129.110.102:/var/www/lotus-overseas/
echo scp *.js root@8.129.110.102:/var/www/lotus-overseas/
echo scp *.json root@8.129.110.102:/var/www/lotus-overseas/
echo scp -r css root@8.129.110.102:/var/www/lotus-overseas/
echo scp -r js root@8.129.110.102:/var/www/lotus-overseas/
echo scp -r images root@8.129.110.102:/var/www/lotus-overseas/
echo scp -r data root@8.129.110.102:/var/www/lotus-overseas/
echo scp -r admin root@8.129.110.102:/var/www/lotus-overseas/
echo scp -r components root@8.129.110.102:/var/www/lotus-overseas/
echo.
echo # 上传完成后在服务器执行:
echo ssh root@8.129.110.102
echo cd /var/www/lotus-overseas
echo npm install --production
echo systemctl restart lotus-overseas
echo systemctl restart nginx
echo.
echo # 验证部署:
echo curl http://8.129.110.102/api/health
echo.
echo # 访问地址:
echo # 主网站: http://8.129.110.102
echo # 管理后台: http://8.129.110.102/admin/
) > upload-commands.txt

echo ✅ 上传命令已生成: upload-commands.txt
echo 请查看该文件获取详细上传命令
echo.
pause
goto :exit

:exit
echo.
echo 👋 感谢使用文件上传助手
pause