// 导航栏悬停提示（搜索按钮和菜单项）
(function () {
  "use strict";

  // 避免重复初始化
  if (window.navTooltipInitialized) return;
  window.navTooltipInitialized = true;

  let navTooltip = null;
  let isEventDelegated = false;

  // 创建导航提示框
  function createNavTooltip() {
    // 清理旧的提示框
    const oldTooltip = document.getElementById("navTooltip");
    if (oldTooltip) {
      oldTooltip.remove();
    }

    // 确保在正确的容器中创建提示框
    const container = document.body;
    if (!container) return;

    const tooltipHTML = `<div class="nav-button-tooltip" id="navTooltip"></div>`;
    container.insertAdjacentHTML("beforeend", tooltipHTML);
    navTooltip = document.getElementById("navTooltip");

    // 确保提示框具有正确的样式类
    if (navTooltip) {
      navTooltip.className = "nav-button-tooltip";
    }
  }

  // 显示导航提示
  function showNavTooltip(button) {
    if (!navTooltip) createNavTooltip();

    const tooltipText = button.getAttribute("data-tooltip");
    if (!tooltipText) return;

    navTooltip.textContent = tooltipText;

    // 计算按钮的屏幕位置
    const buttonRect = button.getBoundingClientRect();

    // 设置提示框内容以计算其尺寸
    navTooltip.style.visibility = "hidden";
    navTooltip.style.opacity = "1";
    navTooltip.classList.add("show");

    // 获取提示框尺寸
    const tooltipRect = navTooltip.getBoundingClientRect();

    // 计算提示框位置：按钮下方，水平居中，与按钮保持8px间距
    const left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
    const top = buttonRect.bottom + 8; // 8px间距

    // 边界检查，确保提示框不会超出屏幕
    const maxLeft = window.innerWidth - tooltipRect.width - 10;
    const finalLeft = Math.max(10, Math.min(left, maxLeft));

    // 设置位置
    navTooltip.style.left = finalLeft + "px";
    navTooltip.style.top = top + "px";

    // 显示提示框
    navTooltip.style.visibility = "visible";
  }

  // 隐藏导航提示
  function hideNavTooltip() {
    if (navTooltip) {
      navTooltip.classList.remove("show");
      navTooltip.style.visibility = "hidden";
      navTooltip.style.opacity = "0";
      navTooltip.style.left = "";
      navTooltip.style.top = "";
    }
  }

  // 使用事件委托设置悬停提示
  function setupEventDelegation() {
    if (isEventDelegated) return;
    isEventDelegated = true;

    // 使用事件委托监听整个文档的鼠标事件
    const mouseEnterHandler = function (e) {
      const target = e.target;

      // 确保target是Element节点且有matches方法
      if (!target || typeof target.matches !== "function") return;

      // 检查是否是需要显示提示的元素
      if (
        target.matches(
          "#search-button .site-page[data-tooltip], .menus_items .site-page[data-tooltip]"
        )
      ) {
        // 确保提示框存在
        if (!navTooltip) {
          createNavTooltip();
        }
        showNavTooltip(target);
      }
    };

    const mouseLeaveHandler = function (e) {
      const target = e.target;

      // 确保target是Element节点且有matches方法
      if (!target || typeof target.matches !== "function") return;

      // 检查是否是需要隐藏提示的元素
      if (
        target.matches(
          "#search-button .site-page[data-tooltip], .menus_items .site-page[data-tooltip]"
        )
      ) {
        hideNavTooltip();
      }
    };

    // 添加事件监听器
    document.addEventListener("mouseenter", mouseEnterHandler, true);
    document.addEventListener("mouseleave", mouseLeaveHandler, true);

    // 存储处理器引用以便重新绑定
    window.tooltipHandlers = {
      mouseEnter: mouseEnterHandler,
      mouseLeave: mouseLeaveHandler,
    };

    // 页面隐藏时隐藏提示框
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        hideNavTooltip();
      }
    });

    // 滚动时隐藏提示框
    window.addEventListener("scroll", hideNavTooltip, { passive: true });

    // 窗口大小改变时隐藏提示框
    window.addEventListener("resize", hideNavTooltip, { passive: true });

    // 右键菜单事件处理
    document.addEventListener(
      "contextmenu",
      function (e) {
        // 右键菜单打开时隐藏提示框
        hideNavTooltip();
      },
      true
    );

    // 监听右键菜单关闭（通过点击其他地方）
    document.addEventListener(
      "click",
      function (e) {
        // 确保提示框功能在右键菜单关闭后恢复正常
        if (!navTooltip) {
          createNavTooltip();
        }
      },
      true
    );

    // 监听键盘事件（ESC键关闭右键菜单）
    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Escape") {
          hideNavTooltip();
          // 确保提示框在ESC后能正常工作
          setTimeout(() => {
            if (!navTooltip) {
              createNavTooltip();
            }
          }, 100);
        }
      },
      true
    );
  }

  // 初始化函数
  function init() {
    // 创建提示框
    createNavTooltip();

    // 设置事件委托
    setupEventDelegation();

    // 监听PJAX事件（如果存在）
    if (window.pjax) {
      document.addEventListener("pjax:complete", function () {
        setTimeout(() => {
          createNavTooltip();
        }, 100);
      });
    }

    // 监听主题切换事件
    function setupThemeToggleListener() {
      // 查找主题切换按钮（可能的选择器）
      const themeSelectors = [
        "#darkmode",
        ".darkmode_toggle",
        "[data-theme-toggle]",
        ".theme-toggle",
        "#rightside #darkmode",
      ];

      let themeToggle = null;
      for (const selector of themeSelectors) {
        themeToggle = document.querySelector(selector);
        if (themeToggle) break;
      }

      if (themeToggle) {
        themeToggle.addEventListener("click", function () {
          hideNavTooltip();
          // 主题切换需要更长的延迟来确保DOM更新完成
          setTimeout(() => {
            createNavTooltip();
          }, 300);
        });
      }

      // 监听主题变化（通过data-theme属性变化）
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            (mutation.attributeName === "data-theme" ||
              mutation.attributeName === "class")
          ) {
            hideNavTooltip();
            setTimeout(() => {
              createNavTooltip();
            }, 200);
          }
        });
      });

      // 监听html和body元素的属性变化
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "class"],
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-theme", "class"],
      });
    }

    // 立即设置主题切换监听器
    setupThemeToggleListener();

    // 如果DOM还没加载完成，也在加载完成后再设置一次
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupThemeToggleListener);
    }

    // 监听页面路由变化
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        hideNavTooltip();
        setTimeout(() => {
          createNavTooltip();
        }, 200);
      }
    };

    // 监听history变化
    window.addEventListener("popstate", checkUrlChange);

    // 重写history方法以监听PJAX导航
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(history, arguments);
      setTimeout(checkUrlChange, 50);
    };

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      setTimeout(checkUrlChange, 50);
    };

    // 使用MutationObserver监听DOM变化（仅监听导航栏区域）
    const nav = document.querySelector("#nav");
    if (nav) {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
          if (
            mutation.type === "childList" &&
            (mutation.target.matches("#nav") || mutation.target.closest("#nav"))
          ) {
            shouldUpdate = true;
          }
        });

        if (shouldUpdate) {
          setTimeout(() => {
            createNavTooltip();
          }, 100);
        }
      });

      observer.observe(nav, {
        childList: true,
        subtree: true,
      });
    }
  }

  // 等待DOM准备就绪后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 重新绑定事件监听器的函数
  function rebindEventListeners() {
    if (window.tooltipHandlers) {
      // 移除旧的监听器
      document.removeEventListener(
        "mouseenter",
        window.tooltipHandlers.mouseEnter,
        true
      );
      document.removeEventListener(
        "mouseleave",
        window.tooltipHandlers.mouseLeave,
        true
      );

      // 重新添加监听器
      document.addEventListener(
        "mouseenter",
        window.tooltipHandlers.mouseEnter,
        true
      );
      document.addEventListener(
        "mouseleave",
        window.tooltipHandlers.mouseLeave,
        true
      );
    }
  }

  // 定期检查并修复事件监听器（作为备用方案）
  setInterval(() => {
    // 检查提示框是否仍然存在且功能正常
    if (!navTooltip || !document.body.contains(navTooltip)) {
      createNavTooltip();
    }

    // 重新绑定事件监听器以确保稳定性
    rebindEventListeners();
  }, 5000); // 每5秒检查一次

  // 暴露全局函数供调试使用
  window.navTooltipUtils = {
    show: showNavTooltip,
    hide: hideNavTooltip,
    recreate: createNavTooltip,
    rebind: rebindEventListeners,
  };
})();
