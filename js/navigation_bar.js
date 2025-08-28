document.addEventListener('pjax:complete', tonav);
document.addEventListener('DOMContentLoaded', tonav);

function tonav() {
    // 检查jQuery是否可用
    if (typeof $ === 'undefined') {
        console.warn('jQuery未加载，导航栏功能可能受影响');
        return;
    }
    
    var nameContainer = document.querySelector("#nav #name-container");
    var menusItems = document.querySelector("#nav .menus_items");
    
    if (!nameContainer || !menusItems) {
        return;
    }
    
    var position = $(window).scrollTop();

    $(window).scroll(function() {
        var scroll = $(window).scrollTop();

        if (scroll > position + 5) {
            nameContainer.classList.add("visible");
            menusItems.classList.remove("visible");
        } else if (scroll < position - 5) {
            nameContainer.classList.remove("visible");
            menusItems.classList.add("visible");
        }

        position = scroll;
    });

    // 初始化 page-name
    const pageNameElement = document.getElementById("page-name");
    if (pageNameElement) {
        pageNameElement.innerText = document.title.split(" | LiuShen's Blog")[0];
    }
}