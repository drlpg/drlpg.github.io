// 热评弹窗功能
(function() {
  'use strict';

  let popupTimer = null;
  let currentPopup = null;
  let isPopupVisible = false;
  let isHotCommentEnabled = localStorage.getItem('hot-comment-enabled') !== 'false'; // 热评弹窗开关状态，默认开启
  let currentCommentElement = null; // 当前显示的评论元素

  // 获取评论数据
  function getComments() {
    const comments = [];
    
    // 尝试从Twikoo评论系统获取评论
    const twikooComments = document.querySelectorAll('.tk-comment');
    twikooComments.forEach(comment => {
      const authorEl = comment.querySelector('.tk-nick');
      const avatarEl = comment.querySelector('.tk-avatar img');
      const contentEl = comment.querySelector('.tk-content');
      
      if (authorEl && contentEl) {
        comments.push({
          author: authorEl.textContent.trim(),
          avatar: avatarEl ? avatarEl.src : '/img/default-avatar.svg',
          content: contentEl.textContent.trim(),
          element: comment // 保存评论元素的引用
        });
      }
    });

    // 如果没有Twikoo评论，尝试其他评论系统
    if (comments.length === 0) {
      // Valine评论系统
      const valineComments = document.querySelectorAll('.vcomment');
      valineComments.forEach(comment => {
        const authorEl = comment.querySelector('.vname');
        const avatarEl = comment.querySelector('.vimg img');
        const contentEl = comment.querySelector('.vcontent');
        
        if (authorEl && contentEl) {
          comments.push({
            author: authorEl.textContent.trim(),
            avatar: avatarEl ? avatarEl.src : '/img/default-avatar.svg',
            content: contentEl.textContent.trim(),
            element: comment // 保存评论元素的引用
          });
        }
      });
    }

    // 如果还是没有评论，尝试通用选择器
    if (comments.length === 0) {
      const genericComments = document.querySelectorAll('.comment-item, .comment, [class*="comment"]');
      genericComments.forEach(comment => {
        const authorEl = comment.querySelector('.author, .name, [class*="author"], [class*="name"]');
        const avatarEl = comment.querySelector('img[class*="avatar"], .avatar img, img[alt*="avatar"]');
        const contentEl = comment.querySelector('.content, .text, [class*="content"], [class*="text"]');
        
        if (authorEl && contentEl) {
          const content = contentEl.textContent.trim();
          if (content.length > 10) { // 过滤太短的内容
            comments.push({
              author: authorEl.textContent.trim(),
              avatar: avatarEl ? avatarEl.src : '/img/default-avatar.svg',
              content: content,
              element: comment // 保存评论元素的引用
            });
          }
        }
      });
    }

    // 如果没有评论，返回空数组（不显示弹窗）

    return comments;
  }

  // 创建弹窗HTML
  function createPopupHTML(comment) {
    return `
      <div class="hot-comment-popup" id="hotCommentPopup">
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
    // 检查热评弹窗是否被禁用
    if (!isHotCommentEnabled) {
      return;
    }

    const comments = getComments();
    if (comments.length === 0) return;

    // 随机选择一条评论
    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    
    // 保存当前评论元素的引用
    currentCommentElement = randomComment.element;
    
    // 创建弹窗
    const popupHTML = createPopupHTML(randomComment);
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    currentPopup = document.getElementById('hotCommentPopup');
    isPopupVisible = true;

    // 显示动画
    setTimeout(() => {
      if (currentPopup) {
        currentPopup.classList.add('show');
      }
    }, 10);

    console.log('热评弹窗已显示:', randomComment.author);
  }

  // 滚动到评论位置
  function scrollToComment() {
    if (currentCommentElement) {
      // 关闭弹窗
      closeHotCommentPopup();
      
      // 滚动到评论位置
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
    // 永久关闭热评弹窗
    isHotCommentEnabled = false;
    localStorage.setItem('hot-comment-enabled', 'false');
    
    closeHotCommentPopup();
    
    // 停止定时器
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
    
    console.log('热评弹窗已永久关闭，可通过右键菜单重新开启');
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
      }, 300);
    }
  }

  // 启动热评弹窗定时器
  function startHotCommentTimer() {
    // 检查热评弹窗是否被禁用
    if (!isHotCommentEnabled) {
      return;
    }

    // 清除现有定时器
    if (popupTimer) {
      clearTimeout(popupTimer);
    }

    // 连续弹出模式：无延迟切换
    const showNextPopup = () => {
      if (!isHotCommentEnabled) {
        return;
      }
      
      // 先关闭当前弹窗（如果有）
      if (isPopupVisible) {
        closeHotCommentPopup();
      }
      
      // 立即显示下一个弹窗
      setTimeout(() => {
        if (!isHotCommentEnabled) {
          return;
        }
        
        showHotCommentPopup();
        
        // 3秒后立即切换到下一个弹窗
        popupTimer = setTimeout(() => {
          showNextPopup();
        }, 3000);
      }, 50); // 50ms的微小延迟确保DOM更新
    };

    // 页面加载后3秒开始第一次显示
    setTimeout(() => {
      showNextPopup();
    }, 3000);
  }

  // 停止热评弹窗定时器
  function stopHotCommentTimer() {
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
    closeHotCommentPopup();
  }

  // 检查是否在文章页面
  function isPostPage() {
    return document.querySelector('#post-comment, .comments, #comments, .post-content, .article-content') !== null;
  }

  // 初始化
  function init() {
    // 只在文章页面启用热评弹窗
    if (!isPostPage()) {
      return;
    }

    // 等待页面完全加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startHotCommentTimer);
    } else {
      startHotCommentTimer();
    }

    // 页面隐藏时停止定时器
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopHotCommentTimer();
      } else if (isPostPage()) {
        startHotCommentTimer();
      }
    });

    // 页面卸载时清理
    window.addEventListener('beforeunload', stopHotCommentTimer);
  }

  // 切换热评弹窗状态
  function toggleHotCommentPopup() {
    isHotCommentEnabled = !isHotCommentEnabled;
    
    // 保存状态到localStorage
    localStorage.setItem('hot-comment-enabled', isHotCommentEnabled.toString());
    
    if (isHotCommentEnabled) {
      // 启用热评弹窗
      console.log('热评弹窗已启用');
      startHotCommentTimer();
    } else {
      // 禁用热评弹窗
      console.log('热评弹窗已禁用');
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

  console.log('热评弹窗功能已加载');
})();