/**
 * 文章首图智能隐藏处理器
 * 功能：精确识别并隐藏文章内容中的首张封面图片
 */

(function () {
  "use strict";

  // 配置选项
  const CONFIG = {
    minWidth: 200, // 最小宽度，小于此值的图片不会被隐藏
    minHeight: 150, // 最小高度，小于此值的图片不会被隐藏
    maxRetries: 5, // 增加重试次数，确保可靠性
    retryDelay: 300, // 减少重试延迟，提高响应速度
    debugMode: false, // 调试模式
  };

  // 初始化
  function init() {
    // 只在文章页面运行
    if (!isArticlePage()) {
      return;
    }

    // 立即执行，然后设置多重检查确保可靠性
    hideFirstImage();

    // 额外的安全检查，确保在各种加载情况下都能工作
    setTimeout(() => hideFirstImage(), 100);
    setTimeout(() => hideFirstImage(), 500);
    setTimeout(() => hideFirstImage(), 1000);
  }

  // 检查是否为文章页面
  function isArticlePage() {
    return (
      document.getElementById("article-container") &&
      document.getElementById("page-header") &&
      document.getElementById("page-header").classList.contains("post-bg")
    );
  }

  // 主要的首图隐藏逻辑
  function hideFirstImage(retryCount = 0) {
    const article = document.getElementById("article-container");
    if (!article) {
      if (retryCount < CONFIG.maxRetries) {
        setTimeout(() => hideFirstImage(retryCount + 1), CONFIG.retryDelay);
      }
      return;
    }

    // 检查是否已经处理过，避免重复处理
    if (article.dataset.firstImageProcessed === "true") {
      return;
    }

    // 获取文章封面URL用于比较
    const coverUrl = getCoverUrl();

    // 查找首张图片
    const firstImage = findFirstImage(article);

    if (firstImage) {
      // 验证图片是否应该被隐藏
      validateAndHideImage(firstImage, coverUrl);
      // 标记文章已处理
      article.dataset.firstImageProcessed = "true";
    } else if (retryCount < CONFIG.maxRetries) {
      // 如果没找到图片，可能是还在加载，重试
      setTimeout(() => hideFirstImage(retryCount + 1), CONFIG.retryDelay);
    }
  }

  // markAllImagesAsProcessed 函数已移除（CSS备用机制已移除）

  // 获取文章封面URL
  function getCoverUrl() {
    const header = document.getElementById("page-header");
    return header ? header.getAttribute("data-cover-img") : null;
  }

  // 查找文章中的首张图片
  function findFirstImage(article) {
    // 按优先级顺序查找首张图片
    const selectors = [
      "p:first-child > img:first-child", // 段落中的首张图片
      "div:first-child > img:first-child", // div中的首张图片
      "figure:first-child img", // figure中的图片
      "img:first-child", // 直接的首张图片
      "p:nth-child(2) > img:first-child", // 第二段落的首张图片（考虑可能有其他元素）
      "div:nth-child(2) > img:first-child", // 第二div的首张图片
    ];

    for (const selector of selectors) {
      const img = article.querySelector(selector);
      if (img && isValidImage(img)) {
        return img;
      }
    }

    // 如果上述选择器都没找到，尝试查找前几个元素中的图片
    const children = Array.from(article.children).slice(0, 5); // 只检查前5个子元素
    for (const child of children) {
      const img = child.querySelector("img");
      if (img && isValidImage(img)) {
        return img;
      }
    }

    return null;
  }

  // 验证图片是否有效（不是装饰性小图标）
  function isValidImage(img) {
    // 检查图片是否已加载
    if (!img.complete && img.naturalWidth === 0) {
      return false;
    }

    // 检查图片尺寸（如果已加载）
    if (img.complete) {
      if (
        img.naturalWidth < CONFIG.minWidth ||
        img.naturalHeight < CONFIG.minHeight
      ) {
        return false;
      }
    }

    // 检查图片src是否有效
    if (!img.src || img.src.length < 10) {
      return false;
    }

    // 排除常见的装饰性图片
    const decorativePatterns = [
      /icon/i,
      /emoji/i,
      /avatar/i,
      /logo/i,
      /badge/i,
    ];

    for (const pattern of decorativePatterns) {
      if (
        pattern.test(img.src) ||
        pattern.test(img.alt || "") ||
        pattern.test(img.className || "")
      ) {
        return false;
      }
    }

    return true;
  }

  // 验证并隐藏图片
  function validateAndHideImage(img, coverUrl) {
    // 如果图片还没加载完成，等待加载
    if (!img.complete) {
      img.onload = () => validateAndHideImage(img, coverUrl);
      img.onerror = () => {
        // 图片加载失败，不隐藏
      };
      return;
    }

    // 最终尺寸检查
    if (
      img.naturalWidth < CONFIG.minWidth ||
      img.naturalHeight < CONFIG.minHeight
    ) {
      return;
    }

    // 检查是否与封面图片相同
    let shouldHide = false;

    if (coverUrl && img.src) {
      // 比较URL（去除查询参数）
      const imgUrl = img.src.split("?")[0];
      const coverUrlClean = coverUrl.split("?")[0];

      if (
        imgUrl === coverUrlClean ||
        imgUrl.includes(coverUrlClean.split("/").pop()) ||
        coverUrlClean.includes(imgUrl.split("/").pop())
      ) {
        shouldHide = true;
      }
    } else {
      // 如果没有封面URL，根据位置和尺寸判断
      // 通常文章首图会比较大且位于文章开头
      if (img.naturalWidth >= 400 && img.naturalHeight >= 200) {
        shouldHide = true;
      }
    }

    if (shouldHide) {
      hideImageSafely(img);
    }
  }

  // 安全地隐藏图片
  function hideImageSafely(img) {
    try {
      // 标记图片已被处理，避免重复处理
      if (img.dataset.firstImageHidden === "true") {
        return;
      }

      // CSS备用机制已移除，无需标记

      // 隐藏图片
      img.style.display = "none";
      img.style.visibility = "hidden";
      img.dataset.firstImageHidden = "true";

      // 如果图片在段落中且段落只有这一张图片，隐藏整个段落
      const parent = img.parentElement;
      if (parent && parent.tagName === "P") {
        const textContent = parent.textContent.trim();
        const otherImages = parent.querySelectorAll(
          'img:not([data-first-image-hidden="true"])'
        );

        if (textContent.length === 0 && otherImages.length === 0) {
          parent.style.display = "none";
          parent.dataset.firstImageHidden = "true";
        }
      }

      // 静默隐藏，不输出调试信息
    } catch (error) {
      // 静默处理错误
    }
  }

  // 恢复隐藏的图片（调试用）
  function restoreHiddenImages() {
    const hiddenImages = document.querySelectorAll(
      '[data-first-image-hidden="true"]'
    );
    const article = document.getElementById("article-container");

    hiddenImages.forEach((element) => {
      element.style.display = "";
      element.style.visibility = "";
      delete element.dataset.firstImageHidden;
    });

    // 重置文章处理状态
    if (article) {
      delete article.dataset.firstImageProcessed;
    }

    return `已恢复 ${hiddenImages.length} 个隐藏的元素`;
  }

  // 获取隐藏状态信息
  function getHideStatus() {
    const article = document.getElementById("article-container");
    if (!article) {
      return { error: "未找到文章容器" };
    }

    const allImages = article.querySelectorAll("img");
    const hiddenImages = article.querySelectorAll(
      'img[data-first-image-hidden="true"]'
    );
    const hiddenElements = document.querySelectorAll(
      '[data-first-image-hidden="true"]'
    );

    return {
      totalImages: allImages.length,
      hiddenImages: hiddenImages.length,
      hiddenElements: hiddenElements.length,
      coverUrl: getCoverUrl(),
      isArticlePage: isArticlePage(),
    };
  }

  // 手动触发首图隐藏
  function manualHide() {
    if (!isArticlePage()) {
      return "当前页面不是文章页";
    }

    hideFirstImage();
    return "已触发首图隐藏检查";
  }

  // 页面加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // PJAX支持
  document.addEventListener("pjax:complete", init);
  document.addEventListener("pjax:success", init);

  // 暴露调试接口
  window.firstImageDebug = {
    getStatus: getHideStatus,
    restore: restoreHiddenImages,
    manualHide: manualHide,
    toggleDebug: () => {
      CONFIG.debugMode = !CONFIG.debugMode;
      return `调试模式: ${CONFIG.debugMode ? "开启" : "关闭"}`;
    },
  };
})();
