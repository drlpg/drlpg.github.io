// 音乐封面颜色提取器
class CoverColorExtractor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async extractDominantColor(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const maxSize = 150;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          
          this.canvas.width = img.width * scale;
          this.canvas.height = img.height * scale;
          
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          const dominantColor = this.analyzeDominantColor(imageData.data);
          
          resolve(dominantColor);
        } catch (error) {
          this.tryWithoutCORS(imageUrl).then(resolve).catch(() => {
            resolve(null);
          });
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(null);
      };
      
      const timeoutId = setTimeout(() => {
        resolve(null);
      }, 8000);
      
      img.src = imageUrl;
    });
  }

  analyzeDominantColor(data) {
    const colorMap = {};
    const darkColorMap = {};
    const step = 4;
    
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      if (alpha < 128) continue;
      
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      
      const quantizedR = Math.floor(r / 16) * 16;
      const quantizedG = Math.floor(g / 16) * 16;
      const quantizedB = Math.floor(b / 16) * 16;
      
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      
      colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
      
      if (brightness < 120) {
        darkColorMap[colorKey] = (darkColorMap[colorKey] || 0) + 1;
      }
    }
    
    let dominantColor = null;
    let maxCount = 0;
    
    for (const [color, count] of Object.entries(darkColorMap)) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color;
      }
    }
    
    if (!dominantColor || maxCount < 50) {
      maxCount = 0;
      
      for (const [color, count] of Object.entries(colorMap)) {
        const [r, g, b] = color.split(',').map(Number);
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        const score = count * (255 - brightness) / 255;
        
        if (score > maxCount) {
          maxCount = score;
          dominantColor = color;
        }
      }
    }
    
    if (dominantColor) {
      const [r, g, b] = dominantColor.split(',').map(Number);
      return this.rgbToHex(r, g, b);
    }
    
    return null;
  }

  // RGB转十六进制
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  async tryWithoutCORS(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const maxSize = 150;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          
          this.canvas.width = img.width * scale;
          this.canvas.height = img.height * scale;
          
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          const dominantColor = this.analyzeDominantColor(imageData.data);
          
          resolve(dominantColor);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageUrl;
    });
  }
}

// 创建颜色提取器实例
const colorExtractor = new CoverColorExtractor();

// 存储当前颜色，避免重复提取
let currentMusicColor = null;

// 应用颜色到播放器
function applyMusicColor(color) {
  currentMusicColor = color;
  
  const darkenedColor = darkenColor(color, 30);
  const gradient = `linear-gradient(135deg, ${darkenedColor}dd, ${darkenedColor}aa)`;
  
  document.documentElement.style.setProperty('--music-dynamic-background', gradient);
  updatePlayButtonColor(darkenedColor);
  
  const playingSelectors = ['#nav-music.playing .aplayer'];
  const pausedSelectors = ['#nav-music:not(.playing) .aplayer'];
  
  playingSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      element.style.setProperty('background', gradient, 'important');
    });
  });
  
  pausedSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      element.style.setProperty('background', '#ffffff', 'important');
    });
  });
  
  setTimeout(() => {
    playingSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.style.setProperty('background', gradient, 'important');
      });
    });
    
    pausedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.style.setProperty('background', '#ffffff', 'important');
      });
    });
    
    updatePlayButtonColor(darkenedColor);
  }, 100);
}

// 更新播放按钮颜色
function updatePlayButtonColor(color) {
  const rgb = hexToRgb(color);
  if (rgb) {
    const buttonBackground = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;
    
    const buttonElement = document.querySelector('#nav-music-hoverTips');
    if (buttonElement) {
      buttonElement.style.setProperty('background', buttonBackground, 'important');
    }
  }
}

// 十六进制转RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// RGB转十六进制
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 降低颜色亮度
function darkenColor(hex, percentage) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  // 计算降低亮度后的RGB值
  const factor = 1 - (percentage / 100);
  const newR = Math.round(rgb.r * factor);
  const newG = Math.round(rgb.g * factor);
  const newB = Math.round(rgb.b * factor);
  
  // 确保值在0-255范围内
  const clampedR = Math.max(0, Math.min(255, newR));
  const clampedG = Math.max(0, Math.min(255, newG));
  const clampedB = Math.max(0, Math.min(255, newB));
  
  return rgbToHex(clampedR, clampedG, clampedB);
}

// 从当前歌曲提取颜色
async function extractCurrentSongColor(aplayer) {
  try {
    if (!aplayer || !aplayer.list || !aplayer.list.audios || aplayer.list.audios.length === 0) {
      return null;
    }
    
    const currentIndex = aplayer.list.index || 0;
    const currentMusic = aplayer.list.audios[currentIndex];
    
    if (currentMusic && currentMusic.pic) {
      const dominantColor = await colorExtractor.extractDominantColor(currentMusic.pic);
      return dominantColor;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

// 初始化函数
function initSimpleMusicColor() {
  console.log('🚀 开始初始化封面颜色提取器...');
  
  // 查找APlayer
  const metingElement = document.querySelector('#nav-music meting-js');
  if (!metingElement) {
    console.log('⏳ 播放器元素未找到，1秒后重试...');
    setTimeout(initSimpleMusicColor, 1000);
    return;
  }
  
  // 检查APlayer实例
  if (!metingElement.aplayer) {
    console.log('⏳ APlayer实例未就绪，1秒后重试...');
    setTimeout(initSimpleMusicColor, 1000);
    return;
  }
  
  console.log('✅ APlayer实例已就绪');
  
  // 初始化歌曲跟踪变量
  window.lastProcessedSong = null;
  
  // 立即为当前歌曲提取颜色
  extractCurrentSongColor(metingElement.aplayer).then(color => {
    if (color) {
      applyMusicColor(color);
      // 记录当前处理的歌曲
      const currentMusic = metingElement.aplayer.list && metingElement.aplayer.list.audios 
        ? metingElement.aplayer.list.audios[metingElement.aplayer.list.index || 0] 
        : null;
      if (currentMusic && currentMusic.pic) {
        window.lastProcessedSong = currentMusic.pic;
      }
    } else {
      console.log('🔄 无法提取颜色，保持默认背景');
    }
  });
  
  // 绑定事件监听器（优化，减少对播放功能的干扰）
  try {
    // 只监听歌曲切换相关事件，避免干扰播放功能
    const songChangeEvents = ['loadstart', 'loadeddata'];
    
    songChangeEvents.forEach(eventName => {
      metingElement.aplayer.on(eventName, async function() {
        // 延迟处理，避免干扰播放器初始化
        setTimeout(async () => {
          console.log(`🎵 触发事件: ${eventName}`);
          
          // 检查是否真的切换了歌曲
          const currentIndex = this.list ? this.list.index : 0;
          const currentMusic = this.list && this.list.audios ? this.list.audios[currentIndex] : null;
          
          if (currentMusic && currentMusic.pic) {
            const songName = currentMusic.name || '未知歌曲';
            console.log(`🔄 检测到歌曲: ${songName}`);
            
            // 检查是否是新歌曲（避免重复提取）
            if (!window.lastProcessedSong || window.lastProcessedSong !== currentMusic.pic) {
              console.log('🎨 开始提取新歌曲封面颜色...');
              window.lastProcessedSong = currentMusic.pic;
              
              try {
                const color = await extractCurrentSongColor(this);
                if (color) {
                  applyMusicColor(color);
                } else {
                  console.log('🔄 无法提取颜色，保持当前背景');
                }
              } catch (error) {
                console.warn('🔄 颜色提取过程出错:', error);
              }
            } else {
              console.log('🔄 相同歌曲，跳过颜色提取');
            }
          }
        }, 100); // 延迟100ms处理
      });
    });
    
    // 监听播放事件
    metingElement.aplayer.on('play', function() {
      const songName = (this.list && this.list.audios && this.list.audios[this.list.index]) 
        ? this.list.audios[this.list.index].name 
        : '未知歌曲';
      console.log('▶️ 开始播放:', songName);
      
      // 播放时重新应用已保存的颜色
      if (currentMusicColor) {
        setTimeout(() => {
          applyMusicColor(currentMusicColor);
          console.log('🔄 播放状态下重新应用已保存的颜色:', currentMusicColor);
        }, 50);
      }
    });
    
    // 监听暂停事件
    metingElement.aplayer.on('pause', function() {
      console.log('⏸️ 暂停播放');
      
      // 暂停时重新应用已保存的颜色
      if (currentMusicColor) {
        setTimeout(() => {
          applyMusicColor(currentMusicColor);
          console.log('🔄 暂停状态下重新应用已保存的颜色:', currentMusicColor);
        }, 50);
      }
    });
    
    console.log('✅ 事件监听器绑定成功');
    
    // 添加定时检查机制作为备用方案（降低频率，减少干扰）
    setInterval(() => {
      try {
        // 只在播放器就绪且不在播放状态切换时检查
        if (!metingElement.aplayer || metingElement.aplayer.loading) {
          return;
        }
        
        const currentMusic = metingElement.aplayer.list && metingElement.aplayer.list.audios 
          ? metingElement.aplayer.list.audios[metingElement.aplayer.list.index || 0] 
          : null;
        
        if (currentMusic && currentMusic.pic && window.lastProcessedSong !== currentMusic.pic) {
          console.log('🔍 定时检查发现新歌曲:', currentMusic.name || '未知');
          window.lastProcessedSong = currentMusic.pic;
          
          // 异步处理，避免阻塞播放器
          setTimeout(async () => {
            try {
              const color = await extractCurrentSongColor(metingElement.aplayer);
              if (color) {
                applyMusicColor(color);
                console.log('🎨 定时检查成功更新颜色');
              }
            } catch (error) {
              console.warn('🔍 定时检查颜色提取失败:', error);
            }
          }, 0);
        }
      } catch (error) {
        console.warn('🔍 定时检查出错:', error);
      }
    }, 5000); // 每5秒检查一次，降低频率
    
    // 歌词点击功能已恢复 - 不再禁用
    // setTimeout(() => {
    //   disableLyricsClick();
    // }, 1000);
    
  } catch (error) {
    console.error('❌ 绑定事件监听器失败:', error);
  }
}

// 强制禁用歌词点击功能
function disableLyricsClick() {
  console.log('🚫 开始强制禁用歌词点击功能...');
  
  const lyricsSelectors = [
    '#nav-music .aplayer .aplayer-lrc',
    '#nav-music .aplayer.aplayer-withlrc .aplayer-lrc',
    '#nav-music.stretch .aplayer.aplayer-withlrc .aplayer-lrc'
  ];
  
  lyricsSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // 移除所有事件监听器
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
      
      // 添加事件阻止
      newElement.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚫 歌词点击被阻止');
        return false;
      }, true);
      
      newElement.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true);
      
      newElement.addEventListener('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true);
      
      // 禁用所有子元素的点击
      const childElements = newElement.querySelectorAll('*');
      childElements.forEach(child => {
        child.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('🚫 歌词子元素点击被阻止');
          return false;
        }, true);
      });
    });
  });
  
  console.log('✅ 歌词点击禁用完成');
  
  // 进度条控制功能已恢复 - 不再禁用
  // disableProgressBarControl();
  
  // 定期重新应用禁用功能已移除 - 恢复正常控制
  // setInterval(() => {
  //   const lrcElements = document.querySelectorAll('#nav-music .aplayer .aplayer-lrc p');
  //   lrcElements.forEach(p => {
  //     if (!p.hasAttribute('data-click-disabled')) {
  //       p.addEventListener('click', function(e) {
  //         e.preventDefault();
  //         e.stopPropagation();
  //         e.stopImmediatePropagation();
  //         console.log('🚫 动态歌词点击被阻止');
  //         return false;
  //       }, true);
  //       p.setAttribute('data-click-disabled', 'true');
  //     }
  //   });
  //   
  //   // 重新禁用进度条
  //   disableProgressBarControl();
  // }, 3000);
}

// 禁用进度条控制功能
function disableProgressBarControl() {
  console.log('🚫 开始禁用进度条控制...');
  
  const progressBarSelectors = [
    '#nav-music .aplayer .aplayer-info .aplayer-controller',
    '#nav-music .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap',
    '#nav-music .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar',
    '#nav-music .aplayer .aplayer-controller'
  ];
  
  progressBarSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // 禁用点击事件
      element.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚫 进度条点击被阻止');
        return false;
      }, true);
      
      // 禁用鼠标按下事件（拖动开始）
      element.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚫 进度条拖动被阻止');
        return false;
      }, true);
      
      // 禁用鼠标移动事件（拖动过程）
      element.addEventListener('mousemove', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true);
      
      // 禁用鼠标释放事件（拖动结束）
      element.addEventListener('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true);
      
      // 禁用触摸事件（移动端）
      element.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true);
      
      element.addEventListener('touchmove', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true);
      
      element.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true);
      
      // 标记已禁用
      element.setAttribute('data-progress-disabled', 'true');
    });
  });
  
  console.log('✅ 进度条控制禁用完成');
}

// 测试函数
window.testMusicColor = async function() {
  console.log('🧪 开始测试封面颜色提取功能...');
  
  const metingElement = document.querySelector('#nav-music meting-js');
  if (metingElement && metingElement.aplayer) {
    const color = await extractCurrentSongColor(metingElement.aplayer);
    if (color) {
      applyMusicColor(color);
      return color;
    } else {
      console.log('❌ 无法提取颜色');
      return null;
    }
  } else {
    console.log('❌ 播放器未就绪');
    return null;
  }
};

// 手动重新提取当前歌曲颜色
window.extractCurrentColor = async function() {
  console.log('🎨 手动重新提取当前歌曲封面颜色...');
  
  const metingElement = document.querySelector('#nav-music meting-js');
  if (metingElement && metingElement.aplayer) {
    const color = await extractCurrentSongColor(metingElement.aplayer);
    if (color) {
      applyMusicColor(color);
      return color;
    } else {
      console.log('❌ 无法提取颜色');
      return null;
    }
  } else {
    console.log('❌ 播放器未就绪');
    return null;
  }
};

// 测试指定图片的颜色提取
window.testImageColor = async function(imageUrl) {
  console.log('🖼️ 测试指定图片的颜色提取:', imageUrl);
  const color = await colorExtractor.extractDominantColor(imageUrl);
  applyMusicColor(color);
  return color;
};



// 检查播放器状态
window.checkPlayerStatus = function() {
  const metingElement = document.querySelector('#nav-music meting-js');
  if (metingElement && metingElement.aplayer) {
    console.log('✅ 播放器状态正常');
    console.log('📋 播放器信息:', {
      list: metingElement.aplayer.list,
      index: metingElement.aplayer.list?.index,
      currentSong: metingElement.aplayer.list?.audios?.[metingElement.aplayer.list?.index || 0],
      currentColor: currentMusicColor
    });
    return true;
  } else {
    console.log('❌ 播放器未就绪');
    return false;
  }
};

// 强制重新应用当前颜色
window.forceApplyCurrentColor = function() {
  if (currentMusicColor) {
    console.log('🔄 强制重新应用当前颜色:', currentMusicColor);
    applyMusicColor(currentMusicColor);
    return currentMusicColor;
  } else {
    console.log('⚠️ 没有保存的颜色');
    return null;
  }
};

// 测试播放按钮颜色更新
window.testButtonColor = function(color) {
  const testColor = color || '#ff6b6b';
  console.log('🧪 测试播放按钮颜色:', testColor);
  updatePlayButtonColor(testColor);
  return testColor;
};

// 测试深色调提取
window.testDarkColorExtraction = function(imageUrl) {
  const testUrl = imageUrl || 'https://example.com/cover.jpg';
  console.log('🧪 测试深色调提取:', testUrl);
  return colorExtractor.extractDominantColor(testUrl);
};

// 测试颜色亮度降低功能
window.testColorDarkening = function(color, percentage) {
  const testColor = color || '#ff6b6b';
  const testPercentage = percentage || 30;
  
  console.log('🧪 测试颜色亮度降低:');
  console.log('  原始颜色:', testColor);
  console.log('  降低百分比:', testPercentage + '%');
  
  const darkenedColor = darkenColor(testColor, testPercentage);
  console.log('  降低后颜色:', darkenedColor);
  
  // 应用测试颜色
  applyMusicColor(testColor);
  
  return {
    original: testColor,
    darkened: darkenedColor,
    percentage: testPercentage
  };
};

// 手动恢复歌词点击功能
window.forceEnableLyricsClick = function() {
  console.log('✅ 手动强制恢复歌词点击功能...');
  
  const lyricsSelectors = [
    '#nav-music .aplayer .aplayer-lrc',
    '#nav-music .aplayer.aplayer-withlrc .aplayer-lrc',
    '#nav-music.stretch .aplayer.aplayer-withlrc .aplayer-lrc'
  ];
  
  lyricsSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // 恢复样式
      element.style.setProperty('pointer-events', 'auto', 'important');
      element.style.setProperty('cursor', 'pointer', 'important');
      element.style.setProperty('user-select', 'text', 'important');
      
      // 移除禁用标记
      element.removeAttribute('data-click-disabled');
      
      // 恢复子元素
      const childElements = element.querySelectorAll('*');
      childElements.forEach(child => {
        child.style.setProperty('pointer-events', 'auto', 'important');
        child.style.setProperty('cursor', 'pointer', 'important');
        child.style.setProperty('user-select', 'text', 'important');
        child.removeAttribute('data-click-disabled');
      });
    });
  });
  
  console.log('✅ 歌词点击功能恢复完成');
  return '歌词点击功能已恢复';
};

// 手动恢复进度条控制功能
window.forceEnableProgressBar = function() {
  console.log('✅ 手动强制恢复进度条控制功能...');
  
  const progressBarSelectors = [
    '#nav-music .aplayer .aplayer-info .aplayer-controller',
    '#nav-music .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap',
    '#nav-music .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar',
    '#nav-music .aplayer .aplayer-controller'
  ];
  
  progressBarSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // 恢复样式
      element.style.setProperty('pointer-events', 'auto', 'important');
      element.style.setProperty('cursor', 'pointer', 'important');
      element.style.setProperty('user-select', 'auto', 'important');
      
      // 移除禁用标记
      element.removeAttribute('data-progress-disabled');
    });
  });
  
  console.log('✅ 进度条控制功能恢复完成');
  return '进度条控制功能已恢复';
};

// 检查歌词元素状态
window.checkLyricsElements = function() {
  console.log('🔍 检查歌词元素状态...');
  const lrcElements = document.querySelectorAll('#nav-music .aplayer .aplayer-lrc');
  const lrcPElements = document.querySelectorAll('#nav-music .aplayer .aplayer-lrc p');
  
  console.log('歌词容器元素数量:', lrcElements.length);
  console.log('歌词段落元素数量:', lrcPElements.length);
  
  lrcElements.forEach((element, index) => {
    console.log(`歌词容器 ${index + 1}:`, {
      pointerEvents: getComputedStyle(element).pointerEvents,
      cursor: getComputedStyle(element).cursor,
      userSelect: getComputedStyle(element).userSelect
    });
  });
  
  lrcPElements.forEach((element, index) => {
    console.log(`歌词段落 ${index + 1}:`, {
      pointerEvents: getComputedStyle(element).pointerEvents,
      cursor: getComputedStyle(element).cursor,
      userSelect: getComputedStyle(element).userSelect,
      hasDisabledAttr: element.hasAttribute('data-click-disabled')
    });
  });
  
  return {
    containers: lrcElements.length,
    paragraphs: lrcPElements.length
  };
};

// 检查进度条元素状态
window.checkProgressBarElements = function() {
  console.log('🔍 检查进度条元素状态...');
  const progressElements = document.querySelectorAll('#nav-music .aplayer .aplayer-controller');
  const barElements = document.querySelectorAll('#nav-music .aplayer .aplayer-bar-wrap');
  
  console.log('进度条控制器元素数量:', progressElements.length);
  console.log('进度条元素数量:', barElements.length);
  
  progressElements.forEach((element, index) => {
    console.log(`进度条控制器 ${index + 1}:`, {
      pointerEvents: getComputedStyle(element).pointerEvents,
      cursor: getComputedStyle(element).cursor,
      userSelect: getComputedStyle(element).userSelect,
      hasDisabledAttr: element.hasAttribute('data-progress-disabled')
    });
  });
  
  barElements.forEach((element, index) => {
    console.log(`进度条 ${index + 1}:`, {
      pointerEvents: getComputedStyle(element).pointerEvents,
      cursor: getComputedStyle(element).cursor,
      userSelect: getComputedStyle(element).userSelect,
      hasDisabledAttr: element.hasAttribute('data-progress-disabled')
    });
  });
  
  return {
    controllers: progressElements.length,
    bars: barElements.length
  };
};

// 手动检查歌曲切换
window.checkSongChange = function() {
  console.log('🔍 手动检查歌曲切换...');
  const metingElement = document.querySelector('#nav-music meting-js');
  if (metingElement && metingElement.aplayer) {
    const currentMusic = metingElement.aplayer.list && metingElement.aplayer.list.audios 
      ? metingElement.aplayer.list.audios[metingElement.aplayer.list.index || 0] 
      : null;
    
    console.log('当前歌曲信息:', currentMusic);
    console.log('上次处理的歌曲:', window.lastProcessedSong);
    
    if (currentMusic && currentMusic.pic) {
      if (window.lastProcessedSong !== currentMusic.pic) {
        console.log('🎨 发现新歌曲，开始提取颜色...');
        window.lastProcessedSong = currentMusic.pic;
        
        extractCurrentSongColor(metingElement.aplayer).then(color => {
          if (color) {
            applyMusicColor(color);
            console.log('✅ 手动检查成功更新颜色');
            return color;
          }
        });
      } else {
        console.log('🔄 相同歌曲，无需更新');
      }
    }
  } else {
    console.log('❌ 播放器未就绪');
  }
};

// 诊断播放器状态
window.diagnoseMusicPlayer = function() {
  console.log('🔧 开始诊断音乐播放器状态...');
  const metingElement = document.querySelector('#nav-music meting-js');
  
  if (!metingElement) {
    console.log('❌ 未找到播放器元素');
    return;
  }
  
  if (!metingElement.aplayer) {
    console.log('❌ APlayer实例不存在');
    return;
  }
  
  const aplayer = metingElement.aplayer;
  console.log('✅ APlayer实例存在');
  console.log('📋 播放器详细状态:');
  console.log('  - 是否暂停:', aplayer.paused);
  console.log('  - 当前时间:', aplayer.audio.currentTime);
  console.log('  - 总时长:', aplayer.audio.duration);
  console.log('  - 音频源:', aplayer.audio.src);
  console.log('  - 网络状态:', aplayer.audio.networkState);
  console.log('  - 就绪状态:', aplayer.audio.readyState);
  console.log('  - 是否加载中:', aplayer.loading);
  console.log('  - 播放列表:', aplayer.list);
  
  if (aplayer.list && aplayer.list.audios) {
    const currentMusic = aplayer.list.audios[aplayer.list.index || 0];
    console.log('  - 当前歌曲:', currentMusic);
    
    if (currentMusic) {
      console.log('  - 歌曲名称:', currentMusic.name);
      console.log('  - 歌曲URL:', currentMusic.url);
      console.log('  - 封面URL:', currentMusic.pic);
    }
  }
  
  return {
    element: metingElement,
    aplayer: aplayer,
    status: 'diagnosed'
  };
};

// 启动初始化
console.log('📋 DOM状态:', document.readyState);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成，开始初始化...');
    setTimeout(initSimpleMusicColor, 500);
  });
} else {
  console.log('📄 DOM已就绪，立即初始化...');
  setTimeout(initSimpleMusicColor, 500);
}

console.log('✅ 封面颜色提取器脚本加载完成（深色调优先，亮度降低30%，歌词和进度条控制已恢复）');
console.log('💡 可以在控制台运行以下命令测试:');
console.log('   testMusicColor() - 测试当前歌曲封面颜色提取');
console.log('   extractCurrentColor() - 重新提取当前歌曲颜色');
console.log('   testColorDarkening("#ff6b6b", 30) - 测试颜色亮度降低功能');
console.log('   checkSongChange() - 手动检查歌曲切换');
console.log('   checkLyricsElements() - 检查歌词元素状态');
console.log('   checkProgressBarElements() - 检查进度条元素状态');
console.log('   diagnoseMusicPlayer() - 诊断播放器状态');
console.log('   testDarkColorExtraction("图片URL") - 测试深色调提取');
console.log('   forceApplyCurrentColor() - 强制重新应用当前颜色');
console.log('   testButtonColor("#ff6b6b") - 测试播放按钮颜色更新');
console.log('   checkPlayerStatus() - 检查播放器状态');
console.log('   testImageColor("图片URL") - 测试指定图片的颜色提取');