// 开发者工具欢迎信息
(function () {
  "use strict";

  // ASCII艺术字 - DRAN BLOG
  const asciiArt = `
 ____  ____      _    _   _       ____  _     ___   ____ 
|  _ \\|  _ \\    / \\  | \\ | |     | __ )| |   / _ \\ / ___|
| | | | |_) |  / _ \\ |  \\| |     |  _ \\| |  | | | | |  _ 
| |_| |  _ <  / ___ \\| |\\  |     | |_) | |__| |_| | |_| |
|____/|_| \\_\\/_/   \\_\\_| \\_|     |____/|_____\\___/ \\____|
  `;

  // 样式配置
  const styles = {
    title:
      "color: #3D9DF2; font-size: 14px; font-weight: bold; font-family: monospace;",
    info: "color: #999; font-size: 12px;",
    success: "color: #999; font-size: 11px;",
    warning: "color: #999; font-size: 11px;",
    link: "color: #999; font-size: 12px; text-decoration: underline;",
    highlight: "color: #3D9DF2; font-weight: bold; font-size: 12px;",
    normal: "color: #999; font-size: 12px;",
    emoji: "font-size: 16px;",
    separator: "color: #999; font-size: 12px;",
  };

  // 获取当前年份
  const currentYear = new Date().getFullYear();

  // 获取当前日期（月-日格式）
  function getCurrentDate() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return `${month}-${day}`;
  }

  // 获取博客运行天数
  function getRunningDays() {
    const startDate = new Date("2024-12-20");
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // 显示欢迎信息
  function showWelcome() {
    // 显示ASCII艺术字
    console.log("%c" + asciiArt, styles.title);

    console.log(
      "%c\n已上线 %c" +
        getRunningDays() +
        " %c天" +
        "\n\n%c©" +
        currentYear +
        " By %cDran" +
        "\n\n%c⚡Powered by %cHexo %c你正在访问 %cDran %c的博客。" +
        "\n\n%c⚠️ W" +
        getCurrentDate() +
        " %c你已打开控制台。",
      styles.info,
      styles.highlight,
      styles.info,
      styles.info,
      styles.highlight,
      styles.warning,
      styles.highlight,
      styles.normal,
      styles.highlight,
      styles.normal,
      styles.warning,
      styles.normal
    );
  }

  // 创建全局blog对象，提供交互功能
  window.blog = {
    welcome: function () {
      showWelcome();
    },

    info: function () {
      console.log(
        "%c📊 博客信息",
        "color: #3D9DF2; font-size: 14px; font-weight: bold;"
      );
      console.log("");
      console.table({
        博客名称: "Dran Blog",
        作者: "Dran",
        建站时间: "2024-12-20",
        运行天数: getRunningDays() + " 天",
        框架: "Hexo",
        主题: "Butterfly",
        许可证: "CC-BY-NC-SA & GPL",
      });
    },

    stats: function () {
      console.log(
        "%c📈 博客统计",
        "color: #4CAF50; font-size: 14px; font-weight: bold;"
      );
      console.log("");

      // 获取页面统计信息
      const postCount =
        document.querySelectorAll(".recent-post-item").length || "加载中...";
      const categoryCount =
        document.querySelectorAll(".card-category-list-item").length ||
        "加载中...";
      const tagCount =
        document.querySelectorAll(".card-tag-cloud a").length || "加载中...";

      console.table({
        文章数: postCount,
        分类数: categoryCount,
        标签数: tagCount,
        评论系统: "Twikoo",
        访问统计: "不蒜子",
      });
    },

    theme: function () {
      console.log(
        "%c🎨 主题信息",
        "color: #3D9DF2; font-size: 14px; font-weight: bold;"
      );
      console.log("");
      console.table({
        主题名称: "Butterfly",
        主题作者: "JerryC",
        主题版本: "4.x",
        主题色: "#3D9DF2",
        暗色模式: "支持",
        响应式: "支持",
      });
      console.log("");
      console.log(
        "%c主题仓库: %chttps://github.com/jerryc127/hexo-theme-butterfly",
        "color: #999; font-size: 12px;",
        "color: #3D9DF2; font-size: 12px; text-decoration: underline;"
      );
    },
  };

  // 立即显示欢迎信息（置顶）
  showWelcome();
})();
