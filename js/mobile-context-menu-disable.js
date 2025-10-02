// 移动端禁用自定义右键菜单
(function() {
  'use strict';

  // 检测是否为移动设备
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768 ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  // 移动端禁用右键菜单功能
  function disableMobileContextMenu() {
    if (isMobileDevice()) {
      // 禁用长按事件（防止触发自定义右键菜单）
      document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) return; // 多点触控不处理
        
        const touch = e.touches[0];
        const target = touch.target;
        
        // 为触摸元素添加标记，防止自定义右键菜单触发
        target.setAttribute('data-mobile-touch', 'true');
        
        // 清除之前的定时器
        if (window.mobileContextMenuTimer) {
          clearTimeout(window.mobileContextMenuTimer);
        }
        
        // 设置定时器，500ms后移除标记
        window.mobileContextMenuTimer = setTimeout(() => {
          target.removeAttribute('data-mobile-touch');
        }, 500);
      }, { passive: true });

      // 确保移动端可以正常选择文本
      document.body.style.webkitUserSelect = 'text';
      document.body.style.userSelect = 'text';
      document.body.style.webkitTouchCallout = 'default';
    }
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', disableMobileContextMenu);
  } else {
    disableMobileContextMenu();
  }

  // 监听窗口大小变化
  window.addEventListener('resize', function() {
    if (isMobileDevice()) {
      disableMobileContextMenu();
    }
  });

})();