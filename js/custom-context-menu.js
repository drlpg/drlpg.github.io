// 自定义右键菜单功能
(function () {
  "use strict";

  let contextMenu = null;
  let rightClickTarget = null;

  // ==================== 移动端检测和禁用 ====================
  function isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      window.innerWidth <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }

  function initMobileDisable() {
    if (isMobileDevice()) {
      // 禁用长按触发自定义菜单
      document.addEventListener(
        "touchstart",
        function (e) {
          if (e.touches.length > 1) return;

          const touch = e.touches[0];
          const target = touch.target;

          target.setAttribute("data-mobile-touch", "true");

          if (window.mobileContextMenuTimer) {
            clearTimeout(window.mobileContextMenuTimer);
          }

          window.mobileContextMenuTimer = setTimeout(() => {
            target.removeAttribute("data-mobile-touch");
          }, 500);
        },
        { passive: true }
      );

      // 保留文本选择功能
      document.body.style.webkitUserSelect = "text";
      document.body.style.userSelect = "text";
      document.body.style.webkitTouchCallout = "default";
    }
  }

  // 立即初始化移动端禁用
  initMobileDisable();

  // 获取点击的链接元素
  function getClickedLink() {
    if (!rightClickTarget) return null;

    if (rightClickTarget.tagName === "A") {
      return rightClickTarget;
    }

    const parentLink = rightClickTarget.closest("a");
    return parentLink;
  }

  // 获取点击的图片元素
  function getClickedImage() {
    if (!rightClickTarget) return null;

    if (rightClickTarget.tagName === "IMG") {
      return rightClickTarget;
    }

    const parentImage = rightClickTarget.closest("img");
    return parentImage;
  }

  // 检测是否有选中的文字
  function hasSelectedText() {
    const selection = window.getSelection();
    return selection && selection.toString().trim().length > 0;
  }

  // 获取选中的文字
  function getSelectedText() {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : "";
  }

  // 检测当前页面是否为繁体
  function isTraditionalChinese() {
    // 首先检查localStorage中的设置（最可靠的持久化状态）
    const savedEncoding = btf.saveToLocal.get("translate-chn-cht");
    if (savedEncoding === "1") {
      return true; // 繁体
    } else if (savedEncoding === "2") {
      return false; // 简体
    }

    // 检查HTML的lang属性
    const htmlLang = document.documentElement.lang;
    if (htmlLang === "zh-TW") {
      return true;
    } else if (htmlLang === "zh-CN") {
      return false;
    }

    // 检查繁简转换按钮的状态
    const translateButton = document.getElementById("translateLink");
    if (translateButton) {
      const buttonText = translateButton.textContent.trim();
      // 如果按钮显示"繁"，说明当前是简体，可以切换到繁体
      // 如果按钮显示"簡"或"简"，说明当前是繁体，可以切换到简体
      if (buttonText === "繁") {
        return false; // 当前是简体
      } else if (buttonText === "簡" || buttonText === "简") {
        return true; // 当前是繁体
      }
    }

    // 如果以上都无法确定，检查页面内容中的关键字符
    const testElements = [
      document.querySelector("h1"),
      document.querySelector(".post-title"),
      document.querySelector("#site-title"),
      document.querySelector(".card-announcement .item-headline"),
    ];

    for (let element of testElements) {
      if (element && element.textContent) {
        const text = element.textContent;
        // 检查几个明显的繁体字符
        if (
          /[個為國說時長來對會過還這裡頭樣讓從關門問題經驗學習實現應該種類別點內容標評論復製鏈接開關閉熱評深色模式轉繁體簡]/.test(
            text
          )
        ) {
          return true;
        }
      }
    }

    return false; // 默认为简体
  }

  // 检查是否有评论区
  function hasCommentSection() {
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

  // 检查是否有评论内容
  function hasCommentContent() {
    // 检查是否显示"没有评论"的提示
    const noCommentTexts = [
      "没有评论",
      "暂无评论",
      "沒有評論",
      "暫無評論",
      "No comments",
      "No Comments",
      "还没有评论",
      "還沒有評論",
      "快来抢沙发",
      "快來搶沙發",
    ];

    // 检查评论区域是否显示"没有评论"
    const commentContainer = document.querySelector(
      "#post-comment, .comments, #comments, .tk-comments-container, .vcomments, .twikoo, .valine"
    );
    if (commentContainer) {
      const containerText = commentContainer.textContent || "";
      // 如果找到"没有评论"相关文本，返回false
      if (noCommentTexts.some((text) => containerText.includes(text))) {
        return false;
      }
    }

    // 检查Twikoo评论
    const twikooComments = document.querySelectorAll(".tk-comment");
    if (twikooComments.length > 0) {
      return true;
    }

    // 检查Valine评论
    const valineComments = document.querySelectorAll(".vcomment");
    if (valineComments.length > 0) {
      return true;
    }

    // 检查通用评论选择器
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

    for (let selector of genericSelectors) {
      const elements = document.querySelectorAll(selector);
      // 过滤掉评论容器本身，只检查实际的评论内容
      for (let element of elements) {
        const hasContent = element.querySelector(
          ".content, .text, .message, .body, [class*='content'], [class*='text']"
        );
        if (hasContent && hasContent.textContent.trim().length > 0) {
          return true;
        }
      }
    }

    // 如果评论区存在但没有找到评论内容，可能还在加载中
    // 此时返回true，避免在加载过程中隐藏菜单项
    if (hasCommentSection()) {
      // 检查是否有加载指示器
      const loadingIndicators = document.querySelectorAll(
        '.loading, .spinner, [class*="loading"], [class*="spinner"]'
      );
      if (loadingIndicators.length > 0) {
        return true; // 正在加载，暂时显示菜单项
      }
    }

    return false;
  }

  // 生成默认菜单内容（空白区域）
  function generateDefaultMenuContent() {
    // 获取热评弹窗状态
    const isHotCommentEnabled =
      typeof window.getHotCommentStatus === "function"
        ? window.getHotCommentStatus()
        : localStorage.getItem("hot-comment-enabled") !== "false";

    // 检查是否有评论区和评论内容
    const hasComments = hasCommentSection() && hasCommentContent();

    // 获取繁简转换状态
    let translateText, translateIcon;
    const isTraditional = isTraditionalChinese();

    if (isTraditional) {
      // 当前是繁体，显示"转为简体"（用简体字显示）
      translateText = "转为简体";
      // 图标直接在HTML中设置
    } else {
      // 当前是简体，显示"轉為繁體"（用繁体字显示）
      translateText = "轉為繁體";
      // 图标直接在HTML中设置
    }

    // 获取深色模式状态
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    let darkModeText, darkModeIcon;
    if (isTraditional) {
      darkModeText = isDark ? "淺色模式" : "深色模式";
    } else {
      darkModeText = isDark ? "浅色模式" : "深色模式";
    }
    // 图标直接在HTML中设置

    // 根据当前语言设置菜单文字
    let menuTexts;
    if (isTraditional) {
      menuTexts = {
        randomPost: "隨便逛逛",
        categories: "博客分類",
        tags: "文章標籤",
        privacy: "隱私協議",
        copyright: "版權協議",
        copyUrl: "複製地址",
        toggleComments: isHotCommentEnabled ? "關閉熱評" : "開啟熱評",
      };
    } else {
      menuTexts = {
        randomPost: "随便逛逛",
        categories: "博客分类",
        tags: "文章标签",
        privacy: "隐私协议",
        copyright: "版权协议",
        copyUrl: "复制地址",
        toggleComments: isHotCommentEnabled ? "关闭热评" : "开启热评",
      };
    }

    return `
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="random-post">
        <i class="fa fa-podcast"></i>
        <span>${menuTexts.randomPost}</span>
      </a>
      <a href="/categories/" class="custom-context-menu-item" data-action="categories">
        <i class="fa fa-folder-open"></i>
        <span>${menuTexts.categories}</span>
      </a>
      <a href="/tags/" class="custom-context-menu-item" data-action="tags">
        <i class="fa fa-tag"></i>
        <span>${menuTexts.tags}</span>
      </a>
      <div class="custom-context-menu-separator"></div>
      <a href="/privacy/" class="custom-context-menu-item" data-action="privacy">
        <i class="fa fa-user-secret"></i>
        <span>${menuTexts.privacy}</span>
      </a>
      <a href="/copyright/" class="custom-context-menu-item" data-action="copyright">
        <i class="fa fa-creative-commons"></i>
        <span>${menuTexts.copyright}</span>
      </a>
      <div class="custom-context-menu-separator"></div>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="copy-url">
        <i class="fa fa-external-link"></i>
        <span>${menuTexts.copyUrl}</span>
      </a>
      ${
        hasComments
          ? `<a href="javascript:void(0)" class="custom-context-menu-item" data-action="toggle-comments">
        <i class="fa fa-comment"></i>
        <span>${menuTexts.toggleComments}</span>
      </a>`
          : ""
      }
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="toggle-dark-mode">
        <i class="fa fa-adjust"></i>
        <span>${darkModeText}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="translate">
        <i class="${isTraditional ? "fa fa-language" : "fa fa-language"}"></i>
        <span>${translateText}</span>
      </a>
    `;
  }

  // 生成文字菜单内容（选中文字）
  function generateTextMenuContent() {
    const isTraditional = isTraditionalChinese();
    const selectedText = getSelectedText();

    let textMenuTexts;
    if (isTraditional) {
      textMenuTexts = {
        copyText: "複製選中文本",
        quoteComment: "引用到評論",
        siteSearch: "站內搜索",
        baiduSearch: "百度搜索",
        privacy: "隱私協議",
        copyright: "版權協議",
      };
    } else {
      textMenuTexts = {
        copyText: "复制选中文本",
        quoteComment: "引用到评论",
        siteSearch: "站内搜索",
        baiduSearch: "百度搜索",
        privacy: "隐私协议",
        copyright: "版权协议",
      };
    }

    return `
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="copy-selected-text">
        <i class="fa fa-copy"></i>
        <span>${textMenuTexts.copyText}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="quote-to-comment">
        <i class="fa fa-plus"></i>
        <span>${textMenuTexts.quoteComment}</span>
      </a>
      <div class="custom-context-menu-separator"></div>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="site-search">
        <i class="fa fa-search"></i>
        <span>${textMenuTexts.siteSearch}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="baidu-search">
        <i class="fa fa-paw"></i>
        <span>${textMenuTexts.baiduSearch}</span>
      </a>
      <div class="custom-context-menu-separator"></div>
      <a href="/privacy/" class="custom-context-menu-item" data-action="privacy">
        <i class="fa fa-user-secret"></i>
        <span>${textMenuTexts.privacy}</span>
      </a>
      <a href="/copyright/" class="custom-context-menu-item" data-action="copyright">
        <i class="fa fa-creative-commons"></i>
        <span>${textMenuTexts.copyright}</span>
      </a>
    `;
  }

  // 生成图片菜单内容（图片区域）
  function generateImageMenuContent() {
    const isTraditional = isTraditionalChinese();

    let imageMenuTexts;
    if (isTraditional) {
      imageMenuTexts = {
        copyImage: "複製此圖片",
        downloadImage: "下載此圖片",
        privacy: "隱私協議",
        copyright: "版權協議",
      };
    } else {
      imageMenuTexts = {
        copyImage: "复制此图片",
        downloadImage: "下载此图片",
        privacy: "隐私协议",
        copyright: "版权协议",
      };
    }

    return `
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="copy-image">
        <i class="fa fa-copy"></i>
        <span>${imageMenuTexts.copyImage}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="download-image">
        <i class="fa fa-download"></i>
        <span>${imageMenuTexts.downloadImage}</span>
      </a>
      <div class="custom-context-menu-separator"></div>
      <a href="/privacy/" class="custom-context-menu-item" data-action="privacy">
        <i class="fa fa-user-secret"></i>
        <span>${imageMenuTexts.privacy}</span>
      </a>
      <a href="/copyright/" class="custom-context-menu-item" data-action="copyright">
        <i class="fa fa-creative-commons"></i>
        <span>${imageMenuTexts.copyright}</span>
      </a>
    `;
  }

  // 生成链接菜单内容（链接区域）
  function generateLinkMenuContent() {
    const isTraditional = isTraditionalChinese();

    let linkTexts;
    if (isTraditional) {
      linkTexts = {
        openNewTab: "新窗口打開",
        copyLink: "複製鏈接地址",
        privacy: "隱私協議",
        copyright: "版權協議",
      };
    } else {
      linkTexts = {
        openNewTab: "新窗口打开",
        copyLink: "复制链接地址",
        privacy: "隐私协议",
        copyright: "版权协议",
      };
    }

    return `
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="open-new-tab">
        <i class="fa fa-external-link"></i>
        <span>${linkTexts.openNewTab}</span>
      </a>
      <a href="javascript:void(0)" class="custom-context-menu-item" data-action="copy-link">
        <i class="fa fa-link"></i>
        <span>${linkTexts.copyLink}</span>
      </a>
      <div class="custom-context-menu-separator"></div>
      <a href="/privacy/" class="custom-context-menu-item" data-action="privacy">
        <i class="fa fa-user-secret"></i>
        <span>${linkTexts.privacy}</span>
      </a>
      <a href="/copyright/" class="custom-context-menu-item" data-action="copyright">
        <i class="fa fa-creative-commons"></i>
        <span>${linkTexts.copyright}</span>
      </a>
    `;
  }

  // 创建右键菜单HTML
  function createContextMenu() {
    const isTraditional = isTraditionalChinese();

    let navTitles;
    if (isTraditional) {
      navTitles = {
        back: "後退",
        forward: "前進",
        refresh: "刷新",
        up: "向上",
      };
    } else {
      navTitles = {
        back: "后退",
        forward: "前进",
        refresh: "刷新",
        up: "向上",
      };
    }

    const menuHTML = `
      <div class="custom-context-menu" id="customContextMenu">
        <div class="context-menu-nav-buttons">
          <button class="context-menu-nav-button" data-action="go-back" data-tooltip="${navTitles.back}">
            <i class="fa fa-arrow-left"></i>
          </button>
          <button class="context-menu-nav-button" data-action="go-forward" data-tooltip="${navTitles.forward}">
            <i class="fa fa-arrow-right"></i>
          </button>
          <button class="context-menu-nav-button" data-action="refresh" data-tooltip="${navTitles.refresh}">
            <i class="fa fa-refresh"></i>
          </button>
          <button class="context-menu-nav-button" data-action="go-up" data-tooltip="${navTitles.up}">
            <i class="fa fa-arrow-up"></i>
          </button>
        </div>
        <div class="context-menu-content" id="contextMenuContent">
          <!-- 动态内容将在这里插入 -->
        </div>
      </div>
    `;

    // 创建独立的悬停提示框
    const tooltipHTML = `<div class="nav-button-tooltip" id="navTooltip"></div>`;

    document.body.insertAdjacentHTML("beforeend", menuHTML);
    document.body.insertAdjacentHTML("beforeend", tooltipHTML);
    contextMenu = document.getElementById("customContextMenu");
  }

  // 更新菜单内容
  function updateMenuContent() {
    const contentContainer = document.getElementById("contextMenuContent");
    if (!contentContainer) return;

    const clickedLink = getClickedLink();
    const clickedImage = getClickedImage();
    const hasText = hasSelectedText();

    if (hasText) {
      // 有选中文字时显示文字菜单
      contentContainer.innerHTML = generateTextMenuContent();
    } else if (clickedImage) {
      // 点击图片时显示图片菜单
      contentContainer.innerHTML = generateImageMenuContent();
    } else if (clickedLink) {
      // 点击链接时显示链接菜单
      contentContainer.innerHTML = generateLinkMenuContent();
    } else {
      // 默认菜单
      contentContainer.innerHTML = generateDefaultMenuContent();
    }

    bindMenuEvents();
  }

  // 绑定菜单事件
  function bindMenuEvents() {
    if (!contextMenu) return;

    // 直接为每个菜单项绑定事件
    const menuItems = contextMenu.querySelectorAll(".custom-context-menu-item");
    const navButtons = contextMenu.querySelectorAll(".context-menu-nav-button");

    menuItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const action = this.getAttribute("data-action");

        // 立即隐藏菜单
        hideContextMenu();

        // 延迟执行动作
        setTimeout(() => {
          handleMenuAction(action);
        }, 100);
      });
    });

    navButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const action = this.getAttribute("data-action");

        // 立即隐藏菜单
        hideContextMenu();

        // 延迟执行动作
        setTimeout(() => {
          handleNavAction(action);
        }, 100);
      });

      // 添加悬停提示事件
      button.addEventListener("mouseenter", function (e) {
        showNavTooltip(this);
      });

      button.addEventListener("mouseleave", function (e) {
        hideNavTooltip();
      });
    });
  }

  // 处理导航按钮动作
  function handleNavAction(action) {
    switch (action) {
      case "go-back":
        if (window.history.length > 1) {
          window.history.back();
        } else {
          showNotification("没有可返回的页面");
        }
        break;
      case "go-forward":
        window.history.forward();
        break;
      case "refresh":
        window.location.reload();
        break;
      case "go-up":
        // 回到页面顶部
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        break;
    }
  }

  // 处理菜单动作
  function handleMenuAction(action) {
    switch (action) {
      case "open-new-tab":
        const targetLink = getClickedLink();
        if (targetLink) {
          window.open(targetLink.href, "_blank");
          showNotification("已在新窗口打开链接");
        } else {
          window.open(window.location.href, "_blank");
          showNotification("已在新窗口打开页面");
        }
        break;

      case "copy-link":
        const clickedLink = getClickedLink();
        if (clickedLink) {
          copyToClipboard(clickedLink.href);
          showCopySuccessNotification("已复制链接地址");
        } else {
          copyToClipboard(window.location.href);
          showCopySuccessNotification("已复制本页链接地址");
        }
        break;

      case "copy-url":
        copyToClipboard(window.location.href);
        showCopySuccessNotification("已复制本页链接地址");
        break;

      case "random-post":
        if (typeof btf !== "undefined" && btf.randomPost) {
          btf.randomPost();
        } else {
          const pages = ["/archives/", "/categories/", "/tags/", "/about/"];
          const randomPage = pages[Math.floor(Math.random() * pages.length)];
          window.location.href = randomPage;
        }
        break;

      case "categories":
        window.location.href = "/categories/";
        break;

      case "tags":
        window.location.href = "/tags/";
        break;

      case "privacy":
        window.location.href = "/privacy/";
        break;

      case "copyright":
        window.location.href = "/copyright/";
        break;

      case "toggle-comments":
        if (typeof window.toggleHotCommentPopup === "function") {
          const newStatus = window.toggleHotCommentPopup();
          const isTraditional = isTraditionalChinese();
          const statusText = newStatus
            ? isTraditional
              ? "熱評彈窗已開啟"
              : "热评弹窗已开启"
            : isTraditional
            ? "熱評彈窗已關閉"
            : "热评弹窗已关闭";
          showCopySuccessNotification(statusText);
          updateMenuContent();
        }
        break;

      case "toggle-dark-mode":
        if (typeof btf !== "undefined" && btf.switchDarkMode) {
          btf.switchDarkMode();
        } else {
          const currentTheme =
            document.documentElement.getAttribute("data-theme");
          const newTheme = currentTheme === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", newTheme);
        }
        // 不需要立即更新菜单，因为菜单已经关闭
        // 下次打开菜单时会自动获取最新状态
        break;

      case "translate":
        // 调用博客自带的繁简转换功能
        if (
          typeof window.translateFn !== "undefined" &&
          window.translateFn.translatePage
        ) {
          // 获取当前状态来确定切换后的状态
          const isCurrentlyTraditional = isTraditionalChinese();

          window.translateFn.translatePage();

          // 延迟显示通知和更新菜单，等待页面切换完成
          setTimeout(() => {
            if (isCurrentlyTraditional) {
              showCopySuccessNotification("你已切换为简体");
            } else {
              showCopySuccessNotification("你已切换为繁体");
            }
            // 更新菜单内容以反映新的状态
            updateMenuContent();
          }, 200);
        }
        break;

      case "copy-selected-text":
        const selectedText = getSelectedText();
        if (selectedText) {
          copyToClipboard(selectedText);
          showCopySuccessNotification("复制成功，复制和转载请标注本文地址");
        }
        break;

      case "quote-to-comment":
        const quoteText = getSelectedText();
        if (quoteText) {
          // 尝试将文本添加到评论框，使用更广泛的选择器
          const commentBox = document.querySelector(
            '#comment-textarea, .comment-textarea, textarea[name="comment"], textarea[placeholder*="评论"], textarea[placeholder*="comment"], #comment, .comment-form textarea, .post-comment textarea, textarea'
          );
          if (commentBox) {
            // 直接插入选中的文本，不添加引用格式
            commentBox.value =
              quoteText + (commentBox.value ? " " + commentBox.value : "");
            commentBox.focus();
            // 滚动到评论区域
            commentBox.scrollIntoView({ behavior: "smooth", block: "center" });
            // 移除通知，静默执行
          } else {
            copyToClipboard(quoteText);
            // 移除通知，静默执行
          }
        }
        break;

      case "site-search":
        const siteSearchText = getSelectedText();
        if (siteSearchText) {
          // 尝试调用博客的本地搜索功能
          try {
            let searchTriggered = false;

            // 方法1: 尝试调用各种可能的搜索函数
            const searchFunctions = [
              () =>
                typeof btf !== "undefined" &&
                btf.openSearch &&
                btf.openSearch(),
              () => typeof openSearch === "function" && openSearch(),
              () => typeof searchFunc === "function" && searchFunc(),
              () => typeof localSearch === "function" && localSearch(),
            ];

            for (let searchFunc of searchFunctions) {
              try {
                if (searchFunc()) {
                  searchTriggered = true;
                  break;
                }
              } catch (e) {
                continue;
              }
            }

            // 方法2: 尝试点击搜索按钮
            if (!searchTriggered) {
              const searchButtons = [
                ".search",
                ".search-button",
                "#search-button",
                '[data-href="#search"]',
                ".fa-search",
                ".search-icon",
                ".local-search",
                "#local-search",
              ];

              for (let selector of searchButtons) {
                const button = document.querySelector(selector);
                if (button) {
                  button.click();
                  searchTriggered = true;
                  break;
                }
              }
            }

            // 如果成功触发搜索，等待搜索框出现并填入文本
            if (searchTriggered) {
              // 填入搜索文本
              const fillSearchInput = () => {
                // 优先查找搜索相关的输入框
                const searchInputSelectors = [
                  'input[type="search"]',
                  'input[placeholder*="搜索"]',
                  'input[placeholder*="search"]',
                  'input[placeholder*="Search"]',
                  ".search-input",
                  ".local-search-input",
                  "#local-search-input",
                  ".search-dialog input",
                  ".search-popup input",
                  ".search-container input",
                  "#search input",
                  ".algolia-search-input",
                ];

                // 首先尝试搜索相关的输入框
                for (let selector of searchInputSelectors) {
                  const input = document.querySelector(selector);
                  if (input && input.offsetParent !== null) {
                    try {
                      input.value = siteSearchText;
                      input.focus();

                      // 触发搜索事件
                      ["input", "change", "keyup"].forEach((eventType) => {
                        const event = new Event(eventType, {
                          bubbles: true,
                          cancelable: true,
                        });
                        input.dispatchEvent(event);
                      });

                      return true;
                    } catch (e) {
                      continue;
                    }
                  }
                }

                // 如果没找到专门的搜索框，查找最近出现的可见输入框（排除评论相关）
                const allInputs = document.querySelectorAll("input");
                for (let input of allInputs) {
                  // 排除评论相关的输入框
                  const isCommentInput =
                    input.closest(
                      ".comment, .comments, #post-comment, .tk-comments, .valine, .waline"
                    ) ||
                    input.name === "nick" ||
                    input.name === "name" ||
                    input.name === "author" ||
                    (input.placeholder &&
                      (input.placeholder.includes("昵称") ||
                        input.placeholder.includes("姓名") ||
                        input.placeholder.includes("Name") ||
                        input.placeholder.includes("邮箱") ||
                        input.placeholder.includes("Email") ||
                        input.placeholder.includes("网址") ||
                        input.placeholder.includes("URL")));

                  if (
                    !isCommentInput &&
                    input.offsetParent !== null &&
                    input.type !== "hidden"
                  ) {
                    try {
                      input.value = siteSearchText;
                      input.focus();

                      // 触发搜索事件
                      ["input", "change", "keyup"].forEach((eventType) => {
                        const event = new Event(eventType, {
                          bubbles: true,
                          cancelable: true,
                        });
                        input.dispatchEvent(event);
                      });

                      return true;
                    } catch (e) {
                      continue;
                    }
                  }
                }
                return false;
              };

              // 延迟填入，给搜索框时间加载
              setTimeout(fillSearchInput, 300);
              setTimeout(fillSearchInput, 800);
            } else {
              // 如果都不行，使用Google站内搜索
              const googleSiteSearch = `https://www.google.com/search?q=site:${
                window.location.hostname
              } ${encodeURIComponent(siteSearchText)}`;
              window.open(googleSiteSearch, "_blank");
            }
          } catch (error) {
            // 备用方案：Google站内搜索
            const googleSiteSearch = `https://www.google.com/search?q=site:${
              window.location.hostname
            } ${encodeURIComponent(siteSearchText)}`;
            window.open(googleSiteSearch, "_blank");
          }
        }
        break;

      case "baidu-search":
        const baiduSearchText = getSelectedText();
        if (baiduSearchText) {
          const baiduUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(
            baiduSearchText
          )}`;
          window.open(baiduUrl, "_blank");
        }
        break;

      case "copy-image":
        const targetImage = getClickedImage();
        if (targetImage) {
          // 检查是否有明水印
          const hasVisibleWatermark =
            targetImage.dataset.watermarked === "true";

          if (hasVisibleWatermark) {
            // 明水印图片：直接复制blob URL
            copyToClipboard(targetImage.src);
            showCopySuccessNotification(
              "复制成功!图片已添加明水印，请遵守版权协议"
            );
          } else {
            // 盲水印图片：需要生成带水印的版本
            if (
              typeof window.blindWatermark !== "undefined" &&
              window.blindWatermark.generateForDownload
            ) {
              window.blindWatermark
                .generateForDownload(targetImage)
                .then((result) => {
                  copyToClipboard(result.blobUrl);
                  showCopySuccessNotification(
                    "复制成功!图片已添加盲水印，请遵守版权协议"
                  );
                })
                .catch(() => {
                  // 降级：复制原图地址
                  copyToClipboard(targetImage.src);
                  showCopySuccessNotification("复制成功，请遵守版权协议");
                });
            } else {
              // 没有盲水印功能，直接复制原图
              copyToClipboard(targetImage.src);
              showCopySuccessNotification("复制成功，请遵守版权协议");
            }
          }
        }
        break;

      case "download-image":
        const downloadImage = getClickedImage();
        if (downloadImage) {
          // 检查是否已有明水印（优先保留明水印）
          const hasVisibleWatermark =
            downloadImage.dataset.watermarked === "true";

          // 如果有明水印，直接下载
          if (hasVisibleWatermark) {
            try {
              const filename =
                downloadImage.dataset.originalFilename || "image.jpg";
              const link = document.createElement("a");
              link.href = downloadImage.src;
              link.download = filename;
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (error) {
              window.open(downloadImage.src, "_blank");
            }
          }
          // 否则检查是否有盲水印功能
          else if (
            typeof window.blindWatermark !== "undefined" &&
            window.blindWatermark.generateForDownload
          ) {
            // 使用盲水印功能生成带水印的PNG
            window.blindWatermark
              .generateForDownload(downloadImage)
              .then((result) => {
                const link = document.createElement("a");
                link.href = result.blobUrl;
                link.download = result.filename;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(result.blobUrl), 1000);
              })
              .catch(() => {
                // 降级：直接下载原图，但保持PNG扩展名
                try {
                  const imageUrl = new URL(downloadImage.src);
                  let imageName =
                    imageUrl.pathname.split("/").pop() || "image.jpg";
                  // 如果是来自指定域名的图片，转换为PNG扩展名
                  if (
                    downloadImage.src.includes("r2.lpblog.dpdns.org") ||
                    downloadImage.src.includes("localhost")
                  ) {
                    imageName =
                      imageName.replace(/\.(jpg|jpeg|gif|webp)$/i, "") + ".png";
                  }

                  const link = document.createElement("a");
                  link.href = downloadImage.src;
                  link.download = imageName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } catch (e) {
                  const link = document.createElement("a");
                  link.href = downloadImage.src;
                  link.download = "image.jpg";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              });
          } else {
            // 没有盲水印功能，使用原始下载逻辑
            try {
              const imageUrl = new URL(downloadImage.src);
              const imageName =
                imageUrl.pathname.split("/").pop() || "image.jpg";

              fetch(downloadImage.src)
                .then((response) => response.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = imageName;
                  link.style.display = "none";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                })
                .catch(() => {
                  const link = document.createElement("a");
                  link.href = downloadImage.src;
                  link.download = imageName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });
            } catch (error) {
              window.open(downloadImage.src, "_blank");
            }
          }
        }
        break;
    }
  }

  // 原toggleComments函数已移除，现在使用热评弹窗控制
  // function toggleComments() { ... } - 已废弃

  // 更新深色模式文本
  function updateDarkModeText() {
    const darkModeItem = contextMenu.querySelector(
      '[data-action="toggle-dark-mode"] span'
    );
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    if (darkModeItem) {
      darkModeItem.textContent = isDark ? "浅色模式" : "深色模式";
    }
    const darkModeIcon = contextMenu.querySelector(
      '[data-action="toggle-dark-mode"] i'
    );
    if (darkModeIcon) {
      darkModeIcon.className = "fa fa-adjust";
    }
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  // 显示通知
  function showNotification(message) {
    try {
      if (
        typeof btf !== "undefined" &&
        btf.snackbarShow &&
        typeof GLOBAL_CONFIG !== "undefined" &&
        GLOBAL_CONFIG.Snackbar
      ) {
        btf.snackbarShow(message);
      } else if (typeof Swal !== "undefined") {
        Swal.fire({
          title: message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // 使用简单的alert作为备用
        alert(message);
      }
    } catch (error) {
      // 静默处理通知显示失败
    }
  }

  // 显示复制成功提示栏
  function showCopySuccessNotification(message) {
    // 移除已存在的提示栏
    const existingNotification = document.querySelector(
      ".copy-success-notification"
    );
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建新的提示栏
    const notification = document.createElement("div");
    notification.className = "copy-success-notification";
    notification.innerHTML = `
      <span>${message}</span>
      <div class="progress-bar"></div>
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // 3秒后隐藏并移除
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 将函数暴露为全局函数，供其他脚本使用
  window.showCopySuccessNotification = showCopySuccessNotification;

  // 显示右键菜单
  function showContextMenu(e) {
    // 移动端禁用自定义右键菜单
    if (isMobileDevice()) {
      return;
    }

    // 检查是否有移动端触摸标记
    if (e.target && e.target.getAttribute("data-mobile-touch") === "true") {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // 隐藏所有其他右键菜单
    hideAllContextMenus();

    // 每次都重新创建菜单以确保状态正确
    if (contextMenu) {
      contextMenu.remove();
      contextMenu = null;
    }

    // 清理旧的提示框
    const oldTooltip = document.getElementById("navTooltip");
    if (oldTooltip) {
      oldTooltip.remove();
    }

    createContextMenu();
    updateMenuContent();

    // 先显示菜单以获取实际尺寸
    contextMenu.style.visibility = "hidden";
    contextMenu.style.display = "block";

    // 获取菜单实际尺寸
    const menuRect = contextMenu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;

    // 重置菜单样式
    contextMenu.style.display = "";
    contextMenu.style.visibility = "visible";

    // 获取鼠标位置
    let x = e.clientX;
    let y = e.clientY;

    // 防止菜单超出屏幕边界
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    // 确保菜单不会超出屏幕顶部和左侧
    if (x < 10) {
      x = 10;
    }
    if (y < 10) {
      y = 10;
    }

    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    contextMenu.classList.add("show");
  }

  // 隐藏所有右键菜单
  function hideAllContextMenus() {
    // 隐藏自定义右键菜单
    const customMenu = document.getElementById("customContextMenu");
    if (customMenu) {
      customMenu.classList.remove("show");
    }

    // 隐藏音乐播放器右键菜单
    const musicMenu = document.getElementById("musicContextMenu");
    if (musicMenu) {
      musicMenu.classList.remove("show");
    }
  }

  // 隐藏右键菜单
  function hideContextMenu() {
    if (contextMenu) {
      contextMenu.classList.remove("show");
    }
    // 同时隐藏悬停提示
    hideNavTooltip();
  }

  // 显示导航按钮悬停提示
  function showNavTooltip(button) {
    const tooltip = document.getElementById("navTooltip");
    if (!tooltip) return;

    const tooltipText = button.getAttribute("data-tooltip");
    if (!tooltipText) return;

    tooltip.textContent = tooltipText;

    // 计算按钮的屏幕位置
    const buttonRect = button.getBoundingClientRect();

    // 获取菜单容器位置
    const menuRect = contextMenu.getBoundingClientRect();

    // 设置提示框内容以计算其尺寸
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "1";
    tooltip.classList.add("show");

    // 获取提示框尺寸
    const tooltipRect = tooltip.getBoundingClientRect();

    // 计算提示框位置：按钮上方，水平居中，与菜单保持3px间距
    const left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
    const top = menuRect.top - tooltipRect.height - 3; // 3px间距

    // 设置位置
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    // 显示提示框
    tooltip.style.visibility = "visible";
  }

  // 隐藏导航按钮悬停提示
  function hideNavTooltip() {
    const tooltip = document.getElementById("navTooltip");
    if (tooltip) {
      tooltip.classList.remove("show");
      // 重置所有内联样式
      tooltip.style.visibility = "hidden";
      tooltip.style.opacity = "0";
      tooltip.style.left = "";
      tooltip.style.top = "";
    }
  }

  // 原restoreCommentsState函数已移除，现在使用热评弹窗控制
  // function restoreCommentsState() { ... } - 已废弃

  // 初始化事件监听
  function initContextMenu() {
    // 原评论状态恢复已移除

    // 右键事件
    document.addEventListener("contextmenu", function (e) {
      const target = e.target;
      const isInContent = target.closest("#content-inner, .layout, body");
      const isNotInInput = !target.closest(
        "input, textarea, select, [contenteditable]"
      );
      const isNotInMenu = !target.closest(
        ".custom-context-menu, #nav, .rightside"
      );

      if (isInContent && isNotInInput && isNotInMenu) {
        rightClickTarget = target;
        showContextMenu(e);
        return false; // 阻止默认右键菜单
      }
    });

    // 点击其他地方隐藏菜单（添加延迟避免立即隐藏）
    document.addEventListener("click", function (e) {
      setTimeout(() => {
        if (!e.target.closest(".custom-context-menu")) {
          hideContextMenu();
        }
      }, 10);
    });

    // 滚动时隐藏菜单
    document.addEventListener("scroll", hideContextMenu);

    // 窗口大小改变时隐藏菜单
    window.addEventListener("resize", hideContextMenu);

    // ESC键隐藏菜单
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideContextMenu();
      }
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContextMenu);
  } else {
    initContextMenu();
  }

  // PJAX支持 - 页面切换后重新初始化
  if (typeof btf !== "undefined" && btf.addGlobalFn) {
    // 页面切换前清理
    btf.addGlobalFn(
      "pjaxSend",
      function () {
        // 隐藏可能存在的右键菜单
        hideAllContextMenus();
      },
      "customContextMenuCleanup"
    );

    // 页面切换后重新初始化
    btf.addGlobalFn("pjaxComplete", initContextMenu, "customContextMenu");
  }
})();
