/**
 * 侧边栏动态主题色应用器
 * 功能：在文章页面将侧边栏卡片的主题色替换为动态生成的主题色
 * 特点：只在文章页面应用，与标题背景色保持一致
 */

(function () {
  "use strict";

  const DEFAULT_COLOR = "61, 157, 242";
  const CACHE_KEY = "butterfly_article_colors";
  const STYLE_ID = "aside-dynamic-theme-style";

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

  // 调暗颜色以匹配header遮罩效果
  function darkenColor(rgbString) {
    try {
      const parts = rgbString.split(",").map((s) => parseInt(s.trim()));
      if (parts.length !== 3) return rgbString;

      const [r, g, b] = parts;
      // 根据主题模式应用不同的调暗系数
      // 浅色模式：15%透明度 -> factor = 0.85
      // 暗色模式：40%透明度 -> factor = 0.6
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
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

  // 动态注入侧边栏样式
  function injectAsideStyles(color) {
    // 移除旧的样式
    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) {
      oldStyle.remove();
    }

    // 创建新的样式
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* 仅在文章页面应用侧边栏动态主题色 */
      body:has(#page-header.post-bg) {
        /* 个人主页卡片背景色 */
        #aside-content .card-widget.card-info {
          background: rgb(${color}) !important;
        }

        /* 标签云悬停效果 */
        .card-tag-cloud a:hover {
          background: rgb(${color}) !important;
          border-color: rgb(${color}) !important;
        }

        .card-tag-cloud a:hover .tag-count {
          color: rgb(${color}) !important;
        }

        /* 分类列表悬停效果 */
        .card-categories ul.card-category-list > .card-category-list-item a:hover {
          background: rgb(${color}) !important;
          border-color: rgb(${color}) !important;
        }

        .card-categories ul.card-category-list > .card-category-list-item a:hover .card-category-list-count {
          color: rgb(${color}) !important;
        }

        /* 归档列表悬停效果 */
        .card-archives ul.card-archive-list > .card-archive-list-item a:hover {
          background-color: rgb(${color}) !important;
        }

        /* 最近文章列表悬停效果 */
        .aside-list > .aside-list-item .content > .title:hover,
        .aside-list > .aside-list-item .content > .comment:hover {
          color: rgb(${color}) !important;
        }

        /* 网站信息悬停效果 */
        .site-data > a:hover div {
          color: rgb(${color}) !important;
        }

        /* TOC目录链接悬停效果 */
        #card-toc .toc-content .toc-link:hover {
          color: rgb(${color}) !important;
        }

        /* TOC目录激活状态 - 背景色和白色文字 */
        #card-toc .toc-content .toc-link.active {
          background: rgb(${color}) !important;
          color: #fff !important;
        }

        /* 确保TOC激活状态悬停时文字保持白色 */
        #card-toc .toc-content .toc-link.active:hover {
          color: #fff !important;
        }

        /* 作者信息卡片社交图标悬停效果 */
        .card-info .card-info-social-icons .social-icon:hover {
          color: rgb(${color}) !important;
        }

        /* 作者信息卡片问候语悬停效果 */
        .card-info .greeting-message:hover {
          color: rgb(${color}) !important;
        }

        /* 更多按钮悬停效果 */
        .card-more-btn:hover {
          color: rgb(${color}) !important;
        }

        /* 热评弹窗悬停边框 */
        .hot-comment-popup:hover {
          border-color: rgb(${color}) !important;
        }

        /* 热评弹窗"评论"标题悬停色 */
        .hot-comment-title-text:hover {
          background: rgb(${color}) !important;
        }

        /* 热评弹窗关闭按钮悬停色 */
        .hot-comment-close-btn:hover {
          color: rgb(${color}) !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // 主函数：应用侧边栏动态主题色
  function applyAsideDynamicThemeColor() {
    // 检查是否为文章页面
    const header = document.getElementById("page-header");
    if (!header || !header.classList.contains("post-bg")) {
      return;
    }

    const articlePath = window.location.pathname;
    const coverUrl = header.getAttribute("data-cover-img");

    // 优先从header的style中读取颜色，其次从缓存，最后使用默认颜色
    let appliedColor = getColorFromHeader() || getColorFromCache(articlePath, coverUrl) || DEFAULT_COLOR;

    // 立即应用颜色
    injectAsideStyles(appliedColor);

    // 监听header颜色变化（实时同步）
    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          const newColor = getColorFromHeader();
          if (newColor && newColor !== appliedColor) {
            appliedColor = newColor;
            injectAsideStyles(appliedColor);
          }
          break;
        }
      }
    });

    observer.observe(header, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // 页面卸载时断开观察
    window.addEventListener("beforeunload", () => observer.disconnect(), { once: true });
  }

  // 等待DOM加载完成后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAsideDynamicThemeColor);
  } else {
    // DOM已经加载完成，立即执行
    applyAsideDynamicThemeColor();
  }

  // PJAX支持
  document.addEventListener("pjax:complete", applyAsideDynamicThemeColor);
  document.addEventListener("pjax:success", applyAsideDynamicThemeColor);

  // 监听主题切换，重新应用颜色
  const themeObserver = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        applyAsideDynamicThemeColor();
        break;
      }
    }
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
})();
