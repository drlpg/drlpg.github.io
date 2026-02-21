/* 动态加载管理器 - 代码分割和懒加载 */

(function () {
  "use strict";

  // 避免重复执行
  if (window.dynamicLoaderInitialized) return;
  window.dynamicLoaderInitialized = true;

  // 动态加载模块的缓存
  const loadedModules = new Set();

  // 通用的动态导入函数
  async function loadModule(modulePath) {
    if (loadedModules.has(modulePath)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = modulePath;
      script.async = true;
      script.onload = () => {
        loadedModules.add(modulePath);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 懒加载功能模块
  const lazyFeatures = {
    // 音乐相关功能
    music: {
      scripts: ["/js/music-context-menu.js"],
      trigger: () =>
        document.querySelector("#nav-music") ||
        document.querySelector(".aplayer"),
    },

    // 右键菜单功能
    contextMenu: {
      scripts: ["/js/custom-context-menu.js"],
      trigger: () => true, // 总是加载，但延迟
      delay: 2000,
    },

    // 分享功能
    share: {
      scripts: ["/js/share.js"],
      trigger: () =>
        document.querySelector(".share-button") ||
        document.querySelector("[data-share]"),
    },

    // 复制功能
    clipboard: {
      scripts: ["/js/clipboard.js"],
      trigger: () =>
        document.querySelector(".copy-btn") ||
        document.querySelector("[data-clipboard]"),
    },

    // 热门评论弹窗
    hotComment: {
      scripts: ["/js/hot-comment-popup.js"],
      trigger: () => {
        // 检测各种评论系统的容器
        const commentSelectors = [
          ".comment-hot",
          "#post-comment",
          ".comments",
          "#comments",
          ".tk-comments-container",
          ".vcomments",
          ".twikoo",
          ".valine",
          ".comment",
          ".gitalk-container",
          ".utterances",
          ".disqus-thread",
          ".artalk",
          ".waline",
          ".giscus",
        ];
        return commentSelectors.some((selector) =>
          document.querySelector(selector)
        );
      },
    },

    // 灰度切换
    grayscale: {
      scripts: ["/js/grayscale-toggle.js"],
      trigger: () =>
        document.querySelector("#grayscale-toggle") ||
        document.querySelector("[data-grayscale]"),
    },
  };

  // 检查并加载功能
  async function checkAndLoadFeature(featureName, feature) {
    try {
      // 检查触发条件
      if (feature.trigger && !feature.trigger()) {
        return;
      }

      // 如果有延迟设置，等待指定时间
      if (feature.delay) {
        await new Promise((resolve) => setTimeout(resolve, feature.delay));
      }

      // 加载所有相关脚本
      const loadPromises = feature.scripts.map((script) => loadModule(script));
      await Promise.all(loadPromises);

      // 静默加载完成
    } catch (error) {
      // 静默处理加载错误
    }
  }

  // 使用 Intersection Observer 监听特定元素
  function observeElements() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;

            // 检查音乐播放器
            if (element.matches("#nav-music, .aplayer")) {
              checkAndLoadFeature("music", lazyFeatures.music);
            }

            // 检查分享按钮
            if (element.matches(".share-button, [data-share]")) {
              checkAndLoadFeature("share", lazyFeatures.share);
            }

            // 检查复制按钮
            if (element.matches(".copy-btn, [data-clipboard]")) {
              checkAndLoadFeature("clipboard", lazyFeatures.clipboard);
            }

            // 检查评论区域
            if (
              element.matches(
                ".comment-hot, #post-comment, .comments, #comments, .tk-comments-container, .vcomments, .twikoo, .valine, .comment, .gitalk-container, .utterances, .disqus-thread, .artalk, .waline, .giscus"
              )
            ) {
              checkAndLoadFeature("hotComment", lazyFeatures.hotComment);
            }

            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: "50px",
      }
    );

    // 观察相关元素
    const elementsToObserve = [
      "#nav-music",
      ".aplayer",
      ".share-button",
      "[data-share]",
      ".copy-btn",
      "[data-clipboard]",
      ".comment-hot",
      "#post-comment",
      ".comments",
      "#comments",
      ".tk-comments-container",
      ".vcomments",
      ".twikoo",
      ".valine",
      ".comment",
      ".gitalk-container",
      ".utterances",
      ".disqus-thread",
      ".artalk",
      ".waline",
      ".giscus",
      "#grayscale-toggle",
      "[data-grayscale]",
    ];

    elementsToObserve.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => observer.observe(element));
    });
  }

  // 页面加载完成后初始化
  function initialize() {
    // 立即检查并加载关键功能
    checkAndLoadFeature("contextMenu", lazyFeatures.contextMenu);
    checkAndLoadFeature("grayscale", lazyFeatures.grayscale);

    // 开始观察元素
    observeElements();

    // 定期检查新元素（适用于动态内容）
    setInterval(() => {
      Object.entries(lazyFeatures).forEach(([name, feature]) => {
        if (!loadedModules.has(feature.scripts[0])) {
          checkAndLoadFeature(name, feature);
        }
      });
    }, 3000);
  }

  // 等待 DOM 准备就绪
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  // 暴露加载函数供外部使用
  window.loadFeature = loadModule;
})();
