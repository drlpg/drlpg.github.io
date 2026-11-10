// 页面加载及 PJAX 路由切换时初始化
document.addEventListener('pjax:complete', function() {
    tonav();
    initMenusIndicator();
    initAboutPrefetch();
});
document.addEventListener('DOMContentLoaded', function() {
    tonav();
    initMenusIndicator();
    initAboutPrefetch();
});

function tonav() {
    var nameContainer = document.querySelector("#nav #name-container");
    var menusItems = document.querySelector("#nav .menus_items");
    
    if (!nameContainer || !menusItems) {
        return;
    }
    
    // 使用原生JavaScript替代jQuery
    var position = window.pageYOffset || document.documentElement.scrollTop;

    function handleScroll() {
        var scroll = window.pageYOffset || document.documentElement.scrollTop;

        if (scroll > position + 5) {
            nameContainer.classList.add("visible");
            menusItems.classList.remove("visible");
        } else if (scroll < position - 5) {
            nameContainer.classList.remove("visible");
            menusItems.classList.add("visible");
        }

        position = scroll;
    }

    // 移除现有的滚动监听器（如果有的话）
    if (window.navScrollHandler) {
        window.removeEventListener('scroll', window.navScrollHandler);
    }
    
    // 添加新的滚动监听器
    window.navScrollHandler = handleScroll;
    window.addEventListener('scroll', window.navScrollHandler, { passive: true });

    // 初始化 page-name
    const pageNameElement = document.getElementById("page-name");
    if (pageNameElement) {
        pageNameElement.innerText = document.title.split(" | Magi")[0];
    }
}

/**
 * 导航栏博文分类等下拉子菜单悬停背景丝滑位移动画
 */
function initMenusIndicator() {
    var childMenus = document.querySelectorAll("#nav .menus_items .menus_item .menus_item_child");
    if (!childMenus || childMenus.length === 0) return;

    childMenus.forEach(function(childUl) {
        // 创建或复用滑动胶囊滑块指示器
        var indicator = childUl.querySelector(".menus-indicator");
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.className = "menus-indicator";
            childUl.appendChild(indicator);
        }

        // 每次重新调用时重置激活状态，防止 PJAX 跳转后残留状态
        indicator.classList.remove("active");

        // 避免重复对同一 DOM 节点绑定事件监听
        if (childUl.dataset.indicatorBound === "true") {
            return;
        }
        childUl.dataset.indicatorBound = "true";

        var isHovered = false;
        var lastLeft = 0;
        var lastTop = 0;

        var items = childUl.querySelectorAll("li");
        if (items.length === 0) return;

        items.forEach(function(li) {
            li.addEventListener("mouseenter", function() {
                var left = li.offsetLeft;
                var top = li.offsetTop;
                var width = li.offsetWidth;
                var height = li.offsetHeight;

                if (width <= 0 || height <= 0) return;

                lastLeft = left;
                lastTop = top;

                if (!isHovered) {
                    // 首次移入：在目标项位置淡入微缩放，避免从原点横跨飞跃
                    indicator.classList.add("no-transition");
                    indicator.style.transform = "translate3d(" + left + "px, " + top + "px, 0) scale(0.9)";
                    indicator.style.width = width + "px";
                    indicator.style.height = height + "px";

                    // 触发浏览器回流使几何尺寸立即生效
                    void indicator.offsetWidth;

                    indicator.classList.remove("no-transition");
                    indicator.style.transform = "translate3d(" + left + "px, " + top + "px, 0) scale(1)";
                    indicator.classList.add("active");
                    isHovered = true;
                } else {
                    // 已在子菜单内移动：基于 CSS 贝塞尔曲线平滑位移与自适应拉伸
                    indicator.style.transform = "translate3d(" + left + "px, " + top + "px, 0) scale(1)";
                    indicator.style.width = width + "px";
                    indicator.style.height = height + "px";
                    indicator.classList.add("active");
                }
            });
        });

        childUl.addEventListener("mouseleave", function() {
            // 鼠标移出子菜单容器时淡出并微缩
            indicator.classList.remove("active");
            indicator.style.transform = "translate3d(" + lastLeft + "px, " + lastTop + "px, 0) scale(0.85)";
            isHovered = false;
        });
    });
}

/**
 * 导航栏“关于我”悬停预取加速（Hover Prefetch）
 * 当鼠标悬停在“关于我”链接上超过 60ms 时，静默预热 3D 工牌核心资源，确保点击进入时 0ms 秒开
 */
function initAboutPrefetch() {
    var aboutLinks = document.querySelectorAll('a[href*="/about/"], a[href="/about"]');
    if (!aboutLinks || aboutLinks.length === 0) return;

    var prefetched = false;
    var timer = null;

    function doPrefetch() {
        if (prefetched) return;
        prefetched = true;

        // 1. 预取 Three.js 与 Lanyard 脚本
        ['/js/three.min.js', '/js/lanyard.js'].forEach(function(src) {
            var link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'script';
            link.href = src;
            document.head.appendChild(link);
        });

        // 2. 预热工牌头像与矢量纹理图像（显式 decode 确保位图完全栅格化就绪）
        var imgPool = (window.__LANYARD_IMG_CACHE__ = window.__LANYARD_IMG_CACHE__ || new Map());
        ['/img/tx.png', '/img/logo_black.svg', '/img/logo_white.svg'].forEach(function(src) {
            if (!imgPool.has(src)) {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                var p = new Promise(function(resolve) {
                    var settled = false;
                    function done() {
                        if (settled) return;
                        settled = true;
                        resolve(img);
                    }
                    function tryDecode() {
                        if (typeof img.decode === 'function') {
                            img.decode().then(done).catch(done);
                        } else {
                            done();
                        }
                    }
                    img.onload = tryDecode;
                    img.onerror = function() { done(); };
                    img.src = src;
                    if (img.complete) {
                        tryDecode();
                    }
                });
                imgPool.set(src, p);
            }
        });
    }

    aboutLinks.forEach(function(link) {
        link.addEventListener('mouseenter', function() {
            timer = setTimeout(doPrefetch, 60);
        }, { passive: true });

        link.addEventListener('mouseleave', function() {
            if (timer) clearTimeout(timer);
        }, { passive: true });

        link.addEventListener('touchstart', doPrefetch, { passive: true });
    });
}

