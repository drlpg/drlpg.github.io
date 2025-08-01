// 简化版首页头图轮播功能
(function() {
  'use strict';
  
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

    // 检查是否为首页
    const isHomePage = window.location.pathname === '/' || 
                       window.location.pathname === '/index.html' ||
                       pageHeader.classList.contains('full_page');
    
    if (!isHomePage) {
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

    // 创建轮播容器
    const slideshowContainer = document.createElement('div');
    slideshowContainer.className = 'header-slideshow';
    
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

    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 15000);

    console.log('轮播初始化完成，共' + validImages.length + '张图片');
  }

  // 多种初始化方式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlideshow);
  } else {
    initSlideshow();
  }

  // 备用初始化
  setTimeout(initSlideshow, 1000);
})();