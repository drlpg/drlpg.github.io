/* 修复移动端viewport高度动态变化导致的布局问题 */

(function() {
  'use strict';
  
  // 只在移动设备上执行
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return;
  }
  
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // 更新viewport高度
  function updateVH() {
    const newVh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${newVh}px`);
  }
  
  // 防止下拉刷新导致的页面高度异常
  function preventPullRefreshIssues() {
    const bodyWrap = document.getElementById('body-wrap');
    if (bodyWrap) {
      // 重置可能的异常高度
      bodyWrap.style.minHeight = '';
      bodyWrap.style.minHeight = 'calc(var(--vh, 1vh) * 100)';
    }
  }
  
  // 监听resize事件（防抖处理）
  const debouncedUpdate = debounce(() => {
    updateVH();
    preventPullRefreshIssues();
  }, 100);
  
  window.addEventListener('resize', debouncedUpdate);
  window.addEventListener('orientationchange', debouncedUpdate);
  
  // 监听滚动事件，防止下拉刷新后的异常状态
  let isScrolling = false;
  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true;
      requestAnimationFrame(() => {
        // 检查是否出现异常的页面高度
        if (document.body.scrollHeight > window.innerHeight * 1.5) {
          preventPullRefreshIssues();
        }
        isScrolling = false;
      });
    }
  });
  
  // 监听触摸事件，防止下拉刷新干扰
  let startY = 0;
  let isAtTop = false;
  
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isAtTop = window.pageYOffset === 0;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // 如果在页面顶部且向下滑动，防止默认的下拉刷新行为
    if (isAtTop && deltaY > 0) {
      // 不阻止事件，但确保页面布局正确
      setTimeout(preventPullRefreshIssues, 50);
    }
  }, { passive: true });
  
  document.addEventListener('touchend', () => {
    // 触摸结束后检查并修复可能的布局问题
    setTimeout(preventPullRefreshIssues, 100);
  }, { passive: true });
  
  // 页面加载完成后执行一次修复
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preventPullRefreshIssues);
  } else {
    preventPullRefreshIssues();
  }
  
})();