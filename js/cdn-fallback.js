// CDN资源加载失败时的备用方案
(function() {
    'use strict';
    
    // 检测资源加载失败并提供备用方案
    function handleResourceError(event) {
        const target = event.target;
        const tagName = target.tagName.toLowerCase();
        
        if (tagName === 'link' && target.rel === 'stylesheet') {
            console.warn('CSS资源加载失败:', target.href);
            // 可以在这里添加本地备用CSS的逻辑
        } else if (tagName === 'script') {
            console.warn('JS资源加载失败:', target.src);
            // 可以在这里添加本地备用JS的逻辑
        }
    }
    
    // 监听资源加载错误
    document.addEventListener('error', handleResourceError, true);
    
    // 防止content_script相关错误影响页面
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && 
            event.reason.message.includes('fetchError')) {
            console.warn('拦截fetchError:', event.reason);
            event.preventDefault();
        }
    });
    
    // 优化字体加载
    if ('fontDisplay' in document.documentElement.style) {
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: "qweather-icons";
                src: url("https://cdn.jsdelivr.net/npm/hexo-butterfly-clock-anzhiyu@1.0.0/lib/fonts/qweather-icons.woff2") format("woff2");
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 预加载关键资源
    function preloadCriticalResources() {
        const resources = [
            'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
            'https://cdn.jsdelivr.net/npm/hexo-butterfly-clock-anzhiyu@1.0.0/lib/fonts/qweather-icons.woff2'
        ];
        
        resources.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = url.endsWith('.css') ? 'style' : 'font';
            link.href = url;
            if (url.includes('font')) {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }
    
    // DOM加载完成后预加载资源
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preloadCriticalResources);
    } else {
        preloadCriticalResources();
    }
})();
