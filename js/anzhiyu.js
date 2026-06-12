var anzhiyu = {
  //切换音乐播放状态
  musicToggle: function (changePaly = true) {
    // 动态获取元素，确保元素存在
    const navMusicEl = document.getElementById("nav-music");
    const hoverTipsEl = document.getElementById("nav-music-hoverTips");

    if (!navMusicEl) {
      console.warn("nav-music element not found");
      return;
    }

    if (!hoverTipsEl) {
      console.warn("nav-music-hoverTips element not found");
      return;
    }

    if (!anzhiyu_musicFirst) {
      musicBindEvent();
      anzhiyu_musicFirst = true;
    }
    let msgPlay = '<i class="fa-solid fa-play music-icon-large"></i>'; // 此處可以更改為你想要顯示的文字
    let msgPause = '<i class="fa-solid fa-pause music-icon-large"></i>'; // 同上，但兩處均不建議更改

    if (anzhiyu_musicPlaying) {
      navMusicEl.classList.remove("playing");
      // 修改右键菜单文案为播放
      // document.getElementById("menu-music-toggle").innerHTML = msgPlay;
      hoverTipsEl.innerHTML =
        '<i class="fa-solid fa-play music-icon-large"></i>';
      hoverTipsEl.title = "播放";
      // document.querySelector("#consoleMusic").classList.remove("on");
      anzhiyu_musicPlaying = false;
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("playing");
      // 修改右键菜单文案为暂停
      // document.getElementById("menu-music-toggle").innerHTML = msgPause;
      hoverTipsEl.innerHTML =
        '<i class="fa-solid fa-pause music-icon-large"></i>';
      hoverTipsEl.title = "暂停";
      // document.querySelector("#consoleMusic").classList.add("on");
      anzhiyu_musicPlaying = true;
      navMusicEl.classList.add("stretch");
    }
    if (changePaly) {
      const metingEl = document.querySelector("#nav-music meting-js");
      if (metingEl && metingEl.aplayer) {
        metingEl.aplayer.toggle();
      } else {
        console.warn("APlayer instance not found");
      }
    }
  },
  // 音乐伸缩
  musicTelescopic: function () {
    const navMusicEl = document.getElementById("nav-music");
    if (!navMusicEl) {
      console.warn("nav-music element not found");
      return;
    }

    if (navMusicEl.classList.contains("stretch")) {
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("stretch");
    }
  },

  //音乐上一曲
  musicSkipBack: function () {
    const metingEl = document.querySelector("#nav-music meting-js");
    if (metingEl && metingEl.aplayer) {
      metingEl.aplayer.skipBack();
    } else {
      console.warn("APlayer instance not found");
    }
  },

  //音乐下一曲
  musicSkipForward: function () {
    const metingEl = document.querySelector("#nav-music meting-js");
    if (metingEl && metingEl.aplayer) {
      metingEl.aplayer.skipForward();
    } else {
      console.warn("APlayer instance not found");
    }
  },

  //获取音乐中的名称
  musicGetName: function () {
    var x = $(".aplayer-title");
    var arr = [];
    for (var i = x.length - 1; i >= 0; i--) {
      arr[i] = x[i].innerText;
    }
    return arr[0];
  },
};

// 如果有右键事件 可以在这里写。
// addRightMenuClickEvent();
