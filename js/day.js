var d = new Date();
m = d.getMonth() + 1;
dd = d.getDate();
y = d.getFullYear();

// 公祭日
if (m == 9 && dd == 18) {
    document.getElementsByTagName("html")[0].setAttribute("style", "filter: grayscale(100%);");
    var todayKey = "memorial_" + y + "_" + m + "_" + dd;
    if (sessionStorage.getItem(todayKey) != "1") {
        Swal.fire("今天是\n🕯️九一八事变" + (y - 1931).toString() + "周年纪念日🕯️");
        sessionStorage.setItem(todayKey, "1");
    }
}
if (m == 7 && dd == 7) {
    document.getElementsByTagName("html")[0].setAttribute("style", "filter: grayscale(100%);");
    var todayKey = "memorial_" + y + "_" + m + "_" + dd;
    if (sessionStorage.getItem(todayKey) != "1") {
        Swal.fire("今天是\n🕯️卢沟桥事变" + (y - 1937).toString() + "周年纪念日🕯️");
        sessionStorage.setItem(todayKey, "1");
    }
}
if (m == 12 && dd == 13) {
    document.getElementsByTagName("html")[0].setAttribute("style", "filter: grayscale(100%);");
    var todayKey = "memorial_" + y + "_" + m + "_" + dd;
    if (sessionStorage.getItem(todayKey) != "1") {
        Swal.fire("今天是\n🕯️南京大屠杀" + (y - 1937).toString() + "周年纪念日🕯️");
        sessionStorage.setItem(todayKey, "1");
    }
}
if (m == 8 && dd == 14) {
    document.getElementsByTagName("html")[0].setAttribute("style", "filter: grayscale(100%);");
    var todayKey = "memorial_" + y + "_" + m + "_" + dd;
    if (sessionStorage.getItem(todayKey) != "1") {
        Swal.fire("今天是\n🕯️世界慰安妇纪念日🕯️");
        sessionStorage.setItem(todayKey, "1");
    }
}


// 节假日弹窗已移除

//传统节日弹窗已移除

// 切换主题提醒
// if (y == 2022 && m == 12 && (dd >= 18 && dd <= 20)) {
//     if (sessionStorage.getItem("isPopupWindow") != "1") {
//         Swal.fire("网站换成冬日限定主题啦⛄");
//         sessionStorage.setItem("isPopupWindow", "1");
//     }
// }