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
  
  // 轮播图片列表
  const slideshowImages = [
    '/img/slideshow/slide1.jpg',
    '/img/slideshow/slide2.jpg',
    '/img/slideshow/slide3.jpg',
    '/img/slideshow/slide4.jpg',
    '/img/slideshow/slide5.jpg',
    '/img/slideshow/slide6.jpg',
    '/img/slideshow/slide7.jpg',
    '/img/slideshow/slide8.jpg',
    '/img/slideshow/slide9.jpg',
    '/img/slideshow/slide10.jpg'
  ];

  // 检查图片是否存在
  function checkImageExists(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  async function initSlideshow() {
    console.log('开始初始化简化版轮播');
    
    const pageHeader = document.getElementById('page-header');
    if (!pageHeader) {
      console.log('未找到page-header元素');
      return;
    }

    // 检查是否已经初始化
    if (isInitialized) {
      console.log('轮播已初始化，跳过');
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
      console.log('非首页，跳过轮播');
      return;
    }

    // 检查哪些图片存在
    const imageChecks = await Promise.all(slideshowImages.map(checkImageExists));
    const validImages = slideshowImages.filter((img, index) => imageChecks[index]);
    
    if (validImages.length === 0) {
      console.log('没有找到有效的轮播图片');
      return;
    }

    console.log('找到有效图片：', validImages);

    // 移动端检测和优化
    const isMobile = isMobileDevice();
    const isTouch = isTouchDevice();
    const isLowPerf = isLowPerformanceDevice();
    
    console.log('设备信息：', {
      isMobile: isMobile,
      isTouch: isTouch,
      isLowPerf: isLowPerf,
      screenWidth: window.innerWidth,
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });

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
    validImages.forEach((imageSrc, index) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.style.backgroundImage = `url('${imageSrc}')`;
      
      // 第一张图片设为激活状态
      if (index === 0) {
        slide.classList.add('active');
      }
      
      slideshowContainer.appendChild(slide);
    });

    // 插入轮播容器
    pageHeader.insertBefore(slideshowContainer, pageHeader.firstChild);

    // 轮播控制
    let currentSlide = 0;
    const slides = slideshowContainer.querySelectorAll('.slide');
    
    // 根据设备类型调整轮播间隔
    const slideInterval = isMobile ? 8000 : 10000; // 移动端8秒，桌面端10秒
    
    console.log(`设置轮播间隔：${slideInterval}ms (${isMobile ? '移动端' : '桌面端'})`);

    slideshowInterval = setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, slideInterval);

    // 标记为已初始化
    isInitialized = true;
    
    console.log('轮播初始化完成，共' + validImages.length + '张图片');
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
    console.log('PJAX页面切换完成，重新初始化轮播');
    safeInitSlideshow();
  });

  // 监听pjax:start事件，在页面切换开始时清理
  document.addEventListener('pjax:start', function() {
    console.log('PJAX页面切换开始，清理轮播');
    cleanupSlideshow();
  });

  // 监听popstate事件（浏览器前进后退）
  window.addEventListener('popstate', function() {
    console.log('浏览器导航事件，重新初始化轮播');
    setTimeout(safeInitSlideshow, 200);
  });

  // 监听hashchange事件
  window.addEventListener('hashchange', function() {
    console.log('Hash变化，检查是否需要重新初始化轮播');
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
      console.log('强制重新初始化轮播');
      cleanupSlideshow();
      safeInitSlideshow();
    },
    
    cleanup: function() {
      console.log('清理轮播');
      cleanupSlideshow();
    }
  };
  
  console.log('头图轮播脚本加载完成，使用 window.slideshowDebug.getStatus() 查看状态');
})();