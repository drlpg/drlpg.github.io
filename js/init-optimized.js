// 优化后的脚本初始化管理器
(function() {
  'use strict';
  
  // 脚本加载状态
  const scriptStatus = {
    lyricsControl: false,
    musicColor: false,
    musicAutoSkip: false,
    musicCollapse: false,
    musicContextMenu: false,
    clockFix: false
  };
  
  // 统一的错误处理
  function handleError(scriptName, error) {
    if (window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled) {
      console.error(`[${scriptName}] 初始化失败:`, error);
    }
  }
  
  // 统一的成功处理
  function handleSuccess(scriptName) {
    scriptStatus[scriptName] = true;
    if (window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled) {
      console.log(`[${scriptName}] 初始化成功`);
    }
  }
  
  // 检查所有脚本是否加载完成
  function checkAllScriptsLoaded() {
    const allLoaded = Object.values(scriptStatus).every(status => status);
    if (allLoaded && window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled) {
      console.log('✅ 所有优化脚本加载完成');
    }
  }
  
  // DOM就绪后执行初始化
  function initializeScripts() {
    // 延迟执行，确保其他依赖已加载
    setTimeout(() => {
      try {
        // 初始化各个模块
        if (typeof initTotalDisable === 'function') {
          initTotalDisable();
          handleSuccess('lyricsControl');
        }
        
        if (typeof initSimpleMusicColor === 'function') {
          initSimpleMusicColor();
          handleSuccess('musicColor');
        }
        
        if (typeof initMusicAutoSkip === 'function') {
          initMusicAutoSkip();
          handleSuccess('musicAutoSkip');
        }
        
        if (typeof initMusicPlayerAutoCollapse === 'function') {
          initMusicPlayerAutoCollapse();
          handleSuccess('musicCollapse');
        }
        
        if (typeof initMusicContextMenu === 'function') {
          initMusicContextMenu();
          handleSuccess('musicContextMenu');
        }
        
        if (typeof getIpInfo === 'function') {
          getIpInfo();
          handleSuccess('clockFix');
        }
        
        checkAllScriptsLoaded();
        
      } catch (error) {
        handleError('INIT', error);
      }
    }, 500);
  }
  
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScripts);
  } else {
    initializeScripts();
  }
  
  // 提供全局状态检查函数
  window.checkScriptStatus = function() {
    console.log('脚本加载状态:', scriptStatus);
    return scriptStatus;
  };
  
})();