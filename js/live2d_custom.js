document.addEventListener('DOMContentLoaded', function() {
  function fixLive2dContainer() {
    const stage = document.getElementById('oml2d-stage');
    if (stage) {
      stage.style.position = 'fixed';
      stage.style.bottom = '64px';
      stage.style.left = '5px';
      stage.style.pointerEvents = 'none';
      stage.style.width = '180px';
      stage.style.height = '200px';
      stage.style.margin = '0';
      stage.style.padding = '0';
      stage.style.zIndex = '7';
      stage.style.right = 'auto';
      
      // 添加舞台区域的鼠标事件处理
      stage.addEventListener('mouseleave', function() {
        const menus = document.getElementById('oml2d-menus');
        if (menus) {
          setTimeout(function() {
            if (!stage.matches(':hover') && !menus.matches(':hover')) {
              menus.classList.remove('show');
            }
          }, 300); // 300ms延迟
        }
      });
    }
    
    const canvas = document.getElementById('oml2d-canvas');
    if (canvas) {
      // 确保画布可以接收鼠标事件，让模型在舞台内居中
      canvas.style.pointerEvents = 'auto';
      canvas.style.position = 'relative';
      // 移除任何可能影响模型居中的样式
      canvas.style.left = '';
      canvas.style.top = '';
      canvas.style.transform = '';
    }
    
    const menus = document.getElementById('oml2d-menus');
    if (menus) {
      // 菜单定位在模型右侧中部
      menus.style.position = 'fixed';
      menus.style.bottom = '10px';
      menus.style.left = '180px';
      menus.style.right = 'auto';
      menus.style.pointerEvents = 'auto';
      
      // 添加菜单区域的鼠标事件处理
      menus.addEventListener('mouseenter', function() {
        menus.classList.add('show');
        menus.style.visibility = 'visible';
        menus.style.opacity = '1';
      });
      
      // 延迟隐藏菜单，给用户时间移动鼠标
      let hideTimeout;
      menus.addEventListener('mouseleave', function() {
        hideTimeout = setTimeout(function() {
          if (!stage.matches(':hover') && !menus.matches(':hover')) {
            menus.classList.remove('show');
          }
        }, 300); // 300ms延迟
      });
      
      // 如果鼠标重新进入，取消隐藏
      menus.addEventListener('mouseenter', function() {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
      });
    }
    
    const tips = document.getElementById('oml2d-tips');
    if (tips) {
      const isMobile = window.innerWidth <= 768;
      const style = isMobile ? {
        width: '140px',
        height: '70px',
        left: 'calc(50% - 5px)',
        top: '-85px'
      } : {
        width: '160px',
        height: '80px',
        left: 'calc(50% - 5px)',
        top: '-95px'
      };

      Object.assign(tips.style, style);

    }
  }
  
  // 立即执行一次
  fixLive2dContainer();
  
  // 使用 MutationObserver 监听 DOM 变化，确保 Live2D 元素被正确处理
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // 元素节点
            if (node.id && node.id.includes('oml2d')) {
              fixLive2dContainer();
            }
            // 检查子元素
            const oml2dElements = node.querySelectorAll && node.querySelectorAll('[id*="oml2d"]');
            if (oml2dElements && oml2dElements.length > 0) {
              fixLive2dContainer();
            }
          }
        });
      }
    });
  });
  
  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 延迟执行，确保 Live2D 完全加载后再次修复
  setTimeout(fixLive2dContainer, 1000);
  setTimeout(fixLive2dContainer, 3000);
});

// 创建新的 <style> 元素来添加动画
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
// 
增强菜单交互逻辑
function enhanceMenuInteraction() {
  const stage = document.getElementById('oml2d-stage');
  const menus = document.getElementById('oml2d-menus');
  
  if (!stage || !menus) return;
  
  let menuHideTimer = null;
  
  // 显示菜单的函数
  function showMenu() {
    if (menuHideTimer) {
      clearTimeout(menuHideTimer);
      menuHideTimer = null;
    }
    menus.classList.add('show');
    menus.style.visibility = 'visible';
    menus.style.opacity = '1';
  }
  
  // 隐藏菜单的函数（带延迟）
  function hideMenu() {
    menuHideTimer = setTimeout(() => {
      menus.classList.remove('show');
    }, 500); // 500ms延迟，给用户足够时间移动鼠标
  }
  
  // 舞台鼠标事件
  stage.addEventListener('mouseenter', showMenu);
  stage.addEventListener('mouseleave', hideMenu);
  
  // 菜单鼠标事件
  menus.addEventListener('mouseenter', showMenu);
  menus.addEventListener('mouseleave', hideMenu);
  
  // 为菜单项添加点击事件确保可交互
  const menuItems = menus.querySelectorAll('.oml2d-menus-item');
  menuItems.forEach(item => {
    item.style.pointerEvents = 'auto';
    item.style.cursor = 'pointer';
  });
}

// 延迟执行菜单交互增强
setTimeout(enhanceMenuInteraction, 2000);
setTimeout(enhanceMenuInteraction, 5000);