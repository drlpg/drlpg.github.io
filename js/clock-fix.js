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
  
  const qweatherApiBase = 'https://nx6yvwhdc7.re.qweatherapi.com/v7/weather/now'
  
  if (typeof clock_default_rectangle_enable !== 'undefined' && clock_default_rectangle_enable === 'true') {
    useDefaultLocation()
  } else {
    tryMultipleLocationMethods()
  }
  
  function useDefaultLocation() {
    const location = clock_rectangle || '116.404000,39.928000'
    
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
      
      if (document.getElementById('hexo_electric_clock')) {
        clockUpdateTime(weatherData, city)
      }
    })
    .catch(error => {
      useEmergencyFallback()
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(getIpInfo, 1000)
  })
} else {
  setTimeout(getIpInfo, 1000)
}