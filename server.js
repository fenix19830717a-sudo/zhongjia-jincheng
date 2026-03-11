/**
 * 中嘉锦铭国际贸易 - 简单后端服务
 * Simple Express Backend for Lotus Overseas Service Hub
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const TOOLS_FILE = path.join(DATA_DIR, 'tools.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

// 初始化默认数据
function initData() {
  if (!fs.existsSync(INQUIRIES_FILE)) {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify([
      {
        id: 1,
        company: '湖南中嘉锦铭国际贸易有限公司',
        name: '欧阳波',
        phone: '18874799625',
        need: 'policy',
        message: '想了解出海到尼日利亚的政策支持',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        company: '湖南中嘉锦铭国际贸易有限公司',
        name: '欧阳波',
        phone: '18874799625',
        need: 'service',
        message: '需要了解KeyWay会员权益',
        status: 'processing',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        processedAt: new Date().toISOString(),
        processedBy: '欧阳波'
      },
      {
        id: 3,
        company: '湖南中嘉锦铭国际贸易有限公司',
        name: '欧阳波',
        phone: '18874799625',
        need: 'overseas',
        message: '计划在肯尼亚设立分公司',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        processedAt: new Date(Date.now() - 86400000).toISOString(),
        processedBy: '欧阳波'
      }
    ], null, 2));
  }

  if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify([
      {
        id: 1,
        title: '首届中非经贸博览会在长沙成功举办',
        body: '<p>首届中非经贸博览会在长沙成功举办，为中非经贸合作搭建了重要平台...</p>',
        image: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: '中嘉锦铭国际贸易正式启动',
        body: '<p>中嘉锦铭国际贸易正式启动，致力于帮助企业出海...</p>',
        image: null,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ], null, 2));
  }

  if (!fs.existsSync(TOOLS_FILE)) {
    fs.writeFileSync(TOOLS_FILE, JSON.stringify([
      {
        id: 1,
        name: '海关编码查询',
        url: 'http://www.customs.gov.cn',
        image: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: '实时汇率换算',
        url: 'https://www.xe.com',
        image: null,
        createdAt: new Date().toISOString()
      }
    ], null, 2));
  }

  if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify({
      home: {
        title: '中嘉锦铭国际贸易 - 中非经贸赋能平台',
        keywords: '出海服务,中非经贸,企业出海,KeyWay会员',
        description: '中嘉锦铭国际贸易，中非经贸赋能平台与创新促进中心，为企业提供从0到1的出海全周期解决方案。',
        carousel: [
          { title: '中嘉锦铭国际贸易', subtitle: '中非经贸赋能平台', image: 'images/hero-slide-1.jpg' },
          { title: '从0到1开展国际业务', subtitle: '十大赋能中心，十大促进中心', image: 'images/hero-slide-2.jpg' }
        ],
        updatedAt: new Date().toISOString()
      },
      settings: {
        siteName: '中嘉锦铭国际贸易',
        phone: '18874799625',
        email: '906725387@qq.com',
        address: '长沙市雨花区井湾子街道紫金大厦701',
        copyright: '© 2024 中嘉锦铭国际贸易. 保留所有权利.',
        updatedAt: new Date().toISOString()
      }
    }, null, 2));
  }
}

initData();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 模拟认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  // 简单认证：只要存在Authorization头就通过（实际生产环境需要JWT验证）
  if (authHeader && authHeader.startsWith('Bearer ')) {
    next();
  } else {
    // 开发环境允许无认证访问
    console.log('[Auth] 开发模式：跳过认证');
    next();
  }
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ===== 认证API =====
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 简单验证
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      name: '欧阳波',
      token: 'demo-token-' + Date.now()
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// ===== 咨询API =====
app.get('/api/inquiries', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf8'));
  res.json(data);
});

app.get('/api/inquiries/:id', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf8'));
  const item = data.find(i => String(i.id) === req.params.id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.post('/api/inquiries', (req, res) => {
  const data = JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf8'));
  const newItem = {
    id: Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(data, null, 2));
  res.json(newItem);
});

app.patch('/api/inquiries/:id', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf8'));
  const index = data.findIndex(i => String(i.id) === req.params.id);
  if (index >= 0) {
    data[index] = { ...data[index], ...req.body };
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(data, null, 2));
    res.json(data[index]);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

// ===== 新闻API =====
app.get('/api/news', (req, res) => {
  const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  res.json(data);
});

app.get('/api/news/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const item = data.find(n => String(n.id) === req.params.id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.post('/api/news', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const newItem = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2));
  res.json(newItem);
});

app.put('/api/news/:id', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const index = data.findIndex(n => String(n.id) === req.params.id);
  if (index >= 0) {
    data[index] = { ...data[index], ...req.body };
    fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2));
    res.json(data[index]);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.delete('/api/news/:id', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const filtered = data.filter(n => String(n.id) !== req.params.id);
  fs.writeFileSync(NEWS_FILE, JSON.stringify(filtered, null, 2));
  res.json({ success: true });
});

// ===== 工具API =====
app.get('/api/tools', (req, res) => {
  const data = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  res.json(data);
});

app.get('/api/tools/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  const item = data.find(t => String(t.id) === req.params.id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.post('/api/tools', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  const newItem = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  data.push(newItem);
  fs.writeFileSync(TOOLS_FILE, JSON.stringify(data, null, 2));
  res.json(newItem);
});

app.put('/api/tools/:id', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  const index = data.findIndex(t => String(t.id) === req.params.id);
  if (index >= 0) {
    data[index] = { ...data[index], ...req.body };
    fs.writeFileSync(TOOLS_FILE, JSON.stringify(data, null, 2));
    res.json(data[index]);
  } else {
    res.status(404).json({ message: '未找到' });
  }
});

app.delete('/api/tools/:id', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  const filtered = data.filter(t => String(t.id) !== req.params.id);
  fs.writeFileSync(TOOLS_FILE, JSON.stringify(filtered, null, 2));
  res.json({ success: true });
});

// ===== 内容管理API =====
app.get('/api/content/home', (req, res) => {
  const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  res.json(data.home || {});
});

app.put('/api/content/home', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  data.home = { ...req.body, updatedAt: new Date().toISOString() };
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));
  res.json(data.home);
});

app.get('/api/content/settings', (req, res) => {
  const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  res.json(data.settings || {});
});

app.put('/api/content/settings', authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  data.settings = { ...req.body, updatedAt: new Date().toISOString() };
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));
  res.json(data.settings);
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: 'API未找到' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: '服务器错误', error: err.message });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 中嘉锦铭国际贸易后端服务已启动`);
  console.log(`📡 API地址: http://localhost:${PORT}`);
  console.log(`📊 数据目录: ${DATA_DIR}`);
  console.log(`========================================`);
  console.log(`可用API端点:`);
  console.log(`  POST   /api/auth/login       - 登录`);
  console.log(`  GET    /api/inquiries        - 获取咨询列表`);
  console.log(`  POST   /api/inquiries        - 创建咨询`);
  console.log(`  PATCH  /api/inquiries/:id     - 更新咨询状态`);
  console.log(`  GET    /api/news             - 获取新闻列表`);
  console.log(`  POST   /api/news             - 创建新闻`);
  console.log(`  PUT    /api/news/:id          - 更新新闻`);
  console.log(`  DELETE /api/news/:id          - 删除新闻`);
  console.log(`  GET    /api/tools            - 获取工具列表`);
  console.log(`  POST   /api/tools            - 创建工具`);
  console.log(`  PUT    /api/tools/:id         - 更新工具`);
  console.log(`  DELETE /api/tools/:id         - 删除工具`);
  console.log(`  GET    /api/content/home      - 获取首页内容`);
  console.log(`  PUT    /api/content/home      - 更新首页内容`);
  console.log(`  GET    /api/content/settings  - 获取设置`);
  console.log(`  PUT    /api/content/settings  - 更新设置`);
  console.log(`========================================`);
});
