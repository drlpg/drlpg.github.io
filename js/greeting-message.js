// 温馨提示语功能 - 按时间顺序播报
(function () {
  "use strict";

  // 12条提示语，每2小时一条，覆盖24小时
  const greetingMessages = [
    "夜深了，早点休息吧", // 00:00-02:00
    "夜猫子，注意休息哦", // 02:00-04:00
    "快日出了，再睡会吧", // 04:00-06:00
    "早安，新的一天开始了", // 06:00-08:00
    "上午好，元气满满", // 08:00-10:00
    "临近午时，继续加油", // 10:00-12:00
    "中午好，该吃饭啦", // 12:00-14:00
    "午休时间到，继续搬砖", // 14:00-16:00
    "下午好，继续努力", // 16:00-18:00
    "再坚持一会，快下班了", // 18:00-20:00
    "晚上好，今天辛苦了", // 20:00-22:00
    "时间不早了，早点休息吧", // 22:00-24:00
  ];

  // 点击循环的提示语（3条固定内容）
  let clickMessages = [
    "欢迎来到我的博客",
    "当前已发布1篇文章", // 将在初始化时更新
    "持续更新中~",
  ];

  // 当前点击循环的索引
  let clickIndex = -1;

  // IP位置欢迎信息标记
  let hasShownLocationGreeting = false;
  let userCity = null; // 存储用户城市

  // 获取用户位置（调用 Vercel API）
  function fetchUserLocation(callback) {
    // 设置超时（5秒）
    const timeout = setTimeout(() => {
      userCity = null;
      if (callback) callback(null);
    }, 5000);

    // 调用 Vercel API
    const apiUrl = "https://ip.lpblog.dpdns.org/api/location";

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error("请求失败");
        return res.json();
      })
      .then((data) => {
        clearTimeout(timeout);

        if (data.success && data.city) {
          userCity = data.city;
          if (callback) callback(data.city);
        } else {
          userCity = null;
          if (callback) callback(null);
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        userCity = null;
        if (callback) callback(null);
      });
  }

  // 获取文章总数
  function getPostCount() {
    const webinfoItems = document.querySelectorAll(
      "#aside-content .card-webinfo .webinfo-item"
    );

    for (const item of webinfoItems) {
      const text = item.textContent;
      if (text.includes("文章数目")) {
        const match = text.match(/\d+/);
        if (match) {
          return match[0];
        }
      }
    }

    return "1";
  }

  // 初始化点击循环消息
  function initClickMessages() {
    const postCount = getPostCount();
    clickMessages[1] = `当前已发布${postCount}篇文章`;
  }

  // 根据当前时间获取对应的提示语索引
  function getMessageIndex() {
    const hour = new Date().getHours();
    return Math.floor(hour / 2);
  }

  // 获取当前时间对应的提示语
  function getCurrentMessage() {
    return greetingMessages[getMessageIndex()];
  }

  // 获取下一条提示语（点击循环3条固定内容）
  function getNextMessage() {
    clickIndex = (clickIndex + 1) % clickMessages.length;
    return clickMessages[clickIndex];
  }

  // 恢复定时器
  let restoreTimer = null;

  // 绑定点击事件的函数
  function bindClickEvent() {
    const greetingElement = document.getElementById("greeting-message");
    if (!greetingElement) return;

    greetingElement.removeEventListener("click", handleGreetingClick);
    greetingElement.removeEventListener("mouseleave", handleMouseLeave);

    greetingElement.addEventListener("click", handleGreetingClick);
    greetingElement.addEventListener("mouseleave", handleMouseLeave);

    greetingElement.setAttribute("data-click-bound", "true");
  }

  // 点击事件处理函数
  function handleGreetingClick() {
    changeGreeting();
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
  }

  // 鼠标离开事件处理函数
  function handleMouseLeave() {
    if (restoreTimer) {
      clearTimeout(restoreTimer);
    }

    restoreTimer = setTimeout(() => {
      restoreGreeting();
    }, 3000);
  }

  // 恢复为时间提示语
  function restoreGreeting() {
    const greetingElement = document.getElementById("greeting-message");
    if (!greetingElement) return;

    clickIndex = -1;

    const message = getCurrentMessage();
    greetingElement.textContent = message;
  }

  // 显示提示语
  function showGreeting(message) {
    const greetingElement = document.getElementById("greeting-message");
    if (!greetingElement) return;

    if (!message) {
      message = getCurrentMessage();
    }

    greetingElement.textContent = message;

    if (!greetingElement.classList.contains("show")) {
      greetingElement.classList.add("show");
    }

    if (!greetingElement.getAttribute("data-click-bound")) {
      bindClickEvent();
    }
  }

  // 显示位置欢迎信息
  function showLocationGreeting() {
    if (hasShownLocationGreeting || !userCity) {
      return;
    }

    hasShownLocationGreeting = true;

    // 移除城市名称后面的"市"、"省"、"区"、"县"、"镇"、"村"字
    const displayCity = userCity.replace(/[市省区县镇村]$/, "");
    const locationMessage = `欢迎来自${displayCity}的朋友`;

    showGreeting(locationMessage);

    // 5秒后恢复为时间提示语
    setTimeout(() => {
      showGreeting(getCurrentMessage());
    }, 5000);
  }

  // 切换提示语（顺序循环到下一条）
  function changeGreeting() {
    const greetingElement = document.getElementById("greeting-message");
    if (!greetingElement) return;

    const newMessage = getNextMessage();

    greetingElement.textContent = newMessage;
  }

  // 页面加载完成后执行
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fullInit);
    } else {
      fullInit();
    }
  }

  // 完整的初始化函数
  function fullInit() {
    initClickMessages();

    // 先显示时间提示语
    showGreeting(getCurrentMessage());

    // 异步获取位置信息
    fetchUserLocation((city) => {
      if (city) {
        // 获取到位置后立即显示
        showLocationGreeting();
      }
    });
  }

  // PJAX 支持
  if (typeof window !== "undefined") {
    // PJAX 页面切换时重新初始化
    const resetAndInit = () => {
      hasShownLocationGreeting = false;
      userCity = null;
      fullInit();
    };

    document.addEventListener("pjax:complete", resetAndInit);

    document.addEventListener("pjax:start", () => {
      const greetingElement = document.getElementById("greeting-message");
      if (greetingElement) {
        greetingElement.removeEventListener("click", handleGreetingClick);
        greetingElement.removeAttribute("data-click-bound");
      }
    });

    if (typeof btf !== "undefined" && btf.addGlobalFn) {
      btf.addGlobalFn("pjaxComplete", resetAndInit, "greetingMessage");
    }
  }

  init();

  // 定期检查事件绑定状态（保险机制）
  setInterval(() => {
    const greetingElement = document.getElementById("greeting-message");
    if (greetingElement && greetingElement.classList.contains("show")) {
      if (!greetingElement.getAttribute("data-click-bound")) {
        bindClickEvent();
      }
    }
  }, 3000);
})();
