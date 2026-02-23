// 控制台输出过滤器 - 移除特定的库版本信息和deprecation警告
(function () {
  "use strict";

  // 保存原始的console方法
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  // 需要过滤的版本信息关键词和警告信息
  const filterKeywords = [
    "APlayer v",
    "MetingJS v",
    "天气图标系统已加载",
    "风向图标：普通风向使用旗帜🚩，特殊情况保持原图标",
    "[Deprecation]-ms-high-contrast",
    "Identifier 'isOnline' has already been declared",
    "SyntaxError: Identifier 'isOnline' has already been declared",
    "[Intervention]Images loaded lazily",
    "Load events are deferred",
    "[Intervention]Slow network is detected",
    "Fallback font will be used while loading",
    "Local Busuanzi: 初始化本地统计服务",
    "时钟容器未找到，跳过初始化",
    "控制台过滤器已启用",
    "已挂载butterfly_clock_anzhiyu",
    "qweatherapi.com",
    "fontawesome-free",
    "crossorigin attribute",
    "隐藏菜单",
    "显示菜单",
    // 移动端修复相关调试信息
    "移动端立即修复已启用",
    "移动端rightside修复已启用",
    "rightside定位已修复",
    "页面滚动已确保正常",
    "rightside元素未找到，启用DOM监听",
    "检测到viewport缩放变化",
    "正在请求地理位置权限",
    "地理位置获取成功",
    // 音乐播放器相关调试信息
    "音频缓冲中",
    "🎵 音乐播放器:",
    "🔄 无法提取颜色，保持默认背景",
    "🔄 检测到歌曲:",
    "🎨 开始提取新歌曲封面颜色",
    "🔄 无法提取颜色，保持当前背景",
    "🔄 相同歌曲，跳过颜色提取",
    "🚫 开始强制禁用歌词点击功能",
    "🚫 歌词点击被阻止",
    "🚫 歌词子元素点击被阻止",
    // 颜色系统调试信息
    "🔄 文章颜色预加载器启动",
    "🎨 预加载文章颜色:",
    "✅ 预加载完成:",
    "🎨 使用缓存颜色:",
    "🎨 应用默认背景色",
    "✅ 应用提取的颜色:",
    "✅ 颜色提取完成，使用默认颜色",
    "💾 颜色已缓存:",
    "🎨 文章颜色系统已加载",
    "🎨 已设置颜色:",
    "✅ 强制提取完成:",
    "🧹 缓存已优化，保留最新100条记录",
    // 时钟系统调试信息
    "手动重新初始化时钟",
    "时钟初始化完成",
    "时钟数据更新",
    "天气数据获取",
    "地理位置获取",
    // 首图处理调试信息
    "✅ 首图已隐藏:",
    "首图处理完成",
    "图片验证通过",
    "图片验证失败",
    // 音乐播放器调试信息
    "🔄 无法提取颜色，保持默认背景",
    "🔄 检测到歌曲:",
    "🎨 开始提取新歌曲封面颜色",
    "🔄 无法提取颜色，保持当前背景",
    "🔄 相同歌曲，跳过颜色提取",
    "🚫 开始强制禁用歌词点击功能",
    "🚫 歌词点击被阻止",
    "🚫 歌词子元素点击被阻止",
    "✅ 歌词点击禁用完成",
    "🚫 开始禁用进度条控制",
    "🚫 进度条点击被阻止",
    "🚫 进度条拖动被阻止",
    "✅ 进度条控制禁用完成",
    "❌ 无法提取颜色",
    "❌ 播放器未就绪",
    "✅ 播放器状态正常",
    "📋 播放器信息:",
    "🔄 强制重新应用当前颜色:",
    "⚠️ 没有保存的颜色",
    "✅ 手动强制恢复歌词点击功能",
    "✅ 歌词点击功能恢复完成",
    "✅ 手动强制恢复进度条控制功能",
    "✅ 进度条控制功能恢复完成",
    "🔍 检查歌词元素状态",
    "歌词容器元素数量:",
    "歌词段落元素数量:",
    "歌词容器",
    "歌词段落",
    "🔍 检查进度条元素状态",
    "进度条控制器元素数量:",
    "进度条元素数量:",
    "进度条控制器",
    "进度条",
    // 天气图标调试信息
    "🚩 风向图标映射测试",
    "天气图标系统已加载",
    "风向图标：普通风向使用旗帜",
    // 页面滚动调试信息
    "检测到内容详情页，禁用强制滚动定位",
    "✅ 歌词点击禁用完成",
    "🚫 开始禁用进度条控制",
    "🚫 进度条点击被阻止",
    "🚫 进度条拖动被阻止",
    "✅ 进度条控制禁用完成",
    "❌ 无法提取颜色",
    "❌ 播放器未就绪",
    "✅ 播放器状态正常",
    "📋 播放器信息:",
    "🔄 强制重新应用当前颜色",
    "⚠️ 没有保存的颜色",
    "✅ 手动强制恢复歌词点击功能",
    "✅ 歌词点击功能恢复完成",
    "✅ 手动强制恢复进度条控制功能",
    "✅ 进度条控制功能恢复完成",
    "🔍 检查歌词元素状态",
    "🔍 检查进度条元素状态",
    "🔍 手动检查歌曲切换",
    "🎨 发现新歌曲，开始提取颜色",
    "✅ 手动检查成功更新颜色",
    // 天气图标相关调试信息
    "🚩 风向图标映射测试",
    "天气图标系统已加载",
    "风向图标：普通风向使用旗帜🚩，特殊情况保持原图标",
    // 页面滚动相关调试信息
    "检测到内容详情页，禁用强制滚动定位",
    // 文章颜色缓存系统相关调试信息
    "🎨 文章颜色缓存系统已加载",
    "💡 调试工具: window.articleColorDebug",
    "🛠️ 颜色缓存管理工具已加载",
    "💡 使用 articleColorDebug.help() 查看帮助",
    "🎨 使用缓存颜色:",
    "🎨 颜色已由内联脚本处理，跳过外部处理",
    "💾 颜色已缓存:",
    "🧹 清理了",
    "🗑️ 所有颜色缓存已清除",
    "⏰ 颜色提取超时",
    "🔄 颜色分析失败:",
    "📷 图片加载失败:",
    "📄 文章无封面图，使用默认背景",
    "🎨 外部系统开始提取文章封面颜色",
    "✅ 外部系统颜色提取完成并已缓存",
    "🔄 外部系统使用默认颜色",
    "❌ 外部系统颜色提取失败:",
    "❌ 当前页面不是文章页",
    "❌ 文章无封面图",
    "🔄 强制重新提取颜色",
    "✅ 颜色重新提取完成:",
    "❌ 强制提取失败:",
    "🔍 检测到新封面，开始提取颜色",
    "🔧 检测到未处理的文章页面，启动备用处理",
    "🔄 开始批量重新提取",
    "📊 批量处理完成:",
    "✅ 成功导入",
    "❌ 导入失败:",
    "🗑️ 清除了文章",
    "🧹 缓存优化完成，清理了",
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
    /地理位置.*成功/,
    // 文章颜色缓存系统相关模式
    /🎨.*文章颜色缓存/,
    /💡.*调试工具/,
    /🛠️.*颜色缓存管理/,
    /🎨.*使用缓存颜色/,
    /🎨.*颜色已由.*处理/,
    /💾.*颜色已缓存/,
    /🧹.*清理了.*缓存/,
    /🗑️.*缓存已清除/,
    /⏰.*颜色提取超时/,
    /🔄.*颜色.*失败/,
    /📷.*图片加载失败/,
    /📄.*文章.*背景/,
    /🎨.*外部系统.*颜色/,
    /✅.*外部系统.*完成/,
    /❌.*外部系统.*失败/,
    /❌.*当前页面不是文章页/,
    /❌.*文章无封面图/,
    /🔄.*强制.*提取/,
    /✅.*颜色.*提取完成/,
    /❌.*强制.*失败/,
    /🔍.*检测到.*封面/,
    /🔧.*检测到.*文章页面/,
    /🔄.*批量.*提取/,
    /📊.*批量.*完成/,
    /✅.*成功导入/,
    /❌.*导入失败/,
    /🗑️.*清除了文章/,
    /🧹.*缓存优化.*清理/,
  ];

  // 通用过滤函数
  function shouldFilter(args) {
    const logString = args.join(" ");

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
    const logString = args.join(" ");

    // 只过滤明确知道是非关键的错误
    const nonCriticalErrors = ["qweatherapi.com", "fontawesome-free.*preload"];

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
