// CDN资源加载失败时的备用方案
(function() {
    'use strict';
    
    // 检测资源加载失败并提供备用方案
    function handleResourceError(event) {
        const target = event.target;
        const tagName = target.tagName.toLowerCase();
        
        if (tagName === 'link' && target.rel === 'stylesheet') {
            // 只记录真正重要的CSS加载失败
            if (!target.href.includes('qweatherapi.com')) {
                console.warn('CSS资源加载失败:', target.href);
            }
        } else if (tagName === 'script') {
            // 只记录真正重要的JS加载失败
            if (!target.src.includes('qweatherapi.com')) {
                console.warn('JS资源加载失败:', target.src);
            }
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
        // 移除失效的字体文件引用
        style.textContent = `
            /* 天气图标已改用Emoji，无需字体文件 */
        `;
        document.head.appendChild(style);
    }
    
    // 预加载逻辑已移至HTML head部分，避免重复preload警告
})();
