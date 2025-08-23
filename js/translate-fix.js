/* 修复简繁切换功能，确保默认显示简体并且按钮状态正确 */

(function() {
  'use strict';
  
  // 在主题初始化之前清除localStorage中的繁体设置
  function resetToSimplified() {
    const targetEncodingCookie = 'translate-chn-cht';
    const savedEncoding = localStorage.getItem(targetEncodingCookie);
    
    // 如果保存的是繁体(1)，清除它，让页面默认显示简体
    if (savedEncoding === '1') {
      localStorage.removeItem(targetEncodingCookie);
      console.log('已重置为简体模式');
    }
  }
  
  // 立即执行重置
  resetToSimplified();
  
  // 等待DOM加载完成后修复按钮状态
  document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行，确保主题的初始化完成
    setTimeout(function() {
      const translateButton = document.getElementById('translateLink');
      if (!translateButton) return;
      
      // 检测当前页面的实际语言状态
      function detectCurrentLanguage() {
        // 检查几个关键元素的文字来判断当前语言
        const testElements = [
          document.querySelector('.card-info .site-data .headline'),
          document.querySelector('#page-header .site-title'),
          document.querySelector('.recent-post-item .post-meta-date-created'),
          document.querySelector('body')
        ];
        
        for (const element of testElements) {
          if (element && element.textContent) {
            const text = element.textContent;
            // 检查是否包含繁体字符
            if (/[個為國說時長來對會過還這裡頭樣讓從關門問題經驗學習實現應該種類別點內容標評論復製鏈接開關閉熱評深色模式轉繁體簡標籤]/.test(text)) {
              return 'traditional'; // 繁体
            }
            // 检查是否包含简体字符
            if (/[个为国说时长来对会过还这里头样让从关门问题经验学习实现应该种类别点内容标评论复制链接开关闭热评深色模式转繁体简标签]/.test(text)) {
              return 'simplified'; // 简体
            }
          }
        }
        
        // 默认返回简体
        return 'simplified';
      }
      
      // 修复按钮文字
      function fixButtonText() {
        const currentLang = detectCurrentLanguage();
        const config = window.GLOBAL_CONFIG?.translate;
        
        if (!config) return;
        
        if (currentLang === 'simplified') {
          // 当前是简体，按钮应该显示"繁"
          translateButton.textContent = config.msgToTraditionalChinese || '繁';
        } else {
          // 当前是繁体，按钮应该显示"简"
          translateButton.textContent = config.msgToSimplifiedChinese || '简';
        }
        
        console.log(`当前语言: ${currentLang}, 按钮文字: ${translateButton.textContent}`);
      }
      
      // 执行修复
      fixButtonText();
      
      // 监听页面变化（PJAX等）
      const observer = new MutationObserver(function(mutations) {
        let shouldFix = false;
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldFix = true;
          }
        });
        
        if (shouldFix) {
          setTimeout(fixButtonText, 100);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
    }, 500); // 延迟500ms执行
  });
  
})();