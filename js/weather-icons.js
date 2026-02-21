// 天气图标映射系统
window.WeatherIcons = {
    // 天气图标映射表
    iconMap: {
        // 晴天
        '100': '☀️', // 晴

        // 多云
        '101': '🌤️', // 多云
        '102': '⛅', // 少云
        '103': '☁️', // 晴间多云
        '104': '☁️', // 阴

        // 雾霾
        '150': '🌫️', // 清
        '151': '🌫️', // 雾
        '152': '🌫️', // 霾
        '153': '🌫️', // 沙尘暴

        // 雨天
        '300': '🌦️', // 阵雨
        '301': '🌧️', // 强阵雨
        '302': '⛈️', // 雷阵雨
        '303': '⛈️', // 强雷阵雨
        '304': '🌨️', // 雷阵雨伴有冰雹
        '305': '🌦️', // 小雨
        '306': '🌧️', // 中雨
        '307': '🌧️', // 大雨
        '308': '🌧️', // 极端降雨
        '309': '🌦️', // 毛毛雨/细雨
        '310': '🌧️', // 暴雨
        '311': '🌧️', // 大暴雨
        '312': '🌧️', // 特大暴雨
        '313': '🌨️', // 冻雨
        '314': '🌦️', // 小到中雨
        '315': '🌧️', // 中到大雨
        '316': '🌧️', // 大到暴雨
        '317': '🌧️', // 暴雨到大暴雨
        '318': '🌧️', // 大暴雨到特大暴雨
        '350': '🌦️', // 阵雨夜间
        '351': '🌧️', // 强阵雨夜间
        '399': '🌧️', // 雨

        // 雪天
        '400': '🌨️', // 小雪
        '401': '❄️', // 中雪
        '402': '❄️', // 大雪
        '403': '❄️', // 暴雪
        '404': '🌨️', // 雨夹雪
        '405': '🌨️', // 小雨夹雪
        '406': '🌨️', // 中雨夹雪
        '407': '🌨️', // 大雨夹雪
        '408': '❄️', // 阵雪
        '409': '❄️', // 强阵雪
        '410': '❄️', // 阵雪夜间
        '456': '🌨️', // 阵雨夹雪
        '457': '🌨️', // 阵雨夹雪夜间
        '499': '❄️', // 雪

        // 沙尘
        '500': '🌪️', // 薄雾
        '501': '🌫️', // 雾
        '502': '🌫️', // 霾
        '503': '🌪️', // 扬沙
        '504': '🌪️', // 浮尘
        '507': '🌪️', // 沙尘暴
        '508': '🌪️', // 强沙尘暴
        '509': '🌫️', // 浓雾
        '510': '🌫️', // 强浓雾
        '511': '🌫️', // 中度霾
        '512': '🌫️', // 重度霾
        '513': '🌫️', // 严重霾
        '514': '🌫️', // 大雾
        '515': '🌫️', // 特强浓雾

        // 其他
        '900': '🌡️', // 热
        '901': '🧊', // 冷
        '999': '❓', // 未知
    },

    // 风向图标映射 - 普通风向使用旗帜，特殊情况保持原有图标
    windMap: {
        // 普通风向使用旗帜图标
        '北风': '🚩',
        '东北风': '🚩',
        '东风': '🚩',
        '东南风': '🚩',
        '南风': '🚩',
        '西南风': '🚩',
        '西风': '🚩',
        '西北风': '🚩',

        // 更详细的风向
        '偏北风': '🚩',
        '偏东风': '🚩',
        '偏南风': '🚩',
        '偏西风': '🚩',

        // 特殊情况保持原有图标
        '无持续风向': '🌪️',
        '旋转不定': '🌪️',
        '静风': '🔇',
        '微风': '🍃',
        '轻风': '🍃'
    },

    // 获取天气图标
    getWeatherIcon: function (iconCode) {
        return this.iconMap[iconCode] || '🌤️';
    },

    // 获取风向图标 - 普通风向使用旗帜，特殊情况使用对应图标
    getWindIcon: function (windDir) {
        if (!windDir) return '🚩';
        
        // 清理风向文本
        const cleanWindDir = windDir.trim();
        
        // 直接匹配完整风向名称
        if (this.windMap[cleanWindDir]) {
            return this.windMap[cleanWindDir];
        }
        
        // 特殊情况处理
        if (cleanWindDir.includes('静') || cleanWindDir.includes('无风')) {
            return '🔇';
        }
        if (cleanWindDir.includes('微') || cleanWindDir.includes('轻')) {
            return '🍃';
        }
        if (cleanWindDir.includes('旋转') || cleanWindDir.includes('不定') || cleanWindDir.includes('无持续')) {
            return '🌪️';
        }
        
        // 普通风向统一使用旗帜图标
        return '🚩';
    },

    // 根据风速获取风力等级图标
    getWindSpeedIcon: function (windSpeed) {
        if (!windSpeed) return '';

        const speed = parseInt(windSpeed);
        if (speed <= 1) return '🔇'; // 静风
        if (speed <= 5) return '🍃'; // 轻风
        if (speed <= 11) return '💨'; // 微风
        if (speed <= 19) return '🌬️'; // 和风
        if (speed <= 28) return '🌪️'; // 清劲风
        if (speed <= 38) return '🌀'; // 强风
        return '🌊'; // 烈风及以上
    },

    // 获取完整的天气显示文本
    getWeatherDisplay: function (weatherData) {
        if (!weatherData || !weatherData.now) {
            return {
                icon: '🌤️',
                text: '晴',
                temp: '25',
                humidity: '60',
                windIcon: '🚩',
                windDir: '南风',
                windSpeed: '',
                windSpeedIcon: ''
            };
        }

        const now = weatherData.now;
        const windIcon = this.getWindIcon(now.windDir);
        const windSpeedIcon = now.windSpeed ? this.getWindSpeedIcon(now.windSpeed) : '';

        return {
            icon: this.getWeatherIcon(now.icon),
            text: now.text || '晴',
            temp: now.temp || '25',
            humidity: now.humidity || '60',
            windIcon: windIcon,
            windDir: now.windDir || '南风',
            windSpeed: now.windSpeed || '',
            windSpeedIcon: windSpeedIcon
        };
    },

    // 测试风向映射的函数
    testWindMapping: function () {
        const testWinds = [
            '北风', '东北风', '东风', '东南风',
            '南风', '西南风', '西风', '西北风',
            '偏北风', '偏东风', '偏南风', '偏西风',
            '无持续风向', '静风', '微风', '旋转不定'
        ];

        // 风向图标映射测试（静默模式）
    }
};

// 初始化确认 - v20250914
// 天气图标系统已加载 v20250914

// 强制清除旧版本缓存
if (typeof window.weatherIconsVersion === 'undefined' || window.weatherIconsVersion !== '20250914') {
  window.weatherIconsVersion = '20250914';
  // console.log('天气图标系统版本更新，清除旧缓存');
}

// 导出到全局
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherIcons;
}