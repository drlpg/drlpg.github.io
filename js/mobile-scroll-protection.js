// 移动端滚动保护 - 防止内容页面被强制滚动到顶部
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

  // 检测是否为内容页面
  function isContentPage() {
    const path = window.location.pathname;
    const excludePaths = ['/', '/categories/', '/tags/', '/archives/', '/about/', '/comment/', '/music/', '/gallery/', '/share/'];
    
    // 如果是排除的页面，返回false
    if (excludePaths.some(excludePath => path === excludePath || path.startsWith(excludePath))) {
      return false;
    }
    
    // 检查URL路径特征
    if (path.length > 1 && !path.endsWith('/')) {
      return true;
    }
    
    // 检查DOM元素
    return document.querySelector('#post') || 
           document.querySelector('.post-content') || 
           document.querySelector('#article-container') ||
           document.querySelector('.post-title');
  }

  // 如果不是内容页面，不执行保护
  if (!isContentPage()) {
    return;
  }

  console.log('启用移动端滚动保护');

  // 添加保护标记
  document.documentElement.setAttribute('data-scroll-protection', 'true');
  document.body.setAttribute('data-scroll-protection', 'true');

  // 保存原始滚动位置
  let savedScrollPosition = 0;
  let isUserScrolling = false;
  let scrollTimeout;

  // 监听用户滚动
  window.addEventListener('scroll', function() {
    isUserScrolling = true;
    savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isUserScrolling = false;
    }, 150);
  }, { passive: true });

  // 监听触摸事件
  let touchStartY = 0;
  let isTouching = false;

  document.addEventListener('touchstart', function(e) {
    isTouching = true;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function() {
    isTouching = false;
  }, { passive: true });

  // 重写可能导致强制滚动的方法
  const originalScrollTo = window.scrollTo;
  const originalScrollBy = window.scrollBy;

  window.scrollTo = function(x, y) {
    // 如果用户正在滚动或触摸，允许滚动
    if (isUserScrolling || isTouching) {
      return originalScrollTo.call(this, x, y);
    }
    
    // 如果是滚动到顶部的调用，且用户没有主动滚动，则阻止
    if ((x === 0 && y === 0) && savedScrollPosition > 0) {
      console.log('阻止强制滚动到顶部');
      return;
    }
    
    return originalScrollTo.call(this, x, y);
  };

  window.scrollBy = function(x, y) {
    if (isUserScrolling || isTouching) {
      return originalScrollBy.call(this, x, y);
    }
    return originalScrollBy.call(this, x, y);
  };

  // 监听并阻止可能的强制滚动
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        const target = mutation.target;
        
        // 检查是否有强制滚动相关的样式变化
        if (target === document.documentElement || target === document.body) {
          const style = target.style;
          if (style.scrollBehavior && style.scrollBehavior !== 'auto') {
            style.scrollBehavior = 'auto';
          }
        }
      }
    });
  });

  // 开始观察
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  // 页面卸载时清理
  window.addEventListener('beforeunload', function() {
    observer.disconnect();
  });

})();