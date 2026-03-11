const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_NAME = process.env.PROJECT_NAME || '网站';
const APP_DIR = __dirname;

// 数据存储目录
const DATA_DIR = path.join(APP_DIR, 'data');
const BACKUP_DIR = path.join(APP_DIR, 'backups');
const LOGS_DIR = path.join(APP_DIR, 'logs');

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
  if (!fs.existsSync(FILES.inquiries)) {
    fs.writeFileSync(FILES.inquiries, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(FILES.news)) {
    fs.writeFileSync(FILES.news, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(FILES.tools)) {
    fs.writeFileSync(FILES.tools, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(FILES.settings)) {
    fs.writeFileSync(FILES.settings, JSON.stringify({
      siteName: PROJECT_NAME,
      phone: '400-XXX-XXXX',
      email: 'contact@example.com',
      address: '地址',
      copyright: `© ${new Date().getFullYear()} ${PROJECT_NAME}. 保留所有权利.`,
      theme: 'blue',
      createdAt: new Date().toISOString()
    }, null, 2));
  }
  if (!fs.existsSync(FILES.users)) {
    fs.writeFileSync(FILES.users, JSON.stringify([
      { id: 1, username: 'admin', password: 'admin123', name: '超级管理员', role: 'admin', createdAt: new Date().toISOString(), lastLogin: null }
    ], null, 2));
  }
  if (!fs.existsSync(FILES.logs)) {
    fs.writeFileSync(FILES.logs, JSON.stringify([], null, 2));
  }
}

initData();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(APP_DIR));

// 通用数据读写
function readData(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}
function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===== 简单的API路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: PROJECT_NAME, time: new Date().toISOString() });
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${PROJECT_NAME} 后端服务已启动`);
  console.log(`📡 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`📍 项目目录: ${APP_DIR}`);
});
