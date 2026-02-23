// 首页头图轮播功能
document.addEventListener('DOMContentLoaded', function() {
  // 宽松检查配置
  const globalConfig = window.GLOBAL_CONFIG || {};
  const headerSlideshowConfig = globalConfig.headerSlideshow || {};
  const bilibiBgConfig = globalConfig.bilibiBg || {};
  
  // 检查配置是否启用
  if (headerSlideshowConfig.enable === false) {
    return;
  }
  
  // 检查bilibili动态背景是否启用
  if (bilibiBgConfig.enable === true || document.getElementById('bilibili-bg-container')) {
    return;
  }
  
  // 检查是否为首页
  const isHomePage = window.location.pathname === '/' || 
                     window.location.pathname === '/index.html' ||
                     document.body.classList.contains('index') ||
                     document.querySelector('#page-header.full_page');
  
  if (!isHomePage) {
    return;
  }

  // 轮播图片列表 - 请将图片放在 source/img/slideshow/ 目录下
  const slideshowImages = [
    '/img/slideshow/slide1.jpg',
    '/img/slideshow/slide2.jpg', 
    '/img/slideshow/slide3.jpg',
    '/img/slideshow/slide4.jpg',
    '/img/slideshow/slide5.jpg'
  ];

  // 过滤掉不存在的图片
  const validImages = [];
  let loadedCount = 0;
  
  function checkImageExists(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  // 检查图片是否存在，只使用存在的图片
  Promise.all(slideshowImages.map(checkImageExists)).then(results => {
    const validImages = slideshowImages.filter((img, index) => results[index]);
    
    // 如果没有有效的轮播图片，则不执行
    if (validImages.length === 0) {
      return;
    }
    
    initSlideshow(validImages);
  });

  function initSlideshow(images) {
    const pageHeader = document.getElementById('page-header');
    
    if (!pageHeader) {
      return;
    }

    // 创建轮播容器
    const slideshowContainer = document.createElement('div');
    slideshowContainer.className = 'header-slideshow';
    
    // 创建轮播图片元素
    images.forEach((imageSrc, index) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.style.backgroundImage = `url('${imageSrc}')`;
      
      // 第一张图片设为激活状态
      if (index === 0) {
        slide.classList.add('active');
      }
      
      slideshowContainer.appendChild(slide);
    });

    // 将轮播容器插入到页面头部的第一个位置
    pageHeader.insertBefore(slideshowContainer, pageHeader.firstChild);

    // 轮播控制
    let currentSlide = 0;
    const slides = slideshowContainer.querySelectorAll('.slide');

    function nextSlide() {
      // 隐藏当前图片
      slides[currentSlide].classList.remove('active');
      
      // 切换到下一张图片
      currentSlide = (currentSlide + 1) % slides.length;
      
      // 显示新图片
      slides[currentSlide].classList.add('active');
    }

    // 每5秒切换一次
    const slideInterval = setInterval(nextSlide, 5000);

    // 预加载图片以确保流畅切换
    images.forEach(imageSrc => {
      const img = new Image();
      img.src = imageSrc;
    });

    // 返回清理函数（可选）
    return () => {
      clearInterval(slideInterval);
      if (slideshowContainer.parentNode) {
        slideshowContainer.parentNode.removeChild(slideshowContainer);
      }
    };
  }
});

// 备用初始化方法，以防DOMContentLoaded已经触发
if (document.readyState !== 'loading') {
  // 文档已经加载完成，延迟执行以确保其他脚本已加载
  setTimeout(() => {
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  }, 500);
}