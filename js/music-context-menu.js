// 音乐播放器右键菜单功能
(function () {
  "use strict";

  let musicContextMenu = null;
  let currentAPlayer = null;
  let musicContextMenuHandler = null;

  // 检测当前页面是否为繁体
  function isTraditionalChinese() {
    // 首先检查localStorage中的设置（最可靠的持久化状态）
    const savedEncoding = btf.saveToLocal.get("translate-chn-cht");
    if (savedEncoding === "1") {
      return true; // 繁体
    } else if (savedEncoding === "2") {
      return false; // 简体
    }

    // 检查HTML的lang属性
    const htmlLang = document.documentElement.lang;
    if (htmlLang === "zh-TW") {
      return true;
    } else if (htmlLang === "zh-CN") {
      return false;
    }

    // 检查繁简转换按钮的状态
    const translateButton = document.getElementById("translateLink");
    if (translateButton) {
      const buttonText = translateButton.textContent.trim();
      // 如果按钮显示"繁"，说明当前是简体，可以切换到繁体
      // 如果按钮显示"簡"或"简"，说明当前是繁体，可以切换到简体
      if (buttonText === "繁") {
        return false; // 当前是简体
      } else if (buttonText === "簡" || buttonText === "简") {
        return true; // 当前是繁体
      }
    }

    // 检查页面内容中的关键字符
    const testElements = [
      document.querySelector("h1"),
      document.querySelector(".post-title"),
      document.querySelector("#site-title"),
    ];

    for (let element of testElements) {
      if (element && element.textContent) {
        const text = element.textContent;
        if (
          /[個為國說時長來對會過還這裡頭樣讓從關門問題經驗學習實現應該種類別點內容標評論復製鏈接開關閉熱評深色模式轉繁體簡]/.test(
            text
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  // 获取当前播放的歌曲信息
  function getCurrentSongInfo() {
    if (!currentAPlayer) return null;

    const currentIndex = currentAPlayer.list.index;
    const currentSong = currentAPlayer.list.audios[currentIndex];

    return {
      title: currentSong?.name || "未知歌曲",
      artist: currentSong?.artist || "未知歌手",
      url: currentSong?.url || "",
      cover: currentSong?.cover || "",
      index: currentIndex,
      total: currentAPlayer.list.audios.length,
    };
  }

  // 生成音乐播放器菜单内容
  function generateMusicMenuContent() {
    const isTraditional = isTraditionalChinese();
    const songInfo = getCurrentSongInfo();
    const isPlaying = currentAPlayer && !currentAPlayer.paused;

    let menuTexts;
    if (isTraditional) {
      menuTexts = {
        playPause: isPlaying ? "暫停音樂" : "播放音樂",
        prevSong: "切換到上一首",
        nextSong: "切換到下一首",
        copySongName: "複製歌名",
        privacy: "隱私協議",
        copyright: "版權協議",
      };
    } else {
      menuTexts = {
        playPause: isPlaying ? "暂停音乐" : "播放音乐",
        prevSong: "切换到上一首",
        nextSong: "切换到下一首",
        copySongName: "复制歌名",
        privacy: "隐私协议",
        copyright: "版权协议",
      };
    }

    return `
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-play-pause">
        <i class="fa ${isPlaying ? "fa-pause" : "fa-play"}"></i>
        <span>${menuTexts.playPause}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-prev">
        <i class="fa fa-step-backward"></i>
        <span>${menuTexts.prevSong}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-next">
        <i class="fa fa-step-forward"></i>
        <span>${menuTexts.nextSong}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-copy-name">
        <i class="fa fa-copy"></i>
        <span>${menuTexts.copySongName}</span>
      </a>
      <div class="custom-context-menu-separator"></div>
      <a href="/privacy/" class="custom-context-menu-item" data-action="privacy">
        <i class="fa fa-user-secret"></i>
        <span>${menuTexts.privacy}</span>
      </a>
      <a href="/copyright/" class="custom-context-menu-item" data-action="copyright">
        <i class="fa fa-creative-commons"></i>
        <span>${menuTexts.copyright}</span>
      </a>
    `;
  }

  // 创建音乐右键菜单HTML
  function createMusicContextMenu() {
    const isTraditional = isTraditionalChinese();

    let navTitles;
    if (isTraditional) {
      navTitles = {
        back: "後退",
        forward: "前進",
        refresh: "刷新",
        up: "向上",
      };
    } else {
      navTitles = {
        back: "后退",
        forward: "前进",
        refresh: "刷新",
        up: "向上",
      };
    }

    const menuHTML = `
      <div class="custom-context-menu music-context-menu" id="musicContextMenu">
        <div class="context-menu-nav-buttons">
          <button class="context-menu-nav-button" data-action="go-back" data-tooltip="${navTitles.back}">
            <i class="fa fa-arrow-left"></i>
          </button>
          <button class="context-menu-nav-button" data-action="go-forward" data-tooltip="${navTitles.forward}">
            <i class="fa fa-arrow-right"></i>
          </button>
          <button class="context-menu-nav-button" data-action="refresh" data-tooltip="${navTitles.refresh}">
            <i class="fa fa-refresh"></i>
          </button>
          <button class="context-menu-nav-button" data-action="go-up" data-tooltip="${navTitles.up}">
            <i class="fa fa-arrow-up"></i>
          </button>
        </div>
        <div class="context-menu-content" id="musicContextMenuContent">
          <!-- 动态内容将在这里插入 -->
        </div>
      </div>
    `;

    // 创建独立的悬停提示框 - 与普通右键菜单保持一致
    const tooltipHTML = `<div class="nav-button-tooltip" id="musicNavTooltip"></div>`;

    document.body.insertAdjacentHTML("beforeend", menuHTML);
    document.body.insertAdjacentHTML("beforeend", tooltipHTML);
    musicContextMenu = document.getElementById("musicContextMenu");
  }

  // 更新音乐菜单内容
  function updateMusicMenuContent() {
    const contentContainer = document.getElementById("musicContextMenuContent");
    if (!contentContainer) return;

    contentContainer.innerHTML = generateMusicMenuContent();
    bindMusicMenuEvents();
  }

  // 绑定音乐菜单事件
  function bindMusicMenuEvents() {
    if (!musicContextMenu) return;

    const menuItems = musicContextMenu.querySelectorAll(
      ".custom-context-menu-item"
    );
    const navButtons = musicContextMenu.querySelectorAll(
      ".context-menu-nav-button"
    );

    menuItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const action = this.getAttribute("data-action");

        hideMusicContextMenu();

        setTimeout(() => {
          handleMusicMenuAction(action);
        }, 100);
      });
    });

    navButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const action = this.getAttribute("data-action");

        hideMusicContextMenu();

        setTimeout(() => {
          handleMusicNavAction(action);
        }, 100);
      });

      // 添加悬停提示事件
      button.addEventListener("mouseenter", function (e) {
        showMusicNavTooltip(this);
      });

      button.addEventListener("mouseleave", function (e) {
        hideMusicNavTooltip();
      });
    });
  }

  // 处理音乐菜单动作
  function handleMusicMenuAction(action) {
    switch (action) {
      case "music-play-pause":
        if (currentAPlayer) {
          currentAPlayer.toggle();
        }
        break;

      case "music-prev":
        if (currentAPlayer && currentAPlayer.list) {
          currentAPlayer.list.switch(currentAPlayer.list.index - 1);
        }
        break;

      case "music-next":
        if (currentAPlayer && currentAPlayer.list) {
          currentAPlayer.list.switch(currentAPlayer.list.index + 1);
        }
        break;

      case "music-copy-name":
        const songInfo = getCurrentSongInfo();
        if (songInfo) {
          const songText = `${songInfo.title} - ${songInfo.artist}`;
          copyToClipboard(songText);
          showMusicCopyNotification(`已复制歌名: ${songText}`);
        } else {
          showMusicNotification("无法获取歌曲信息");
        }
        break;

      case "privacy":
        window.location.href = "/privacy/";
        break;

      case "copyright":
        window.location.href = "/copyright/";
        break;
    }
  }

  // 处理音乐导航按钮动作
  function handleMusicNavAction(action) {
    switch (action) {
      case "go-back":
        if (window.history.length > 1) {
          window.history.back();
        } else {
          showMusicNotification("没有可返回的页面");
        }
        break;
      case "go-forward":
        window.history.forward();
        break;
      case "refresh":
        window.location.reload();
        break;
      case "go-up":
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        break;
    }
  }

  // 显示音乐导航提示 - 与普通右键菜单保持一致
  function showMusicNavTooltip(button) {
    const tooltip = document.getElementById("musicNavTooltip");
    if (!tooltip) return;

    const tooltipText = button.getAttribute("data-tooltip");
    if (!tooltipText) return;

    tooltip.textContent = tooltipText;

    // 计算按钮的屏幕位置
    const buttonRect = button.getBoundingClientRect();

    // 获取菜单容器位置
    const menuRect = musicContextMenu.getBoundingClientRect();

    // 设置提示框内容以计算其尺寸
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "1";
    tooltip.classList.add("show");

    // 获取提示框尺寸
    const tooltipRect = tooltip.getBoundingClientRect();

    // 计算提示框位置：按钮上方，水平居中，与菜单保持3px间距
    const left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
    const top = menuRect.top - tooltipRect.height - 3; // 3px间距

    // 设置位置
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    // 显示提示框
    tooltip.style.visibility = "visible";
  }

  // 隐藏音乐导航提示 - 与普通右键菜单保持一致
  function hideMusicNavTooltip() {
    const tooltip = document.getElementById("musicNavTooltip");
    if (tooltip) {
      tooltip.classList.remove("show");
      // 重置所有内联样式
      tooltip.style.visibility = "hidden";
      tooltip.style.opacity = "0";
      tooltip.style.left = "";
      tooltip.style.top = "";
    }
  }

  // 显示音乐右键菜单
  function showMusicContextMenu(e) {
    if (!musicContextMenu || !currentAPlayer) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    hideAllMusicContextMenus();
    updateMusicMenuContent();

    musicContextMenu.style.visibility = "hidden";
    musicContextMenu.style.display = "block";

    const menuRect = musicContextMenu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;

    musicContextMenu.style.display = "";
    musicContextMenu.style.visibility = "visible";

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    if (y < 10) {
      y = 10;
    }

    musicContextMenu.style.left = x + "px";
    musicContextMenu.style.top = y + "px";
    musicContextMenu.classList.add("show");
  }

  // 隐藏所有右键菜单
  function hideAllMusicContextMenus() {
    // 隐藏音乐播放器右键菜单
    const musicMenu = document.getElementById("musicContextMenu");
    if (musicMenu) {
      musicMenu.classList.remove("show");
    }

    // 隐藏自定义右键菜单
    const customMenu = document.getElementById("customContextMenu");
    if (customMenu) {
      customMenu.classList.remove("show");
    }
  }

  // 隐藏音乐右键菜单
  function hideMusicContextMenu() {
    if (musicContextMenu) {
      musicContextMenu.classList.remove("show");
    }
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  // 显示音乐通知
  function showMusicNotification(message) {
    try {
      if (
        typeof btf !== "undefined" &&
        btf.snackbarShow &&
        typeof GLOBAL_CONFIG !== "undefined" &&
        GLOBAL_CONFIG.Snackbar
      ) {
        btf.snackbarShow(message);
      } else if (typeof Swal !== "undefined") {
        Swal.fire({
          title: message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // 静默处理，不输出日志
      }
    } catch (error) {
      // 静默处理错误
    }
  }

  // 显示音乐复制成功提示
  function showMusicCopyNotification(message) {
    // 移除已存在的提示栏
    const existingNotification = document.querySelector(
      ".music-copy-success-notification"
    );
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建新的提示栏
    const notification = document.createElement("div");
    notification.className =
      "copy-success-notification music-copy-success-notification";
    notification.innerHTML = `
      <span>${message}</span>
      <div class="progress-bar"></div>
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // 3秒后隐藏并移除
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 清理重复的音乐元素
  function cleanupDuplicateMusicElements() {
    const musicElements = document.querySelectorAll("#nav-music");
    if (musicElements.length > 1) {
      // 保留第一个，移除其他的
      for (let i = 1; i < musicElements.length; i++) {
        musicElements[i].remove();
      }
    }
  }

  // 初始化音乐播放器右键菜单
  function initMusicContextMenu() {
    // 首先清理可能存在的重复元素
    cleanupDuplicateMusicElements();

    // 检查音乐元素是否存在
    const musicElement = document.querySelector("#nav-music");
    if (!musicElement) {
      return;
    }

    // 使用统一的播放器管理器
    if (window.musicPlayerManager) {
      window.musicPlayerManager.onReady((aplayer, metingElement) => {
        setupMusicContextMenu(aplayer, metingElement);
      });
      return;
    }

    // 后备方案：直接检查
    const metingElement = document.querySelector("#nav-music meting-js");

    if (!metingElement) {
      setTimeout(initMusicContextMenu, 1000);
      return;
    }

    if (!metingElement.aplayer) {
      setTimeout(initMusicContextMenu, 1000);
      return;
    }

    setupMusicContextMenu(metingElement.aplayer, metingElement);
  }

  // 设置音乐右键菜单
  function setupMusicContextMenu(aplayer, metingElement) {
    const musicElement = document.querySelector("#nav-music");
    if (!musicElement) {
      return;
    }

    currentAPlayer = aplayer;

    // 清理旧的菜单
    const oldMenu = document.getElementById("musicContextMenu");
    if (oldMenu) {
      oldMenu.remove();
    }

    // 创建新菜单
    createMusicContextMenu();

    // 清理旧的事件监听器
    if (musicContextMenuHandler) {
      musicElement.removeEventListener("contextmenu", musicContextMenuHandler);
    }

    // 创建新的事件处理器
    musicContextMenuHandler = function (e) {
      e.preventDefault();
      e.stopPropagation();
      showMusicContextMenu(e);
    };

    // 绑定右键菜单事件
    musicElement.addEventListener("contextmenu", musicContextMenuHandler);

    // 绑定全局点击隐藏事件（使用命名函数避免重复绑定）
    if (!window.musicContextMenuClickHandler) {
      window.musicContextMenuClickHandler = function (e) {
        const menu = document.getElementById("musicContextMenu");
        if (menu && !menu.contains(e.target)) {
          hideMusicContextMenu();
        }
      };
      document.addEventListener("click", window.musicContextMenuClickHandler);
    }
  }

  // 页面加载完成后初始化
  function startInitialization() {
    // 多次尝试初始化，确保成功
    let attempts = 0;
    const maxAttempts = 10;

    function tryInit() {
      attempts++;

      const musicElement = document.querySelector("#nav-music");
      if (musicElement) {
        initMusicContextMenu();
      } else if (attempts < maxAttempts) {
        setTimeout(tryInit, 1000);
      }
    }

    tryInit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(startInitialization, 500);
    });
  } else {
    setTimeout(startInitialization, 500);
  }

  // PJAX支持 - 页面切换后重新初始化
  if (typeof btf !== "undefined" && btf.addGlobalFn) {
    // 页面切换前清理
    btf.addGlobalFn(
      "pjaxSend",
      function () {
        // 隐藏菜单但不移除（避免过度清理）
        const existingMenu = document.getElementById("musicContextMenu");
        if (existingMenu) {
          existingMenu.classList.remove("show");
        }

        // 清理全局点击事件监听器
        if (window.musicContextMenuClickHandler) {
          document.removeEventListener(
            "click",
            window.musicContextMenuClickHandler
          );
          window.musicContextMenuClickHandler = null;
        }

        // 清理音乐元素的右键菜单事件监听器
        const musicElement = document.querySelector("#nav-music");
        if (musicElement && musicContextMenuHandler) {
          musicElement.removeEventListener(
            "contextmenu",
            musicContextMenuHandler
          );
        }

        // 重置状态
        musicContextMenu = null;
        currentAPlayer = null;
        musicContextMenuHandler = null;
      },
      "musicContextMenuCleanup"
    );

    // 页面切换后重新初始化
    btf.addGlobalFn(
      "pjaxComplete",
      function () {
        // 延迟初始化，确保新页面元素已加载
        setTimeout(() => {
          // 先清理可能的重复元素
          cleanupDuplicateMusicElements();
          initMusicContextMenu();
        }, 1500); // 增加延迟时间
      },
      "musicContextMenu"
    );
  }
})();
