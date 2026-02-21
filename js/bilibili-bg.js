// 哔哩哔哩动态背景
(function () {
  // 在 APlayer 初始化之前设置 crossOrigin
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function (tagName) {
    const element = originalCreateElement(tagName);
    if (tagName.toLowerCase() === "audio") {
      element.crossOrigin = "anonymous";
    }
    return element;
  };

  let animationId = null;
  let riliInterval = null;
  let spectrumInterval = null;
  let resizeHandler = null;
  let isPageVisible = true;
  let isAnimationPaused = false;

  // 全局音频分析器状态（跨页面保持）
  if (!window.bilibiBgAudioState) {
    window.bilibiBgAudioState = {
      audioContext: null,
      analyser: null,
      dataArray: null,
      audioSource: null,
      isConnected: false,
      connectedElement: null,
      isMusicPlaying: false,
      eventListenersAdded: false,
    };
  }

  const audioState = window.bilibiBgAudioState;

  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (riliInterval) {
      clearInterval(riliInterval);
      riliInterval = null;
    }
    if (spectrumInterval) {
      clearInterval(spectrumInterval);
      spectrumInterval = null;
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    // 不关闭 audioContext，保持音频连接
    const container = document.getElementById("bilibili-bg-container");
    if (container) {
      container.remove();
    }
  }

  function setupAudioAnalyser(audioElement) {
    // 如果已经连接到同一个元素，直接返回成功
    if (
      audioState.isConnected &&
      audioState.connectedElement === audioElement
    ) {
      return true;
    }

    // 如果已经连接到其他元素，不能重复连接
    if (audioState.isConnected) {
      return true; // 返回true使用已有连接
    }

    if (!audioElement) return false;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioState.audioContext = new AudioContextClass();
      audioState.analyser = audioState.audioContext.createAnalyser();
      audioState.analyser.fftSize = 256;

      const bufferLength = audioState.analyser.frequencyBinCount;
      audioState.dataArray = new Uint8Array(bufferLength);

      audioState.audioSource =
        audioState.audioContext.createMediaElementSource(audioElement);
      audioState.audioSource.connect(audioState.analyser);
      audioState.analyser.connect(audioState.audioContext.destination);

      audioState.isConnected = true;
      audioState.connectedElement = audioElement;
      return true;
    } catch (error) {
      console.error("哔哩哔哩背景: 音频分析器初始化失败", error);
      return false;
    }
  }

  function init() {
    // 检查配置是否启用
    const globalConfig = window.GLOBAL_CONFIG || {};
    const bilibiBgConfig = globalConfig.bilibiBg || {};

    // 检查是否禁用（默认启用）
    if (bilibiBgConfig.enable === false) {
      return;
    }

    cleanup();

    const header = document.getElementById("page-header");
    if (!header || !header.classList.contains("full_page")) {
      return;
    }

    // 移动端检测：直接使用静态背景，不加载动态背景
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;

    if (isMobile) {
      return;
    }

    // 添加加载中状态，保留静态背景
    header.classList.add("bilibili-loading");

    const config = {
      phoneText: bilibiBgConfig.phoneText || [
        { time: 0, text: "凌晨啦!" },
        { time: 6, text: "早上好!" },
        { time: 8, text: "上午好!" },
        { time: 11, text: "你吃了吗" },
        { time: 13, text: "下午好鸭!" },
        { time: 16, text: "傍晚咯!" },
        { time: 19, text: "晚安!" },
      ],
      imgPath: "/img/bilibili-bg/",
    };

    // 创建Canvas容器（3960x2160设计）
    const container = document.createElement("div");
    container.id = "bilibili-bg-container";

    container.innerHTML = `
      <canvas id="bilibili-cvs" class="hidden" width="3960" height="2160"></canvas>
      <canvas id="bilibili-screen" class="hidden" width="468" height="714"></canvas>
      <canvas id="bilibili-rili" class="hidden" width="1200" height="1200"></canvas>
      <canvas id="bilibili-display"></canvas>
    `;

    header.appendChild(container);

    const cvs = document.getElementById("bilibili-cvs");
    const ctx = cvs.getContext("2d", { alpha: false });
    const display = document.getElementById("bilibili-display");
    const displayCtx = display.getContext("2d", { alpha: false });
    const screenImage = document.getElementById("bilibili-screen");
    const screenImageCtx = screenImage.getContext("2d");
    const rili = document.getElementById("bilibili-rili");
    const riliCtx = rili.getContext("2d");

    const data = new Array(128).fill(0);
    const animData = new Array(128).fill(0);

    const images = {};
    const imageFiles = {
      bg: "bg.png",
      mask: "mask.png",
      light: "light.png",
      caidai: "caidai.png",
      22: "22.png",
      screenLight: "screenLight.png",
      phoneLight: "phoneLight.png",
      screen: "screen.png",
      Screenmask: "Screenmask.png",
    };
    let loadedCount = 0;
    let errorCount = 0;
    const totalImages = Object.keys(imageFiles).length;
    let isScreenMaskDrawn = false;

    function tryDrawScreenMask() {
      if (
        !isScreenMaskDrawn &&
        images.screen &&
        images.screen.complete &&
        images.Screenmask &&
        images.Screenmask.complete
      ) {
        drawScreenMask();
        isScreenMaskDrawn = true;
      }
    }

    function checkAllLoaded() {
      if (loadedCount + errorCount >= totalImages) {
        if (errorCount > 0) {
          console.error(
            `哔哩哔哩背景: ${errorCount}/${totalImages} 张图片加载失败`
          );
        }
        drawRili();
        render();

        // 所有资源加载完成，显示动态背景并隐藏静态背景
        setTimeout(() => {
          container.classList.add("loaded");
          header.classList.remove("bilibili-loading");
          header.classList.add("bilibili-loaded");
        }, 100);
      }
    }

    Object.keys(imageFiles).forEach((name) => {
      images[name] = new Image();
      // 性能优化：设置图片加载优先级和跨域
      images[name].loading = "eager";
      images[name].decoding = "async";
      images[name].crossOrigin = "anonymous";

      images[name].onload = () => {
        loadedCount++;
        tryDrawScreenMask();
        checkAllLoaded();
      };

      images[name].onerror = () => {
        errorCount++;
        console.error(`哔哩哔哩背景: 图片加载失败 - ${imageFiles[name]}`);
        checkAllLoaded();
      };

      images[name].src = config.imgPath + imageFiles[name];
    });

    // 加载超时保护（8秒，更快显示）
    setTimeout(() => {
      if (loadedCount + errorCount < totalImages) {
        console.warn(
          `哔哩哔哩背景: 加载超时，已加载 ${loadedCount}/${totalImages}，继续显示`
        );
        // 即使未完全加载也显示，避免长时间等待
        container.classList.add("loaded");
        header.classList.remove("bilibili-loading");
        header.classList.add("bilibili-loaded");
      }
    }, 8000);

    function drawScreenMask() {
      screenImageCtx.drawImage(images.screen, -2082, -420, 2560, 1440);
      screenImageCtx.globalCompositeOperation = "destination-atop";
      screenImageCtx.drawImage(images.Screenmask, 0, 0, 468, 714);
      screenImageCtx.globalCompositeOperation = "source-over";
    }

    function drawRili() {
      riliCtx.clearRect(0, 0, 1200, 1200);
      const date = new Date();
      const year = date.getYear();
      const mouth = date.getMonth();
      const today = date.getDate();
      const cardSize = 80;

      const array_three = [4, 6, 9, 11];
      const array_threeone = [1, 3, 5, 7, 8, 10, 12];
      const array_week = ["SUN", "MON", "TUES", "WED", "THUR", "FRI", "SAT"];

      // 计算1号是星期几
      const firstDraw = new Date(date.getFullYear(), mouth, 1).getDay();

      let countDay;
      if (array_threeone.indexOf(mouth + 1) > -1) {
        countDay = 31;
      } else if (array_three.indexOf(mouth + 1) > -1) {
        countDay = 30;
      } else {
        countDay =
          (year % 4 == 0 && year % 100 != 0) || year % 400 == 0 ? 29 : 28;
      }

      const row = 7 - firstDraw + 7 * 4 < countDay ? 7 : 6;

      function drawTodaybg(i, j) {
        riliCtx.save();
        riliCtx.strokeStyle = "#900";
        for (let k = 0; k < 10; k++) {
          riliCtx.beginPath();
          riliCtx.arc(
            90 + i * cardSize * 1.7 + cardSize / 1.18,
            100 + j * cardSize + cardSize / 2,
            cardSize / 2 - (20 - k),
            -Math.PI,
            Math.PI * (1 - k / 20)
          );
          riliCtx.stroke();
          riliCtx.closePath();
        }
        riliCtx.restore();
      }

      function drawDate(txt, i, j) {
        riliCtx.textAlign = "center";
        riliCtx.fillStyle = "rgb(69,68,84)";
        riliCtx.font = cardSize / 1.5 + "px Impact";
        const yOffest = 6;
        if ((j == 0 || j == 6) && /^\d+(\d+)?$/.test(txt)) {
          riliCtx.fillStyle = "#900";
        }
        riliCtx.fillText(
          txt.toString(),
          90 + j * cardSize * 1.7 + cardSize / 1.18,
          100 + i * cardSize + (cardSize / 3) * 2 + yOffest
        );
        if (txt == today) {
          drawTodaybg(j, i);
        }
      }

      riliCtx.fillStyle = "rgb(69,68,84)";
      riliCtx.font = "900 52pt SimHei";
      riliCtx.textAlign = "center";
      const monthCN = [
        "一",
        "二",
        "三",
        "四",
        "五",
        "六",
        "七",
        "八",
        "九",
        "十",
        "十一",
        "十二",
      ];
      riliCtx.save();
      riliCtx.scale(1.1, 1);
      riliCtx.fillText(monthCN[mouth] + "月", 520, 64);
      riliCtx.restore();

      riliCtx.font = "40pt SimHei";
      riliCtx.textAlign = "end";
      riliCtx.fillText(today + "日", 1040, 76);

      for (let i = 0; i < row; i++) {
        for (let j = 0; j < 7; j++) {
          riliCtx.strokeRect(
            90 + j * cardSize * 1.7,
            100 + i * cardSize,
            cardSize * 1.7,
            cardSize
          );
        }
      }

      let dayIndex = 1;
      for (let i = 0; i < row; i++) {
        for (let j = 0; j < 7; j++) {
          if (i == 0) {
            drawDate(array_week[j], i, j);
            continue;
          }
          if (i == 1 && j < firstDraw) continue;
          if (dayIndex > countDay) break;
          drawDate(dayIndex++, i, j);
        }
      }
    }

    // 优化：计算到下一个0点的时间，然后每24小时更新一次
    function scheduleNextMidnightUpdate() {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      const timeUntilMidnight = tomorrow - now;

      // 在0点更新日历
      setTimeout(() => {
        drawRili();
        // 之后每24小时更新一次
        riliInterval = setInterval(drawRili, 86400000); // 24小时
      }, timeUntilMidnight);
    }

    scheduleNextMidnightUpdate();

    resizeHandler = function () {
      const headerHeight = header.offsetHeight;
      const headerWidth = header.offsetWidth;

      // 桌面端使用4K分辨率
      const canvasWidth = 3960;
      const canvasHeight = 2160;

      // 根据设备性能分级设置DPI
      let dpr = 1;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const deviceMemory = navigator.deviceMemory || 4;
      const isVeryLowResolution = screenWidth <= 1366 && screenHeight <= 768;
      const isLowResolution = screenWidth <= 1920 && screenHeight <= 1080;
      const hasLowMemory = deviceMemory < 4;

      // 桌面端根据分辨率和内存进行分级
      if (isVeryLowResolution || hasLowMemory) {
        dpr = 1;
      } else if (isLowResolution) {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      } else {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
      }

      const scaleX = headerWidth / canvasWidth;
      const scaleY = headerHeight / canvasHeight;
      const displayScale = Math.max(scaleX, scaleY);

      // 设置display canvas尺寸
      display.width = canvasWidth * dpr;
      display.height = canvasHeight * dpr;

      // 设置CSS尺寸（逻辑像素）
      display.style.width = canvasWidth + "px";
      display.style.height = canvasHeight + "px";

      // 缩放canvas上下文以匹配devicePixelRatio
      displayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 桌面端样式设置
      display.style.position = "absolute";
      display.style.willChange = "transform";
      display.style.backfaceVisibility = "hidden";
      display.style.transform = `scale(${displayScale})`;
      display.style.transformOrigin = "top left";
      display.style.left = `${
        (headerWidth - canvasWidth * displayScale) / 2
      }px`;
      display.style.top = `${
        (headerHeight - canvasHeight * displayScale) / 2
      }px`;

      // 容器优化
      container.style.position = "absolute";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.top = "0";
      container.style.left = "0";
      container.style.overflow = "hidden";
      container.style.pointerEvents = "none";
      container.style.contain = "layout style paint";

      // Header优化
      header.style.position = "relative";
      header.style.overflow = "hidden";
    };

    // 防抖处理resize事件，避免频繁触发
    let resizeTimeout;
    const debouncedResize = function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeHandler, 150);
    };

    window.addEventListener("resize", debouncedResize);
    setTimeout(resizeHandler, 100);

    // 连接音乐播放器
    function connectToMusicPlayer() {
      if (window.musicPlayer && window.musicPlayer.isReady()) {
        const aplayer = window.musicPlayer.getInstance();
        if (aplayer && aplayer.audio) {
          const connected = setupAudioAnalyser(aplayer.audio);
          if (connected) {
            // 只添加一次事件监听器
            if (!audioState.eventListenersAdded) {
              // 监听播放状态
              aplayer.on("play", () => {
                audioState.isMusicPlaying = true;
                if (
                  audioState.audioContext &&
                  audioState.audioContext.state === "suspended"
                ) {
                  audioState.audioContext.resume();
                }
              });
              aplayer.on("pause", () => {
                audioState.isMusicPlaying = false;
              });
              aplayer.on("ended", () => {
                audioState.isMusicPlaying = false;
              });
              audioState.eventListenersAdded = true;
            } else {
              // 如果已经添加过监听器，同步当前播放状态
              audioState.isMusicPlaying = !aplayer.paused;
            }
          }
        }
      } else {
        setTimeout(connectToMusicPlayer, 1000);
      }
    }

    // 延迟连接，确保播放器已初始化
    setTimeout(connectToMusicPlayer, 2000);

    // 更新频谱数据
    function updateSpectrumData() {
      // 优化：页面不可见或音乐未播放时不更新
      if (!isPageVisible || !audioState.isMusicPlaying) {
        return;
      }

      if (audioState.analyser && audioState.dataArray) {
        // 从音频获取实时频谱数据
        audioState.analyser.getByteFrequencyData(audioState.dataArray);

        // 将频谱数据映射到 data 数组（取中低频部分，更有视觉效果）
        for (let i = 0; i < 63; i++) {
          const index = Math.floor((i * audioState.dataArray.length) / 63);
          data[i + 32] = (audioState.dataArray[index] / 255) * 0.8; // 归一化到 0-0.8
        }
      }
    }

    // 设备性能检测
    const deviceInfo = (() => {
      const isLowResolution =
        window.screen.width <= 1366 && window.screen.height <= 768;
      const isLowResolutionDevice =
        window.screen.width <= 1920 && window.screen.height <= 1080;
      const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
      const isLowPerformance = isLowResolution || hasLowMemory;

      return {
        isLowResolution,
        isLowResolutionDevice,
        hasLowMemory,
        isLowPerformance,
      };
    })();

    // Canvas图像平滑设置 - 根据性能调整
    displayCtx.imageSmoothingQuality = deviceInfo.isLowPerformance ? "medium" : "high";
    displayCtx.imageSmoothingEnabled = true;

    // 根据设备性能调整频谱更新频率
    const updateInterval = deviceInfo.isLowPerformance ? 200 : deviceInfo.isLowResolutionDevice ? 150 : 100;
    spectrumInterval = setInterval(updateSpectrumData, updateInterval);

    const targetColor = { r: 80, g: 120, b: 169 };
    const currentColor = { r: 80, g: 120, b: 169 };
    const lightColor = { r: 0, g: 34, b: 77, a: 0 };

    function colorToRgb(color) {
      return `rgb(${color.r},${color.g},${color.b})`;
    }

    function colorToRgba(colorWithA) {
      return `rgba(${colorWithA.r},${colorWithA.g},${colorWithA.b},${colorWithA.a})`;
    }

    function min(a, b) {
      return a > b ? b : a;
    }
    function max(a, b) {
      return a > b ? a : b;
    }

    // 低性能设备降低帧率 - 更激进的优化
    let frameSkipCounter = 0;
    const frameSkipInterval = deviceInfo.isLowPerformance ? 3 : deviceInfo.isLowResolutionDevice ? 2 : 1;

    // 保持Canvas持续渲染
    function render() {
      // 优化：页面不可见或动画暂停时暂停渲染
      if (!isPageVisible || isAnimationPaused) {
        animationId = requestAnimationFrame(render);
        return;
      }

      // 低性能设备跳帧优化
      if (frameSkipInterval > 1) {
        frameSkipCounter++;
        if (frameSkipCounter % frameSkipInterval !== 0) {
          animationId = requestAnimationFrame(render);
          return;
        }
      }

      for (let i = 0; i < 128; i++) {
        animData[i] += (data[i] - animData[i]) * 0.3;
        animData[i] = min(animData[i], 1);
      }

      currentColor.r += (targetColor.r - currentColor.r) * 0.01;
      currentColor.r = min(max(currentColor.r, 0), 255);
      currentColor.g += (targetColor.g - currentColor.g) * 0.01;
      currentColor.g = min(max(currentColor.g, 0), 255);
      currentColor.b += (targetColor.b - currentColor.b) * 0.01;
      currentColor.b = min(max(currentColor.b, 0), 255);

      // 使用fillRect代替clearRect，性能更好
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 3960, 2160);
      ctx.drawImage(images.bg, 0, 0);
      ctx.drawImage(images.mask, 1908, 198, 1054, 796);

      ctx.fillStyle = "#97adbb";
      ctx.font = "64pt Impact";
      ctx.save();
      ctx.transform(1, 2.05 * (Math.PI / 180), 0, 1, 0, 0);

      const time = new Date();
      const timeStr =
        (time.getHours() < 10 ? "0" : "") +
        time.getHours() +
        ":" +
        (time.getMinutes() < 10 ? "0" : "") +
        time.getMinutes() +
        ":" +
        (time.getSeconds() < 10 ? "0" : "") +
        time.getSeconds();
      ctx.fillText(timeStr, 1450, 636);
      ctx.restore();

      // 日历本
      ctx.save();
      ctx.transform(0.9645, 0, 0, 0.96, 1934, 200);
      ctx.rotate(6 * (Math.PI / 180));
      ctx.drawImage(rili, 0, 0);
      ctx.restore();

      // 频谱
      ctx.save();
      ctx.transform(0.9645, 0, 9 * (Math.PI / 180), 1, 1650, 320);
      ctx.rotate(7 * (Math.PI / 180));

      const night = time.getHours() < 6 || time.getHours() > 18;
      targetColor.r = night ? 255 : 80;
      targetColor.g = night ? 75 : 120;
      targetColor.b = night ? 80 : 169;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(-20, 640, 1300, 4);

      ctx.fillStyle = colorToRgb(currentColor);
      for (let i = 32; i < 95; i++) {
        ctx.fillRect(
          20 * (i - 32),
          640 - 300 * animData[i],
          8,
          300 * animData[i]
        );
      }

      ctx.restore();

      ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(images.light, 1942, 394, 998, 428);
      ctx.globalCompositeOperation = "source-over";

      ctx.drawImage(images.caidai, 1898, 50, 324, 352);
      ctx.drawImage(images["22"], 2638, 690);

      if (night && lightColor.a < 0.7) {
        lightColor.a += 0.005;
        lightColor.a = min(lightColor.a, 0.7);
      } else if (!night) {
        lightColor.a -= 0.005;
        lightColor.a = max(lightColor.a, 0.0);
      }

      if (lightColor.a > 0) {
        ctx.globalCompositeOperation = "hard-light";
        ctx.fillStyle = colorToRgba(lightColor);
        ctx.fillRect(0, 0, 3960, 2160);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = lightColor.a / 0.7;
        ctx.drawImage(images.phoneLight, 1720, 874, 1104, 880);
        ctx.globalAlpha = 1;
      }

      ctx.drawImage(screenImage, 0, 0);
      if (lightColor.a > 0) {
        ctx.globalAlpha = lightColor.a / 0.7;
        ctx.drawImage(images.screenLight, 0, 0);
        ctx.globalAlpha = 1;
      }

      let greeting = "凌晨啦!";
      config.phoneText.forEach((v) => {
        if (time.getHours() >= v.time) {
          greeting = v.text;
        }
      });

      ctx.fillStyle = "#000";
      ctx.font = "62.04pt SimHei";
      ctx.save();
      ctx.transform(1.0911, -35 * (Math.PI / 180), 0, 0.5868, 2265.88, 1128.14);
      ctx.rotate(56.5 * (Math.PI / 180));
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(greeting, 270, 200);
      ctx.restore();

      displayCtx.globalCompositeOperation = "copy";
      displayCtx.drawImage(cvs, 0, 0);
      displayCtx.globalCompositeOperation = "source-over";

      animationId = requestAnimationFrame(render);
    }
  }

  // 页面可见性监听（性能优化）
  function handleVisibilityChange() {
    isPageVisible = !document.hidden;

    if (!isPageVisible) {
      // 页面不可见时暂停动画
      isAnimationPaused = true;
    } else {
      // 页面可见时恢复动画
      isAnimationPaused = false;
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // 在window.onload时执行，确保所有资源已加载
  window.addEventListener("load", init);

  document.addEventListener("pjax:complete", init);
  document.addEventListener("pjax:start", cleanup);
  window.addEventListener("beforeunload", cleanup);
})();
