// OpenWeatherMap 더미 URL 설정 (실제 사용 시 YOUR_API_KEY를 교체하세요)
const API_KEY = "58048d33525e750abdde47fb0430ed19"; // TODO: 실제 키로 변경
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// DOM이 모두 로드된 후에 실행
document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 가져오기
  const cityInput = document.getElementById("cityInput");
  const searchBtn = document.getElementById("searchBtn");
  const tempEl = document.getElementById("temp");
  const descEl = document.getElementById("description");
  const statusMessageEl = document.getElementById("statusMessage");

  // 혹시라도 id를 잘못 쓰거나 HTML이 수정돼서 요소를 못 찾는 경우 방어
  if (!cityInput || !searchBtn || !tempEl || !descEl || !statusMessageEl) {
    console.error("필수 DOM 요소를 찾을 수 없습니다. id를 다시 확인하세요.");
    return;
  }

  /**
   * 에러 처리 함수
   * @param {Error} error
   */
  function handleError(error) {
    console.error("날씨 조회 중 오류 발생:", error);
    statusMessageEl.textContent =
      "오류가 발생했습니다. 개발자 도구의 콘솔을 확인해 주세요.";
  }

  /**
   * 도시명을 받아 날씨를 가져오는 비동기 함수
   * @param {string} city
   */
  async function getWeather(city) {
    try {
      statusMessageEl.textContent = "불러오는 중...";

      // 공백 도시명 방지
      if (!city) {
        statusMessageEl.textContent = "도시명을 입력해주세요.";
        return;
      }

      // 쿼리 파라미터 설정 (도시명, API 키, 섭씨 단위, 한글 설명)
      const url = `${BASE_URL}?q=${encodeURIComponent(
        city
      )}&appid=${API_KEY}&units=metric&lang=kr`;

      const response = await fetch(url);

      if (!response.ok) {
        // HTTP 에러 처리 (예: 401, 404 등)
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // OpenWeatherMap 응답 구조 사용 예시
      const temperature = data.main?.temp;
      const weatherDesc = data.weather?.[0]?.description;

      if (typeof temperature === "number") {
        tempEl.textContent = `${temperature.toFixed(1)}°C`;
      } else {
        tempEl.textContent = "--°C";
      }

      descEl.textContent = weatherDesc || "날씨 정보를 불러올 수 없습니다.";
      statusMessageEl.textContent = `"${city}"의 날씨입니다.`;
    } catch (error) {
      handleError(error);
      tempEl.textContent = "--°C";
      descEl.textContent = "날씨 정보를 가져오지 못했습니다.";
    }
  }

  /**
   * 검색 버튼 클릭 및 엔터 입력 처리
   */
  function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) {
      statusMessageEl.textContent = "도시명을 입력해주세요.";
      return;
    }
    getWeather(city);
  }

  // 버튼 클릭 시 날씨 조회
  searchBtn.addEventListener("click", handleSearch);

  // 인풋에서 Enter 키로도 검색할 수 있게
  cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });
});
