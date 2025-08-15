// 音乐播放器自动收缩修复脚本
function fixMusicPlayerAutoCollapse() {
  const musicElement = document.querySelector('#nav-music');
  const metingElement = document.querySelector('#nav-music meting-js');
  
  if (!musicElement || !metingElement) {
    setTimeout(fixMusicPlayerAutoCollapse, 1000);
    return;
  }
  
  if (!metingElement.aplayer) {
    setTimeout(fixMusicPlayerAutoCollapse, 1000);
    return;
  }
  
  const aplayer = metingElement.aplayer;
  
  aplayer.on('play', function() {
    musicElement.classList.add('playing');
    
    if (!musicElement.classList.contains('stretch')) {
      musicElement.classList.add('stretch');
    }
    
    if (typeof anzhiyu_musicPlaying !== 'undefined') {
      anzhiyu_musicPlaying = true;
    }
    
    const hoverTips = document.getElementById('nav-music-hoverTips');
    if (hoverTips) {
      hoverTips.innerHTML = '<i class="fa-solid fa-pause music-icon-large"></i>';
      hoverTips.title = '暂停';
    }
  });
  
  aplayer.on('pause', function() {
    musicElement.classList.remove('playing');
    
    if (musicElement.classList.contains('stretch')) {
      musicElement.classList.remove('stretch');
    }
    
    if (typeof anzhiyu_musicPlaying !== 'undefined') {
      anzhiyu_musicPlaying = false;
    }
    
    const hoverTips = document.getElementById('nav-music-hoverTips');
    if (hoverTips) {
      hoverTips.innerHTML = '<i class="fa-solid fa-play music-icon-large"></i>';
      hoverTips.title = '播放';
    }
  });
  
  aplayer.on('ended', function() {
    musicElement.classList.remove('playing');
    
    if (musicElement.classList.contains('stretch')) {
      musicElement.classList.remove('stretch');
    }
    
    if (typeof anzhiyu_musicPlaying !== 'undefined') {
      anzhiyu_musicPlaying = false;
    }
    
    const hoverTips = document.getElementById('nav-music-hoverTips');
    if (hoverTips) {
      hoverTips.innerHTML = '<i class="fa-solid fa-play music-icon-large"></i>';
      hoverTips.title = '播放';
    }
  });
  
  aplayer.on('loadstart', function() {
    if (!aplayer.paused) {
      if (!musicElement.classList.contains('stretch')) {
        musicElement.classList.add('stretch');
      }
    }
  });
  
  // 状态同步检查
  setInterval(() => {
    const isActuallyPlaying = !aplayer.paused;
    const hasPlayingClass = musicElement.classList.contains('playing');
    const hasStretchClass = musicElement.classList.contains('stretch');
    
    if (isActuallyPlaying && !hasPlayingClass) {
      musicElement.classList.add('playing');
      if (!hasStretchClass) {
        musicElement.classList.add('stretch');
      }
      
      if (typeof anzhiyu_musicPlaying !== 'undefined') {
        anzhiyu_musicPlaying = true;
      }
    } else if (!isActuallyPlaying && hasPlayingClass) {
      musicElement.classList.remove('playing');
      if (hasStretchClass) {
        musicElement.classList.remove('stretch');
      }
      
      if (typeof anzhiyu_musicPlaying !== 'undefined') {
        anzhiyu_musicPlaying = false;
      }
    }
  }, 2000);
}

// 全局控制函数
window.forceCollapseMusicPlayer = function() {
  const musicElement = document.querySelector('#nav-music');
  if (musicElement) {
    musicElement.classList.remove('stretch');
    return '播放器已收缩';
  } else {
    return '播放器元素未找到';
  }
};

window.forceExpandMusicPlayer = function() {
  const musicElement = document.querySelector('#nav-music');
  if (musicElement) {
    musicElement.classList.add('stretch');
    return '播放器已展开';
  } else {
    return '播放器元素未找到';
  }
};

window.checkMusicPlayerStatus = function() {
  const musicElement = document.querySelector('#nav-music');
  const metingElement = document.querySelector('#nav-music meting-js');
  
  if (!musicElement || !metingElement || !metingElement.aplayer) {
    return { ready: false };
  }
  
  const aplayer = metingElement.aplayer;
  const status = {
    ready: true,
    isPlaying: !aplayer.paused,
    hasPlayingClass: musicElement.classList.contains('playing'),
    hasStretchClass: musicElement.classList.contains('stretch'),
    currentTime: aplayer.audio.currentTime,
    duration: aplayer.audio.duration,
    globalVariable: typeof anzhiyu_musicPlaying !== 'undefined' ? anzhiyu_musicPlaying : 'undefined'
  };
  
  return status;
};

window.fixMusicPlayerState = function() {
  const musicElement = document.querySelector('#nav-music');
  const metingElement = document.querySelector('#nav-music meting-js');
  
  if (!musicElement || !metingElement || !metingElement.aplayer) {
    return '播放器未就绪';
  }
  
  const aplayer = metingElement.aplayer;
  const isActuallyPlaying = !aplayer.paused;
  
  if (isActuallyPlaying) {
    musicElement.classList.add('playing');
    musicElement.classList.add('stretch');
    if (typeof anzhiyu_musicPlaying !== 'undefined') {
      anzhiyu_musicPlaying = true;
    }
    return '已修复为播放状态';
  } else {
    musicElement.classList.remove('playing');
    musicElement.classList.remove('stretch');
    if (typeof anzhiyu_musicPlaying !== 'undefined') {
      anzhiyu_musicPlaying = false;
    }
    return '已修复为暂停状态';
  }
};

function initMusicPlayerAutoCollapse() {
  setTimeout(fixMusicPlayerAutoCollapse, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initMusicPlayerAutoCollapse();
  });
} else {
  initMusicPlayerAutoCollapse();
}