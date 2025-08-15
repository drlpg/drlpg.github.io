// 移动端页面跳转智能定位
(function() {
  'use strict';

  // 检测是否为移动设备
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768 ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  // 仅在移动端执行
  if (!isMobileDevice()) {
    return;
  }

  // 记录导航类型
  let isBackForward = false;
  let isNewNavigation = false;

  // 强制定位到顶部的函数
  function forceJumpToTop() {
    // 多种方式确保定位到顶部
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // 设置CSS样式强制定位
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    
    // 使用多个时机确保生效
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  }

  // 页面加载完成后立即执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceJumpToTop);
  } else {
    forceJumpToTop();
  }

  // 页面完全加载后再次执行
  window.addEventListener('load', forceJumpToTop);

  // 页面显示时执行（包括从缓存加载）
  window.addEventListener('pageshow', function(event) {
    // 检查是否是从缓存加载（后退/前进）
    if (event.persisted) {
      // 从缓存加载，不定位到顶部，保持原有滚动位置
      isBackForward = true;
      return;
    }
    // 新页面加载，定位到顶部
    forceJumpToTop();
  });

  // 浏览器前进后退时不执行定位
  window.addEventListener('popstate', function(event) {
    // 标记为后退/前进操作，不定位到顶部
    isBackForward = true;
  });

  // 拦截所有站内链接点击
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    if (target && target.href && target.target !== '_blank') {
      try {
        const currentHost = window.location.host;
        const linkHost = new URL(target.href).host;
        
        // 只处理站内链接
        if (currentHost === linkHost) {
          // 排除锚点链接
          if (target.href.includes('#') && target.href.split('#')[0] === window.location.href.split('#')[0]) {
            return;
          }
          
          // 标记为新导航
          isNewNavigation = true;
          isBackForward = false;
          
          // 在链接跳转前设置滚动位置
          forceJumpToTop();
          
          // 延迟再次执行，确保新页面也在顶部
          setTimeout(forceJumpToTop, 50);
          setTimeout(forceJumpToTop, 200);
          setTimeout(forceJumpToTop, 500);
        }
      } catch (error) {
        // URL解析失败时也执行定位
        isNewNavigation = true;
        isBackForward = false;
        forceJumpToTop();
      }
    }
  }, true); // 使用捕获阶段，确保优先执行

  // 监听URL变化（针对SPA应用）
  let currentUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      // 只有在新导航时才定位到顶部
      if (isNewNavigation && !isBackForward) {
        forceJumpToTop();
      }
    }
  };

  // 定期检查URL变化（降低频率）
  setInterval(checkUrlChange, 500);

  // 监听history API调用
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    // 只有在新导航时才定位到顶部
    if (isNewNavigation && !isBackForward) {
      setTimeout(forceJumpToTop, 0);
      setTimeout(forceJumpToTop, 50);
    }
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    // 只有在新导航时才定位到顶部
    if (isNewNavigation && !isBackForward) {
      setTimeout(forceJumpToTop, 0);
      setTimeout(forceJumpToTop, 50);
    }
  };

  // 监听PJAX事件
  document.addEventListener('pjax:complete', function() {
    // 只有在新导航时才定位到顶部
    if (isNewNavigation && !isBackForward) {
      forceJumpToTop();
    }
  });
  
  document.addEventListener('pjax:success', function() {
    // 只有在新导航时才定位到顶部
    if (isNewNavigation && !isBackForward) {
      forceJumpToTop();
    }
  });

  // 监听滚动事件，如果不在顶部就强制回到顶部（仅在新导航的页面加载后短时间内）
  let forceTopMode = true;
  setTimeout(() => {
    forceTopMode = false;
  }, 2000); // 2秒后停止强制模式

  window.addEventListener('scroll', function() {
    // 只有在新导航且强制模式下才执行
    if (forceTopMode && isNewNavigation && !isBackForward && (window.pageYOffset > 0 || document.documentElement.scrollTop > 0)) {
      forceJumpToTop();
    }
  }, { passive: true });

  // 页面可见性变化时的处理
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      // 只有在新导航时才定位到顶部
      if (isNewNavigation && !isBackForward) {
        forceJumpToTop();
      }
    }
  });

  // 重置导航标记的函数
  function resetNavigationFlags() {
    setTimeout(() => {
      isNewNavigation = false;
      isBackForward = false;
    }, 1000); // 1秒后重置标记
  }

  // 在页面加载完成后重置标记
  window.addEventListener('load', resetNavigationFlags);
  document.addEventListener('DOMContentLoaded', resetNavigationFlags);

})();