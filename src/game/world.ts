import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LANDMARKS } from './state';
import type { Profile, Save } from './state';
import { random } from './math';

export const SKINS = ['#f2cead', '#c99068', '#935f43', '#573927'];
export const OUTFITS = ['#d5b679', '#698f82', '#a97458', '#5dc5b3'];
const materialCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, roughness = 1, glow = false) {
  const key = `${color}:${roughness}:${glow}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, flatShading: true, ...(glow ? { emissive: color, emissiveIntensity: .8, toneMapped: false } : {}) }));
  return materialCache.get(key)!;
}
const geometryCache = new Map<string, THREE.BufferGeometry>();
function geometry(key: string, create: () => THREE.BufferGeometry) { if (!geometryCache.has(key)) geometryCache.set(key, create()); return geometryCache.get(key)!; }
function mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, glow = false) {
  const m = new THREE.Mesh(geo, mat(color, 1, glow)); m.position.set(x, y, z); m.castShadow = !glow; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent: THREE.Object3D, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
  const m = mesh(parent, geometry('box', () => new THREE.BoxGeometry(1, 1, 1)), color, x, y, z); m.scale.set(w, h, d); return m;
}
function rock(parent: THREE.Object3D, color: string, x: number, y: number, z: number, size: number) {
  const m = mesh(parent, geometry('rock', () => new THREE.DodecahedronGeometry(1, 0)), color, x, y, z); m.scale.set(size, size * .75, size * .8); return m;
}
function cylinder(parent: THREE.Object3D, color: string, x: number, y: number, z: number, top: number, bottom: number, height: number, sides = 7) {
  return mesh(parent, geometry(`c:${top}:${bottom}:${height}:${sides}`, () => new THREE.CylinderGeometry(top, bottom, height, sides)), color, x, y, z);
}
function crystal(parent: THREE.Object3D, color: string, x: number, y: number, z: number, size: number) {
  const m = mesh(parent, geometry('crystal', () => new THREE.OctahedronGeometry(1)), color, x, y, z, true); m.scale.set(size * .55, size, size * .55); return m;
}
function ring(parent: THREE.Object3D, color: string, radius: number, x: number, z: number) {
  const m = mesh(parent, geometry(`ring:${radius}`, () => new THREE.TorusGeometry(radius, .024, 5, 56)), color, x, .055, z, true); m.rotation.x = -Math.PI / 2; return m;
}
export function buildExplorer(profile: Profile) {
  const group = new THREE.Group(); const skin = SKINS[profile.skin], outfit = OUTFITS[profile.outfit];
  const leftLeg = box(group, '#333d36', -.16, .3, 0, .23, .6, .25);
  const rightLeg = box(group, '#333d36', .16, .3, 0, .23, .6, .25);
  box(leftLeg, '#514533', 0, -.42, .16, 1.08, .3, 1.35);
  box(rightLeg, '#514533', 0, -.42, .16, 1.08, .3, 1.35);
  box(group, outfit, 0, .84, 0, .65, .62, .38);
  box(group, '#614f36', 0, .65, .005, .68, .1, .41);
  box(group, '#d4ad60', 0, .65, .235, .13, .12, .025);
  const leftArm = box(group, outfit, -.42, .88, 0, .18, .45, .22);
  const rightArm = box(group, outfit, .42, .88, 0, .18, .45, .22);
  box(group, skin, -.42, .58, 0, .17, .21, .18); box(group, skin, .42, .58, 0, .17, .21, .18);
  box(group, skin, 0, 1.36, 0, .49, .49, .43);
  box(group, '#292d26', -.115, 1.38, .225, .055, .065, .015); box(group, '#292d26', .115, 1.38, .225, .055, .065, .015);
  const hairColor = profile.hair === 2 ? '#a35c32' : '#352d23';
  box(group, hairColor, 0, 1.63, -.025, .53, .15, .48);
  box(group, hairColor, 0, 1.46, -.225, .53, .36, .12);
  if (profile.hair === 1) { box(group, hairColor, -.25, 1.38, -.03, .13, .5, .38); box(group, hairColor, .25, 1.38, -.03, .13, .5, .38); }
  if (profile.hair === 2) { const bun = rock(group, hairColor, 0, 1.73, -.16, .19); bun.scale.y = .21; }
  // Cross-body satchel, neck scarf and bow make the silhouette recognisably an explorer.
  const strap = box(group, '#776346', 0, .92, .217, .075, .58, .055); strap.rotation.z = -.55;
  box(group, '#766044', -.33, .73, -.13, .3, .34, .3);
  box(group, '#ac663f', 0, 1.11, .03, .55, .12, .42);
  const scarf = box(group, '#ac663f', .15, .91, .23, .14, .36, .035); scarf.rotation.z = -.16;
  const bow = mesh(group, geometry('bow', () => new THREE.TorusGeometry(.55, .036, 4, 12, Math.PI)), '#af8850', 0, .9, -.32);
  bow.rotation.z = -.7;
  group.userData = { leftLeg, rightLeg, leftArm, rightArm };
  return group;
}

export type WorldOptions = {
  onNearby: (id: string | null) => void; onInteract: () => void;
  onTargetInteract: (id: string) => void; onPosition: (x: number, z: number) => void; onReady: () => void;
};
export class JungleWorld {
  scene = new THREE.Scene(); camera: THREE.OrthographicCamera; renderer: THREE.WebGLRenderer;
  player: THREE.Group; private frame = 0; private last = 0; private elapsed = 0;
  private keys = new Set<string>(); private target: THREE.Vector3 | null = null;
  private pendingInteraction: string | null = null;
  private paused = true; private motion = false; private nearby: string | null = null;
  private markers = new Map<string, THREE.Group>(); private relics: THREE.Object3D[] = [];
  private guardian = new THREE.Group(); private water: THREE.Mesh[] = []; private fire: THREE.Object3D[] = [];
  private resizeObserver: ResizeObserver; private options: WorldOptions; private disposed = false;
  private particles: THREE.Points; private positionTick = 0; private burst: THREE.Group | null = null;
  private bossHome = new THREE.Vector3(0, 1.2, -9.2);
  constructor(private host: HTMLElement, save: Save, options: WorldOptions) {
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.setAttribute('aria-label', '3D jungle. Click ground to move; click a glowing landmark to interact. WASD and E are optional shortcuts.');
    this.renderer.domElement.setAttribute('tabindex', '0'); this.renderer.domElement.dataset.testid = 'world-canvas';
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color('#344d42'); this.scene.fog = new THREE.Fog('#344d42', 48, 83);
    this.camera = new THREE.OrthographicCamera(-22, 22, 16, -16, .1, 130);
    this.camera.position.set(25, 30, 32); this.camera.lookAt(0, 0, -1);
    this.scene.add(new THREE.HemisphereLight('#f4edd0', '#304a3e', 1.9));
    const sun = new THREE.DirectionalLight('#ffe2a5', 2.7); sun.position.set(-12, 23, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: .1, far: 65 }); sun.shadow.bias = -.0007; sun.shadow.normalBias = .04; this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#9df2d6', 1.6); rim.position.set(8, 10, -14); this.scene.add(rim);
    this.buildTerrain(save.seed); this.buildTemple(); this.buildCamp(); this.batchStaticMeshes(); this.buildLandmarks(); this.buildGuardian();
    this.player = buildExplorer(save.profile); this.player.position.set(0, 0, 7); this.player.rotation.y = Math.PI; this.scene.add(this.player);
    ring(this.player, '#e9d79e', .57, 0, 0);
    const points = new Float32Array(120 * 3); const rng = random(save.seed + 7);
    for (let i = 0; i < 120; i++) { points[i * 3] = (rng() - .5) * 34; points[i * 3 + 1] = rng() * 7 + .5; points[i * 3 + 2] = (rng() - .5) * 30; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#e2d88f', size: .065, transparent: true, opacity: .7, depthWrite: false })); this.scene.add(this.particles);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host);
    window.addEventListener('keydown', this.keydown); window.addEventListener('keyup', this.keyup); window.addEventListener('blur', this.blur);
    this.renderer.domElement.addEventListener('pointerdown', this.pointer);
    this.update(save); this.resize(); this.frame = requestAnimationFrame(this.animate); options.onReady();
  }
  private batchStaticMeshes() {
    // Bake scenery transforms and merge by material; retain animated water/fire.
    // Hundreds of leaves and stones become a few dozen GPU draw calls.
    this.scene.updateMatrixWorld(true);
    const groups = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();
    this.scene.traverse(o => {
      if (!(o instanceof THREE.Mesh) || this.water.includes(o) || this.fire.includes(o) || Array.isArray(o.material) || o.material.transparent) return;
      const group = groups.get(o.material) ?? { geometries: [], meshes: [] };
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld); group.geometries.push(g); group.meshes.push(o); groups.set(o.material, group);
    });
    for (const [material, group] of groups) {
      const merged = mergeGeometries(group.geometries, false);
      if (merged) { const batch = new THREE.Mesh(merged, material); batch.castShadow = true; batch.receiveShadow = true; this.scene.add(batch); group.meshes.forEach(m => m.removeFromParent()); }
      group.geometries.forEach(g => g.dispose());
    }
  }
  private buildTerrain(seed: number) {
    const rng = random(seed), r = (min: number, max: number) => min + rng() * (max - min);
    box(this.scene, '#39483c', 0, -1.6, 0, 36, 3, 32);
    box(this.scene, '#5d704e', 0, -.19, 0, 35.9, .4, 31.9);
    box(this.scene, '#34463a', 0, -2.4, 0, 39, .6, 35);
    const ground = mesh(this.scene, new THREE.PlaneGeometry(200, 200), '#344d42', 0, -3, 0); ground.rotation.x = -Math.PI / 2;
    // Faceted grassy patches break up the ground into natural colour fields.
    for (let i = 0; i < 75; i++) { const p = cylinder(this.scene, ['#647750', '#61724c', '#566c48', '#6c7c53'][i % 4], r(-17, 17), .018, r(-15, 15), r(.6, 2), r(.6, 2), .018, 7); p.rotation.y = r(0, 6); }
    // A shallow turquoise river along the eastern edge, with stones and ripples.
    for (let i = 0; i < 20; i++) {
      const z = -14 + i * 1.5, x = 11.1 + Math.sin(z * .23) * 1.9;
      const m = cylinder(this.scene, i % 2 ? '#368f84' : '#3e9e92', x, .07, z, 2.05, 2.05, .11, 9); this.water.push(m);
      for (const side of [-1, 1]) { const stone = rock(this.scene, ['#818774', '#93957c'][i % 2], x + side * 2, .13, z, r(.35, .65)); stone.rotation.y = r(0, 6); }
      if (i % 2 === 0) { const foam = box(this.scene, '#a7d2b3', x, .135, z, r(.4, 1.2), .015, .04); this.water.push(foam); }
    }
    // Hand-authored connected paths, generated stepping stones.
    const path = (a: number[], b: number[]) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0; t <= len; t += .72) {
      const x = a[0] + (b[0] - a[0]) * t / len, z = a[1] + (b[1] - a[1]) * t / len;
      const stone = cylinder(this.scene, ['#afaa84', '#a7a681', '#b9b28a'][Math.floor(r(0, 3))], x + r(-.17, .17), .045, z + r(-.16, .16), r(.36, .54), .5, .08, 5); stone.rotation.y = r(0, 6);
    } };
    [[ [0, 8], [0, -7]], [[0, 3], [-6, 3]], [[0, 3], [6, 2]], [[0, -4], [-5, -5]], [[0, -4], [7, -5]]].forEach(([a, b]) => path(a, b));
    // Dense layered canopy at the edge, open readable routes in the middle.
    for (let i = 0; i < 64; i++) {
      let x = r(-17, 17), z = r(-15, 15);
      if (Math.abs(x) < 9 && z > -11 && z < 11) { x = Math.sign(x || 1) * r(13.2, 17); }
      if (x > 8 && x < 14) continue;
      if (z > 9 && Math.abs(x) < 6) continue;
      this.tree(x, z, r(.7, 1.3), rng);
    }
    for (const [x, z] of [[-9, -3], [-9, 6], [8, 6], [-7, -10], [6, -11], [-13, 0]]) this.palm(x, z, 1 + rng() * .3);
    for (let i = 0; i < 140; i++) {
      const x = r(-17, 17), z = r(-15, 15);
      if (Math.abs(x) < 1.5 || LANDMARKS.some(l => Math.hypot(l.x - x, l.z - z) < 2) || (x > 8 && x < 14)) continue;
      if (i % 4 === 0) { const m = rock(this.scene, ['#6c7965', '#8c9276', '#586a56'][i % 3], x, .19, z, r(.25, .65)); m.rotation.y = rng() * 6; }
      else this.fern(x, z, r(.4, .8), i % 3 === 0 ? '#84a45b' : '#3e7855');
    }
    // Ruin fragments and a timber crossing.
    for (let i = 0; i < 8; i++) box(this.scene, '#8d7754', 11.8, .24, 4 + i * .28, 4.4, .16, .23);
    for (const z of [3.8, 6.1]) for (const x of [9.7, 13.9]) cylinder(this.scene, '#69563b', x, .65, z, .07, .09, 1.2);
    for (let i = 0; i < 7; i++) { const b = box(this.scene, '#7b846a', -8.3, .25 + i % 2 * .2, -7 + i * .8, 1.1, .5 + i % 2 * .4, .7); b.rotation.y = i * .13; }
    this.toucan(-6.5, 1.5, 3.9); this.toucan(4.5, .4, 5.3);
  }
  private tree(x: number, z: number, s: number, rng: () => number) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); this.scene.add(g);
    cylinder(g, '#665d40', 0, 1.9, 0, .22, .48, 3.8, 6);
    for (let i = 0; i < 3; i++) { const root = box(g, '#5a593d', Math.cos(i * 2.1) * .35, .26, Math.sin(i * 2.1) * .35, .22, .65, 1.1); root.rotation.y = -i * 2.1; root.rotation.z = .2; }
    const colours = ['#315b3e', '#3f7047', '#527e4d', '#688954'];
    for (let i = 0; i < 5; i++) { const a = i * 1.26, canopy = rock(g, colours[i % 4], Math.cos(a) * .9, 3.1 + rng() * 1.2, Math.sin(a) * .85, 1.45 + rng() * .5); canopy.scale.y *= .85; canopy.rotation.y = rng() * 6; }
  }
  private palm(x: number, z: number, s: number) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); this.scene.add(g);
    for (let i = 0; i < 7; i++) cylinder(g, i % 2 ? '#8b7850' : '#796c47', Math.sin(i * .2) * .3, .3 + i * .5, 0, .16 - i * .01, .21 - i * .01, .55, 6);
    for (let i = 0; i < 8; i++) {
      const leaf = new THREE.Group(); leaf.position.set(.3, 3.65, 0); leaf.rotation.y = i * Math.PI / 4; g.add(leaf);
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(-.36, 1); shape.lineTo(-.28, 1.8); shape.lineTo(0, 2.5); shape.lineTo(.28, 1.8); shape.lineTo(.36, 1); shape.closePath();
      const lm = mesh(leaf, geometry('palmleaf', () => new THREE.ShapeGeometry(shape)), i % 2 ? '#609451' : '#3e7c4e');
      lm.material = mat(i % 2 ? '#609451' : '#3e7c4e'); (lm.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      lm.rotation.x = -1.08; lm.rotation.y = .1;
    }
    for (let i = 0; i < 3; i++) rock(g, '#76603d', .3 + Math.cos(i * 2) * .22, 3.5, Math.sin(i * 2) * .2, .18);
  }
  private fern(x: number, z: number, size: number, color: string) {
    const g = new THREE.Group(); g.position.set(x, .02, z); g.scale.setScalar(size); this.scene.add(g);
    for (let i = 0; i < 5; i++) {
      const l = mesh(g, geometry('fern', () => new THREE.ConeGeometry(.15, 1.2, 3)), color, Math.cos(i * 1.26) * .22, .32, Math.sin(i * 1.26) * .22);
      l.rotation.z = Math.cos(i * 1.26) * -.7; l.rotation.x = Math.sin(i * 1.26) * .7;
    }
  }
  private buildTemple() {
    const g = new THREE.Group(); g.position.set(0, 0, -10); this.scene.add(g);
    for (let i = 0; i < 5; i++) box(g, i % 2 ? '#a19e7d' : '#919679', 0, .12 + i * .21, .8 - i * .25, 8.8 - i * .9, .25, 6.4 - i * .6);
    for (const x of [-3, 3]) {
      box(g, '#a6a181', x, 1.15, -1.5, 1.1, .4, 1.2);
      for (let i = 0; i < 4; i++) { const b = box(g, i % 2 ? '#95977b' : '#a4a184', x, 1.6 + i * .72, -1.5, .82, .65, .9); b.rotation.y = i % 2 * .025; }
      box(g, '#b1aa88', x, 4.05, -1.5, 1.3, .35, 1.35);
      box(g, '#617351', x + .03, 4.27, -1.5, 1.4, .12, 1.42);
      for (let i = 0; i < 4; i++) box(g, '#416446', x - .38, 2.6 + i * .38, -1.03, .12, .5, .08);
    }
    box(g, '#a4a083', 0, 4.35, -1.5, 7.4, .48, 1.55);
    box(g, '#7e8a67', 0, 4.65, -1.5, 7.8, .16, 1.7);
    for (let i = -3; i <= 3; i++) box(g, '#7e8869', i * .8, 4.38, -.7, .28, .2, .035);
    const gem = crystal(g, '#62d8c2', 0, 4.39, -.67, .19); gem.rotation.z = Math.PI / 4;
    for (const x of [-3.5, 3.5]) { cylinder(g, '#6e795d', x, 1.25, 2.1, .4, .6, .5, 4); crystal(g, '#66d6bb', x, 1.8, 2.1, .28); }
    const portal = mesh(g, new THREE.PlaneGeometry(3.5, 3.1), '#233e35', 0, 2.6, -1.8); portal.material = new THREE.MeshStandardMaterial({ color: '#133b33', transparent: true, opacity: .6, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i++) rock(g, '#657853', -4.8 + i * 2.3, .4, -3.6, .8);
  }
  private buildLandmarks() {
    for (const l of LANDMARKS) {
      const g = new THREE.Group(); g.position.set(l.x, l.kind === 'boss' ? 1.08 : 0, l.z); this.scene.add(g); this.markers.set(l.id, g); g.userData.landmark = l.id;
      if (l.kind === 'boss') continue;
      ring(g, l.kind === 'cache' ? '#d5bd73' : '#68c9a7', 1.05, 0, 0);
      if (l.kind === 'cache') {
        box(g, '#6d4e32', 0, .35, 0, 1.15, .6, .75); box(g, '#a18548', 0, .7, 0, 1.2, .15, .8);
        for (const x of [-.4, .4]) box(g, '#c4a867', x, .43, .39, .09, .55, .035);
        box(g, '#ead18b', 0, .42, .42, .16, .2, .06);
      } else {
        cylinder(g, '#8e9275', 0, .18, 0, .78, .92, .36, 6);
        cylinder(g, '#a4a384', 0, .58, 0, .47, .6, .58, 5);
        box(g, '#b5ae88', 0, .97, 0, 1.1, .2, .95);
        const c = crystal(g, l.id === 'ember' ? '#edbd6b' : l.id === 'root' ? '#a9d875' : '#70dbc7', 0, 1.6, 0, .43);
        c.userData.landmark = l.id; c.userData.originalMaterial = c.material; this.relics.push(c);
        for (let i = 0; i < 4; i++) { const m = box(g, '#45614d', Math.cos(i * Math.PI / 2) * .48, .56, Math.sin(i * Math.PI / 2) * .48, .12, .23, .1); m.rotation.y = -i * Math.PI / 2; }
      }
      const light = new THREE.PointLight(l.kind === 'cache' ? '#f3d89a' : '#70efca', 2, 3); light.position.y = 1.4; g.add(light);
    }
  }
  private buildCamp() {
    const g = new THREE.Group(); g.position.set(-3.2, 0, 9); this.scene.add(g);
    const tent = mesh(g, new THREE.ConeGeometry(1.6, 2.1, 4, 1, true), '#a18453', 0, 1.05, 0); tent.rotation.y = Math.PI / 4; tent.scale.z = 1.2;
    const door = mesh(g, new THREE.ConeGeometry(.7, 1.45, 3), '#463f2d', 0, .73, 1.22); door.scale.z = .08;
    const pole = box(g, '#594f35', 0, 1, 1.33, .07, 2, .07); pole.rotation.z = .02;
    for (let i = 0; i < 8; i++) rock(this.scene, '#899076', 1.8 + Math.cos(i * Math.PI / 4) * .55, .15, 9 + Math.sin(i * Math.PI / 4) * .55, .22);
    for (let i = 0; i < 3; i++) { const flame = mesh(this.scene, new THREE.ConeGeometry(.19, .7, 5), i % 2 ? '#edbf6d' : '#e99445', 1.8 + (i - 1) * .13, .46, 9, true); this.fire.push(flame); }
    const light = new THREE.PointLight('#ffb04c', 4, 5); light.position.set(1.8, 1, 9); this.scene.add(light);
    box(this.scene, '#786348', 2.8, .22, 10, 1.7, .38, .5);
  }
  private buildGuardian() {
    const g = this.guardian; g.userData.landmark = 'guardian'; this.scene.add(g); g.position.copy(this.bossHome);
    for (const x of [-.5, .5]) { rock(g, '#586e58', x, .38, .05, .55); box(g, '#788465', x, .78, 0, .6, .8, .65); }
    rock(g, '#809071', 0, 1.7, 0, 1.1);
    for (const side of [-1, 1]) {
      rock(g, '#6d8264', side * 1.04, 2.13, 0, .63);
      box(g, '#67795e', side * 1.29, 1.5, 0, .55, .95, .6);
      rock(g, '#7c8b69', side * 1.3, .99, .12, .45);
      const horn = crystal(g, '#89d6a6', side * .5, 3.18, 0, .39); horn.rotation.z = side * -.35;
    }
    box(g, '#8d9977', 0, 2.65, .05, 1.15, .78, .8);
    for (const x of [-.27, .27]) box(g, '#b7ffcd', x, 2.75, .46, .22, .095, .04).material = mat('#81eaba', 1, true);
    box(g, '#465f48', 0, 2.4, .47, .5, .08, .04);
    crystal(g, '#65dfb8', 0, 1.8, .81, .32);
    for (let i = 0; i < 5; i++) rock(g, '#52784e', -.7 + i * .3, 2.12, -.3, .28);
  }
  private toucan(x: number, y: number, z: number) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.scene.add(g);
    rock(g, '#293d37', 0, .2, 0, .22); rock(g, '#263832', .05, .43, 0, .16);
    const beak = mesh(g, new THREE.ConeGeometry(.105, .38, 4), '#dfac56', .28, .42, 0); beak.rotation.z = -Math.PI / 2;
    box(g, '#e6dbaa', .13, .42, .1, .04, .045, .025);
  }
  update(save: Save) {
    this.motion = save.settings.reducedMotion;
    for (const [id, g] of this.markers) { g.visible = true; g.userData.complete = save.completed.includes(id); }
    for (const relic of this.relics) { const completed = save.completed.includes(relic.userData.landmark); (relic as THREE.Mesh).material = completed ? mat('#54c4a1', 1, true) : relic.userData.originalMaterial; relic.userData.complete = completed; }
    this.guardian.visible = !save.won;
    this.guardian.scale.setScalar(1 - save.guardianStage * .05);
    const position = this.player.position.clone(), rotation = this.player.rotation.clone(); this.scene.remove(this.player);
    this.player = buildExplorer(save.profile); this.player.position.copy(position); this.player.rotation.copy(rotation); ring(this.player, '#eedb99', .57, 0, 0); this.scene.add(this.player);
  }
  setPaused(paused: boolean) { this.paused = paused; if (paused) { this.keys.clear(); this.target = null; this.pendingInteraction = null; } }
  goTo(id: string) { const l = LANDMARKS.find(l => l.id === id); if (l) { this.target = new THREE.Vector3(l.x, 0, l.z + 1.8); this.pendingInteraction = null; } }
  control(key: string, down: boolean) { if (down) this.keys.add(key); else this.keys.delete(key); }
  celebrate(id: string) {
    const l = LANDMARKS.find(l => l.id === id); if (!l) return;
    if (this.burst) this.scene.remove(this.burst);
    this.burst = new THREE.Group(); this.burst.position.set(l.x, 1.1, l.z); this.burst.userData.start = this.elapsed; this.scene.add(this.burst);
    for (let i = 0; i < 18; i++) { const c = crystal(this.burst, i % 2 ? '#e6c87d' : '#80e9c5', Math.cos(i) * .6, .1, Math.sin(i) * .6, .12); c.userData.angle = i; }
  }
  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h); const aspect = w / h;
    const half = aspect > 1.4 ? 14.6 : 17.5;
    this.camera.left = -half * aspect; this.camera.right = half * aspect; this.camera.top = half; this.camera.bottom = -half; this.camera.updateProjectionMatrix();
  }
  private keydown = (e: KeyboardEvent) => {
    if (this.paused || /INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target as HTMLElement)?.tagName)) return;
    const key = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)) { e.preventDefault(); if (key === 'e' && !e.repeat) this.options.onInteract(); else this.keys.add(key); }
  };
  private keyup = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private blur = () => { this.keys.clear(); this.target = null; };
  private pointer = (e: PointerEvent) => {
    if (this.paused) return;
    this.renderer.domElement.focus({ preventScroll: true });
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this.camera);
    const objects = [...this.markers.values(), this.guardian].filter(g => g.visible);
    const hit = ray.intersectObjects(objects, true).find(h => { let o: THREE.Object3D | null = h.object; while (o) { if (!o.visible) return false; o = o.parent; } return true; });
    if (hit) { let o: THREE.Object3D | null = hit.object; while (o && !o.userData.landmark) o = o.parent; if (o) { const l = LANDMARKS.find(l => l.id === o!.userData.landmark)!; this.target = new THREE.Vector3(l.x, 0, Math.min(11, l.z + 1.8)); this.pendingInteraction = l.id; return; } }
    this.pendingInteraction = null;
    const point = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point)) { point.x = THREE.MathUtils.clamp(point.x, -9, 8); point.z = THREE.MathUtils.clamp(point.z, -7.4, 11); this.target = point; }
  };
  private animate = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min((now - (this.last || now)) / 1000, .05); this.last = now; this.elapsed += dt;
    let moving = false;
    if (!this.paused && !document.hidden) {
      const x = (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) - (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);
      const z = (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0) - (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0);
      const direction = new THREE.Vector3(x * .78 + z * .63, 0, z * .78 - x * .63);
      if (x || z) { this.target = null; this.pendingInteraction = null; }
      if (this.target && direction.lengthSq() === 0) { direction.copy(this.target).sub(this.player.position); direction.y = 0; if (direction.length() < .12) { this.target = null; direction.set(0, 0, 0); } }
      if (direction.lengthSq() > 0) {
        direction.normalize(); const p = this.player.position.clone().addScaledVector(direction, dt * 5.4);
        p.x = THREE.MathUtils.clamp(p.x, -9, 8); p.z = THREE.MathUtils.clamp(p.z, -7.4, 11);
        p.y = p.z < -6.8 && Math.abs(p.x) < 4 ? Math.min(1.08, (-p.z - 6.8) * 1.8) : 0;
        this.player.position.copy(p); this.player.rotation.y = Math.atan2(direction.x, direction.z); moving = true;
      }
      const nearest = LANDMARKS.map(l => ({ id: l.id, d: Math.hypot(this.player.position.x - l.x, this.player.position.z - l.z) })).sort((a, b) => a.d - b.d)[0];
      const id = nearest.d < 2.8 ? nearest.id : null; if (id !== this.nearby) { this.nearby = id; this.options.onNearby(id); }
      if (this.pendingInteraction && id === this.pendingInteraction) { const interaction = this.pendingInteraction; this.pendingInteraction = null; this.target = null; this.options.onTargetInteract(interaction); }
    }
    if (!this.motion) {
      const stride = moving ? Math.sin(this.elapsed * 12) * .45 : 0;
      this.player.userData.leftLeg.rotation.x = stride; this.player.userData.rightLeg.rotation.x = -stride;
      this.player.userData.leftArm.rotation.x = -stride * .7; this.player.userData.rightArm.rotation.x = stride * .7;
      this.relics.forEach((r, i) => { r.rotation.y = this.elapsed * .7 + i; r.position.y = (r.userData.complete ? 1.27 : 1.6) + Math.sin(this.elapsed * 1.8 + i) * .1; });
      this.guardian.position.y = this.bossHome.y + Math.sin(this.elapsed * 1.2) * .045;
      this.fire.forEach((f, i) => { f.scale.y = .8 + Math.sin(this.elapsed * 9 + i) * .2; });
      this.particles.rotation.y = Math.sin(this.elapsed * .02) * .1;
      this.water.forEach((m, i) => { if (i % 3 === 0) m.position.y = .065 + Math.sin(this.elapsed + i) * .009; });
    }
    if (this.burst) {
      const age = this.elapsed - this.burst.userData.start;
      this.burst.children.forEach(c => { const a = c.userData.angle; c.position.set(Math.cos(a) * age * 2, Math.sin(age * 1.8) * 1.5 + a % 3 * .2, Math.sin(a) * age * 2); c.scale.setScalar(Math.max(0, 1 - age / 2)); });
      if (age > 2 || this.motion) { this.scene.remove(this.burst); this.burst = null; }
    }
    this.positionTick += dt; if (this.positionTick > .12) { this.positionTick = 0; this.options.onPosition(this.player.position.x, this.player.position.z); }
    this.renderer.render(this.scene, this.camera); this.frame = requestAnimationFrame(this.animate);
  };
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.keydown); window.removeEventListener('keyup', this.keyup); window.removeEventListener('blur', this.blur); this.renderer.domElement.removeEventListener('pointerdown', this.pointer);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    this.scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); geometryCache.clear(); materialCache.clear();
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
