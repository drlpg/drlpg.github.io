// 创建新的 <style> 元素
const style = document.createElement('style');
document.head.appendChild(style);

// 添加或覆盖 @keyframes 动画规则
style.sheet.insertRule(`
  @keyframes oml2d-stage-slide-in {
    from {
      transform: translateY(150%);
    }
    to {
      transform: translateY(0%);
    }
  }
`, style.sheet.cssRules.length);

style.sheet.insertRule(`
  @keyframes oml2d-stage-slide-out {
    from {
      transform: translateY(0%);
    }
    to {
      transform: translateY(150%);
    }
  }
`, style.sheet.cssRules.length);