/**
 * 图片水印功能
 * 为文章中的图片添加水印
 */

(function () {
  "use strict";

  // 水印配置
  const watermarkConfig = {
    text: "© Dran Blog", // 水印文字
    fontSize: 32, // 字体大小
    fontFamily: "Arial", // 字体
    color: "rgba(0, 0, 0, 0.02)", // 水印颜色
    position: "full-cover", // 位置: bottom-right, bottom-left, top-right, top-left, center, full-cover
    offsetX: 20, // X轴偏移
    offsetY: 20, // Y轴偏移
    angle: -30, // 旋转角度（仅用于 full-cover）
    enabled: true, // 是否启用
  };

  // 检查是否是占位图或懒加载未完成
  function isPlaceholderImage(img) {
    // 检查是否有 data-lazy-src 属性且没有 loaded 类（Butterfly 懒加载特征）
    if (img.dataset.lazySrc && !img.classList.contains("loaded")) {
      return true;
    }

    // 检查图片尺寸（占位图通常很小）
    if (img.naturalWidth <= 10 || img.naturalHeight <= 10) {
      return true;
    }

    // 检查是否是 base64 占位图（通常很短）
    if (img.src.startsWith("data:image") && img.src.length < 200) {
      return true;
    }

    // 检查是否包含常见占位图关键词
    const placeholderKeywords = ["placeholder", "loading", "lazy", "blank"];
    const srcLower = img.src.toLowerCase();
    if (placeholderKeywords.some((keyword) => srcLower.includes(keyword))) {
      return true;
    }

    // 检查其他懒加载属性
    if (img.dataset.src || img.dataset.original) {
      // 如果 src 已经是真实 URL（不是 data: 开头），说明懒加载已完成
      if (!img.src.startsWith("data:")) {
        return false;
      }
      return true;
    }

    return false;
  }

  // 添加水印到图片
  function addWatermark(img) {
    // 如果图片已经处理过，跳过
    if (img.dataset.watermarked === "true") return;

    // 检查是否是占位图
    if (isPlaceholderImage(img)) {
      return;
    }

    // 创建新的图片对象以处理跨域
    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";

    tempImg.onload = function () {
      // 保持原始尺寸，不进行缩放
      const originalWidth = tempImg.naturalWidth || tempImg.width;
      const originalHeight = tempImg.naturalHeight || tempImg.height;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", {
        willReadFrequently: false,
        alpha: true, // 保留透明度
        colorSpace: "srgb", // 使用标准色彩空间
      });

      // 设置 canvas 尺寸为原始尺寸（精确匹配）
      canvas.width = originalWidth;
      canvas.height = originalHeight;

      // 绘制原图（保持原始尺寸，使用高质量插值）
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tempImg, 0, 0, originalWidth, originalHeight);

      // 设置水印样式（使用配置的字体大小）
      ctx.font = `${watermarkConfig.fontSize}px ${watermarkConfig.fontFamily}`;
      ctx.fillStyle = watermarkConfig.color;
      ctx.textBaseline = "bottom";

      // 计算水印位置
      const textMetrics = ctx.measureText(watermarkConfig.text);
      const textWidth = textMetrics.width;
      const textHeight = watermarkConfig.fontSize;

      if (watermarkConfig.position === "full-cover") {
        // 全图覆盖模式
        const angle = (watermarkConfig.angle * Math.PI) / 180;
        const spacing = watermarkConfig.fontSize * 1.5;
        const rowSpacing = textHeight + spacing * 2;
        const colSpacing = textWidth + spacing * 2;

        // 计算旋转后需要的行列数
        const diagonal = Math.sqrt(
          canvas.width * canvas.width + canvas.height * canvas.height
        );
        const rows = Math.ceil(diagonal / rowSpacing) + 2;
        const cols = Math.ceil(diagonal / colSpacing) + 2;

        // 保存当前状态
        ctx.save();

        // 移动到画布中心
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);

        // 从中心开始绘制水印网格
        const startX = -(cols * colSpacing) / 2;
        const startY = -(rows * rowSpacing) / 2;

        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const x = startX + j * colSpacing;
            const y = startY + i * rowSpacing;
            ctx.fillText(watermarkConfig.text, x, y);
          }
        }

        // 恢复状态
        ctx.restore();
      } else {
        // 单个水印模式
        let x, y;
        switch (watermarkConfig.position) {
          case "bottom-right":
            x = canvas.width - textWidth - watermarkConfig.offsetX;
            y = canvas.height - watermarkConfig.offsetY;
            break;
          case "bottom-left":
            x = watermarkConfig.offsetX;
            y = canvas.height - watermarkConfig.offsetY;
            break;
          case "top-right":
            x = canvas.width - textWidth - watermarkConfig.offsetX;
            y = textHeight + watermarkConfig.offsetY;
            break;
          case "top-left":
            x = watermarkConfig.offsetX;
            y = textHeight + watermarkConfig.offsetY;
            break;
          case "center":
            x = (canvas.width - textWidth) / 2;
            y = canvas.height / 2;
            break;
          default:
            x = canvas.width - textWidth - watermarkConfig.offsetX;
            y = canvas.height - watermarkConfig.offsetY;
        }

        // 绘制水印
        ctx.fillText(watermarkConfig.text, x, y);
      }

      // 替换图片源 - 保持原始格式和高质量
      try {
        // 智能检测图片格式
        let format = "image/png";
        let quality = undefined;

        // 检查原始图片URL的扩展名
        const originalSrc = img.dataset.originalSrc || img.src;
        if (originalSrc.match(/\.(jpg|jpeg)$/i)) {
          format = "image/jpeg";
          quality = 1.0; // 使用最高质量（100%），确保不损失细节
        }

        // 检查URL参数中的格式
        if (
          originalSrc.includes("format=jpg") ||
          originalSrc.includes("format=jpeg")
        ) {
          format = "image/jpeg";
          quality = 1.0;
        }

        // 使用blob URL代替base64，避免URL过长
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.warn("无法生成水印图片blob");
              return;
            }

            const blobUrl = URL.createObjectURL(blob);

            // 保存原始src（如果还没保存）
            if (!img.dataset.originalSrc) {
              img.dataset.originalSrc = img.src;
            }

            // 获取原始文件名
            let filename = "image";
            const originalSrc = img.dataset.originalSrc || img.src;
            const urlMatch = originalSrc.match(/\/([^/?#]+)(?:[?#]|$)/);
            if (urlMatch && urlMatch[1]) {
              filename = urlMatch[1];
            }

            // 保存文件名信息
            img.dataset.originalFilename = filename;

            img.src = blobUrl;
            img.dataset.watermarked = "true";

            // 清理旧的blob URL
            img.addEventListener(
              "load",
              function () {
                const oldSrc = img.dataset.originalSrc;
                if (oldSrc && oldSrc.startsWith("blob:")) {
                  URL.revokeObjectURL(oldSrc);
                }
              },
              { once: true }
            );
          },
          format,
          quality
        );
      } catch (e) {
        console.warn("无法为图片添加水印（可能是跨域问题）:", img.src);
      }
    };

    tempImg.onerror = function () {
      console.warn("图片加载失败，无法添加水印:", img.src);
    };

    // 使用 CORS 代理加载图片
    const corsProxyUrl = img.src.replace(
      "r2.lpblog.dpdns.org",
      "cors.lpblog.dpdns.org"
    );
    tempImg.src = corsProxyUrl;
  }

  // 处理所有文章图片
  function processImages() {
    if (!watermarkConfig.enabled) return;

    // 检查是否在真正的文章页面
    const isPostPage = document.body.classList.contains('post') || 
                       document.querySelector('.post-bg') !== null ||
                       document.querySelector('article.post') !== null;
    
    const hasArticleContainer = document.querySelector("#article-container, .post-content") !== null;
    
    if (!isPostPage || !hasArticleContainer) {
      return; // 非文章页面不添加明水印
    }

    // 选择文章内容区域的图片
    const images = document.querySelectorAll(
      "#article-container img, .post-content img"
    );

    images.forEach(processImage);
  }

  // 处理单个图片（统一的处理逻辑）
  function processImage(img) {
    if (img.complete && img.naturalWidth > 0 && !isPlaceholderImage(img)) {
      addWatermark(img);
    } else {
      img.addEventListener(
        "load",
        function () {
          if (!isPlaceholderImage(img)) {
            addWatermark(img);
          }
        },
        { once: true }
      );
    }
  }

  // 使用 MutationObserver 监听图片动态加载
  function observeImages() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // 检查是否是图片元素
          if (node.nodeType === 1 && node.tagName === "IMG") {
            processImage(node);
          }
          // 检查子元素中是否有图片
          if (node.nodeType === 1 && node.querySelectorAll) {
            const imgs = node.querySelectorAll(
              "#article-container img, .post-content img"
            );
            imgs.forEach(processImage);
          }
        });

        // 监听属性变化（懒加载图片的 src 或 class 变化）
        if (mutation.type === "attributes") {
          const img = mutation.target;

          if (img.tagName === "IMG" && img.dataset.watermarked !== "true") {
            // 监听 class 变化（loaded 类添加时）
            if (
              mutation.attributeName === "class" &&
              img.classList.contains("loaded")
            ) {
              if (
                img.complete &&
                img.naturalWidth > 0 &&
                !isPlaceholderImage(img)
              ) {
                addWatermark(img);
              }
            }

            // 监听 src 变化
            if (mutation.attributeName === "src") {
              processImage(img);
            }
          }
        }
      });
    });

    // 观察文章容器
    const articleContainer =
      document.querySelector("#article-container") ||
      document.querySelector(".post-content");
    if (articleContainer) {
      observer.observe(articleContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "class"], // 同时监听 class 变化（loaded 类）
      });
    }

    return observer;
  }

  // 初始化函数
  function init() {
    // 检查是否在真正的文章页面（排除关于页、友链页等）
    const isPostPage = document.body.classList.contains('post') || 
                       document.querySelector('.post-bg') !== null ||
                       document.querySelector('article.post') !== null;
    
    const hasArticleContainer = document.querySelector("#article-container, .post-content") !== null;
    
    // 只在文章页面且有文章容器时初始化明水印
    if (!isPostPage || !hasArticleContainer) {
      return; // 非文章页面不初始化明水印
    }

    // 使用 requestIdleCallback 在浏览器空闲时处理，避免阻塞主线程
    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        () => {
          processImages();
          observeImages();
        },
        { timeout: 2000 }
      );

      // 延迟再次处理（确保懒加载图片被处理）
      requestIdleCallback(
        () => {
          processImages();
        },
        { timeout: 5000 }
      );
    } else {
      // 降级方案
      setTimeout(() => {
        processImages();
        observeImages();
      }, 100);

      setTimeout(processImages, 2000);
    }
  }

  // 页面加载完成后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 监听 PJAX 页面切换
  document.addEventListener("pjax:complete", init);
  document.addEventListener("pjax:success", init);

  // 暴露配置接口
  window.imageWatermark = {
    config: watermarkConfig,
    process: processImages,
  };
})();
