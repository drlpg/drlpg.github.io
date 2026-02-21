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
    // 静默处理错误
  }
  
  // 统一的成功处理
  function handleSuccess(scriptName) {
    scriptStatus[scriptName] = true;
  }
  
  // 检查所有脚本是否加载完成
  function checkAllScriptsLoaded() {
    const allLoaded = Object.values(scriptStatus).every(status => status);
    // 静默完成
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
        
        // 时钟初始化现在由 clock-fix.js 自己处理
        // 这里只是标记状态
        if (typeof getIpInfo === 'function') {
          handleSuccess('clockFix');
        }
        
        checkAllScriptsLoaded();
        
      } catch (error) {
        handleError('INIT', error);
      }
    }, 500);
  }
  
  // PJAX 兼容的初始化
  function setupInitialization() {
    // 首次加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeScripts);
    } else {
      initializeScripts();
    }
    
    // PJAX 页面切换后重新初始化需要的模块
    if (typeof btf !== 'undefined' && btf.addGlobalFn) {
      btf.addGlobalFn('pjaxComplete', () => {
        // 重置状态
        Object.keys(scriptStatus).forEach(key => {
          if (key !== 'clockFix') { // 时钟有自己的 PJAX 处理
            scriptStatus[key] = false;
          }
        });
        
        // 重新初始化需要的模块（延迟确保播放器已加载）
        setTimeout(() => {
          try {
            // 清理并重新初始化右键菜单
            if (typeof cleanupMusicContextMenu === 'function') {
              cleanupMusicContextMenu();
            }
            if (typeof initMusicContextMenu === 'function') {
              initMusicContextMenu();
              handleSuccess('musicContextMenu');
            }
            
            if (typeof initMusicPlayerAutoCollapse === 'function') {
              initMusicPlayerAutoCollapse();
              handleSuccess('musicCollapse');
            }
            
          } catch (error) {
            handleError('PJAX_REINIT', error);
          }
        }, 800);
      }, 'scriptReinit');
    } else {
      // 兼容其他 PJAX 实现
      window.addEventListener('pjax:complete', () => {
        setTimeout(() => {
          try {
            // 清理并重新初始化右键菜单
            if (typeof cleanupMusicContextMenu === 'function') {
              cleanupMusicContextMenu();
            }
            if (typeof initMusicContextMenu === 'function') {
              initMusicContextMenu();
            }
            if (typeof initMusicPlayerAutoCollapse === 'function') {
              initMusicPlayerAutoCollapse();
            }
          } catch (error) {
            handleError('PJAX_REINIT', error);
          }
        }, 800);
      });
    }
  }
  
  // 执行初始化设置
  setupInitialization();
  
})();