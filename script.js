// ==== CONFIG ====
const API_KEY = "ffcbbda8eb8d46829920406e5ed4a80c"; // <- put your OpenWeatherMap key here
const API_CITY = (city) => `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
const API_COORD = (lat, lon) => `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

// ==== DOM ====
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const loader = document.getElementById("loader");
const errorEl = document.getElementById("error");
const weatherBox = document.getElementById("weather");
const descEl = document.getElementById("desc");
const tempEl = document.getElementById("temp");
const cityEl = document.getElementById("city");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const iconWrap = document.getElementById("iconWrap");
const lastUpdate = document.getElementById("lastUpdate");
const modeToggle = document.getElementById("modeToggle");

// ==== Helpers ====
const showLoader = (show=true) => {
  loader.classList.toggle("show", show);
  loader.setAttribute("aria-hidden", show ? "false" : "true");
};
const showError = (msg=null) => {
  if(msg){ errorEl.textContent = msg; }
  errorEl.hidden = !msg;
};
const showWeather = (show=true) => { weatherBox.hidden = !show; };

function formatTimeByOffset(unixSeconds, tzOffsetSeconds){
  // produce time in HH:MM using the city's timezone, not user's
  const utcMs = (unixSeconds + tzOffsetSeconds) * 1000;
  const fmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
  return fmt.format(utcMs);
}

function kmhFromMs(ms){ return Math.round(ms * 3.6); }

// Map weather condition to gradient + icon
function applyThemeByWeather(main){
  const root = document.documentElement;
  const setGrad = (a, b) => {
    root.style.setProperty("--grad-a", a);
    root.style.setProperty("--grad-b", b);
  };

  switch(main){
    case "Clear": setGrad("#2b60ff","#ffc36a"); break;                 // blue → warm
    case "Clouds": setGrad("#1f2a44","#5b6b88"); break;                // slate tones
    case "Rain": setGrad("#0b1830","#2f4a77"); break;                  // deep blue
    case "Drizzle": setGrad("#102235","#3a5a7a"); break;
    case "Thunderstorm": setGrad("#0a0f24","#5b2ad1"); break;
    case "Snow": setGrad("#325b94","#a1c3ff"); break;                  // cold
    case "Mist":
    case "Fog":
    case "Haze": setGrad("#1b2233","#5c6a80"); break;
    default: setGrad("#031b34","#3b1d60");
  }
}

// Minimal animated SVG icons (no external libs)
const Icons = {
  Clear: `
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <circle cx="60" cy="60" r="20" fill="#FFD166" class="pulse"></circle>
    <g class="spin" stroke="#FFD166" stroke-width="4" stroke-linecap="round">
      <line x1="60" y1="8" x2="60" y2="24"></line>
      <line x1="60" y1="96" x2="60" y2="112"></line>
      <line x1="8" y1="60" x2="24" y2="60"></line>
      <line x1="96" y1="60" x2="112" y2="60"></line>
      <line x1="22" y1="22" x2="34" y2="34"></line>
      <line x1="86" y1="86" x2="98" y2="98"></line>
      <line x1="22" y1="98" x2="34" y2="86"></line>
      <line x1="86" y1="34" x2="98" y2="22"></line>
    </g>
  </svg>`,
  Clouds: `
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <g fill="#cfe1ff" class="drift">
      <ellipse cx="50" cy="65" rx="22" ry="14"></ellipse>
      <ellipse cx="70" cy="60" rx="26" ry="16"></ellipse>
      <ellipse cx="84" cy="68" rx="16" ry="12"></ellipse>
    </g>
  </svg>`,
  Rain: `
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <g fill="#cfe1ff" class="drift">
      <ellipse cx="50" cy="55" rx="20" ry="12"></ellipse>
      <ellipse cx="70" cy="50" rx="24" ry="14"></ellipse>
      <ellipse cx="88" cy="58" rx="14" ry="10"></ellipse>
    </g>
    <g stroke="#7cb7ff" stroke-width="3" stroke-linecap="round">
      <line x1="40" y1="78" x2="36" y2="90" class="fall"></line>
      <line x1="56" y1="80" x2="52" y2="92" class="fall"></line>
      <line x1="72" y1="78" x2="68" y2="90" class="fall"></line>
      <line x1="88" y1="80" x2="84" y2="92" class="fall"></line>
    </g>
  </svg>`,
  Drizzle: `
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <g fill="#dce9ff" class="drift">
      <ellipse cx="54" cy="55" rx="18" ry="11"></ellipse>
      <ellipse cx="74" cy="50" rx="22" ry="13"></ellipse>
    </g>
    <g stroke="#a8ccff" stroke-width="2" stroke-linecap="round">
      <line x1="46" y1="78" x2="44" y2="86" class="fall"></line>
      <line x1="60" y1="80" x2="58" y2="88" class="fall"></line>
      <line x1="74" y1="78" x2="72" y2="86" class="fall"></line>
      <line x1="88" y1="80" x2="86" y2="88" class="fall"></line>
    </g>
  </svg>`,
  Snow: `
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <g fill="#e8f3ff" class="drift">
      <ellipse cx="50" cy="55" rx="20" ry="12"></ellipse>
      <ellipse cx="72" cy="50" rx="24" ry="14"></ellipse>
    </g>
    <g fill="#ffffff">
      <circle cx="44" cy="82" r="2.4" class="fall"></circle>
      <circle cx="60" cy="86" r="2.6" class="fall"></circle>
      <circle cx="76" cy="82" r="2.2" class="fall"></circle>
      <circle cx="90" cy="86" r="2.4" class="fall"></circle>
    </g>
  </svg>`,
  Thunderstorm: `
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <g fill="#cfe1ff" class="drift">
      <ellipse cx="50" cy="55" rx="20" ry="12"></ellipse>
      <ellipse cx="72" cy="50" rx="24" ry="14"></ellipse>
    </g>
    <polygon points="58,78 72,78 62,100 76,100 56,122 64,96 52,96" fill="#ffd166" class="pulse"></polygon>
  </svg>`,
  Mist: `
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <g stroke="#c8d3e6" stroke-width="3" stroke-linecap="round" opacity=".9">
      <line x1="24" y1="60" x2="96" y2="60" class="drift"></line>
      <line x1="18" y1="72" x2="102" y2="72" class="drift"></line>
      <line x1="28" y1="84" x2="92" y2="84" class="drift"></line>
    </g>
  </svg>`
};

function iconFor(main){
  if(Icons[main]) return Icons[main];
  // fallback to Clouds
  return Icons["Clouds"];
}

// ==== Fetch & Render ====
async function fetchWeather(by){
  showError(null);
  showWeather(false);
  showLoader(true);
  try{
    const url = typeof by === "string" ? API_CITY(by) : API_COORD(by.lat, by.lon);
    const res = await fetch(url);
    if(!res.ok) throw new Error("City not found");
    const data = await res.json();
    renderWeather(data);
  }catch(err){
    showError("Couldn’t find that city. Try another.");
    console.error(err);
  }finally{
    showLoader(false);
  }
}

function renderWeather(data){
  const main = data.weather?.[0]?.main || "Clouds";
  const description = data.weather?.[0]?.description || main;
  const name = `${data.name}${data.sys?.country ? ", " + data.sys.country : ""}`;

  descEl.textContent = `(${capitalize(description)})`;
  tempEl.textContent = `${Math.round(data.main.temp)}°C`;
  cityEl.textContent = name;
  feelsEl.textContent = `${Math.round(data.main.feels_like)}°C`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${kmhFromMs(data.wind.speed)} km/h`;
  pressureEl.textContent = `${data.main.pressure} hPa`;

  const tz = data.timezone ?? 0;
  sunriseEl.textContent = formatTimeByOffset(data.sys.sunrise, tz);
  sunsetEl.textContent = formatTimeByOffset(data.sys.sunset, tz);

  iconWrap.innerHTML = iconFor(main);
  applyThemeByWeather(main);

  const now = new Date();
  lastUpdate.textContent = `Last updated: ${now.toLocaleString()}`;

  showWeather(true);
}

function capitalize(s){
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// ==== Events ====
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if(city) fetchWeather(city);
});
cityInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){
    const city = cityInput.value.trim();
    if(city) fetchWeather(city);
  }
});

locBtn.addEventListener("click", () => {
  useGeolocation();
});

function useGeolocation(){
  if(!("geolocation" in navigator)){
    showError("Geolocation not supported on this device.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      const { latitude: lat, longitude: lon } = pos.coords;
      fetchWeather({ lat, lon });
    },
    ()=>{
      showError("Location access denied. Try searching by city.");
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
  );
}

// Theme toggle
// modeToggle.addEventListener("click", ()=>{
//   document.body.classList.toggle("light");
// });

// ==== Init ====
// Try geolocation first; if blocked, load a sensible default (Mumbai)
useGeolocation();
setTimeout(()=>{
  if(weatherBox.hidden){ fetchWeather("Mumbai"); }
}, 1500);




// new added
const typingElement = document.getElementById("typing");

const texts = ["Project by", "ADITYA YADAV"];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentText = texts[textIndex];
    
    if (!isDeleting) {
        typingElement.textContent = currentText.slice(0, charIndex++);
        if (charIndex > currentText.length) {
            setTimeout(() => isDeleting = true, 1000); // Pause before deleting
        }
    } else {
        typingElement.textContent = currentText.slice(0, charIndex--);
        if (charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length; // Switch text
        }
    }
    setTimeout(typeEffect, isDeleting ? 80 : 120); // Speed control
}

typeEffect();
