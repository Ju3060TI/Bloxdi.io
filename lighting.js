/**
 * Tag/Nacht, Sonne, Mond, Sterne
 */
import * as THREE from 'three';

let sunLight, ambientLight, dayTime = 0.25;
const DAY_LENGTH = 1200;

export function initLighting(scene) {
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  sunLight = new THREE.DirectionalLight(0xffffee, 1);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = false;
  scene.add(sunLight);
  scene.userData.isNight = false;
}

export function updateLighting(scene, dt) {
  dayTime += dt / DAY_LENGTH;
  if (dayTime > 1) dayTime -= 1;

  const sunAngle = dayTime * Math.PI * 2;
  const sunY = Math.sin(sunAngle);
  const isDay = sunY > -0.1;

  scene.userData.isNight = !isDay;
  sunLight.position.set(Math.cos(sunAngle) * 80, sunY * 100, Math.sin(sunAngle) * 80);
  sunLight.intensity = Math.max(0, sunY) * 1.2 + 0.1;
  ambientLight.intensity = 0.3 + Math.max(0, sunY) * 0.4;

  const skyDay = new THREE.Color(0x78a7ff);
  const skyNight = new THREE.Color(0x0a1020);
  const skyDawn = new THREE.Color(0xff9060);
  let sky = skyDay;
  if (!isDay) sky = skyNight;
  else if (sunY < 0.3) sky = skyDawn.clone().lerp(skyDay, sunY / 0.3);

  if (scene.fog) scene.fog.color.copy(sky);
}

export function getDayTime() { return dayTime; }
export function getLightLevel(x, y, z) {
  const sun = Math.max(0, Math.sin(dayTime * Math.PI * 2));
  return Math.floor(4 + sun * 11);
}
