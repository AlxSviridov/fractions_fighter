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
  if (!materialCache.has(key))
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        flatShading: true,
        ...(glow ? { emissive: color, emissiveIntensity: 0.8, toneMapped: false } : {}),
      }),
    );
  return materialCache.get(key)!;
}
const geometryCache = new Map<string, THREE.BufferGeometry>();
function geometry(key: string, create: () => THREE.BufferGeometry) {
  if (!geometryCache.has(key)) geometryCache.set(key, create());
  return geometryCache.get(key)!;
}
function mesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  color: string,
  x = 0,
  y = 0,
  z = 0,
  glow = false,
) {
  const m = new THREE.Mesh(geo, mat(color, 1, glow));
  m.position.set(x, y, z);
  m.castShadow = !glow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  const m = mesh(
    parent,
    geometry('box', () => new THREE.BoxGeometry(1, 1, 1)),
    color,
    x,
    y,
    z,
  );
  m.scale.set(w, h, d);
  return m;
}
function rock(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  size: number,
) {
  const m = mesh(
    parent,
    geometry('rock', () => new THREE.DodecahedronGeometry(1, 0)),
    color,
    x,
    y,
    z,
  );
  m.scale.set(size, size * 0.75, size * 0.8);
  return m;
}
function cylinder(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  top: number,
  bottom: number,
  height: number,
  sides = 7,
) {
  return mesh(
    parent,
    geometry(
      `c:${top}:${bottom}:${height}:${sides}`,
      () => new THREE.CylinderGeometry(top, bottom, height, sides),
    ),
    color,
    x,
    y,
    z,
  );
}
function crystal(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  size: number,
) {
  const m = mesh(
    parent,
    geometry('crystal', () => new THREE.OctahedronGeometry(1)),
    color,
    x,
    y,
    z,
    true,
  );
  m.scale.set(size * 0.55, size, size * 0.55);
  return m;
}
function ring(parent: THREE.Object3D, color: string, radius: number, x: number, z: number) {
  const m = mesh(
    parent,
    geometry(`ring:${radius}`, () => new THREE.TorusGeometry(radius, 0.024, 5, 56)),
    color,
    x,
    0.055,
    z,
    true,
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}
export type ExplorerAppearance = Profile & {
  avatarId?: string;
  classId?: string;
  equipment?: { weapon?: string | null; armour?: string | null; relic?: string | null };
  inventory?: Array<{ id: string; slot: string; rarity: string }>;
};
export type RpgWorldSnapshot = {
  zone: 'village' | 'wilds';
  enemies: Array<{ id: string; x: number; z: number; hp: number; maxHp: number; kind: string }>;
  avatarId?: string;
  classId?: string;
  equipment?: ExplorerAppearance['equipment'];
  inventory?: ExplorerAppearance['inventory'];
};
function orb(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy = sx,
  sz = sx,
  glow = false,
) {
  const m = mesh(
    parent,
    geometry('orb', () => new THREE.IcosahedronGeometry(1, 1)),
    color,
    x,
    y,
    z,
    glow,
  );
  m.scale.set(sx, sy, sz);
  return m;
}

// Original faceted interpretations of the supplied portraits; not scans or exact conversions.
export function buildExplorer(profile: ExplorerAppearance) {
  const group = new THREE.Group();
  const id = profile.avatarId ?? '7';
  const cat = id === '39',
    golem = id === '49',
    cloud = id === '58';
  const mage = profile.classId === 'arcanist',
    ranger = profile.classId === 'ranger';
  const skin = cat
    ? '#d7a16c'
    : golem
      ? '#86aaa2'
      : cloud
        ? '#d3e8ee'
        : (SKINS[profile.skin] ?? SKINS[1]);
  const cloth = mage ? '#695383' : ranger ? '#436b51' : '#486675';
  const armourId = profile.equipment?.armour;
  const rarity = profile.inventory?.find((item) => item.id === armourId)?.rarity;
  const weaponRarity = profile.inventory?.find(
    (item) => item.id === profile.equipment?.weapon,
  )?.rarity;
  const metal = rarity === 'rare' ? '#82beca' : rarity === 'legendary' ? '#b19add' : '#b7b19a';
  const gold = '#cda75d';
  const leftLeg = new THREE.Group(),
    rightLeg = new THREE.Group();
  for (const [leg, sign] of [
    [leftLeg, -1],
    [rightLeg, 1],
  ] as const) {
    group.add(leg);
    leg.position.set(sign * 0.19, 0.53, 0);
    cylinder(leg, cloud ? skin : '#383f43', 0, -0.19, 0, 0.13, 0.11, 0.45);
    orb(leg, cloud ? '#eaf5f3' : '#51493f', 0, -0.43, 0.07, 0.16, 0.15, 0.25);
    if (!cloud) box(leg, gold, 0, -0.3, 0.125, 0.24, 0.055, 0.04);
  }
  cylinder(group, cloud ? skin : cloth, 0, 0.9, 0, 0.31, 0.4, 0.8, 8);
  if (golem) orb(group, '#94b2ac', 0, 0.95, 0, 0.49, 0.55, 0.32);
  const leftArm = new THREE.Group(),
    rightArm = new THREE.Group();
  for (const [arm, sign] of [
    [leftArm, -1],
    [rightArm, 1],
  ] as const) {
    group.add(arm);
    arm.position.set(sign * 0.42, 1.2, 0);
    orb(arm, cloud ? skin : mage || ranger ? cloth : metal, 0, -0.04, 0, 0.22, 0.2, 0.24);
    cylinder(arm, cloud ? skin : cloth, 0, -0.25, 0, 0.12, 0.12, 0.4);
    cylinder(arm, cloud ? '#eff7f1' : '#746a54', 0, -0.36, 0, 0.14, 0.12, 0.18);
    orb(arm, skin, 0, -0.47, 0.025, 0.12, 0.135, 0.12);
  }
  if (!cloud) {
    cylinder(group, '#584834', 0, 0.69, 0, 0.39, 0.38, 0.11, 8);
    box(group, gold, 0, 0.69, 0.37, 0.16, 0.13, 0.04);
    const sash = box(group, '#bc9561', -0.04, 1.01, 0.294, 0.07, 0.59, 0.05);
    sash.rotation.z = -0.5;
    if (!mage && !ranger) {
      orb(group, metal, 0, 1.05, 0.19, 0.32, 0.3, 0.16);
      crystal(group, '#86dfbb', 0, 1.05, 0.34, 0.105);
    }
    for (let i = 0; i < 3; i++) box(group, gold, -0.22 + i * 0.22, 0.5, 0.24, 0.055, 0.16, 0.035);
    box(group, '#66533f', -0.35, 0.67, 0.04, 0.21, 0.26, 0.25);
  }
  // Large, readable faces, ears and individual locks replace a recoloured cube head.
  orb(group, skin, 0, 1.66, 0, 0.37, 0.4, 0.32);
  orb(group, skin, -0.37, 1.63, 0, 0.09, 0.12, 0.08);
  orb(group, skin, 0.37, 1.63, 0, 0.09, 0.12, 0.08);
  if (golem) {
    orb(group, '#223e40', 0, 1.67, 0.24, 0.29, 0.24, 0.12);
    for (const x of [-0.13, 0.13]) orb(group, '#8ef5d5', x, 1.7, 0.346, 0.07, 0.095, 0.027, true);
    crystal(group, gold, 0, 2.17, 0, 0.16);
    cylinder(group, gold, 0, 2.05, 0, 0.025, 0.025, 0.2);
    crystal(group, '#81f3ae', 0, 0.95, 0.33, 0.16);
  } else if (!cloud) {
    for (const x of [-0.13, 0.13]) {
      orb(group, '#f8f0dd', x, 1.68, 0.28, 0.098, 0.12, 0.04);
      orb(
        group,
        cat ? '#779441' : id === '28' ? '#559991' : '#574539',
        x,
        1.68,
        0.316,
        0.059,
        0.079,
        0.025,
      );
      orb(group, '#222f2c', x, 1.68, 0.336, 0.032, 0.051, 0.013);
      orb(group, '#fff9dd', x - 0.017, 1.71, 0.35, 0.017, 0.02, 0.008);
    }
    orb(group, cat ? '#dc9b92' : skin, 0, 1.57, 0.319, 0.06, 0.05, 0.055);
    box(group, '#825548', 0, 1.48, 0.284, 0.09, 0.022, 0.02);
  } else {
    for (const [x, y, z, r] of [
      [-0.23, 1.8, 0, 0.29],
      [0.24, 1.8, 0, 0.27],
      [0, 1.98, 0, 0.29],
      [0, 1.55, 0.1, 0.3],
      [-0.28, 0.95, 0, 0.25],
      [0.25, 0.96, 0, 0.26],
    ])
      orb(group, '#e5f1ec', x, y, z, r);
    for (const x of [-0.12, 0.12]) orb(group, '#73b3c6', x, 1.7, 0.37, 0.042, 0.069, 0.025, true);
    crystal(group, '#acdbea', 0, 1.05, 0.33, 0.14);
  }
  if (cat) {
    for (const x of [-0.27, 0.27]) {
      const ear = cylinder(group, skin, x, 1.99, 0, 0, 0.17, 0.37, 3);
      ear.rotation.z = -x * 0.8;
      orb(group, '#efd8bd', x * 0.45, 1.5, 0.255, 0.14, 0.1, 0.08);
    }
    const tail = mesh(
      group,
      geometry('tail', () => new THREE.TorusGeometry(0.38, 0.085, 5, 10, Math.PI * 1.3)),
      skin,
      0.32,
      0.54,
      -0.35,
    );
    tail.rotation.y = Math.PI / 2;
    tail.rotation.z = -0.7;
  } else if (!golem && !cloud) {
    const hair = id === '28' ? '#d5b36d' : profile.hair === 2 ? '#a25935' : '#4a3027';
    orb(group, hair, 0, 1.94, -0.05, 0.4, 0.19, 0.34);
    for (let i = 0; i < 5; i++) {
      const lock = orb(
        group,
        hair,
        -0.28 + i * 0.12,
        1.94 - Math.abs(i - 2) * 0.035,
        0.16,
        0.115,
        0.19,
        0.18,
      );
      lock.rotation.z = -0.45;
    }
    if (id === '7' || profile.hair === 1) {
      for (let i = 0; i < 6; i++)
        orb(group, hair, -0.29 - (i % 2) * 0.035, 1.64 - i * 0.105, -0.08, 0.105, 0.12, 0.12);
      orb(group, gold, -0.32, 1.02, -0.08, 0.08, 0.04, 0.08);
    }
    if (profile.hair === 2) orb(group, hair, 0, 2.06, -0.18, 0.16, 0.16, 0.17);
  }
  if (mage || cat) {
    const brim = cylinder(group, '#5c457d', 0, 2.02, 0, 0.61, 0.62, 0.075, 9);
    brim.rotation.z = 0.12;
    const hat = cylinder(group, '#71588f', -0.09, 2.3, 0, 0.025, 0.34, 0.67, 7);
    hat.rotation.z = 0.2;
    cylinder(group, gold, 0, 2.1, 0, 0.3, 0.33, 0.06, 8);
    crystal(group, gold, 0.1, 2.3, 0.24, 0.085);
  }
  // Layered cloak and different held weapons give each class a distinct silhouette.
  if (!cloud) {
    const cape = cylinder(
      group,
      mage ? '#493764' : ranger ? '#345547' : '#953f37',
      0,
      0.93,
      -0.2,
      0.26,
      0.53,
      0.99,
      5,
    );
    cape.scale.z = 0.3;
    cape.rotation.x = 0.17;
    box(group, gold, -0.22, 1.27, 0.14, 0.08, 0.07, 0.06);
    box(group, gold, 0.22, 1.27, 0.14, 0.08, 0.07, 0.06);
  }
  const weapon = new THREE.Group();
  rightArm.add(weapon);
  weapon.position.set(0, -0.45, 0.09);
  if (mage || cloud) {
    cylinder(weapon, '#66503c', 0, 0.33, 0, 0.045, 0.055, 1.65, 6);
    const fork = mesh(
      weapon,
      geometry('staff-fork', () => new THREE.TorusGeometry(0.19, 0.033, 5, 9, Math.PI * 1.5)),
      gold,
      0,
      1.13,
      0,
    );
    fork.rotation.z = -0.8;
    crystal(weapon, weaponRarity === 'legendary' ? '#c6a0ee' : '#82ded1', 0, 1.16, 0, 0.18);
  } else if (ranger) {
    const bow = mesh(
      weapon,
      geometry('hero-bow', () => new THREE.TorusGeometry(0.5, 0.043, 5, 14, Math.PI)),
      gold,
      0,
      0.23,
      0,
    );
    bow.rotation.z = -Math.PI / 2;
    box(weapon, '#d5c397', 0.01, 0.23, 0, 0.018, 0.99, 0.018);
    cylinder(group, '#72543b', 0.22, 1.08, -0.29, 0.13, 0.13, 0.7, 6);
    for (let i = 0; i < 3; i++)
      cylinder(group, '#c1b494', 0.15 + i * 0.055, 1.45, -0.29, 0.018, 0.018, 0.55, 4);
  } else {
    box(weapon, '#594239', 0, 0.08, 0, 0.1, 0.3, 0.1);
    box(weapon, gold, 0, 0.26, 0, 0.4, 0.055, 0.1);
    const blade = cylinder(
      weapon,
      weaponRarity === 'rare' ? '#9fdad4' : weaponRarity === 'legendary' ? '#bea1e3' : metal,
      0,
      0.67,
      0,
      0,
      0.115,
      0.82,
      4,
    );
    blade.rotation.y = Math.PI / 4;
    const shield = cylinder(leftArm, metal, 0, -0.28, 0.16, 0.32, 0.32, 0.075, 6);
    shield.rotation.x = Math.PI / 2;
    crystal(leftArm, '#658e8a', 0, -0.28, 0.23, 0.14);
  }
  if (profile.equipment?.relic) {
    const relicColour =
      profile.inventory?.find((item) => item.id === profile.equipment?.relic)?.rarity === 'rare'
        ? '#9cd9df'
        : '#dfc476';
    crystal(group, relicColour, 0, 1.25, 0.32, 0.12);
  }
  if (armourId && !cloud) {
    for (const side of [-1, 1]) {
      const plate = cylinder(group, metal, side * 0.43, 1.31, 0, 0, 0.19, 0.24, 4);
      plate.rotation.z = side * -0.4;
    }
  }
  group.scale.setScalar(1.12);
  group.userData = { leftLeg, rightLeg, leftArm, rightArm, weapon };
  return group;
}

export type WorldOptions = {
  onNearby: (id: string | null) => void;
  onInteract: () => void;
  onTargetInteract: (id: string) => void;
  onPosition: (x: number, z: number) => void;
  onReady: () => void;
  onEnemyInteract?: (id: string) => void;
  onZoneInteract?: (zone: 'village' | 'wilds') => void;
};
export class JungleWorld {
  scene = new THREE.Scene();
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  player: THREE.Group;
  private wildsScene = new THREE.Group();
  private villageScene = new THREE.Group();
  private villageGate = new THREE.Group();
  private enemyMeshes = new Map<string, THREE.Group>();
  private rpg: RpgWorldSnapshot | null = null;
  private profile: Profile;
  private appearanceKey = '';
  private pendingEnemy: string | null = null;
  private pendingZone = false;
  private attackStarted = -100;
  private attackAction: 'strike' | 'power' | 'ritual' = 'strike';
  private impacts: THREE.Group[] = [];
  private frame = 0;
  private last = 0;
  private elapsed = 0;
  private keys = new Set<string>();
  private target: THREE.Vector3 | null = null;
  private pendingInteraction: string | null = null;
  private paused = true;
  private motion = false;
  private nearby: string | null = null;
  private markers = new Map<string, THREE.Group>();
  private relics: THREE.Object3D[] = [];
  private guardian = new THREE.Group();
  private water: THREE.Mesh[] = [];
  private fire: THREE.Object3D[] = [];
  private resizeObserver: ResizeObserver;
  private options: WorldOptions;
  private disposed = false;
  private particles: THREE.Points;
  private positionTick = 0;
  private burst: THREE.Group | null = null;
  private bossHome = new THREE.Vector3(0, 1.2, -9.2);
  constructor(
    private host: HTMLElement,
    save: Save,
    options: WorldOptions,
  ) {
    this.options = options;
    this.profile = save.profile;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.setAttribute(
      'aria-label',
      '3D jungle. Click ground to move; click a glowing landmark to interact. WASD and E are optional shortcuts.',
    );
    this.renderer.domElement.setAttribute('tabindex', '0');
    this.renderer.domElement.dataset.testid = 'world-canvas';
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color('#344d42');
    this.scene.fog = new THREE.Fog('#344d42', 48, 83);
    this.camera = new THREE.OrthographicCamera(-22, 22, 16, -16, 0.1, 130);
    this.camera.position.set(25, 30, 32);
    this.camera.lookAt(0, 0, -1);
    this.scene.add(new THREE.HemisphereLight('#f4edd0', '#304a3e', 1.9));
    const sun = new THREE.DirectionalLight('#ffe2a5', 2.7);
    sun.position.set(-12, 23, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -22,
      right: 22,
      top: 22,
      bottom: -22,
      near: 0.1,
      far: 65,
    });
    sun.shadow.bias = -0.0007;
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#9df2d6', 1.6);
    rim.position.set(8, 10, -14);
    this.scene.add(rim);
    this.buildTerrain(save.seed);
    this.buildTemple();
    this.buildCamp();
    this.buildWildsLandmarks();
    this.batchStaticMeshes();
    this.buildLandmarks();
    this.buildGuardian();
    // Keep the authored wilds and settlement as independently visible scene layers.
    for (const child of [...this.scene.children]) {
      if (!(child instanceof THREE.Light)) this.wildsScene.add(child);
    }
    this.scene.add(this.wildsScene);
    this.buildVillage();
    this.villageScene.visible = false;
    this.scene.add(this.villageScene);
    this.batchStaticMeshes(this.villageScene);
    this.player = buildExplorer(save.profile);
    this.player.position.set(0, 0, 7);
    this.player.rotation.y = Math.PI;
    this.scene.add(this.player);
    ring(this.player, '#e9d79e', 0.57, 0, 0);
    const points = new Float32Array(120 * 3);
    const rng = random(save.seed + 7);
    for (let i = 0; i < 120; i++) {
      points[i * 3] = (rng() - 0.5) * 34;
      points[i * 3 + 1] = rng() * 7 + 0.5;
      points[i * 3 + 2] = (rng() - 0.5) * 30;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: '#e2d88f',
        size: 0.065,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    this.scene.add(this.particles);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
    window.addEventListener('blur', this.blur);
    this.renderer.domElement.addEventListener('pointerdown', this.pointer);
    this.update(save);
    this.resize();
    this.frame = requestAnimationFrame(this.animate);
    options.onReady();
  }
  private batchStaticMeshes(root: THREE.Object3D = this.scene) {
    // Bake scenery transforms and merge by material; retain animated water/fire.
    // Hundreds of leaves and stones become a few dozen GPU draw calls.
    this.scene.updateMatrixWorld(true);
    const groups = new Map<
      THREE.Material,
      { geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }
    >();
    root.traverse((o) => {
      if (
        !(o instanceof THREE.Mesh) ||
        this.water.includes(o) ||
        this.fire.includes(o) ||
        Array.isArray(o.material) ||
        o.material.transparent ||
        o.userData.interactive
      )
        return;
      const group = groups.get(o.material) ?? { geometries: [], meshes: [] };
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      group.geometries.push(g);
      group.meshes.push(o);
      groups.set(o.material, group);
    });
    for (const [material, group] of groups) {
      const merged = mergeGeometries(group.geometries, false);
      if (merged) {
        const batch = new THREE.Mesh(merged, material);
        batch.castShadow = true;
        batch.receiveShadow = true;
        root.add(batch);
        group.meshes.forEach((m) => m.removeFromParent());
      }
      group.geometries.forEach((g) => g.dispose());
    }
  }
  private buildTerrain(seed: number) {
    const rng = random(seed),
      r = (min: number, max: number) => min + rng() * (max - min);
    box(this.scene, '#39483c', 0, -1.6, 0, 36, 3, 32);
    box(this.scene, '#5d704e', 0, -0.19, 0, 35.9, 0.4, 31.9);
    box(this.scene, '#34463a', 0, -2.4, 0, 39, 0.6, 35);
    const ground = mesh(this.scene, new THREE.PlaneGeometry(200, 200), '#344d42', 0, -3, 0);
    ground.rotation.x = -Math.PI / 2;
    // Faceted grassy patches break up the ground into natural colour fields.
    for (let i = 0; i < 75; i++) {
      const p = cylinder(
        this.scene,
        ['#647750', '#61724c', '#566c48', '#6c7c53'][i % 4],
        r(-17, 17),
        0.018,
        r(-15, 15),
        r(0.6, 2),
        r(0.6, 2),
        0.018,
        7,
      );
      p.rotation.y = r(0, 6);
    }
    // A shallow turquoise river along the eastern edge, with stones and ripples.
    for (let i = 0; i < 20; i++) {
      const z = -14 + i * 1.5,
        x = 11.1 + Math.sin(z * 0.23) * 1.9;
      const m = cylinder(
        this.scene,
        i % 2 ? '#368f84' : '#3e9e92',
        x,
        0.07,
        z,
        2.05,
        2.05,
        0.11,
        9,
      );
      this.water.push(m);
      for (const side of [-1, 1]) {
        const stone = rock(
          this.scene,
          ['#818774', '#93957c'][i % 2],
          x + side * 2,
          0.13,
          z,
          r(0.35, 0.65),
        );
        stone.rotation.y = r(0, 6);
      }
      if (i % 2 === 0) {
        const foam = box(this.scene, '#a7d2b3', x, 0.135, z, r(0.4, 1.2), 0.015, 0.04);
        this.water.push(foam);
      }
    }
    // Hand-authored connected paths, generated stepping stones.
    const path = (a: number[], b: number[]) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let t = 0; t <= len; t += 0.72) {
        const x = a[0] + ((b[0] - a[0]) * t) / len,
          z = a[1] + ((b[1] - a[1]) * t) / len;
        const stone = cylinder(
          this.scene,
          ['#afaa84', '#a7a681', '#b9b28a'][Math.floor(r(0, 3))],
          x + r(-0.17, 0.17),
          0.045,
          z + r(-0.16, 0.16),
          r(0.36, 0.54),
          0.5,
          0.08,
          5,
        );
        stone.rotation.y = r(0, 6);
      }
    };
    [
      [
        [0, 8],
        [0, -7],
      ],
      [
        [0, 3],
        [-6, 3],
      ],
      [
        [0, 3],
        [6, 2],
      ],
      [
        [0, -4],
        [-5, -5],
      ],
      [
        [0, -4],
        [7, -5],
      ],
    ].forEach(([a, b]) => path(a, b));
    // Dense layered canopy at the edge, open readable routes in the middle.
    for (let i = 0; i < 64; i++) {
      let x = r(-17, 17),
        z = r(-15, 15);
      if (Math.abs(x) < 9 && z > -11 && z < 11) {
        x = Math.sign(x || 1) * r(13.2, 17);
      }
      if (x > 8 && x < 14) continue;
      if (z > 9 && Math.abs(x) < 6) continue;
      this.tree(x, z, r(0.7, 1.3), rng);
    }
    for (const [x, z] of [
      [-9, -3],
      [-9, 6],
      [8, 6],
      [-7, -10],
      [6, -11],
      [-13, 0],
    ])
      this.palm(x, z, 1 + rng() * 0.3);
    for (let i = 0; i < 140; i++) {
      const x = r(-17, 17),
        z = r(-15, 15);
      if (
        Math.abs(x) < 1.5 ||
        LANDMARKS.some((l) => Math.hypot(l.x - x, l.z - z) < 2) ||
        (x > 8 && x < 14)
      )
        continue;
      if (i % 4 === 0) {
        const m = rock(
          this.scene,
          ['#6c7965', '#8c9276', '#586a56'][i % 3],
          x,
          0.19,
          z,
          r(0.25, 0.65),
        );
        m.rotation.y = rng() * 6;
      } else this.fern(x, z, r(0.4, 0.8), i % 3 === 0 ? '#84a45b' : '#3e7855');
    }
    // Ruin fragments and a timber crossing.
    for (let i = 0; i < 8; i++)
      box(this.scene, '#8d7754', 11.8, 0.24, 4 + i * 0.28, 4.4, 0.16, 0.23);
    for (const z of [3.8, 6.1])
      for (const x of [9.7, 13.9]) cylinder(this.scene, '#69563b', x, 0.65, z, 0.07, 0.09, 1.2);
    for (let i = 0; i < 7; i++) {
      const b = box(
        this.scene,
        '#7b846a',
        -8.3,
        0.25 + (i % 2) * 0.2,
        -7 + i * 0.8,
        1.1,
        0.5 + (i % 2) * 0.4,
        0.7,
      );
      b.rotation.y = i * 0.13;
    }
    this.toucan(-6.5, 1.5, 3.9);
    this.toucan(4.5, 0.4, 5.3);
  }
  /**
   * Fixed landmarks give the compact wilds a readable expedition shape. They
   * deliberately contain no creatures: the RPG snapshot remains the only
   * source of enemy silhouettes and interaction targets.
   */
  private buildWildsLandmarks() {
    this.buildRiverTrail();
    this.buildPirateOutpost();
    this.buildGuardianSanctuary();
  }
  private buildRiverTrail() {
    const g = new THREE.Group();
    this.scene.add(g);
    // A stone-and-rope crossing points from the central trail to the river,
    // then continues north as a deliberately different turquoise route.
    for (let i = 0; i < 9; i++) {
      const x = 7.4 + i * 0.52;
      const plank = box(g, i % 2 ? '#806846' : '#987a4e', x, 0.24, 4.75, 0.46, 0.13, 2.65);
      plank.rotation.y = ((i % 3) - 1) * 0.035;
    }
    for (const z of [3.55, 5.95]) {
      for (const x of [7.25, 11.78]) {
        cylinder(g, '#66553a', x, 0.78, z, 0.1, 0.13, 1.55, 6);
        const lantern = crystal(g, '#8ee5cf', x, 1.47, z, 0.11);
        lantern.rotation.z = Math.PI / 4;
      }
    }
    for (const side of [-1, 1]) {
      const rope = mesh(
        g,
        geometry('river-rope', () => new THREE.TorusGeometry(2.1, 0.027, 5, 16, Math.PI)),
        '#b59a66',
        9.5,
        1.12,
        4.75 + side * 1.12,
      );
      rope.rotation.z = Math.PI / 2;
      rope.rotation.y = (side * Math.PI) / 2;
    }
    for (let i = 0; i < 6; i++) {
      const marker = cylinder(
        g,
        '#697e60',
        8.4 + Math.sin(i * 0.9) * 0.65,
        0.16,
        -1.5 - i * 1.28,
        0.32,
        0.44,
        0.25,
        6,
      );
      marker.rotation.y = i * 0.5;
      crystal(g, i % 2 ? '#65c6b0' : '#a9df9b', marker.position.x, 0.48, marker.position.z, 0.1);
    }
    // A non-interactive discovery beacon makes the far bank worth crossing
    // without creating a second landmark or competing with the RPG targets.
    cylinder(g, '#6f8268', 12.08, 0.55, 4.72, 0.34, 0.47, 1.02, 6);
    crystal(g, '#74dfc2', 12.08, 1.38, 4.72, 0.26);
    ring(g, '#8ee5cf', 0.72, 12.08, 4.72);
    const beacon = new THREE.PointLight('#76e3c4', 1.5, 3.2);
    beacon.position.set(12.08, 1.3, 4.72);
    g.add(beacon);
  }
  private buildPirateOutpost() {
    const g = new THREE.Group();
    g.position.set(7.4, 0, -2.25);
    this.scene.add(g);
    // The lookout is placed behind the Corsair encounter at (4, -2), leaving
    // its approach and hit target clean while giving that fight a clear story.
    box(g, '#735337', 0.25, 0.17, 0.05, 4.8, 0.16, 3.55);
    for (const [x, z, s] of [
      [-1.65, -1.18, 0.8],
      [1.55, -1.04, 0.68],
      [1.36, 1.1, 0.78],
    ]) {
      const crate = box(g, '#815b36', x, 0.48 * s, z, s, 0.96 * s, s);
      box(g, '#b18a50', x, 0.48 * s, z + s * 0.51, s * 1.06, s * 0.09, s * 0.08);
      crate.rotation.y = (x + z) * 0.16;
    }
    cylinder(g, '#5b4632', -0.82, 1.7, 0.45, 0.11, 0.15, 3.4, 7);
    const sail = mesh(
      g,
      geometry('corsair-sail', () => new THREE.PlaneGeometry(1.85, 1.4)),
      '#6d3840',
      -0.14,
      2.15,
      0.45,
    );
    sail.rotation.y = -0.18;
    sail.rotation.z = -0.08;
    box(g, '#d0ad63', -0.12, 2.68, 0.49, 1.5, 0.08, 0.04);
    const skull = ring(g, '#d7c58d', 0.21, -0.16, 0.44);
    skull.position.y = 2.16;
    for (const side of [-1, 1]) {
      const watch = cylinder(g, '#68513a', side * 2.02, 1.02, 0.92, 0.14, 0.18, 2.04, 6);
      crystal(g, '#f0b66a', side * 2.02, 2.08, 0.92, 0.1);
      watch.rotation.z = side * 0.04;
    }
    const brazier = cylinder(g, '#55493c', 1.72, 0.52, -1.37, 0.44, 0.32, 0.72, 7);
    crystal(g, '#ed9b48', 1.72, 1.05, -1.37, 0.2);
    brazier.rotation.y = 0.2;
  }
  private buildGuardianSanctuary() {
    const g = new THREE.Group();
    g.position.set(0, 0, -6.25);
    this.scene.add(g);
    // This is architecture around the actual RPG boss position, never a
    // second decorative guardian. Open sides preserve the combat silhouette.
    for (let i = 0; i < 4; i++)
      cylinder(
        g,
        i % 2 ? '#77866b' : '#8f9371',
        0,
        0.08 + i * 0.09,
        0,
        3.35 - i * 0.5,
        3.35 - i * 0.5,
        0.11,
        8,
      );
    for (const x of [-2.45, 2.45]) {
      cylinder(g, '#78836b', x, 1.25, -0.45, 0.3, 0.43, 2.35, 6);
      cylinder(g, '#aaa77f', x, 2.48, -0.45, 0.46, 0.35, 0.22, 6);
      crystal(g, '#72d9b7', x, 2.93, -0.45, 0.22);
    }
    for (const x of [-1.45, 1.45]) {
      const rune = box(g, '#496c58', x, 0.22, 1.55, 0.56, 0.14, 0.76);
      rune.rotation.y = x * 0.22;
      crystal(g, '#a3efd0', x, 0.42, 1.58, 0.12);
    }
    for (let i = 0; i < 5; i++) {
      const step = box(
        g,
        '#9a9776',
        0,
        0.13 + i * 0.06,
        2.58 + i * 0.28,
        3.45 - i * 0.42,
        0.12,
        0.62,
      );
      step.rotation.y = (i - 2) * 0.018;
    }
    const seal = ring(g, '#76dcb9', 1.72, 0, 0);
    seal.position.y = 0.18;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const glyph = crystal(
        g,
        i % 2 ? '#88dcbf' : '#d6c977',
        Math.cos(a) * 1.66,
        0.35,
        Math.sin(a) * 1.66,
        0.11,
      );
      glyph.rotation.z = a;
    }
  }
  private tree(x: number, z: number, s: number, rng: () => number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    this.scene.add(g);
    cylinder(g, '#665d40', 0, 1.9, 0, 0.22, 0.48, 3.8, 6);
    for (let i = 0; i < 3; i++) {
      const root = box(
        g,
        '#5a593d',
        Math.cos(i * 2.1) * 0.35,
        0.26,
        Math.sin(i * 2.1) * 0.35,
        0.22,
        0.65,
        1.1,
      );
      root.rotation.y = -i * 2.1;
      root.rotation.z = 0.2;
    }
    const colours = ['#315b3e', '#3f7047', '#527e4d', '#688954'];
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26,
        canopy = rock(
          g,
          colours[i % 4],
          Math.cos(a) * 0.9,
          3.1 + rng() * 1.2,
          Math.sin(a) * 0.85,
          1.45 + rng() * 0.5,
        );
      canopy.scale.y *= 0.85;
      canopy.rotation.y = rng() * 6;
    }
  }
  private palm(x: number, z: number, s: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    this.scene.add(g);
    for (let i = 0; i < 7; i++)
      cylinder(
        g,
        i % 2 ? '#8b7850' : '#796c47',
        Math.sin(i * 0.2) * 0.3,
        0.3 + i * 0.5,
        0,
        0.16 - i * 0.01,
        0.21 - i * 0.01,
        0.55,
        6,
      );
    for (let i = 0; i < 8; i++) {
      const leaf = new THREE.Group();
      leaf.position.set(0.3, 3.65, 0);
      leaf.rotation.y = (i * Math.PI) / 4;
      g.add(leaf);
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(-0.36, 1);
      shape.lineTo(-0.28, 1.8);
      shape.lineTo(0, 2.5);
      shape.lineTo(0.28, 1.8);
      shape.lineTo(0.36, 1);
      shape.closePath();
      const lm = mesh(
        leaf,
        geometry('palmleaf', () => new THREE.ShapeGeometry(shape)),
        i % 2 ? '#609451' : '#3e7c4e',
      );
      lm.material = mat(i % 2 ? '#609451' : '#3e7c4e');
      (lm.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      lm.rotation.x = -1.08;
      lm.rotation.y = 0.1;
    }
    for (let i = 0; i < 3; i++)
      rock(g, '#76603d', 0.3 + Math.cos(i * 2) * 0.22, 3.5, Math.sin(i * 2) * 0.2, 0.18);
  }
  private fern(x: number, z: number, size: number, color: string) {
    const g = new THREE.Group();
    g.position.set(x, 0.02, z);
    g.scale.setScalar(size);
    this.scene.add(g);
    for (let i = 0; i < 5; i++) {
      const l = mesh(
        g,
        geometry('fern', () => new THREE.ConeGeometry(0.15, 1.2, 3)),
        color,
        Math.cos(i * 1.26) * 0.22,
        0.32,
        Math.sin(i * 1.26) * 0.22,
      );
      l.rotation.z = Math.cos(i * 1.26) * -0.7;
      l.rotation.x = Math.sin(i * 1.26) * 0.7;
    }
  }
  private buildTemple() {
    const g = new THREE.Group();
    g.position.set(0, 0, -10);
    this.scene.add(g);
    for (let i = 0; i < 5; i++)
      box(
        g,
        i % 2 ? '#a19e7d' : '#919679',
        0,
        0.12 + i * 0.21,
        0.8 - i * 0.25,
        8.8 - i * 0.9,
        0.25,
        6.4 - i * 0.6,
      );
    for (const x of [-3, 3]) {
      box(g, '#a6a181', x, 1.15, -1.5, 1.1, 0.4, 1.2);
      for (let i = 0; i < 4; i++) {
        const b = box(g, i % 2 ? '#95977b' : '#a4a184', x, 1.6 + i * 0.72, -1.5, 0.82, 0.65, 0.9);
        b.rotation.y = (i % 2) * 0.025;
      }
      box(g, '#b1aa88', x, 4.05, -1.5, 1.3, 0.35, 1.35);
      box(g, '#617351', x + 0.03, 4.27, -1.5, 1.4, 0.12, 1.42);
      for (let i = 0; i < 4; i++)
        box(g, '#416446', x - 0.38, 2.6 + i * 0.38, -1.03, 0.12, 0.5, 0.08);
    }
    box(g, '#a4a083', 0, 4.35, -1.5, 7.4, 0.48, 1.55);
    box(g, '#7e8a67', 0, 4.65, -1.5, 7.8, 0.16, 1.7);
    for (let i = -3; i <= 3; i++) box(g, '#7e8869', i * 0.8, 4.38, -0.7, 0.28, 0.2, 0.035);
    const gem = crystal(g, '#62d8c2', 0, 4.39, -0.67, 0.19);
    gem.rotation.z = Math.PI / 4;
    for (const x of [-3.5, 3.5]) {
      cylinder(g, '#6e795d', x, 1.25, 2.1, 0.4, 0.6, 0.5, 4);
      crystal(g, '#66d6bb', x, 1.8, 2.1, 0.28);
    }
    const portal = mesh(g, new THREE.PlaneGeometry(3.5, 3.1), '#233e35', 0, 2.6, -1.8);
    portal.material = new THREE.MeshStandardMaterial({
      color: '#133b33',
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 5; i++) rock(g, '#657853', -4.8 + i * 2.3, 0.4, -3.6, 0.8);
  }
  private buildLandmarks() {
    for (const l of LANDMARKS) {
      const g = new THREE.Group();
      g.position.set(l.x, l.kind === 'boss' ? 1.08 : 0, l.z);
      this.scene.add(g);
      this.markers.set(l.id, g);
      g.userData.landmark = l.id;
      if (l.kind === 'boss') continue;
      ring(g, l.kind === 'cache' ? '#d5bd73' : '#68c9a7', 1.05, 0, 0);
      if (l.kind === 'cache') {
        box(g, '#6d4e32', 0, 0.35, 0, 1.15, 0.6, 0.75);
        box(g, '#a18548', 0, 0.7, 0, 1.2, 0.15, 0.8);
        for (const x of [-0.4, 0.4]) box(g, '#c4a867', x, 0.43, 0.39, 0.09, 0.55, 0.035);
        box(g, '#ead18b', 0, 0.42, 0.42, 0.16, 0.2, 0.06);
      } else {
        cylinder(g, '#8e9275', 0, 0.18, 0, 0.78, 0.92, 0.36, 6);
        cylinder(g, '#a4a384', 0, 0.58, 0, 0.47, 0.6, 0.58, 5);
        box(g, '#b5ae88', 0, 0.97, 0, 1.1, 0.2, 0.95);
        const c = crystal(
          g,
          l.id === 'ember' ? '#edbd6b' : l.id === 'root' ? '#a9d875' : '#70dbc7',
          0,
          1.6,
          0,
          0.43,
        );
        c.userData.landmark = l.id;
        c.userData.originalMaterial = c.material;
        this.relics.push(c);
        for (let i = 0; i < 4; i++) {
          const m = box(
            g,
            '#45614d',
            Math.cos((i * Math.PI) / 2) * 0.48,
            0.56,
            Math.sin((i * Math.PI) / 2) * 0.48,
            0.12,
            0.23,
            0.1,
          );
          m.rotation.y = (-i * Math.PI) / 2;
        }
      }
      const light = new THREE.PointLight(l.kind === 'cache' ? '#f3d89a' : '#70efca', 2, 3);
      light.position.y = 1.4;
      g.add(light);
    }
  }
  private buildCamp() {
    const g = new THREE.Group();
    g.position.set(-3.2, 0, 9);
    this.scene.add(g);
    const tent = mesh(g, new THREE.ConeGeometry(1.6, 2.1, 4, 1, true), '#a18453', 0, 1.05, 0);
    tent.rotation.y = Math.PI / 4;
    tent.scale.z = 1.2;
    const door = mesh(g, new THREE.ConeGeometry(0.7, 1.45, 3), '#463f2d', 0, 0.73, 1.22);
    door.scale.z = 0.08;
    const pole = box(g, '#594f35', 0, 1, 1.33, 0.07, 2, 0.07);
    pole.rotation.z = 0.02;
    for (let i = 0; i < 8; i++)
      rock(
        this.scene,
        '#899076',
        1.8 + Math.cos((i * Math.PI) / 4) * 0.55,
        0.15,
        9 + Math.sin((i * Math.PI) / 4) * 0.55,
        0.22,
      );
    for (let i = 0; i < 3; i++) {
      const flame = mesh(
        this.scene,
        new THREE.ConeGeometry(0.19, 0.7, 5),
        i % 2 ? '#edbf6d' : '#e99445',
        1.8 + (i - 1) * 0.13,
        0.46,
        9,
        true,
      );
      this.fire.push(flame);
    }
    const light = new THREE.PointLight('#ffb04c', 4, 5);
    light.position.set(1.8, 1, 9);
    this.scene.add(light);
    box(this.scene, '#786348', 2.8, 0.22, 10, 1.7, 0.38, 0.5);
  }
  private buildVillage() {
    const g = this.villageScene;
    box(g, '#38483b', 0, -0.7, 0, 25, 1.3, 23);
    box(g, '#6d7556', 0, -0.04, 0, 25, 0.14, 23);
    cylinder(g, '#a79b79', 0, 0.06, 1, 4.9, 4.9, 0.09, 12);
    cylinder(g, '#877f62', 0, 0.12, 1, 3.7, 3.7, 0.06, 12);
    for (let i = 0; i < 14; i++)
      box(g, i % 2 ? '#a8a17f' : '#979777', 0, 0.08, 6 - i * 0.8, 1.9, 0.12, 0.7);
    // Warm lanterns, steep tiled roofs, timber frames and shop props establish a refuge.
    const house = (x: number, z: number, color: string, shop: 'forge' | 'maps' | 'inn') => {
      const h = new THREE.Group();
      h.position.set(x, 0, z);
      g.add(h);
      box(h, '#a99b79', 0, 1.25, 0, 3.5, 2.5, 2.5);
      for (const px of [-1.68, 0, 1.68]) box(h, '#554839', px, 1.35, 1.28, 0.14, 2.7, 0.13);
      for (const py of [0.18, 2.35]) box(h, '#5f4b36', 0, py, 1.31, 3.7, 0.16, 0.16);
      const roof = cylinder(h, color, 0, 3.1, 0, 0, 2.8, 1.7, 4);
      roof.rotation.y = Math.PI / 4;
      roof.scale.z = 0.84;
      for (const side of [-1, 1]) {
        const edge = box(h, '#594b37', side * 0.95, 2.99, 1.68, 0.11, 2.7, 0.11);
        edge.rotation.z = side * 0.88;
      }
      box(h, '#433c2c', 0, 0.91, 1.31, 0.76, 1.74, 0.08);
      box(h, '#c2a570', 0, 1.78, 1.36, 1, 0.09, 0.08);
      for (const px of [-1.05, 1.05]) {
        box(h, '#463e2c', px, 1.37, 1.33, 0.6, 0.7, 0.05);
        box(h, '#e3b767', px, 1.4, 1.37, 0.46, 0.53, 0.035).material = mat('#c79346', 1, true);
        box(h, '#66533a', px, 1.4, 1.4, 0.045, 0.6, 0.035);
      }
      if (shop === 'forge') {
        box(h, '#686c5c', 1.7, 2.9, -0.5, 0.65, 3.8, 0.65);
        box(h, '#606861', -1.1, 0.44, 2.2, 0.55, 0.8, 0.6);
        box(h, '#a0a69b', -1.1, 0.86, 2.2, 1.1, 0.22, 0.6);
        const anvil = box(h, '#9a9d8b', -0.47, 0.84, 2.2, 0.44, 0.15, 0.32);
        anvil.rotation.z = 0.1;
        cylinder(h, '#65563f', 1.2, 0.37, 2, 0.45, 0.43, 0.72, 8);
        for (let i = 0; i < 3; i++) box(h, '#b5b6a5', 1.05 + i * 0.13, 1, 2, 0.05, 0.9, 0.05);
      } else if (shop === 'maps') {
        box(h, '#725e3e', 0, 0.63, 2.2, 2.3, 0.13, 0.9);
        for (const px of [-0.9, 0.9]) box(h, '#584c34', px, 0.31, 2.2, 0.12, 0.6, 0.65);
        const map = box(h, '#dcc997', -0.25, 0.71, 2.2, 1.05, 0.025, 0.58);
        map.rotation.y = 0.15;
        crystal(h, '#86ddc5', 0.74, 1.0, 2.18, 0.21);
      } else {
        for (const px of [-1.8, 1.8]) cylinder(h, '#826442', px, 0.46, 2.1, 0.34, 0.4, 0.8, 8);
        box(h, '#355c50', 0.85, 1.1, 2.15, 0.85, 0.14, 0.85);
      }
    };
    house(-6, 0, '#4c6a62', 'forge');
    house(6, -1, '#785644', 'maps');
    house(-5.5, -6, '#616f47', 'inn');
    // Layered vegetation and workshop clutter frame readable walking lanes.
    for (const [x, z] of [
      [-10, -5],
      [-9, 4],
      [-8, 8],
      [10, 5],
      [10, -6],
      [-8, -10],
      [6, -10],
    ]) {
      cylinder(g, '#635d40', x, 1.5, z, 0.17, 0.36, 3, 6);
      for (let i = 0; i < 4; i++) {
        const crown = orb(
          g,
          i % 2 ? '#3d6a49' : '#537c4d',
          x + Math.cos(i * 1.7) * 0.64,
          2.9 + (i % 2) * 0.5,
          z + Math.sin(i * 1.7) * 0.7,
          1.35,
          1.05,
          1.25,
        );
        crown.rotation.y = i;
      }
      for (let i = 0; i < 3; i++)
        orb(
          g,
          '#799055',
          x + Math.cos(i * 2) * 0.8,
          0.27,
          z + Math.sin(i * 2) * 0.8,
          0.43,
          0.35,
          0.4,
        );
    }
    for (const [x, z] of [
      [-4, 4.1],
      [5, 3.3],
      [-7, -3.2],
      [7, -4.6],
    ]) {
      box(g, '#7b6544', x, 0.36, z, 0.75, 0.7, 0.75);
      for (const px of [-0.29, 0.29]) box(g, '#b39460', x + px, 0.36, z + 0.385, 0.06, 0.66, 0.03);
      box(g, '#b39460', x, 0.64, z + 0.385, 0.71, 0.06, 0.03);
      cylinder(g, '#8a6c46', x + 0.7, 0.34, z, 0.29, 0.33, 0.66, 8);
      cylinder(g, '#5a5544', x + 0.7, 0.53, z, 0.297, 0.297, 0.06, 8);
      cylinder(g, '#5a5544', x + 0.7, 0.15, z, 0.297, 0.297, 0.06, 8);
    }
    for (let i = 0; i < 20; i++) {
      const angle = (i * Math.PI) / 10;
      const tile = box(
        g,
        i % 2 ? '#aaa382' : '#938b6a',
        Math.cos(angle) * 4.3,
        0.13,
        1 + Math.sin(angle) * 4.3,
        0.54,
        0.06,
        0.42,
      );
      tile.rotation.y = -angle;
    }
    box(g, '#72573b', 6, 0.4, 5, 3, 0.22, 1.3);
    for (const x of [4.65, 7.35]) cylinder(g, '#665439', x, 1.56, 5, 0.055, 0.07, 3.1, 6);
    const awning = box(g, '#b67a48', 6, 3.02, 5, 3.4, 0.09, 1.8);
    awning.rotation.x = 0.13;
    for (let i = 0; i < 7; i++)
      orb(g, i % 2 ? '#b89954' : '#779855', 5 + i * 0.3, 0.61, 5, 0.15, 0.18, 0.15);
    // Palisade gate and pennants frame the single obvious expedition exit.
    this.villageGate.position.set(0, 0, -7);
    g.add(this.villageGate);
    const gate = this.villageGate;
    for (const x of [-2.1, 2.1]) {
      box(gate, '#666e56', x, 1.5, 0, 0.68, 3, 1);
      box(gate, '#afa080', x, 3.1, 0, 0.88, 0.24, 1.16);
      cylinder(gate, '#635b39', x, 3.95, 0, 0.035, 0.04, 1.5, 5);
      box(gate, '#b89a52', x + 0.26, 4.25, 0, 0.55, 0.58, 0.05);
    }
    box(gate, '#786e51', 0, 2.95, 0, 4.7, 0.28, 0.6);
    const portal = ring(gate, '#9bf0c4', 1.45, 0, 0);
    portal.userData.interactive = true;
    const portalGem = crystal(gate, '#8ef2cc', 0, 2.96, 0.36, 0.25);
    portalGem.userData.interactive = true;
    const clickVolume = box(gate, '#79cfae', 0, 1.2, 0, 3.4, 2.4, 0.5);
    clickVolume.material = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    clickVolume.userData.interactive = true;
    for (const side of [-1, 1])
      for (let i = 0; i < 8; i++) {
        const x = side * (3 + i * 1.1);
        cylinder(g, '#746a4b', x, 0.94, -7.5, 0.11, 0.16, 1.9, 5);
        box(g, '#746a4b', x, 0.65, -7.5, 1.14, 0.13, 0.1);
      }
    for (const [x, z] of [
      [-3, 3],
      [3, 3],
      [-3, -4],
      [3, -4],
    ]) {
      cylinder(g, '#66573c', x, 1.1, z, 0.075, 0.1, 2.2, 6);
      box(g, '#c39e56', x, 2.15, z, 0.38, 0.53, 0.38).material = mat('#dea54d', 1, true);
      const roof = cylinder(g, '#5a5039', x, 2.49, z, 0, 0.35, 0.28, 4);
      roof.rotation.y = Math.PI / 4;
    }
    // A shallow fountain keeps the centre inviting and leaves the walking route clear.
    cylinder(g, '#7d876e', 3, 0.25, 0.2, 0.9, 1.05, 0.5, 9);
    cylinder(g, '#70ada0', 3, 0.52, 0.2, 0.73, 0.73, 0.08, 9);
    crystal(g, '#c0e3c1', 3, 1.12, 0.2, 0.4);
    for (const [x, z, id, c] of [
      [-4, 2, '12', 'warden'],
      [4, 1, '7', 'ranger'],
      [-4, -4, '28', 'arcanist'],
    ] as const) {
      const npc = buildExplorer({
        name: 'Keeper',
        skin: 1,
        hair: 0,
        outfit: 0,
        avatarId: id,
        classId: c,
      });
      npc.position.set(x, 0, z);
      npc.rotation.y = 0.35;
      npc.scale.setScalar(0.95);
      g.add(npc);
    }
    const rng = random(991);
    for (let i = 0; i < 20; i++) {
      const x = (rng() - 0.5) * 24,
        z = 9 + rng() * 2;
      rock(g, '#5c7553', x, 0.15, z, 0.25 + rng() * 0.3);
    }
  }
  private buildEnemy(enemy: RpgWorldSnapshot['enemies'][number]) {
    const g = new THREE.Group();
    g.userData.enemy = enemy.id;
    g.position.set(enemy.x, 0, enemy.z);
    const beast = /beast|boar|wolf|cat|panther|beetle|spider/.test(enemy.kind);
    if (beast) {
      const colour = /beetle|spider/.test(enemy.kind) ? '#465744' : '#655242';
      orb(g, colour, 0, 0.55, 0, 0.61, 0.44, 0.8);
      orb(g, colour, 0, 0.56, 0.69, 0.4, 0.34, 0.37);
      orb(g, '#8b7960', 0, 0.43, 0.96, 0.27, 0.15, 0.19);
      for (const x of [-0.38, 0.38])
        for (const z of [-0.42, 0.43]) cylinder(g, '#443c32', x, 0.21, z, 0.11, 0.1, 0.39, 5);
      for (const x of [-0.27, 0.27]) {
        cylinder(g, colour, x, 0.94, 0.63, 0, 0.13, 0.28, 3);
        orb(g, '#f2ca6a', x * 0.7, 0.65, 0.973, 0.045, 0.048, 0.028, true);
        const tusk = cylinder(g, '#d7cbaa', x, 0.44, 0.9, 0, 0.065, 0.34, 5);
        tusk.rotation.x = 0.5;
      }
      for (let i = 0; i < 4; i++)
        cylinder(g, '#3c4032', 0, 0.99, -0.45 + i * 0.22, 0, 0.13, 0.27, 3);
    } else if (/pirate|raider|scout/.test(enemy.kind)) {
      const pirate = buildExplorer({
        name: 'Raider',
        skin: 2,
        hair: 0,
        outfit: 2,
        avatarId: '12',
        classId: 'warden',
      });
      pirate.scale.setScalar(0.98);
      g.add(pirate);
      cylinder(g, '#963f37', 0, 2.06, 0, 0.41, 0.41, 0.13, 8);
    } else if (enemy.kind === 'guardian') {
      // The RPG guardian is deliberately a full boss silhouette, rather than a
      // small version of the old decorative landmark.
      rock(g, '#455f55', 0, 1.18, 0, 1.05);
      box(g, '#526c5d', 0, 2.25, 0, 1.5, 1.35, 0.86);
      rock(g, '#72896e', 0, 3.35, 0.06, 0.9);
      for (const side of [-1, 1]) {
        box(g, '#4b6256', side * 1.05, 2.15, 0, 0.45, 1.5, 0.58);
        rock(g, '#536f5e', side * 1.07, 0.62, 0, 0.45);
        const horn = crystal(g, '#8ff0bc', side * 0.48, 4.23, 0, 0.4);
        horn.rotation.z = side * -0.42;
      }
      for (const x of [-0.28, 0.28]) orb(g, '#c5ffcf', x, 3.42, 0.73, 0.1, 0.075, 0.035, true);
      crystal(g, '#79e4bc', 0, 2.25, 0.5, 0.29);
      ring(g, '#8bd8a5', 1.22, 0, 0);
    } else {
      orb(g, '#586c64', 0, 0.7, 0, 0.53, 0.63, 0.4);
      orb(g, '#88aa83', 0, 1.37, 0, 0.41, 0.35, 0.35);
      for (const x of [-0.18, 0.18]) orb(g, '#bdf99a', x, 1.44, 0.31, 0.064, 0.045, 0.025, true);
      for (const x of [-0.56, 0.56]) crystal(g, '#98e6a4', x, 0.8, 0, 0.27);
      crystal(g, '#aaf1c9', 0, 0.74, 0.41, 0.18);
    }
    ring(g, '#c26947', 0.8, 0, 0);
    const bar = new THREE.Group();
    bar.position.y = enemy.kind === 'guardian' ? 4.85 : 2.6;
    bar.name = 'health';
    bar.quaternion.copy(this.camera.quaternion);
    g.add(bar);
    box(bar, '#2f322c', 0, 0, 0, 1.25, 0.12, 0.04);
    const fill = box(bar, '#c87251', 0, 0, 0.03, 1.17, 0.07, 0.03);
    fill.name = 'fill';
    this.wildsScene.add(g);
    this.enemyMeshes.set(enemy.id, g);
    return g;
  }
  updateRpg(snapshot: RpgWorldSnapshot) {
    const changedZone = this.rpg?.zone !== snapshot.zone;
    this.rpg = snapshot;
    this.guardian.visible = false;
    this.wildsScene.visible = snapshot.zone === 'wilds';
    this.villageScene.visible = snapshot.zone === 'village';
    if (changedZone) {
      this.target = null;
      this.pendingEnemy = null;
      this.pendingZone = false;
      this.pendingInteraction = null;
      this.player.position.set(0, 0, snapshot.zone === 'village' ? 4 : 7);
      this.player.rotation.y = Math.PI;
      this.nearby = null;
      this.options.onNearby(null);
      this.resize();
    }
    const key = JSON.stringify([
      this.profile,
      snapshot.avatarId,
      snapshot.classId,
      snapshot.equipment,
      snapshot.inventory,
    ]);
    if (key !== this.appearanceKey) {
      this.appearanceKey = key;
      const old = this.player;
      this.player = buildExplorer({ ...this.profile, ...snapshot });
      this.player.position.copy(old.position);
      this.player.rotation.copy(old.rotation);
      old.removeFromParent();
      this.scene.add(this.player);
      ring(this.player, '#eedb99', 0.62, 0, 0);
    }
    const alive = new Set(snapshot.enemies.filter((e) => e.hp > 0).map((e) => e.id));
    for (const [id, g] of this.enemyMeshes)
      if (!alive.has(id)) {
        if (g.visible) this.impact(g.position.x, g.position.z, '#e7c37b', true);
        g.removeFromParent();
        this.enemyMeshes.delete(id);
      }
    for (const enemy of snapshot.enemies) {
      if (enemy.hp <= 0) continue;
      const g = this.enemyMeshes.get(enemy.id) ?? this.buildEnemy(enemy);
      g.userData.hp = enemy.hp;
      g.position.set(enemy.x, 0, enemy.z);
      const fill = g.getObjectByName('fill');
      if (fill) {
        fill.scale.x = enemy.hp / enemy.maxHp;
        fill.position.x = -(1 - enemy.hp / enemy.maxHp) * 0.585;
      }
    }
  }
  approachEnemy(id: string) {
    const enemy = this.rpg?.enemies.find((e) => e.id === id && e.hp > 0);
    if (!enemy || this.rpg?.zone !== 'wilds') return;
    this.pendingInteraction = null;
    this.pendingZone = false;
    this.pendingEnemy = id;
    this.target = new THREE.Vector3(enemy.x, 0, enemy.z + 1.35);
  }
  attackEnemy(id: string, action: 'strike' | 'power' | 'ritual' = 'strike') {
    const enemy = this.rpg?.enemies.find((e) => e.id === id);
    if (!enemy) return;
    this.attackStarted = this.elapsed;
    this.attackAction = action;
    this.player.rotation.y = Math.atan2(
      enemy.x - this.player.position.x,
      enemy.z - this.player.position.z,
    );
    if (this.motion) return;
    const from = this.player.position.clone();
    if (action === 'strike') this.strikeEffect(from, enemy);
    else if (action === 'power') this.powerEffect(from, enemy);
    else this.ritualEffect(enemy);
  }
  telegraphEnemy(id: string) {
    const enemy = this.rpg?.enemies.find((candidate) => candidate.id === id && candidate.hp > 0);
    if (!enemy || this.motion || !this.enemyMeshes.get(id)?.visible) return;
    const g = new THREE.Group();
    g.position.set(enemy.x, 0.08, enemy.z);
    g.userData = { start: this.elapsed, effect: 'telegraph' };
    const warning = ring(g, '#e86658', 1.08, 0, 0);
    warning.userData.warning = true;
    for (let i = 0; i < 3; i++) {
      const angle = i * ((Math.PI * 2) / 3);
      const shard = crystal(
        g,
        '#ffb16f',
        Math.cos(angle) * 0.86,
        0.2,
        Math.sin(angle) * 0.86,
        0.13,
      );
      shard.userData.angle = angle;
    }
    this.scene.add(g);
    this.impacts.push(g);
  }
  celebrateLoot(x = this.player.position.x, z = this.player.position.z) {
    this.impact(x, z, '#e2bf66', true);
  }
  private impact(x: number, z: number, color: string, loot: boolean) {
    const g = new THREE.Group();
    g.position.set(x, 0.6, z);
    g.userData.start = this.elapsed;
    g.userData.loot = loot;
    for (let i = 0; i < (loot ? 12 : 7); i++) {
      const m = crystal(g, color, 0, 0, 0, loot ? 0.1 : 0.07);
      m.userData.angle = i * 2.4;
    }
    this.scene.add(g);
    this.impacts.push(g);
  }
  private strikeEffect(from: THREE.Vector3, enemy: RpgWorldSnapshot['enemies'][number]) {
    const ranger = this.rpg?.classId === 'ranger';
    const g = new THREE.Group();
    g.userData = {
      start: this.elapsed,
      effect: ranger ? 'arrow' : 'swing',
      from: from.clone().add(new THREE.Vector3(0, ranger ? 1.12 : 0, 0)),
      target: new THREE.Vector3(enemy.x, 0.92, enemy.z),
    };
    if (ranger) {
      const shaft = cylinder(g, '#f2d69a', 0, 0, 0, 0.025, 0.025, 0.82, 5);
      shaft.rotation.x = Math.PI / 2;
      const head = crystal(g, '#d8fff0', 0, 0, 0.45, 0.09);
      head.rotation.x = Math.PI / 2;
      g.position.copy(g.userData.from);
      g.lookAt(enemy.x, 0.92, enemy.z);
    } else {
      const arc = mesh(
        g,
        geometry('strike-arc', () => new THREE.TorusGeometry(0.95, 0.065, 4, 18, Math.PI * 0.9)),
        '#f5d78d',
        0,
        1.15,
        0,
        true,
      );
      arc.rotation.y = Math.PI / 2;
      g.position.copy(from);
      g.rotation.y = this.player.rotation.y;
    }
    this.scene.add(g);
    this.impacts.push(g);
  }
  private powerEffect(from: THREE.Vector3, enemy: RpgWorldSnapshot['enemies'][number]) {
    const g = new THREE.Group();
    g.userData = {
      start: this.elapsed,
      effect: 'power',
      from: from.clone().add(new THREE.Vector3(0, 1.15, 0)),
      target: new THREE.Vector3(enemy.x, 1.15, enemy.z),
    };
    const core = orb(g, '#70edda', 0, 0, 0, 0.22, 0.22, 0.22, true);
    core.userData.core = true;
    for (let i = 0; i < 6; i++) {
      const shard = crystal(g, i % 2 ? '#b5fff0' : '#5ec8ee', 0, 0, 0, 0.11);
      shard.userData.angle = i * ((Math.PI * 2) / 6);
    }
    g.position.copy(g.userData.from);
    this.scene.add(g);
    this.impacts.push(g);
  }
  private ritualEffect(enemy: RpgWorldSnapshot['enemies'][number]) {
    const g = new THREE.Group();
    g.position.set(enemy.x, 0.08, enemy.z);
    g.userData = { start: this.elapsed, effect: 'ritual' };
    const outer = ring(g, '#c791ff', 1.65, 0, 0);
    outer.userData.outer = true;
    const inner = ring(g, '#76f2cf', 0.88, 0, 0);
    inner.userData.inner = true;
    const pillar = cylinder(g, '#9b78d0', 0, 1.5, 0, 0.24, 0.38, 2.9, 6);
    pillar.material = mat('#9b78d0', 1, true);
    pillar.userData.pillar = true;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rune = crystal(
        g,
        i % 2 ? '#e6bdff' : '#8dffd1',
        Math.cos(a) * 1.25,
        0.25,
        Math.sin(a) * 1.25,
        0.15,
      );
      rune.userData.angle = a;
    }
    this.scene.add(g);
    this.impacts.push(g);
  }
  private buildGuardian() {
    const g = this.guardian;
    g.userData.landmark = 'guardian';
    this.scene.add(g);
    g.position.copy(this.bossHome);
    for (const x of [-0.5, 0.5]) {
      rock(g, '#586e58', x, 0.38, 0.05, 0.55);
      box(g, '#788465', x, 0.78, 0, 0.6, 0.8, 0.65);
    }
    rock(g, '#809071', 0, 1.7, 0, 1.1);
    for (const side of [-1, 1]) {
      rock(g, '#6d8264', side * 1.04, 2.13, 0, 0.63);
      box(g, '#67795e', side * 1.29, 1.5, 0, 0.55, 0.95, 0.6);
      rock(g, '#7c8b69', side * 1.3, 0.99, 0.12, 0.45);
      const horn = crystal(g, '#89d6a6', side * 0.5, 3.18, 0, 0.39);
      horn.rotation.z = side * -0.35;
    }
    box(g, '#8d9977', 0, 2.65, 0.05, 1.15, 0.78, 0.8);
    for (const x of [-0.27, 0.27])
      box(g, '#b7ffcd', x, 2.75, 0.46, 0.22, 0.095, 0.04).material = mat('#81eaba', 1, true);
    box(g, '#465f48', 0, 2.4, 0.47, 0.5, 0.08, 0.04);
    crystal(g, '#65dfb8', 0, 1.8, 0.81, 0.32);
    for (let i = 0; i < 5; i++) rock(g, '#52784e', -0.7 + i * 0.3, 2.12, -0.3, 0.28);
  }
  private toucan(x: number, y: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    this.scene.add(g);
    rock(g, '#293d37', 0, 0.2, 0, 0.22);
    rock(g, '#263832', 0.05, 0.43, 0, 0.16);
    const beak = mesh(g, new THREE.ConeGeometry(0.105, 0.38, 4), '#dfac56', 0.28, 0.42, 0);
    beak.rotation.z = -Math.PI / 2;
    box(g, '#e6dbaa', 0.13, 0.42, 0.1, 0.04, 0.045, 0.025);
  }
  update(save: Save) {
    this.motion = save.settings.reducedMotion;
    this.profile = save.profile;
    for (const [id, g] of this.markers) {
      g.visible = true;
      g.userData.complete = save.completed.includes(id);
    }
    for (const relic of this.relics) {
      const completed = save.completed.includes(relic.userData.landmark);
      (relic as THREE.Mesh).material = completed
        ? mat('#54c4a1', 1, true)
        : relic.userData.originalMaterial;
      relic.userData.complete = completed;
    }
    // RPG combat supplies the actual guardian. Keep this landmark only for a
    // legacy non-RPG expedition so two bosses never occupy the same clearing.
    this.guardian.visible = !this.rpg && !save.won;
    this.guardian.scale.setScalar(1 - save.guardianStage * 0.05);
    const position = this.player.position.clone(),
      rotation = this.player.rotation.clone();
    this.scene.remove(this.player);
    this.player = buildExplorer({ ...save.profile, ...(this.rpg ?? {}) });
    this.player.position.copy(position);
    this.player.rotation.copy(rotation);
    ring(this.player, '#eedb99', 0.57, 0, 0);
    this.scene.add(this.player);
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    // Pausing suspends a click-to-approach command; it must resume after a ward.
    // Clear held keys so returning from a dialog cannot leave movement stuck on.
    if (paused) this.keys.clear();
  }
  goTo(id: string) {
    const l = LANDMARKS.find((l) => l.id === id);
    if (l) {
      this.target = new THREE.Vector3(l.x, 0, l.z + 1.8);
      this.pendingInteraction = null;
    }
  }
  control(key: string, down: boolean) {
    if (down) this.keys.add(key);
    else this.keys.delete(key);
  }
  celebrate(id: string) {
    const l = LANDMARKS.find((l) => l.id === id);
    if (!l) return;
    if (this.burst) this.scene.remove(this.burst);
    this.burst = new THREE.Group();
    this.burst.position.set(l.x, 1.1, l.z);
    this.burst.userData.start = this.elapsed;
    this.scene.add(this.burst);
    for (let i = 0; i < 18; i++) {
      const c = crystal(
        this.burst,
        i % 2 ? '#e6c87d' : '#80e9c5',
        Math.cos(i) * 0.6,
        0.1,
        Math.sin(i) * 0.6,
        0.12,
      );
      c.userData.angle = i;
    }
  }
  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const half = this.rpg?.zone === 'village' ? 10.3 : aspect > 1.4 ? 11.6 : 14.5;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
  }
  private keydown = (e: KeyboardEvent) => {
    if (this.paused || /INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target as HTMLElement)?.tagName))
      return;
    const key = e.key.toLowerCase();
    if (
      ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)
    ) {
      e.preventDefault();
      if (key === 'e' && !e.repeat) this.options.onInteract();
      else this.keys.add(key);
    }
  };
  private keyup = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private blur = () => {
    this.keys.clear();
    this.target = null;
  };
  /** Keep the compact wilderness bounded while admitting the authored river route. */
  private clampWildsPosition(point: THREE.Vector3) {
    point.x = THREE.MathUtils.clamp(point.x, -9, 12.7);
    point.z = THREE.MathUtils.clamp(point.z, -7.4, 11);
    if (point.x <= 8) return point;
    const bridge = { minX: 8, maxX: 12.3, minZ: 3.25, maxZ: 6.25 };
    const bank = { minX: 10.55, maxX: 12.7, minZ: 1.7, maxZ: 7.6 };
    const inside = (area: typeof bridge) =>
      point.x >= area.minX && point.x <= area.maxX && point.z >= area.minZ && point.z <= area.maxZ;
    if (inside(bridge) || inside(bank)) return point;
    const options = [
      new THREE.Vector2(8, point.z),
      new THREE.Vector2(
        THREE.MathUtils.clamp(point.x, bridge.minX, bridge.maxX),
        THREE.MathUtils.clamp(point.z, bridge.minZ, bridge.maxZ),
      ),
      new THREE.Vector2(
        THREE.MathUtils.clamp(point.x, bank.minX, bank.maxX),
        THREE.MathUtils.clamp(point.z, bank.minZ, bank.maxZ),
      ),
    ];
    const closest = options.reduce((best, candidate) =>
      candidate.distanceToSquared(new THREE.Vector2(point.x, point.z)) <
      best.distanceToSquared(new THREE.Vector2(point.x, point.z))
        ? candidate
        : best,
    );
    point.set(closest.x, point.y, closest.y);
    return point;
  }
  private pointer = (e: PointerEvent) => {
    if (this.paused) return;
    this.renderer.domElement.focus({ preventScroll: true });
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    const enemyHit = ray.intersectObjects(
      [...this.enemyMeshes.values()].filter((g) => this.wildsScene.visible && g.visible),
      true,
    )[0];
    if (enemyHit) {
      let node: THREE.Object3D | null = enemyHit.object;
      while (node && !node.userData.enemy) node = node.parent;
      if (node) {
        this.approachEnemy(node.userData.enemy as string);
        return;
      }
    }
    if (this.villageScene.visible && ray.intersectObject(this.villageGate, true).length) {
      this.target = new THREE.Vector3(0, 0, -5.7);
      this.pendingZone = true;
      return;
    }
    this.pendingZone = false;
    this.pendingEnemy = null;
    const objects = this.wildsScene.visible
      ? [...this.markers.values(), this.guardian].filter((g) => g.visible)
      : [];
    const hit = ray.intersectObjects(objects, true).find((h) => {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        if (!o.visible) return false;
        o = o.parent;
      }
      return true;
    });
    if (hit) {
      let o: THREE.Object3D | null = hit.object;
      while (o && !o.userData.landmark) o = o.parent;
      if (o) {
        const l = LANDMARKS.find((l) => l.id === o!.userData.landmark)!;
        this.target = new THREE.Vector3(l.x, 0, Math.min(11, l.z + 1.8));
        this.pendingInteraction = l.id;
        return;
      }
    }
    this.pendingInteraction = null;
    const point = new THREE.Vector3();
    if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point)) {
      if (this.rpg?.zone === 'village') {
        point.x = THREE.MathUtils.clamp(point.x, -9, 8);
        point.z = THREE.MathUtils.clamp(point.z, -6, 8);
      } else this.clampWildsPosition(point);
      this.target = point;
    }
  };
  private animate = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min((now - (this.last || now)) / 1000, 0.05);
    this.last = now;
    this.elapsed += dt;
    let moving = false;
    if (!this.paused && !document.hidden) {
      const x =
        (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) -
        (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);
      const z =
        (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0) -
        (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0);
      const direction = new THREE.Vector3(x * 0.78 + z * 0.63, 0, z * 0.78 - x * 0.63);
      if (x || z) {
        this.target = null;
        this.pendingInteraction = null;
        this.pendingEnemy = null;
        this.pendingZone = false;
      }
      if (this.target && direction.lengthSq() === 0) {
        direction.copy(this.target).sub(this.player.position);
        direction.y = 0;
        if (direction.length() < 0.12) {
          this.target = null;
          direction.set(0, 0, 0);
        }
      }
      if (direction.lengthSq() > 0) {
        direction.normalize();
        const p = this.player.position.clone().addScaledVector(direction, dt * 5.4);
        if (this.rpg?.zone === 'village') {
          p.x = THREE.MathUtils.clamp(p.x, -9, 8);
          p.z = THREE.MathUtils.clamp(p.z, -6, 8);
        } else this.clampWildsPosition(p);
        p.y = p.z < -6.8 && Math.abs(p.x) < 4 ? Math.min(1.08, (-p.z - 6.8) * 1.8) : 0;
        if (this.rpg?.zone === 'village') {
          const blocked = (x: number, z: number) =>
            [
              [-6, 0, 2, 1.5],
              [-5.5, -6, 2, 1.5],
              [6, -1, 2, 1.5],
              [3, 0.2, 1.05, 1.05],
              [6, 5, 1.7, 0.85],
            ].some(([cx, cz, rx, rz]) => Math.abs(x - cx) < rx && Math.abs(z - cz) < rz);
          if (blocked(p.x, p.z)) {
            if (!blocked(p.x, this.player.position.z)) p.z = this.player.position.z;
            else if (!blocked(this.player.position.x, p.z)) p.x = this.player.position.x;
            else p.copy(this.player.position);
          }
        }
        this.player.position.copy(p);
        this.player.rotation.y = Math.atan2(direction.x, direction.z);
        moving = true;
      }
      const nearest = LANDMARKS.map((l) => ({
        id: l.id,
        d: Math.hypot(this.player.position.x - l.x, this.player.position.z - l.z),
      })).sort((a, b) => a.d - b.d)[0];
      const id = this.wildsScene.visible && nearest.d < 2.8 ? nearest.id : null;
      if (id !== this.nearby) {
        this.nearby = id;
        this.options.onNearby(id);
      }
      if (this.pendingEnemy) {
        const enemy = this.rpg?.enemies.find((e) => e.id === this.pendingEnemy && e.hp > 0);
        if (!enemy) {
          this.pendingEnemy = null;
          this.target = null;
        } else if (
          Math.hypot(this.player.position.x - enemy.x, this.player.position.z - enemy.z) < 2.25
        ) {
          const enemyId = enemy.id;
          this.pendingEnemy = null;
          this.target = null;
          this.options.onEnemyInteract?.(enemyId);
        }
      }
      if (this.pendingZone && this.player.position.z < -5.3) {
        this.pendingZone = false;
        this.target = null;
        this.options.onZoneInteract?.('wilds');
      }
      if (this.pendingInteraction && id === this.pendingInteraction) {
        const interaction = this.pendingInteraction;
        this.pendingInteraction = null;
        this.target = null;
        this.options.onTargetInteract(interaction);
      }
    }
    if (!this.motion) {
      const stride = moving ? Math.sin(this.elapsed * 12) * 0.45 : 0;
      this.player.userData.leftLeg.rotation.x = stride;
      this.player.userData.rightLeg.rotation.x = -stride;
      this.player.userData.leftArm.rotation.x = -stride * 0.7;
      this.player.userData.rightArm.rotation.x = stride * 0.7;
      this.player.userData.weapon.rotation.z = 0;
      const attackAge = this.elapsed - this.attackStarted;
      if (attackAge < 0.38) {
        if (this.attackAction === 'ritual') {
          this.player.userData.rightArm.rotation.x = -0.9;
          this.player.userData.leftArm.rotation.x = -0.75;
          this.player.userData.weapon.rotation.z = Math.sin((attackAge / 0.38) * Math.PI) * 0.28;
        } else {
          this.player.userData.rightArm.rotation.x =
            -Math.sin((attackAge / 0.38) * Math.PI) * (this.attackAction === 'power' ? 1.9 : 1.5);
          this.player.userData.leftArm.rotation.x = -0.3;
        }
      }
      for (const [id, g] of this.enemyMeshes) {
        g.position.y = Math.sin(this.elapsed * 2 + id.length) * 0.035;
        const health = g.getObjectByName('health');
        if (health) health.quaternion.copy(this.camera.quaternion);
      }
      this.relics.forEach((r, i) => {
        r.rotation.y = this.elapsed * 0.7 + i;
        r.position.y = (r.userData.complete ? 1.27 : 1.6) + Math.sin(this.elapsed * 1.8 + i) * 0.1;
      });
      this.guardian.position.y = this.bossHome.y + Math.sin(this.elapsed * 1.2) * 0.045;
      this.fire.forEach((f, i) => {
        f.scale.y = 0.8 + Math.sin(this.elapsed * 9 + i) * 0.2;
      });
      this.particles.rotation.y = Math.sin(this.elapsed * 0.02) * 0.1;
      this.water.forEach((m, i) => {
        if (i % 3 === 0) m.position.y = 0.065 + Math.sin(this.elapsed + i) * 0.009;
      });
    }
    if (this.burst) {
      const age = this.elapsed - this.burst.userData.start;
      this.burst.children.forEach((c) => {
        const a = c.userData.angle;
        c.position.set(
          Math.cos(a) * age * 2,
          Math.sin(age * 1.8) * 1.5 + (a % 3) * 0.2,
          Math.sin(a) * age * 2,
        );
        c.scale.setScalar(Math.max(0, 1 - age / 2));
      });
      if (age > 2 || this.motion) {
        this.scene.remove(this.burst);
        this.burst = null;
      }
    }
    for (const impact of [...this.impacts]) {
      const age = this.elapsed - impact.userData.start;
      const effect = impact.userData.effect as string | undefined;
      if (effect) {
        const life =
          effect === 'ritual' ? 1.45 : effect === 'swing' || effect === 'arrow' ? 0.48 : 0.85;
        if (effect === 'arrow') {
          const t = THREE.MathUtils.smoothstep(age / 0.38, 0, 1);
          impact.position.lerpVectors(impact.userData.from, impact.userData.target, t);
          impact.scale.setScalar(1 - Math.max(0, age - 0.35) * 5);
        } else if (effect === 'swing') {
          const pulse = Math.sin(Math.min(age / life, 1) * Math.PI);
          impact.rotation.y = this.player.rotation.y - 0.75 + (age / life) * 1.5;
          impact.scale.setScalar(0.72 + pulse * 0.45);
          impact.children.forEach((child) => child.scale.setScalar(Math.max(0, pulse)));
        } else if (effect === 'power') {
          const t = THREE.MathUtils.smoothstep(Math.min(age / 0.55, 1), 0, 1);
          impact.position.lerpVectors(impact.userData.from, impact.userData.target, t);
          const burst = Math.max(0, (age - 0.4) / (life - 0.4));
          impact.children.forEach((child) => {
            if (child.userData.core) child.scale.setScalar(0.22 + burst * 1.5);
            else {
              const a = child.userData.angle as number;
              child.position.set(
                Math.cos(a) * burst * 1.25,
                Math.sin(a * 2) * burst * 0.45,
                Math.sin(a) * burst * 1.25,
              );
              child.scale.setScalar(Math.max(0, 1 - burst) * 0.11);
            }
          });
        } else if (effect === 'ritual') {
          const t = age / life;
          impact.children.forEach((child) => {
            if (child.userData.outer) {
              child.rotation.z = t * Math.PI * 3;
              child.scale.setScalar(0.85 + t * 0.45);
            } else if (child.userData.inner) {
              child.rotation.z = -t * Math.PI * 4;
              child.scale.setScalar(1.1 - t * 0.35);
            } else if (child.userData.pillar) {
              child.scale.y = Math.sin(Math.min(t * 1.25, 1) * Math.PI) * 1.15;
            } else {
              const a = child.userData.angle as number;
              child.position.y = 0.25 + Math.sin(t * Math.PI) * 0.72;
              child.position.x = Math.cos(a + t * 2) * 1.25;
              child.position.z = Math.sin(a + t * 2) * 1.25;
            }
          });
        } else {
          const pulse = Math.sin(Math.min(age / life, 1) * Math.PI);
          impact.children.forEach((child) => {
            if (child.userData.warning) child.scale.setScalar(0.85 + pulse * 0.65);
            else {
              const angle = child.userData.angle as number;
              child.position.set(
                Math.cos(angle) * (0.86 + pulse * 0.3),
                0.2 + pulse * 0.28,
                Math.sin(angle) * (0.86 + pulse * 0.3),
              );
              child.scale.setScalar(pulse);
            }
          });
        }
        if (age > life || this.motion) {
          impact.removeFromParent();
          this.impacts = this.impacts.filter((i) => i !== impact);
        }
        continue;
      }
      const life = impact.userData.loot ? 1.3 : 0.55;
      for (const child of impact.children) {
        const angle = child.userData.angle as number;
        child.position.set(
          Math.cos(angle) * age * 1.5,
          Math.sin((age / life) * Math.PI) * 1.2,
          Math.sin(angle) * age * 1.5,
        );
        child.scale.setScalar(Math.max(0, (1 - age / life) * 0.12));
      }
      if (age > life || this.motion) {
        impact.removeFromParent();
        this.impacts = this.impacts.filter((i) => i !== impact);
      }
    }
    this.positionTick += dt;
    if (this.positionTick > 0.12) {
      this.positionTick = 0;
      this.options.onPosition(this.player.position.x, this.player.position.z);
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.animate);
  };
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    window.removeEventListener('blur', this.blur);
    this.renderer.domElement.removeEventListener('pointerdown', this.pointer);
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        geometries.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m));
      }
    });
    geometryCache.forEach((g) => geometries.add(g));
    materialCache.forEach((m) => materials.add(m));
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    geometryCache.clear();
    materialCache.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
