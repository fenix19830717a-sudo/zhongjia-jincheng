/**
 * 中嘉锦铭国际贸易 - 管理后台增强功能
 * Admin Panel Enhanced Features
 */

// ============================================================================
// 1. 数据验证模块 (Data Validation)
// ============================================================================

const Validator = {
  // 验证规则
  rules: {
    required: (value) => {
      if (value === null || value === undefined || value === '') return '此项为必填项';
      if (typeof value === 'string' && value.trim() === '') return '此项为必填项';
      return null;
    },
    
    email: (value) => {
      if (!value) return null;
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(value) ? null : '请输入有效的邮箱地址';
    },
    
    phone: (value) => {
      if (!value) return null;
      const regex = /^1[3-9]\d{9}$/;
      return regex.test(value.replace(/\s/g, '')) ? null : '请输入有效的手机号码';
    },
    
    url: (value) => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return '请输入有效的网址';
      }
    },
    
    minLength: (min) => (value) => {
      if (!value) return null;
      return String(value).length >= min ? null : `最少需要 ${min} 个字符`;
    },
    
    maxLength: (max) => (value) => {
      if (!value) return null;
      return String(value).length <= max ? null : `最多允许 ${max} 个字符`;
    },
    
    number: (value) => {
      if (!value) return null;
      return !isNaN(parseFloat(value)) && isFinite(value) ? null : '请输入有效的数字';
    },
    
    positive: (value) => {
      if (!value) return null;
      return parseFloat(value) > 0 ? null : '请输入大于0的数字';
    },
    
    json: (value) => {
      if (!value) return null;
      try {
        JSON.parse(value);
        return null;
      } catch {
        return 'JSON格式不正确';
      }
    }
  },
  
  // 验证字段
  validate(fieldName, value, rules = []) {
    for (const rule of rules) {
      let validator = rule;
      let message = null;
      
      // 处理带参数的规则
      if (typeof rule === 'object' && rule.type) {
        validator = this.rules[rule.type];
        message = rule.message;
      } else if (typeof rule === 'string') {
        validator = this.rules[rule];
      }
      
      if (validator) {
        const error = validator(value);
        if (error) {
          return message || error;
        }
      }
    }
    return null;
  },
  
  // 验证整个表单
  validateForm(formData, schema) {
    const errors = {};
    let isValid = true;
    
    for (const [field, rules] of Object.entries(schema)) {
      const error = this.validate(field, formData[field], rules);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
    
    return { isValid, errors };
  }
};

// ============================================================================
// 2. 批量操作模块 (Bulk Operations)
// ============================================================================

const BulkOperations = {
  selectedItems: new Set(),
  
  // 初始化批量选择
  initBulkMode(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 添加选择列和批量操作栏
    const table = container.querySelector('table');
    if (table) {
      // 在表头添加选择框
      const headerRow = table.querySelector('thead tr');
      if (headerRow && !headerRow.querySelector('.bulk-select-header')) {
        const selectHeader = document.createElement('th');
        selectHeader.className = 'bulk-select-header';
        selectHeader.innerHTML = '<input type="checkbox" id="bulkSelectAll" onchange="BulkOperations.toggleSelectAll()">';
        headerRow.insertBefore(selectHeader, headerRow.firstChild);
      }
      
      // 为每行添加选择框
      table.querySelectorAll('tbody tr').forEach(row => {
        if (!row.querySelector('.bulk-select')) {
          const selectCell = document.createElement('td');
          selectCell.className = 'bulk-select';
          selectCell.innerHTML = '<input type="checkbox" class="item-select" onchange="BulkOperations.toggleSelect(this)">';
          row.insertBefore(selectCell, row.firstChild);
        }
      });
    }
    
    // 添加批量操作栏
    this.addBulkActionBar(containerId);
  },
  
  // 添加批量操作栏
  addBulkActionBar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let actionBar = container.querySelector('.bulk-action-bar');
    if (!actionBar) {
      actionBar = document.createElement('div');
      actionBar.className = 'bulk-action-bar';
      actionBar.style.cssText = `
        display: none;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 16px;
        align-items: center;
        gap: 16px;
      `;
      
      const card = container.querySelector('.card');
      if (card) {
        card.insertBefore(actionBar, card.firstChild);
      }
    }
    
    actionBar.innerHTML = `
      <span style="font-weight: 500;">
        已选择 <span id="selectedCount" style="color: #0055b8; font-weight: 700;">0</span> 项
      </span>
      <button class="btn-sm btn-outline-sm" onclick="BulkOperations.clearSelection()">取消选择</button>
      <div style="flex: 1;"></div>
      <button class="btn-sm btn-primary-sm" onclick="BulkOperations.bulkDelete('${containerId}')">批量删除</button>
      <button class="btn-sm btn-outline-sm" onclick="BulkOperations.bulkExport('${containerId}')">导出选中</button>
    `;
  },
  
  // 切换全选
  toggleSelectAll() {
    const masterCheckbox = document.getElementById('bulkSelectAll');
    const checkboxes = document.querySelectorAll('.item-select');
    
    checkboxes.forEach(cb => {
      cb.checked = masterCheckbox.checked;
      const row = cb.closest('tr');
      const id = row ? row.dataset.id : null;
      
      if (masterCheckbox.checked && id) {
        this.selectedItems.add(id);
      } else {
        this.selectedItems.delete(id);
      }
    });
    
    this.updateActionBar();
  },
  
  // 切换单个选择
  toggleSelect(checkbox) {
    const row = checkbox.closest('tr');
    const id = row ? row.dataset.id : null;
    
    if (checkbox.checked && id) {
      this.selectedItems.add(id);
    } else {
      this.selectedItems.delete(id);
    }
    
    // 更新全选框状态
    const masterCheckbox = document.getElementById('bulkSelectAll');
    const allCheckboxes = document.querySelectorAll('.item-select');
    const checkedCount = document.querySelectorAll('.item-select:checked').length;
    
    if (masterCheckbox) {
      masterCheckbox.checked = checkedCount === allCheckboxes.length;
      masterCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    }
    
    this.updateActionBar();
  },
  
  // 更新操作栏显示
  updateActionBar() {
    const actionBar = document.querySelector('.bulk-action-bar');
    const countSpan = document.getElementById('selectedCount');
    
    if (actionBar && countSpan) {
      const count = this.selectedItems.size;
      countSpan.textContent = count;
      actionBar.style.display = count > 0 ? 'flex' : 'none';
    }
  },
  
  // 清除选择
  clearSelection() {
    this.selectedItems.clear();
    document.querySelectorAll('.item-select').forEach(cb => cb.checked = false);
    const masterCheckbox = document.getElementById('bulkSelectAll');
    if (masterCheckbox) {
      masterCheckbox.checked = false;
      masterCheckbox.indeterminate = false;
    }
    this.updateActionBar();
  },
  
  // 批量删除
  async bulkDelete(containerId) {
    if (this.selectedItems.size === 0) {
      Toast.show('请先选择要删除的项目', 'warning');
      return;
    }
    
    const confirmed = await showConfirmDialog(
      '批量删除确认',
      `确定要删除选中的 ${this.selectedItems.size} 项吗？此操作不可恢复。`
    );
    
    if (!confirmed) return;
    
    const ids = Array.from(this.selectedItems);
    let success = 0;
    let failed = 0;
    
    Toast.show('正在删除选中项目...', 'info');
    
    for (const id of ids) {
      try {
        const res = await fetch(`http://localhost:3000/api/${containerId}/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    
    this.clearSelection();
    DataCache.clear(containerId);
    
    Toast.show(`删除完成：成功 ${success} 项，失败 ${failed} 项`, 
      failed === 0 ? 'success' : 'warning');
    
    // 刷新页面数据
    if (typeof loadInquiries === 'function') loadInquiries(true);
    if (typeof loadNews === 'function') loadNews(true);
    if (typeof loadTools === 'function') loadTools(true);
  },
  
  // 批量导出
  bulkExport(containerId) {
    if (this.selectedItems.size === 0) {
      Toast.show('请先选择要导出的项目', 'warning');
      return;
    }
    
    // 获取选中项数据并导出
    const cached = DataCache.get(containerId);
    if (!cached) {
      Toast.show('无法获取数据，请刷新后重试', 'error');
      return;
    }
    
    const selectedData = cached.filter(item => 
      this.selectedItems.has(String(item.id))
    );
    
    exportToJSON(selectedData, `${containerId}_selected_${Date.now()}.json`);
    Toast.show(`已导出 ${selectedData.length} 条数据`, 'success');
  }
};

// ============================================================================
// 3. 搜索筛选模块 (Search & Filter)
// ============================================================================

const SearchFilter = {
  // 实时搜索
  liveSearch(inputId, containerId, fields) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let debounceTimer;
    
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.performSearch(input.value, containerId, fields);
      }, 300);
    });
  },
  
  // 执行搜索
  performSearch(query, containerId, fields) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const rows = container.querySelectorAll('tbody tr');
    const lowerQuery = query.toLowerCase().trim();
    
    rows.forEach(row => {
      let match = false;
      
      if (!lowerQuery) {
        match = true;
      } else {
        for (const field of fields) {
          const cell = row.querySelector(`td:nth-child(${field.index})`);
          if (cell && cell.textContent.toLowerCase().includes(lowerQuery)) {
            match = true;
            break;
          }
        }
      }
      
      row.style.display = match ? '' : 'none';
    });
    
    // 更新可见行数统计
    const visibleCount = rows.filter(r => r.style.display !== 'none').length;
    this.updateSearchStatus(containerId, visibleCount, rows.length);
  },
  
  // 更新搜索状态
  updateSearchStatus(containerId, visible, total) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let statusEl = container.querySelector('.search-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'search-status';
      statusEl.style.cssText = `
        padding: 8px 16px;
        font-size: 13px;
        color: #666;
        background: #f8f9fa;
        border-radius: 4px;
      `;
      
      const table = container.querySelector('table');
      if (table) {
        table.parentElement.insertBefore(statusEl, table.nextSibling);
      }
    }
    
    if (visible < total) {
      statusEl.textContent = `显示 ${visible} / ${total} 条结果`;
      statusEl.style.display = 'block';
    } else {
      statusEl.style.display = 'none';
    }
  },
  
  // 添加高级筛选器
  addAdvancedFilter(containerId, filters) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let filterPanel = container.querySelector('.advanced-filter-panel');
    if (!filterPanel) {
      filterPanel = document.createElement('div');
      filterPanel.className = 'advanced-filter-panel';
      filterPanel.style.cssText = `
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 16px;
        display: none;
      `;
      
      const card = container.querySelector('.card');
      if (card) {
        card.insertBefore(filterPanel, card.querySelector('.card-header').nextSibling);
      }
    }
    
    // 构建筛选器HTML
    let filterHTML = '<div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;">';
    
    for (const [filterName, config] of Object.entries(filters)) {
      filterHTML += `
        <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 12px; color: #666;">${config.label}</label>
          ${config.type === 'select' 
            ? `<select id="filter_${filterName}" onchange="SearchFilter.applyFilters('${containerId}')" style="padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; min-width: 120px;">
                <option value="">全部</option>
                ${config.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
               </select>`
            : `<input type="text" id="filter_${filterName}" placeholder="${config.placeholder || ''}" onkeyup="SearchFilter.applyFilters('${containerId}')" style="padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; width: 150px;">`
          }
        </div>
      `;
    }
    
    filterHTML += `
      <button class="btn-sm btn-outline-sm" onclick="SearchFilter.clearFilters('${containerId}')" style="margin-left: auto;">清除筛选</button>
    </div>`;
    
    filterPanel.innerHTML = filterHTML;
    
    // 添加筛选切换按钮
    let filterToggle = container.querySelector('.filter-toggle-btn');
    if (!filterToggle) {
      filterToggle = document.createElement('button');
      filterToggle.className = 'filter-toggle-btn btn-sm btn-outline-sm';
      filterToggle.innerHTML = '🔍 高级筛选';
      filterToggle.style.marginRight = '8px';
      
      const cardActions = container.querySelector('.card-actions');
      if (cardActions) {
        cardActions.insertBefore(filterToggle, cardActions.firstChild);
      }
    }
    
    filterToggle.onclick = () => {
      filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
    };
  },
  
  // 应用筛选
  applyFilters(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const filters = container.querySelectorAll('[id^="filter_"]');
    const rows = container.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      let show = true;
      
      filters.forEach(filter => {
        const filterName = filter.id.replace('filter_', '');
        const filterValue = filter.value.toLowerCase();
        
        if (filterValue) {
          const cell = row.querySelector(`td[data-filter="${filterName}"]`) || 
                       row.querySelector(`td:nth-child(${this.getFilterColumn(containerId, filterName)})`);
          
          if (cell && !cell.textContent.toLowerCase().includes(filterValue)) {
            show = false;
          }
        }
      });
      
      row.style.display = show ? '' : 'none';
    });
  },
  
  // 清除筛选
  clearFilters(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.querySelectorAll('[id^="filter_"]').forEach(filter => {
      filter.value = '';
    });
    
    this.applyFilters(containerId);
  },
  
  // 获取筛选列索引
  getFilterColumn(containerId, filterName) {
    const columnMap = {
      inquiry: { company: 2, name: 3, phone: 4, status: 6 },
      news: { title: 1, date: 2 },
      tools: { name: 1, url: 2 }
    };
    
    return columnMap[containerId]?.[filterName] || 2;
  }
};

// ============================================================================
// 4. 数据导入导出模块 (Data Import/Export)
// ============================================================================

const DataExport = {
  // 导出为JSON
  exportToJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    this.downloadBlob(blob, filename || `export_${Date.now()}.json`);
    Toast.show('JSON导出成功', 'success');
  },
  
  // 导出为CSV
  exportToCSV(data, headers, filename) {
    if (!Array.isArray(data) || data.length === 0) {
      Toast.show('没有可导出的数据', 'warning');
      return;
    }
    
    const headerRow = headers.map(h => h.title).join(',');
    const dataRows = data.map(item => 
      headers.map(h => {
        let value = this.getNestedValue(item, h.key);
        
        // 处理日期
        if (h.type === 'date' && value) {
          value = new Date(value).toLocaleString();
        }
        
        // 转义CSV特殊字符
        value = String(value || '').replace(/"/g, '""');
        return `"${value}"`;
      }).join(',')
    ).join('\n');
    
    const csv = '\ufeff' + [headerRow, dataRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    this.downloadBlob(blob, filename || `export_${Date.now()}.csv`);
    Toast.show('CSV导出成功', 'success');
  },
  
  // 获取嵌套值
  getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  },
  
  // 下载Blob
  downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },
  
  // 导入JSON
  async importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        Toast.show(`成功导入 ${Array.isArray(data) ? data.length : 1} 条数据`, 'success');
        
        // 返回导入的数据供后续处理
        return data;
      } catch (err) {
        Toast.show('JSON格式错误：' + err.message, 'error');
        return null;
      }
    };
    input.click();
  },
  
  // 批量导入数据到后端
  async batchImport(endpoint, dataArray) {
    let success = 0;
    let failed = 0;
    
    Toast.show(`正在导入 ${dataArray.length} 条数据...`, 'info');
    
    for (const item of dataArray) {
      try {
        const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
          body: JSON.stringify(item)
        });
        
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    
    Toast.show(`导入完成：成功 ${success} 条，失败 ${failed} 条`, 
      failed === 0 ? 'success' : 'warning');
    
    return { success, failed };
  }
};

// 导出函数别名
function exportToJSON(data, filename) {
  DataExport.exportToJSON(data, filename);
}

function exportToCSV(data, headers, filename) {
  DataExport.exportToCSV(data, headers, filename);
}

// ============================================================================
// 5. 操作日志模块 (Activity Log)
// ============================================================================

const ActivityLog = {
  logs: [],
  maxLogs: 100,
  
  // 记录操作
  log(action, details = {}) {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details,
      admin: sessionStorage.getItem('adminName') || '未知欧阳波',
      ip: '客户端'
    };
    
    this.logs.unshift(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // 保存到本地存储
    this.saveToStorage();
    
    // 控制台输出（开发环境）
    if (typeof console !== 'undefined') {
      console.log(`[Activity] ${action}`, details);
    }
  },
  
  // 保存到本地存储
  saveToStorage() {
    try {
      localStorage.setItem('activityLogs', JSON.stringify(this.logs));
    } catch (e) {
      console.warn('无法保存日志到本地存储', e);
    }
  },
  
  // 从本地存储加载
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('activityLogs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('无法从本地存储加载日志', e);
    }
  },
  
  // 获取日志
  getLogs(filter = {}) {
    let filtered = [...this.logs];
    
    if (filter.action) {
      filtered = filtered.filter(l => l.action === filter.action);
    }
    
    if (filter.admin) {
      filtered = filtered.filter(l => l.admin === filter.admin);
    }
    
    if (filter.startDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(filter.startDate));
    }
    
    if (filter.endDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(filter.endDate));
    }
    
    return filtered;
  },
  
  // 导出日志
  exportLogs(filter = {}) {
    const logs = this.getLogs(filter);
    DataExport.exportToJSON(logs, `activity_logs_${Date.now()}.json`);
  },
  
  // 显示日志面板
  showLogPanel() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.style.zIndex = '10000';
    
    const logs = this.getLogs().slice(0, 50); // 显示最近50条
    
    modal.innerHTML = `
      <div class="modal-content" style="width: 800px; max-height: 80vh;">
        <div class="modal-header">
          <h3 class="modal-title">操作日志</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body" style="padding: 0; max-height: calc(80vh - 140px); overflow-y: auto;">
          <table style="width: 100%;">
            <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 1;">
              <tr>
                <th style="padding: 12px;">时间</th>
                <th style="padding: 12px;">操作</th>
                <th style="padding: 12px;">欧阳波</th>
                <th style="padding: 12px;">详情</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 12px; font-size: 12px; color: #666;">${new Date(log.timestamp).toLocaleString()}</td>
                  <td style="padding: 12px;"><span style="background: #e6f0ff; color: #0055b8; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${log.action}</span></td>
                  <td style="padding: 12px;">${log.admin}</td>
                  <td style="padding: 12px; font-size: 12px; color: #666; max-width: 300px; word-break: break-all;">${JSON.stringify(log.details)}</td>
                </tr>
              `).join('')}
              ${logs.length === 0 ? '<tr><td colspan="4" style="padding: 40px; text-align: center; color: #999;">暂无操作日志</td></tr>' : ''}
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-secondary" onclick="ActivityLog.exportLogs()">导出日志</button>
          <button class="modal-btn modal-btn-secondary" onclick="ActivityLog.clearLogs()">清空日志</button>
          <button class="modal-btn modal-btn-primary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  // 清空日志
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('activityLogs');
    Toast.show('日志已清空', 'success');
  }
};

// 初始化日志系统
ActivityLog.loadFromStorage();

// ============================================================================
// 6. 备份恢复模块 (Backup & Restore)
// ============================================================================

const BackupRestore = {
  // 创建备份
  async createBackup() {
    Toast.show('正在创建备份...', 'info');
    
    try {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {}
      };
      
      // 备份各模块数据
      const modules = ['inquiries', 'news', 'tools', 'settings', 'content'];
      
      for (const module of modules) {
        try {
          const res = await fetch(`http://localhost:3000/api/${module}`, {
            headers: getAuthHeader()
          });
          
          if (res.ok) {
            backup.data[module] = await res.json();
          }
        } catch {
          // 尝试从本地存储恢复
          const localData = localStorage.getItem(module === 'settings' ? 'siteSettings' : module);
          if (localData) {
            backup.data[module] = JSON.parse(localData);
          }
        }
      }
      
      // 导出备份文件
      DataExport.exportToJSON(backup, `flo_backup_${new Date().toISOString().slice(0,10)}.json`);
      
      // 记录操作
      ActivityLog.log('创建备份', { filename: `flo_backup_${Date.now()}.json` });
      
      Toast.show('备份创建成功', 'success');
      return backup;
    } catch (err) {
      Toast.show('备份失败：' + err.message, 'error');
      return null;
    }
  },
  
  // 恢复备份
  async restoreBackup(file) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      // 验证备份格式
      if (!backup.data || typeof backup.data !== 'object') {
        Toast.show('备份文件格式无效', 'error');
        return false;
      }
      
      const confirmed = await showConfirmDialog(
        '确认恢复备份',
        `确定要恢复备份吗？这将覆盖当前所有数据。`
      );
      
      if (!confirmed) return false;
      
      let restored = 0;
      let failed = 0;
      
      // 恢复各模块数据
      for (const [module, data] of Object.entries(backup.data)) {
        try {
          if (Array.isArray(data)) {
            // 批量恢复列表数据
            for (const item of data) {
              await fetch(`http://localhost:3000/api/${module}`, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
                body: JSON.stringify(item)
              });
            }
          } else if (typeof data === 'object') {
            // 恢复设置数据
            await fetch(`http://localhost:3000/api/content/${module === 'settings' ? 'settings' : 'home'}`, {
              method: 'PUT',
              headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
              body: JSON.stringify(data)
            });
          }
          restored++;
        } catch {
          failed++;
        }
      }
      
      // 清除缓存
      DataCache.clearAll();
      
      // 记录操作
      ActivityLog.log('恢复备份', { 
        timestamp: backup.timestamp,
        restored: restored,
        failed: failed
      });
      
      Toast.show(`恢复完成：成功 ${restored} 项，失败 ${failed} 项`, 
        failed === 0 ? 'success' : 'warning');
      
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
      return failed === 0;
    } catch (err) {
      Toast.show('恢复失败：' + err.message, 'error');
      return false;
    }
  },
  
  // 触发备份选择
  triggerRestore() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.restoreBackup(file);
      }
    };
    input.click();
  },
  
  // 获取备份历史
  getBackupHistory() {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    return history;
  },
  
  // 保存备份记录
  saveBackupRecord(filename) {
    const history = this.getBackupHistory();
    history.unshift({
      filename,
      timestamp: new Date().toISOString(),
      size: 'N/A'
    });
    
    // 只保留最近10条记录
    const trimmed = history.slice(0, 10);
    localStorage.setItem('backupHistory', JSON.stringify(trimmed));
  }
};

// ============================================================================
// 7. 用户管理模块 (User Management)
// ============================================================================

const UserManagement = {
  currentUser: null,
  users: [],
  
  // 获取当前用户信息
  async getCurrentUser() {
    const token = sessionStorage.getItem('adminToken');
    const name = sessionStorage.getItem('adminName');
    
    this.currentUser = {
      name: name || '欧阳波',
      role: 'admin',
      loginTime: sessionStorage.getItem('loginTime')
    };
    
    return this.currentUser;
  },
  
  // 检查权限
  hasPermission(permission) {
    const rolePermissions = {
      'admin': ['read', 'write', 'delete', 'settings', 'users', 'logs', 'backup'],
      'editor': ['read', 'write', 'logs'],
      'viewer': ['read']
    };
    
    const userRole = this.currentUser?.role || 'viewer';
    return rolePermissions[userRole]?.includes(permission) || false;
  },
  
  // 显示用户信息面板
  showUserPanel() {
    this.getCurrentUser();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
      <div class="modal-content" style="width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">用户信息</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #0055b8, #003d8a); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 700; margin: 0 auto 16px;">
              ${this.currentUser?.name?.charAt(0) || '管'}
            </div>
            <h3 style="margin-bottom: 4px;">${this.currentUser?.name || '欧阳波'}</h3>
            <span style="background: #e6f0ff; color: #0055b8; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
              ${this.currentUser?.role === 'admin' ? '超级欧阳波' : '普通用户'}
            </span>
          </div>
          
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">登录时间</span>
              <span>${this.currentUser?.loginTime ? new Date(this.currentUser.loginTime).toLocaleString() : '未知'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">会话剩余</span>
              <span id="sessionTimer">2小时</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-secondary" onclick="ActivityLog.showLogPanel()">操作日志</button>
          <button class="modal-btn modal-btn-primary" onclick="UserManagement.logout()">退出登录</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 更新会话计时器
    this.updateSessionTimer();
  },
  
  // 更新会话计时器
  updateSessionTimer() {
    const loginTime = sessionStorage.getItem('loginTime');
    if (!loginTime) return;
    
    const update = () => {
      const elapsed = Date.now() - new Date(loginTime).getTime();
      const remaining = 2 * 60 * 60 * 1000 - elapsed; // 2小时
      
      const timerEl = document.getElementById('sessionTimer');
      if (timerEl && remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        timerEl.textContent = `${hours}小时${minutes}分钟`;
      } else if (timerEl) {
        timerEl.textContent = '已过期';
        timerEl.style.color = '#dc3545';
      }
    };
    
    update();
    setInterval(update, 60000);
  },
  
  // 退出登录
  logout() {
    sessionStorage.clear();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
  }
};

// ============================================================================
// 8. 性能监控模块 (Performance Monitor)
// ============================================================================

const PerformanceMonitor = {
  metrics: {
    pageLoadTime: 0,
    apiResponseTime: [],
    memoryUsage: 0,
    lastActivity: Date.now()
  },
  
  // 测量页面加载时间
  measurePageLoad() {
    window.addEventListener('load', () => {
      const timing = performance.timing;
      this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      console.log(`页面加载时间: ${this.metrics.pageLoadTime}ms`);
    });
  },
  
  // 测量API响应时间
  async measureApiCall(url, fetchFn) {
    const start = Date.now();
    try {
      const result = await fetchFn();
      const duration = Date.now() - start;
      this.metrics.apiResponseTime.push({ url, duration, timestamp: Date.now() });
      
      // 保留最近50条记录
      if (this.metrics.apiResponseTime.length > 50) {
        this.metrics.apiResponseTime.shift();
      }
      
      return result;
    } catch (err) {
      this.metrics.apiResponseTime.push({ url, duration: Date.now() - start, error: true });
      throw err;
    }
  },
  
  // 获取性能报告
  getReport() {
    const avgResponseTime = this.metrics.apiResponseTime.length > 0
      ? (this.metrics.apiResponseTime.reduce((sum, m) => sum + m.duration, 0) / this.metrics.apiResponseTime.length).toFixed(0)
      : 'N/A';
    
    return {
      pageLoadTime: this.metrics.pageLoadTime,
      avgApiResponseTime: avgResponseTime,
      apiCalls: this.metrics.apiResponseTime.length,
      memoryUsage: this.metrics.memoryUsage
    };
  },
  
  // 显示性能面板
  showPerformancePanel() {
    const report = this.getReport();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
      <div class="modal-content" style="width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title">性能监控</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #0055b8;">${report.pageLoadTime}ms</div>
              <div style="font-size: 12px; color: #666;">页面加载时间</div>
            </div>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #28a745;">${report.avgApiResponseTime}ms</div>
              <div style="font-size: 12px; color: #666;">平均API响应</div>
            </div>
          </div>
          
          <h4 style="margin-bottom: 12px;">API调用历史</h4>
          <div style="max-height: 200px; overflow-y: auto;">
            <table style="width: 100%; font-size: 12px;">
              <thead>
                <tr>
                  <th style="padding: 8px;">接口</th>
                  <th style="padding: 8px;">响应时间</th>
                  <th style="padding: 8px;">时间</th>
                </tr>
              </thead>
              <tbody>
                ${this.metrics.apiResponseTime.slice(-10).reverse().map(call => `
                  <tr>
                    <td style="padding: 8px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${call.url}</td>
                    <td style="padding: 8px; color: ${call.error ? '#dc3545' : call.duration > 1000 ? '#f0ad4e' : '#28a745'}">${call.duration}ms</td>
                    <td style="padding: 8px; color: #666;">${new Date(call.timestamp).toLocaleTimeString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-secondary" onclick="PerformanceMonitor.clearMetrics()">清除数据</button>
          <button class="modal-btn modal-btn-primary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  // 清除性能数据
  clearMetrics() {
    this.metrics.apiResponseTime = [];
    Toast.show('性能数据已清除', 'success');
    this.showPerformancePanel();
  }
};

// 初始化性能监控
PerformanceMonitor.measurePageLoad();

// ============================================================================
// 9. 快捷键模块 (Keyboard Shortcuts)
// ============================================================================

const KeyboardShortcuts = {
  shortcuts: {
    's': { action: 'save', description: '保存当前设置', handler: null },
    'r': { action: 'refresh', description: '刷新数据', handler: null },
    'e': { action: 'export', description: '导出数据', handler: null },
    '/': { action: 'search', description: '聚焦搜索框', handler: null },
    'Escape': { action: 'close', description: '关闭弹窗', handler: null },
    '?': { action: 'help', description: '显示帮助', handler: null }
  },
  
  init() {
    document.addEventListener('keydown', (e) => {
      // 忽略在输入框中的快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      if (this.shortcuts[key]) {
        e.preventDefault();
        this.execute(key);
      }
    });
  },
  
  execute(key) {
    const shortcut = this.shortcuts[key];
    if (!shortcut) return;
    
    switch (key) {
      case 's':
        // 尝试保存设置
        if (typeof saveSettings === 'function') {
          saveSettings();
        }
        break;
      case 'r':
        // 刷新数据
        DataCache.clearAll();
        if (typeof loadInquiries === 'function') loadInquiries(true);
        if (typeof loadNews === 'function') loadNews(true);
        if (typeof loadTools === 'function') loadTools(true);
        Toast.show('数据已刷新', 'info');
        break;
      case 'e':
        // 导出数据
        if (typeof exportData === 'function') {
          exportData();
        }
        break;
      case '/':
        // 聚焦搜索框
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
        break;
      case 'escape':
        // 关闭所有弹窗
        document.querySelectorAll('.modal-overlay.show').forEach(modal => {
          modal.classList.remove('show');
        });
        break;
      case '?':
        this.showHelp();
        break;
    }
    
    ActivityLog.log('快捷键', { key });
  },
  
  showHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
      <div class="modal-content" style="width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title">键盘快捷键</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; gap: 8px;">
            ${Object.entries(this.shortcuts).map(([key, shortcut]) => `
              <div style="display: flex; align-items: center; padding: 8px 12px; background: #f8f9fa; border-radius: 6px;">
                <kbd style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; margin-right: 12px; min-width: 30px; text-align: center;">${key.toUpperCase()}</kbd>
                <span style="color: #666;">${shortcut.description}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-primary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
};

// 初始化快捷键
KeyboardShortcuts.init();

// ============================================================================
// 10. 增强UI组件 (Enhanced UI Components)
// ============================================================================

const EnhancedUI = {
  // 添加加载动画到按钮
  addLoadingState(button, loadingText = '处理中...') {
    const originalContent = button.innerHTML;
    button.dataset.originalContent = originalContent;
    button.disabled = true;
    button.innerHTML = `<span class="btn-loading">⏳ ${loadingText}</span>`;
    
    return () => {
      button.disabled = false;
      button.innerHTML = button.dataset.originalContent || originalContent;
    };
  },
  
  // 添加成功动画
  showSuccessAnimation(element) {
    element.style.transform = 'scale(1.05)';
    element.style.transition = 'transform 0.2s ease';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
  },
  
  // 创建骨架屏
  createSkeleton(container, count = 3) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-item';
      skeleton.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;
        animation: pulse 1.5s infinite;
      `;
      skeleton.innerHTML = `
        <div style="height: 16px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; border-radius: 4px; margin-bottom: 8px; width: 60%;"></div>
        <div style="height: 12px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; border-radius: 4px; width: 40%;"></div>
      `;
      container.appendChild(skeleton);
    }
    
    // 添加动画样式
    if (!document.getElementById('skeleton-styles')) {
      const style = document.createElement('style');
      style.id = 'skeleton-styles';
      style.textContent = `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  },
  
  // 显示空状态
  showEmptyState(container, message, actionLabel, onAction) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #999;">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <h3 style="margin-bottom: 8px; color: #666;">${message}</h3>
        ${actionLabel ? `
          <button class="btn-sm btn-primary-sm" style="margin-top: 16px;" onclick="${onAction}">
            ${actionLabel}
          </button>
        ` : ''}
      </div>
    `;
  },
  
  // 添加工具提示
  addTooltip(element, text) {
    element.style.position = 'relative';
    element.setAttribute('data-tooltip', text);
    
    element.addEventListener('mouseenter', () => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = text;
      tooltip.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        margin-bottom: 8px;
        z-index: 1000;
      `;
      element.appendChild(tooltip);
    });
    
    element.addEventListener('mouseleave', () => {
      const tooltip = element.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
    });
  }
};

// ============================================================================
// 11. 自动保存模块 (Auto Save)
// ============================================================================

const AutoSave = {
  timers: {},
  
  // 启用自动保存
  enable(fieldIds, endpoint, interval = 30000) { // 默认30秒
    Toast.show('自动保存已启用', 'info', 2000);
    
    fieldIds.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field) return;
      
      let timer;
      
      field.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.save(fieldId, endpoint);
        }, interval);
      });
      
      this.timers[fieldId] = { timer, interval };
    });
    
    // 页面离开时保存
    window.addEventListener('beforeunload', () => {
      fieldIds.forEach(fieldId => {
        if (this.timers[fieldId]) {
          clearTimeout(this.timers[fieldId].timer);
        }
      });
    });
  },
  
  // 保存单个字段
  async save(fieldId, endpoint) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const value = field.value;
    
    try {
      await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: 'PATCH',
        headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeader()),
        body: JSON.stringify({ [fieldId]: value })
      });
      
      // 显示保存提示
      const indicator = document.createElement('span');
      indicator.className = 'autosave-indicator';
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        animation: fadeInOut 2s forwards;
      `;
      indicator.textContent = '✓ 已自动保存';
      document.body.appendChild(indicator);
      
      setTimeout(() => indicator.remove(), 2000);
      
      ActivityLog.log('自动保存', { fieldId, endpoint });
    } catch (err) {
      console.warn('自动保存失败', err);
    }
  },
  
  // 禁用自动保存
  disable(fieldIds) {
    fieldIds.forEach(fieldId => {
      if (this.timers[fieldId]) {
        clearTimeout(this.timers[fieldId].timer);
        delete this.timers[fieldId];
      }
    });
  }
};

// 添加淡入淡出动画
const fadeStyle = document.createElement('style');
fadeStyle.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(10px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; }
    100% { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(fadeStyle);

// ============================================================================
// 12. 一键优化按钮 (Quick Optimize)
// ============================================================================

const QuickOptimize = {
  // 执行一键优化
  async optimizeAll() {
    Toast.show('正在优化系统...', 'info');
    
    try {
      // 1. 清除缓存
      DataCache.clearAll();
      
      // 2. 预加载常用数据
      await Promise.all([
        fetch('http://localhost:3000/api/inquiries', { headers: getAuthHeader() }).catch(() => null),
        fetch('http://localhost:3000/api/news', { headers: getAuthHeader() }).catch(() => null),
        fetch('http://localhost:3000/api/tools', { headers: getAuthHeader() }).catch(() => null)
      ]);
      
      // 3. 记录优化操作
      ActivityLog.log('一键优化', { timestamp: new Date().toISOString() });
      
      Toast.show('优化完成！系统运行更加流畅。', 'success', 3000);
    } catch (err) {
      Toast.show('优化过程中出现一些问题', 'warning');
    }
  },
  
  // 添加优化按钮到控制台
  addOptimizeButton() {
    const dashboardPage = document.getElementById('dashboardPage');
    if (!dashboardPage) return;
    
    const statsGrid = dashboardPage.querySelector('.stats-grid');
    if (statsGrid) {
      const optimizeBtn = document.createElement('button');
      optimizeBtn.className = 'btn-sm btn-primary-sm';
      optimizeBtn.innerHTML = '🚀 一键优化';
      optimizeBtn.style.marginLeft = '16px';
      optimizeBtn.onclick = () => this.optimizeAll();
      
      // 找到刷新按钮并在其后添加
      const refreshBtn = dashboardPage.querySelector('button[onclick*="loadInquiries"]');
      if (refreshBtn) {
        refreshBtn.parentElement.appendChild(optimizeBtn);
      }
    }
  }
};

// 初始化一键优化按钮
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    QuickOptimize.addOptimizeButton();
  }, 1000);
});

// ============================================================================
// 导出全局访问点
// ============================================================================

window.Validator = Validator;
window.BulkOperations = BulkOperations;
window.SearchFilter = SearchFilter;
window.DataExport = DataExport;
window.ActivityLog = ActivityLog;
window.BackupRestore = BackupRestore;
window.UserManagement = UserManagement;
window.PerformanceMonitor = PerformanceMonitor;
window.KeyboardShortcuts = KeyboardShortcuts;
window.EnhancedUI = EnhancedUI;
window.AutoSave = AutoSave;
window.QuickOptimize = QuickOptimize;

// ============================================================================
// 使用示例和初始化
// ============================================================================

console.log('✅ 管理后台增强功能已加载');
console.log('可用模块:');
console.log('- Validator: 数据验证');
console.log('- BulkOperations: 批量操作');
console.log('- SearchFilter: 搜索筛选');
console.log('- DataExport: 数据导出');
console.log('- ActivityLog: 操作日志');
console.log('- BackupRestore: 备份恢复');
console.log('- UserManagement: 用户管理');
console.log('- PerformanceMonitor: 性能监控');
console.log('- KeyboardShortcuts: 键盘快捷键 (按 ? 查看帮助)');
console.log('- EnhancedUI: 增强UI组件');
console.log('- AutoSave: 自动保存');
console.log('- QuickOptimize: 一键优化');
