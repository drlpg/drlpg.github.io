/* 移动端立即修复脚本 - 确保首次加载时生效 */

// 立即执行，不等待任何事件
(function() {
  'use strict';
  
  // 只在移动设备上执行
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return;
  }
  
  // 移动端立即修复已启用 - 静默运行
  
  // 立即设置viewport
  function setViewportImmediate() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes');
  }
  
  // 立即确保滚动正常
  function ensureScrollableImmediate() {
    if (document.documentElement) {
      document.documentElement.style.overflowY = 'auto';
      document.documentElement.style.zoom = '1';
    }
    if (document.body) {
      document.body.style.overflowY = 'auto';
      document.body.style.webkitOverflowScrolling = 'touch';
      document.body.style.zoom = '1';
    }
  }
  
  // 立即修复rightside（如果存在）
  function fixRightsideImmediate() {
    const rightside = document.getElementById('rightside');
    if (rightside) {
      rightside.style.zoom = '1';
      rightside.style.position = 'fixed';
      rightside.style.right = '-48px';
      rightside.style.bottom = '40px';
      rightside.style.zIndex = '100';
    }
  }
  
  // 立即执行修复
  setViewportImmediate();
  ensureScrollableImmediate();
  fixRightsideImmediate();
  
  // 持续监听和修复
  let fixCount = 0;
  const maxFixes = 50;
  
  const continuousFix = setInterval(() => {
    fixCount++;
    ensureScrollableImmediate();
    fixRightsideImmediate();
    
    if (fixCount >= maxFixes) {
      clearInterval(continuousFix);
    }
  }, 200);
  
  // 监听DOM变化
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.id === 'rightside') {
              setTimeout(fixRightsideImmediate, 10);
            }
            if (node.querySelector && node.querySelector('#rightside')) {
              setTimeout(fixRightsideImmediate, 10);
            }
          }
        });
      });
    });
    
    // 开始观察
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      // 如果body还没准备好，等待
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    }
  }
  
})();