/**
 * 首页背景切换器
 * 功能：在bilibili动态背景和轮播图背景之间切换
 * 注意：切换后需要刷新页面才能看到效果
 */

(function () {
  "use strict";

  const STORAGE_KEY = "header_bg_mode";
  const MODE_BILIBILI = "bilibili";
  const MODE_SLIDESHOW = "slideshow";

  // 获取当前模式
  function getCurrentMode() {
    return localStorage.getItem(STORAGE_KEY) || MODE_BILIBILI;
  }

  // 保存模式
  function saveMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
  }

  // 切换模式
  function toggleMode(e) {
    // 阻止事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const currentMode = getCurrentMode();
    const newMode =
      currentMode === MODE_BILIBILI ? MODE_SLIDESHOW : MODE_BILIBILI;
    saveMode(newMode);

    // 显示提示并刷新页面
    const modeName = newMode === MODE_BILIBILI ? "动态背景" : "轮播图背景";

    // 尝试显示提示（如果失败也不影响刷新）
    try {
      if (
        typeof btf !== "undefined" &&
        typeof btf.snackbarShow === "function"
      ) {
        btf.snackbarShow(`切换到${modeName}`);
      }
    } catch (error) {
      // 忽略提示错误
    }

    // 刷新页面
    setTimeout(() => {
      location.href = location.href.split("#")[0];
    }, 500);
  }

  // 检查是否为首页
  function isHomePage() {
    return (
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html"
    );
  }

  // 应用模式（页面加载时）
  function applyModeOnLoad() {
    if (!isHomePage()) return;

    const mode = getCurrentMode();

    // 在页面加载前修改配置
    if (window.GLOBAL_CONFIG) {
      if (mode === MODE_BILIBILI) {
        // 启用bilibili，禁用轮播图
        if (window.GLOBAL_CONFIG.bilibiBg) {
          window.GLOBAL_CONFIG.bilibiBg.enable = true;
        }
        if (window.GLOBAL_CONFIG.headerSlideshow) {
          window.GLOBAL_CONFIG.headerSlideshow.enable = false;
        }
      } else {
        // 启用轮播图，禁用bilibili
        if (window.GLOBAL_CONFIG.headerSlideshow) {
          window.GLOBAL_CONFIG.headerSlideshow.enable = true;
        }
        if (window.GLOBAL_CONFIG.bilibiBg) {
          window.GLOBAL_CONFIG.bilibiBg.enable = false;
        }
      }
    }
  }

  // 检查是否允许显示按钮（使用sessionStorage实现临时启用）
  function isButtonAllowed() {
    return sessionStorage.getItem("header_bg_toggle_enabled") === "true";
  }

  // 初始化按钮
  function initButton() {
    const btn = document.getElementById("header-bg-toggle");
    if (!btn) return;

    // 只在首页显示
    if (!isHomePage()) {
      btn.style.display = "none";
      return;
    }

    // 检查是否已启用
    if (!isButtonAllowed()) {
      btn.style.display = "none";
      return;
    }

    // 显示按钮
    btn.style.display = "";

    // 防止重复绑定
    if (btn.dataset.initialized === "true") return;
    btn.dataset.initialized = "true";

    // 绑定点击事件
    btn.addEventListener("click", toggleMode, false);

    // 更新按钮提示
    const currentMode = getCurrentMode();
    const nextMode = currentMode === MODE_BILIBILI ? "轮播图" : "动态";
    btn.setAttribute("title", `切换到${nextMode}背景`);
  }

  // 全局控制函数
  window.headerBg = function (enable) {
    if (enable === true) {
      sessionStorage.setItem("header_bg_toggle_enabled", "true");
      initButton();
      console.log("✓ 首页背景切换按钮已临时启用（关闭或刷新页面后自动失效）");
      return "已启用";
    } else if (enable === false) {
      sessionStorage.removeItem("header_bg_toggle_enabled");
      const btn = document.getElementById("header-bg-toggle");
      if (btn) btn.style.display = "none";
      console.log("✓ 首页背景切换按钮已禁用");
      return "已禁用";
    } else {
      // 无参数时显示当前状态
      const isEnabled = isButtonAllowed();
      console.log(`当前状态: ${isEnabled ? "已启用" : "已禁用"}`);
      console.log("使用方法: headerBg(true) 启用 | headerBg(false) 禁用");
      console.log("注意: 启用后关闭或刷新页面会自动失效");
      return isEnabled ? "已启用" : "已禁用";
    }
  };

  // 页面加载时清除启用状态（实现临时启用）
  function clearEnableStatus() {
    // 检查是否是首次加载（通过performance API）
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation && navigation.type === "reload") {
      // 刷新时清除
      sessionStorage.removeItem("header_bg_toggle_enabled");
    } else if (!sessionStorage.getItem("header_bg_toggle_session_started")) {
      // 首次加载时清除
      sessionStorage.removeItem("header_bg_toggle_enabled");
      sessionStorage.setItem("header_bg_toggle_session_started", "true");
    }
  }

  // 清除启用状态
  clearEnableStatus();

  // 尽早应用配置（在其他脚本加载前）
  applyModeOnLoad();

  // 页面加载完成后初始化按钮
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initButton);
  } else {
    initButton();
  }

  // PJAX支持
  document.addEventListener("pjax:complete", function () {
    clearEnableStatus();
    applyModeOnLoad();
    initButton();
  });
})();
