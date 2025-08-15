// 移动端右侧悬浮按钮显示修复 - 优化原生逻辑
(function() {
  'use strict';

  // 检测是否为移动设备
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 900 ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  // 优化移动端的显示逻辑
  function optimizeMobileRightside() {
    if (!isMobileDevice()) return;
    
    const rightside = document.getElementById('rightside');
    if (!rightside) return;
    
    // 检查页面高度，如果页面很短，直接显示按钮
    const windowHeight = window.innerHeight;
    const documentHeight = document.body.scrollHeight;
    
    if (documentHeight <= windowHeight + 100) {
      // 页面很短时，直接显示按钮
      rightside.classList.add('rightside-show');
      return;
    }
    
    // 降低移动端的显示阈值（从56px降低到20px）
    let lastScrollTop = 0;
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 20) {
        rightside.classList.add('rightside-show');
      } else if (scrollTop === 0) {
        rightside.classList.remove('rightside-show');
      }
      
      lastScrollTop = scrollTop;
    };
    
    // 替换原有的滚动监听，使用更低的阈值
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 立即检查一次
    handleScroll();
  }

  // 页面加载完成后执行
  function init() {
    // 延迟执行，确保在原生脚本之后
    setTimeout(optimizeMobileRightside, 500);
  }

  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 页面完全加载后再次执行
  window.addEventListener('load', init);

})();