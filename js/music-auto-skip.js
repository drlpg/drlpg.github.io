// 音乐播放器自动跳过脚本
// 避免重复声明
if (typeof window.SKIP_CONFIG === 'undefined') {
window.SKIP_CONFIG = window.MUSIC_SKIP_CONFIG || {
  loadTimeout: 10000,
  playTimeout: 5000,
  errorRetryDelay: 2000,
  maxRetries: 2,
  skipDelay: 1000,
  detectStalled: true,
  detectNetworkError: true,
  detectDecodeError: true,
  debug: false
};

// 跳过统计
let skipStats = {
  totalSkipped: 0,
  skipReasons: {},
  skippedSongs: []
};

// 当前歌曲状态
let currentSongState = {
  index: -1,
  url: '',
  name: '',
  loadStartTime: 0,
  playStartTime: 0,
  retryCount: 0,
  hasError: false,
  isSkipping: false
};

// 定时器管理
let timers = {
  loadTimeout: null,
  playTimeout: null,
  skipDelay: null
};

// 初始化自动跳过功能
function initMusicAutoSkip() {
  // 使用统一的播放器管理器
  if (window.musicPlayerManager) {
    window.musicPlayerManager.onReady((aplayer, metingElement) => {
      bindPlayerEvents(aplayer);
    });
    return;
  }
  
  // 后备方案：直接检查
  const metingElement = document.querySelector('#nav-music meting-js');
  if (!metingElement || !metingElement.aplayer) {
    setTimeout(initMusicAutoSkip, 1000);
    return;
  }
  
  bindPlayerEvents(metingElement.aplayer);
}

// 绑定播放器事件
function bindPlayerEvents(aplayer) {
  aplayer.on('loadstart', function() {
    const currentMusic = getCurrentMusic(this);
    if (!currentMusic) return;
    
    updateCurrentSongState(this, currentMusic);
    startLoadTimeout();
  });
  
  aplayer.on('loadeddata', function() {
    clearTimer('loadTimeout');
  });
  
  aplayer.on('play', function() {
    try {
      clearTimer('loadTimeout');
      currentSongState.playStartTime = Date.now();
      startPlayTimeout();
    } catch (error) {
      // 静默处理错误
    }
  });
  
  aplayer.on('pause', function() {
    clearTimer('playTimeout');
  });
  
  aplayer.on('timeupdate', function() {
    try {
      if (this && this.audio && typeof this.audio.currentTime === 'number' && this.audio.currentTime > 0) {
        clearTimer('playTimeout');
        currentSongState.hasError = false;
      }
    } catch (error) {
      // 静默处理错误
    }
  });
  
  aplayer.on('error', function() {
    try {
      const currentMusic = getCurrentMusic(this);
      const errorMsg = `播放错误: ${currentMusic?.name || '未知歌曲'}`;
      
      if (SKIP_CONFIG.debug) {
        console.warn('❌', errorMsg);
      }
      handlePlaybackError(this, 'error', errorMsg);
    } catch (error) {
      // 静默处理错误
    }
  });
  
  if (aplayer.audio) {
    aplayer.audio.addEventListener('stalled', function() {
      if (SKIP_CONFIG.detectStalled) {
        const currentMusic = getCurrentMusic(aplayer);
        const errorMsg = `播放卡顿: ${currentMusic?.name || '未知歌曲'}`;
        
        // 静默处理播放停滞
        handlePlaybackError(aplayer, 'stalled', errorMsg);
      }
    });
    
    aplayer.audio.addEventListener('error', function(e) {
      if (SKIP_CONFIG.detectNetworkError) {
        const currentMusic = getCurrentMusic(aplayer);
        const error = e.target.error;
        let errorMsg = `网络错误: ${currentMusic?.name || '未知歌曲'}`;
        
        if (error) {
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMsg += ' (播放中止)';
              break;
            case error.MEDIA_ERR_NETWORK:
              errorMsg += ' (网络错误)';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMsg += ' (解码错误)';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg += ' (格式不支持)';
            break;
          default:
            errorMsg += ' (未知错误)';
        }
      }
      
      if (SKIP_CONFIG.debug) {
        console.warn('❌', errorMsg);
      }
      handlePlaybackError(aplayer, 'network_error', errorMsg);
    }
    });
  }
  
  aplayer.on('canplay', function() {
    clearAllTimers();
    currentSongState.hasError = false;
    currentSongState.retryCount = 0;
  });
}

// 获取当前歌曲信息
function getCurrentMusic(aplayer) {
  if (!aplayer || !aplayer.list || !aplayer.list.audios) {
    return null;
  }
  
  const currentIndex = aplayer.list.index || 0;
  return aplayer.list.audios[currentIndex] || null;
}

// 更新当前歌曲状态
function updateCurrentSongState(aplayer, currentMusic) {
  const currentIndex = aplayer.list.index || 0;
  
  // 如果是新歌曲，重置状态
  if (currentSongState.index !== currentIndex) {
    currentSongState = {
      index: currentIndex,
      url: currentMusic.url || '',
      name: currentMusic.name || '未知歌曲',
      loadStartTime: Date.now(),
      playStartTime: 0,
      retryCount: 0,
      hasError: false,
      isSkipping: false
    };
  }
}

// 开始加载超时检测
function startLoadTimeout() {
  clearTimer('loadTimeout');
  
  timers.loadTimeout = setTimeout(() => {
    const errorMsg = `加载超时: ${currentSongState.name} (${SKIP_CONFIG.loadTimeout}ms)`;
    
    if (SKIP_CONFIG.debug) {
      console.warn('⏰', errorMsg);
    }
    
    const metingElement = document.querySelector('#nav-music meting-js');
    if (metingElement && metingElement.aplayer) {
      handlePlaybackError(metingElement.aplayer, 'load_timeout', errorMsg);
    }
  }, SKIP_CONFIG.loadTimeout);
}

// 开始播放超时检测
function startPlayTimeout() {
  clearTimer('playTimeout');
  
  timers.playTimeout = setTimeout(() => {
    const errorMsg = `播放超时: ${currentSongState.name} (${SKIP_CONFIG.playTimeout}ms)`;
    
    if (SKIP_CONFIG.debug) {
      console.warn('⏰', errorMsg);
    }
    
    const metingElement = document.querySelector('#nav-music meting-js');
    if (metingElement && metingElement.aplayer) {
      handlePlaybackError(metingElement.aplayer, 'play_timeout', errorMsg);
    }
  }, SKIP_CONFIG.playTimeout);
}

// 清除指定定时器
function clearTimer(timerName) {
  if (timers[timerName]) {
    clearTimeout(timers[timerName]);
    timers[timerName] = null;
  }
}

// 清除所有定时器
function clearAllTimers() {
  Object.keys(timers).forEach(timerName => {
    clearTimer(timerName);
  });
}

// 处理播放错误
function handlePlaybackError(aplayer, errorType, errorMsg) {
  if (currentSongState.isSkipping) {
    return;
  }
  
  currentSongState.hasError = true;
  currentSongState.isSkipping = true;
  
  recordSkipStats(errorType, errorMsg);
  
  if (currentSongState.retryCount < SKIP_CONFIG.maxRetries) {
    currentSongState.retryCount++;
    
    
    setTimeout(() => {
      currentSongState.isSkipping = false;
      if (aplayer.paused) {
        aplayer.toggle();
      }
    }, SKIP_CONFIG.errorRetryDelay);
    
    return;
  }
  
  // 静默跳过无法播放的歌曲
  
  setTimeout(() => {
    try {
      aplayer.skipForward();
      currentSongState.isSkipping = false;
    } catch (error) {
      if (SKIP_CONFIG.debug) {
        console.error('❌ 跳过歌曲失败:', error);
      }
      currentSongState.isSkipping = false;
    }
  }, SKIP_CONFIG.skipDelay);
}

// 记录跳过统计
function recordSkipStats(errorType, errorMsg) {
  skipStats.totalSkipped++;
  
  if (!skipStats.skipReasons[errorType]) {
    skipStats.skipReasons[errorType] = 0;
  }
  skipStats.skipReasons[errorType]++;
  
  skipStats.skippedSongs.push({
    name: currentSongState.name,
    url: currentSongState.url,
    reason: errorType,
    message: errorMsg,
    time: new Date().toISOString(),
    retryCount: currentSongState.retryCount
  });
  
  // 限制记录数量，避免内存泄漏
  if (skipStats.skippedSongs.length > 50) {
    skipStats.skippedSongs = skipStats.skippedSongs.slice(-30);
  }
}

// 全局控制函数
window.skipCurrentSong = function(reason = 'manual') {
  const metingElement = document.querySelector('#nav-music meting-js');
  if (!metingElement || !metingElement.aplayer) {
    return '播放器未就绪';
  }
  
  const currentMusic = getCurrentMusic(metingElement.aplayer);
  if (currentMusic) {
    recordSkipStats(reason, `手动跳过: ${currentMusic.name}`);
  }
  
  try {
    metingElement.aplayer.skipForward();
    return '已跳过当前歌曲';
  } catch (error) {
    return '跳过失败: ' + error.message;
  }
};

window.getSkipStats = function() {
  return skipStats;
};

window.clearSkipStats = function() {
  skipStats = {
    totalSkipped: 0,
    skipReasons: {},
    skippedSongs: []
  };
  return '统计已清除';
};

window.getCurrentSongState = function() {
  return currentSongState;
};

window.testAutoSkip = function() {
  const metingElement = document.querySelector('#nav-music meting-js');
  if (!metingElement || !metingElement.aplayer) {
    return '播放器未就绪';
  }
  
  const currentMusic = getCurrentMusic(metingElement.aplayer);
  if (currentMusic) {
    handlePlaybackError(metingElement.aplayer, 'test', '测试跳过功能');
    return '测试跳过已触发';
  } else {
    return '没有当前歌曲';
  }
};

window.updateSkipConfig = function(newConfig) {
  Object.assign(SKIP_CONFIG, newConfig);
  return SKIP_CONFIG;
};

window.getSkipConfig = function() {
  return SKIP_CONFIG;
};

window.forceSkipErrorSongs = function() {
  const metingElement = document.querySelector('#nav-music meting-js');
  if (!metingElement || !metingElement.aplayer) {
    return '播放器未就绪';
  }
  
  const aplayer = metingElement.aplayer;
  const playlist = aplayer.list?.audios;
  
  if (!playlist || playlist.length === 0) {
    return '播放列表为空';
  }
  
  let skippedCount = 0;
  
  playlist.forEach((song, index) => {
    if (!song.url || song.url.includes('error') || song.url.includes('404')) {
      skippedCount++;
    }
  });
  
  return `检查完成，发现 ${skippedCount} 首可能有问题的歌曲`;
};

// 启动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initMusicAutoSkip, 1500);
  });
} else {
  setTimeout(initMusicAutoSkip, 1500);
}

} // 结束 SKIP_CONFIG 重复声明检查