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

  // 添加水印到图片
  function addWatermark(img) {
    // 如果图片已经处理过，跳过
    if (img.dataset.watermarked === "true") return;

    // 创建新的图片对象以处理跨域
    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";

    tempImg.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 设置 canvas 尺寸
      canvas.width = tempImg.naturalWidth || tempImg.width;
      canvas.height = tempImg.naturalHeight || tempImg.height;

      // 绘制原图
      ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);

      // 固定水印大小
      const dynamicFontSize = watermarkConfig.fontSize;

      // 设置水印样式
      ctx.font = `${dynamicFontSize}px ${watermarkConfig.fontFamily}`;
      ctx.fillStyle = watermarkConfig.color;
      ctx.textBaseline = "bottom";

      // 计算水印位置
      const textMetrics = ctx.measureText(watermarkConfig.text);
      const textWidth = textMetrics.width;
      const textHeight = dynamicFontSize;

      if (watermarkConfig.position === "full-cover") {
        // 全图覆盖模式
        const angle = (watermarkConfig.angle * Math.PI) / 180; // 转换为弧度
        const spacing = dynamicFontSize * 1.2; // 四周间距为水印的1.2倍
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

      // 替换图片源
      try {
        const watermarkedUrl = canvas.toDataURL("image/png");
        img.src = watermarkedUrl;
        img.dataset.watermarked = "true";
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

    // 选择文章内容区域的图片
    const images = document.querySelectorAll(
      "#article-container img, .post-content img"
    );

    images.forEach((img) => {
      if (img.complete) {
        addWatermark(img);
      } else {
        img.addEventListener(
          "load",
          function () {
            addWatermark(img);
          },
          { once: true }
        );
      }
    });
  }

  // 页面加载完成后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", processImages);
  } else {
    processImages();
  }

  // 监听 PJAX 页面切换
  if (typeof pjax !== "undefined") {
    document.addEventListener("pjax:complete", processImages);
  }

  // 暴露配置接口
  window.imageWatermark = {
    config: watermarkConfig,
    process: processImages,
  };
})();
