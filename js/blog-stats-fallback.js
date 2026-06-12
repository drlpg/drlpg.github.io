/**
 * 博客统计客户端 - 本地备用版本
 */

(function () {
  "use strict";

  const API_BASE = "https://stats.lpblog.dpdns.org";
  let visitRecorded = false;
  let statsLoaded = false;

  // PJAX 兼容性处理
  if (window.blogStatsInstance) {
    // 如果已有实例，重新获取统计数据
    window.blogStatsInstance.fetchStats();
    return;
  }

  // 记录访问
  async function recordVisit() {
    if (visitRecorded) return;

    try {
      const response = await fetch(`${API_BASE}/api/visit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        visitRecorded = true;

        // 访问记录成功后，延迟获取统计数据确保服务器已处理
        setTimeout(() => {
          fetchStats();
        }, 500);
      }
    } catch (error) {
      console.error("Failed to record visit:", error);
    }
  }

  // 获取统计数据
  async function fetchStats(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒延迟

    try {
      // 添加时间戳防止缓存
      const timestamp = Date.now();
      const cacheBreaker = `?t=${timestamp}&retry=${retryCount}`;

      // 获取总体统计
      const summaryResponse = await fetch(
        `${API_BASE}/api/stats?type=summary${cacheBreaker}`,
        {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
      const summaryResult = await summaryResponse.json();

      // 获取当前页面统计
      const pageResponse = await fetch(
        `${API_BASE}/api/stats?type=page&path=${encodeURIComponent(
          window.location.pathname
        )}${cacheBreaker}`,
        {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
      const pageResult = await pageResponse.json();

      if (summaryResult.success && summaryResult.data) {
        updateSiteStats(summaryResult.data);
      }

      if (pageResult.success && pageResult.data) {
        updatePageStats(pageResult.data);

        // 如果页面访问量为0且是新文章，尝试重试
        if (pageResult.data.page_pv === 0 && retryCount < maxRetries) {
          setTimeout(() => {
            fetchStats(retryCount + 1);
          }, retryDelay * (retryCount + 1)); // 递增延迟
        }
      } else if (retryCount < maxRetries) {
        // 如果获取失败，进行重试
        setTimeout(() => {
          fetchStats(retryCount + 1);
        }, retryDelay * (retryCount + 1));
      }
    } catch (error) {
      console.error("统计数据获取失败:", error);

      if (retryCount < maxRetries) {
        // 重试机制
        setTimeout(() => {
          fetchStats(retryCount + 1);
        }, retryDelay * (retryCount + 1));
      } else {
        showFallbackStats();
      }
    }
  }

  // 显示备用统计数据
  function showFallbackStats() {
    updateSiteStats({ total_pv: "---", total_uv: "---" });
    updatePageStats({ page_pv: "---" });
  }

  // 更新站点统计
  function updateSiteStats(data) {
    // 站点总访问量
    updateElements(
      ["#busuanzi_site_pv", "#busuanzi_value_site_pv"],
      data.total_pv || 0
    );

    // 站点独立访客
    updateElements(
      ["#busuanzi_site_uv", "#busuanzi_value_site_uv"],
      data.total_uv || 0
    );

    // 显示统计容器
    showElements([
      "#busuanzi_container_site_pv",
      "#busuanzi_container_site_uv",
    ]);
  }

  // 更新页面统计
  function updatePageStats(data) {
    const pageViews = data.page_pv || 0;

    // 页面访问量
    updateElements(["#busuanzi_page_pv", "#busuanzi_value_page_pv"], pageViews);

    // 显示页面统计容器
    showElements(["#busuanzi_container_page_pv"]);

    // 如果是新文章（访问量为0），显示友好提示
    if (pageViews === 0) {
      // 可以显示"首次访问"或"新文章"等提示
      updateElements(
        ["#busuanzi_page_pv", "#busuanzi_value_page_pv"],
        "1" // 至少显示当前访问
      );
    }
  }

  // 更新元素内容
  function updateElements(selectors, value) {
    const updatedElements = new Set(); // 防止重复更新同一元素

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        if (el && !updatedElements.has(el)) {
          el.textContent = value;
          updatedElements.add(el);
        }
      });
    });
  }

  // 显示元素
  function showElements(selectors) {
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        if (el) {
          el.style.display = "";
          el.style.visibility = "visible";
        }
      });
    });
  }

  // 初始化函数
  function init() {
    // 先显示加载状态
    showLoadingState();

    // 记录访问
    recordVisit();

    // 延迟获取统计数据，给服务器处理时间
    setTimeout(() => {
      fetchStats();
    }, 300);

    statsLoaded = true;
  }

  // 显示加载状态
  function showLoadingState() {
    updateElements(["#busuanzi_page_pv", "#busuanzi_value_page_pv"], "...");
    updateElements(["#busuanzi_site_pv", "#busuanzi_value_site_pv"], "...");
    updateElements(["#busuanzi_site_uv", "#busuanzi_value_site_uv"], "...");
  }

  // 等待页面加载完成
  function waitForLoad() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      // 页面已加载，延迟一点时间确保所有元素都渲染完成
      setTimeout(init, 500);
    }
  }

  // PJAX 兼容性：监听 PJAX 页面切换事件
  document.addEventListener("pjax:complete", function () {
    // PJAX 切换完成后重新获取统计数据
    setTimeout(() => {
      visitRecorded = false; // 重置访问记录状态
      init();
    }, 100);
  });

  // 兼容其他可能的页面切换事件
  document.addEventListener("DOMContentLoaded", function () {
    if (!statsLoaded) {
      init();
    }
  });

  // 创建全局实例，支持 PJAX
  window.blogStatsInstance = {
    fetchStats: fetchStats,
    recordVisit: recordVisit,
    loaded: () => statsLoaded,
  };

  // 兼容原版busuanzi的全局变量和方法
  window.busuanzi = {
    fetch: fetchStats,
    record: recordVisit,
    loaded: () => statsLoaded,
  };

  // 启动初始化
  waitForLoad();
})();
