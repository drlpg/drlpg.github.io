/* 功能模块示例 - 展示如何使用动态导入 */

// 导出功能模块
const FeatureExample = {
  // 初始化函数
  init() {
    console.log('🚀 功能模块已加载并初始化');
    this.setupEventListeners();
  },

  // 设置事件监听器
  setupEventListeners() {
    // 示例：监听某个按钮点击
    document.addEventListener('click', (e) => {
      if (e.target.matches('.example-button')) {
        this.handleButtonClick(e);
      }
    });
  },

  // 处理按钮点击
  handleButtonClick(event) {
    console.log('按钮被点击了！');
    // 这里可以添加具体的功能逻辑
  }
};

// 如果是通过动态导入加载的，自动初始化
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeatureExample;
} else {
  // 浏览器环境下自动初始化
  FeatureExample.init();
}

// 使用示例：
// const loadFeature = async () => {
//   const module = await import('./feature-example.js');
//   module.init();
// };