function clockUpdateTime(info, city) {
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
  clock_box.innerHTML = clock_box_html
  function updateTime() {
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
    if (document.getElementById('card-clock-time')) {
      var card_clock_time_dom = document.getElementById('card-clock-time')
      var card_clock_date_dom = document.getElementById('card-clock-clockdate')
      var card_clock_dackorlight_dom = document.getElementById('card-clock-dackorlight')
      card_clock_time_dom.innerHTML = card_clock_time
      card_clock_date_dom.innerHTML = card_clock_date
      card_clock_dackorlight_dom.innerHTML = card_clock_dackorlight_str
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
}

function getIpInfo() {
  let defaultInfo = {
    city: '北京市',
    qweather_url: ''
  }
  
  // 使用配置的API地址
  const qweatherApiBase = 'https://nx6yvwhdc7.re.qweatherapi.com/v7/weather/now'
  
  console.log('开始获取位置信息...')
  console.log('default_rectangle_enable:', typeof clock_default_rectangle_enable !== 'undefined' ? clock_default_rectangle_enable : 'undefined')
  
  if (typeof clock_default_rectangle_enable !== 'undefined' && clock_default_rectangle_enable === 'true') {
    console.log('使用默认位置模式')
    useDefaultLocation()
  } else {
    console.log('尝试获取实时位置...')
    // 多种方式尝试获取位置
    tryMultipleLocationMethods()
  }
  
  function useDefaultLocation() {
    const location = clock_rectangle || '116.404000,39.928000'
    console.log('使用默认位置:', location)
    
    Promise.all([
      fetch(`https://restapi.amap.com/v3/geocode/regeo?key=${gaud_map_key}&location=${location}`),
      fetch(`${qweatherApiBase}?location=${location}&key=${qweather_key}`)
    ])
    .then(([regeoRes, weatherRes]) => Promise.all([regeoRes.json(), weatherRes.json()]))
    .then(([regeoData, weatherData]) => {
      let city = defaultInfo.city
      if (regeoData.status === "1") {
        const addressComponent = regeoData.regeocode.addressComponent
        city = Array.isArray(addressComponent.city) ? addressComponent.province : addressComponent.city
      }
      console.log('获取到城市:', city)
      console.log('天气数据:', weatherData)
      
      if (document.getElementById('hexo_electric_clock')) {
        clockUpdateTime(weatherData, city)
      }
    })
    .catch(error => {
      console.error('默认位置获取失败:', error)
      useEmergencyFallback()
    })
  }
  
  function tryMultipleLocationMethods() {
    // 方法1: 优先使用浏览器地理位置API（测试显示工作正常）
    if (navigator.geolocation) {
      console.log('尝试浏览器地理位置API...')
      navigator.geolocation.getCurrentPosition(
        function(position) {
          console.log('✅ 浏览器地理位置获取成功:', position.coords)
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          const location = `${lon},${lat}`
          console.log('使用精确坐标:', location)
          getWeatherByLocation(location, '当前位置')
        },
        function(error) {
          console.warn('❌ 浏览器地理位置获取失败:', error.message, '错误代码:', error.code)
          console.log('回退到IP定位方法...')
          tryIpLocationMethods()
        },
        {
          timeout: 10000,
          enableHighAccuracy: true, // 启用高精度
          maximumAge: 600000 // 10分钟缓存
        }
      )
    } else {
      console.log('浏览器不支持地理位置API，使用IP定位')
      tryIpLocationMethods()
    }
  }
  
  function tryIpLocationMethods() {
    console.log('尝试IP定位方法...')
    
    // 方法2: 高德IP定位
    tryAmapIpLocation()
    .catch(() => {
      console.log('高德IP定位失败，尝试其他服务...')
      return tryAlternativeIpServices()
    })
    .catch(() => {
      console.log('所有IP定位方法都失败，使用默认位置')
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
      console.log('高德IP定位结果:', data)
      
      // 修复：检查数据格式，处理数组情况
      if (data.status === '1') {
        // 如果rectangle是数组或者为空，抛出错误让其使用备用服务
        if (Array.isArray(data.rectangle) || !data.rectangle) {
          throw new Error('高德IP定位数据格式异常，rectangle为空或数组')
        }
        
        const location = data.rectangle.split(';')[0]
        // 修复：处理城市和省份可能是数组的情况
        let city = defaultInfo.city
        if (data.city && !Array.isArray(data.city)) {
          city = data.city
        } else if (data.province && !Array.isArray(data.province)) {
          city = data.province
        }
        
        console.log('高德IP定位成功 - 位置:', location, '城市:', city)
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
    
    // 使用第一个可用的服务
    return ipServices.reduce((promise, service) => {
      return promise.catch(() => {
        console.log(`尝试 ${service.name}...`)
        return fetch(service.url)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          })
          .then(data => {
            console.log(`${service.name} 定位结果:`, data)
            const parsed = service.parser(data)
            if (parsed.location && parsed.location !== 'undefined,undefined') {
              console.log(`${service.name} 解析成功:`, parsed)
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
    console.log('获取天气 - 位置:', location, '城市:', cityName)
    
    const weatherPromise = fetch(`${qweatherApiBase}?location=${location}&key=${qweather_key}`)
      .then(res => res.json())
    
    const cityPromise = typeof cityName === 'string' && cityName !== '当前位置' && cityName !== '浏览器定位'
      ? Promise.resolve(cityName)
      : fetch(`https://restapi.amap.com/v3/geocode/regeo?key=${gaud_map_key}&location=${location}`)
          .then(res => res.json())
          .then(data => {
            console.log('逆地理编码结果:', data)
            if (data.status === "1" && data.regeocode && data.regeocode.addressComponent) {
              const addressComponent = data.regeocode.addressComponent
              // 优先使用城市，如果城市是数组则使用省份
              let city = defaultInfo.city
              if (addressComponent.city && !Array.isArray(addressComponent.city)) {
                city = addressComponent.city
              } else if (addressComponent.province && !Array.isArray(addressComponent.province)) {
                city = addressComponent.province
              } else if (addressComponent.district && !Array.isArray(addressComponent.district)) {
                city = addressComponent.district
              }
              console.log('解析得到城市:', city)
              return city
            }
            return defaultInfo.city
          })
          .catch(error => {
            console.log('逆地理编码失败:', error.message)
            return defaultInfo.city
          })
    
    Promise.all([weatherPromise, cityPromise])
    .then(([weatherData, city]) => {
      console.log('最终结果 - 天气:', weatherData, '城市:', city)
      
      if (weatherData && weatherData.now && document.getElementById('hexo_electric_clock')) {
        clockUpdateTime(weatherData, city)
      } else {
        throw new Error('天气数据无效')
      }
    })
    .catch(error => {
      console.error('获取天气失败:', error)
      useEmergencyFallback()
    })
  }
  
  function useEmergencyFallback() {
    console.log('使用紧急备用方案')
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

// 添加调试信息
console.log('时钟插件脚本已加载')
console.log('当前协议:', window.location.protocol)
console.log('是否支持地理位置:', 'geolocation' in navigator)

// 确保DOM加载完成后再执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始时钟初始化...')
    setTimeout(getIpInfo, 1000) // 延迟1秒执行
  })
} else {
  console.log('DOM已就绪，开始时钟初始化...')
  setTimeout(getIpInfo, 1000)
}