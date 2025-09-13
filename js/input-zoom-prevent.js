/* 移动端输入框焦点时禁止页面缩放 */

(function () {
  'use strict';

  // 只在移动设备上执行
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return;
  }

  // 防止重复初始化
  if (window.inputZoomPreventLoaded) {
    return;
  }
  window.inputZoomPreventLoaded = true;

  let originalViewport = null;
  let inputFocusCount = 0;

  // 获取viewport元素
  function getViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    return viewport;
  }

  // 设置viewport
  function setViewport(content) {
    getViewport().setAttribute('content', content);
  }

  // 输入框获得焦点
  function onInputFocus(e) {
    if (!isInputElement(e.target)) return;

    inputFocusCount++;
    if (inputFocusCount === 1) {
      originalViewport = getViewport().getAttribute('content') || 'width=device-width, initial-scale=1.0';
      setViewport('width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }

  // 输入框失去焦点
  function onInputBlur(e) {
    if (!isInputElement(e.target)) return;

    inputFocusCount = Math.max(0, inputFocusCount - 1);
    if (inputFocusCount === 0) {
      setTimeout(() => {
        if (inputFocusCount === 0) {
          setViewport(originalViewport || 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes');
        }
      }, 100);
    }
  }

  // 检查是否是输入元素
  function isInputElement(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return true;
    if (tag === 'input') {
      const type = (el.type || '').toLowerCase();
      return ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type);
    }
    return el.contentEditable === 'true';
  }

  // 初始化
  function init() {
    document.addEventListener('focusin', onInputFocus, true);
    document.addEventListener('focusout', onInputBlur, true);
  }

  // 强制多重初始化确保生效
  function forceInit() {
    try {
      init();
    } catch (e) {
      console.error('Input zoom prevent init error:', e);
    }
  }

  // 立即执行
  forceInit();

  // DOM准备好后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceInit);
  } else {
    forceInit();
  }

  // 页面完全加载后执行
  window.addEventListener('load', forceInit);

  // 延迟执行多次确保生效
  setTimeout(forceInit, 50);
  setTimeout(forceInit, 200);
  setTimeout(forceInit, 1000);
  setTimeout(forceInit, 2000);

  // PJAX支持
  document.addEventListener('pjax:complete', () => {
    inputFocusCount = 0;
    originalViewport = null;
  });

  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', () => {
      inputFocusCount = 0;
      originalViewport = null;
    }, 'inputZoomPrevent');
  }

})();