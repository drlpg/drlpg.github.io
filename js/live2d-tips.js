// Live2D 智能提示语系统
class Live2DTips {
  constructor() {
    this.initTips();
  }

  // 获取当前时间段
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 12) return 'forenoon';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // 获取当前季节
  getSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  // 获取星期几
  getDayOfWeek() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }

  // 时间相关的问候语
  getTimeBasedTips() {
    const timeOfDay = this.getTimeOfDay();
    const tips = {
      morning: [
        '早上好！新的一天开始了~',
        '晨光正好，适合学习新知识呢',
        '早起的鸟儿有虫吃，加油！',
        '美好的一天从现在开始'
      ],
      forenoon: [
        '上午时光，工作效率最高呢',
        '现在精神状态应该很好吧？',
        '上午好，今天的计划是什么？',
        '趁着精神好，多学点东西吧'
      ],
      noon: [
        '午餐时间到了，记得好好吃饭~',
        '中午了，休息一下吧',
        '午后很容易犯困呢，来杯咖啡？',
        '吃饱了才有力气继续工作'
      ],
      afternoon: [
        '下午茶时间，放松一下吧',
        '下午容易疲劳，注意休息',
        '阳光正好，心情也要美美的',
        '下午的时光总是过得很快'
      ],
      evening: [
        '傍晚了，今天过得怎么样？',
        '夕阳西下，美好的黄昏',
        '晚上好，准备休息了吗？',
        '忙碌了一天，辛苦了'
      ],
      night: [
        '夜深了，记得早点休息哦',
        '夜猫子要注意身体健康',
        '深夜时分，适合思考人生',
        '晚安，做个好梦~'
      ]
    };
    return tips[timeOfDay] || tips.evening;
  }

  // 季节相关的提示语
  getSeasonTips() {
    const season = this.getSeason();
    const tips = {
      spring: [
        '春天来了，万物复苏的季节',
        '春暖花开，心情也跟着明朗',
        '春雨绵绵，滋润着大地',
        '春天是播种希望的季节'
      ],
      summer: [
        '夏日炎炎，记得防暑降温',
        '夏天的夜晚总是很美',
        '冰镇西瓜配空调，夏日标配',
        '夏天要多喝水哦'
      ],
      autumn: [
        '秋高气爽，适合出门走走',
        '秋天是收获的季节',
        '落叶飘飘，诗意满满',
        '秋风送爽，心旷神怡'
      ],
      winter: [
        '冬日暖阳，温暖人心',
        '冬天要注意保暖哦',
        '雪花纷飞的日子很浪漫',
        '冬天适合窝在家里看书'
      ]
    };
    return tips[season] || tips.spring;
  }

  // 星期相关的提示语
  getWeekdayTips() {
    const day = this.getDayOfWeek();
    const tips = {
      monday: [
        '周一综合症？来杯咖啡提提神',
        '新的一周开始了，加油！',
        'Monday Blue？我陪你一起度过',
        '周一也要元气满满哦'
      ],
      tuesday: [
        '周二了，节奏慢慢找回来了吧',
        '今天感觉怎么样？',
        '周二是个平凡却美好的日子',
        '继续加油，这周才刚开始'
      ],
      wednesday: [
        '周三了，一周过半啦',
        'Hump Day，翻过这座小山丘',
        '周三是个转折点呢',
        '坚持住，周末就不远了'
      ],
      thursday: [
        '周四了，胜利在望！',
        '明天就是周五了，开心吗？',
        '周四的心情是不是轻松了些？',
        '快到周末了，有什么计划吗？'
      ],
      friday: [
        'TGIF！周五快乐！',
        '周五的心情总是特别好',
        '周末计划想好了吗？',
        'Friday Night，准备放松一下？'
      ],
      saturday: [
        '周六愉快！好好休息吧',
        '周末时光，做点喜欢的事',
        'Saturday Vibes，放松模式开启',
        '周六适合睡懒觉呢'
      ],
      sunday: [
        '周日了，享受最后的休闲时光',
        'Sunday Funday！',
        '明天又是新的一周了',
        '周日适合整理思绪，准备新一周'
      ]
    };
    return tips[day] || tips.sunday;
  }

  // 随机获取提示语
  getRandomTip() {
    const allTips = [
      ...this.getTimeBasedTips(),
      ...this.getSeasonTips(),
      ...this.getWeekdayTips()
    ];
    return allTips[Math.floor(Math.random() * allTips.length)];
  }

  // 初始化提示语系统
  initTips() {
    // 这里可以添加更多初始化逻辑
    console.log('Live2D Tips System Initialized');
  }
}

// 导出给全局使用
window.Live2DTips = new Live2DTips();