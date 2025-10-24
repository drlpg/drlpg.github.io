// 热评弹窗功能
(function () {
  "use strict";

  // ========== 配置区域 ==========
  // 移动端热评弹窗开关：true=启用，false=禁用
  const ENABLE_MOBILE_HOT_COMMENT = false;
  // ==============================

  // 检测是否为移动设备
  function isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      window.innerWidth <= 768 ||
      "ontouchstart" in window
    );
  }

  // 移动端禁用检查
  if (!ENABLE_MOBILE_HOT_COMMENT && isMobileDevice()) {
    return;
  }

  let popupTimer = null;
  let currentPopup = null;
  let isPopupVisible = false;
  let isHotCommentEnabled =
    localStorage.getItem("hot-comment-enabled") !== "false";
  let isTimerRunning = false;
  let currentCommentElement = null;
  let currentCommentIndex = 0; // 添加索引追踪

  // 检测是否为博主评论
  function isBloggerComment(comment) {
    // 检查是否有博主标识类名
    return comment.classList.contains("tk-admin") || 
           comment.classList.contains("master") ||
           comment.classList.contains("admin") ||
           comment.querySelector(".tk-tag-green") !== null;
  }

  // 获取评论数据
  function getComments() {
    const comments = [];

    // 尝试从Twikoo评论系统获取评论
    const twikooComments = document.querySelectorAll(".tk-comment");

    twikooComments.forEach((comment) => {
      const authorEl = comment.querySelector(".tk-nick");
      const avatarEl = comment.querySelector(".tk-avatar img");
      const contentEl = comment.querySelector(".tk-content");
      const timeEl = comment.querySelector(".tk-time");

      if (authorEl && contentEl) {
        const content = contentEl.textContent.trim();

        if (content.length > 1) {
          // 获取时间戳，用于排序
          let timestamp = Date.now(); // 默认当前时间
          if (timeEl) {
            const timeText =
              timeEl.textContent || timeEl.getAttribute("datetime");
            const parsedTime = new Date(timeText);
            if (!isNaN(parsedTime.getTime())) {
              timestamp = parsedTime.getTime();
            }
          }

          comments.push({
            author: authorEl.textContent.trim(),
            avatar: avatarEl ? avatarEl.src : "/img/default-avatar.svg",
            content: content,
            element: comment,
            timestamp: timestamp,
            isBlogger: isBloggerComment(comment),
          });
        }
      }
    });

    // 如果没有Twikoo评论，尝试Valine评论系统
    if (comments.length === 0) {
      const valineComments = document.querySelectorAll(".vcomment");

      valineComments.forEach((comment) => {
        const authorEl = comment.querySelector(".vname");
        const avatarEl = comment.querySelector(".vimg img");
        const contentEl = comment.querySelector(".vcontent");
        const timeEl = comment.querySelector(".vtime");

        if (authorEl && contentEl) {
          const content = contentEl.textContent.trim();
          if (content.length > 1) {
            // 获取时间戳，用于排序
            let timestamp = Date.now(); // 默认当前时间
            if (timeEl) {
              const timeText =
                timeEl.textContent || timeEl.getAttribute("datetime");
              const parsedTime = new Date(timeText);
              if (!isNaN(parsedTime.getTime())) {
                timestamp = parsedTime.getTime();
              }
            }

            comments.push({
              author: authorEl.textContent.trim(),
              avatar: avatarEl ? avatarEl.src : "/img/default-avatar.svg",
              content: content,
              element: comment,
              timestamp: timestamp,
            });
          }
        }
      });
    }

    // 如果还是没有评论，尝试通用选择器
    if (comments.length === 0) {
      const genericSelectors = [
        ".comment-item",
        ".comment",
        '[class*="comment"]',
        ".reply",
        ".message",
        ".post-comment",
        ".user-comment",
        ".blog-comment",
      ];

      genericSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);

        elements.forEach((comment) => {
          const authorSelectors = [
            ".author",
            ".name",
            '[class*="author"]',
            '[class*="name"]',
            ".user",
            ".nick",
          ];
          const contentSelectors = [
            ".content",
            ".text",
            '[class*="content"]',
            '[class*="text"]',
            ".message",
            ".body",
          ];

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
              const allComments = Array.from(
                document.querySelectorAll(selector)
              );
              const index = allComments.indexOf(comment);
              const timestamp = Date.now() - index * 1000; // 越靠前的评论时间戳越大

              comments.push({
                author: authorEl.textContent.trim(),
                avatar: "/img/default-avatar.svg",
                content: content,
                element: comment,
                timestamp: timestamp,
              });
            }
          }
        });
      });
    }

    // 过滤重复的评论
    const uniqueComments = [];
    const seenContents = new Set();

    comments.forEach((comment) => {
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
    const estimatedWidth = chineseChars + otherChars * 0.5;

    return estimatedWidth > 17; // 超过17个字符宽度就使用两行
  }

  // 创建弹窗HTML
  function createPopupHTML(comment) {
    const twoLinesClass = needsTwoLines(comment.content) ? " two-lines" : "";
    const bloggerClass = comment.isBlogger ? " blogger" : "";

    return `
      <div class="hot-comment-popup${twoLinesClass}${bloggerClass}" id="hotCommentPopup">
        <div class="hot-comment-header">
          <div class="hot-comment-title">
            <span class="hot-comment-title-text${bloggerClass}" onclick="scrollToComment()">${comment.isBlogger ? '博主' : '评论'}</span>
            <span class="hot-comment-author">${escapeHtml(
              comment.author
            )}</span>
          </div>
          <div class="hot-comment-close">
            <img class="hot-comment-avatar" src="${
              comment.avatar
            }" alt="头像" onerror="this.src='/img/default-avatar.svg'">
            <button class="hot-comment-close-btn" onclick="manualCloseHotCommentPopup()">
              <i class="fa fa-times"></i>
            </button>
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
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 检查滚动位置并调整弹窗位置
  function adjustPopupPosition() {
    if (!currentPopup || !isPopupVisible) {
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const distanceToBottom = documentHeight - (scrollTop + windowHeight);

    // 当距离底部小于等于100px时，弹窗上移90px；大于100px时回到原位置
    if (distanceToBottom <= 100) {
      currentPopup.style.bottom = "90px";
    } else {
      currentPopup.style.bottom = "20px";
    }
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

    // 强制移除可能存在的旧弹窗（包括正在动画的）
    const existingPopup = document.getElementById("hotCommentPopup");
    if (existingPopup) {
      existingPopup.remove();
    }

    // 确保currentPopup被清空
    currentPopup = null;

    // 创建弹窗
    const popupHTML = createPopupHTML(selectedComment);
    document.body.insertAdjacentHTML("beforeend", popupHTML);

    currentPopup = document.getElementById("hotCommentPopup");

    if (currentPopup) {
      isPopupVisible = true; // 在确认弹窗存在后再设置

      // 使用requestAnimationFrame确保DOM更新后再添加动画类
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (currentPopup) {
            currentPopup.classList.add("show");
            adjustPopupPosition(); // 初始位置调整
          }
        });
      });
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
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }

  // 手动关闭热评弹窗（永久关闭）
  function manualCloseHotCommentPopup() {
    isHotCommentEnabled = false;
    localStorage.setItem("hot-comment-enabled", "false");

    closeHotCommentPopup();
    stopHotCommentTimer();
  }

  // 关闭热评弹窗
  function closeHotCommentPopup() {
    if (currentPopup && isPopupVisible) {
      currentPopup.classList.remove("show");
      currentPopup.classList.add("slide-out");
      isPopupVisible = false; // 立即设置为false，防止竞态条件

      setTimeout(() => {
        if (currentPopup && currentPopup.parentNode) {
          currentPopup.parentNode.removeChild(currentPopup);
        }
        currentPopup = null;
        currentCommentElement = null;
      }, 500); // 500ms后移除DOM
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
          }, 600); // 增加到600ms，确保关闭动画完全结束后再显示新弹窗
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

  // 检查是否有评论区（适用于所有带评论的页面）
  function hasCommentSection() {
    // 检查各种评论系统的容器
    const commentSelectors = [
      "#post-comment",
      ".comments",
      "#comments",
      ".tk-comments-container",
      ".vcomments",
      ".twikoo",
      ".valine",
      ".comment",
      ".gitalk-container",
      ".utterances",
      ".disqus-thread",
      ".artalk",
      ".waline",
      ".giscus",
      ".comment-hot",
    ];

    return commentSelectors.some((selector) =>
      document.querySelector(selector)
    );
  }

  // 立即检查并关闭弹窗（如果没有评论区）
  function checkAndClosePopup() {
    const hasComments = hasCommentSection();

    if (!hasComments && (isPopupVisible || isTimerRunning)) {
      stopHotCommentTimer();
    }
  }

  // 初始化
  function init() {
    // 从localStorage读取状态，如果不存在则默认启用
    const savedStatus = localStorage.getItem("hot-comment-enabled");
    if (savedStatus === null) {
      isHotCommentEnabled = true;
      localStorage.setItem("hot-comment-enabled", "true");
    } else {
      isHotCommentEnabled = savedStatus !== "false";
    }

    // 立即检查当前页面状态
    checkAndClosePopup();

    // 监听滚动事件，调整弹窗位置
    window.addEventListener("scroll", adjustPopupPosition);

    // 等待页面完全加载后启动（仅在启用时且有评论区）
    const startTimer = () => {
      if (isHotCommentEnabled && hasCommentSection()) {
        startHotCommentTimer();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(startTimer, 1000); // 增加延迟到1秒
      });
    } else {
      setTimeout(startTimer, 1000); // 增加延迟到1秒
    }

    // 页面隐藏时停止定时器
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopHotCommentTimer();
      } else if (hasCommentSection() && !isTimerRunning) {
        setTimeout(() => {
          startHotCommentTimer();
        }, 1000);
      }
    });

    // 监听页面路由变化（PJAX导航）
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;

        // URL变化时，立即检查页面状态
        checkAndClosePopup();

        // 延迟检查是否需要启动定时器（给页面内容加载时间）
        setTimeout(() => {
          if (hasCommentSection() && isHotCommentEnabled && !isTimerRunning) {
            startHotCommentTimer();
          }
        }, 1500); // 增加延迟到1.5秒
      }
    };

    // 使用MutationObserver监听DOM变化来检测页面切换
    const observer = new MutationObserver(() => {
      checkUrlChange();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 监听popstate事件（浏览器前进后退）
    window.addEventListener("popstate", () => {
      setTimeout(checkUrlChange, 100);
    });

    // 监听pushstate和replacestate（PJAX导航）
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(history, arguments);
      setTimeout(checkUrlChange, 100);
    };

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      setTimeout(checkUrlChange, 100);
    };

    // 页面卸载时清理
    window.addEventListener("beforeunload", stopHotCommentTimer);
  }

  // 切换热评弹窗状态
  function toggleHotCommentPopup() {
    isHotCommentEnabled = !isHotCommentEnabled;
    localStorage.setItem("hot-comment-enabled", isHotCommentEnabled.toString());

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
