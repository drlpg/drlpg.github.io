// 音乐播放器右键菜单功能
(function() {
  'use strict';



  let musicContextMenu = null;
  let currentAPlayer = null;

  // 检测当前页面是否为繁体
  function isTraditionalChinese() {
    const translateButton = document.getElementById('translateLink');
    if (translateButton) {
      const buttonText = translateButton.textContent.trim();
      if (buttonText === '繁') {
        return false; // 当前是简体
      } else if (buttonText === '簡' || buttonText === '简') {
        return true; // 当前是繁体
      }
    }
    
    // 检查页面内容中的关键字符
    const testElements = [
      document.querySelector('h1'),
      document.querySelector('.post-title'),
      document.querySelector('#site-title')
    ];
    
    for (let element of testElements) {
      if (element && element.textContent) {
        const text = element.textContent;
        if (/[個為國說時長來對會過還這裡頭樣讓從關門問題經驗學習實現應該種類別點內容標評論復製鏈接開關閉熱評深色模式轉繁體簡]/.test(text)) {
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
      title: currentSong?.name || '未知歌曲',
      artist: currentSong?.artist || '未知歌手',
      url: currentSong?.url || '',
      cover: currentSong?.cover || '',
      index: currentIndex,
      total: currentAPlayer.list.audios.length
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
        playPause: isPlaying ? '暫停音樂' : '播放音樂',
        prevSong: '切換到上一首',
        nextSong: '切換到下一首',
        copySongName: '複製歌名',
        privacy: '隱私協議',
        copyright: '版權協議'
      };
    } else {
      menuTexts = {
        playPause: isPlaying ? '暂停音乐' : '播放音乐',
        prevSong: '切换到上一首',
        nextSong: '切换到下一首',
        copySongName: '复制歌名',
        privacy: '隐私协议',
        copyright: '版权协议'
      };
    }
    
    return `
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="music-play-pause">
        <i class="fa ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
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
        back: '後退',
        forward: '前進',
        refresh: '刷新',
        up: '向上'
      };
    } else {
      navTitles = {
        back: '后退',
        forward: '前进',
        refresh: '刷新',
        up: '向上'
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
    
    // 创建独立的悬停提示框
    const tooltipHTML = `<div class="nav-button-tooltip" id="musicNavTooltip"></div>`;
    
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    document.body.insertAdjacentHTML('beforeend', tooltipHTML);
    musicContextMenu = document.getElementById('musicContextMenu');
  }

  // 更新音乐菜单内容
  function updateMusicMenuContent() {
    const contentContainer = document.getElementById('musicContextMenuContent');
    if (!contentContainer) return;

    contentContainer.innerHTML = generateMusicMenuContent();
    bindMusicMenuEvents();
  }

  // 绑定音乐菜单事件
  function bindMusicMenuEvents() {
    if (!musicContextMenu) return;
    
    const menuItems = musicContextMenu.querySelectorAll('.custom-context-menu-item');
    const navButtons = musicContextMenu.querySelectorAll('.context-menu-nav-button');
    
    menuItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const action = this.getAttribute('data-action');
        
        hideMusicContextMenu();
        
        setTimeout(() => {
          handleMusicMenuAction(action);
        }, 100);
      });
    });

    navButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const action = this.getAttribute('data-action');
        
        hideMusicContextMenu();
        
        setTimeout(() => {
          handleMusicNavAction(action);
        }, 100);
      });

      // 添加悬停提示事件
      button.addEventListener('mouseenter', function(e) {
        showMusicNavTooltip(this);
      });

      button.addEventListener('mouseleave', function(e) {
        hideMusicNavTooltip();
      });
    });
  }

  // 处理音乐菜单动作
  function handleMusicMenuAction(action) {
    switch(action) {
      case 'music-play-pause':
        if (currentAPlayer) {
          if (currentAPlayer.paused) {
            currentAPlayer.play();
          } else {
            currentAPlayer.pause();
          }
        }
        break;
        
      case 'music-prev':
        if (currentAPlayer && currentAPlayer.list) {
          currentAPlayer.list.switch(currentAPlayer.list.index - 1);
        }
        break;
        
      case 'music-next':
        if (currentAPlayer && currentAPlayer.list) {
          currentAPlayer.list.switch(currentAPlayer.list.index + 1);
        }
        break;
        
      case 'music-copy-name':
        const songInfo = getCurrentSongInfo();
        if (songInfo) {
          const songText = `${songInfo.title} - ${songInfo.artist}`;
          copyToClipboard(songText);
          showMusicCopyNotification(`已复制歌名: ${songText}`);
        } else {
          showMusicNotification('无法获取歌曲信息');
        }
        break;
        
      case 'privacy':
        window.location.href = '/privacy/';
        break;
        
      case 'copyright':
        window.location.href = '/copyright/';
        break;
    }
  }

  // 处理音乐导航按钮动作
  function handleMusicNavAction(action) {
    switch(action) {
      case 'go-back':
        if (window.history.length > 1) {
          window.history.back();
        } else {
          showMusicNotification('没有可返回的页面');
        }
        break;
      case 'go-forward':
        window.history.forward();
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'go-up':
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        break;
    }
  }

  // 显示音乐导航提示
  function showMusicNavTooltip(button) {
    const tooltip = document.getElementById('musicNavTooltip');
    if (!tooltip) return;
    
    const tooltipText = button.getAttribute('data-tooltip');
    tooltip.textContent = tooltipText;
    
    const rect = button.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    tooltip.classList.add('show');
  }

  // 隐藏音乐导航提示
  function hideMusicNavTooltip() {
    const tooltip = document.getElementById('musicNavTooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
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
    
    musicContextMenu.style.visibility = 'hidden';
    musicContextMenu.style.display = 'block';
    
    const menuRect = musicContextMenu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;
    
    musicContextMenu.style.display = '';
    musicContextMenu.style.visibility = 'visible';
    
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
    
    musicContextMenu.style.left = x + 'px';
    musicContextMenu.style.top = y + 'px';
    musicContextMenu.classList.add('show');
  }

  // 隐藏所有右键菜单
  function hideAllMusicContextMenus() {
    // 隐藏音乐播放器右键菜单
    const musicMenu = document.getElementById('musicContextMenu');
    if (musicMenu) {
      musicMenu.classList.remove('show');
    }
    
    // 隐藏自定义右键菜单
    const customMenu = document.getElementById('customContextMenu');
    if (customMenu) {
      customMenu.classList.remove('show');
    }
  }

  // 隐藏音乐右键菜单
  function hideMusicContextMenu() {
    if (musicContextMenu) {
      musicContextMenu.classList.remove('show');
    }
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  // 显示音乐通知
  function showMusicNotification(message) {
    try {
      if (typeof btf !== 'undefined' && btf.snackbarShow && typeof GLOBAL_CONFIG !== 'undefined' && GLOBAL_CONFIG.Snackbar) {
        btf.snackbarShow(message);
      } else if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: message,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        console.log('🎵 音乐播放器:', message);
      }
    } catch (error) {
      console.log('🎵 音乐播放器:', message);
    }
  }

  // 显示音乐复制成功提示
  function showMusicCopyNotification(message) {
    // 移除已存在的提示栏
    const existingNotification = document.querySelector('.music-copy-success-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建新的提示栏
    const notification = document.createElement('div');
    notification.className = 'copy-success-notification music-copy-success-notification';
    notification.innerHTML = `
      <span>${message}</span>
      <div class="progress-bar"></div>
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // 3秒后隐藏并移除
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 初始化音乐播放器右键菜单
  function initMusicContextMenu() {
    const musicElement = document.querySelector('#nav-music');
    const metingElement = document.querySelector('#nav-music meting-js');
    
    if (!musicElement) {
      setTimeout(initMusicContextMenu, 1000);
      return;
    }
    
    if (!metingElement) {
      setTimeout(initMusicContextMenu, 1000);
      return;
    }
    
    if (!metingElement.aplayer) {
      setTimeout(initMusicContextMenu, 1000);
      return;
    }
    
    currentAPlayer = metingElement.aplayer;
    
    if (!musicContextMenu) {
      createMusicContextMenu();
    }
    
    musicElement.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      showMusicContextMenu(e);
    });
    
    document.addEventListener('click', function(e) {
      if (musicContextMenu && !musicContextMenu.contains(e.target)) {
        hideMusicContextMenu();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initMusicContextMenu, 1000);
    });
  } else {
    setTimeout(initMusicContextMenu, 1000);
  }

})();