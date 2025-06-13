// Pobieranie elementów za pomocą querySelector
const sliderContainer = document.querySelector('#slider-container');
const slider = document.querySelector('#slider');
const track = slider.querySelector('.slider-track');
const leftArrow = document.querySelector('#leftArrow');
const rightArrow = document.querySelector('#rightArrow');
const modeBtn = document.querySelector('#modeBtn');
const stopBtn = document.querySelector('#stopBtn');
const dotsContainer = document.querySelector('#dots');

let baseSpeed = 100;          // podstawowa prędkość przesuwania
let speed = baseSpeed;        // aktualna prędkość
let direction = -1;           // kierunek przesuwania (-1 = w lewo, 1 = w prawo)
let offsetX = 0;              // przesunięcie tracka w pikselach
let lastTime = null;          // znacznik czasu poprzedniej klatki
let paused = false;           // flaga pauzy animacji
let fadeMode = false;         // flaga trybu przenikania
let fadeInterval = null;      // uchwyt do interwału przenikania
let slidesData = [];          // tablica z identyfikatorami obrazów-slajdów
let slideCount = 0;           // liczba slajdów w tracku
let visibleCount = 0;         // liczba widocznych slajdów w jednym czasie
let curFadeIndex = 0;         // aktualny indeks pierwszego slajdu w trybie przenikania

// Oblicza, ile slajdów zmieści się w jednym rzędzie, i przygotowuje liczbę slajdów
function computeCounts() {
  const sliderWidth = sliderContainer.clientWidth;
  const sliderHeight = sliderContainer.clientHeight;
  const slideWidth = sliderHeight;                    // każdy slajd jest kwadratem
  visibleCount = Math.ceil(sliderWidth / slideWidth); // ile zmieści się w szerokości
  slideCount = visibleCount * 3;                      // potrójna liczba dla płynnego przesuwania
}

// Wypełnia tablicę numerami slajdów od 1 do slideCount
function buildSlidesData() {
  slidesData = [];
  for (let i = 1; i <= slideCount; i++) {
    slidesData.push(i);
  }
}

// Tworzy pojedynczy element slajdu i dodaje go do tracka
function addSlide(id) {
  const slide = document.createElement('div');
  slide.className = 'slide';
  const img = document.createElement('img');
  img.src = `https://picsum.photos/300/300?random=${id}`; // losowy obraz
  img.alt = `Slide ${id}`;
  img.dataset.id = id;
  slide.appendChild(img);
  track.appendChild(slide);

  // Zmniejszenie prędkości przy najechaniu na slajd
  slide.addEventListener('mouseenter', () => {
    speed = baseSpeed / 4;
  });
  slide.addEventListener('mouseleave', () => {
    speed = baseSpeed;
  });
  // Kliknięcie w slajd w trybie przenikania */
  slide.addEventListener('click', () => {
    if (!fadeMode) return;
    paused = false;
    if (fadeMode && !fadeInterval) startFadeInterval();
  });
}

// Buduje track do przewijania, wypełniając go slajdami od startIndex
function buildScrollTrack(startIndex = 0) {
  track.innerHTML = '';
  for (let i = 0; i < slideCount; i++) {
    const idx = (startIndex + i) % slideCount;
    addSlide(slidesData[idx]);
  }
  offsetX = 0;
  track.style.transform = `translateX(0px)`;
}

// Funkcja animująca przewijanie metoda requestAnimationFrame
function animateScroll(time) {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;

  if (!paused && !fadeMode) {
    offsetX += speed * direction * (delta / 1000);
    track.style.transform = `translateX(${offsetX}px)`;
    const firstSlide = track.firstElementChild;
    if (firstSlide) {
      const rect = firstSlide.getBoundingClientRect();
      if (rect.right < 0) {
        track.appendChild(firstSlide);
        offsetX += rect.width;
        track.style.transform = `translateX(${offsetX}px)`;
      }
    }
    const lastSlide = track.lastElementChild;
    if (lastSlide) {
      const rect = lastSlide.getBoundingClientRect();
      if (rect.left > window.innerWidth) {
        track.insertBefore(lastSlide, track.firstElementChild);
        offsetX -= rect.width;
        track.style.transform = `translateX(${offsetX}px)`;
      }
    }
  }

  requestAnimationFrame(animateScroll);
}

// Buduje track w trybie przenikania, wyświetlając tylko visibleCount slajdów
function buildFadeTrack() {
  track.innerHTML = '';
  for (let i = 0; i < visibleCount; i++) {
    const idx = (curFadeIndex + i + slideCount) % slideCount;
    addSlide(slidesData[idx]);
  }
  offsetX = 0;
  track.style.transform = `translateX(0px)`;
  updateDots();
}

// Animuje jedno przenikanie: ukrywa cały kontener, potem zmienia zawartość i pokazuje
function doSingleFade() {
  sliderContainer.classList.add('hidden');
  setTimeout(() => {
    buildFadeTrack();
    sliderContainer.classList.remove('hidden');
  }, 500);
}

// Uruchamia interwał, co 3 sekundy przesuwający indeks dla trybu przenikania
function startFadeInterval() {
  fadeInterval = setInterval(() => {
    curFadeIndex = (curFadeIndex + direction * visibleCount + slideCount) % slideCount;
    doSingleFade();
  }, 3000);
}

// Zatrzymuje interwał przenikania
function stopFadeInterval() {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

// Buduje kropki na podstawie liczby stron (slideCount / visibleCount)
function buildDots() {
  dotsContainer.innerHTML = '';
  const pages = slideCount / visibleCount;
  for (let i = 0; i < pages; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.dataset.index = i;
    dot.addEventListener('click', () => {
      curFadeIndex = i * visibleCount;
      doSingleFade();
      restartFadeInterval();
    });
    dotsContainer.appendChild(dot);
  }
}

// Podświetla aktywną kropkę według curFadeIndex
function updateDots() {
  const pages = slideCount / visibleCount;
  const activePage = Math.floor(curFadeIndex / visibleCount);
  Array.from(dotsContainer.children).forEach((dot, i) => {
    dot.classList.toggle('active', i === activePage);
  });
}

// Resetuje interwał przenikania po ręcznej zmianie
function restartFadeInterval() {
  stopFadeInterval();
  startFadeInterval();
}

// Przycisk “Animacja” – włącza/wyłącza tryb przenikania
modeBtn.addEventListener('click', () => {
  if (!fadeMode) {
    fadeMode = true;
    paused = true;
    sliderContainer.classList.add('hidden');
    setTimeout(() => {
      curFadeIndex = 0;
      buildDots();
      dotsContainer.classList.remove('hidden');
      buildFadeTrack();
      sliderContainer.classList.remove('hidden');
      startFadeInterval();
    }, 500);
  } else {
    fadeMode = false;
    stopFadeInterval();
    dotsContainer.classList.add('hidden');
    buildScrollTrack(curFadeIndex);
    paused = false;
  }
});

// Przycisk “Stop” – pauzuje lub wznawia animację (zarówno przewijanie, jak i przenikanie)
stopBtn.addEventListener('click', () => {
  if (!paused) {
    paused = true;
    stopFadeInterval();
  } else {
    paused = false;
    if (fadeMode && !fadeInterval) startFadeInterval();
  }
});

// Lewa strzałka – zmienia kierunek lub, w trybie przenikania, przesuwa o jedną stronę w lewo
leftArrow.addEventListener('click', () => {
  if (fadeMode) {
    stopFadeInterval();
    curFadeIndex = (curFadeIndex - visibleCount + slideCount) % slideCount;
    doSingleFade();
    restartFadeInterval();
  } else {
    direction = -1; // odwrócenie przewijania w lewo
  }
});

// Prawa strzałka – zmiana kierunku lub przesunięcie w przenikaniu w prawo
rightArrow.addEventListener('click', () => {
  if (fadeMode) {
    stopFadeInterval();
    curFadeIndex = (curFadeIndex + visibleCount) % slideCount;
    doSingleFade();
    restartFadeInterval();
  } else {
    direction = 1; // przewijanie w prawo (domyślnie)
  }
});

// Kliknięcie w slider wznowi przenikanie, jeśli było wstrzymane
slider.addEventListener('click', () => {
  if (paused && fadeMode) {
    paused = false;
    if (fadeMode && !fadeInterval) startFadeInterval();
  }
});

// Inicjalizacja przy załadowaniu strony
window.addEventListener('load', () => {
  computeCounts();
  buildSlidesData();
  buildScrollTrack(0);
  requestAnimationFrame(animateScroll);
});

// Przy każdej zmianie rozmiaru okna przełicza slajdy i odświeża widok
window.addEventListener('resize', () => {
  computeCounts();
  buildSlidesData();
  if (fadeMode) {
    stopFadeInterval();
    curFadeIndex = 0;
    buildDots();
    buildFadeTrack();
    startFadeInterval();
  } else {
    buildScrollTrack(curFadeIndex);
  }
});
