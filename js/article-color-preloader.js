/**
 * 文章颜色预加载器 - 后台缓存管理
 * 功能：预加载其他文章的颜色，优化用户体验
 */

(function() {
  'use strict';

  // 等待页面完全加载后再执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000); // 延迟1秒，避免影响页面性能
  }

  function init() {
    // 只在文章页面运行
    if (!document.getElementById('page-header') || 
        !document.getElementById('page-header').classList.contains('post-bg')) {
      return;
    }

    // 预加载器静默启动
    
    // 预加载相关文章的颜色
    preloadRelatedArticles();
    
    // 清理过期缓存（如果需要）
    cleanupCache();
  }

  // 预加载相关文章颜色
  function preloadRelatedArticles() {
    // 查找页面中的文章链接
    const articleLinks = document.querySelectorAll('a[href*="/posts/"], .recent-post-item a, .related-post-item a');
    const processedUrls = new Set();
    
    articleLinks.forEach(function(link, index) {
      // 限制预加载数量，避免影响性能
      if (index >= 5) return;
      
      const href = link.getAttribute('href');
      if (!href || processedUrls.has(href)) return;
      
      processedUrls.add(href);
      
      // 延迟预加载，避免阻塞
      setTimeout(function() {
        preloadArticleColor(href);
      }, (index + 1) * 2000); // 每2秒处理一个
    });
  }

  // 预加载单个文章的颜色
  function preloadArticleColor(articleUrl) {
    // 检查是否已有缓存
    const articlePath = new URL(articleUrl, window.location.origin).pathname;
    
    try {
      const cached = localStorage.getItem('butterfly_article_colors');
      const cache = cached ? JSON.parse(cached) : {};
      
      // 如果已有缓存，跳过
      for (const key in cache) {
        if (cache[key].articlePath === articlePath) {
          return;
        }
      }
      
      // 尝试从页面中找到封面图片
      const coverImg = findCoverImage(articleUrl);
      if (coverImg) {
        extractColorForArticle(articlePath, coverImg);
      }
      
    } catch (error) {
      // 静默处理预加载错误
    }
  }

  // 从文章链接中查找封面图片
  function findCoverImage(articleUrl) {
    // 尝试从相关文章卡片中找到封面图片
    const links = document.querySelectorAll('a[href="' + articleUrl + '"]');
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const container = link.closest('.recent-post-item, .related-post-item, .post-card');
      
      if (container) {
        const img = container.querySelector('img');
        if (img && img.src) {
          return img.src;
        }
      }
    }
    
    return null;
  }

  // 为文章提取颜色
  function extractColorForArticle(articlePath, coverUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeoutId = setTimeout(function() {
      // 静默处理超时
    }, 8000);
    
    img.onload = function() {
      clearTimeout(timeoutId);
      
      try {
        const color = extractDominantColor(img);
        if (color) {
          saveToCacheBackground(articlePath, coverUrl, color);
        }
      } catch (error) {
        // 静默处理提取错误
      }
    };
    
    img.onerror = function() {
      clearTimeout(timeoutId);
    };
    
    // 使用CORS代理
    const corsProxyUrl = coverUrl.replace('r2.lpblog.dpdns.org', 'cors.lpblog.dpdns.org');
    img.src = corsProxyUrl;
  }

  // 提取主色调
  function extractDominantColor(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    const colorCounts = {};
    const step = 8;
    
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      if (alpha < 200) continue;
      
      if ((r >= 240 && g >= 240 && b >= 240) || 
          (r <= 20 && g <= 20 && b <= 20)) {
        continue;
      }
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const brightness = (r + g + b) / 3;
      
      if (saturation > 0.15 && brightness > 30 && brightness < 220) {
        const groupedR = Math.floor(r / 20) * 20;
        const groupedG = Math.floor(g / 20) * 20;
        const groupedB = Math.floor(b / 20) * 20;
        
        const key = groupedR + ',' + groupedG + ',' + groupedB;
        const weight = Math.floor(saturation * brightness / 10);
        colorCounts[key] = (colorCounts[key] || 0) + weight;
      }
    }
    
    let maxWeight = 0;
    let dominantColor = '61, 157, 242';
    
    for (const color in colorCounts) {
      if (colorCounts[color] > maxWeight) {
        maxWeight = colorCounts[color];
        dominantColor = color;
      }
    }
    
    return dominantColor;
  }

  // 后台保存到缓存
  function saveToCacheBackground(articlePath, coverUrl, color) {
    try {
      const cacheKey = 'butterfly_article_colors';
      const cached = localStorage.getItem(cacheKey);
      const cache = cached ? JSON.parse(cached) : {};
      
      // 生成缓存键
      const pathKey = articlePath.replace(/\/$/, '');
      let hash = 0;
      const str = coverUrl || '';
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const articleCacheKey = pathKey + '#' + Math.abs(hash).toString(36);
      
      cache[articleCacheKey] = {
        color: color,
        timestamp: Date.now(),
        articlePath: articlePath,
        coverUrl: coverUrl
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      // 静默处理缓存保存错误
    }
  }

  // 清理缓存（可选）
  function cleanupCache() {
    try {
      const cached = localStorage.getItem('butterfly_article_colors');
      if (!cached) return;
      
      const cache = JSON.parse(cached);
      const cacheSize = JSON.stringify(cache).length;
      
      // 如果缓存过大（超过1MB），清理一些旧条目
      if (cacheSize > 1024 * 1024) {
        const entries = Object.entries(cache);
        entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
        
        // 保留最新的100条
        const newCache = {};
        entries.slice(0, 100).forEach(([key, value]) => {
          newCache[key] = value;
        });
        
        localStorage.setItem('butterfly_article_colors', JSON.stringify(newCache));
      }
    } catch (error) {
      // 静默处理缓存清理错误
    }
  }

  // PJAX支持
  document.addEventListener('pjax:complete', function() {
    setTimeout(init, 1000);
  });

})();