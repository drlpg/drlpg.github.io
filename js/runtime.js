var now = new Date();
function createtime() {
  now.setTime(now.getTime() + 1000);
  var grt = new Date("2024-12-20T00:00:00"); // 网站诞生时间

  // 计算总秒数
  var totalSeconds = (now - grt) / 1000;

  // 计算天数、小时、分钟、秒
  var dnum = Math.floor(totalSeconds / 86400); // 86400 = 60 * 60 * 24
  var hnum = Math.floor((totalSeconds % 86400) / 3600); // 3600 = 60 * 60
  var mnum = Math.floor((totalSeconds % 3600) / 60); // 60 = 1分钟
  var snum = Math.floor(totalSeconds % 60); // 秒数

  // 格式化为两位数
  hnum = formatTime(hnum);
  mnum = formatTime(mnum);
  snum = formatTime(snum);

  // 拼接时间显示 HTML - 始终显示心跳动画
  let currentTimeHtml = `<div style="font-size:13px;font-weight:bold">本站已运行 ${dnum} 天 ${hnum} 小时 ${mnum} 分 ${snum} 秒 <i id="heartbeat" class='fas fa-heartbeat'></i></div>`;

  // 更新页面上的 workboard 元素
  if (document.getElementById("workboard")) {
    document.getElementById("workboard").innerHTML = currentTimeHtml;
  }
}

// 格式化时间
function formatTime(time) {
  return String(time).padStart(2, "0"); // 如果时间是个位数，前面加零
}

// 设置重复执行函数，周期1000ms
setInterval(createtime, 1000);
