// 页面卡片控制器 - 用于控制不同页面的侧边栏卡片显示
(function() {
  
  // 页面配置 - 可以轻松添加新页面的卡片控制
  const pageConfigs = {
    // 页面路径或标识符: 要隐藏的卡片类型数组
    '/about/': ['categories', 'tags'],
    'about': ['categories', 'tags'],
    // 可以添加更多页面配置
    // '/contact/': ['categories', 'tags', 'archives'],
    // '/projects/': ['recent-posts'],
    // '/gallery/': ['categories', 'tags', 'webinfo']
  };
  
  // 页面标题匹配配置
  const titleConfigs = {
    '关于': ['categories', 'tags'],
    'About': ['categories', 'tags'],
    // 可以添加更多标题匹配
    // '联系': ['categories', 'tags'],
    // 'Contact': ['categories', 'tags']
  };
  
  // 卡片类型映射
  const cardSelectors = {
    'categories': '.card-categories',
    'tags': '.card-tags',
    'archives': '.card-archives',
    'recent-posts': '.card-recent-post',
    'webinfo': '.card-webinfo'
  };
  
  function controlPageCards() {
    // 获取当前页面路径
    const currentPath = window.location.pathname;
    const pageTitle = document.title;
    
    // 重置所有隐藏类
    document.body.classList.remove(
      'hide-category-tags', 
      'hide-categories', 
      'hide-tags', 
      'hide-archives', 
      'hide-recent-posts', 
      'hide-webinfo'
    );
    
    // 恢复所有卡片显示
    Object.values(cardSelectors).forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = '';
      }
    });
    
    let cardsToHide = [];
    
    // 检查路径匹配
    for (const [path, cards] of Object.entries(pageConfigs)) {
      if (currentPath.includes(path) || currentPath.endsWith(path) || currentPath === path) {
        cardsToHide = [...cardsToHide, ...cards];
        break;
      }
    }
    
    // 检查标题匹配
    for (const [title, cards] of Object.entries(titleConfigs)) {
      if (pageTitle.includes(title)) {
        cardsToHide = [...cardsToHide, ...cards];
        break;
      }
    }
    
    // 应用隐藏设置
    if (cardsToHide.length > 0) {
      // 去重
      cardsToHide = [...new Set(cardsToHide)];
      
      // 添加对应的CSS类
      if (cardsToHide.includes('categories') && cardsToHide.includes('tags')) {
        document.body.classList.add('hide-category-tags');
      } else {
        if (cardsToHide.includes('categories')) {
          document.body.classList.add('hide-categories');
        }
        if (cardsToHide.includes('tags')) {
          document.body.classList.add('hide-tags');
        }
      }
      
      if (cardsToHide.includes('archives')) {
        document.body.classList.add('hide-archives');
      }
      if (cardsToHide.includes('recent-posts')) {
        document.body.classList.add('hide-recent-posts');
      }
      if (cardsToHide.includes('webinfo')) {
        document.body.classList.add('hide-webinfo');
      }
      
      // 直接隐藏元素（双重保险）
      cardsToHide.forEach(cardType => {
        const selector = cardSelectors[cardType];
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            element.style.display = 'none';
          }
        }
      });
    }
  }
  
  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', controlPageCards);
  } else {
    controlPageCards();
  }
  
  // 支持PJAX页面切换
  if (typeof pjax !== 'undefined') {
    document.addEventListener('pjax:complete', controlPageCards);
  }
  
  // 监听URL变化（适用于SPA应用）
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(controlPageCards, 100); // 延迟执行确保DOM更新完成
    }
  }).observe(document, { subtree: true, childList: true });
  
  // 暴露全局函数供外部调用
  window.pageCardController = {
    // 添加新的页面配置
    addPageConfig: function(path, cardsToHide) {
      pageConfigs[path] = cardsToHide;
      controlPageCards(); // 立即应用
    },
    
    // 添加新的标题配置
    addTitleConfig: function(title, cardsToHide) {
      titleConfigs[title] = cardsToHide;
      controlPageCards(); // 立即应用
    },
    
    // 手动控制卡片显示
    hideCards: function(cardsToHide) {
      cardsToHide.forEach(cardType => {
        const selector = cardSelectors[cardType];
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            element.style.display = 'none';
          }
        }
      });
    },
    
    // 手动显示卡片
    showCards: function(cardsToShow) {
      cardsToShow.forEach(cardType => {
        const selector = cardSelectors[cardType];
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            element.style.display = '';
          }
        }
      });
    },
    
    // 重新检测并应用配置
    refresh: controlPageCards
  };
})();