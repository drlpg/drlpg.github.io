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

  // 检测是否为内容详情页
  function isContentPage() {
    const path = window.location.pathname;
    
    // 排除首页、分类页、标签页、归档页等
    const excludePaths = ['/', '/categories/', '/tags/', '/archives/', '/about/', '/comment/', '/music/', '/gallery/', '/share/'];
    
    // 如果是排除的页面，返回false
    if (excludePaths.some(excludePath => path === excludePath || path.startsWith(excludePath))) {
      return false;
    }
    
    // 如果路径长度大于1且不以斜杠结尾，很可能是文章页
    if (path.length > 1 && !path.endsWith('/')) {
      return true;
    }
    
    return false;
  }

  // 如果是内容详情页，则完全禁用此脚本
  if (isContentPage()) {
    // 检测到内容详情页，禁用强制滚动定位
    return;
  }

  // 记录导航类型
  let isBackForward = false;
  let isNewNavigation = false;

  // 强制定位到顶部的函数
  function forceJumpToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
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
    if (event.persisted) {
      isBackForward = true;
      return;
    }
    forceJumpToTop();
  });

  // 浏览器前进后退时不执行定位
  window.addEventListener('popstate', function(event) {
    isBackForward = true;
  });

  // 拦截所有站内链接点击
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    if (target && target.href && target.target !== '_blank') {
      try {
        const currentHost = window.location.host;
        const linkHost = new URL(target.href).host;
        
        if (currentHost === linkHost) {
          if (target.href.includes('#') && target.href.split('#')[0] === window.location.href.split('#')[0]) {
            return;
          }
          
          isNewNavigation = true;
          isBackForward = false;
          
          forceJumpToTop();
          setTimeout(forceJumpToTop, 50);
        }
      } catch (error) {
        isNewNavigation = true;
        isBackForward = false;
        forceJumpToTop();
      }
    }
  }, true);

  // 监听PJAX事件
  document.addEventListener('pjax:complete', function() {
    if (isNewNavigation && !isBackForward) {
      forceJumpToTop();
    }
  });
  
  document.addEventListener('pjax:success', function() {
    if (isNewNavigation && !isBackForward) {
      forceJumpToTop();
    }
  });

  // 重置导航标记的函数
  function resetNavigationFlags() {
    setTimeout(() => {
      isNewNavigation = false;
      isBackForward = false;
    }, 1000);
  }

  window.addEventListener('load', resetNavigationFlags);
  document.addEventListener('DOMContentLoaded', resetNavigationFlags);

})();