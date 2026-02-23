// 移动端动态渐变背景
(function () {
  // 仅在移动端执行
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;

  if (!isMobile) {
    return;
  }

  function init() {
    // 检查是否在首页
    const header = document.getElementById("page-header");
    if (!header || !header.classList.contains("full_page")) {
      return;
    }

    // 创建 Canvas 容器
    const container = document.createElement("div");
    container.id = "mobile-gradient-bg";
    container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  `;

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    canvas.style.cssText = `
    width: 100%;
    height: 100%;
  `;

    container.appendChild(canvas);
    header.insertBefore(container, header.firstChild);

    // 隐藏默认静态背景
    header.style.backgroundImage = "none";

    // 添加自定义标题
    const siteInfo = document.getElementById("site-info");
    if (siteInfo) {
      // 创建标题元素
      const customTitle = document.createElement("h2");
      customTitle.id = "mobile-custom-title";
      customTitle.textContent = "Be brave to do";
      customTitle.style.cssText = `
        font-size: 1.75em;
        font-weight: bold;
        margin: 0;
        color: #ffffff;
        text-align: center;
        text-shadow: none;
      `;

      // 插入到 site-info 的最前面
      siteInfo.insertBefore(customTitle, siteInfo.firstChild);

      // 移除一言文字的阴影并设置固定高度（单行显示）
      const subtitle = document.getElementById("subtitle");
      const siteSubtitle = document.getElementById("site-subtitle");
      if (subtitle) {
        subtitle.style.textShadow = "none";
        subtitle.style.height = "1.5em";
        subtitle.style.lineHeight = "1.5em";
        subtitle.style.overflow = "hidden";
        subtitle.style.whiteSpace = "nowrap";
        subtitle.style.textOverflow = "ellipsis";
        subtitle.style.display = "block";
      }
      if (siteSubtitle) {
        siteSubtitle.style.height = "1.5em";
        siteSubtitle.style.overflow = "hidden";
      }

      // 移除 site-title 的阴影
      const siteTitle = document.getElementById("site-title");
      if (siteTitle) {
        siteTitle.style.textShadow = "none";
      }

      // 调整 site-info 为垂直居中（使用固定定位避免内容变化时抖动）
      siteInfo.style.position = "absolute";
      siteInfo.style.top = "50%";
      siteInfo.style.left = "0";
      siteInfo.style.right = "0";
      siteInfo.style.transform = "translateY(-50%)";
      siteInfo.style.width = "100%";
      siteInfo.style.textAlign = "center";
      siteInfo.style.padding = "0 20px";
    }

    const ctx = canvas.getContext("2d");
    let t = 0;
    let animationId = null;

    // 渐变色配置（浅色模式）
    const lightTint = {
      r: { value: 200, offset: 36 },
      g: { value: 200, offset: 36 },
      b: { value: 200, offset: 36 },
    };

    // 渐变色配置（深色模式）
    const darkTint = {
      r: { value: 32, offset: 36 },
      g: { value: 32, offset: 36 },
      b: { value: 32, offset: 36 },
    };

    // 获取当前主题
    function isDarkMode() {
      return document.documentElement.getAttribute("data-theme") === "dark";
    }

    // 获取当前色板
    function getCurrentTint() {
      return isDarkMode() ? darkTint : lightTint;
    }

    // 颜色计算函数
    function R(x, y, t) {
      const tint = getCurrentTint();
      return Math.floor(
        tint.r.value + tint.r.offset * Math.cos((x * x - y * y) / 300 + t)
      );
    }

    function G(x, y, t) {
      const tint = getCurrentTint();
      return Math.floor(
        tint.g.value +
          tint.g.offset *
            Math.sin((x * x * Math.cos(t / 4) + y * y * Math.sin(t / 3)) / 300)
      );
    }

    function B(x, y, t) {
      const tint = getCurrentTint();
      return Math.floor(
        tint.b.value +
          tint.b.offset *
            Math.sin(
              5 * Math.sin(t / 9) +
                ((x - 100) * (x - 100) + (y - 100) * (y - 100)) / 1100
            )
      );
    }

    // 绘制像素
    function drawPixel(x, y, r, g, b) {
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // 渲染循环
    function render() {
      for (let x = 0; x <= 31; x++) {
        for (let y = 0; y <= 31; y++) {
          drawPixel(x, y, R(x, y, t), G(x, y, t), B(x, y, t));
        }
      }
      t += 0.02;
      animationId = requestAnimationFrame(render);
    }

    // 启动动画
    render();

    // 监听主题切换
    const observer = new MutationObserver(() => {
      // 主题切换时，颜色会自动更新（通过 getCurrentTint）
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // 清理函数
    function cleanup() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      observer.disconnect();
      if (container && container.parentNode) {
        container.remove();
      }
    }

    // PJAX 支持
    document.addEventListener("pjax:send", cleanup);
    window.addEventListener("beforeunload", cleanup);
  }

  // 初始化
  function initOnLoad() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // 首次加载
  initOnLoad();

  // PJAX 完成后重新初始化
  document.addEventListener("pjax:complete", init);
})();
