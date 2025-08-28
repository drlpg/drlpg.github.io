// 音乐播放器自动跳过配置文件
// 用户可以根据需要调整这些参数

window.MUSIC_SKIP_CONFIG = {
  // 基本超时设置
  loadTimeout: 10000,        // 歌曲加载超时时间（毫秒）- 默认10秒
  playTimeout: 5000,         // 播放开始超时时间（毫秒）- 默认5秒
  
  // 重试设置
  maxRetries: 2,             // 最大重试次数 - 默认2次
  errorRetryDelay: 2000,     // 重试延迟时间（毫秒）- 默认2秒
  skipDelay: 1000,           // 跳过延迟时间（毫秒）- 默认1秒
  
  // 错误检测开关
  detectStalled: true,       // 是否检测播放卡顿
  detectNetworkError: true,  // 是否检测网络错误
  detectDecodeError: true,   // 是否检测解码错误
  
  // 调试设置
  debug: true,               // 是否启用调试日志
  
  // 高级设置
  stallTimeout: 8000,        // 卡顿检测超时（毫秒）- 默认8秒
  progressCheckInterval: 1000, // 播放进度检查间隔（毫秒）- 默认1秒
  
  // 用户自定义设置
  customRules: {
    // 可以添加自定义的跳过规则
    // 例如：跳过特定URL模式的歌曲
    skipUrlPatterns: [
      // 'error',
      // '404',
      // 'unavailable'
    ],
    
    // 跳过特定歌曲名称
    skipSongNames: [
      // '无法播放',
      // '链接失效'
    ]
  }
};

// 预设配置方案
window.MUSIC_SKIP_PRESETS = {
  // 快速跳过模式 - 适合网络不稳定的环境
  fast: {
    loadTimeout: 5000,
    playTimeout: 3000,
    maxRetries: 1,
    errorRetryDelay: 1000,
    skipDelay: 500
  },
  
  // 标准模式 - 默认设置
  standard: {
    loadTimeout: 10000,
    playTimeout: 5000,
    maxRetries: 2,
    errorRetryDelay: 2000,
    skipDelay: 1000
  },
  
  // 耐心模式 - 适合网络较慢但稳定的环境
  patient: {
    loadTimeout: 20000,
    playTimeout: 10000,
    maxRetries: 3,
    errorRetryDelay: 3000,
    skipDelay: 1500
  },
  
  // 保守模式 - 最少的自动跳过
  conservative: {
    loadTimeout: 30000,
    playTimeout: 15000,
    maxRetries: 5,
    errorRetryDelay: 5000,
    skipDelay: 2000
  }
};

// 应用预设配置
window.applySkipPreset = function(presetName) {
  if (!MUSIC_SKIP_PRESETS[presetName]) {
    console.error('❌ 未知的预设配置:', presetName);
    return false;
  }
  
  const preset = MUSIC_SKIP_PRESETS[presetName];
  Object.assign(MUSIC_SKIP_CONFIG, preset);
  
  console.log('✅ 已应用预设配置:', presetName, preset);
  
  // 如果自动跳过脚本已加载，更新其配置
  if (typeof updateSkipConfig === 'function') {
    updateSkipConfig(MUSIC_SKIP_CONFIG);
  }
  
  return true;
};

// 获取当前配置
window.getCurrentSkipConfig = function() {
  return { ...MUSIC_SKIP_CONFIG };
};

// 更新单个配置项
window.updateSkipConfigItem = function(key, value) {
  if (key in MUSIC_SKIP_CONFIG) {
    MUSIC_SKIP_CONFIG[key] = value;
    console.log(`✅ 配置项 ${key} 已更新为:`, value);
    
    // 如果自动跳过脚本已加载，更新其配置
    if (typeof updateSkipConfig === 'function') {
      updateSkipConfig({ [key]: value });
    }
    
    return true;
  } else {
    console.error('❌ 未知的配置项:', key);
    return false;
  }
};

// 重置为默认配置
window.resetSkipConfig = function() {
  applySkipPreset('standard');
  console.log('🔄 配置已重置为标准模式');
};

// 导出配置供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MUSIC_SKIP_CONFIG,
    MUSIC_SKIP_PRESETS,
    applySkipPreset,
    getCurrentSkipConfig,
    updateSkipConfigItem,
    resetSkipConfig
  };
}

console.log('⚙️ 音乐跳过配置文件已加载');
console.log('💡 可用的预设配置:', Object.keys(MUSIC_SKIP_PRESETS));
console.log('💡 使用 applySkipPreset("fast") 来应用快速模式');
console.log('💡 使用 updateSkipConfigItem("loadTimeout", 15000) 来更新单个配置');