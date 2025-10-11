// 音乐播放器歌词和进度条控制禁用脚本
window.LYRICS_PROGRESS_DISABLED = true;

// 拦截用户交互事件，保留歌词更新功能
(function() {
  'use strict';
  
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if ((type === 'click' || type === 'mousedown' || type === 'touchstart') && 
        this.classList && (
          this.classList.contains('aplayer-lrc') ||
          this.classList.contains('aplayer-bar-wrap') ||
          this.classList.contains('aplayer-bar') ||
          this.classList.contains('aplayer-loaded') ||
          this.classList.contains('aplayer-played') ||
          (this.closest && (
            this.closest('.aplayer-lrc') ||
            this.closest('.aplayer-bar-wrap')
          ))
        )) {
      return; // 不绑定用户交互事件
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
})();

// 禁用控制功能
function smartDisableControls(silent = false) {
  const lyricsElements = document.querySelectorAll(`
    .aplayer-lrc,
    .aplayer-lrc p,
    #nav-music .aplayer-lrc,
    #nav-music .aplayer-lrc p
  `);
  
  const progressElements = document.querySelectorAll(`
    .aplayer-bar-wrap,
    .aplayer-bar-wrap *,
    .aplayer-bar,
    .aplayer-loaded,
    .aplayer-played,
    #nav-music .aplayer-bar-wrap,
    #nav-music .aplayer-bar-wrap *
  `);
  
  let processedLyrics = 0;
  let processedProgress = 0;
  
  // 处理歌词元素
  lyricsElements.forEach(element => {
    if (element.getAttribute('data-interaction-disabled') === 'true') {
      return;
    }
    
    const interactionProps = [
      'onclick', 'onmousedown', 'onmouseup',
      'ontouchstart', 'ontouchend',
      'onpointerdown', 'onpointerup'
    ];
    
    interactionProps.forEach(prop => {
      if (element[prop]) {
        element[prop] = null;
      }
    });
    
    element.style.setProperty('pointer-events', 'none', 'important');
    element.style.setProperty('cursor', 'default', 'important');
    element.style.setProperty('user-select', 'none', 'important');
    element.style.setProperty('-webkit-user-select', 'none', 'important');
    element.style.setProperty('-moz-user-select', 'none', 'important');
    element.style.setProperty('-ms-user-select', 'none', 'important');
    element.style.setProperty('-webkit-touch-callout', 'none', 'important');
    
    element.setAttribute('data-interaction-disabled', 'true');
    processedLyrics++;
  });
  
  // 处理进度条元素
  progressElements.forEach(element => {
    if (element.getAttribute('data-control-disabled') === 'true') {
      return;
    }
    
    const eventProps = [
      'onclick', 'onmousedown', 'onmouseup', 'onmousemove',
      'ontouchstart', 'ontouchend', 'ontouchmove',
      'ondrag', 'ondragstart', 'ondragend', 'ondrop',
      'onpointerdown', 'onpointerup', 'onpointermove'
    ];
    
    eventProps.forEach(prop => {
      if (element[prop]) {
        element[prop] = null;
      }
    });
    
    element.style.setProperty('pointer-events', 'none', 'important');
    element.style.setProperty('cursor', 'default', 'important');
    element.style.setProperty('user-select', 'none', 'important');
    element.style.setProperty('-webkit-user-select', 'none', 'important');
    element.style.setProperty('-moz-user-select', 'none', 'important');
    element.style.setProperty('-ms-user-select', 'none', 'important');
    element.style.setProperty('-webkit-touch-callout', 'none', 'important');
    
    element.setAttribute('data-control-disabled', 'true');
    processedProgress++;
  });
}

// 设置事件拦截器
function setupSmartInterceptor() {
  const userInteractionEvents = [
    'click', 'mousedown', 'touchstart', 'pointerdown'
  ];
  
  userInteractionEvents.forEach(eventType => {
    document.addEventListener(eventType, function(e) {
      const target = e.target;
      
      if (target && (
        target.classList.contains('aplayer-lrc') ||
        target.classList.contains('aplayer-bar-wrap') ||
        target.classList.contains('aplayer-bar') ||
        target.classList.contains('aplayer-loaded') ||
        target.classList.contains('aplayer-played') ||
        target.closest('.aplayer-lrc') ||
        target.closest('.aplayer-bar-wrap') ||
        (target.tagName === 'P' && target.closest('.aplayer-lrc'))
      )) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }, { capture: true, passive: false });
  });
}

// 重写APlayer方法
function smartOverrideAPlayerMethods() {
  const checkAPlayer = setInterval(() => {
    if (window.APlayer) {
      if (window.APlayer.prototype) {
        if (window.APlayer.prototype.seek) {
          const originalSeek = window.APlayer.prototype.seek;
          window.APlayer.prototype.seek = function(time) {
            const stack = new Error().stack;
            if (stack && (
              stack.includes('click') || 
              stack.includes('touch') || 
              stack.includes('mousedown') ||
              stack.includes('HTMLElement.onclick') ||
              stack.includes('HTMLParagraphElement.onclick')
            )) {
              return;
            }
            return originalSeek.call(this, time);
          };
        }
        
        if (window.APlayer.prototype.bar) {
          const originalBar = window.APlayer.prototype.bar;
          window.APlayer.prototype.bar = function() {
            const stack = new Error().stack;
            if (stack && (
              stack.includes('click') || 
              stack.includes('touch') || 
              stack.includes('mousedown')
            )) {
              return;
            }
            return originalBar.call(this);
          };
        }
      }
      
      clearInterval(checkAPlayer);
    }
  }, 100);
  
  setTimeout(() => {
    clearInterval(checkAPlayer);
  }, 10000);
}

// 持续监控
function setupContinuousMonitoring() {
  let lastElementCount = 0;
  let monitoringActive = true;
  
  const checkAndDisable = () => {
    if (!window.LYRICS_PROGRESS_DISABLED || !monitoringActive) return;
    
    const currentLyricsCount = document.querySelectorAll('.aplayer-lrc, .aplayer-lrc p').length;
    const currentProgressCount = document.querySelectorAll('.aplayer-bar-wrap, .aplayer-bar-wrap *').length;
    const currentTotal = currentLyricsCount + currentProgressCount;
    
    if (currentTotal !== lastElementCount) {
      smartDisableControls(false);
      lastElementCount = currentTotal;
    } else if (currentTotal > 0) {
      smartDisableControls(true);
    }
  };
  
  const monitorInterval = setInterval(checkAndDisable, 2000);
  
  const observer = new MutationObserver((mutations) => {
    let needsDisable = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && (
              node.matches('.aplayer-lrc') ||
              node.matches('.aplayer-bar-wrap') ||
              node.querySelector('.aplayer-lrc') ||
              node.querySelector('.aplayer-bar-wrap')
            )) {
              needsDisable = true;
            }
          }
        });
      }
    });
    
    if (needsDisable && window.LYRICS_PROGRESS_DISABLED) {
      setTimeout(() => {
        smartDisableControls(false);
        lastElementCount = document.querySelectorAll('.aplayer-lrc, .aplayer-lrc p, .aplayer-bar-wrap, .aplayer-bar-wrap *').length;
      }, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  setTimeout(() => {
    clearInterval(monitorInterval);
    monitoringActive = false;
  }, 300000);
}

// 初始化函数
function initTotalDisable() {
  setupSmartInterceptor();
  smartOverrideAPlayerMethods();
  
  const initDisable = () => {
    smartDisableControls(false);
    setupContinuousMonitoring();
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDisable);
  } else {
    initDisable();
  }
  
  setTimeout(() => smartDisableControls(false), 2000);
  setTimeout(() => smartDisableControls(true), 5000);
}

// 全局控制函数
window.disableLyricsProgressControl = function() {
  window.LYRICS_PROGRESS_DISABLED = true;
  smartDisableControls(false);
  return '歌词和进度条控制已禁用';
};

window.enableLyricsProgressControl = function() {
  window.LYRICS_PROGRESS_DISABLED = false;
  return '歌词和进度条控制已启用（需要刷新页面完全生效）';
};

window.checkControlStatus = function() {
  const lyricsElements = document.querySelectorAll('.aplayer-lrc, .aplayer-lrc p');
  const progressElements = document.querySelectorAll('.aplayer-bar-wrap, .aplayer-bar');
  
  let disabledCount = 0;
  [...lyricsElements, ...progressElements].forEach((element) => {
    const isDisabled = getComputedStyle(element).pointerEvents === 'none';
    if (isDisabled) disabledCount++;
  });
  
  return {
    totalElements: lyricsElements.length + progressElements.length,
    disabledElements: disabledCount,
    globalDisabled: window.LYRICS_PROGRESS_DISABLED
  };
};

initTotalDisable();