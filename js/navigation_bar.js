document.addEventListener('pjax:complete', tonav);
document.addEventListener('DOMContentLoaded', tonav);

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
        pageNameElement.innerText = document.title.split(" | Dran")[0];
    }
}