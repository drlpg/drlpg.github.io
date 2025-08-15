/* 手动灰度切换功能 */

(function() {
  'use strict';
  
  let isGrayscaleActive = false;
  let isAutoGrayscale = false; // 标记是否为自动开启的灰度
  
  // 创建灰度切换按钮并添加到右侧工具栏
  function createGrayscaleButton() {
    const rightsideConfigHide = document.getElementById('rightside-config-hide');
    if (!rightsideConfigHide || document.getElementById('grayscale-toggle')) {
      return;
    }
    
    // 创建按钮元素，完全模仿其他按钮的结构
    const grayscaleButton = document.createElement('button');
    grayscaleButton.id = 'grayscale-toggle';
    grayscaleButton.type = 'button';
    grayscaleButton.title = '灰度和明度模式切换';
    grayscaleButton.innerHTML = '灰';
    

    
    // 在简繁切换按钮之后插入，或添加到容器末尾
    const translateButton = document.getElementById('translateLink');
    if (translateButton) {
      translateButton.parentNode.insertBefore(grayscaleButton, translateButton.nextSibling);
    } else {
      rightsideConfigHide.appendChild(grayscaleButton);
    }
    

  }
  
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
  
  // 监听页面灰度状态变化
  function setupGrayscaleMonitor() {
    const htmlElement = document.getElementsByTagName('html')[0];
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const wasActive = isGrayscaleActive;
          detectCurrentGrayscaleState();
          if (wasActive !== isGrayscaleActive) {
            updateButtonState();
          }
        }
      });
    });
    
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['style']
    });
  }
  
  // 初始化函数
  function init() {
    const waitForRightside = setInterval(() => {
      const rightsideConfigHide = document.getElementById('rightside-config-hide');
      if (rightsideConfigHide) {
        clearInterval(waitForRightside);
        
        // 每次都重新创建按钮（因为DOM可能被PJAX重建）
        if (!document.getElementById('grayscale-toggle')) {
          createGrayscaleButton();
        }
        
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
          if (!document.getElementById('grayscale-toggle')) {
            const rightsideConfigHide = document.getElementById('rightside-config-hide');
            if (rightsideConfigHide) {
              createGrayscaleButton();
              restoreGrayscaleState();
            }
          }
        }, 150);
      });
    });
    
    window.addEventListener('popstate', function() {
      setTimeout(() => {
        if (!document.getElementById('grayscale-toggle')) {
          const rightsideConfigHide = document.getElementById('rightside-config-hide');
          if (rightsideConfigHide) {
            createGrayscaleButton();
            restoreGrayscaleState();
          }
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