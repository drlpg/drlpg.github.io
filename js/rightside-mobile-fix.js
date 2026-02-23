/* 移动端rightside按钮修复 */

(function() {
  'use strict';
  
  // 只在移动设备上执行
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return;
  }
  
  // 移动端rightside修复已启用 - 静默运行
  
  // 全局标记，避免重复初始化
  if (window.rightsideMobileFixInitialized) {
    return;
  }
  window.rightsideMobileFixInitialized = true;
  
  // 修复rightside按钮定位问题
  function fixRightsidePosition() {
    const rightside = document.getElementById('rightside');
    if (!rightside) return;
    
    // 只设置必要的样式，避免与主题冲突
    rightside.style.zoom = '1';
    
    // 不干扰主题的显示/隐藏逻辑，只确保基础定位正确
  }
  
  // 确保页面滚动正常
  function ensureScrollable() {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // 移除可能阻止滚动的样式
    document.documentElement.style.height = '';
    document.body.style.height = '';
    
    // 页面滚动已确保正常
  }
  
  // 等待rightside元素出现
  function waitForRightside(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
      const rightside = document.getElementById('rightside');
      if (rightside) {
        callback();
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(check, 100);
      } else {
        // rightside元素未找到，启用DOM监听
        // 如果元素还没出现，监听DOM变化
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1 && (node.id === 'rightside' || node.querySelector('#rightside'))) {
                observer.disconnect();
                setTimeout(callback, 100);
              }
            });
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
    
    check();
  }
  
  // 初始化修复
  function init() {
    // 立即尝试修复
    fixRightsidePosition();
    ensureScrollable();
    
    // 等待rightside元素出现后再次修复
    waitForRightside(() => {
      fixRightsidePosition();
      ensureScrollable();
      
      // 监听DOM变化，确保修复持续有效
      const observer = new MutationObserver(function(mutations) {
        let needsFix = false;
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && mutation.target.id === 'rightside') {
            needsFix = true;
          }
        });
        
        if (needsFix) {
          setTimeout(fixRightsidePosition, 50);
        }
      });
      
      const rightside = document.getElementById('rightside');
      if (rightside) {
        observer.observe(rightside, {
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
    });
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
      setTimeout(() => {
        fixRightsidePosition();
        ensureScrollable();
      }, 100);
    });
    
    // 监听方向变化
    window.addEventListener('orientationchange', function() {
      setTimeout(() => {
        fixRightsidePosition();
        ensureScrollable();
      }, 300);
    });
  }
  
  // 多种方式确保初始化执行
  function ensureInit() {
    // 立即执行一次
    init();
    
    // DOM加载完成后执行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    }
    
    // 页面完全加载后执行
    if (document.readyState !== 'complete') {
      window.addEventListener('load', init);
    }
    
    // 延迟执行，确保主题脚本已加载
    setTimeout(init, 500);
    setTimeout(init, 1000);
    setTimeout(init, 2000);
  }
  
  ensureInit();
  
  // PJAX支持
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', init, 'rightsideMobileFix');
  }
  
  // 监听PJAX事件（如果存在）
  document.addEventListener('pjax:complete', init);
  document.addEventListener('pjax:success', init);
  
  // 强制定期检查和修复（前30秒内）
  let checkCount = 0;
  const maxChecks = 30;
  const forceCheck = setInterval(() => {
    checkCount++;
    const rightside = document.getElementById('rightside');
    if (rightside || checkCount >= maxChecks) {
      if (rightside) {
        fixRightsidePosition();
        ensureScrollable();
      }
      if (checkCount >= maxChecks) {
        clearInterval(forceCheck);
      }
    }
  }, 1000);
  
})();