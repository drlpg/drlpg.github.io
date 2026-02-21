/* 手动灰度切换功能 */

(function() {
  'use strict';
  
  let isGrayscaleActive = false;
  let isAutoGrayscale = false; // 标记是否为自动开启的灰度
  
  // 切换灰度显示
  function toggleGrayscale() {
    const htmlElement = document.getElementsByTagName('html')[0];
    
    if (isGrayscaleActive) {
      // 关闭灰度
      htmlElement.style.filter = '';
      isGrayscaleActive = false;
      isAutoGrayscale = false; // 手动操作后清除自动标记
      localStorage.setItem('manualGrayscale', 'false');
    } else {
      // 开启灰度
      htmlElement.style.filter = 'grayscale(100%)';
      isGrayscaleActive = true;
      isAutoGrayscale = false; // 手动操作，不是自动的
      localStorage.setItem('manualGrayscale', 'true');
    }
    
    // 更新按钮状态
    updateButtonState();
  }
  
  // 检测页面当前的灰度状态
  function detectCurrentGrayscaleState() {
    const htmlElement = document.getElementsByTagName('html')[0];
    const currentFilter = htmlElement.style.filter || getComputedStyle(htmlElement).filter;
    
    // 检测是否已经有灰度滤镜
    const hasGrayscale = currentFilter.includes('grayscale');
    
    if (hasGrayscale) {
      // 检查是否为手动设置的灰度
      const savedState = localStorage.getItem('manualGrayscale');
      if (savedState === 'true') {
        // 手动设置的灰度
        isGrayscaleActive = true;
        isAutoGrayscale = false;
      } else {
        // 自动设置的灰度（如纪念日）
        isGrayscaleActive = true;
        isAutoGrayscale = true;
      }
      return true;
    }
    
    return false;
  }
  
  // 更新按钮状态
  function updateButtonState() {
    const button = document.getElementById('grayscale-toggle');
    if (!button) return;
    
    if (isGrayscaleActive) {
      button.classList.add('active');
      button.innerHTML = '明';
    } else {
      button.classList.remove('active');
      button.innerHTML = '灰';
    }
    
    // 移除任何内联样式，让CSS控制
    button.removeAttribute('style');
    
    // 统一的提示文字
    button.title = '灰度和明度模式切换';
  }
  
  // 恢复之前的灰度状态
  function restoreGrayscaleState() {
    // 首先检测当前页面状态
    detectCurrentGrayscaleState();
    
    // 如果没有检测到灰度，再检查localStorage
    if (!isGrayscaleActive) {
      const savedState = localStorage.getItem('manualGrayscale');
      if (savedState === 'true') {
        const htmlElement = document.getElementsByTagName('html')[0];
        htmlElement.style.filter = 'grayscale(100%)';
        isGrayscaleActive = true;
        isAutoGrayscale = false;
      }
    }
    
    // 更新按钮状态
    updateButtonState();
  }
  
  // 添加点击事件监听
  function setupEventListener() {
    // 避免重复绑定事件
    if (window.grayscaleEventListenerAdded) {
      return;
    }
    
    const rightside = document.getElementById('rightside');
    if (rightside) {
      rightside.addEventListener('click', function(e) {
        if (e.target.id === 'grayscale-toggle' || e.target.closest('#grayscale-toggle')) {
          e.stopPropagation();
          toggleGrayscale();
        }
      });
      
      window.grayscaleEventListenerAdded = true;
    }
  }
  
  // 监听页面灰度状态变化和主题切换
  function setupGrayscaleMonitor() {
    const htmlElement = document.getElementsByTagName('html')[0];
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'style') {
            const wasActive = isGrayscaleActive;
            detectCurrentGrayscaleState();
            if (wasActive !== isGrayscaleActive) {
              updateButtonState();
            }
          } else if (mutation.attributeName === 'data-theme') {
            // 主题切换时更新按钮样式
            setTimeout(updateButtonState, 100);
          }
        }
      });
    });
    
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['style', 'data-theme']
    });
  }
  
  // 初始化函数
  function init() {
    const waitForButton = setInterval(() => {
      const grayscaleButton = document.getElementById('grayscale-toggle');
      if (grayscaleButton) {
        clearInterval(waitForButton);
        
        // 只在首次初始化时设置事件监听器
        if (!window.grayscaleToggleInitialized) {
          setupEventListener();
          setupGrayscaleMonitor();
          window.grayscaleToggleInitialized = true;
        }
        
        // 每次都恢复状态
        restoreGrayscaleState();
      }
    }, 100);
  }
  
  // 监听PJAX和页面切换事件
  function setupPjaxListener() {
    if (window.grayscalePjaxListenerAdded) {
      return;
    }
    
    const pjaxEvents = ['pjax:complete', 'pjax:end', 'pjax:success'];
    
    pjaxEvents.forEach(eventName => {
      document.addEventListener(eventName, function() {
        setTimeout(() => {
          const grayscaleButton = document.getElementById('grayscale-toggle');
          if (grayscaleButton) {
            restoreGrayscaleState();
          }
        }, 150);
      });
    });
    
    window.addEventListener('popstate', function() {
      setTimeout(() => {
        const grayscaleButton = document.getElementById('grayscale-toggle');
        if (grayscaleButton) {
          restoreGrayscaleState();
        }
      }, 200);
    });
    
    window.grayscalePjaxListenerAdded = true;
  }
  
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      setupPjaxListener();
    });
  } else {
    init();
    setupPjaxListener();
  }
  
})();