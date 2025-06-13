const API_KEY = "2faacaeb05597154dd0c25d4a5c9a584";
let cities = [];
let trackedCities = [];

document.addEventListener('DOMContentLoaded', () => {
  fetch('city.list.json')
    .then(res => res.json())
    .then(data => cities = data);

  loadTrackedCities();

  const form = document.getElementById('city-form');
  const input = document.getElementById('city-input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (name) addCity(name);
    input.value = '';
    document.getElementById('suggestions').innerHTML = '';
  });

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    const suggest = document.getElementById('suggestions');
    suggest.innerHTML = '';
    if (val.length < 2) return;
    const matches = cities.filter(c => c.name.toLowerCase().startsWith(val));
    matches.slice(0, 5).forEach(c => {
      const item = document.createElement('li');
      item.textContent = `${c.name}, ${c.country}`;
      item.addEventListener('click', () => {
        input.value = c.name;
        suggest.innerHTML = '';
      });
      suggest.appendChild(item);
    });
  });
});

function loadTrackedCities() {
  const stored = localStorage.getItem('trackedCities');
  if (stored) trackedCities = JSON.parse(stored);
  trackedCities.forEach(id => createCityTile(id));
}

function saveTrackedCities() {
  localStorage.setItem('trackedCities', JSON.stringify(trackedCities));
}

function addCity(cityName) {
  if (trackedCities.length >= 10) return;
  const city = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (!city || trackedCities.includes(city.id)) return;
  trackedCities.push(city.id);
  saveTrackedCities();
  createCityTile(city.id);
}

function createCityTile(cityId) {
  const cacheKey = 'weather_' + cityId;
  const now = Date.now();
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    if (now - data.timestamp < 5 * 60 * 1000) {
      buildTile(cityId, data.current, data.forecast);
      return;
    }
  }
  Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?id=${cityId}&units=metric&lang=pl&appid=${API_KEY}`)
      .then(res => res.json()),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&units=metric&lang=pl&appid=${API_KEY}`)
      .then(res => res.json())
  ]).then(([weatherData, forecastData]) => {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      current: weatherData,
      forecast: forecastData
    }));
    buildTile(cityId, weatherData, forecastData);
  });
}

function buildTile(cityId, weatherData, forecastData) {
  const existing = document.getElementById('city-tile-' + cityId);
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'city-tile-' + cityId;
  container.className = 'city-tile';

  const tempChartCont = document.createElement('div');
  tempChartCont.className = 'chart-container';
  const tempCanvas = document.createElement('canvas');
  tempCanvas.id = 'temp-chart-' + cityId;
  tempChartCont.appendChild(tempCanvas);

  const info = document.createElement('div');
  info.className = 'city-info';
  const header = document.createElement('div');
  header.className = 'header';
  const nameH3 = document.createElement('h3');
  nameH3.textContent = weatherData.name;
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', () => {
    container.remove();
    trackedCities = trackedCities.filter(id => id !== cityId);
    saveTrackedCities();
    localStorage.removeItem('weather_' + cityId);
  });
  header.appendChild(nameH3);
  header.appendChild(removeBtn);
  info.appendChild(header);

  const icon = document.createElement('img');
  const iconCode = weatherData.weather[0].icon;
  icon.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
  icon.alt = weatherData.weather[0].description;
  info.appendChild(icon);

  const tempP = document.createElement('p');
  tempP.innerHTML = `← Temperatura: <span>${Math.round(weatherData.main.temp)}</span>°C`;
  info.appendChild(tempP);
  const humP = document.createElement('p');
  humP.innerHTML = `Wilgotność: <span>${weatherData.main.humidity}</span>% →`;
  info.appendChild(humP);

  const humChartCont = document.createElement('div');
  humChartCont.className = 'chart-container';
  const humCanvas = document.createElement('canvas');
  humCanvas.id = 'humidity-chart-' + cityId;
  humChartCont.appendChild(humCanvas);

  container.appendChild(tempChartCont);
  container.appendChild(info);
  container.appendChild(humChartCont);
  document.getElementById('cities').appendChild(container);

  // Przygotowanie danych do wykresów (5 punktów co 3h od teraz)
  const labels = ['Teraz', 'Za 3h', 'Za 6h', 'Za 9h', 'Za 12h'];
  const tempData = [Math.round(weatherData.main.temp)];
  const humData = [weatherData.main.humidity];
  for (let i = 0; i < 4; i++) {
    if (forecastData.list[i]) {
      tempData.push(Math.round(forecastData.list[i].main.temp));
      humData.push(forecastData.list[i].main.humidity);
    }
  }
  // Wykres temperatury
  new Chart(tempCanvas.getContext('2d'), {
    type: 'line',
    data: { labels: labels, datasets: [{ label: '°C', data: tempData, borderColor: 'rgb(255,99,132)', fill: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
  // Wykres wilgotności
  new Chart(humCanvas.getContext('2d'), {
    type: 'line',
    data: { labels: labels, datasets: [{ label: '%', data: humData, borderColor: 'rgb(54,162,235)', fill: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}
