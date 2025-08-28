// 智能提示语管理器
class SmartTipsManager {
  constructor() {
    this.userLocation = null;
    this.locationTips = [];
    this.weatherData = null;
    this.weatherTips = [];
    this.initLocationDetection();
    this.initWeatherDetection();
    
    this.tips = {
      // 时间段提示语
      timeBasedTips: {
        morning: [
          '早上好！新的一天开始了~',
          '晨光正好，适合学习新知识呢！',
          '早起的鸟儿有虫吃，你真棒！',
          '美好的一天从现在开始，心情怎么样？',
          '清晨的阳光很温暖呢，就像你的笑容一样',
          '早安！昨晚睡得好吗？',
          '一日之计在于晨，今天的计划是什么？'
        ],
        forenoon: [
          '上午时光，工作效率最高呢！',
          '现在精神状态应该很好吧？',
          '上午好，今天的任务完成得怎么样？',
          '趁着精神好，多学点东西吧',
          '咖啡香味飘过来了，是在工作吗？',
          '这个时间段最适合处理重要事情了',
          '保持专注，你做得很棒！'
        ],
        noon: [
          '午餐时间到了，记得好好吃饭哦~',
          '中午了，休息一下吧，劳逸结合很重要',
          '午后很容易犯困呢，来杯咖啡？',
          '吃饱了才有力气继续工作呢',
          '午休一会儿吧，下午会更有精神',
          '今天的午餐吃了什么好吃的？',
          '记得饭后散散步，有助消化哦'
        ],
        afternoon: [
          '下午茶时间，放松一下吧~',
          '下午容易疲劳，注意休息眼睛',
          '阳光正好，心情也要美美的',
          '下午的时光总是过得很快',
          '来点甜食补充能量吧',
          '下午是创意迸发的好时机',
          '坚持住，很快就到下班时间了'
        ],
        evening: [
          '傍晚了，今天过得怎么样？',
          '夕阳西下，美好的黄昏时光',
          '晚上好，准备休息了吗？',
          '忙碌了一天，辛苦了',
          '晚餐时间到了，今天想吃什么？',
          '一天的工作结束了，放松一下吧',
          '今天有什么收获吗？'
        ],
        night: [
          '夜深了，记得早点休息哦',
          '夜猫子要注意身体健康呢',
          '深夜时分，适合思考人生',
          '晚安，做个好梦~',
          '熬夜对皮肤不好哦，早点睡吧',
          '明天又是新的一天，养足精神很重要',
          '深夜了，喝杯热牛奶有助睡眠'
        ]
      },

      // 星期提示语
      weekdayTips: {
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
      },

      // 季节提示语
      seasonTips: {
        spring: [
          '春天来了，万物复苏的季节',
          '春暖花开，心情也跟着明朗',
          '春雨绵绵，滋润着大地',
          '春天是播种希望的季节',
          '樱花盛开，粉色的浪漫',
          '春风拂面，温暖如你'
        ],
        summer: [
          '夏日炎炎，记得防暑降温',
          '夏天的夜晚总是很美',
          '冰镇西瓜配空调，夏日标配',
          '夏天要多喝水哦',
          '海边的夏天最棒了',
          '夏日午后，蝉鸣声声'
        ],
        autumn: [
          '秋高气爽，适合出门走走',
          '秋天是收获的季节',
          '落叶飘飘，诗意满满',
          '秋风送爽，心旷神怡',
          '金桂飘香，秋意浓浓',
          '秋天的枫叶很美呢'
        ],
        winter: [
          '冬日暖阳，温暖人心',
          '冬天要注意保暖哦',
          '雪花纷飞的日子很浪漫',
          '冬天适合窝在家里看书',
          '热腾腾的火锅最暖心了',
          '冬日里的一缕阳光格外珍贵'
        ]
      },

      // 博客交互提示语
      interactionTips: {
        copy: [
          '复制成功！记得要好好利用哦~',
          '已经帮你复制好了，快去粘贴吧！',
          '复制完成，HK416为你服务！',
          '内容已复制到剪贴板，去分享给朋友吧',
          '复制成功，希望这些内容对你有帮助'
        ],
        scroll: [
          '继续往下看，还有更多精彩内容',
          '滚动浏览中，注意休息眼睛哦',
          '页面内容丰富，慢慢欣赏吧',
          '滚动到底部可以看到更多链接',
          '快速滚动时要注意不要错过重要信息'
        ],
        search: [
          '搜索功能很强大，试试看吧',
          '找到想要的内容了吗？',
          '搜索结果出来了，看看有没有感兴趣的',
          '可以尝试不同的关键词搜索',
          '搜索无结果？试试其他关键词'
        ],
        comment: [
          '看到有趣的评论了吗？',
          '不妨也留下你的想法',
          '评论区很热闹呢，加入讨论吧',
          '你的评论对作者很重要',
          '理性讨论，文明评论哦'
        ],
        share: [
          '分享是最好的支持方式',
          '好内容值得分享给更多人',
          '分享成功，感谢你的推广',
          '让更多朋友看到优质内容',
          '分享知识，传递价值'
        ],
        theme: [
          '深色模式对眼睛更友好哦',
          '浅色模式看起来更清爽',
          '主题切换成功，感觉怎么样？',
          '可以根据环境光线选择主题',
          '夜间建议使用深色模式'
        ],
        music: [
          '音乐响起来了，心情怎么样？',
          '边听音乐边阅读，很惬意呢',
          '这首歌很好听，要不要收藏？',
          '音乐暂停了，是要专心阅读吗？',
          '音乐能让阅读更有趣'
        ],
        navigation: [
          '试试搜索功能，找找感兴趣的内容',
          '可以切换深色模式保护眼睛哦',
          '侧边栏有很多有用的信息',
          '不妨看看文章分类和标签',
          '页面底部有更多链接可以探索',
          '试试点击文章标题进入详情页',
          '可以使用快捷键提升浏览体验',
          '记得关注RSS订阅获取更新'
        ]
      },

      // 特殊节日提示语
      holidayTips: {
        newYear: ['新年快乐！恭喜发财！'],
        valentine: ['情人节快乐，要幸福哦~'],
        womensDay: ['妇女节快乐，女神！'],
        aprilFools: ['愚人节，小心被骗哦~'],
        laborDay: ['劳动节快乐，辛苦了！'],
        childrensDay: ['儿童节快乐，永远年轻！'],
        dragonBoat: ['端午节安康，记得吃粽子'],
        midAutumn: ['中秋节快乐，月圆人团圆'],
        weekend: ['周末愉快！好好休息吧']
      },

      // 通用提示语
      generalTips: [
        '今天过得怎么样呢？',
        '有什么想了解的吗？',
        '感谢你的访问~',
        '希望你在这里有所收获'
      ]
    };

    this.lastTipTime = 0;
    this.tipHistory = [];
    this.maxHistoryLength = 10;
  }

  // 初始化地域检测
  async initLocationDetection() {
    try {
      // 使用多个IP地理位置API作为备选
      const apis = [
        'https://ipapi.co/json/',
        'https://api.ip.sb/geoip',
        'https://ipinfo.io/json'
      ];
      
      for (const api of apis) {
        try {
          const response = await fetch(api);
          const data = await response.json();
          
          if (data.country || data.region || data.city) {
            this.userLocation = {
              country: data.country || data.country_name,
              region: data.region || data.region_name,
              city: data.city,
              timezone: data.timezone
            };
            
            this.generateLocationTips();
            break;
          }
        } catch (error) {
          console.log(`Failed to get location from ${api}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.log('Location detection failed:', error);
      // 使用默认的通用地域问候语
      this.locationTips = [
        '您好呀，欢迎来自远方的朋友~'
      ];
    }
  }

  // 生成地域相关的问候语
  generateLocationTips() {
    if (!this.userLocation) return;
    
    const { country, region, city } = this.userLocation;
    
    this.locationTips = [
      `您好呀，欢迎来自${country || '远方'}的朋友~`,
      `来自${city || region || country || '远方'}的访客，希望您在这里有所收获`
    ];
    
    // 根据时区调整问候语
    if (this.userLocation.timezone) {
      const userTime = new Date().toLocaleString('en-US', {
        timeZone: this.userLocation.timezone
      });
      const userHour = new Date(userTime).getHours();
      
      if (userHour >= 6 && userHour < 12) {
        this.locationTips.push(`${country || '您那里'}现在应该是上午吧，早上好！`);
      } else if (userHour >= 12 && userHour < 18) {
        this.locationTips.push(`${country || '您那里'}现在应该是下午，下午好！`);
      } else if (userHour >= 18 && userHour < 22) {
        this.locationTips.push(`${country || '您那里'}现在应该是傍晚，晚上好！`);
      } else {
        this.locationTips.push(`${country || '您那里'}现在应该是深夜，注意休息哦`);
      }
    }
  }

  // 初始化天气检测
  async initWeatherDetection() {
    try {
      // 等待位置信息获取完成
      await new Promise(resolve => {
        const checkLocation = () => {
          if (this.userLocation || Date.now() - this.initTime > 10000) {
            resolve();
          } else {
            setTimeout(checkLocation, 500);
          }
        };
        this.initTime = Date.now();
        checkLocation();
      });

      if (this.userLocation) {
        await this.fetchWeatherData();
      } else {
        // 使用默认天气提示语
        this.weatherTips = [
          '今天的天气怎么样呢？',
          '记得关注天气变化哦'
        ];
      }
    } catch (error) {
      console.log('Weather detection failed:', error);
      this.weatherTips = [
        '今天的天气怎么样呢？',
        '下雨了记得带伞哦',
        '天气热了要注意防暑',
        '降温了记得添衣保暖'
      ];
    }
  }

  // 获取天气数据
  async fetchWeatherData() {
    try {
      // 使用和风天气API (需要在_config.yml中配置key)
      const qweatherKey = 'a17e385cf6d94f078f77b3dde0c2a18c'; // 从配置中获取
      
      // 先获取城市ID
      const locationQuery = `${this.userLocation.city || this.userLocation.region}`;
      const geoUrl = `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(locationQuery)}&key=${qweatherKey}`;
      
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();
      
      if (geoData.code === '200' && geoData.location && geoData.location.length > 0) {
        const locationId = geoData.location[0].id;
        
        // 获取当前天气
        const currentWeatherUrl = `https://devapi.qweather.com/v7/weather/now?location=${locationId}&key=${qweatherKey}`;
        const currentResponse = await fetch(currentWeatherUrl);
        const currentData = await currentResponse.json();
        
        // 获取明日天气
        const forecastUrl = `https://devapi.qweather.com/v7/weather/3d?location=${locationId}&key=${qweatherKey}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        if (currentData.code === '200' && forecastData.code === '200') {
          this.weatherData = {
            current: currentData.now,
            tomorrow: forecastData.daily[1], // 明天的天气
            location: geoData.location[0]
          };
          
          this.generateWeatherTips();
        }
      }
    } catch (error) {
      console.log('Failed to fetch weather data:', error);
      // 使用备用天气API或默认提示语
      await this.fetchBackupWeatherData();
    }
  }

  // 备用天气数据获取
  async fetchBackupWeatherData() {
    try {
      // 使用OpenWeatherMap作为备用 (免费API)
      const apiKey = 'your_openweather_api_key'; // 需要配置
      const lat = this.userLocation.latitude || 39.9042;
      const lon = this.userLocation.longitude || 116.4074;
      
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;
      
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
      ]);
      
      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();
      
      if (currentData.cod === 200 && forecastData.cod === '200') {
        this.weatherData = {
          current: {
            text: currentData.weather[0].description,
            temp: Math.round(currentData.main.temp),
            humidity: currentData.main.humidity,
            windSpeed: currentData.wind.speed
          },
          tomorrow: {
            textDay: forecastData.list[8].weather[0].description, // 大约24小时后
            tempMax: Math.round(forecastData.list[8].main.temp_max),
            tempMin: Math.round(forecastData.list[8].main.temp_min)
          }
        };
        
        this.generateWeatherTips();
      }
    } catch (error) {
      console.log('Backup weather API also failed:', error);
    }
  }

  // 生成天气相关提示语
  generateWeatherTips() {
    if (!this.weatherData) return;
    
    const { current, tomorrow } = this.weatherData;
    this.weatherTips = [];
    
    // 当前天气提示
    if (current) {
      const temp = current.temp || current.temperature;
      const weather = current.text || current.description;
      
      // 基于温度的提示
      if (temp > 30) {
        this.weatherTips.push(`今天${temp}°C，天气很热，记得防暑降温哦`);
        this.weatherTips.push('这么热的天气，多喝水保持水分');
      } else if (temp < 10) {
        this.weatherTips.push(`今天${temp}°C，天气较冷，记得添衣保暖`);
        this.weatherTips.push('天气这么冷，出门要多穿点哦');
      } else {
        this.weatherTips.push(`今天${temp}°C，天气还不错呢`);
      }
      
      // 基于天气状况的提示
      if (weather && weather.includes('雨')) {
        this.weatherTips.push('今天有雨，出门记得带伞哦');
        this.weatherTips.push('雨天路滑，注意安全');
      } else if (weather && weather.includes('雪')) {
        this.weatherTips.push('今天下雪了，雪景很美但要注意保暖');
        this.weatherTips.push('雪天路滑，出行要小心');
      } else if (weather && weather.includes('晴')) {
        this.weatherTips.push('今天天气晴朗，心情也跟着明朗起来');
        this.weatherTips.push('阳光明媚的日子，适合出去走走');
      }
    }
    
    // 明日天气提示
    if (tomorrow) {
      const tomorrowTemp = tomorrow.tempMax || tomorrow.temp_max;
      const tomorrowWeather = tomorrow.textDay || tomorrow.description;
      
      if (tomorrowTemp > 30) {
        this.weatherTips.push(`明天${tomorrowTemp}°C，会比较热，提前准备防暑用品`);
      } else if (tomorrowTemp < 10) {
        this.weatherTips.push(`明天${tomorrowTemp}°C，会比较冷，记得多穿衣服`);
      } else {
        this.weatherTips.push(`明天${tomorrowTemp}°C，天气还不错`);
      }
      
      if (tomorrowWeather && tomorrowWeather.includes('雨')) {
        this.weatherTips.push('明天可能有雨，记得准备雨具');
      } else if (tomorrowWeather && tomorrowWeather.includes('晴')) {
        this.weatherTips.push('明天天气晴朗，是个好日子');
      }
    }
    
    // 添加通用天气提示
    this.weatherTips.push('关注天气变化，合理安排出行');
    this.weatherTips.push('天气预报仅供参考，实际以当地为准');
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

  // 获取当前星期
  getDayOfWeek() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }

  // 获取当前季节
  getSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  // 检查是否是特殊节日
  getHoliday() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dayOfWeek = now.getDay();
    const year = now.getFullYear();
    
    // 固定日期的节日（阳历）
    if (month === 1 && day === 1) return 'newYear';
    if (month === 2 && day === 14) return 'valentine';
    if (month === 3 && day === 8) return 'womensDay';
    if (month === 4 && day === 1) return 'aprilFools';
    if (month === 5 && day === 1) return 'laborDay';
    if (month === 6 && day === 1) return 'childrensDay';
    
    // 农历节日的阳历日期（需要每年更新）
    const lunarHolidays = this.getLunarHolidayDates(year);
    
    // 检查端午节
    if (lunarHolidays.dragonBoat) {
      const dragonBoatDate = lunarHolidays.dragonBoat;
      if (month === dragonBoatDate.month && day === dragonBoatDate.day) {
        return 'dragonBoat';
      }
    }
    
    // 检查中秋节
    if (lunarHolidays.midAutumn) {
      const midAutumnDate = lunarHolidays.midAutumn;
      if (month === midAutumnDate.month && day === midAutumnDate.day) {
        return 'midAutumn';
      }
    }
    
    // 周末检测
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    
    return null;
  }

  // 获取农历节日的阳历日期（简化版本）
  getLunarHolidayDates(year) {
    // 这里提供2024-2030年的农历节日阳历日期
    const holidayDates = {
      2024: {
        dragonBoat: { month: 6, day: 10 },   // 2024年端午节
        midAutumn: { month: 9, day: 17 }     // 2024年中秋节
      },
      2025: {
        dragonBoat: { month: 5, day: 31 },   // 2025年端午节
        midAutumn: { month: 10, day: 6 }     // 2025年中秋节
      },
      2026: {
        dragonBoat: { month: 6, day: 19 },   // 2026年端午节
        midAutumn: { month: 9, day: 25 }     // 2026年中秋节
      },
      2027: {
        dragonBoat: { month: 6, day: 9 },    // 2027年端午节
        midAutumn: { month: 9, day: 15 }     // 2027年中秋节
      },
      2028: {
        dragonBoat: { month: 5, day: 28 },   // 2028年端午节
        midAutumn: { month: 10, day: 3 }     // 2028年中秋节
      },
      2029: {
        dragonBoat: { month: 6, day: 16 },   // 2029年端午节
        midAutumn: { month: 9, day: 22 }     // 2029年中秋节
      },
      2030: {
        dragonBoat: { month: 6, day: 5 },    // 2030年端午节
        midAutumn: { month: 9, day: 12 }     // 2030年中秋节
      }
    };
    
    return holidayDates[year] || {};
  }

  // 从数组中随机选择一个元素，避免重复
  getRandomTip(tipsArray) {
    if (!tipsArray || tipsArray.length === 0) return '';
    
    // 过滤掉最近使用过的提示语
    const availableTips = tipsArray.filter(tip => !this.tipHistory.includes(tip));
    const selectedTips = availableTips.length > 0 ? availableTips : tipsArray;
    
    const randomTip = selectedTips[Math.floor(Math.random() * selectedTips.length)];
    
    // 更新历史记录
    this.tipHistory.push(randomTip);
    if (this.tipHistory.length > this.maxHistoryLength) {
      this.tipHistory.shift();
    }
    
    return randomTip;
  }

  // 获取智能提示语
  getSmartTip(context = 'idle') {
    const now = Date.now();
    
    // 防止提示语更新过于频繁
    if (now - this.lastTipTime < 5000) {
      return null;
    }
    
    this.lastTipTime = now;
    
    let tip = '';
    
    switch (context) {
      case 'copy':
        tip = this.getRandomTip(this.tips.interactionTips.copy);
        break;
      case 'scroll':
        tip = this.getRandomTip(this.tips.interactionTips.scroll);
        break;
      case 'search':
        tip = this.getRandomTip(this.tips.interactionTips.search);
        break;
      case 'comment':
        tip = this.getRandomTip(this.tips.interactionTips.comment);
        break;
      case 'share':
        tip = this.getRandomTip(this.tips.interactionTips.share);
        break;
      case 'theme':
        tip = this.getRandomTip(this.tips.interactionTips.theme);
        break;
      case 'music':
        tip = this.getRandomTip(this.tips.interactionTips.music);
        break;
      case 'navigation':
        tip = this.getRandomTip(this.tips.interactionTips.navigation);
        break;
      case 'location':
        tip = this.getRandomTip(this.locationTips);
        break;
      case 'weather':
        tip = this.getRandomTip(this.weatherTips);
        break;
      case 'idle':
      default:
        // 10% 概率显示地域问候语
        if (this.locationTips.length > 0 && Math.random() < 0.08) {
          tip = this.getRandomTip(this.locationTips);
          break;
        }
        
        // 12% 概率显示天气相关提示
        if (this.weatherTips.length > 0 && Math.random() < 0.12) {
          tip = this.getRandomTip(this.weatherTips);
          break;
        }
        
        // 检查特殊节日
        const holiday = this.getHoliday();
        if (holiday && Math.random() < 0.2) {
          tip = this.getRandomTip(this.tips.holidayTips[holiday]);
          break;
        }
        
        // 根据概率选择不同类型的提示语
        const random = Math.random();
        if (random < 0.25) {
          // 25% 概率显示时间相关提示
          const timeOfDay = this.getTimeOfDay();
          tip = this.getRandomTip(this.tips.timeBasedTips[timeOfDay]);
        } else if (random < 0.4) {
          // 15% 概率显示星期相关提示
          const dayOfWeek = this.getDayOfWeek();
          tip = this.getRandomTip(this.tips.weekdayTips[dayOfWeek]);
        } else if (random < 0.55) {
          // 15% 概率显示季节相关提示
          const season = this.getSeason();
          tip = this.getRandomTip(this.tips.seasonTips[season]);
        } else if (random < 0.8) {
          // 25% 概率显示博客导航提示
          tip = this.getRandomTip(this.tips.interactionTips.navigation);
        } else {
          // 20% 概率显示通用提示语
          tip = this.getRandomTip(this.tips.generalTips);
        }
        break;
    }
    
    return tip;
  }

  // 添加自定义提示语
  addCustomTips(category, tips) {
    if (!this.tips[category]) {
      this.tips[category] = [];
    }
    this.tips[category] = this.tips[category].concat(tips);
  }

  // 获取所有提示语统计
  getTipsStats() {
    let totalTips = 0;
    const stats = {};
    
    for (const [category, tips] of Object.entries(this.tips)) {
      if (Array.isArray(tips)) {
        stats[category] = tips.length;
        totalTips += tips.length;
      } else if (typeof tips === 'object') {
        stats[category] = {};
        for (const [subCategory, subTips] of Object.entries(tips)) {
          if (Array.isArray(subTips)) {
            stats[category][subCategory] = subTips.length;
            totalTips += subTips.length;
          }
        }
      }
    }
    
    stats.total = totalTips;
    return stats;
  }
}

// 导出给全局使用
window.SmartTipsManager = new SmartTipsManager();

// 使用示例
console.log('Smart Tips Manager loaded!');
console.log('Tips Statistics:', window.SmartTipsManager.getTipsStats());