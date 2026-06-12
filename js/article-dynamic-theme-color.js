/**
 * 文章动态主题色应用器 - 内容区
 * 功能：将标题背景色同步应用到文章内容区的主题色元素
 * 特点：无延迟加载，与标题背景色保持一致
 */

(function () {
  "use strict";

  const DEFAULT_COLOR = "61, 157, 242";
  const DEFAULT_HOVER_COLOR = "255, 114, 66";
  const CACHE_KEY = "butterfly_article_colors";
  const STYLE_ID = "article-dynamic-theme-style";

  // 全局保存观察器引用，用于清理
  let headerObserver = null;
  let notificationObserver = null;

  // 生成缓存键（与header脚本保持一致）
  function generateCacheKey(path, cover) {
    const pathKey = path.replace(/\/$/, "");
    let hash = 0;
    const str = cover || "";
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return pathKey + "#" + Math.abs(hash).toString(36);
  }

  // 计算悬停颜色（增加20%亮度）
  function calculateHoverColor(rgbString) {
    try {
      const parts = rgbString.split(",").map((s) => parseInt(s.trim()));
      if (parts.length !== 3) return DEFAULT_HOVER_COLOR;

      const [r, g, b] = parts;
      const factor = 1.2;
      const newR = Math.min(255, Math.round(r * factor));
      const newG = Math.min(255, Math.round(g * factor));
      const newB = Math.min(255, Math.round(b * factor));

      return `${newR}, ${newG}, ${newB}`;
    } catch (error) {
      return DEFAULT_HOVER_COLOR;
    }
  }

  // 调暗颜色以匹配header遮罩效果
  function darkenColor(rgbString) {
    try {
      const parts = rgbString.split(",").map((s) => parseInt(s.trim()));
      if (parts.length !== 3) return rgbString;

      const [r, g, b] = parts;
      // 根据主题模式应用不同的调暗系数
      // 浅色模式：15%透明度 -> factor = 0.85
      // 暗色模式：40%透明度 -> factor = 0.6
      const isDarkMode =
        document.documentElement.getAttribute("data-theme") === "dark";
      const factor = isDarkMode ? 0.6 : 0.85;
      const newR = Math.round(r * factor);
      const newG = Math.round(g * factor);
      const newB = Math.round(b * factor);

      return `${newR}, ${newG}, ${newB}`;
    } catch (error) {
      return rgbString;
    }
  }

  // 从header的style中提取当前应用的颜色
  function getColorFromHeader() {
    try {
      const header = document.getElementById("page-header");
      if (!header) return null;

      const bgStyle = header.style.background;
      if (!bgStyle) return null;

      // 提取最后一个rgb(r, g, b)中的颜色值（渐变背景的基础色）
      const rgbMatches = bgStyle.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g);
      if (rgbMatches && rgbMatches.length > 0) {
        // 取最后一个rgb值（渐变的基础色）
        const lastRgb = rgbMatches[rgbMatches.length - 1];
        const match = lastRgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const baseColor = `${match[1]}, ${match[2]}, ${match[3]}`;
          // 应用15%调暗以匹配header遮罩效果
          return darkenColor(baseColor);
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // 从缓存读取颜色（作为备用）
  function getColorFromCache(articlePath, coverUrl) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached || !coverUrl) return null;

      const cache = JSON.parse(cached);
      const articleCacheKey = generateCacheKey(articlePath, coverUrl);
      const cachedColor = cache[articleCacheKey];

      return cachedColor && cachedColor.color ? cachedColor.color : null;
    } catch (error) {
      return null;
    }
  }

  // 动态注入样式
  function injectStyles(color, hoverColor) {
    // 移除旧的样式
    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) {
      oldStyle.remove();
    }

    // 设置CSS变量（仅在文章页面）
    document.documentElement.style.setProperty(
      "--scrollbar-color",
      `rgb(${color})`
    );

    // 创建新的样式
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        /* 全局滚动条 - 文章页面动态颜色 */
        *::-webkit-scrollbar-thumb {
          background: rgba(${color}, 0.5) !important;
          border: 2px solid transparent !important;
          background-clip: content-box !important;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: rgb(${color}) !important;
          border: 2px solid transparent !important;
          background-clip: content-box !important;
        }

        *::-webkit-scrollbar-thumb:active {
          background: rgb(${color}) !important;
          border: 2px solid transparent !important;
          background-clip: content-box !important;
        }

        /* Firefox 滚动条 */
        @-moz-document url-prefix() {
          * {
            scrollbar-color: rgba(${color}, 0.5) transparent !important;
          }
          
          *:hover {
            scrollbar-color: rgb(${color}) transparent !important;
          }
        }

        /* 文章内容区链接 */
        #article-container a {
          color: rgb(${color}) !important;
        }

        /* 列表标记颜色 */
        #article-container li::marker {
          color: rgb(${color}) !important;
        }

        #article-container li:hover::marker {
          color: rgb(${hoverColor}) !important;
        }

        /* 标题前缀图标悬停 */
        #article-container h1:hover:before,
        #article-container h2:hover:before,
        #article-container h3:hover:before,
        #article-container h4:hover:before,
        #article-container h5:hover:before,
        #article-container h6:hover:before {
          color: rgb(${color}) !important;
        }

        /* 标签 */
        #post .tag_share .post-meta__tags {
          border-color: rgb(${color}) !important;
          color: rgb(${color}) !important;
        }

        #post .tag_share .post-meta__tags:hover {
          background: rgb(${color}) !important;
          color: #fff !important;
        }

        /* 版权信息 - 作者名和日期使用动态主题色 */
        .post-copyright-cc-info h {
          color: rgb(${color}) !important;
        }

        /* 版权信息链接悬停效果 */
        #post .post-copyright a:hover,
        #post .post-copyright-info a:hover {
          color: rgb(${color}) !important;
        }

        /* 引用块边框 */
        #article-container blockquote {
          border-left-color: rgb(${color}) !important;
        }

        /* 分隔线图标和虚线 */
        #article-container hr:before,
        .post hr:before,
        hr:before {
          color: rgb(${color}) !important;
        }

        #article-container hr,
        .post hr,
        hr {
          border-color: rgba(${color}, 0.7) !important;
          background-image: linear-gradient(to right, rgba(${color}, 0.7) 0%, rgba(${color}, 0.7) 50%, transparent 50%) !important;
        }

        /* 锚点链接 */
        #article-container a.headerlink:hover:after {
          color: rgb(${hoverColor}) !important;
        }

        /* 按钮 */
        #article-container .btn {
          background: rgb(${color}) !important;
        }

        #article-container .btn:hover {
          background: rgb(${hoverColor}) !important;
        }

        /* 代码块工具栏按钮悬停 */
        .highlight-tools i:hover,
        figure.highlight .highlight-tools i:hover,
        .code-block-fullscreen-btn:hover,
        .copy-btn:hover {
          color: rgb(${color}) !important;
        }

        /* Tab标签激活状态 */
        #article-container .tabs .nav-tabs .tab.active {
          border-bottom-color: rgb(${color}) !important;
        }

        /* 时间线 */
        #article-container .timeline .timeline-item:before {
          background: rgb(${color}) !important;
        }

        /* 复选框 */
        #article-container input[type="checkbox"]:checked {
          background: rgb(${color}) !important;
        }

        /* 选中文本 */
        #article-container ::selection {
          background: rgb(${color}) !important;
        }

        /* Note标签边框 */
        #article-container .note.note-info {
          border-left-color: rgb(${color}) !important;
        }

        /* 表格头部 */
        #article-container table thead {
          background: rgb(${color}) !important;
        }

        /* 表格标题文字颜色 - 浅色模式白色 */
        #article-container table thead,
        #article-container table thead th,
        #article-container table thead td {
          color: #fff !important;
        }

        /* 表格标题文字颜色 - 暗色模式浅灰色 */
        [data-theme="dark"] #article-container table thead,
        [data-theme="dark"] #article-container table thead th,
        [data-theme="dark"] #article-container table thead td {
          color: #E8E8E8 !important;
        }

        /* 分享按钮图标边框 */
        #post .post_share .social-share .social-share-icon {
          border-color: rgb(${color}) !important;
          color: rgb(${color}) !important;
        }

        #post .post_share .social-share .social-share-icon:hover {
          background: rgb(${color}) !important;
          color: #fff !important;
        }

        /* 底部固定提示条 - 保持95%透明度，仅限文章页面 */
        body.post .copy-success-notification {
          background-color: rgba(${color}, 0.95) !important;
        }

        /* 暗色模式下的提示条 - 仅限文章页面 */
        [data-theme="dark"] body.post .copy-success-notification {
          background-color: rgba(${color}, 0.95) !important;
        }

        /* 文章快捷切换背景 - 仅悬停时应用动态主题色 */
        .pagination-post .pagination-related {
          transition: none !important;
        }

        .pagination-post .pagination-related:hover {
          background: rgb(${color}) !important;
        }

        .pagination-post .pagination-related:hover .info-1 .info-item-1,
        .pagination-post .pagination-related:hover .info-1 .info-item-2 {
          color: #fff !important;
        }

        /* 搜索框标题和边框 - 文章页面动态主题色 */
        #local-search .search-dialog .search-nav {
          color: rgb(${color}) !important;
        }

        #local-search .search-dialog .search-dialog-title {
          color: rgb(${color}) !important;
        }

        #local-search .local-search-box input {
          border: 2px solid rgb(${color}) !important;
        }

        #local-search .local-search-box input:focus {
          border: 2px solid rgb(${hoverColor}) !important;
        }

        /* 搜索结果链接悬停 */
        #local-search .local-search-hit-item a:hover {
          color: rgb(${color}) !important;
        }

        /* 搜索结果标记 */
        #local-search .local-search-hit-item::marker {
          color: rgb(${color}) !important;
        }

        /* 搜索关闭按钮悬停 */
        #local-search .search-close-button:hover {
          color: rgb(${color}) !important;
        }
    `;

    document.head.appendChild(style);
  }

  // 清理函数：断开所有观察器
  function cleanup() {
    if (headerObserver) {
      headerObserver.disconnect();
      headerObserver = null;
    }
    if (notificationObserver) {
      notificationObserver.disconnect();
      notificationObserver = null;
    }
    // 移除注入的样式
    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) {
      oldStyle.remove();
    }
    // 恢复默认滚动条颜色（移除自定义设置）
    document.documentElement.style.removeProperty("--scrollbar-color");
  }

  // 主函数：应用动态主题色
  function applyDynamicThemeColor() {
    // 先清理旧的观察器和样式
    cleanup();

    // 检查是否为文章页面
    const header = document.getElementById("page-header");
    if (!header || !header.classList.contains("post-bg")) {
      return;
    }

    const articlePath = window.location.pathname;
    const coverUrl = header.getAttribute("data-cover-img");

    // 优先从header的style中读取颜色，其次从缓存，最后使用默认颜色
    let appliedColor =
      getColorFromHeader() ||
      getColorFromCache(articlePath, coverUrl) ||
      DEFAULT_COLOR;

    // 立即应用颜色
    const hoverColor = calculateHoverColor(appliedColor);
    injectStyles(appliedColor, hoverColor);

    // 监听header颜色变化（实时同步）
    headerObserver = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const newColor = getColorFromHeader();
          if (newColor && newColor !== appliedColor) {
            appliedColor = newColor;
            const newHoverColor = calculateHoverColor(appliedColor);
            injectStyles(appliedColor, newHoverColor);
          }
          break;
        }
      }
    });

    headerObserver.observe(header, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // 监听提示条的创建，直接应用内联样式
    notificationObserver = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === 1 &&
              node.classList &&
              node.classList.contains("copy-success-notification")
            ) {
              // 直接设置内联样式，优先级最高
              node.style.setProperty(
                "background-color",
                `rgba(${appliedColor}, 0.95)`,
                "important"
              );
            }
          });
        }
      }
    });

    notificationObserver.observe(document.body, {
      childList: true,
      subtree: false,
    });
  }

  // 等待DOM加载完成后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyDynamicThemeColor);
  } else {
    // DOM已经加载完成，立即执行
    applyDynamicThemeColor();
  }

  // PJAX支持 - 页面切换时重新应用（会先清理旧的）
  document.addEventListener("pjax:complete", applyDynamicThemeColor);
  document.addEventListener("pjax:success", applyDynamicThemeColor);

  // 页面卸载时清理
  window.addEventListener("beforeunload", cleanup, { once: true });

  // 监听主题切换，重新应用颜色
  const themeObserver = new MutationObserver(function (mutations) {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-theme"
      ) {
        applyDynamicThemeColor();
        break;
      }
    }
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
})();
