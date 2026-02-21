/**
 * 盲水印功能 - 零影响版
 * 使用 LSB 算法在图片中嵌入不可见水印
 */

(function () {
  "use strict";

  // 盲水印配置
  const config = {
    text: "By Dran Blog",
    enabled: true,
  };

  // 将文本转换为二进制
  function textToBinary(text) {
    return text
      .split("")
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
      .join("");
  }

  // 在图片中嵌入盲水印（LSB 算法）
  function embedWatermark(imageData, text) {
    const binary = textToBinary(text);
    const data = imageData.data;
    const lengthBinary = binary.length.toString(2).padStart(16, "0");
    const fullBinary = lengthBinary + binary;

    let bitIndex = 0;

    // 简单顺序嵌入，跳过Alpha通道
    for (let i = 0; i < data.length && bitIndex < fullBinary.length; i++) {
      if ((i + 1) % 4 !== 0) {
        // 跳过Alpha通道
        data[i] = (data[i] & 0xfe) | parseInt(fullBinary[bitIndex], 10);
        bitIndex++;
      }
    }

    return imageData;
  }

  // 生成PNG格式的带盲水印图片（从原始图片生成）
  function generateWatermarkedPNG(img) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", {
        willReadFrequently: false,
        alpha: true,
        colorSpace: "srgb",
      });

      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";

      tempImg.onload = function () {
        const originalWidth = tempImg.naturalWidth || tempImg.width;
        const originalHeight = tempImg.naturalHeight || tempImg.height;

        canvas.width = originalWidth;
        canvas.height = originalHeight;

        ctx.imageSmoothingEnabled = false; // 禁用平滑以保持像素精度

        try {
          ctx.drawImage(tempImg, 0, 0, originalWidth, originalHeight);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          embedWatermark(imageData, config.text);
          ctx.putImageData(imageData, 0, 0);

          // 强制PNG格式，无损压缩
          canvas.toBlob(resolve, "image/png");
        } catch (e) {
          reject(e);
        }
      };

      tempImg.onerror = function () {
        reject(new Error("图片加载失败"));
      };

      // 使用原始src或CORS代理
      const originalSrc = img.dataset.originalSrc || img.src;
      let proxyUrl = originalSrc;

      if (originalSrc.includes("r2.lpblog.dpdns.org")) {
        proxyUrl = originalSrc.replace(
          "r2.lpblog.dpdns.org",
          "cors.lpblog.dpdns.org"
        );
      }

      tempImg.src = proxyUrl;
    });
  }

  // 已处理图片的集合（使用WeakSet避免内存泄漏）
  const processedImages = new WeakSet();

  // 自动为所有图片添加盲水印
  function processImages() {
    if (!config.enabled) return;

    // 查找所有图片，包括文章内容中的图片
    const images = document.querySelectorAll("img");

    // 进一步过滤：只处理真实的内容图片
    const contentImages = Array.from(images).filter((img) => {
      // 跳过已处理的图片
      if (processedImages.has(img)) {
        return false;
      }

      // 排除已有明水印的图片
      if (img.dataset.watermarked === "true") {
        return false;
      }

      // 排除文章页面的图片（明水印会处理）
      const isPostPage =
        document.body.classList.contains("post") ||
        document.querySelector(".post-bg") !== null ||
        document.querySelector("article.post") !== null;

      if (isPostPage) {
        const isInArticle = img.closest("#article-container, .post-content");
        if (isInArticle) {
          return false;
        }
      }

      // 获取真实图片地址（兼容懒加载）
      const src =
        img.src ||
        img.dataset.src ||
        img.dataset.lazySrc ||
        img.dataset.original;

      // 排除占位符和无效图片
      if (
        !src ||
        src.startsWith("data:image/gif") ||
        src.includes("1x1") ||
        src.includes("placeholder") ||
        src.includes("loading")
      ) {
        return false;
      }

      // 排除图标和头像
      if (
        src.includes("icon") ||
        src.includes("avatar") ||
        src.includes("logo") ||
        src.endsWith(".ico")
      ) {
        return false;
      }

      // 排除导航栏、侧边栏等区域的图片
      const parent = img.closest(
        "nav, header, footer, aside, .navbar, .sidebar, .menu, .nav"
      );
      if (parent) {
        return false;
      }

      // 只处理来自指定域名的图片
      if (src.includes("r2.lpblog.dpdns.org") || src.includes("localhost")) {
        return true;
      }

      return false;
    });

    contentImages.forEach(async (img) => {
      // 标记为已处理
      processedImages.add(img);

      try {
        // 等待图片加载完成（兼容懒加载）
        const waitForImageLoad = () => {
          return new Promise((resolve) => {
            // 如果图片已加载且有真实src
            if (
              img.complete &&
              img.naturalWidth > 0 &&
              img.src &&
              !img.src.includes("placeholder")
            ) {
              resolve();
              return;
            }

            // 监听懒加载图片的src变化
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (
                  mutation.type === "attributes" &&
                  mutation.attributeName === "src"
                ) {
                  if (img.src && !img.src.includes("placeholder")) {
                    observer.disconnect();
                    if (img.complete) {
                      resolve();
                    } else {
                      img.onload = () => resolve();
                      img.onerror = () => resolve();
                    }
                  }
                }
              });
            });

            observer.observe(img, { attributes: true });

            // 同时监听load事件
            img.onload = () => {
              observer.disconnect();
              resolve();
            };
            img.onerror = () => {
              observer.disconnect();
              resolve();
            };

            // 超时保护
            setTimeout(() => {
              observer.disconnect();
              resolve();
            }, 5000);
          });
        };

        await waitForImageLoad();

        // 再次检查图片是否有效
        if (
          !img.src ||
          img.src.includes("placeholder") ||
          img.naturalWidth < 100 ||
          img.naturalHeight < 100
        ) {
          return;
        }

        // 标记图片已准备好处理盲水印
        img.dataset.watermarkReady = "true";
      } catch (err) {
        // 静默失败
      }
    });
  }

  // 初始化
  function init() {
    if (!config.enabled) return;

    // 延迟处理，等待懒加载初始化
    setTimeout(() => processImages(), 500);

    // 监听新图片加载和属性变化（懒加载）
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      mutations.forEach((mutation) => {
        // 监听新增的图片节点
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.tagName === "IMG") {
              shouldProcess = true;
            } else if (node.querySelector && node.querySelector("img")) {
              shouldProcess = true;
            }
          }
        });

        // 监听图片src属性变化（懒加载触发）
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "src" &&
          mutation.target.tagName === "IMG"
        ) {
          shouldProcess = true;
        }
      });

      if (shouldProcess) {
        setTimeout(() => processImages(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // PJAX兼容
  document.addEventListener("pjax:complete", init);
  document.addEventListener("pjax:success", init);

  // 为下载生成带盲水印的PNG
  function generateForDownload(img) {
    return new Promise(async (resolve, reject) => {
      try {
        // 生成带盲水印的PNG
        const watermarkedBlob = await generateWatermarkedPNG(img);

        if (!watermarkedBlob) {
          throw new Error("生成的blob为空");
        }

        const blobUrl = URL.createObjectURL(watermarkedBlob);

        // 生成PNG文件名
        let filename = "image";
        try {
          const urlObj = new URL(img.src);
          const pathParts = urlObj.pathname.split("/");
          const originalName = pathParts[pathParts.length - 1];
          if (originalName) {
            filename = originalName.replace(/\.(jpg|jpeg|gif|webp)$/i, "");
          }
        } catch (e) {
          // 使用默认文件名
        }
        filename += ".png";

        resolve({ blobUrl, filename });
      } catch (err) {
        reject(err);
      }
    });
  }

  // 暴露接口
  window.blindWatermark = {
    config: config,
    generateForDownload: generateForDownload,
  };
})();
