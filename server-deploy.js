/**
 * 中嘉锦铭国际贸易 - 生产环境服务器
 * Production Server for Lotus Overseas Service Hub
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const os = require('os');

// 生产环境配置
const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'production',
  workers: process.env.WORKERS || os.cpus().length,
  dataDir: path.join(__dirname, 'data'),
  logsDir: path.join(__dirname, 'logs'),
  backupDir: path.join(__dirname, 'backups')
};

// 集群模式启动
if (cluster.isMaster && config.env === 'production') {
  console.log(`🚀 启动主进程 ${process.pid}`);
  console.log(`📊 启动 ${config.workers} 个工作进程`);
  
  // 启动工作进程
  for (let i = 0; i < config.workers; i++) {
    cluster.fork();
  }
  
  // 工作进程异常退出时重启
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  工作进程 ${worker.process.pid} 退出`);
    console.log('🔄 启动新的工作进程');
    cluster.fork();
  });
  
} else {
  // 工作进程
  startServer();
}

function startServer() {
  const app = express();
  
  // 确保目录存在
  [config.dataDir, config.logsDir, config.backupDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // 数据文件路径
  const FILES = {
    inquiries: path.join(config.dataDir, 'inquiries.json'),
    news: path.join(config.dataDir, 'news.json'),
    tools: path.join(config.dataDir, 'tools.json'),
    settings: path.join(config.dataDir, 'settings.json'),
    logs: path.join(config.logsDir, 'activity.json'),
    users: path.join(config.dataDir, 'users.json')
  };
  
  // 初始化数据
  initData();
  
  // 中间件
  app.use(cors({
    origin: config.env === 'production' ? ['http://8.129.110.102', 'https://8.129.110.102'] : true,
    credentials: true
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // 请求日志
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.url} - ${req.ip}`);
    next();
  });
  
  // 静态文件服务（开发环境）
  if (config.env !== 'production') {
    app.use(express.static(__dirname));
  }
  
  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      env: config.env
    });
  });
  
  // 认证中间件
  function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      next();
    } else {
      // 生产环境需要认证，开发环境跳过
      if (config.env === 'production') {
        return res.status(401).json({ message: '需要认证' });
      }
      next();
    }
  }
  
  // 通用数据操作函数
  function readData(file) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error(`读取文件失败: ${file}`, error);
      return [];
    }
  }
  
  function writeData(file, data) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`写入文件失败: ${file}`, error);
      return false;
    }
  }
  
  // 记录操作日志
  function logActivity(action, details, admin = '系统') {
    try {
      const logs = readData(FILES.logs);
      logs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action,
        details,
        admin,
        ip: 'server',
        pid: process.pid
      });
      
      // 只保留最近1000条日志
      if (logs.length > 1000) {
        logs.splice(1000);
      }
      
      writeData(FILES.logs, logs);
    } catch (error) {
      console.error('记录日志失败:', error);
    }
  }
  
  // ===== API 路由 =====
  
  // 认证API
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = readData(FILES.users);
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // 更新最后登录时间
      user.lastLogin = new Date().toISOString();
      writeData(FILES.users, users);
      
      // 生成简单token
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      logActivity('用户登录', { username: user.username, role: user.role }, user.name);
      
      res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, role: user.role }
      });
    } else {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  });
  
  // 咨询API
  app.get('/api/inquiries', (req, res) => {
    const data = readData(FILES.inquiries);
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(data);
  });
  
  app.post('/api/inquiries', (req, res) => {
    const data = readData(FILES.inquiries);
    const newItem = {
      id: Date.now(),
      ...req.body,
      status: req.body.status || 'pending',
      createdAt: new Date().toISOString()
    };
    data.push(newItem);
    
    if (writeData(FILES.inquiries, data)) {
      logActivity('新增咨询', { id: newItem.id, company: newItem.company });
      res.json(newItem);
    } else {
      res.status(500).json({ message: '保存失败' });
    }
  });
  
  app.patch('/api/inquiries/:id', authMiddleware, (req, res) => {
    const data = readData(FILES.inquiries);
    const index = data.findIndex(i => String(i.id) === req.params.id);
    
    if (index >= 0) {
      data[index] = { ...data[index], ...req.body };
      if (writeData(FILES.inquiries, data)) {
        logActivity('更新咨询', { id: data[index].id, changes: req.body });
        res.json(data[index]);
      } else {
        res.status(500).json({ message: '保存失败' });
      }
    } else {
      res.status(404).json({ message: '未找到' });
    }
  });
  
  // 新闻API
  app.get('/api/news', (req, res) => {
    const data = readData(FILES.news);
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(data);
  });
  
  app.post('/api/news', authMiddleware, (req, res) => {
    const data = readData(FILES.news);
    const newItem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    data.push(newItem);
    
    if (writeData(FILES.news, data)) {
      logActivity('新增新闻', { id: newItem.id, title: newItem.title });
      res.json(newItem);
    } else {
      res.status(500).json({ message: '保存失败' });
    }
  });
  
  app.put('/api/news/:id', authMiddleware, (req, res) => {
    const data = readData(FILES.news);
    const index = data.findIndex(i => String(i.id) === req.params.id);
    
    if (index >= 0) {
      data[index] = { ...data[index], ...req.body, updatedAt: new Date().toISOString() };
      if (writeData(FILES.news, data)) {
        logActivity('更新新闻', { id: data[index].id, title: data[index].title });
        res.json(data[index]);
      } else {
        res.status(500).json({ message: '保存失败' });
      }
    } else {
      res.status(404).json({ message: '未找到' });
    }
  });
  
  app.delete('/api/news/:id', authMiddleware, (req, res) => {
    const data = readData(FILES.news);
    const item = data.find(i => String(i.id) === req.params.id);
    const filtered = data.filter(i => String(i.id) !== req.params.id);
    
    if (writeData(FILES.news, filtered)) {
      if (item) {
        logActivity('删除新闻', { id: req.params.id, title: item.title });
      }
      res.json({ success: true });
    } else {
      res.status(500).json({ message: '删除失败' });
    }
  });
  
  // 工具API
  app.get('/api/tools', (req, res) => {
    res.json(readData(FILES.tools));
  });
  
  app.post('/api/tools', authMiddleware, (req, res) => {
    const data = readData(FILES.tools);
    const newItem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    data.push(newItem);
    
    if (writeData(FILES.tools, data)) {
      logActivity('新增工具', { id: newItem.id, name: newItem.name });
      res.json(newItem);
    } else {
      res.status(500).json({ message: '保存失败' });
    }
  });
  
  // 设置API
  app.get('/api/content/settings', (req, res) => {
    res.json(readData(FILES.settings));
  });
  
  app.put('/api/content/settings', authMiddleware, (req, res) => {
    const settings = readData(FILES.settings);
    const updated = { ...settings, ...req.body, updatedAt: new Date().toISOString() };
    
    if (writeData(FILES.settings, updated)) {
      logActivity('更新设置', { fields: Object.keys(req.body) });
      res.json(updated);
    } else {
      res.status(500).json({ message: '保存失败' });
    }
  });
  
  // 统计API
  app.get('/api/stats', (req, res) => {
    const inquiries = readData(FILES.inquiries);
    const news = readData(FILES.news);
    const tools = readData(FILES.tools);
    
    const today = new Date().toDateString();
    const todayInquiries = inquiries.filter(i => 
      new Date(i.createdAt).toDateString() === today
    ).length;
    const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;
    
    res.json({
      todayInquiries,
      pendingInquiries,
      totalNews: news.length,
      totalTools: tools.length,
      totalInquiries: inquiries.length,
      completedInquiries: inquiries.filter(i => i.status === 'completed').length
    });
  });
  
  // 错误处理
  app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  });
  
  // 404处理
  app.use((req, res) => {
    res.status(404).json({ message: 'API未找到' });
  });
  
  // 启动服务器
  const server = app.listen(config.port, () => {
    console.log(`========================================`);
    console.log(`🚀 中嘉锦铭国际贸易 - 生产服务器启动`);
    console.log(`📡 端口: ${config.port}`);
    console.log(`🌍 环境: ${config.env}`);
    console.log(`👷 进程ID: ${process.pid}`);
    console.log(`📊 数据目录: ${config.dataDir}`);
    console.log(`📝 日志目录: ${config.logsDir}`);
    console.log(`========================================`);
  });
  
  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
  
  // 初始化数据函数
  function initData() {
    // 初始化咨询数据
    if (!fs.existsSync(FILES.inquiries)) {
      const inquiries = [
        {
          id: 1,
          company: '湖南中嘉锦铭国际贸易有限公司',
          name: '欧阳波',
          phone: '18874799625',
          need: 'policy',
          message: '想了解出海到尼日利亚的政策支持',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      writeData(FILES.inquiries, inquiries);
    }
    
    // 初始化新闻数据
    if (!fs.existsSync(FILES.news)) {
      const news = [
        {
          id: 1,
          title: '中嘉锦铭国际贸易正式上线',
          body: '<p>中嘉锦铭国际贸易正式上线，为企业提供一站式出海服务。</p>',
          image: null,
          createdAt: new Date().toISOString()
        }
      ];
      writeData(FILES.news, news);
    }
    
    // 初始化工具数据
    if (!fs.existsSync(FILES.tools)) {
      const tools = [
        {
          id: 1,
          name: '海关编码查询',
          url: 'http://www.customs.gov.cn',
          image: null,
          createdAt: new Date().toISOString()
        }
      ];
      writeData(FILES.tools, tools);
    }
    
    // 初始化设置数据
    if (!fs.existsSync(FILES.settings)) {
      const settings = {
        siteName: '中嘉锦铭国际贸易',
        phone: '18874799625',
        email: '906725387@qq.com',
        address: '长沙市雨花区井湾子街道紫金大厦701',
        copyright: '© 2024 中嘉锦铭国际贸易. 保留所有权利.',
        theme: 'blue',
        createdAt: new Date().toISOString()
      };
      writeData(FILES.settings, settings);
    }
    
    // 初始化用户数据
    if (!fs.existsSync(FILES.users)) {
      const users = [
        {
          id: 1,
          username: 'admin',
          password: 'admin123',
          name: '超级欧阳波',
          role: 'admin',
          createdAt: new Date().toISOString(),
          lastLogin: null
        }
      ];
      writeData(FILES.users, users);
    }
    
    // 初始化日志数据
    if (!fs.existsSync(FILES.logs)) {
      writeData(FILES.logs, []);
    }
  }
}