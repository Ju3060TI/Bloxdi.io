/**
 * Wetter – Regen, Schnee, Gewitter, Nebel
 */
let currentWeather = 'clear';
let weatherTimer = 0;
let transition = 0;

const WEATHER_TYPES = [
  { id: 'clear', chance: 0.7 },
  { id: 'rain', chance: 0.15 },
  { id: 'snow', chance: 0.1 },
  { id: 'thunder', chance: 0.05 },
];

export function initWeather(scene) {
  scene.userData.weather = 'clear';
  pickWeather();
}

function pickWeather() {
  const r = Math.random();
  let acc = 0;
  for (const w of WEATHER_TYPES) {
    acc += w.chance;
    if (r < acc) { currentWeather = w.id; break; }
  }
  weatherTimer = 60 + Math.random() * 120;
  transition = 0;
}

export function updateWeather(scene, dt) {
  weatherTimer -= dt;
  if (weatherTimer <= 0) pickWeather();
  transition = Math.min(1, transition + dt / 30);
  scene.userData.weather = currentWeather;

  if (currentWeather === 'rain' || currentWeather === 'thunder') {
    scene.fog.density = 0.02 * transition;
    scene.fog.near = 30;
    scene.fog.far = 80;
  } else if (currentWeather === 'snow') {
    scene.fog.far = 60;
  } else {
    scene.fog.far = 120;
  }
}

export function getWeather() { return currentWeather; }
