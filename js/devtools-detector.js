// 开发者工具检测
(function () {
  "use strict";

  let hasShownNotification = false;

  // 显示开发者工具提示
  function showDevToolsNotification() {
    let attempts = 0;
    const maxAttempts = 10;

    const tryShow = () => {
      attempts++;
      if (typeof window.showCopySuccessNotification === "function") {
        window.showCopySuccessNotification("开发者模式已打开，请遵循GPL协议");
      } else if (attempts < maxAttempts) {
        setTimeout(tryShow, 300);
      }
    };

    tryShow();
  }

  // 键盘快捷键检测
  document.addEventListener("keydown", (e) => {
    // 排除在输入框、文本域等元素中的按键
    const target = e.target;
    const isInputElement =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable ||
      target.closest("[contenteditable]");

    // 如果在输入元素中，不触发检测
    if (isInputElement) return;

    // 如果事件已被阻止默认行为，说明被其他功能拦截了
    if (e.defaultPrevented) return;

    // 如果已经显示过通知，不再重复显示
    if (hasShownNotification) return;

    // 检测各种浏览器的开发者工具快捷键
    let shouldShowNotification = false;

    // 1. F12 - 所有浏览器通用
    if (e.key === "F12") {
      shouldShowNotification = true;
    }

    // 2. Ctrl+Shift+I - Chrome/Edge/Firefox/Opera (Windows/Linux)
    // 3. Ctrl+Shift+J - Chrome/Edge (打开控制台)
    // 4. Ctrl+Shift+C - Chrome/Edge/Firefox (元素选择器)
    else if (
      e.ctrlKey &&
      e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      ["I", "J", "C", "i", "j", "c"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 5. Cmd+Option+I - Chrome/Edge/Safari (Mac)
    // 6. Cmd+Option+J - Chrome/Edge (Mac - 控制台)
    // 7. Cmd+Option+C - Chrome/Edge/Safari (Mac - 元素选择器)
    else if (
      e.metaKey &&
      e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      ["I", "J", "C", "i", "j", "c"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 8. Ctrl+Shift+K - Firefox (控制台)
    else if (
      e.ctrlKey &&
      e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      ["K", "k"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 9. Cmd+Option+K - Firefox (Mac - 控制台)
    else if (
      e.metaKey &&
      e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      ["K", "k"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 10. Ctrl+Shift+M - Chrome/Edge/Firefox (响应式设计模式)
    else if (
      e.ctrlKey &&
      e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      ["M", "m"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 11. Cmd+Option+M - Chrome/Edge/Firefox (Mac - 响应式设计模式)
    else if (
      e.metaKey &&
      e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      ["M", "m"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 12. Ctrl+U - 查看源代码 (所有浏览器)
    else if (
      e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      ["U", "u"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 13. Cmd+Option+U - Mac 查看源代码
    else if (
      e.metaKey &&
      e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      ["U", "u"].includes(e.key)
    ) {
      shouldShowNotification = true;
    }

    // 显示通知
    if (shouldShowNotification) {
      hasShownNotification = true;
      showDevToolsNotification();
    }
  });
})();
