// 热评弹窗功能
(function() {
  'use strict';

  let popupTimer = null;
  let currentPopup = null;
  let isPopupVisible = false;
  let isHotCommentEnabled = localStorage.getItem('hot-comment-enabled') !== 'false';
  let isTimerRunning = false;
  let currentCommentElement = null;
  let currentCommentIndex = 0; // 添加索引追踪

  // 获取评论数据
  function getComments() {
    const comments = [];
    
    // 尝试从Twikoo评论系统获取评论
    const twikooComments = document.querySelectorAll('.tk-comment');
    
    twikooComments.forEach((comment) => {
      const authorEl = comment.querySelector('.tk-nick');
      const avatarEl = comment.querySelector('.tk-avatar img');
      const contentEl = comment.querySelector('.tk-content');
      const timeEl = comment.querySelector('.tk-time');
      
      if (authorEl && contentEl) {
        const content = contentEl.textContent.trim();
        
        if (content.length > 1) {
          // 获取时间戳，用于排序
          let timestamp = Date.now(); // 默认当前时间
          if (timeEl) {
            const timeText = timeEl.textContent || timeEl.getAttribute('datetime');
            const parsedTime = new Date(timeText);
            if (!isNaN(parsedTime.getTime())) {
              timestamp = parsedTime.getTime();
            }
          }
          
          comments.push({
            author: authorEl.textContent.trim(),
            avatar: avatarEl ? avatarEl.src : '/img/default-avatar.svg',
            content: content,
            element: comment,
            timestamp: timestamp
          });
        }
      }
    });

    // 如果没有Twikoo评论，尝试Valine评论系统
    if (comments.length === 0) {
      const valineComments = document.querySelectorAll('.vcomment');
      
      valineComments.forEach((comment) => {
        const authorEl = comment.querySelector('.vname');
        const avatarEl = comment.querySelector('.vimg img');
        const contentEl = comment.querySelector('.vcontent');
        const timeEl = comment.querySelector('.vtime');
        
        if (authorEl && contentEl) {
          const content = contentEl.textContent.trim();
          if (content.length > 1) {
            // 获取时间戳，用于排序
            let timestamp = Date.now(); // 默认当前时间
            if (timeEl) {
              const timeText = timeEl.textContent || timeEl.getAttribute('datetime');
              const parsedTime = new Date(timeText);
              if (!isNaN(parsedTime.getTime())) {
                timestamp = parsedTime.getTime();
              }
            }
            
            comments.push({
              author: authorEl.textContent.trim(),
              avatar: avatarEl ? avatarEl.src : '/img/default-avatar.svg',
              content: content,
              element: comment,
              timestamp: timestamp
            });
          }
        }
      });
    }

    // 如果还是没有评论，尝试通用选择器
    if (comments.length === 0) {
      const genericSelectors = [
        '.comment-item', '.comment', '[class*="comment"]',
        '.reply', '.message', '.post-comment',
        '.user-comment', '.blog-comment'
      ];
      
      genericSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((comment) => {
          const authorSelectors = ['.author', '.name', '[class*="author"]', '[class*="name"]', '.user', '.nick'];
          const contentSelectors = ['.content', '.text', '[class*="content"]', '[class*="text"]', '.message', '.body'];
          
          let authorEl = null;
          let contentEl = null;
          
          for (let authSel of authorSelectors) {
            authorEl = comment.querySelector(authSel);
            if (authorEl) break;
          }
          
          for (let contSel of contentSelectors) {
            contentEl = comment.querySelector(contSel);
            if (contentEl) break;
          }
          
          if (authorEl && contentEl) {
            const content = contentEl.textContent.trim();
            if (content.length > 1) {
              // 通用选择器情况下，使用元素在DOM中的位置作为时间戳（越靠前越新）
              const allComments = Array.from(document.querySelectorAll(selector));
              const index = allComments.indexOf(comment);
              const timestamp = Date.now() - index * 1000; // 越靠前的评论时间戳越大
              
              comments.push({
                author: authorEl.textContent.trim(),
                avatar: '/img/default-avatar.svg',
                content: content,
                element: comment,
                timestamp: timestamp
              });
            }
          }
        });
      });
    }

    // 过滤重复的评论
    const uniqueComments = [];
    const seenContents = new Set();
    
    comments.forEach(comment => {
      if (!seenContents.has(comment.content)) {
        seenContents.add(comment.content);
        uniqueComments.push(comment);
      }
    });

    // 按时间戳降序排序（最新的在前面）
    uniqueComments.sort((a, b) => b.timestamp - a.timestamp);

    return uniqueComments;
  }

  // 判断内容是否需要两行显示
  function needsTwoLines(content) {
    // 更精确的估算：考虑弹窗宽度270px，减去左右padding 32px，实际内容宽度238px
    // 14px字体大小下，中文字符约14px宽，英文字符约7px宽
    // 一行大约可以显示17个中文字符或34个英文字符
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = content.length - chineseChars;
    const estimatedWidth = chineseChars + (otherChars * 0.5);
    
    return estimatedWidth > 17; // 超过17个字符宽度就使用两行
  }

  // 创建弹窗HTML
  function createPopupHTML(comment) {
    const twoLinesClass = needsTwoLines(comment.content) ? ' two-lines' : '';
    
    return `
      <div class="hot-comment-popup${twoLinesClass}" id="hotCommentPopup">
        <div class="hot-comment-header">
          <div class="hot-comment-title">
            <span class="hot-comment-title-text" onclick="scrollToComment()">评论</span>
            <span class="hot-comment-author">${escapeHtml(comment.author)}</span>
          </div>
          <div class="hot-comment-close">
            <img class="hot-comment-avatar" src="${comment.avatar}" alt="头像" onerror="this.src='/img/default-avatar.svg'">
            <button class="hot-comment-close-btn" onclick="manualCloseHotCommentPopup()">×</button>
          </div>
        </div>
        <div class="hot-comment-divider"></div>
        <div class="hot-comment-content" onclick="scrollToComment()">
          ${escapeHtml(comment.content)}
        </div>
      </div>
    `;
  }

  // HTML转义函数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 显示热评弹窗
  function showHotCommentPopup() {
    if (!isHotCommentEnabled || isPopupVisible) {
      return;
    }

    const comments = getComments();
    
    if (comments.length === 0) {
      return;
    }

    // 按顺序选择评论（从最新开始）
    const selectedComment = comments[currentCommentIndex % comments.length];
    currentCommentIndex++; // 移动到下一条评论
    
    // 保存当前评论元素的引用
    currentCommentElement = selectedComment.element;
    
    // 移除可能存在的旧弹窗
    const existingPopup = document.getElementById('hotCommentPopup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    // 创建弹窗
    const popupHTML = createPopupHTML(selectedComment);
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    currentPopup = document.getElementById('hotCommentPopup');
    isPopupVisible = true;

    if (currentPopup) {
      setTimeout(() => {
        if (currentPopup) {
          currentPopup.classList.add('show');
        }
      }, 10);
    } else {
      isPopupVisible = false;
    }
  }

  // 滚动到评论位置
  function scrollToComment() {
    if (currentCommentElement) {
      closeHotCommentPopup();
      
      setTimeout(() => {
        currentCommentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        // 高亮显示评论
        currentCommentElement.style.transition = 'all 0.3s ease';
        currentCommentElement.style.backgroundColor = 'rgba(24, 144, 255, 0.1)';
        currentCommentElement.style.borderRadius = '8px';
        
        // 2秒后移除高亮
        setTimeout(() => {
          currentCommentElement.style.backgroundColor = '';
          currentCommentElement.style.borderRadius = '';
        }, 2000);
      }, 100);
    }
  }

  // 手动关闭热评弹窗（永久关闭）
  function manualCloseHotCommentPopup() {
    isHotCommentEnabled = false;
    localStorage.setItem('hot-comment-enabled', 'false');
    
    closeHotCommentPopup();
    stopHotCommentTimer();
  }

  // 关闭热评弹窗
  function closeHotCommentPopup() {
    if (currentPopup && isPopupVisible) {
      currentPopup.classList.remove('show');
      currentPopup.classList.add('slide-out');
      
      setTimeout(() => {
        if (currentPopup && currentPopup.parentNode) {
          currentPopup.parentNode.removeChild(currentPopup);
        }
        currentPopup = null;
        currentCommentElement = null;
        isPopupVisible = false;
      }, 200);
    }
  }

  // 启动热评弹窗定时器
  function startHotCommentTimer() {
    if (isTimerRunning || !isHotCommentEnabled) {
      return;
    }

    isTimerRunning = true;

    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }

    // 主循环函数
    const mainLoop = () => {
      if (!isHotCommentEnabled || !isTimerRunning) {
        return;
      }
      
      const comments = getComments();
      
      if (comments.length > 0) {
        if (isPopupVisible) {
          closeHotCommentPopup();
          setTimeout(() => {
            if (isHotCommentEnabled && isTimerRunning) {
              showHotCommentPopup();
              popupTimer = setTimeout(mainLoop, 10000); // 改为10秒
            }
          }, 250);
        } else {
          showHotCommentPopup();
          popupTimer = setTimeout(mainLoop, 10000); // 改为10秒
        }
      } else {
        popupTimer = setTimeout(mainLoop, 2000);
      }
    };

    // 智能检测：如果立即检测到评论就显示，否则等待评论加载
    const comments = getComments();
    if (comments.length > 0) {
      popupTimer = setTimeout(mainLoop, 0);
    } else {
      popupTimer = setTimeout(mainLoop, 500);
    }
  }

  // 停止热评弹窗定时器
  function stopHotCommentTimer() {
    isTimerRunning = false;
    
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
    closeHotCommentPopup();
  }

  // 检查是否在文章页面
  function isPostPage() {
    const postSelectors = [
      '#post-comment', '.comments', '#comments', 
      '.post-content', '.article-content', '.post',
      '.article', '#article', '.content', '#content',
      'main', '.main', '#main'
    ];
    
    return postSelectors.some(selector => document.querySelector(selector));
  }

  // 初始化
  function init() {
    // 从localStorage读取状态，如果不存在则默认启用
    const savedStatus = localStorage.getItem('hot-comment-enabled');
    if (savedStatus === null) {
      isHotCommentEnabled = true;
      localStorage.setItem('hot-comment-enabled', 'true');
    } else {
      isHotCommentEnabled = savedStatus !== 'false';
    }

    // 等待页面完全加载后启动（仅在启用时）
    const startTimer = () => {
      if (isHotCommentEnabled) {
        startHotCommentTimer();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(startTimer, 100);
      });
    } else {
      setTimeout(startTimer, 100);
    }

    // 页面隐藏时停止定时器
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopHotCommentTimer();
      } else if (isPostPage() && !isTimerRunning) {
        setTimeout(() => {
          startHotCommentTimer();
        }, 1000);
      }
    });

    // 页面卸载时清理
    window.addEventListener('beforeunload', stopHotCommentTimer);
  }

  // 切换热评弹窗状态
  function toggleHotCommentPopup() {
    isHotCommentEnabled = !isHotCommentEnabled;
    localStorage.setItem('hot-comment-enabled', isHotCommentEnabled.toString());
    
    if (isHotCommentEnabled) {
      if (!isTimerRunning) {
        startHotCommentTimer();
      }
    } else {
      stopHotCommentTimer();
    }
    
    return isHotCommentEnabled;
  }

  // 获取热评弹窗状态
  function getHotCommentStatus() {
    return isHotCommentEnabled;
  }

  // 全局函数，供HTML和其他脚本调用
  window.closeHotCommentPopup = closeHotCommentPopup;
  window.manualCloseHotCommentPopup = manualCloseHotCommentPopup;
  window.scrollToComment = scrollToComment;
  window.toggleHotCommentPopup = toggleHotCommentPopup;
  window.getHotCommentStatus = getHotCommentStatus;

  // 启动
  init();
})();