// Anthrix Tech — Hero 3D Logo (ES module + Three.js @0.160.0)
// Transparent canvas, no post-processing. One model loaded once; materials and
// lights are swapped per theme without reloading the GLB.
//
// HOW TO TWEAK:
//   Edit THEME_CONFIG below to change materials, lights, and glow per theme.
//   Motion constants: SWAY_ANGLE, FLOAT_AMPLITUDE, PARALLAX_MAX, INTRO_DURATION.
//
// Paths (relative to index.html):
//   GLB:  3d-models/anthrix-tech-mark-3d.glb
//   SVG:  images/anthrix-tech-mark.svg

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ── Motion constants ──────────────────────────────────────
const SWAY_ANGLE = 0.52;        // +/- 30 degrees on Y (radians)
const SWAY_SPEED = 0.7;         // sway cycle speed
const FLOAT_AMPLITUDE = 6;      // px up/down bob
const FLOAT_SPEED = 1.2;        // bob cycle speed
const PARALLAX_MAX = 0.25;      // max lean toward cursor (radians)
const INTRO_DURATION = 1.0;     // seconds for fade + scale 0.85 -> 1

const GLB_PATH = "3d-models/anthrix-tech-mark-3d.glb";
const SVG_FALLBACK_PATH = "images/anthrix-tech-mark.svg";

// ── Per-theme configuration ───────────────────────────────
// Edit these values to adjust any theme. Adding a theme: add a key here and
// corresponding CSS variables in hero.css.
const THEME_CONFIG = {
  dark: {
    material: "physical",
    color: 0x9fa8ff,
    metalness: 0,
    roughness: 0.08,
    transmission: 0.9,
    thickness: 0.6,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
    emissive: 0x000000,
    emissiveIntensity: 0,
    glowA: 0xffffff,
    glowB: 0x7144d4,
    lights: {
      ambient: { color: 0xffffff, intensity: 0.3 },
      key: { color: 0x7144d4, intensity: 2.0, position: [2, 3, 2] },
      accent: { color: 0xff6a2b, intensity: 1.0, position: [-2, -1, 2] },
      rim: { color: 0xffffff, intensity: 1.5, position: [0, 1, -3] },
    },
    cssGlow: "drop-shadow(0 0 14px #ffffff) drop-shadow(0 0 36px #7144d4)",
  },
  brand: {
    material: "physical",
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.22,
    transmission: 0,
    thickness: 0,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    sheen: 1,
    sheenColor: 0xe6dcff,
    envMapIntensity: 1.3,
    emissive: 0x000000,
    emissiveIntensity: 0,
    glowA: 0xffffff,
    glowB: 0xffffff,
    lights: {
      ambient: { color: 0xffffff, intensity: 0.5 },
      key: { color: 0xffffff, intensity: 1.2, position: [2, 3, 3] },
      accent: { color: 0xfdba8c, intensity: 0.6, position: [-2, -1, 2] },
      rim: { color: 0xffffff, intensity: 1.0, position: [0, 1, -3] },
    },
    cssGlow: "drop-shadow(0 0 14px #ffffff) drop-shadow(0 0 36px #ffffff)",
  },
  light: {
    material: "physical",
    color: 0x2b36d9,
    metalness: 0.2,
    roughness: 0.2,
    transmission: 0,
    thickness: 0,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.0,
    emissive: 0x000000,
    emissiveIntensity: 0,
    glowA: 0x2b36d9,
    glowB: 0x2b36d9,
    lights: {
      ambient: { color: 0xffffff, intensity: 0.5 },
      key: { color: 0xffffff, intensity: 1.6, position: [2, 3, 3] },
      accent: { color: 0x2b36d9, intensity: 0.2, position: [-2, -1, 2] },
      rim: { color: 0xffffff, intensity: 0.8, position: [0, 1, -3] },
    },
    cssGlow: "drop-shadow(0 10px 30px rgba(43, 54, 217, 0.35))",
  },
};

// Fallback standard material (used if glass looks doubled/see-through)
const FALLBACK_MATERIAL = {
  metalness: 0.7,
  roughness: 0.15,
  envMapIntensity: 1.6,
  emissive: 0x000000,
  emissiveIntensity: 0,
};

// ── DOM refs ──────────────────────────────────────────────
const canvas = document.getElementById("heroCanvas");
const fallbackImg = document.querySelector(".hero-fallback");
const loadingEl = document.querySelector(".hero-loading");
const shimmerEl = document.querySelector(".hero-shimmer");

if (!canvas) {
  throw new Error("hero.js: #heroCanvas not found");
}

// ── Capability checks ─────────────────────────────────────
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 768px)").matches;

let webglAvailable = false;
try {
  const probe = document.createElement("canvas");
  webglAvailable = !!(
    window.WebGLRenderingContext &&
    (probe.getContext("webgl") || probe.getContext("experimental-webgl"))
  );
} catch (e) {
  webglAvailable = false;
}

// ── State ─────────────────────────────────────────────────
let renderer, scene, camera, pmremGenerator;
let model, rootMaterial;
let keyLight, accentLight, rimLight, fillLight;
let clock;
let modelLoaded = false;
let introDone = false;
let isVisible = true;
let tabHidden = false;
let animationId;
let theme = document.documentElement.getAttribute("data-theme") || "brand";
let hover = false;
let introElapsed = 0;
let currentSwayY = 0;
let currentFloatY = 0;
let currentLeanX = 0;
let currentLeanZ = 0;
let targetLeanX = 0;
let targetLeanZ = 0;

// ── Initialization ────────────────────────────────────────
function init() {
  if (prefersReduced || !webglAvailable) {
    showFallback();
    return;
  }

  buildScene();
  loadModel();

  window.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("pointerover", () => { hover = true; });
  canvas.addEventListener("pointerout", () => { hover = false; });
  window.addEventListener("visibilitychange", onVisibilityChange);

  const ro = new ResizeObserver(onResize);
  ro.observe(canvas.parentElement);

  const io = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
    },
    { threshold: 0.1 }
  );
  io.observe(canvas.parentElement);

  const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === "data-theme") {
        theme = m.target.getAttribute("data-theme") || "brand";
        applyTheme();
      }
    });
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  animate();
}

function buildScene() {
  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const rect = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(rect.width || 400, rect.height || 560);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);

  // Environment map
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  try {
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
  } catch (e) {
    // Env map unavailable
  }

  // Lights (created once, colors/intensities updated per theme)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  keyLight = new THREE.DirectionalLight(0xffffff, 1);
  keyLight.position.set(2, 3, 3);
  scene.add(keyLight);

  fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-2, 1, 3);
  scene.add(fillLight);

  accentLight = new THREE.PointLight(0xff6a2b, 1, 12);
  accentLight.position.set(-2, -1, 2);
  scene.add(accentLight);

  rimLight = new THREE.SpotLight(0xffffff, 1, 10, 0.4, 0.5, 1);
  rimLight.position.set(0, 1, -3);
  rimLight.lookAt(0, 0, 0);
  scene.add(rimLight);

  clock = new THREE.Clock();
}

function loadModel() {
  const loader = new GLTFLoader();
  loader.load(
    GLB_PATH,
    (gltf) => {
      model = gltf.scene;

      // Prepare per-theme materials
      const materials = prepareMaterials();

      // Apply initial theme material
      applyModelMaterial(materials[theme]);

      // Center model using Box3
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.set(-center.x, -center.y, -center.z);

      // Fit camera to model size with 15% margin
      fitCamera(size);

      model.userData = { materials };

      scene.add(model);
      modelLoaded = true;

      if (loadingEl) loadingEl.style.display = "none";
      if (shimmerEl) shimmerEl.style.display = "none";
    },
    () => {},
    (err) => {
      console.warn("hero.js: GLB load failed. Expected path: " + GLB_PATH);
      showFallback();
    }
  );
}

function prepareMaterials() {
  const mats = {};
  const cfgBase = THEME_CONFIG[theme] || THEME_CONFIG.brand;
  const env = scene.environment;

  for (const tName of Object.keys(THEME_CONFIG)) {
    const cfg = THEME_CONFIG[tName];
    let mat;

    if (cfg.material === "physical" && cfg.transmission > 0) {
      // Glass / crystal physical material
      mat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        metalness: cfg.metalness,
        roughness: cfg.roughness,
        transmission: cfg.transmission,
        thickness: cfg.thickness,
        ior: cfg.ior,
        clearcoat: cfg.clearcoat,
        clearcoatRoughness: cfg.clearcoatRoughness,
        envMapIntensity: cfg.envMapIntensity,
        side: cfg.side || THREE.FrontSide,
        emissive: new THREE.Color(cfg.emissive),
        emissiveIntensity: cfg.emissiveIntensity,
      });
      if (env) mat.envMap = env;
    } else if (cfg.sheen) {
      // Pearl / satin physical material (no transmission)
      mat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        metalness: cfg.metalness,
        roughness: cfg.roughness,
        clearcoat: cfg.clearcoat,
        clearcoatRoughness: cfg.clearcoatRoughness,
        sheen: cfg.sheen,
        sheenColor: new THREE.Color(cfg.sheenColor),
        envMapIntensity: cfg.envMapIntensity,
        emissive: new THREE.Color(cfg.emissive),
        emissiveIntensity: cfg.emissiveIntensity,
      });
      if (env) mat.envMap = env;
    } else {
      // Glossy physical material (no transmission)
      mat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        metalness: cfg.metalness,
        roughness: cfg.roughness,
        clearcoat: cfg.clearcoat,
        clearcoatRoughness: cfg.clearcoatRoughness,
        envMapIntensity: cfg.envMapIntensity,
        emissive: new THREE.Color(cfg.emissive),
        emissiveIntensity: cfg.emissiveIntensity,
      });
      if (env) mat.envMap = env;
    }

    mats[tName] = mat;
  }

  return mats;
}

function applyModelMaterial(mat) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = mat;
    }
  });
}

function fitCamera(size) {
  const maxDim = Math.max(size.x, size.y, size.z);
  const fovRad = (camera.fov * Math.PI) / 180;
  const margin = 1.15; // 15% margin
  const viewH = maxDim * margin;
  const viewW = maxDim * margin * Math.max(camera.aspect, 1);
  const zH = (viewH / 2) / Math.tan(fovRad / 2);
  const zW = (viewW / 2) / Math.tan(fovRad / 2);
  const camZ = Math.max(zH, zW) * 1.05;
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, 0);
}

function showFallback() {
  canvas.style.display = "none";
  if (fallbackImg) {
    fallbackImg.classList.add("is-fallback");
    fallbackImg.style.display = "block";
  }
  if (loadingEl) loadingEl.style.display = "none";
  if (shimmerEl) shimmerEl.style.display = "none";
}

// ── Event handlers ────────────────────────────────────────
function onMouseMove(e) {
  if (prefersReduced || !modelLoaded) return;
  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = (e.clientY / window.innerHeight) * 2 - 1;
  targetLeanX = ny * PARALLAX_MAX;
  targetLeanZ = nx * PARALLAX_MAX;
}

function onVisibilityChange() {
  tabHidden = document.hidden;
}

function onResize() {
  if (!renderer || !camera) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width || 400;
  const h = rect.height || 560;
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ── Theme reaction ────────────────────────────────────────
function applyTheme() {
  if (!modelLoaded) return;
  const cfg = THEME_CONFIG[theme] || THEME_CONFIG.brand;

  // Update CSS variables for canvas glow
  document.documentElement.style.setProperty(
    "--hero-glow-a",
    hexToCss(cfg.glowA)
  );
  document.documentElement.style.setProperty(
    "--hero-glow-b",
    hexToCss(cfg.glowB)
  );

  // Swap model material
  const mats = model.userData && model.userData.materials;
  if (mats && mats[theme]) {
    applyModelMaterial(mats[theme]);
  }

  // Update lights
  if (keyLight) {
    keyLight.color.setHex(cfg.lights.key.color);
    keyLight.intensity = cfg.lights.key.intensity;
    keyLight.position.set(...cfg.lights.key.position);
  }
  if (fillLight) {
    fillLight.color.setHex(cfg.lights.ambient.color);
    fillLight.intensity = cfg.lights.ambient.intensity;
    fillLight.position.set(-2, 1, 3);
  }
  if (accentLight) {
    accentLight.color.setHex(cfg.lights.accent.color);
    accentLight.intensity = cfg.lights.accent.intensity;
    accentLight.position.set(...cfg.lights.accent.position);
  }
  if (rimLight) {
    rimLight.color.setHex(cfg.lights.rim.color);
    rimLight.intensity = cfg.lights.rim.intensity;
    rimLight.position.set(...cfg.lights.rim.position);
  }
}

// Convert Three.js hex to CSS rgb string
function hexToCss(hex) {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgb(${r},${g},${b})`;
}

// ── Animation loop ────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate);

  if (!isVisible || tabHidden || prefersReduced) {
    return;
  }

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Intro: fade + scale 0.85 -> 1 over INTRO_DURATION
  if (modelLoaded && !introDone) {
    introElapsed += delta;
    const p = Math.min(1, introElapsed / INTRO_DURATION);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    const scale = 0.85 + 0.15 * ease;
    model.scale.setScalar(scale);
    model.rotation.y = 0;
    model.rotation.x = 0;
    model.rotation.z = 0;
    model.position.y = 0;
    if (p >= 1) {
      introDone = true;
      model.scale.setScalar(1);
    }
    renderer.render(scene, camera);
    return;
  }

  if (model) {
    // Slow sway on Y (+/- SWAY_ANGLE)
    const sway = Math.sin(time * SWAY_SPEED) * SWAY_ANGLE;
    currentSwayY += (sway - currentSwayY) * 0.08;

    // Small float
    const floatY = Math.sin(time * FLOAT_SPEED) * (FLOAT_AMPLITUDE / 100);

    // Lean toward cursor with smoothing
    currentLeanX += (targetLeanX - currentLeanX) * 0.1;
    currentLeanZ += (targetLeanZ - currentLeanZ) * 0.1;

    model.rotation.y = currentSwayY + currentLeanZ;
    model.rotation.x = currentLeanX;
    model.position.y = floatY;
  }

  renderer.render(scene, camera);
}

// ── Cleanup ───────────────────────────────────────────────
function dispose() {
  cancelAnimationFrame(animationId);
  window.removeEventListener("mousemove", onMouseMove);
  canvas.removeEventListener("pointerover", () => { hover = true; });
  canvas.removeEventListener("pointerout", () => { hover = false; });
  window.removeEventListener("visibilitychange", onVisibilityChange);

  if (renderer) renderer.dispose();
  if (model) {
    model.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }
}

window.__heroDispose = dispose;

// ── Boot ──────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

(function () {
  var els = document.querySelectorAll("[data-count-to]");
  if (!els.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function run(el) {
    var end = parseFloat(el.dataset.countTo);
    var dec = parseInt(el.dataset.decimals || "0", 10);
    if (reduce) { el.textContent = end.toFixed(dec); return; }
    var start = performance.now(), dur = 1200;
    (function tick(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (end * eased).toFixed(dec);
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();

(function () {
  document.querySelectorAll("[data-stars]").forEach(function (box) {
    var src = box.closest(".hero-stat").querySelector("[data-count-to]");
    var rating = parseFloat(src ? src.dataset.countTo : box.dataset.stars) || 0;

    box.innerHTML = "";
    for (var i = 0; i < 5; i++) {
      var fill = Math.max(0, Math.min(1, rating - i));
      var star = document.createElement("span");
      star.className = "star";
      star.setAttribute("aria-hidden", "true");
      star.textContent = "★";
      star.style.setProperty("--fill", fill);
      box.appendChild(star);
    }
    box.setAttribute("aria-label", "Rated " + rating + " out of 5");
  });
})();