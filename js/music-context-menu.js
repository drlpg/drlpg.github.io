// 音乐播放器右键菜单功能
(function () {
  "use strict";

  let musicContextMenu = null;
  let currentAPlayer = null;
  let musicContextMenuHandler = null;

  // 检测当前页面是否为繁体
  function isTraditionalChinese() {
    const saved = btf?.saveToLocal?.get("translate-chn-cht");
    if (saved === "1") return true;
    if (saved === "2") return false;
    return document.documentElement.lang === "zh-TW";
  }

  // ========== 音乐列表弹窗功能 ==========

  // 显示所有歌曲弹窗
  function showAllSongsModal(aplayer) {
    if (!aplayer || !aplayer.list) return;

    const isTrad = isTraditionalChinese();
    const songs = aplayer.list.audios;
    const currentIndex = aplayer.list.index;

    const title = isTrad ? "所有歌曲" : "所有歌曲";

    const modalHTML = `
      <div class="music-modal-overlay" id="musicModalOverlay">
        <div class="music-modal">
          <div class="music-modal-header">
            <h3>${title}</h3>
            <button class="music-modal-close" id="musicModalClose">
              <i class="fa fa-times"></i>
            </button>
          </div>
          <div class="music-modal-body" id="musicModalBody">
            <!-- 歌曲将通过分批渲染插入 -->
          </div>
        </div>
      </div>
    `;

    // 移除已存在的弹窗
    document.getElementById("musicModalOverlay")?.remove();

    // 插入新弹窗
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // 添加样式（如果还没有添加）
    if (!document.getElementById("musicModalStyles")) {
      addModalStyles();
    }

    // 使用事件委托绑定事件
    bindModalEventsWithDelegation(aplayer);

    // 分批渲染歌曲列表
    renderSongsInBatches(songs, currentIndex, aplayer);
  }

  // 分批渲染歌曲列表
  function renderSongsInBatches(songs, currentIndex, aplayer) {
    const container = document.getElementById("musicModalBody");
    if (!container) return;

    const batchSize = 20; // 每批渲染20首
    let currentBatch = 0;

    function renderBatch() {
      const start = currentBatch * batchSize;
      const end = Math.min(start + batchSize, songs.length);

      if (start >= songs.length) return;

      const fragment = document.createDocumentFragment();

      for (let index = start; index < end; index++) {
        const song = songs[index];
        const isActive = index === currentIndex;
        const isPlaying = isActive && !aplayer.paused;

        const songItem = document.createElement("div");
        songItem.className = `song-item ${isActive ? "active" : ""}`;
        songItem.setAttribute("data-index", index);

        songItem.innerHTML = `
          <div class="song-cover">
            <img data-src="${song.cover || song.pic || ""}" alt="${
          song.name || song.title || ""
        }" class="lazy-load" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3E♪%3C/text%3E%3C/svg%3E'">
          </div>
          <div class="song-info">
            <div class="song-name">${
              song.name || song.title || "未知歌曲"
            }</div>
            <div class="song-artist">${
              song.artist || song.author || "未知歌手"
            }</div>
          </div>
          <div class="song-actions">
            <i class="fa ${isPlaying ? "fa-pause" : "fa-play"} play-pause-btn ${
          isActive ? "active-btn" : ""
        }" data-index="${index}"></i>
          </div>
        `;

        fragment.appendChild(songItem);
      }

      container.appendChild(fragment);

      // 懒加载图片
      lazyLoadImages(container);

      currentBatch++;

      // 使用 requestAnimationFrame 继续渲染下一批
      if (end < songs.length) {
        requestAnimationFrame(renderBatch);
      }
    }

    // 开始渲染
    renderBatch();
  }

  // 懒加载图片
  function lazyLoadImages(container) {
    const images = container.querySelectorAll("img.lazy-load");

    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const src = img.getAttribute("data-src");
              if (src) {
                img.src = src;
                img.classList.remove("lazy-load");
                observer.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: "50px", // 提前50px开始加载
        }
      );

      images.forEach((img) => imageObserver.observe(img));
    } else {
      // 降级方案：直接加载所有图片
      images.forEach((img) => {
        const src = img.getAttribute("data-src");
        if (src) {
          img.src = src;
          img.classList.remove("lazy-load");
        }
      });
    }
  }

  // 添加弹窗样式
  function addModalStyles() {
    const styles = `
      <style id="musicModalStyles">
        .music-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }
        .music-modal {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 22px;
          width: 32vw;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid #E3E8F7;
          animation: slideUp 0.3s ease;
          overflow: hidden;
        }
        [data-theme="dark"] .music-modal {
          background: rgba(30, 30, 30, 0.95);
          border-color: var(--anzhiyu-card-border);
        }
        [data-theme="dark"] .music-modal-close:hover {
          color: #ffffff;
        }
        [data-theme="dark"] .music-modal-body::-webkit-scrollbar-thumb:hover {
          background: #525252;
          background-clip: content-box;
        }
        [data-theme="dark"] .song-item.active {
          background: #3C3C3C;
        }
        [data-theme="dark"] .song-item:hover {
          background: #787878;
        }
        [data-theme="dark"] .song-item.active:hover {
          background: #787878;
        }
        @media (max-width: 1200px) {
          .music-modal {
            width: 50vw;
          }
        }
        @media (max-width: 768px) {
          .music-modal {
            width: 85vw;
            max-height: 80vh;
          }
        }
        .music-modal-header {
          padding: 20px;
          border-bottom: 1px dashed rgba(128, 128, 128, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .music-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--font-color);
        }
        .music-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--font-color);
          padding: 5px 10px;
          border-radius: 4px;
          transition: color 0.2s;
        }
        .music-modal-close:hover {
          color: #3D9DF2;
        }
        .music-modal-body {
          padding: 10px 0 10px 10px;
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
        }
        .music-modal-body::-webkit-scrollbar {
          width: 10px !important;
        }
        .music-modal-body::-webkit-scrollbar-track {
          background: transparent !important;
          margin: 8px 0;
        }
        .music-modal-body::-webkit-scrollbar-thumb {
          background: rgba(128, 128, 128, 0.3) !important;
          border-radius: 5px !important;
          border: 2px solid transparent !important;
          background-clip: content-box !important;
        }
        .music-modal-body::-webkit-scrollbar-thumb:hover {
          background: rgba(128, 128, 128, 0.5) !important;
          background-clip: content-box !important;
        }
        .song-item {
          display: flex;
          align-items: center;
          min-height: 50px;
          padding: 12px;
          margin-bottom: 6px;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
          will-change: background-color;
        }
        .song-item:hover {
          background: #3D9DF2;
        }
        .song-item:hover .song-name,
        .song-item:hover .song-artist {
          color: #fff;
        }
        .song-item.active {
          background: rgba(61, 157, 242, 0.2);
        }
        .song-item.active:hover {
          background: #3D9DF2;
        }
        .song-item.active:hover .song-name,
        .song-item.active:hover .song-artist {
          color: #fff;
        }
        .song-cover {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          margin-right: 12px;
          border: 1px solid #E3E8F7;
        }
        [data-theme="dark"] .song-cover {
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .song-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .song-cover img.lazy-load {
          background: #f0f0f0;
        }
        [data-theme="dark"] .song-cover img.lazy-load {
          background: #2a2a2a;
        }
        .song-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .song-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--font-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s;
          line-height: 1;
        }
        .song-artist {
          font-size: 12px;
          color: var(--font-color);
          opacity: 0.7;
          margin-top: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s;
          line-height: 1;
        }
        .song-actions {
          display: flex;
          align-items: center;
          margin-left: 10px;
          margin-right: 11px;
        }
        .play-pause-btn {
          color: #fff;
          font-size: 14px;
          opacity: 0;
          transition: all 0.2s;
          width: 32px;
          height: 32px;
          border: 1.5px solid #fff;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          flex-shrink: 0;
        }
        .play-pause-btn.active-btn {
          opacity: 1;
          color: var(--font-color);
          border-color: var(--font-color);
        }
        .song-item:hover .play-pause-btn {
          opacity: 1;
          color: #fff;
          border-color: #fff;
        }
        .play-pause-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;
    document.head.insertAdjacentHTML("beforeend", styles);
  }

  // 使用事件委托绑定弹窗事件（优化版）
  function bindModalEventsWithDelegation(aplayer) {
    const overlay = document.getElementById("musicModalOverlay");
    const closeBtn = document.getElementById("musicModalClose");
    const modalBody = document.getElementById("musicModalBody");

    if (!overlay || !closeBtn || !modalBody) return;

    // 关闭按钮
    closeBtn.addEventListener("click", () => overlay.remove());

    // 使用事件委托处理所有歌曲项的点击
    modalBody.addEventListener("click", function (e) {
      // 查找最近的歌曲项
      const songItem = e.target.closest(".song-item");
      if (!songItem) return;

      const index = parseInt(songItem.getAttribute("data-index"));

      // 如果点击的是播放/暂停按钮
      if (
        e.target.classList.contains("play-pause-btn") ||
        e.target.closest(".play-pause-btn")
      ) {
        e.stopPropagation();
        handlePlayPauseClick(index, aplayer, modalBody);
      } else {
        // 点击歌曲项，切换歌曲
        aplayer.list.switch(index);
        overlay.remove();
      }
    });
  }

  // 处理播放/暂停按钮点击
  function handlePlayPauseClick(index, aplayer, container) {
    const oldIndex = aplayer.list.index;

    if (index === oldIndex) {
      // 当前歌曲，切换播放/暂停
      aplayer.toggle();
      // 延迟更新图标
      setTimeout(() => {
        const btn = container.querySelector(
          `.play-pause-btn[data-index="${index}"]`
        );
        if (btn) {
          if (aplayer.paused) {
            btn.classList.remove("fa-pause");
            btn.classList.add("fa-play");
          } else {
            btn.classList.remove("fa-play");
            btn.classList.add("fa-pause");
          }
        }
      }, 50);
    } else {
      // 其他歌曲，切换并播放
      aplayer.list.switch(index);
      aplayer.play();

      // 更新所有按钮状态
      setTimeout(() => {
        const allBtns = container.querySelectorAll(".play-pause-btn");
        const allItems = container.querySelectorAll(".song-item");

        allBtns.forEach((btn) => {
          const btnIndex = parseInt(btn.getAttribute("data-index"));
          if (btnIndex === index) {
            btn.classList.remove("fa-play");
            btn.classList.add("fa-pause", "active-btn");
          } else {
            btn.classList.remove("fa-pause", "active-btn");
            btn.classList.add("fa-play");
          }
        });

        allItems.forEach((item) => {
          const itemIndex = parseInt(item.getAttribute("data-index"));
          if (itemIndex === index) {
            item.classList.add("active");
          } else {
            item.classList.remove("active");
          }
        });
      }, 50);
    }
  }

  // ========== 右键菜单功能 ==========

  // 获取当前播放的歌曲信息
  function getCurrentSongInfo() {
    if (!currentAPlayer) return null;

    const currentIndex = currentAPlayer.list.index;
    const currentSong = currentAPlayer.list.audios[currentIndex];

    return {
      title: currentSong?.name || "未知歌曲",
      artist: currentSong?.artist || "未知歌手",
    };
  }

  // 打开歌单页面
  function openPlaylistPage() {
    const metingElement = document.querySelector("#nav-music meting-js");
    if (!metingElement) return;

    const server = metingElement.getAttribute("server") || "netease";
    const id = metingElement.id || metingElement.getAttribute("id");

    if (!id) {
      console.warn("无法获取歌单ID");
      return;
    }

    // 根据不同平台构建跳转链接
    let url = "";
    switch (server) {
      case "netease":
        url = `https://music.163.com/#/playlist?id=${id}`;
        break;
      case "tencent":
      case "qq":
        url = `https://y.qq.com/n/ryqq/playlist/${id}`;
        break;
      case "kugou":
        url = `https://www.kugou.com/mixsong/${id}.html`;
        break;
      case "kuwo":
        url = `https://www.kuwo.cn/playlist_detail/${id}`;
        break;
      case "xiami":
        url = `https://www.xiami.com/collect/${id}`;
        break;
      default:
        console.warn(`不支持的音乐平台: ${server}`);
        return;
    }

    window.open(url, "_blank");
  }

  // 生成音乐播放器菜单内容（优化版）
  function generateMusicMenuContent() {
    const isTrad = isTraditionalChinese();
    const isPlaying = currentAPlayer && !currentAPlayer.paused;

    const texts = isTrad
      ? {
          playPause: isPlaying ? "暫停音樂" : "播放音樂",
          prev: "上一首",
          next: "下一首",
          copy: "複製歌名",
          viewAll: "查看所有歌曲",
          viewPlaylist: "查看歌單",
        }
      : {
          playPause: isPlaying ? "暂停音乐" : "播放音乐",
          prev: "上一首",
          next: "下一首",
          copy: "复制歌名",
          viewAll: "查看所有歌曲",
          viewPlaylist: "查看歌单",
        };

    return `
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-play-pause">
        <i class="fa ${isPlaying ? "fa-pause" : "fa-play"}"></i>
        <span>${texts.playPause}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-prev">
        <i class="fa fa-step-backward"></i>
        <span>${texts.prev}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-next">
        <i class="fa fa-step-forward"></i>
        <span>${texts.next}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-copy-name">
        <i class="fa fa-copy"></i>
        <span>${texts.copy}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-view-playlist">
        <i class="fa fa-music"></i>
        <span>${texts.viewPlaylist}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-view-all">
        <i class="fa fa-list"></i>
        <span>${texts.viewAll}</span>
      </a>
    `;
  }

  // 创建音乐右键菜单HTML（完全复制普通菜单结构）
  function createMusicContextMenu() {
    const isTrad = isTraditionalChinese();

    const navTitles = isTrad
      ? {
          back: "後退",
          forward: "前進",
          refresh: "刷新",
          up: "向上",
        }
      : {
          back: "后退",
          forward: "前进",
          refresh: "刷新",
          up: "向上",
        };

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

    // 创建独立的悬停提示框
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

  // 显示导航按钮提示（完全复制普通菜单逻辑）
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

  // 隐藏导航按钮提示（完全复制普通菜单逻辑）
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

  // 绑定音乐菜单事件（完全复制普通菜单逻辑）
  function bindMusicMenuEvents() {
    if (!musicContextMenu) return;

    // 绑定菜单项点击
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
        setTimeout(() => handleMusicMenuAction(action), 100);
      });
    });

    navButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const action = this.getAttribute("data-action");
        hideMusicContextMenu();
        setTimeout(() => handleNavAction(action), 100);
      });

      // 添加悬停提示事件
      button.addEventListener("mouseenter", function () {
        showMusicNavTooltip(this);
      });

      button.addEventListener("mouseleave", function () {
        hideMusicNavTooltip();
      });
    });
  }

  // 处理导航按钮动作
  function handleNavAction(action) {
    switch (action) {
      case "go-back":
        if (window.history.length > 1) window.history.back();
        break;
      case "go-forward":
        window.history.forward();
        break;
      case "refresh":
        window.location.reload();
        break;
      case "go-up":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
    }
  }

  // 处理音乐菜单动作（优化版）
  function handleMusicMenuAction(action) {
    if (!currentAPlayer) return;

    switch (action) {
      case "music-play-pause":
        currentAPlayer.toggle();
        break;
      case "music-prev":
        currentAPlayer.list?.switch(currentAPlayer.list.index - 1);
        break;
      case "music-next":
        currentAPlayer.list?.switch(currentAPlayer.list.index + 1);
        break;
      case "music-copy-name":
        const info = getCurrentSongInfo();
        if (info) {
          const text = `${info.title} - ${info.artist}`;
          navigator.clipboard?.writeText(text) || copyToClipboard(text);
          showMusicCopyNotification("复制歌曲名称成功");
        }
        break;
      case "music-view-all":
        showAllSongsModal(currentAPlayer);
        break;
      case "music-view-playlist":
        openPlaylistPage();
        break;
    }
  }

  // 显示音乐右键菜单
  function showMusicContextMenu(e) {
    if (!musicContextMenu || !currentAPlayer) {
      return;
    }

    // 阻止默认行为和事件传播，防止触发进度条跳转
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // 关闭所有菜单（包括普通右键菜单）
    hideMusicContextMenu();
    hideCustomContextMenu();
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

  // 隐藏音乐右键菜单
  function hideMusicContextMenu() {
    if (musicContextMenu) {
      musicContextMenu.classList.remove("show");
    }
    hideMusicNavTooltip();
  }

  // 隐藏普通右键菜单
  function hideCustomContextMenu() {
    const customMenu = document.getElementById("customContextMenu");
    if (customMenu) {
      customMenu.classList.remove("show");
    }
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("复制失败:", err);
      }
      document.body.removeChild(textArea);
    }
  }

  // 显示复制成功提示栏（使用自定义右键菜单的提示栏）
  function showMusicCopyNotification(message) {
    // 使用全局的复制成功提示栏函数
    if (typeof window.showCopySuccessNotification === "function") {
      window.showCopySuccessNotification(message);
    }
  }

  // 初始化音乐播放器右键菜单（优化版）
  function initMusicContextMenu() {
    if (!document.querySelector("#nav-music")) return;

    // 使用统一的播放器管理器
    if (window.musicPlayerManager) {
      window.musicPlayerManager.onReady((aplayer) => {
        setupMusicContextMenu(aplayer);
      });
    } else {
      // 后备方案
      setTimeout(initMusicContextMenu, 1000);
    }
  }

  // 设置音乐右键菜单（优化版）
  function setupMusicContextMenu(aplayer) {
    const musicElement = document.querySelector("#nav-music");
    if (!musicElement) return;

    currentAPlayer = aplayer;

    // 清理并创建菜单
    document.getElementById("musicContextMenu")?.remove();
    document.getElementById("musicNavTooltip")?.remove();
    createMusicContextMenu();

    // 清理旧监听器并绑定新的
    if (musicContextMenuHandler) {
      musicElement.removeEventListener("contextmenu", musicContextMenuHandler);
    }

    musicContextMenuHandler = (e) => {
      // 阻止所有默认行为和事件传播
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showMusicContextMenu(e);
      return false;
    };

    // 使用捕获阶段监听，优先级更高
    musicElement.addEventListener("contextmenu", musicContextMenuHandler, true);

    // 同时阻止 mousedown 和 mouseup 的右键事件，防止进度条响应
    musicElement.addEventListener(
      "mousedown",
      (e) => {
        if (e.button === 2) {
          // 右键
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      },
      true
    );

    musicElement.addEventListener(
      "mouseup",
      (e) => {
        if (e.button === 2) {
          // 右键
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      },
      true
    );

    // 全局点击隐藏
    if (!window.musicContextMenuClickHandler) {
      window.musicContextMenuClickHandler = (e) => {
        const menu = document.getElementById("musicContextMenu");
        const tooltip = document.getElementById("musicNavTooltip");
        if (
          menu &&
          !menu.contains(e.target) &&
          (!tooltip || !tooltip.contains(e.target))
        ) {
          hideMusicContextMenu();
        }
      };
      document.addEventListener("click", window.musicContextMenuClickHandler);
    }
  }

  // 启动初始化（优化版）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initMusicContextMenu, 500);
    });
  } else {
    setTimeout(initMusicContextMenu, 500);
  }
})();
