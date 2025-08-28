// 博客交互监听器
class BlogInteractionListener {
  constructor() {
    this.tipsManager = window.SmartTipsManager;
    this.lastScrollTime = 0;
    this.scrollDirection = 'down';
    this.lastScrollTop = 0;
    this.isScrolling = false;
    
    this.initListeners();
  }

  // 初始化所有监听器
  initListeners() {
    this.initScrollListener();
    this.initCopyListener();
    this.initSearchListener();
    this.initThemeListener();
    this.initMusicListener();
    this.initCommentListener();
    this.initShareListener();
    this.initNavigationListener();
    this.initLocationGreeting();
    this.initWeatherTips();
  }

  // 滚动监听
  initScrollListener() {
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
      const now = Date.now();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 判断滚动方向
      this.scrollDirection = currentScrollTop > this.lastScrollTop ? 'down' : 'up';
      this.lastScrollTop = currentScrollTop;
      
      // 防止过于频繁的提示
      if (now - this.lastScrollTime > 30000) { // 30秒间隔
        this.isScrolling = true;
        
        // 清除之前的定时器
        clearTimeout(scrollTimeout);
        
        // 设置新的定时器，滚动停止后触发提示
        scrollTimeout = setTimeout(() => {
          if (this.isScrolling) {
            this.showTip('scroll');
            this.lastScrollTime = now;
            this.isScrolling = false;
          }
        }, 1000); // 滚动停止1秒后触发
      }
    });
  }

  // 复制监听
  initCopyListener() {
    document.addEventListener('copy', () => {
      setTimeout(() => {
        this.showTip('copy');
      }, 500);
    });
  }

  // 搜索监听
  initSearchListener() {
    // 监听搜索框输入
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input, #local-search-input');
    searchInputs.forEach(input => {
      input.addEventListener('focus', () => {
        setTimeout(() => {
          this.showTip('search');
        }, 1000);
      });
    });

    // 监听搜索按钮点击
    const searchButtons = document.querySelectorAll('.search-button, .search-submit, [data-search]');
    searchButtons.forEach(button => {
      button.addEventListener('click', () => {
        setTimeout(() => {
          this.showTip('search');
        }, 1500);
      });
    });
  }

  // 主题切换监听
  initThemeListener() {
    // 监听主题切换按钮
    const themeButtons = document.querySelectorAll('[data-theme], .theme-switch, .darkmode-toggle');
    themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        setTimeout(() => {
          this.showTip('theme');
        }, 800);
      });
    });

    // 监听系统主题变化
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        setTimeout(() => {
          this.showTip('theme');
        }, 1000);
      });
    }
  }

  // 音乐播放监听
  initMusicListener() {
    // 监听音乐播放器事件
    document.addEventListener('click', (e) => {
      if (e.target.closest('.aplayer, .music-player, [data-music]')) {
        setTimeout(() => {
          this.showTip('music');
        }, 1000);
      }
    });

    // 监听音频元素事件
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.addEventListener('play', () => {
        this.showTip('music');
      });
      
      audio.addEventListener('pause', () => {
        setTimeout(() => {
          this.showTip('music');
        }, 500);
      });
    });
  }

  // 评论区监听
  initCommentListener() {
    // 监听评论区滚动到视图
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            this.showTip('comment');
          }, 2000);
        }
      });
    }, { threshold: 0.3 });

    // 观察评论区元素
    const commentSections = document.querySelectorAll('#comments, .comments, .comment-section, #twikoo, #valine');
    commentSections.forEach(section => {
      observer.observe(section);
    });

    // 监听评论输入框焦点
    document.addEventListener('focus', (e) => {
      if (e.target.matches('textarea[placeholder*="评论"], textarea[placeholder*="comment"], .comment-input')) {
        setTimeout(() => {
          this.showTip('comment');
        }, 1000);
      }
    }, true);
  }

  // 分享功能监听
  initShareListener() {
    // 监听分享按钮点击
    document.addEventListener('click', (e) => {
      if (e.target.closest('.share-button, [data-share], .social-share, .share-item')) {
        setTimeout(() => {
          this.showTip('share');
        }, 500);
      }
    });

    // 监听Web Share API
    if (navigator.share) {
      const originalShare = navigator.share;
      navigator.share = function(...args) {
        setTimeout(() => {
          window.BlogInteractionListener?.showTip('share');
        }, 500);
        return originalShare.apply(this, args);
      };
    }
  }

  // 导航操作监听
  initNavigationListener() {
    // 监听菜单点击
    document.addEventListener('click', (e) => {
      if (e.target.closest('.menu-item, .nav-item, .sidebar-item')) {
        setTimeout(() => {
          this.showTip('navigation');
        }, 800);
      }
    });

    // 监听标签和分类点击
    document.addEventListener('click', (e) => {
      if (e.target.closest('.tag-item, .category-item, .post-tag, .post-category')) {
        setTimeout(() => {
          this.showTip('navigation');
        }, 600);
      }
    });

    // 监听分页点击
    document.addEventListener('click', (e) => {
      if (e.target.closest('.pagination, .page-number, .next, .prev')) {
        setTimeout(() => {
          this.showTip('navigation');
        }, 1000);
      }
    });
  }

  // 地域问候初始化
  initLocationGreeting() {
    // 页面加载完成后延迟显示地域问候
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (this.tipsManager && this.tipsManager.locationTips.length > 0) {
          // 20% 概率在页面加载时显示地域问候
          if (Math.random() < 0.2) {
            this.showTip('location');
          }
        }
      }, 3000); // 页面加载3秒后
    });

    // 用户首次交互时显示地域问候
    let hasShownLocationGreeting = false;
    const showLocationGreetingOnce = () => {
      if (!hasShownLocationGreeting && this.tipsManager && this.tipsManager.locationTips.length > 0) {
        if (Math.random() < 0.3) { // 30% 概率
          this.showTip('location');
          hasShownLocationGreeting = true;
        }
      }
    };

    // 监听首次点击
    document.addEventListener('click', showLocationGreetingOnce, { once: true });
    
    // 监听首次滚动
    document.addEventListener('scroll', showLocationGreetingOnce, { once: true });
  }

  // 天气提示初始化
  initWeatherTips() {
    // 页面加载后定期显示天气提示
    setTimeout(() => {
      if (this.tipsManager && this.tipsManager.weatherTips.length > 0) {
        // 15% 概率显示天气提示
        if (Math.random() < 0.15) {
          this.showTip('weather');
        }
      }
    }, 8000); // 页面加载8秒后

    // 每30分钟检查一次天气提示
    setInterval(() => {
      if (this.tipsManager && this.tipsManager.weatherTips.length > 0) {
        if (Math.random() < 0.1) { // 10% 概率
          this.showTip('weather');
        }
      }
    }, 30 * 60 * 1000); // 30分钟

    // 在特定时间点显示天气提示
    const showWeatherAtTime = () => {
      const hour = new Date().getHours();
      // 在早上8点、中午12点、下午6点显示天气提示
      if ([8, 12, 18].includes(hour)) {
        const minute = new Date().getMinutes();
        if (minute < 5) { // 在整点后5分钟内
          setTimeout(() => {
            this.showTip('weather');
          }, Math.random() * 5 * 60 * 1000); // 随机延迟0-5分钟
        }
      }
    };

    // 每小时检查一次
    setInterval(showWeatherAtTime, 60 * 60 * 1000);
    showWeatherAtTime(); // 立即检查一次
  }

  // 显示提示语
  showTip(context) {
    if (!this.tipsManager) return;
    
    const tip = this.tipsManager.getSmartTip(context);
    if (tip) {
      // 这里需要根据你的Live2D实现来调用显示提示语的方法
      // 例如：window.showLive2DTip(tip);
      console.log(`[Live2D Tip - ${context}]:`, tip);
      
      // 如果有全局的Live2D提示显示函数，在这里调用
      if (window.showLive2DTip) {
        window.showLive2DTip(tip);
      } else if (window.Live2D && window.Live2D.showTip) {
        window.Live2D.showTip(tip);
      }
    }
  }

  // 手动触发提示语
  triggerTip(context) {
    this.showTip(context);
  }

  // 获取监听器状态
  getStatus() {
    return {
      scrollDirection: this.scrollDirection,
      lastScrollTime: this.lastScrollTime,
      isScrolling: this.isScrolling,
      locationDetected: this.tipsManager?.userLocation !== null
    };
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 等待SmartTipsManager加载完成
  const initListener = () => {
    if (window.SmartTipsManager) {
      window.BlogInteractionListener = new BlogInteractionListener();
      console.log('Blog Interaction Listener initialized!');
    } else {
      setTimeout(initListener, 100);
    }
  };
  
  initListener();
});

// 导出给全局使用
window.BlogInteractionListener = window.BlogInteractionListener || null;