// 音乐播放器滚动隐藏功能（仅桌面端）
(function () {
  "use strict";

  // 检查是否为桌面端（宽度大于1200px）
  if (window.innerWidth <= 1200) return;

  let isPlayerHidden = true;
  let isInitialized = false;

  function handlePlayerScroll() {
    const player = document.querySelector("#nav-music");
    if (!player) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const distanceToBottom = documentHeight - (scrollTop + windowHeight);

    // 在顶部或距离底部小于等于100px时隐藏播放器
    if (scrollTop === 0 || distanceToBottom <= 100) {
      if (!isPlayerHidden) {
        player.style.left = "-100%";
        isPlayerHidden = true;
      }
    }
    // 其他情况显示播放器
    else {
      if (isPlayerHidden) {
        player.style.left = "20px";
        isPlayerHidden = false;
      }
    }
  }

  // 初始化播放器
  function initPlayerScrollHide() {
    const player = document.querySelector("#nav-music");
    if (player) {
      if (!isInitialized) {
        player.style.transition = "left 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)";
        player.style.willChange = "left";
        window.addEventListener("scroll", handlePlayerScroll, {
          passive: true,
        });
        isInitialized = true;
      }
      isPlayerHidden = true;
    } else {
      setTimeout(initPlayerScrollHide, 500);
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlayerScrollHide);
  } else {
    initPlayerScrollHide();
  }

  // PJAX 页面切换时重置状态
  document.addEventListener("pjax:complete", () => {
    isPlayerHidden = true;
  });
})();
