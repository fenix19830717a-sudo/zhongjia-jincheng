# ✅ 芙蓉出海服务总部港 - 部署检查清单

## 🎯 部署步骤总览

### ☐ 第一步: 服务器环境配置
1. ☐ 连接到服务器: `ssh root@8.129.110.102`
2. ☐ 执行环境配置脚本 (见 SIMPLE_DEPLOY.md)
3. ☐ 确认Node.js和Nginx安装成功

### ☐ 第二步: 上传项目文件  
1. ☐ 使用SCP或FTP上传所有文件到 `/var/www/lotus-overseas/`
2. ☐ 确认所有目录和文件都已上传完整

### ☐ 第三步: 启动服务
1. ☐ 安装依赖: `npm install --production`
2. ☐ 启动服务: `systemctl start lotus-overseas`
3. ☐ 重启Nginx: `systemctl restart nginx`

### ☐ 第四步: 验证部署
1. ☐ 检查服务状态: `systemctl status lotus-overseas`
2. ☐ 测试API: `curl http://8.129.110.102/api/health`
3. ☐ 访问网站: http://8.129.110.102
4. ☐ 访问管理后台: http://8.129.110.102/admin/

---

## 🚀 快速部署 (我来指导您)

由于我无法直接连接您的服务器，让我为您提供最详细的指导：

### 1️⃣ 现在就开始 - 连接服务器
请打开终端/命令行，输入：
```bash
ssh root@8.129.110.102
```
密码: `G7%a5rKUnBt9z?3`

### 2️⃣ 复制粘贴执行环境配置
连接成功后，请告诉我，我会给您提供完整的配置命令。

### 3️⃣ 上传文件
我已经准备了上传助手脚本 `upload-files.bat`，您可以：
- 运行该脚本选择上传方式
- 或直接使用: `scp -r * root@8.129.110.102:/var/www/lotus-overseas/`

### 4️⃣ 启动服务
文件上传后，我会指导您启动所有服务。

---

## 📋 需要上传的文件清单

### 必需文件 ✅
- ☐ `index.html` - 主页
- ☐ `server.js` - 服务器文件
- ☐ `package.json` - 依赖配置

### 目录结构 ✅
- ☐ `admin/` - 管理后台
  - ☐ `admin/index.html`
  - ☐ `admin/login.html`
- ☐ `css/` - 样式文件
  - ☐ `css/style.css`
- ☐ `js/` - JavaScript文件
  - ☐ `js/main.js`
  - ☐ `js/admin-enhanced.js`
  - ☐ `js/i18n.js`
- ☐ `images/` - 图片资源 (所有图片文件)
- ☐ `data/` - 数据文件
  - ☐ `data/content.json`
  - ☐ `data/inquiries.json`
  - ☐ `data/news.json`
  - ☐ `data/tools.json`
- ☐ `components/` - 组件文件
  - ☐ `components/footer.html`
  - ☐ `components/navbar.html`

### 其他页面 ✅
- ☐ `about.html`
- ☐ `cases.html`
- ☐ `contact.html`
- ☐ `domestic.html`
- ☐ `keyway.html`
- ☐ `news.html`
- ☐ `overseas.html`
- ☐ `tools.html`

---

## 🔧 常见问题解决

### Q: 连接服务器失败
A: 检查网络连接，确认IP地址和密码正确

### Q: 文件上传失败  
A: 尝试分批上传，或使用FTP工具

### Q: 服务启动失败
A: 检查日志 `journalctl -u lotus-overseas -n 50`

### Q: 网站无法访问
A: 检查防火墙设置，确认80端口开放

---

## 📞 实时支持

请告诉我您当前的进度：
1. "我已连接到服务器" - 我会提供环境配置命令
2. "环境配置完成" - 我会指导文件上传
3. "文件上传完成" - 我会指导服务启动
4. "遇到错误: [具体错误信息]" - 我会帮您解决

让我们一步步完成部署！🚀