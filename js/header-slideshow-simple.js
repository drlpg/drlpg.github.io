// 简化版首页头图轮播功能
(function() {
  'use strict';
  
  // 轮播状态跟踪
  let slideshowInterval = null;
  let isInitialized = false;
  
  // 移动端检测
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }
  
  // 检查是否支持触摸
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  // 检查设备性能（简单判断）
  function isLowPerformanceDevice() {
    // 基于内存和CPU核心数的简单判断
    const memory = navigator.deviceMemory || 4; // 默认4GB
    const cores = navigator.hardwareConcurrency || 4; // 默认4核
    const isOldBrowser = !window.IntersectionObserver || !window.requestIdleCallback;
    
    return memory < 2 || cores < 2 || isOldBrowser;
  }
  
  // 从配置中读取轮播设置（延迟读取，确保GLOBAL_CONFIG已加载）
  function getSlideshowConfig() {
    return (window.GLOBAL_CONFIG && window.GLOBAL_CONFIG.headerSlideshow) || 
      window.headerSlideshowConfig || {
      enable: false,
      slides: [],
      interval: 5000,
      transition: 1000
    };
  }
  
  // 不在这里做初始检查，因为GLOBAL_CONFIG可能还未加载
  // 配置检查将在 initSlideshow 函数内部进行

  // 检查图片是否存在
  function checkImageExists(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
  
  // 创建可点击的slide元素
  function createSlideElement(slideData, index) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.backgroundImage = `url('${slideData.image}')`;
    
    // 如果有标题，添加title属性
    if (slideData.title) {
      slide.setAttribute('title', slideData.title);
    }
    
    // 如果有链接，添加点击事件和样式
    if (slideData.link && slideData.link.trim() !== '') {
      slide.setAttribute('data-link', slideData.link);
      
      slide.addEventListener('click', function(e) {
        e.stopPropagation();
        window.open(slideData.link, '_blank');
      });
    }
    
    // 第一张图片设为激活状态
    if (index === 0) {
      slide.classList.add('active');
    }
    
    return slide;
  }

  async function initSlideshow() {
    // 检查bilibili动态背景是否启用（宽松检查）
    const globalConfig = window.GLOBAL_CONFIG || {};
    const bilibiBgConfig = globalConfig.bilibiBg || {};
    
    // 如果bilibili背景明确启用或存在容器，则跳过轮播图
    if (bilibiBgConfig.enable === true || document.getElementById('bilibili-bg-container')) {
      return;
    }
    
    const pageHeader = document.getElementById('page-header');
    if (!pageHeader) {
      return;
    }

    // 检查是否已经初始化
    if (isInitialized) {
      return;
    }

    // 更准确的首页检测
    function isHomePage() {
      const pathname = window.location.pathname;
      const isRootPath = pathname === '/' || pathname === '/index.html';
      const hasFullPageClass = pageHeader.classList.contains('full_page');
      const isIndexPage = document.body.classList.contains('index');
      
      return isRootPath || (hasFullPageClass && isIndexPage);
    }
    
    if (!isHomePage()) {
      return;
    }

    // 重新获取配置（此时GLOBAL_CONFIG应该已加载）
    const slideshowConfig = getSlideshowConfig();
    
    // 再次检查是否启用
    if (slideshowConfig.enable !== true) {
      return;
    }
    
    const slides = slideshowConfig.slides || [];
    if (slides.length === 0) {
      return;
    }
    
    // 检查哪些图片存在
    const imageChecks = await Promise.all(slides.map(slide => checkImageExists(slide.image)));
    const validSlides = slides.filter((slide, index) => imageChecks[index]);
    
    if (validSlides.length === 0) {
      return;
    }


    // 移动端检测和优化
    const isMobile = isMobileDevice();
    const isTouch = isTouchDevice();
    const isLowPerf = isLowPerformanceDevice();
    

    // 创建轮播容器
    const slideshowContainer = document.createElement('div');
    slideshowContainer.className = 'header-slideshow';
    
    // 移动端添加特殊类名
    if (isMobile) {
      slideshowContainer.classList.add('mobile-slideshow');
    }
    if (isTouch) {
      slideshowContainer.classList.add('touch-device');
    }
    if (isLowPerf) {
      slideshowContainer.classList.add('low-performance');
    }
    
    // 动态创建所有图片的slide元素
    validSlides.forEach((slideData, index) => {
      const slide = createSlideElement(slideData, index);
      slideshowContainer.appendChild(slide);
    });

    // 创建切换按钮（使用Font Awesome箭头图标）
    const prevButton = document.createElement('div');
    prevButton.className = 'slideshow-nav prev';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.setAttribute('title', '上一张');
    
    const nextButton = document.createElement('div');
    nextButton.className = 'slideshow-nav next';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.setAttribute('title', '下一张');
    
    slideshowContainer.appendChild(prevButton);
    slideshowContainer.appendChild(nextButton);

    // 插入轮播容器
    pageHeader.insertBefore(slideshowContainer, pageHeader.firstChild);

    // 轮播控制
    let currentSlide = 0;
    const slideElements = slideshowContainer.querySelectorAll('.slide');
    
    // 切换到指定slide
    function goToSlide(index) {
      slideElements[currentSlide].classList.remove('active');
      currentSlide = index;
      slideElements[currentSlide].classList.add('active');
    }
    
    // 上一张
    function prevSlide() {
      const prevIndex = (currentSlide - 1 + slideElements.length) % slideElements.length;
      goToSlide(prevIndex);
      resetInterval();
    }
    
    // 下一张
    function nextSlide() {
      const nextIndex = (currentSlide + 1) % slideElements.length;
      goToSlide(nextIndex);
      resetInterval();
    }
    
    // 重置自动播放定时器
    function resetInterval() {
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
      startInterval();
    }
    
    // 启动自动播放
    function startInterval() {
      slideshowInterval = setInterval(() => {
        nextSlide();
      }, slideshowConfig.interval);
    }
    
    // 绑定按钮事件
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);
    
    // 添加触摸滑动支持
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50; // 最小滑动距离（像素）
    
    slideshowContainer.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slideshowContainer.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
      const swipeDistance = touchEndX - touchStartX;
      
      // 向左滑动（下一张）
      if (swipeDistance < -minSwipeDistance) {
        nextSlide();
      }
      // 向右滑动（上一张）
      else if (swipeDistance > minSwipeDistance) {
        prevSlide();
      }
    }
    
    // 启动自动播放
    startInterval();

    // 标记为已初始化
    isInitialized = true;
    
  }

  // 清理现有轮播的函数
  function cleanupSlideshow() {
    // 清除定时器
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
    
    // 移除轮播容器
    const existingSlideshow = document.querySelector('.header-slideshow');
    if (existingSlideshow) {
      existingSlideshow.remove();
    }
    
    // 重置状态
    isInitialized = false;
  }

  // 安全的初始化函数
  function safeInitSlideshow() {
    // 先清理现有的轮播
    cleanupSlideshow();
    // 延迟一点时间确保DOM更新完成
    setTimeout(initSlideshow, 100);
  }

  // 多种初始化方式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitSlideshow);
  } else {
    safeInitSlideshow();
  }

  // PJAX页面切换事件监听
  document.addEventListener('pjax:complete', function() {
    safeInitSlideshow();
  });

  // 监听pjax:start事件，在页面切换开始时清理
  document.addEventListener('pjax:start', function() {
    cleanupSlideshow();
  });

  // 监听popstate事件（浏览器前进后退）
  window.addEventListener('popstate', function() {
    setTimeout(safeInitSlideshow, 200);
  });

  // 监听hashchange事件
  window.addEventListener('hashchange', function() {
    setTimeout(safeInitSlideshow, 100);
  });

  // 备用初始化
  setTimeout(safeInitSlideshow, 1000);

  // 调试工具
  window.slideshowDebug = {
    getStatus: function() {
      return {
        isInitialized: isInitialized,
        hasInterval: !!slideshowInterval,
        hasContainer: !!document.querySelector('.header-slideshow'),
        currentPath: window.location.pathname,
        isHomePage: window.location.pathname === '/' || window.location.pathname === '/index.html',
        deviceInfo: {
          isMobile: isMobileDevice(),
          isTouch: isTouchDevice(),
          isLowPerf: isLowPerformanceDevice(),
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
          memory: navigator.deviceMemory || 'unknown',
          cores: navigator.hardwareConcurrency || 'unknown'
        }
      };
    },
    
    forceInit: function() {
      cleanupSlideshow();
      safeInitSlideshow();
    },
    
    cleanup: function() {
      cleanupSlideshow();
    }
  };
  
  // 头图轮播脚本加载完成
})();