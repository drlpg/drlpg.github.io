function clockUpdateTime(info, city) {
  // 检查必要的参数
  if (!info || !info.now) {
    console.error('天气数据格式错误')
    return
  }
  
  let currentColor = '#000'
  switch (info.now.icon) {
    case '100':
      currentColor = '#fdcc45'
      break
    case '101':
      currentColor = '#fe6976'
      break
    case '102':
    case '103':
      currentColor = '#fe7f5b'
      break
    case '104':
    case '150':
    case '151':
    case '152':
    case '153':
    case '154':
    case '800':
    case '801':
    case '802':
    case '803':
    case '804':
    case '805':
    case '806':
    case '807':
      currentColor = '#2152d1'
      break
    case '300':
    case '301':
    case '305':
    case '306':
    case '307':
    case '308':
    case '309':
    case '310':
    case '311':
    case '312':
    case '313':
    case '314':
    case '315':
    case '316':
    case '317':
    case '318':
    case '350':
    case '351':
    case '399':
      currentColor = '#49b1f5'
      break
    case '302':
    case '303':
    case '304':
      currentColor = '#fdcc46'
      break
    case '400':
    case '401':
    case '402':
    case '403':
    case '404':
    case '405':
    case '406':
    case '407':
    case '408':
    case '409':
    case '410':
    case '456':
    case '457':
    case '499':
      currentColor = '#a3c2dc'
      break
    case '500':
    case '501':
    case '502':
    case '503':
    case '504':
    case '507':
    case '508':
    case '509':
    case '510':
    case '511':
    case '512':
    case '513':
    case '514':
    case '515':
      currentColor = '#97acba'
      break
    case '900':
    case '999':
      currentColor = 'red'
      break
    case '901':
      currentColor = '#179fff;'
      break
    default:
      break
  }
  var clock_box = document.getElementById('hexo_electric_clock')
  
  if (!clock_box) {
    console.error('时钟容器未找到')
    return
  }
  
  clock_box_html = `
  <div class="clock-row">
    <span id="card-clock-clockdate" class="card-clock-clockdate"></span>
    <span class="card-clock-weather"><i class="qi-${info.now.icon}-fill" style="color: ${currentColor}"></i> ${info.now.text} <span>${info.now.temp}</span> ℃</span>
    <span class="card-clock-humidity">💧 ${info.now.humidity}%</span>
  </div>
  <div class="clock-row">
    <span id="card-clock-time" class="card-clock-time"></span>
  </div>
  <div class="clock-row">
    <span class="card-clock-windDir"> <i class="qi-gale"></i> ${info.now.windDir}</span>
    <span class="card-clock-location">${city}</span>
    <span id="card-clock-dackorlight" class="card-clock-dackorlight"></span>
  </div>
  `
  var week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  var card_clock_loading_dom = document.getElementById('card-clock-loading')
  if (card_clock_loading_dom) {
    card_clock_loading_dom.innerHTML = ''
  }
  
  // 平滑更新内容
  if (clock_box.innerHTML !== clock_box_html) {
    clock_box.style.opacity = '0.5'
    setTimeout(() => {
      clock_box.innerHTML = clock_box_html
      clock_box.style.opacity = '1'
    }, 150)
  } else {
    clock_box.innerHTML = clock_box_html
  }
  function updateTime() {
    try {
      var cd = new Date()
      var card_clock_time =
        zeroPadding(cd.getHours(), 2) +
        ':' +
        zeroPadding(cd.getMinutes(), 2) +
        ':' +
        zeroPadding(cd.getSeconds(), 2)
      var card_clock_date =
        zeroPadding(cd.getFullYear(), 4) +
        '-' +
        zeroPadding(cd.getMonth() + 1, 2) +
        '-' +
        zeroPadding(cd.getDate(), 2) +
        ' ' +
        week[cd.getDay()]
      var card_clock_dackorlight = cd.getHours()
      var card_clock_dackorlight_str
      if (card_clock_dackorlight > 12) {
        card_clock_dackorlight -= 12
        card_clock_dackorlight_str = ' P M'
      } else {
        card_clock_dackorlight_str = ' A M'
      }
      
      // 安全地更新DOM元素
      var card_clock_time_dom = document.getElementById('card-clock-time')
      var card_clock_date_dom = document.getElementById('card-clock-clockdate')
      var card_clock_dackorlight_dom = document.getElementById('card-clock-dackorlight')
      
      if (card_clock_time_dom) {
        card_clock_time_dom.innerHTML = card_clock_time
      }
      if (card_clock_date_dom) {
        card_clock_date_dom.innerHTML = card_clock_date
      }
      if (card_clock_dackorlight_dom) {
        card_clock_dackorlight_dom.innerHTML = card_clock_dackorlight_str
      }
    } catch (error) {
      console.error('时间更新失败:', error)
    }
  }
  function zeroPadding(num, digit) {
    var zero = ''
    for (var i = 0; i < digit; i++) {
      zero += '0'
    }
    return (zero + num).slice(-digit)
  }
  var timerID = setInterval(updateTime, 1000)
  updateTime()
  
  // 添加定时器清理和页面可见性优化
  window.clockTimerID = timerID // 保存到全局变量以便清理
  
  // 页面可见性变化时优化性能
  if (typeof document.visibilityState !== 'undefined') {
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时降低更新频率
        if (window.clockTimerID) {
          clearInterval(window.clockTimerID)
          window.clockTimerID = setInterval(updateTime, 5000) // 5秒更新一次
        }
      } else {
        // 页面显示时恢复正常频率
        if (window.clockTimerID) {
          clearInterval(window.clockTimerID)
          window.clockTimerID = setInterval(updateTime, 1000) // 1秒更新一次
          updateTime() // 立即更新一次
        }
      }
    })
  }
}

// 显示加载状态
function showClockLoading(message = '正在加载天气数据...') {
  const clock_box = document.getElementById('hexo_electric_clock')
  if (clock_box) {
    clock_box.innerHTML = `
      <div id="card-clock-loading" class="clock-loading">
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 14px; opacity: 0.7;">${message}</div>
        </div>
      </div>
    `
  }
}

// 显示错误状态
function showClockError(message = '天气数据加载失败，使用默认数据') {
  const clock_box = document.getElementById('hexo_electric_clock')
  if (clock_box) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'clock-error'
    errorDiv.style.fontSize = '12px'
    errorDiv.style.opacity = '0.6'
    errorDiv.textContent = message
    
    // 3秒后移除错误信息
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove()
      }
    }, 3000)
    
    clock_box.appendChild(errorDiv)
  }
}

// 数据缓存机制
const clockCache = {
  weather: null,
  city: null,
  timestamp: 0,
  duration: 10 * 60 * 1000, // 10分钟缓存
  
  set: function(weather, city) {
    this.weather = weather
    this.city = city
    this.timestamp = Date.now()
    try {
      localStorage.setItem('clock_cache', JSON.stringify({
        weather: weather,
        city: city,
        timestamp: this.timestamp
      }))
    } catch (e) {
      console.warn('无法保存时钟缓存到localStorage')
    }
  },
  
  get: function() {
    if (this.isValid()) {
      return { weather: this.weather, city: this.city }
    }
    
    // 尝试从localStorage恢复
    try {
      const cached = localStorage.getItem('clock_cache')
      if (cached) {
        const data = JSON.parse(cached)
        if (Date.now() - data.timestamp < this.duration) {
          this.weather = data.weather
          this.city = data.city
          this.timestamp = data.timestamp
          return { weather: data.weather, city: data.city }
        }
      }
    } catch (e) {
      console.warn('无法从localStorage读取时钟缓存')
    }
    
    return null
  },
  
  isValid: function() {
    return this.weather && this.city && (Date.now() - this.timestamp < this.duration)
  },
  
  clear: function() {
    this.weather = null
    this.city = null
    this.timestamp = 0
    try {
      localStorage.removeItem('clock_cache')
    } catch (e) {
      // 忽略错误
    }
  }
}

function getIpInfo() {
  let defaultInfo = {
    city: '北京市',
    qweather_url: ''
  }
  
  // 检查缓存
  const cached = clockCache.get()
  if (cached && isOnline) {
    console.log('使用缓存的天气数据')
    clockUpdateTime(cached.weather, cached.city)
    return
  }
  
  const qweatherApiBase = 'https://nx6yvwhdc7.re.qweatherapi.com/v7/weather/now'
  
  // 添加初始化检查
  if (!document.getElementById('hexo_electric_clock')) {
    console.warn('时钟容器未找到，跳过初始化')
    return
  }
  
  // 显示加载状态
  showClockLoading()
  
  // 添加API密钥检查
  if (typeof qweather_key === 'undefined' || !qweather_key) {
    console.warn('和风天气API密钥未配置，使用默认天气数据')
    showClockError('API密钥未配置，使用默认数据')
    setTimeout(useEmergencyFallback, 1000)
    return
  }
  
  if (typeof clock_default_rectangle_enable !== 'undefined' && clock_default_rectangle_enable === 'true') {
    useDefaultLocation()
  } else {
    tryMultipleLocationMethods()
  }
  
  function useDefaultLocation() {
    const location = clock_rectangle || '116.404000,39.928000'
    
    // 添加超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 10000)
    })
    
    Promise.race([
      Promise.all([
        fetch(`https://restapi.amap.com/v3/geocode/regeo?key=${gaud_map_key}&location=${location}`)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          }),
        fetch(`${qweatherApiBase}?location=${location}&key=${qweather_key}`)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          })
      ]),
      timeoutPromise
    ])
    .then(([regeoData, weatherData]) => {
      let city = defaultInfo.city
      if (regeoData && regeoData.status === "1" && regeoData.regeocode && regeoData.regeocode.addressComponent) {
        const addressComponent = regeoData.regeocode.addressComponent
        city = Array.isArray(addressComponent.city) ? addressComponent.province : addressComponent.city
      }
      
      // 验证天气数据
      if (weatherData && weatherData.now && document.getElementById('hexo_electric_clock')) {
        // 保存到缓存
        clockCache.set(weatherData, city)
        clockUpdateTime(weatherData, city)
      } else {
        throw new Error('天气数据格式错误')
      }
    })
    .catch(error => {
      showClockError('天气数据获取失败，使用默认数据')
      setTimeout(useEmergencyFallback, 1000)
    })
  }
  
  function tryMultipleLocationMethods() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          const location = `${lon},${lat}`
          getWeatherByLocation(location, '当前位置')
        },
        function(error) {
          tryIpLocationMethods()
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 600000
        }
      )
    } else {
      tryIpLocationMethods()
    }
  }
  
  function tryIpLocationMethods() {
    tryAmapIpLocation()
    .catch(() => {
      return tryAlternativeIpServices()
    })
    .catch(() => {
      useDefaultLocation()
    })
  }
  
  function tryAmapIpLocation() {
    return fetch(`https://restapi.amap.com/v3/ip?key=${gaud_map_key}`)
    .then(res => {
      if (!res.ok) throw new Error('高德IP定位请求失败')
      return res.json()
    })
    .then(data => {
      if (data.status === '1') {
        if (Array.isArray(data.rectangle) || !data.rectangle) {
          throw new Error('高德IP定位数据格式异常')
        }
        
        const location = data.rectangle.split(';')[0]
        let city = defaultInfo.city
        if (data.city && !Array.isArray(data.city)) {
          city = data.city
        } else if (data.province && !Array.isArray(data.province)) {
          city = data.province
        }
        
        getWeatherByLocation(location, city)
        return Promise.resolve()
      } else {
        throw new Error('高德IP定位API返回失败状态')
      }
    })
  }
  
  function tryAlternativeIpServices() {
    const ipServices = [
      {
        name: 'ipapi.co',
        url: 'https://ipapi.co/json/',
        parser: (data) => ({
          location: `${data.longitude},${data.latitude}`,
          city: data.city || data.region || defaultInfo.city
        })
      }
    ]
    
    return ipServices.reduce((promise, service) => {
      return promise.catch(() => {
        return fetch(service.url)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          })
          .then(data => {
            const parsed = service.parser(data)
            if (parsed.location && parsed.location !== 'undefined,undefined') {
              getWeatherByLocation(parsed.location, parsed.city)
              return Promise.resolve()
            } else {
              throw new Error(`${service.name} 数据无效`)
            }
          })
      })
    }, Promise.reject('开始尝试备用服务'))
  }
  
  function getWeatherByLocation(location, cityName) {
    const weatherPromise = fetch(`${qweatherApiBase}?location=${location}&key=${qweather_key}`)
      .then(res => res.json())
    
    const cityPromise = typeof cityName === 'string' && cityName !== '当前位置' && cityName !== '浏览器定位'
      ? Promise.resolve(cityName)
      : fetch(`https://restapi.amap.com/v3/geocode/regeo?key=${gaud_map_key}&location=${location}`)
          .then(res => res.json())
          .then(data => {
            if (data.status === "1" && data.regeocode && data.regeocode.addressComponent) {
              const addressComponent = data.regeocode.addressComponent
              let city = defaultInfo.city
              if (addressComponent.city && !Array.isArray(addressComponent.city)) {
                city = addressComponent.city
              } else if (addressComponent.province && !Array.isArray(addressComponent.province)) {
                city = addressComponent.province
              } else if (addressComponent.district && !Array.isArray(addressComponent.district)) {
                city = addressComponent.district
              }
              return city
            }
            return defaultInfo.city
          })
          .catch(error => {
            return defaultInfo.city
          })
    
    Promise.all([weatherPromise, cityPromise])
    .then(([weatherData, city]) => {
      if (weatherData && weatherData.now && document.getElementById('hexo_electric_clock')) {
        clockUpdateTime(weatherData, city)
      } else {
        throw new Error('天气数据无效')
      }
    })
    .catch(error => {
      useEmergencyFallback()
    })
  }
  
  function useEmergencyFallback() {
    const defaultWeatherData = {
      now: {
        icon: '100',
        text: '晴',
        temp: '25',
        humidity: '60',
        windDir: '南风'
      }
    }
    
    if (document.getElementById('hexo_electric_clock')) {
      clockUpdateTime(defaultWeatherData, defaultInfo.city)
    }
  }
}

// 页面卸载时清理定时器
window.addEventListener('beforeunload', function() {
  if (window.clockTimerID) {
    clearInterval(window.clockTimerID)
    window.clockTimerID = null
  }
})

// 添加重新初始化函数
window.reinitializeClock = function() {
  console.log('手动重新初始化时钟')
  if (window.clockTimerID) {
    clearInterval(window.clockTimerID)
    window.clockTimerID = null
  }
  
  // 清除缓存
  if (typeof clockCache !== 'undefined') {
    clockCache.clear()
  }
  
  // 重新等待配置并初始化
  waitForClockConfig(() => {
    setTimeout(getIpInfo, 1000)
  })
}

// 页面可见性变化时重新初始化（解决某些情况下的初始化失败）
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && document.getElementById('hexo_electric_clock')) {
    // 页面变为可见时，检查时钟是否正常运行
    setTimeout(() => {
      const timeElement = document.getElementById('card-clock-time')
      if (!timeElement || !timeElement.innerHTML.trim()) {
        console.log('页面可见性变化，时钟未运行，重新初始化')
        window.reinitializeClock()
      }
    }, 2000)
  }
})

// 配置验证函数
function validateClockConfig() {
  const requiredVars = ['qweather_key', 'gaud_map_key']
  const missingVars = []
  
  requiredVars.forEach(varName => {
    if (typeof window[varName] === 'undefined' || !window[varName]) {
      missingVars.push(varName)
    }
  })
  
  if (missingVars.length > 0) {
    console.warn('时钟配置缺失:', missingVars.join(', '))
    return false
  }
  
  return true
}

// 等待配置变量加载的函数
function waitForClockConfig(callback, maxAttempts = 10, currentAttempt = 0) {
  if (currentAttempt >= maxAttempts) {
    console.error('等待时钟配置超时，使用默认配置')
    // 设置默认值
    window.qweather_key = window.qweather_key || 'a17e385cf6d94f078f77b3dde0c2a18c'
    window.gaud_map_key = window.gaud_map_key || '5f5c8c34b248d5f76b10b65f8a7fa1d0'
    window.clock_rectangle = window.clock_rectangle || '116.404000,39.928000'
    window.clock_default_rectangle_enable = window.clock_default_rectangle_enable || 'false'
    callback()
    return
  }
  
  if (validateClockConfig()) {
    callback()
  } else {
    setTimeout(() => {
      waitForClockConfig(callback, maxAttempts, currentAttempt + 1)
    }, 500)
  }
}

// 初始化
function initializeClock() {
  // 等待配置变量加载
  waitForClockConfig(() => {
    setTimeout(getIpInfo, 1000)
  })
}

// PJAX 兼容性处理
function setupClockInitialization() {
  // 首次加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeClock, 1500)
    })
  } else {
    setTimeout(initializeClock, 1500)
  }
  
  // PJAX 页面切换后重新初始化
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    // 使用 Butterfly 主题的 PJAX 钩子
    btf.addGlobalFn('pjaxComplete', () => {
      // 检查是否存在时钟容器
      if (document.getElementById('hexo_electric_clock')) {
        console.log('PJAX 完成，重新初始化时钟')
        // 清理之前的定时器
        if (window.clockTimerID) {
          clearInterval(window.clockTimerID)
          window.clockTimerID = null
        }
        // 延迟初始化，确保页面内容已完全加载
        setTimeout(initializeClock, 1000)
      }
    }, 'clockReinit')
  } else {
    // 兼容其他 PJAX 实现
    window.addEventListener('pjax:complete', () => {
      if (document.getElementById('hexo_electric_clock')) {
        console.log('PJAX 完成，重新初始化时钟')
        if (window.clockTimerID) {
          clearInterval(window.clockTimerID)
          window.clockTimerID = null
        }
        setTimeout(initializeClock, 1000)
      }
    })
    
    // 监听 popstate 事件（浏览器前进后退）
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        if (document.getElementById('hexo_electric_clock')) {
          console.log('页面导航，重新初始化时钟')
          if (window.clockTimerID) {
            clearInterval(window.clockTimerID)
            window.clockTimerID = null
          }
          setTimeout(initializeClock, 1000)
        }
      }, 500)
    })
  }
}

// 执行初始化设置
setupClockInitialization()

// 网络状态检测
let isOnline = navigator.onLine
let retryCount = 0
const maxRetries = 3

window.addEventListener('online', function() {
  isOnline = true
  retryCount = 0
  if (typeof window.reinitializeClock === 'function') {
    window.reinitializeClock()
  }
})

window.addEventListener('offline', function() {
  isOnline = false
  showClockError('网络连接断开，显示本地时间')
})

// 添加错误恢复机制
setInterval(function() {
  // 每5分钟检查一次时钟是否正常运行
  const timeElement = document.getElementById('card-clock-time')
  if (!timeElement || !timeElement.innerHTML) {
    if (retryCount < maxRetries) {
      retryCount++
      if (typeof window.reinitializeClock === 'function') {
        window.reinitializeClock()
      }
    } else {
      showClockError('时钟初始化失败，请刷新页面')
    }
  } else {
    retryCount = 0 // 重置重试计数
  }
}, 300000) // 5分钟



// 简化的调试工具
window.clockDebug = {
  // 获取时钟状态
  getStatus: function() {
    return {
      hasContainer: !!document.getElementById('hexo_electric_clock'),
      hasTimeElement: !!document.getElementById('card-clock-time'),
      hasTimer: !!window.clockTimerID,
      isOnline: isOnline,
      retryCount: retryCount
    }
  },
  
  // 强制重新初始化
  forceReinit: function() {
    retryCount = 0
    if (typeof window.reinitializeClock === 'function') {
      window.reinitializeClock()
    }
  }
}

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + Shift + C: 重新初始化时钟
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
    e.preventDefault()
    if (typeof window.clockDebug !== 'undefined') {
      window.clockDebug.forceReinit()
    }
  }
  
  // Ctrl/Cmd + Shift + D: 显示调试信息
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
    e.preventDefault()
    if (typeof window.clockDebug !== 'undefined') {
      console.table(window.clockDebug.getStatus())
    }
  }
})

// 添加右键菜单支持（如果存在自定义右键菜单）
if (typeof window.customContextMenu !== 'undefined') {
  document.addEventListener('contextmenu', function(e) {
    const clockElement = document.getElementById('hexo_electric_clock')
    if (clockElement && clockElement.contains(e.target)) {
      // 可以在这里添加时钟特定的右键菜单项
      console.log('时钟区域右键点击')
    }
  })
}