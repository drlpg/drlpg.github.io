// 音乐播放器统一管理器 - 整合所有播放器功能
(function () {
  "use strict";

  // 防止重复初始化
  if (window.musicPlayerUnifiedInitialized) return;
  window.musicPlayerUnifiedInitialized = true;

  // ==================== 播放器状态管理 ====================
  const playerState = {
    isReady: false,
    instance: null,
    element: null,
    readyCallbacks: [],
    initAttempts: 0,
    maxAttempts: 60,
    checkInterval: 1000,
  };

  // ==================== 自动跳过配置 ====================
  // 预设配置方案
  const skipPresets = {
    fast: {
      loadTimeout: 5000,
      playTimeout: 3000,
      maxRetries: 1,
      errorRetryDelay: 1000,
      skipDelay: 500,
    },
    standard: {
      loadTimeout: 10000,
      playTimeout: 5000,
      maxRetries: 2,
      errorRetryDelay: 2000,
      skipDelay: 1000,
    },
    patient: {
      loadTimeout: 20000,
      playTimeout: 10000,
      maxRetries: 3,
      errorRetryDelay: 3000,
      skipDelay: 1500,
    },
    conservative: {
      loadTimeout: 30000,
      playTimeout: 15000,
      maxRetries: 5,
      errorRetryDelay: 5000,
      skipDelay: 2000,
    },
  };

  // 当前配置（优先使用外部配置，否则使用标准预设）
  const skipConfig = window.MUSIC_SKIP_CONFIG || {
    ...skipPresets.standard,
    detectStalled: true,
    detectNetworkError: true,
    detectDecodeError: true,
    debug: false,
    customRules: {
      skipUrlPatterns: [],
      skipSongNames: [],
    },
  };

  const skipStats = {
    totalSkipped: 0,
    skipReasons: {},
    skippedSongs: [],
  };

  let currentSongState = {
    index: -1,
    url: "",
    name: "",
    loadStartTime: 0,
    playStartTime: 0,
    retryCount: 0,
    hasError: false,
    isSkipping: false,
  };

  let timers = {
    loadTimeout: null,
    playTimeout: null,
    skipDelay: null,
  };

  // ==================== 核心功能：播放器就绪管理 ====================
  function onPlayerReady(callback) {
    if (typeof callback !== "function") return;

    if (playerState.isReady && playerState.instance) {
      callback(playerState.instance, playerState.element);
    } else {
      playerState.readyCallbacks.push(callback);
    }
  }

  function triggerReadyCallbacks() {
    if (!playerState.isReady || !playerState.instance) return;

    playerState.readyCallbacks.forEach((callback) => {
      try {
        callback(playerState.instance, playerState.element);
      } catch (error) {
        // 静默处理回调执行错误
      }
    });

    playerState.readyCallbacks = [];
  }

  function checkPlayerReady() {
    if (!window.APlayer || !window.MetingJSElement) return false;

    const metingElement = document.querySelector("#nav-music meting-js");
    if (!metingElement || !metingElement.aplayer) return false;

    const aplayer = metingElement.aplayer;
    if (!aplayer.audio || !aplayer.list) return false;

    playerState.isReady = true;
    playerState.instance = aplayer;
    playerState.element = metingElement;

    return true;
  }

  function startMonitoring() {
    const checkTimer = setInterval(() => {
      playerState.initAttempts++;

      if (checkPlayerReady()) {
        clearInterval(checkTimer);
        triggerReadyCallbacks();
        return;
      }

      if (playerState.initAttempts >= playerState.maxAttempts) {
        clearInterval(checkTimer);
        return;
      }
    }, playerState.checkInterval);

    window.musicPlayerMonitorTimer = checkTimer;
  }

  // ==================== 功能模块：自动跳过 ====================
  function getCurrentMusic(aplayer) {
    if (!aplayer || !aplayer.list || !aplayer.list.audios) return null;
    const currentIndex = aplayer.list.index || 0;
    return aplayer.list.audios[currentIndex] || null;
  }

  function updateCurrentSongState(aplayer, currentMusic) {
    const currentIndex = aplayer.list.index || 0;

    if (currentSongState.index !== currentIndex) {
      currentSongState = {
        index: currentIndex,
        url: currentMusic.url || "",
        name: currentMusic.name || "未知歌曲",
        loadStartTime: Date.now(),
        playStartTime: 0,
        retryCount: 0,
        hasError: false,
        isSkipping: false,
      };
    }
  }

  function clearTimer(timerName) {
    if (timers[timerName]) {
      clearTimeout(timers[timerName]);
      timers[timerName] = null;
    }
  }

  function clearAllTimers() {
    Object.keys(timers).forEach((timerName) => clearTimer(timerName));
  }

  function recordSkipStats(errorType, errorMsg) {
    skipStats.totalSkipped++;

    if (!skipStats.skipReasons[errorType]) {
      skipStats.skipReasons[errorType] = 0;
    }
    skipStats.skipReasons[errorType]++;

    skipStats.skippedSongs.push({
      name: currentSongState.name,
      url: currentSongState.url,
      reason: errorType,
      message: errorMsg,
      time: new Date().toISOString(),
      retryCount: currentSongState.retryCount,
    });

    if (skipStats.skippedSongs.length > 50) {
      skipStats.skippedSongs = skipStats.skippedSongs.slice(-30);
    }
  }

  function handlePlaybackError(aplayer, errorType, errorMsg) {
    if (currentSongState.isSkipping) return;

    currentSongState.hasError = true;
    currentSongState.isSkipping = true;

    recordSkipStats(errorType, errorMsg);

    if (currentSongState.retryCount < skipConfig.maxRetries) {
      currentSongState.retryCount++;

      setTimeout(() => {
        currentSongState.isSkipping = false;
        if (aplayer.paused) {
          aplayer.toggle();
        }
      }, skipConfig.errorRetryDelay);

      return;
    }

    setTimeout(() => {
      try {
        aplayer.skipForward();
        currentSongState.isSkipping = false;
      } catch (error) {
        currentSongState.isSkipping = false;
      }
    }, skipConfig.skipDelay);
  }

  function setupAutoSkip(aplayer) {
    aplayer.on("loadstart", function () {
      const currentMusic = getCurrentMusic(this);
      if (!currentMusic) return;

      updateCurrentSongState(this, currentMusic);

      clearTimer("loadTimeout");
      timers.loadTimeout = setTimeout(() => {
        const errorMsg = `加载超时: ${currentSongState.name}`;
        handlePlaybackError(aplayer, "load_timeout", errorMsg);
      }, skipConfig.loadTimeout);
    });

    aplayer.on("loadeddata", function () {
      clearTimer("loadTimeout");
    });

    aplayer.on("play", function () {
      clearTimer("loadTimeout");
      currentSongState.playStartTime = Date.now();

      clearTimer("playTimeout");
      timers.playTimeout = setTimeout(() => {
        const errorMsg = `播放超时: ${currentSongState.name}`;
        handlePlaybackError(aplayer, "play_timeout", errorMsg);
      }, skipConfig.playTimeout);
    });

    aplayer.on("pause", function () {
      clearTimer("playTimeout");
    });

    aplayer.on("timeupdate", function () {
      if (this && this.audio && this.audio.currentTime > 0) {
        clearTimer("playTimeout");
        currentSongState.hasError = false;

        // 检测播放卡顿：如果音频已暂停但播放器状态显示播放中
        if (this.audio.paused && !this.paused) {
          console.warn("检测到播放状态不一致，尝试恢复播放");
          this.audio.play().catch((err) => {
            console.error("恢复播放失败:", err);
          });
        }
      }
    });

    aplayer.on("error", function () {
      const currentMusic = getCurrentMusic(this);
      const errorMsg = `播放错误: ${currentMusic?.name || "未知歌曲"}`;
      handlePlaybackError(this, "error", errorMsg);
    });

    aplayer.on("canplay", function () {
      clearAllTimers();
      currentSongState.hasError = false;
      currentSongState.retryCount = 0;
    });

    if (aplayer.audio) {
      // 播放卡顿检测 - 改为尝试恢复而不是跳过
      aplayer.audio.addEventListener("stalled", function () {
        console.warn("检测到播放卡顿，尝试恢复");
        // 尝试恢复播放而不是立即跳过
        if (!aplayer.paused) {
          aplayer.audio.load();
          aplayer.audio.play().catch((err) => {
            console.error("恢复播放失败:", err);
            if (skipConfig.detectStalled) {
              const currentMusic = getCurrentMusic(aplayer);
              const errorMsg = `播放卡顿: ${currentMusic?.name || "未知歌曲"}`;
              handlePlaybackError(aplayer, "stalled", errorMsg);
            }
          });
        }
      });

      // 网络错误检测
      aplayer.audio.addEventListener("error", function () {
        if (skipConfig.detectNetworkError) {
          const currentMusic = getCurrentMusic(aplayer);
          let errorMsg = `网络错误: ${currentMusic?.name || "未知歌曲"}`;
          handlePlaybackError(aplayer, "network_error", errorMsg);
        }
      });

      // 添加暂停事件监听 - 检测意外暂停
      aplayer.audio.addEventListener("pause", function () {
        // 如果播放器状态显示应该播放但音频暂停了，尝试恢复
        if (!aplayer.paused && aplayer.audio.readyState >= 2) {
          console.warn("检测到意外暂停，尝试恢复播放");
          setTimeout(() => {
            if (!aplayer.paused && aplayer.audio.paused) {
              aplayer.audio.play().catch((err) => {
                console.error("恢复播放失败:", err);
              });
            }
          }, 100);
        }
      });

      // 添加等待数据事件监听
      aplayer.audio.addEventListener("waiting", function () {
        console.warn("音频缓冲中...");
      });

      // 添加可以播放事件监听
      aplayer.audio.addEventListener("canplaythrough", function () {
        // 如果播放器状态显示应该播放，确保音频正在播放
        if (!aplayer.paused && aplayer.audio.paused) {
          console.log("缓冲完成，恢复播放");
          aplayer.audio.play().catch((err) => {
            console.error("恢复播放失败:", err);
          });
        }
      });
    }
  }

  // ==================== 功能模块：呼吸灯控制 ====================
  function setupBreathingLight() {
    const musicElement = document.querySelector("#nav-music");
    if (!musicElement) return;

    // 从页面配置中读取呼吸灯开关（Hexo 会将配置注入到页面）
    const breathingLightEnabled = window.APLAYER_BREATHING_LIGHT !== false;

    if (breathingLightEnabled) {
      musicElement.classList.add("breathing-light-enabled");
    } else {
      musicElement.classList.remove("breathing-light-enabled");
    }
  }

  // ==================== 功能模块：自动收缩 ====================

  // 用户展开偏好状态
  let userExpandPreference = {
    manuallyCollapsed: false, // 用户是否手动收缩
    lastAction: null, // 最后一次操作：'expand' 或 'collapse'
  };

  function setupAutoCollapse(aplayer) {
    const musicElement = document.querySelector("#nav-music");
    if (!musicElement) return;

    // 监听用户手动展开/收缩操作
    const musicInfo = musicElement.querySelector(
      ".aplayer-info .aplayer-music"
    );
    if (musicInfo) {
      musicInfo.addEventListener("click", function () {
        // 用户点击歌名区域切换展开/收缩
        const isCurrentlyStretched = musicElement.classList.contains("stretch");

        if (isCurrentlyStretched) {
          // 用户手动收缩
          userExpandPreference.manuallyCollapsed = true;
          userExpandPreference.lastAction = "collapse";
        } else {
          // 用户手动展开
          userExpandPreference.manuallyCollapsed = false;
          userExpandPreference.lastAction = "expand";
        }
      });
    }

    aplayer.on("play", function () {
      musicElement.classList.add("playing");

      // 只有在用户没有手动收缩的情况下才自动展开
      if (!userExpandPreference.manuallyCollapsed) {
        musicElement.classList.add("stretch");
      }

      if (typeof anzhiyu_musicPlaying !== "undefined") {
        anzhiyu_musicPlaying = true;
      }

      const hoverTips = document.getElementById("nav-music-hoverTips");
      if (hoverTips) {
        hoverTips.innerHTML =
          '<i class="fa-solid fa-pause music-icon-large"></i>';
        hoverTips.title = "暂停";
      }
    });

    aplayer.on("pause", function () {
      musicElement.classList.remove("playing", "stretch");

      if (typeof anzhiyu_musicPlaying !== "undefined") {
        anzhiyu_musicPlaying = false;
      }

      const hoverTips = document.getElementById("nav-music-hoverTips");
      if (hoverTips) {
        hoverTips.innerHTML =
          '<i class="fa-solid fa-play music-icon-large"></i>';
        hoverTips.title = "播放";
      }
    });

    aplayer.on("ended", function () {
      musicElement.classList.remove("playing", "stretch");

      if (typeof anzhiyu_musicPlaying !== "undefined") {
        anzhiyu_musicPlaying = false;
      }
    });

    // 状态同步检查 - 增强版，包含播放恢复逻辑
    setInterval(() => {
      const isActuallyPlaying = !aplayer.paused;
      const hasPlayingClass = musicElement.classList.contains("playing");

      // 检查音频元素的实际播放状态
      const audioElement = aplayer.audio;

      if (isActuallyPlaying && !hasPlayingClass) {
        musicElement.classList.add("playing");

        // 只有在用户没有手动收缩的情况下才自动展开
        if (!userExpandPreference.manuallyCollapsed) {
          musicElement.classList.add("stretch");
        }

        if (typeof anzhiyu_musicPlaying !== "undefined") {
          anzhiyu_musicPlaying = true;
        }
      } else if (!isActuallyPlaying && hasPlayingClass) {
        musicElement.classList.remove("playing", "stretch");
        if (typeof anzhiyu_musicPlaying !== "undefined") {
          anzhiyu_musicPlaying = false;
        }
      }

      // 关键修复：检测播放器状态与音频元素状态不一致的情况
      if (
        isActuallyPlaying &&
        audioElement &&
        audioElement.paused &&
        audioElement.readyState >= 2
      ) {
        console.warn("检测到播放状态不一致（定时检查），尝试恢复播放");
        audioElement.play().catch((err) => {
          console.error("定时检查恢复播放失败:", err);
        });
      }
    }, 2000);
  }

  // ==================== 功能模块：滚动隐藏（桌面端） ====================
  function setupScrollHide() {
    if (window.innerWidth <= 1200) return;

    let isPlayerHidden = true;
    const player = document.querySelector("#nav-music");
    if (!player) return;

    player.style.transition = "left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    player.style.willChange = "left";

    function handlePlayerScroll() {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const distanceToBottom = documentHeight - (scrollTop + windowHeight);

      if (scrollTop === 0 || distanceToBottom <= 100) {
        if (!isPlayerHidden) {
          player.style.transition =
            "left 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53)";
          player.style.left = "-100%";
          isPlayerHidden = true;
        }
      } else {
        if (isPlayerHidden) {
          player.style.transition =
            "left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          player.style.left = "20px";
          isPlayerHidden = false;
        }
      }
    }

    window.addEventListener("scroll", handlePlayerScroll, { passive: true });

    document.addEventListener("pjax:complete", () => {
      isPlayerHidden = true;
    });
  }

  // ==================== 初始化所有功能 ====================
  function initAllFeatures() {
    setupBreathingLight(); // 立即初始化呼吸灯控制
    onPlayerReady((aplayer) => {
      setupAutoSkip(aplayer);
      setupAutoCollapse(aplayer);
      setupScrollHide();
      setupColorExtraction(aplayer);
    });
  }

  // ==================== 全局 API ====================
  window.musicPlayer = {
    // 播放器管理
    onReady: onPlayerReady,
    isReady: () => playerState.isReady,
    getInstance: () => playerState.instance,
    getElement: () => playerState.element,

    // 自动跳过
    skipCurrent: function (reason = "manual") {
      if (!playerState.instance) return "播放器未就绪";
      const currentMusic = getCurrentMusic(playerState.instance);
      if (currentMusic) {
        recordSkipStats(reason, `手动跳过: ${currentMusic.name}`);
      }
      try {
        playerState.instance.skipForward();
        return "已跳过当前歌曲";
      } catch (error) {
        return "跳过失败";
      }
    },
    getSkipStats: () => skipStats,
    clearSkipStats: () => {
      skipStats.totalSkipped = 0;
      skipStats.skipReasons = {};
      skipStats.skippedSongs = [];
      return "统计已清除";
    },

    // 配置管理
    getSkipConfig: () => ({ ...skipConfig }),
    updateSkipConfig: (newConfig) => {
      Object.assign(skipConfig, newConfig);
      return skipConfig;
    },
    applySkipPreset: (presetName) => {
      if (!skipPresets[presetName]) {
        return `未知的预设: ${presetName}`;
      }
      Object.assign(skipConfig, skipPresets[presetName]);
      return `已应用 ${presetName} 预设`;
    },
    getSkipPresets: () => ({ ...skipPresets }),
    resetSkipConfig: () => {
      Object.assign(skipConfig, skipPresets.standard);
      return "已重置为标准配置";
    },

    // 播放器控制
    forceCollapse: () => {
      const musicElement = document.querySelector("#nav-music");
      if (musicElement) {
        musicElement.classList.remove("stretch");
        userExpandPreference.manuallyCollapsed = true;
        userExpandPreference.lastAction = "collapse";
        return "播放器已收缩";
      }
      return "播放器元素未找到";
    },
    forceExpand: () => {
      const musicElement = document.querySelector("#nav-music");
      if (musicElement) {
        musicElement.classList.add("stretch");
        userExpandPreference.manuallyCollapsed = false;
        userExpandPreference.lastAction = "expand";
        return "播放器已展开";
      }
      return "播放器元素未找到";
    },
    resetExpandPreference: () => {
      userExpandPreference.manuallyCollapsed = false;
      userExpandPreference.lastAction = null;
      return "展开偏好已重置";
    },
    getExpandPreference: () => ({ ...userExpandPreference }),
  };

  // 兼容旧API
  window.musicPlayerManager = window.musicPlayer;

  // 兼容旧的配置 API
  window.MUSIC_SKIP_CONFIG = skipConfig;
  window.MUSIC_SKIP_PRESETS = skipPresets;
  window.applySkipPreset = window.musicPlayer.applySkipPreset;
  window.getCurrentSkipConfig = window.musicPlayer.getSkipConfig;
  window.updateSkipConfigItem = (key, value) => {
    if (key in skipConfig) {
      skipConfig[key] = value;
      return true;
    }
    return false;
  };
  window.resetSkipConfig = window.musicPlayer.resetSkipConfig;

  // ==================== 启动 ====================
  if (!checkPlayerReady()) {
    startMonitoring();
  } else {
    triggerReadyCallbacks();
  }

  initAllFeatures();

  // PJAX 兼容
  if (typeof btf !== "undefined" && btf.addGlobalFn) {
    btf.addGlobalFn(
      "pjaxComplete",
      () => {
        const existingCallbacks = [...playerState.readyCallbacks];

        playerState.isReady = false;
        playerState.instance = null;
        playerState.element = null;
        playerState.initAttempts = 0;
        playerState.readyCallbacks = existingCallbacks;

        if (window.musicPlayerMonitorTimer) {
          clearInterval(window.musicPlayerMonitorTimer);
          window.musicPlayerMonitorTimer = null;
        }

        setTimeout(() => {
          if (!checkPlayerReady()) {
            startMonitoring();
          } else {
            triggerReadyCallbacks();
          }
          initAllFeatures();
        }, 800);
      },
      "musicPlayerUnified"
    );
  }

  // ==================== 功能模块：封面颜色提取（优化版） ====================
  const colorExtractor = {
    canvas: document.createElement("canvas"),
    ctx: null,
    currentColor: null,
    lastProcessedCover: null,

    init() {
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    },

    async extractColor(imageUrl) {
      if (!imageUrl) return null;

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const timeout = setTimeout(() => resolve(null), 5000);

        img.onload = () => {
          clearTimeout(timeout);
          try {
            // 优化：缩小到100x100
            const size = 100;
            const scale = Math.min(size / img.width, size / img.height, 1);

            this.canvas.width = img.width * scale;
            this.canvas.height = img.height * scale;

            this.ctx.drawImage(
              img,
              0,
              0,
              this.canvas.width,
              this.canvas.height
            );
            const imageData = this.ctx.getImageData(
              0,
              0,
              this.canvas.width,
              this.canvas.height
            );

            resolve(this.analyzeColor(imageData.data));
          } catch (error) {
            resolve(null);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };

        img.src = imageUrl;
      });
    },

    analyzeColor(data) {
      const colorMap = {};
      const step = 8; // 优化：增加步长

      for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];

        if (alpha < 128) continue;

        const brightness = r * 0.299 + g * 0.587 + b * 0.114;
        if (brightness > 200) continue; // 跳过太亮的颜色

        // 量化到32级
        const qR = Math.floor(r / 32) * 32;
        const qG = Math.floor(g / 32) * 32;
        const qB = Math.floor(b / 32) * 32;

        const key = `${qR},${qG},${qB}`;
        colorMap[key] = (colorMap[key] || 0) + (255 - brightness) / 255;
      }

      let maxScore = 0;
      let dominantColor = null;

      for (const [color, score] of Object.entries(colorMap)) {
        if (score > maxScore) {
          maxScore = score;
          dominantColor = color;
        }
      }

      if (dominantColor) {
        const [r, g, b] = dominantColor.split(",").map(Number);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)}`;
      }

      return null;
    },

    darkenColor(hex, percent) {
      const num = parseInt(hex.slice(1), 16);
      const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
      const g = Math.max(
        0,
        Math.floor(((num >> 8) & 0x00ff) * (1 - percent / 100))
      );
      const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - percent / 100)));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    },

    applyColor(color) {
      if (!color) return;

      this.currentColor = color;
      const darkColor = this.darkenColor(color, 30);
      const borderColor = this.darkenColor(color, 50);

      document.documentElement.style.setProperty(
        "--music-dynamic-background",
        darkColor
      );
      document.documentElement.style.setProperty(
        "--music-dynamic-border",
        borderColor
      );
      document.documentElement.style.setProperty(
        "--music-dynamic-shadow",
        `${darkColor}33`
      );

      // 设置呼吸灯颜色（使用主色的半透明版本）
      const num = parseInt(color.slice(1), 16);
      const r = (num >> 16) & 0xff;
      const g = (num >> 8) & 0xff;
      const b = num & 0xff;
      const breathingColor = `rgba(${r}, ${g}, ${b}, 0.5)`;

      document.documentElement.style.setProperty(
        "--music-breathing-color",
        breathingColor
      );

      // 更新播放器背景
      const musicElement = document.querySelector("#nav-music");
      if (musicElement && musicElement.classList.contains("playing")) {
        const aplayerElements = document.querySelectorAll(
          "#nav-music.playing .aplayer"
        );
        aplayerElements.forEach((el) => {
          el.style.setProperty("background", darkColor, "important");
        });
      }

      // 更新播放按钮
      const buttonBg = `rgba(${r}, ${g}, ${b}, 0.7)`;

      const button = document.getElementById("nav-music-hoverTips");
      if (button) {
        button.style.setProperty("background", buttonBg, "important");
      }
    },
  };

  colorExtractor.init();

  function setupColorExtraction(aplayer) {
    // 立即提取当前歌曲颜色
    const extractAndApply = async () => {
      const currentMusic = getCurrentMusic(aplayer);
      if (
        currentMusic &&
        currentMusic.pic &&
        currentMusic.pic !== colorExtractor.lastProcessedCover
      ) {
        colorExtractor.lastProcessedCover = currentMusic.pic;
        const color = await colorExtractor.extractColor(currentMusic.pic);
        if (color) {
          colorExtractor.applyColor(color);
        }
      }
    };

    extractAndApply();

    // 监听歌曲切换
    aplayer.on("loadstart", () => {
      setTimeout(extractAndApply, 100);
    });

    // 播放时重新应用颜色
    aplayer.on("play", () => {
      if (colorExtractor.currentColor) {
        setTimeout(
          () => colorExtractor.applyColor(colorExtractor.currentColor),
          50
        );
      }
    });

    // 暂停时恢复默认样式
    aplayer.on("pause", () => {
      setTimeout(() => {
        const aplayerElements = document.querySelectorAll(
          "#nav-music:not(.playing) .aplayer"
        );
        aplayerElements.forEach((el) => {
          el.style.removeProperty("background");
        });
      }, 50);
    });

    // 结束时恢复默认样式
    aplayer.on("ended", () => {
      setTimeout(() => {
        const aplayerElements = document.querySelectorAll(
          "#nav-music:not(.playing) .aplayer"
        );
        aplayerElements.forEach((el) => {
          el.style.removeProperty("background");
        });
      }, 50);
    });
  }

  // 添加到全局 API
  window.musicPlayer.extractColor = () => {
    if (!playerState.instance) return "播放器未就绪";
    const currentMusic = getCurrentMusic(playerState.instance);
    if (currentMusic && currentMusic.pic) {
      colorExtractor.extractColor(currentMusic.pic).then((color) => {
        if (color) colorExtractor.applyColor(color);
      });
      return "正在提取颜色...";
    }
    return "没有封面图片";
  };

  window.musicPlayer.getCurrentColor = () => colorExtractor.currentColor;
  window.musicPlayer.applyColor = (color) => colorExtractor.applyColor(color);

  // 呼吸灯控制
  window.musicPlayer.enableBreathingLight = () => {
    const musicElement = document.querySelector("#nav-music");
    if (musicElement) {
      musicElement.classList.add("breathing-light-enabled");
      window.APLAYER_BREATHING_LIGHT = true;
      return "呼吸灯已开启";
    }
    return "播放器元素未找到";
  };

  window.musicPlayer.disableBreathingLight = () => {
    const musicElement = document.querySelector("#nav-music");
    if (musicElement) {
      musicElement.classList.remove("breathing-light-enabled");
      window.APLAYER_BREATHING_LIGHT = false;
      return "呼吸灯已关闭";
    }
    return "播放器元素未找到";
  };

  window.musicPlayer.toggleBreathingLight = () => {
    const musicElement = document.querySelector("#nav-music");
    if (musicElement) {
      const isEnabled = musicElement.classList.contains(
        "breathing-light-enabled"
      );
      if (isEnabled) {
        return window.musicPlayer.disableBreathingLight();
      } else {
        return window.musicPlayer.enableBreathingLight();
      }
    }
    return "播放器元素未找到";
  };

  window.musicPlayer.isBreathingLightEnabled = () => {
    const musicElement = document.querySelector("#nav-music");
    return musicElement
      ? musicElement.classList.contains("breathing-light-enabled")
      : false;
  };

  // ==================== 歌词显示优化 ====================

  // 歌词提前显示时间（秒）
  const LYRIC_ADVANCE_TIME = 0.5;

  function setupLyricsOptimization(aplayer) {
    if (!aplayer || !aplayer.lrc) return;

    // 监听音频时间更新事件
    if (aplayer.audio) {
      aplayer.audio.addEventListener("timeupdate", function () {
        if (aplayer.lrc && typeof aplayer.lrc.update === "function") {
          // 获取当前播放时间并提前
          const currentTime = aplayer.audio.currentTime + LYRIC_ADVANCE_TIME;

          // 手动调用歌词更新，传入提前的时间
          try {
            aplayer.lrc.update(currentTime);
          } catch (e) {
            // 忽略错误，避免影响播放
          }
        }
      });
    }
  }

  // 在播放器就绪时设置歌词优化
  onPlayerReady((aplayer) => {
    setupLyricsOptimization(aplayer);
  });

  // 清理资源
  window.addEventListener("beforeunload", () => {
    if (window.musicPlayerMonitorTimer) {
      clearInterval(window.musicPlayerMonitorTimer);
      window.musicPlayerMonitorTimer = null;
    }
    clearAllTimers();
  });
})();
