/**
 * 博客统计脚本加载器 - 带 fallback 机制
 */

(function () {
  "use strict";

  // 防止重复加载
  if (window.blogStatsLoaderInitialized) {
    return;
  }
  window.blogStatsLoaderInitialized = true;

  const REMOTE_URL = "https://stats.lpblog.dpdns.org/blog-stats.js";
  const FALLBACK_URL = "/js/blog-stats-fallback.js";
  const TIMEOUT = 5000; // 5秒超时

  function loadScript(url, timeout = TIMEOUT) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;

      let timeoutId;

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve(url);
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load script: ${url}`));
      };

      // 设置超时
      timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(`Script load timeout: ${url}`));
      }, timeout);

      document.head.appendChild(script);
    });
  }

  async function loadBlogStats() {
    // 显示加载状态
    showLoadingIndicator();
    
    try {
      // 首先尝试加载远程脚本
      await loadScript(REMOTE_URL);

    } catch (error) {
      console.warn("远程统计脚本加载失败，尝试本地备用:", error.message);
      
      try {
        // 远程失败时加载本地备用脚本
        await loadScript(FALLBACK_URL, 3000);

      } catch (fallbackError) {
        console.error("统计脚本加载失败:", fallbackError.message);

        // 显示静态的占位符
        setTimeout(() => {
          const elements = document.querySelectorAll(
            "#busuanzi_site_pv, #busuanzi_site_uv, #busuanzi_page_pv, #busuanzi_value_site_pv, #busuanzi_value_site_uv, #busuanzi_value_page_pv"
          );
          elements.forEach((el) => {
            if (el && (el.textContent.trim() === "" || el.textContent.trim() === "...")) {
              el.textContent = "---";
            }
          });
          
          // 显示容器
          const containers = document.querySelectorAll(
            "#busuanzi_container_site_pv, #busuanzi_container_site_uv, #busuanzi_container_page_pv"
          );
          containers.forEach((container) => {
            if (container) {
              container.style.display = "";
              container.style.visibility = "visible";
            }
          });
        }, 1000);
      }
    }
  }
  
  function showLoadingIndicator() {
    // 立即显示加载指示器
    const elements = document.querySelectorAll(
      "#busuanzi_site_pv, #busuanzi_site_uv, #busuanzi_page_pv, #busuanzi_value_site_pv, #busuanzi_value_site_uv, #busuanzi_value_page_pv"
    );
    elements.forEach((el) => {
      if (el) {
        el.textContent = "...";
      }
    });
  }

  // 页面加载完成后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadBlogStats);
  } else {
    loadBlogStats();
  }
})();
