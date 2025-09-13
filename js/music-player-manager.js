// 音乐播放器统一管理器 - 解决初始化时序问题
(function() {
  'use strict';
  
  // 防止重复初始化
  if (window.musicPlayerManagerInitialized) return;
  window.musicPlayerManagerInitialized = true;
  
  // 播放器状态管理
  const playerState = {
    isReady: false,
    instance: null,
    element: null,
    readyCallbacks: [],
    initAttempts: 0,
    maxAttempts: 30, // 最多尝试30次，每次1秒，总共30秒
    checkInterval: 1000 // 检查间隔1秒
  };
  
  // 添加就绪回调
  function onPlayerReady(callback) {
    if (typeof callback !== 'function') return;
    
    if (playerState.isReady && playerState.instance) {
      callback(playerState.instance, playerState.element);
    } else {
      playerState.readyCallbacks.push(callback);
    }
  }
  
  // 触发所有就绪回调
  function triggerReadyCallbacks() {
    if (!playerState.isReady || !playerState.instance) return;
    
    playerState.readyCallbacks.forEach(callback => {
      try {
        callback(playerState.instance, playerState.element);
      } catch (error) {
        console.warn('音乐播放器回调执行失败:', error);
      }
    });
    
    // 清空回调数组
    playerState.readyCallbacks = [];
  }
  
  // 检查播放器就绪状态
  function checkPlayerReady() {
    // 检查基础依赖
    if (!window.APlayer || !window.MetingJSElement) {
      return false;
    }
    
    // 检查DOM元素
    const metingElement = document.querySelector('#nav-music meting-js');
    if (!metingElement) {
      return false;
    }
    
    // 检查APlayer实例
    if (!metingElement.aplayer) {
      return false;
    }
    
    // 检查实例是否完全初始化
    const aplayer = metingElement.aplayer;
    if (!aplayer.audio || !aplayer.list) {
      return false;
    }
    
    // 更新状态
    playerState.isReady = true;
    playerState.instance = aplayer;
    playerState.element = metingElement;
    
    return true;
  }
  
  // 开始监控播放器状态
  function startMonitoring() {
    const checkTimer = setInterval(() => {
      playerState.initAttempts++;
      
      if (checkPlayerReady()) {
        clearInterval(checkTimer);
        triggerReadyCallbacks();
        return;
      }
      
      // 达到最大尝试次数后停止
      if (playerState.initAttempts >= playerState.maxAttempts) {
        clearInterval(checkTimer);
        console.warn('音乐播放器初始化超时，已停止尝试');
        return;
      }
    }, playerState.checkInterval);
    
    // 存储定时器引用，以便清理
    window.musicPlayerMonitorTimer = checkTimer;
  }
  
  // 立即检查一次，如果不行则开始监控
  if (!checkPlayerReady()) {
    startMonitoring();
  } else {
    triggerReadyCallbacks();
  }
  
  // 暴露全局API
  window.musicPlayerManager = {
    onReady: onPlayerReady,
    isReady: () => playerState.isReady,
    getInstance: () => playerState.instance,
    getElement: () => playerState.element,
    getState: () => ({ ...playerState, readyCallbacks: playerState.readyCallbacks.length })
  };
  
  // PJAX兼容性处理
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', () => {
      // 重置状态
      playerState.isReady = false;
      playerState.instance = null;
      playerState.element = null;
      playerState.initAttempts = 0;
      
      // 清理旧的监控定时器
      if (window.musicPlayerMonitorTimer) {
        clearInterval(window.musicPlayerMonitorTimer);
        window.musicPlayerMonitorTimer = null;
      }
      
      // 延迟重新开始监控
      setTimeout(() => {
        if (!checkPlayerReady()) {
          startMonitoring();
        } else {
          triggerReadyCallbacks();
        }
      }, 500);
    }, 'musicPlayerManager');
  }
  
  // 监听页面卸载，清理资源
  window.addEventListener('beforeunload', () => {
    if (window.musicPlayerMonitorTimer) {
      clearInterval(window.musicPlayerMonitorTimer);
      window.musicPlayerMonitorTimer = null;
    }
  });
  
})();
