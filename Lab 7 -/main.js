const API_KEY = "2faacaeb05597154dd0c25d4a5c9a584";
const cityForm = document.querySelector("#addCityForm");
const cityInput = document.querySelector("#cityInput");
const suggestionList = document.querySelector("#citySuggestions");
const weatherList = document.querySelector("#weatherList");

let cities = JSON.parse(localStorage.getItem("cities")) || [];
let weatherCache = JSON.parse(localStorage.getItem("weatherCache")) || {};
let allCities = [];

const saveCities = () => localStorage.setItem("cities", JSON.stringify(cities));
const saveCache = () => localStorage.setItem("weatherCache", JSON.stringify(weatherCache));

fetch('city.list.json')
  .then(res => res.json())
  .then(data => { allCities = data; })
  .catch(err => console.error(err));

const fetchWeather = async city => {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`);
  if (!res.ok) throw new Error("Nie znaleziono miasta");
  return res.json();
};

let debounceTimer;
cityInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const prefix = cityInput.value.trim().toLowerCase();
  if (prefix.length < 2) {
    suggestionList.innerHTML = '';
    return;
  }
  debounceTimer = setTimeout(() => {
    if (!allCities.length) return;
    const results = allCities
      .filter(c => c.name.toLowerCase().startsWith(prefix))
      .slice(0, 10);
    suggestionList.innerHTML = '';
    results.forEach(({ name, state, country }) => {
      const opt = document.createElement('option');
      opt.value = `${name}${state ? ', ' + state : ''}, ${country}`;
      suggestionList.append(opt);
    });
  }, 500);
});

cityForm.addEventListener('submit', e => {
  e.preventDefault();
  const raw = cityInput.value.trim();
  if (!raw) return;
  const key = raw.toLowerCase();
  if (cities.includes(key)) return;
  if (cities.length >= 10) { alert('Można dodać maksymalnie 10 miast.'); return; }
  cities.push(key);
  saveCities();
  cityInput.value = '';
  updateWeatherForCity(raw);
});

const createCard = (data, key) => {
  const card = document.createElement('div');
  card.className = 'weather-card';
  card.dataset.cityCard = key;

  const info = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = data.name;
  const temp = document.createElement('p');
  temp.className = 'temp';
  temp.textContent = `🌡 ${data.main.temp}°C`;
  const feels = document.createElement('p');
  feels.className = 'feels';
  feels.textContent = `Odczuwalna: 🌡 ${data.main.feels_like}°C`;
  const humidity = document.createElement('p');
  humidity.className = 'humidity';
  humidity.textContent = `💧 Wilgotność: ${data.main.humidity}%`;
  info.append(title, temp, feels, humidity);

  const controls = document.createElement('div');
  const icon = document.createElement('img');
  icon.className = 'weather-icon';
  icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  icon.alt = data.weather[0].description;
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.dataset.city = key;
  removeBtn.textContent = 'Usuń';
  controls.append(icon, removeBtn);

  card.append(info, controls);
  weatherList.appendChild(card);
};

const updateCard = (card, data) => {
  card.querySelector('h3').textContent = data.name;
  card.querySelector('.temp').textContent = `🌡 ${data.main.temp}°C`;
  card.querySelector('.feels').textContent = `Odczuwalna: 🌡 ${data.main.feels_like}°C`;
  card.querySelector('.humidity').textContent = `💧 Wilgotność: ${data.main.humidity}%`;
  const icon = card.querySelector('.weather-icon');
  icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  icon.alt = data.weather[0].description;
};

const updateWeatherForCity = async rawCity => {
  const key = rawCity.toLowerCase();
  const now = Date.now();
  const cached = weatherCache[key];
  let data;
  if (!cached || now - cached.timestamp >= 5 * 60 * 1000) {
    try {
      data = await fetchWeather(rawCity);
      weatherCache[key] = { data, timestamp: now };
      saveCache();
    } catch (e) {
      console.error(e);
      return;
    }
  } else {
    data = cached.data;
  }
  const card = document.querySelector(`[data-city-card="${key}"]`);
  if (card) updateCard(card, data);
  else createCard(data, key);
};

document.querySelector('#weatherList').addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    const key = e.target.dataset.city;
    const card = document.querySelector(`[data-city-card="${key}"]`);
    if (card) card.remove();
    cities = cities.filter(c => c !== key);
    delete weatherCache[key];
    saveCities();
    saveCache();
  }
});

cities.forEach(c => updateWeatherForCity(c));
setInterval(() => cities.forEach(c => updateWeatherForCity(c)), 5 * 60 * 1000);
