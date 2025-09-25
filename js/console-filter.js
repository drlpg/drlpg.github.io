// 控制台输出过滤器 - 移除特定的库版本信息和deprecation警告
(function () {
  'use strict';

  // 保存原始的console方法
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  // 需要过滤的版本信息关键词和警告信息
  const filterKeywords = [
    'APlayer v',
    'MetingJS v',
    '天气图标系统已加载',
    '风向图标：普通风向使用旗帜🚩，特殊情况保持原图标',
    '[Deprecation]-ms-high-contrast',
    'Identifier \'isOnline\' has already been declared',
    'SyntaxError: Identifier \'isOnline\' has already been declared',
    '[Intervention]Images loaded lazily',
    'Load events are deferred',
    '[Intervention]Slow network is detected',
    'Fallback font will be used while loading',
    'Local Busuanzi: 初始化本地统计服务',
    '时钟容器未找到，跳过初始化',
    '控制台过滤器已启用',
    '已挂载butterfly_clock_anzhiyu',
    'qweatherapi.com',
    'fontawesome-free',
    'crossorigin attribute',
    '隐藏菜单',
    '显示菜单',
    // 移动端修复相关调试信息
    '移动端立即修复已启用',
    '移动端rightside修复已启用',
    'rightside定位已修复',
    '页面滚动已确保正常',
    'rightside元素未找到，启用DOM监听',
    '检测到viewport缩放变化',
    '正在请求地理位置权限',
    '地理位置获取成功',
    // 音乐播放器相关调试信息
    '🎵 音乐播放器:',
    '🔄 无法提取颜色，保持默认背景',
    '🔄 检测到歌曲:',
    '🎨 开始提取新歌曲封面颜色',
    '🔄 无法提取颜色，保持当前背景',
    '🔄 相同歌曲，跳过颜色提取',
    '🚫 开始强制禁用歌词点击功能',
    '🚫 歌词点击被阻止',
    '🚫 歌词子元素点击被阻止',
    '✅ 歌词点击禁用完成',
    '🚫 开始禁用进度条控制',
    '🚫 进度条点击被阻止',
    '🚫 进度条拖动被阻止',
    '✅ 进度条控制禁用完成',
    '❌ 无法提取颜色',
    '❌ 播放器未就绪',
    '✅ 播放器状态正常',
    '📋 播放器信息:',
    '🔄 强制重新应用当前颜色',
    '⚠️ 没有保存的颜色',
    '✅ 手动强制恢复歌词点击功能',
    '✅ 歌词点击功能恢复完成',
    '✅ 手动强制恢复进度条控制功能',
    '✅ 进度条控制功能恢复完成',
    '🔍 检查歌词元素状态',
    '🔍 检查进度条元素状态',
    '🔍 手动检查歌曲切换',
    '🎨 发现新歌曲，开始提取颜色',
    '✅ 手动检查成功更新颜色',
    // 天气图标相关调试信息
    '🚩 风向图标映射测试',
    '天气图标系统已加载',
    '风向图标：普通风向使用旗帜🚩，特殊情况保持原图标',
    // 页面滚动相关调试信息
    '检测到内容详情页，禁用强制滚动定位'
  ];

  // 需要过滤的正则表达式模式
  const filterPatterns = [
    /JS资源加载失败.*qweatherapi\.com/,
    /was preloaded using link preload but not used within a few seconds/,
    /request credentials mode does not match/,
    /The resource.*fontawesome.*was preloaded/,
    /A preload for.*fontawesome.*is found/,
    /A preload for.*fontawesome.*but is not used because the request credentials mode does not match/,
    /fontawesome-free.*css.*was preloaded.*but not used/,
    /Consider taking a look at crossorigin attribute/,
    // 移动端修复相关模式
    /移动端.*修复.*启用/,
    /rightside.*修复/,
    /页面滚动.*正常/,
    /检测到.*缩放变化/,
    // 音乐播放器相关模式
    /🎵.*音乐播放器/,
    /🔄.*提取颜色/,
    /🎨.*歌曲.*颜色/,
    /🚫.*点击.*阻止/,
    /✅.*功能.*完成/,
    /❌.*播放器/,
    /📋.*播放器信息/,
    /🔍.*检查.*状态/,
    // 天气相关模式
    /🚩.*风向图标/,
    /天气图标.*加载/,
    // 地理位置相关模式
    /地理位置.*权限/,
    /地理位置.*成功/
  ];

  // 通用过滤函数
  function shouldFilter(args) {
    const logString = args.join(' ');

    // 检查关键词过滤
    for (let keyword of filterKeywords) {
      if (logString.includes(keyword)) {
        return true;
      }
    }

    // 检查正则表达式过滤
    for (let pattern of filterPatterns) {
      if (pattern.test(logString)) {
        return true;
      }
    }

    return false;
  }

  // 重写console.log
  console.log = function (...args) {
    if (!shouldFilter(args)) {
      originalConsoleLog.apply(console, args);
    }
  };

  // 重写console.warn
  console.warn = function (...args) {
    if (!shouldFilter(args)) {
      originalConsoleWarn.apply(console, args);
    }
  };

  // 重写console.error - 对错误信息更加谨慎，只过滤明确的非关键错误
  console.error = function (...args) {
    const logString = args.join(' ');

    // 只过滤明确知道是非关键的错误
    const nonCriticalErrors = [
      'qweatherapi.com',
      'fontawesome-free.*preload'
    ];

    let shouldFilterError = false;
    for (let pattern of nonCriticalErrors) {
      if (logString.includes(pattern) || new RegExp(pattern).test(logString)) {
        shouldFilterError = true;
        break;
      }
    }

    if (!shouldFilterError) {
      originalConsoleError.apply(console, args);
    }
  };

  // 防止脚本被多次加载
  if (window.consoleFilterLoaded) return;
  window.consoleFilterLoaded = true;

  // 静默初始化，不输出任何信息
})();
