// 控制台输出过滤器 - 移除特定的库版本信息和deprecation警告
(function() {
  'use strict';
  
  // 保存原始的console方法
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // 需要过滤的版本信息关键词和警告信息
  const filterKeywords = [
    'APlayer v',
    'MetingJS v',
    '已挂载butterfly_clock_anzhiyu',
    '[Deprecation]-ms-high-contrast',
    'Identifier \'isOnline\' has already been declared',
    'SyntaxError: Identifier \'isOnline\' has already been declared',
    '[Intervention]Images loaded lazily',
    'Load events are deferred',
    '[Intervention]Slow network is detected',
    'Fallback font will be used while loading',
    'Local Busuanzi: 初始化本地统计服务',
    '时钟容器未找到，跳过初始化',
    '控制台过滤器已启用'
  ];
  
  // 通用过滤函数
  function shouldFilter(args) {
    const logString = args.join(' ');
    for (let keyword of filterKeywords) {
      if (logString.includes(keyword)) {
        return true;
      }
    }
    return false;
  }
  
  // 重写console.log
  console.log = function(...args) {
    if (!shouldFilter(args)) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  // 重写console.warn
  console.warn = function(...args) {
    if (!shouldFilter(args)) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  // 重写console.error
  console.error = function(...args) {
    if (!shouldFilter(args)) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // 防止脚本被多次加载
  if (window.consoleFilterLoaded) return;
  window.consoleFilterLoaded = true;
  
  // 静默初始化，不输出任何信息
})();
