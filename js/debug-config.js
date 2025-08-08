// 调试配置文件
// 设置为 true 启用调试模式，false 禁用调试输出
window.DEBUG_CONFIG = {
  // 全局调试开关
  enabled: false,
  
  // 各模块调试开关
  musicColorExtractor: false,
  musicAutoSkip: false,
  musicPlayerCollapse: false,
  musicContextMenu: false,
  lyricsProgressControl: false,
  clockFix: false,
  
  // 调试日志函数
  log: function(module, message, ...args) {
    if (this.enabled && this[module]) {
      console.log(`[${module.toUpperCase()}]`, message, ...args);
    }
  },
  
  warn: function(module, message, ...args) {
    if (this.enabled && this[module]) {
      console.warn(`[${module.toUpperCase()}]`, message, ...args);
    }
  },
  
  error: function(module, message, ...args) {
    if (this.enabled && this[module]) {
      console.error(`[${module.toUpperCase()}]`, message, ...args);
    }
  }
};

// 全局启用/禁用调试的便捷函数
window.enableDebug = function(modules = []) {
  window.DEBUG_CONFIG.enabled = true;
  if (modules.length === 0) {
    // 启用所有模块
    Object.keys(window.DEBUG_CONFIG).forEach(key => {
      if (typeof window.DEBUG_CONFIG[key] === 'boolean') {
        window.DEBUG_CONFIG[key] = true;
      }
    });
  } else {
    // 启用指定模块
    modules.forEach(module => {
      if (window.DEBUG_CONFIG.hasOwnProperty(module)) {
        window.DEBUG_CONFIG[module] = true;
      }
    });
  }
  console.log('调试模式已启用:', window.DEBUG_CONFIG);
};

window.disableDebug = function() {
  window.DEBUG_CONFIG.enabled = false;
  Object.keys(window.DEBUG_CONFIG).forEach(key => {
    if (typeof window.DEBUG_CONFIG[key] === 'boolean') {
      window.DEBUG_CONFIG[key] = false;
    }
  });
  console.log('调试模式已禁用');
};

// 使用示例：
// enableDebug() - 启用所有调试
// enableDebug(['musicColorExtractor', 'musicAutoSkip']) - 启用特定模块调试
// disableDebug() - 禁用所有调试