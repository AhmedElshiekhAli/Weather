  /* ── LIVE CLOCK ── */
  function updateClock() {
    const el = document.getElementById('liveTime');
    if (!el) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.textContent = `${h}:${m} · ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} '${String(now.getFullYear()).slice(2)}`;
  }
  updateClock();
  setInterval(updateClock, 30000);

  /* ── SNOW ANIMATION ── */
  (function initSnow() {
    const canvas = document.getElementById('snowCanvas');
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const flakes = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      speed: Math.random() * 0.7 + 0.3,
      drift: (Math.random() - 0.5) * 0.45,
      opacity: Math.random() * 0.55 + 0.15
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      flakes.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
        ctx.fill();
        f.y += f.speed;
        f.x += f.drift;
        if (f.y > canvas.height + 5) { f.y = -5; f.x = Math.random() * canvas.width; }
        if (f.x > canvas.width + 5) f.x = -5;
        if (f.x < -5) f.x = canvas.width + 5;
      });
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ── WEATHER DATA (Open-Meteo — free, no API key) ── */
  const WMO_CODES = {
    0: { label: 'Clear Sky', icon: 'ti-sun' },
    1: { label: 'Mainly Clear', icon: 'ti-sun' },
    2: { label: 'Partly Cloudy', icon: 'ti-cloud' },
    3: { label: 'Overcast', icon: 'ti-cloud' },
    45: { label: 'Fog', icon: 'ti-cloud-fog' },
    48: { label: 'Icy Fog', icon: 'ti-cloud-fog' },
    51: { label: 'Light Drizzle', icon: 'ti-cloud-drizzle' },
    53: { label: 'Drizzle', icon: 'ti-cloud-drizzle' },
    55: { label: 'Heavy Drizzle', icon: 'ti-cloud-drizzle' },
    61: { label: 'Light Rain', icon: 'ti-cloud-rain' },
    63: { label: 'Rain', icon: 'ti-cloud-rain' },
    65: { label: 'Heavy Rain', icon: 'ti-cloud-rain' },
    71: { label: 'Light Snow', icon: 'ti-snowflake' },
    73: { label: 'Snow', icon: 'ti-snowflake' },
    75: { label: 'Heavy Snow', icon: 'ti-snowflake' },
    77: { label: 'Snow Grains', icon: 'ti-snowflake' },
    80: { label: 'Light Showers', icon: 'ti-cloud-rain' },
    81: { label: 'Showers', icon: 'ti-cloud-rain' },
    82: { label: 'Heavy Showers', icon: 'ti-cloud-rain' },
    85: { label: 'Snow Showers', icon: 'ti-snowflake' },
    86: { label: 'Heavy Snow Showers', icon: 'ti-snowflake' },
    95: { label: 'Thunderstorm', icon: 'ti-cloud-storm' },
    96: { label: 'Thunderstorm with Hail', icon: 'ti-cloud-storm' },
    99: { label: 'Thunderstorm with Hail', icon: 'ti-cloud-storm' },
  };

  async function fetchWeather(lat, lon, cityName) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,cloudcover&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weathercode&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      const data = await res.json();

      const cur = data.current;
      const daily = data.daily;
      const hourly = data.hourly;

      const wmo = WMO_CODES[cur.weathercode] || { label: 'Unknown', icon: 'ti-cloud' };
      const temp = Math.round(cur.temperature_2m);
      const wind = Math.round(cur.windspeed_10m);
      const humidity = Math.round(cur.relativehumidity_2m);
      const cloud = Math.round(cur.cloudcover);
      const tmax = Math.round(daily.temperature_2m_max[0]);
      const tmin = Math.round(daily.temperature_2m_min[0]);

      document.getElementById('mainTemp').textContent = `${temp}°`;
      document.getElementById('mainCity').textContent = cityName;
      document.getElementById('conditionTitle').textContent = wmo.label;
      document.getElementById('tempMax').textContent = `${tmax}°`;
      document.getElementById('tempMin').textContent = `${tmin}°`;
      document.getElementById('humidity').textContent = `${humidity}%`;
      document.getElementById('cloudiness').textContent = `${cloud}%`;
      document.getElementById('wind').textContent = `${wind} km/h`;

      const now = new Date();
      const currentHour = now.getHours();
      const slots = [];
      for (let i = 0; i < hourly.time.length; i++) {
        const hDate = new Date(hourly.time[i]);
        if (hDate.getHours() > currentHour && slots.length < 4) {
          slots.push({
            time: `${String(hDate.getHours()).padStart(2,'0')}:00`,
            temp: Math.round(hourly.temperature_2m[i]),
            code: hourly.weathercode[i]
          });
        }
      }

      const forecastList = document.getElementById('forecastList');
      forecastList.innerHTML = slots.map(s => {
        const info = WMO_CODES[s.code] || { label: 'Cloud', icon: 'ti-cloud' };
        return `
          <div class="forecast-item">
            <div class="forecast-left">
              <i class="ti ${info.icon} forecast-icon" aria-hidden="true"></i>
              <div>
                <div class="forecast-time">${s.time}</div>
                <div class="forecast-cond">${info.label}</div>
              </div>
            </div>
            <div class="forecast-temp">${s.temp}°</div>
          </div>`;
      }).join('');

    } catch (err) {
      console.error('Weather fetch failed:', err);
    }
  }

  async function geocode(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return { lat: r.latitude, lon: r.longitude, name: r.name };
    }
    return null;
  }

  async function loadCity(query) {
    const loc = await geocode(query);
    if (loc) fetchWeather(loc.lat, loc.lon, loc.name);
  }

  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim();
    if (q) loadCity(q);
  });
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) loadCity(q);
    }
  });

  /* ── LOAD DEFAULT CITY ── */
  fetchWeather(51.5085, -0.1257, 'London');