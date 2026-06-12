// FontAwesome 优化加载脚本
(function() {
    'use strict';
    
    // 防止重复执行
    if (window.fontAwesomeLoaded) return;
    window.fontAwesomeLoaded = true;
    
    // 创建 FontAwesome 样式链接
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css';
    link.crossOrigin = 'anonymous';
    
    // 添加到 head 的最前面，确保优先加载
    document.head.insertBefore(link, document.head.firstChild);
})();