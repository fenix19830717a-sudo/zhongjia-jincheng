/**
 * 中嘉锦铭国际贸易 - 主脚本
 */

// 当前语言
let currentLang = 'zh';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 初始化语言
  initLanguage();
  
  // 从后端加载站点设置
  loadSiteSettings();
  
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initSmoothScroll();
});

/**
 * 导航栏滚动效果
 */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/**
 * 移动端菜单
 */
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  
  if (!menuBtn || !navMenu) return;
  
  menuBtn.addEventListener('click', function() {
    navMenu.classList.toggle('active');
    menuBtn.classList.toggle('active');
  });
  
  // 点击菜单项后关闭菜单
  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navMenu.classList.remove('active');
      menuBtn.classList.remove('active');
    });
  });
}

/**
 * 滚动显示动画
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  
  if (revealElements.length === 0) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  revealElements.forEach(el => observer.observe(el));
}

/**
 * 平滑滚动
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * 初始化语言设置
 */
function initLanguage() {
  // 从localStorage或URL参数获取语言设置
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  const storedLang = localStorage.getItem('preferredLanguage');
  
  currentLang = urlLang || storedLang || 'zh';
  
  // 应用语言
  applyLanguage(currentLang);
  
  // 更新语言切换按钮显示
  updateLangSwitchButton();
}

/**
 * 应用语言到页面
 */
function applyLanguage(lang) {
  if (typeof i18n === 'undefined' || !i18n[lang]) return;
  
  const t = i18n[lang];
  
  // 更新所有带有data-i18n属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = getNestedValue(t, key);
    if (value) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    }
  });
  
  // 更新所有带有data-i18n-html属性的元素（支持HTML内容）
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const value = getNestedValue(t, key);
    if (value) {
      el.innerHTML = value;
    }
  });
  
  // 更新所有带有data-i18n-list属性的列表
  document.querySelectorAll('[data-i18n-list]').forEach(el => {
    const key = el.getAttribute('data-i18n-list');
    const items = getNestedValue(t, key);
    if (Array.isArray(items)) {
      const spans = el.querySelectorAll('.service-item span');
      spans.forEach((span, index) => {
        if (items[index]) {
          span.textContent = items[index];
        }
      });
    }
  });
  
  // 更新所有带有data-i18n-tags属性的标签列表
  document.querySelectorAll('[data-i18n-tags]').forEach(el => {
    const key = el.getAttribute('data-i18n-tags');
    const items = getNestedValue(t, key);
    if (Array.isArray(items)) {
      const tags = el.querySelectorAll('.layout-tag');
      tags.forEach((tag, index) => {
        if (items[index]) {
          tag.textContent = items[index];
        }
      });
    }
  });
  
  // 更新页面标题
  const pageTitle = document.querySelector('title');
  if (pageTitle && t.pageTitle) {
    pageTitle.textContent = t.pageTitle;
  }
  
  // 更新html lang属性
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}

/**
 * 获取嵌套对象值
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((o, i) => o && o[i], obj);
}

/**
 * 切换语言
 */
function toggleLanguage() {
  const newLang = currentLang === 'zh' ? 'en' : 'zh';
  switchLanguage(newLang);
}

/**
 * 语言切换
 */
function switchLanguage(lang) {
  // 存储语言偏好
  localStorage.setItem('preferredLanguage', lang);
  currentLang = lang;
  
  // 应用新语言
  applyLanguage(lang);
  
  // 更新语言切换按钮
  updateLangSwitchButton();
  
  // 显示提示
  const message = lang === 'zh' ? '已切换至中文' : 'Switched to English';
  showToast(message, 'success');
}

/**
 * 更新语言切换按钮显示
 */
function updateLangSwitchButton() {
  const langText = document.getElementById('lang-text');
  if (langText && i18n && i18n[currentLang]) {
    langText.textContent = i18n[currentLang].lang.switch;
  }
}

/**
 * 获取当前语言
 */
function getCurrentLanguage() {
  return currentLang;
}

/**
 * 表单验证
 */
function validateForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('error');
    } else {
      field.classList.remove('error');
    }
  });
  
  return isValid;
}

/**
 * 显示提示消息
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 导出公共函数
window.LotusUtils = {
  switchLanguage,
  getCurrentLanguage,
  toggleLanguage,
  applyLanguage,
  validateForm,
  showToast,
  debounce,
  throttle
};

/**
 * 从后端加载站点设置
 */
async function loadSiteSettings() {
  try {
    // 尝试从后端获取设置
    const res = await fetch('http://localhost:3000/api/content/settings');
    
    if (res.ok) {
      const settings = await res.json();
      applySiteSettings(settings);
      console.log('[Settings] 已从后端加载站点设置');
      return;
    }
  } catch (err) {
    console.warn('[Settings] 从后端加载失败:', err.message);
  }
  
  // 后端不可用，尝试从localStorage加载
  const localSettings = localStorage.getItem('siteSettings');
  if (localSettings) {
    try {
      const settings = JSON.parse(localSettings);
      applySiteSettings(settings);
      console.log('[Settings] 已从本地存储加载站点设置');
    } catch (e) {
      console.error('[Settings] 解析本地设置失败:', e);
    }
  }
}

/**
 * 应用站点设置到页面
 */
function applySiteSettings(settings) {
  if (!settings) return;
  
  // 更新页脚联系信息
  const addressEl = document.getElementById('footer-address');
  const phoneEl = document.getElementById('footer-phone');
  const emailEl = document.getElementById('footer-email');
  
  if (addressEl && settings.address) {
    addressEl.textContent = settings.address;
  }
  
  if (phoneEl && settings.phone) {
    phoneEl.textContent = settings.phone;
  }
  
  if (emailEl && settings.email) {
    emailEl.textContent = settings.email;
  }
  
  // 更新页面标题（如果设置了网站名称）
  if (settings.siteName) {
    const siteNameEls = document.querySelectorAll('.logo-text, .footer-logo-text');
    siteNameEls.forEach(el => {
      if (el) el.textContent = settings.siteName;
    });
  }
  
  // 更新版权信息
  const copyrightEl = document.querySelector('.footer-copyright');
  if (copyrightEl && settings.copyright) {
    copyrightEl.textContent = settings.copyright;
  }
  
  // 应用配色方案
  if (settings.theme) {
    applyTheme(settings.theme);
  }
  
  console.log('[Settings] 站点设置已应用到页面');
}

/**
 * 应用配色方案
 */
function applyTheme(theme) {
  const themes = {
    blue: {
      primary: '#0055b8',
      secondary: '#003d8a',
      accent: '#c9a227'
    },
    gold: {
      primary: '#c9a227',
      secondary: '#a08020',
      accent: '#0055b8'
    },
    green: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#0055b8'
    },
    purple: {
      primary: '#8b5cf6',
      secondary: '#6d28d9',
      accent: '#c9a227'
    },
    red: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#0055b8'
    }
  };
  
  const selectedTheme = themes[theme] || themes.blue;
  
  // 创建或更新主题样式
  let themeStyle = document.getElementById('dynamic-theme');
  if (!themeStyle) {
    themeStyle = document.createElement('style');
    themeStyle.id = 'dynamic-theme';
    document.head.appendChild(themeStyle);
  }
  
  themeStyle.textContent = `
    :root {
      --primary-color: ${selectedTheme.primary};
      --secondary-color: ${selectedTheme.secondary};
      --accent-color: ${selectedTheme.accent};
    }
    
    .navbar { background: linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary}) !important; }
    .btn-primary { background: linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary}) !important; }
    .section-tag { background: ${selectedTheme.primary}20 !important; color: ${selectedTheme.primary} !important; }
    .footer { background: linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary}) !important; }
    .value-icon { background: ${selectedTheme.primary} !important; }
    .service-block-icon { background: linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary}) !important; }
    .stat-card-icon.blue { background: ${selectedTheme.primary}20 !important; color: ${selectedTheme.primary} !important; }
    .action-btn.view { background: ${selectedTheme.primary}20 !important; color: ${selectedTheme.primary} !important; }
  `;
  
  console.log('[Theme] 配色方案已应用:', theme);
}
