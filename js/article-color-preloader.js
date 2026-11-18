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

  // 从文章链接中查找封面图片（支持穿透懒加载，过滤无效占位图）
  function findCoverImage(articleUrl) {
    // 尝试从相关文章卡片中找到封面图片
    const links = document.querySelectorAll('a[href="' + articleUrl + '"]');
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const container = link.closest('.recent-post-item, .related-post-item, .post-card');
      
      if (container) {
        const img = container.querySelector('img');
        if (img) {
          // 优先读取懒加载真实属性
          const realSrc = img.getAttribute('data-lazy-src') || 
                          img.getAttribute('data-src') || 
                          img.currentSrc || 
                          img.src;
          // 严格过滤 base64 占位图及包含 placeholder 的无效图片
          if (realSrc && !realSrc.startsWith('data:') && !realSrc.includes('placeholder')) {
            return realSrc;
          }
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

  // 提取主色调（高精度中心加权算法）
  function extractDominantColor(img) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      const colorCounts = {};
      const step = 2; // 密集采样提升特征色捕获能力
      const center = (size - 1) / 2;
      const maxDist = Math.sqrt(center * center * 2);
      
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const idx = (y * size + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const alpha = data[idx + 3];
          
          if (alpha < 200) continue;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const brightness = (r + g + b) / 3;
          
          // 排除过暗、过亮与低饱和背景色，聚焦画面中心与核心图案
          if (saturation > 0.18 && brightness > 45 && brightness < 235) {
            const dist = Math.sqrt((x - center) * (x - center) + (y - center) * (y - center));
            const centerWeight = 1.0 + 0.8 * (1.0 - dist / maxDist);
            const weight = Math.floor(Math.pow(saturation, 1.8) * brightness * centerWeight * 10);
            
            // 步长为16的精细分桶，避免不同主题色被粗粒度归并
            const groupedR = Math.floor(r / 16) * 16;
            const groupedG = Math.floor(g / 16) * 16;
            const groupedB = Math.floor(b / 16) * 16;
            
            const key = groupedR + ', ' + groupedG + ', ' + groupedB;
            colorCounts[key] = (colorCounts[key] || 0) + weight;
          }
        }
      }
      
      let maxWeight = 0;
      let dominantColor = null;
      
      for (const color in colorCounts) {
        if (colorCounts[color] > maxWeight) {
          maxWeight = colorCounts[color];
          dominantColor = color;
        }
      }
      
      return dominantColor; // 提取失败返回 null，严禁返回假默认色
    } catch (e) {
      return null;
    }
  }

  // 后台保存到缓存（防止写入坏死默认色）
  function saveToCacheBackground(articlePath, coverUrl, color) {
    if (!color || color === '61, 157, 242' || color === '61,157,242') return;
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

  // 清理缓存并剔除历史遗留的坏死默认色
  function cleanupCache() {
    try {
      const cacheKey = 'butterfly_article_colors';
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return;
      
      const cache = JSON.parse(cached);
      let modified = false;
      
      // 清除历史误写入的默认天蓝色条目
      for (const key in cache) {
        const itemColor = cache[key] && cache[key].color;
        if (!itemColor || itemColor === '61, 157, 242' || itemColor === '61,157,242') {
          delete cache[key];
          modified = true;
        }
      }
      
      // 如果缓存过大（超过100条），清理旧条目
      const entries = Object.entries(cache);
      if (entries.length > 100) {
        entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
        const newCache = {};
        entries.slice(0, 100).forEach(([key, value]) => {
          newCache[key] = value;
        });
        localStorage.setItem(cacheKey, JSON.stringify(newCache));
      } else if (modified) {
        localStorage.setItem(cacheKey, JSON.stringify(cache));
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