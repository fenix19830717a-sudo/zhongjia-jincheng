/**
 * 中嘉锦铭国际贸易 - 增强版后端服务
 * Enhanced Express Backend for Lotus Overseas Service Hub
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backups');
const LOGS_DIR = path.join(__dirname, 'logs');

[DATA_DIR, BACKUP_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 数据文件
const FILES = {
  inquiries: path.join(DATA_DIR, 'inquiries.json'),
  news: path.join(DATA_DIR, 'news.json'),
  tools: path.join(DATA_DIR, 'tools.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  logs: path.join(LOGS_DIR, 'activity.json'),
  users: path.join(DATA_DIR, 'users.json'),
  cache: path.join(DATA_DIR, 'cache.json')
};

// 初始化数据
function initData() {
  // 初始化咨询数据
  if (!fs.existsSync(FILES.inquiries)) {
    fs.writeFileSync(FILES.inquiries, JSON.stringify([
      {
        id: 1, company: '湖南中嘉锦铭国际贸易有限公司', name: '欧阳波',
        phone: '18874799625', need: 'policy',
        message: '想了解出海到尼日利亚的政策支持',
        status: 'pending', createdAt: new Date().toISOString()
      },
      {
        id: 2, company: '湖南中嘉锦铭国际贸易有限公司', name: '欧阳波',
        phone: '18874799625', need: 'service',
        message: '需要了解KeyWay会员权益',
        status: 'processing',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        processedAt: new Date().toISOString(), processedBy: '欧阳波'
      },
      {
        id: 3, company: '湖南中嘉锦铭国际贸易有限公司', name: '欧阳波',
        phone: '18874799625', need: 'overseas',
        message: '计划在肯尼亚设立分公司',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        processedAt: new Date(Date.now() - 86400000).toISOString(),
        processedBy: '欧阳波'
      }
    ], null, 2));
  }

  // 初始化新闻数据
  if (!fs.existsSync(FILES.news)) {
    fs.writeFileSync(FILES.news, JSON.stringify([
      {
        id: 1, title: '首届中非经贸博览会在长沙成功举办',
        body: '<p>首届中非经贸博览会在长沙成功举办，为中非经贸合作搭建了重要平台...</p>',
        image: null, createdAt: new Date().toISOString()
      },
      {
        id: 2, title: '中嘉锦铭国际贸易正式启动',
        body: '<p>中嘉锦铭国际贸易正式启动，致力于帮助企业出海...</p>',
        image: null, createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ], null, 2));
  }

  // 初始化工具数据
  if (!fs.existsSync(FILES.tools)) {
    fs.writeFileSync(FILES.tools, JSON.stringify([
      { id: 1, name: '海关编码查询', url: 'http://www.customs.gov.cn', image: null, createdAt: new Date().toISOString() },
      { id: 2, name: '', url: '实时汇率换算https://www.xe.com', image: null, createdAt: new Date().toISOString() }
    ], null, 2));
  }

  // 初始化设置数据
  if (!fs.existsSync(FILES.settings)) {
    fs.writeFileSync(FILES.settings, JSON.stringify({
      siteName: '中嘉锦铭国际贸易',
      phone: '18874799625',
      email: '906725387@qq.com',
      address: '长沙市雨花区井湾子街道紫金大厦701',
      copyright: '© 2024 中嘉锦铭国际贸易. 保留所有权利.',
      theme: 'blue',
      createdAt: new Date().toISOString()
    }, null, 2));
  }

  // 初始化用户数据
  if (!fs.existsSync(FILES.users)) {
    fs.writeFileSync(FILES.users, JSON.stringify([
      {
        id: 1, username: 'admin', password: 'admin123',
        name: '超级欧阳波', role: 'admin',
        createdAt: new Date().toISOString(), lastLogin: null
      },
      {
        id: 2, username: 'editor', password: 'editor123',
        name: '内容编辑', role: 'editor',
        createdAt: new Date().toISOString(), lastLogin: null
      }
    ], null, 2));
  }

  // 初始化日志数据
  if (!fs.existsSync(FILES.logs)) {
    fs.writeFileSync(FILES.logs, JSON.stringify([], null, 2));
  }
}

initData();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供HTML、CSS、JS、图片等
app.use(express.static(__dirname));

// 简单的认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    next();
  } else {
    // 允许所有请求通过（开发模式）
    next();
  }
}

// 记录操作日志
function logActivity(action, details, admin = '系统') {
  const logs = JSON.parse(fs.readFileSync(FILES.logs, 'utf8'));
  logs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    action,
    details,
    admin,
    ip: req?.ip || 'localhost'
  });
  // 只保留最近1000条日志
  if (logs.length > 1000) {
    fs.writeFileSync(FILES.logs, JSON.stringify(logs.slice(0, 1000), null, 2));
  } else {
    fs.writeFileSync(FILES.logs, JSON.stringify(logs, null, 2));
  }
}

// ===== API 路由 =====

// 通用数据读取
function readData(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

// 通用数据写入
function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===== 认证API =====

// 登录
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

// 验证token
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ success: true, user: { id: 1, name: '欧阳波', role: 'admin' } });
});

// ===== 咨询API =====

app.get('/api/inquiries', (req, res) => {
  const data = readData(FILES.inquiries);
  // 按时间倒序
  data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(data);
});

app.get('/api/inquiries/:id', (req, res) => {
  const data = readData(FILES.inquiries);
  const item = data.find(i => String(i.id) === req.params.id);
  item ? res.json(item) : res.status(404).json({ message: '未找到' });
});

app.post('/api/inquiries', authMiddleware, (req, res) => {
  const data = readData(FILES.inquiries);
  const newItem = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
  data.push(newItem);
  writeData(FILES.inquiries, data);
  logActivity('新增咨询', { id: newItem.id, company: newItem.company }, req.body._admin || '欧阳波');
  res.json(newItem);
});

app.patch('/api/inquiries/:id', authMiddleware, (req, res) => {
  const data = readData(FILES.inquiries);
  const index = data.findIndex(i => String(i.id) === req.params.id);
  if (index >= 0) {
    data[index] = { ...data[index], ...req.body };
    writeData(FILES.inquiries, data);
    logActivity('更新咨询', { id: data[index].id, changes: req.body }, req.body._admin || '欧阳波');
    res.json(data[index]);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.delete('/api/inquiries/:id', authMiddleware, (req, res) => {
  const data = readData(FILES.inquiries);
  const item = data.find(i => String(i.id) === req.params.id);
  const filtered = data.filter(i => String(i.id) !== req.params.id);
  writeData(FILES.inquiries, filtered);
  if (item) {
    logActivity('删除咨询', { id: req.params.id, company: item.company }, req.body._admin || '欧阳波');
  }
  res.json({ success: true });
});

// ===== 新闻API =====

app.get('/api/news', (req, res) => {
  const data = readData(FILES.news);
  data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(data);
});

app.get('/api/news/:id', (req, res) => {
  const data = readData(FILES.news);
  const item = data.find(i => String(i.id) === req.params.id);
  item ? res.json(item) : res.status(404).json({ message: '未找到' });
});

app.post('/api/news', authMiddleware, (req, res) => {
  const data = readData(FILES.news);
  const newItem = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  writeData(FILES.news, data);
  logActivity('新增新闻', { id: newItem.id, title: newItem.title }, req.body._admin || '欧阳波');
  res.json(newItem);
});

app.put('/api/news/:id', authMiddleware, (req, res) => {
  const data = readData(FILES.news);
  const index = data.findIndex(i => String(i.id) === req.params.id);
  if (index >= 0) {
    data[index] = { ...data[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData(FILES.news, data);
    logActivity('更新新闻', { id: data[index].id, title: data[index].title }, req.body._admin || '欧阳波');
    res.json(data[index]);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.delete('/api/news/:id', authMiddleware, (req, res) => {
  const data = readData(FILES.news);
  const item = data.find(i => String(i.id) === req.params.id);
  const filtered = data.filter(i => String(i.id) !== req.params.id);
  writeData(FILES.news, filtered);
  if (item) {
    logActivity('删除新闻', { id: req.params.id, title: item.title }, req.body._admin || '欧阳波');
  }
  res.json({ success: true });
});

// ===== 工具API =====

app.get('/api/tools', (req, res) => {
  res.json(readData(FILES.tools));
});

app.get('/api/tools/:id', (req, res) => {
  const data = readData(FILES.tools);
  const item = data.find(i => String(i.id) === req.params.id);
  item ? res.json(item) : res.status(404).json({ message: '未找到' });
});

app.post('/api/tools', authMiddleware, (req, res) => {
  const data = readData(FILES.tools);
  const newItem = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  writeData(FILES.tools, data);
  logActivity('新增工具', { id: newItem.id, name: newItem.name }, req.body._admin || '欧阳波');
  res.json(newItem);
});

app.put('/api/tools/:id', authMiddleware, (req, res) => {
  const data = readData(FILES.tools);
  const index = data.findIndex(i => String(i.id) === req.params.id);
  if (index >= 0) {
    data[index] = { ...data[index], ...req.body };
    writeData(FILES.tools, data);
    logActivity('更新工具', { id: data[index].id, name: data[index].name }, req.body._admin || '欧阳波');
    res.json(data[index]);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.delete('/api/tools/:id', authMiddleware, (req, res) => {
  const data = readData(FILES.tools);
  const item = data.find(i => String(i.id) === req.params.id);
  const filtered = data.filter(i => String(i.id) !== req.params.id);
  writeData(FILES.tools, filtered);
  if (item) {
    logActivity('删除工具', { id: req.params.id, name: item.name }, req.body._admin || '欧阳波');
  }
  res.json({ success: true });
});

// ===== 设置API =====

app.get('/api/content/settings', (req, res) => {
  res.json(readData(FILES.settings));
});

app.put('/api/content/settings', authMiddleware, (req, res) => {
  const settings = readData(FILES.settings);
  const updated = { ...settings, ...req.body, updatedAt: new Date().toISOString() };
  writeData(FILES.settings, updated);
  logActivity('更新设置', { fields: Object.keys(req.body) }, req.body._admin || '欧阳波');
  res.json(updated);
});

app.get('/api/content/home', (req, res) => {
  res.json(readData(FILES.settings));
});

app.put('/api/content/home', authMiddleware, (req, res) => {
  const settings = readData(FILES.settings);
  const updated = { ...settings, ...req.body, updatedAt: new Date().toISOString() };
  writeData(FILES.settings, updated);
  logActivity('更新首页内容', { fields: Object.keys(req.body) }, req.body._admin || '欧阳波');
  res.json(updated);
});

// ===== 日志API =====

app.get('/api/logs', authMiddleware, (req, res) => {
  const logs = readData(FILES.logs);
  const { action, admin, startDate, endDate, limit } = req.query;
  
  let filtered = logs;
  
  if (action) {
    filtered = filtered.filter(l => l.action === action);
  }
  if (admin) {
    filtered = filtered.filter(l => l.admin === admin);
  }
  if (startDate) {
    filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(endDate));
  }
  
  const limitNum = parseInt(limit) || 100;
  res.json(filtered.slice(0, limitNum));
});

app.delete('/api/logs', authMiddleware, (req, res) => {
  writeData(FILES.logs, []);
  logActivity('清空日志', {}, req.body._admin || '欧阳波');
  res.json({ success: true });
});

// ===== 备份API =====

app.get('/api/backup', authMiddleware, (req, res) => {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      inquiries: readData(FILES.inquiries),
      news: readData(FILES.news),
      tools: readData(FILES.tools),
      settings: readData(FILES.settings),
      users: readData(FILES.users)
    }
  };
  
  // 保存备份文件
  const backupFilename = `backup_${Date.now()}.json`;
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  
  logActivity('创建备份', { filename: backupFilename }, req.body._admin || '欧阳波');
  res.json({ success: true, backup: backupFilename });
});

app.post('/api/backup/restore', authMiddleware, (req, res) => {
  const { data } = req.body;
  
  if (data.inquiries) writeData(FILES.inquiries, data.inquiries);
  if (data.news) writeData(FILES.news, data.news);
  if (data.tools) writeData(FILES.tools, data.tools);
  if (data.settings) writeData(FILES.settings, data.settings);
  if (data.users) writeData(FILES.users, data.users);
  
  logActivity('恢复备份', { timestamp: data.timestamp }, req.body._admin || '欧阳波');
  res.json({ success: true });
});

app.get('/api/backup/list', authMiddleware, (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(backups);
  } catch {
    res.json([]);
  }
});

// ===== 用户API =====

app.get('/api/users', authMiddleware, (req, res) => {
  const users = readData(FILES.users);
  // 不返回密码
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json(safeUsers);
});

app.post('/api/users', authMiddleware, (req, res) => {
  const users = readData(FILES.users);
  const newUser = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  users.push(newUser);
  writeData(FILES.users, users);
  logActivity('创建用户', { id: newUser.id, username: newUser.username }, req.body._admin || '欧阳波');
  res.json({ id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const users = readData(FILES.users);
  const index = users.findIndex(i => String(i.id) === req.params.id);
  
  if (index >= 0) {
    users[index] = { ...users[index], ...req.body };
    writeData(FILES.users, users);
    logActivity('更新用户', { id: users[index].id, username: users[index].username }, req.body._admin || '欧阳波');
    const { password, ...safeUser } = users[index];
    res.json(safeUser);
  } else {
    res.status(404).json({ message: '用户未找到' });
  }
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const users = readData(FILES.users);
  const user = users.find(i => String(i.id) === req.params.id);
  const filtered = users.filter(i => String(i.id) !== req.params.id);
  writeData(FILES.users, filtered);
  
  if (user) {
    logActivity('删除用户', { id: req.params.id, username: user.username }, req.body._admin || '欧阳波');
  }
  res.json({ success: true });
});

// ===== 统计API =====

app.get('/api/stats', (req, res) => {
  const inquiries = readData(FILES.inquiries);
  const news = readData(FILES.news);
  const tools = readData(FILES.tools);
  
  const today = new Date().toDateString();
  const todayInquiries = inquiries.filter(i => new Date(i.createdAt).toDateString() === today).length;
  const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;
  
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  res.json({
    todayInquiries,
    pendingInquiries,
    totalNews: news.length,
    totalTools: tools.length,
    totalInquiries: inquiries.length,
    completedInquiries: inquiries.filter(i => i.status === 'completed').length
  });
});

// ===== 健康检查 =====

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 中嘉锦铭国际贸易 - 后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📊 API端点:`);
  console.log(`   - GET  /api/inquiries    - 咨询列表`);
  console.log(`   - GET  /api/news        - 新闻列表`);
  console.log(`   - GET  /api/tools       - 工具列表`);
  console.log(`   - GET  /api/settings    - 系统设置`);
  console.log(`   - GET  /api/logs        - 操作日志`);
  console.log(`   - GET  /api/backup      - 创建备份`);
  console.log(`   - GET  /api/health      - 健康检查`);
});
