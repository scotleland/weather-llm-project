// 🔑 OpenWeather API KEY
const API_KEY = "79e39be52496f728b0db2218330fc68a";

// 단위 저장
let currentUnit = "metric";
let storedWeather = null;
let storedForecast = null;
let tempChart = null;

// yzhanWeather 인스턴스
let yzhanWeather = null;

// DOM 요소
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const unitToggle = document.getElementById("unitToggle");
const gpsBtn = document.getElementById("gpsBtn");
const errorMessage = document.getElementById("errorMessage");

const currentWeatherSection = document.getElementById("currentWeather");
const cityNameEl = document.getElementById("cityName");
const currentDateEl = document.getElementById("currentDate");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");

const airQualitySection = document.getElementById("airQualitySection");
const airQualityIndexEl = document.getElementById("airQualityIndex");
const airQualityDescEl = document.getElementById("airQualityDesc");

const outfitSection = document.getElementById("outfitSection");
const outfitTextEl = document.getElementById("outfitText");

const chartSection = document.getElementById("chartSection");
const tempChartCanvas = document.getElementById("tempChart");

const forecastSection = document.getElementById("forecastSection");
const forecastContainer = document.getElementById("forecastContainer");


// =========================
// ⭐ 이벤트: 검색, 엔터, 단위 전환, 현재 위치 버튼
// =========================
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeatherData(city);
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) getWeatherData(city);
  }
});

unitToggle.addEventListener("click", () => {
  if (!storedWeather) return;

  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  unitToggle.textContent = `단위: ${currentUnit === "metric" ? "℃" : "℉"}`;

  displayWeather(storedWeather);
  if (storedForecast) {
    displayForecast(storedForecast);
    updateTempChart(storedForecast);
  }
});

// 📍 현재 위치 버튼
gpsBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("이 브라우저는 위치 정보를 지원하지 않습니다. 도시 이름으로 검색해주세요.");
    return;
  }

  showError("현재 위치를 가져오는 중입니다...");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      getWeatherByCoords(latitude, longitude);
    },
    () => {
      showError("위치 정보를 가져오지 못했습니다. 권한을 허용하거나 도시 이름으로 검색해주세요.");
    }
  );
});


// =========================
// ⭐ 1) 도시 이름으로 조회
// =========================
async function getWeatherData(city) {
  try {
    showError("");

    const weatherUrl =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=kr`;
    const forecastUrl =
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=kr`;

    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error("도시를 찾을 수 없습니다.");
    const weatherData = await weatherRes.json();

    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    const { lat, lon } = weatherData.coord;
    const airRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    let airData = null;
    if (airRes.ok) airData = await airRes.json();

    storedWeather = weatherData;
    storedForecast = forecastData;

    displayWeather(weatherData);
    displayForecast(forecastData);
    displayAirQuality(airData);
    updateTempChart(forecastData);
  } catch (err) {
    handleError(err);
  }
}


// =========================
// ⭐ 2) GPS 좌표로 조회
// =========================
async function getWeatherByCoords(lat, lon) {
  try {
    showError("");

    const weatherUrl =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const forecastUrl =
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const airUrl =
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const [weatherRes, forecastRes, airRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl),
      fetch(airUrl),
    ]);

    if (!weatherRes.ok) throw new Error("현재 위치의 날씨 정보를 가져오지 못했습니다.");

    const weatherData = await weatherRes.json();
    const forecastData = forecastRes.ok ? await forecastRes.json() : null;
    const airData = airRes.ok ? await airRes.json() : null;

    storedWeather = weatherData;
    storedForecast = forecastData;

    displayWeather(weatherData);
    if (forecastData) {
      displayForecast(forecastData);
      updateTempChart(forecastData);
    }
    displayAirQuality(airData);
  } catch (err) {
    handleError(err);
  }
}


// =========================
// ⭐ 현재 날씨 표시
// =========================
function displayWeather(data) {
  if (!data) return;

  currentWeatherSection.classList.remove("hidden");

  const city = `${data.name}, ${data.sys.country}`;
  const now = new Date(data.dt * 1000);
  const dateStr = now.toLocaleString("ko-KR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const weatherMain = data.weather[0].main;
  const description = data.weather[0].description;
  const icon = data.weather[0].icon;

  const tempC = data.main.temp;
  const feelsC = data.main.feels_like;
  const windMs = data.wind.speed;

  const temp = currentUnit === "metric" ? tempC : cToF(tempC);
  const feels = currentUnit === "metric" ? feelsC : cToF(feelsC);
  const wind = currentUnit === "metric" ? windMs : msToMph(windMs);

  cityNameEl.textContent = city;
  currentDateEl.textContent = dateStr;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  weatherIconEl.alt = weatherMain;
  temperatureEl.textContent = `${Math.round(temp)}${currentUnit === "metric" ? "℃" : "℉"}`;
  descriptionEl.textContent = description;
  feelsLikeEl.textContent = `${Math.round(feels)}${currentUnit === "metric" ? "℃" : "℉"}`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${wind.toFixed(1)} ${currentUnit === "metric" ? "m/s" : "mph"}`;

  sunriseEl.textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  sunsetEl.textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isDay = data.dt >= data.sys.sunrise && data.dt < data.sys.sunset;
  updateBackgroundTheme(weatherMain, isDay);
  suggestOutfit(tempC, weatherMain);
}


// =========================
// ⭐ 배경 테마 + 비/눈 애니메이션
// =========================
function updateBackgroundTheme(weatherMain, isDay) {
  const body = document.body;
  body.classList.remove(
    "theme-day", "theme-night",
    "weather-clear", "weather-clouds",
    "weather-rain", "weather-snow"
  );

  body.classList.add(isDay ? "theme-day" : "theme-night");

  const w = weatherMain.toLowerCase();

  if (!yzhanWeather && typeof YZhanWeather !== "undefined") {
    yzhanWeather = new YZhanWeather({
      selector: "body",
    });
  }
  yzhanWeather?.clear();

  if (w.includes("clear")) {
    body.classList.add("weather-clear");
  } else if (w.includes("cloud")) {
    body.classList.add("weather-clouds");
  } else if (w.includes("rain") || w.includes("drizzle") || w.includes("thunder")) {
    body.classList.add("weather-rain");
    yzhanWeather?.run("rain", { numElements: 65, maxDuration: 10 });
  } else if (w.includes("snow")) {
    body.classList.add("weather-snow");
    yzhanWeather?.run("snow", { numElements: 80, maxDuration: 14 });
  } else {
    body.classList.add("weather-clouds");
  }
}


// =========================
// ⭐ 공기질
// =========================
function displayAirQuality(data) {
  if (!data || !data.list) {
    airQualitySection.classList.add("hidden");
    return;
  }

  airQualitySection.classList.remove("hidden");

  const aqi = data.list[0].main.aqi;
  const comp = data.list[0].components;

  airQualityIndexEl.textContent = `AQI: ${aqi}`;
  airQualityDescEl.textContent =
    `PM2.5: ${comp.pm2_5.toFixed(1)} μg/m³ / PM10: ${comp.pm10.toFixed(1)} μg/m³`;
}


// =========================
// ⭐ 예보
// =========================
function displayForecast(data) {
  if (!data || !data.list) return;

  forecastSection.classList.remove("hidden");
  forecastContainer.innerHTML = "";

  const map = {};
  data.list.forEach((e) => {
    const d = new Date(e.dt * 1000);
    const key = d.toISOString().split("T")[0];
    if (!map[key]) map[key] = e;
  });

  Object.keys(map)
    .slice(0, 5)
    .forEach((k) => {
      const e = map[k];
      const d = new Date(e.dt * 1000);

      const tempC = e.main.temp;
      const temp = currentUnit === "metric" ? tempC : cToF(tempC);

      const card = document.createElement("div");
      card.className = "forecast-item";
      card.innerHTML = `
        <div>${d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" })}</div>
        <img class="forecast-icon" src="https://openweathermap.org/img/wn/${e.weather[0].icon}.png" alt="${e.weather[0].description}" />
        <div>${Math.round(temp)}${currentUnit === "metric" ? "℃" : "℉"}</div>
        <div>${e.weather[0].description}</div>
      `;
      forecastContainer.appendChild(card);
    });
}


// =========================
// ⭐ 시간별 그래프
// =========================
function updateTempChart(data) {
  if (!data || !data.list) return;

  chartSection.classList.remove("hidden");

  const list = data.list.slice(0, 8);
  const labels = list.map((e) =>
    new Date(e.dt * 1000).toLocaleTimeString("ko-KR", { hour: "2-digit" })
  );
  const temps = list.map((e) =>
    currentUnit === "metric" ? e.main.temp : cToF(e.main.temp)
  );

  if (tempChart) tempChart.destroy();

  tempChart = new Chart(tempChartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: temps,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: { responsive: true },
  });
}


// =========================
// ⭐ 추천 옷차림
// =========================
function suggestOutfit(tempC, main) {
  outfitSection.classList.remove("hidden");

  let msg = "";
  if (tempC <= 0) msg = "매우 춥습니다. 두꺼운 패딩, 장갑을 착용하세요.";
  else if (tempC <= 8) msg = "추운 날씨입니다. 코트, 니트 착용을 추천합니다.";
  else if (tempC <= 16) msg = "선선한 날씨입니다. 가벼운 외투를 걸치는 것이 좋습니다.";
  else if (tempC <= 23) msg = "쾌적한 날씨입니다. 긴팔 티셔츠나 셔츠 정도면 충분합니다.";
  else if (tempC <= 28) msg = "더운 날씨입니다. 반팔과 얇은 바지를 추천합니다.";
  else msg = "매우 덥습니다. 최대한 시원한 옷과 수분 섭취가 필요합니다.";

  if (main.includes("Rain")) msg += " 비가 오니 우산을 챙기세요.";
  if (main.includes("Snow")) msg += " 눈길 미끄럼에 주의하세요.";

  outfitTextEl.textContent = msg;
}


// =========================
// ⭐ 보조 함수 / 에러 처리
// =========================
function cToF(c) {
  return c * 1.8 + 32;
}

function msToMph(ms) {
  return ms * 2.23694;
}

function handleError(e) {
  console.error(e);
  showError(e.message || "오류가 발생했습니다.");
  currentWeatherSection.classList.add("hidden");
  forecastSection.classList.add("hidden");
  chartSection.classList.add("hidden");
  airQualitySection.classList.add("hidden");
  outfitSection.classList.add("hidden");
}

function showError(msg) {
  if (!msg) {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
  } else {
    errorMessage.textContent = msg;
    errorMessage.classList.remove("hidden");
  }
}
