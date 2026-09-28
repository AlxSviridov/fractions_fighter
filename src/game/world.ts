import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Profile, Save } from './state';
import { random } from './math';
import {
  ENEMY_DEFINITIONS,
  GATES,
  INTERACT_RANGE,
  LEVEL_BOUNDS,
  LEVEL_OBJECTS,
  REGIONS,
  RIVER,
  SPAWN,
  findPath,
  isWalkable,
  nearestWalkable,
  objectAvailable,
  objectById,
  openGates,
} from './level';
import type { EnemyKey, GateId, LevelView } from './level';

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
  enemies: Array<{
    id: string;
    key?: string;
    rank?: string;
    x: number;
    z: number;
    hp: number;
    maxHp: number;
    kind: string;
  }>;
  resolved?: string[];
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
  /** A click could not be reached because a gate is still closed. */
  onBlocked?: (message: string) => void;
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
  private gateMeshes = new Map<GateId, THREE.Group>();
  private objectMeshes = new Map<string, THREE.Group>();
  private open = new Set<GateId>();
  private route: THREE.Vector3[] = [];
  private sun: THREE.DirectionalLight;
  private look = new THREE.Vector3(0, 0, -1);
  private snapCamera = true;
  private water: THREE.Mesh[] = [];
  private fire: THREE.Object3D[] = [];
  private resizeObserver: ResizeObserver;
  private options: WorldOptions;
  private disposed = false;
  private particles: THREE.Points;
  private positionTick = 0;
  private burst: THREE.Group | null = null;
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
    const sun = (this.sun = new THREE.DirectionalLight('#ffe2a5', 2.7));
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
    this.scene.add(sun.target);
    const rim = new THREE.DirectionalLight('#9df2d6', 1.6);
    rim.position.set(8, 10, -14);
    this.scene.add(rim);
    this.buildLevelTerrain(save.seed);
    this.batchStaticMeshes();
    // Keep the authored wilds and settlement as independently visible scene layers.
    for (const child of [...this.scene.children]) {
      if (!(child instanceof THREE.Light)) this.wildsScene.add(child);
    }
    this.scene.add(this.wildsScene);
    this.buildGates();
    this.buildObjects();
    this.buildVillage();
    this.villageScene.visible = false;
    this.scene.add(this.villageScene);
    this.batchStaticMeshes(this.villageScene);
    this.player = buildExplorer(save.profile);
    this.player.position.set(SPAWN.x, 0, SPAWN.z);
    this.player.rotation.y = Math.PI;
    this.scene.add(this.player);
    ring(this.player, '#e9d79e', 0.57, 0, 0);
    // Fireflies drift around the camera focus rather than one fixed clearing.
    const points = new Float32Array(120 * 3);
    const rng = random(save.seed + 7);
    for (let i = 0; i < 120; i++) {
      points[i * 3] = (rng() - 0.5) * 38;
      points[i * 3 + 1] = rng() * 7 + 0.5;
      points[i * 3 + 2] = (rng() - 0.5) * 34;
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
    // Batches are also split into spatial chunks so the long trail can be
    // frustum-culled: only the clearings near the camera are drawn.
    const groups = new Map<
      string,
      { material: THREE.Material; geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }
    >();
    const where = new THREE.Vector3();
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
      o.getWorldPosition(where);
      const key = `${o.material.uuid}:${Math.floor(where.x / 16)}:${Math.floor(where.z / 12)}`;
      const group = groups.get(key) ?? {
        material: o.material,
        geometries: [] as THREE.BufferGeometry[],
        meshes: [] as THREE.Mesh[],
      };
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      group.geometries.push(g);
      group.meshes.push(o);
      groups.set(key, group);
    });
    for (const { material, ...group } of groups.values()) {
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
  /**
   * The Emerald Trail (see level.ts and docs/LEVEL_DESIGN.md). Static scenery
   * is built here and later merged by material; gates, objects and enemies
   * are dynamic and built separately so they can react to progress.
   */
  private buildLevelTerrain(seed: number) {
    const rng = random(seed),
      r = (min: number, max: number) => min + rng() * (max - min);
    const b = LEVEL_BOUNDS;
    const cx = (b.minX + b.maxX) / 2,
      cz = (b.minZ + b.maxZ) / 2;
    const w = b.maxX - b.minX + 14,
      d = b.maxZ - b.minZ + 14;
    const ground = mesh(this.scene, new THREE.PlaneGeometry(260, 260), '#263b31', 0, -3, cz);
    ground.rotation.x = -Math.PI / 2;
    box(this.scene, '#2d4234', cx, -1.6, cz, w, 3, d);
    box(this.scene, '#3e5a43', cx, -0.14, cz, w - 0.2, 0.3, d - 0.2);
    // Region floors are lighter clearings cut into the darker forest floor.
    for (const region of REGIONS)
      for (const rect of region.rects) {
        box(
          this.scene,
          region.ground,
          (rect.minX + rect.maxX) / 2,
          -0.02,
          (rect.minZ + rect.maxZ) / 2,
          rect.maxX - rect.minX + 1.2,
          0.1,
          rect.maxZ - rect.minZ + 1.2,
        );
        const patches = Math.round(((rect.maxX - rect.minX) * (rect.maxZ - rect.minZ)) / 14);
        for (let i = 0; i < patches; i++) {
          const p = cylinder(
            this.scene,
            ['#647750', '#61724c', '#566c48', '#6c7c53', '#72805a'][i % 5],
            r(rect.minX, rect.maxX),
            0.04,
            r(rect.minZ, rect.maxZ),
            r(0.5, 1.6),
            r(0.5, 1.6),
            0.02,
            7,
          );
          p.rotation.y = r(0, 6);
        }
      }
    for (const gate of GATES)
      box(
        this.scene,
        '#6d6a50',
        (gate.rect.minX + gate.rect.maxX) / 2,
        -0.03,
        (gate.rect.minZ + gate.rect.maxZ) / 2,
        gate.rect.maxX - gate.rect.minX + 0.6,
        0.1,
        gate.rect.maxZ - gate.rect.minZ,
      );
    // River: an animated band crossed only by the rope bridge.
    const riverZ = (RIVER.minZ + RIVER.maxZ) / 2,
      riverDepth = RIVER.maxZ - RIVER.minZ;
    box(this.scene, '#23413c', cx, -0.18, riverZ, w, 0.2, riverDepth + 0.6);
    for (let i = 0; i < 16; i++) {
      const x = b.minX - 6 + i * ((w + 2) / 15);
      const water = cylinder(
        this.scene,
        i % 2 ? '#368f84' : '#3e9e92',
        x,
        0.02,
        riverZ + Math.sin(i * 0.8) * 0.3,
        2.6,
        2.6,
        0.1,
        9,
      );
      water.scale.z = riverDepth / 5.2;
      this.water.push(water);
      if (i % 2 === 0) {
        const foam = box(
          this.scene,
          '#a7d2b3',
          x,
          0.09,
          riverZ + r(-1.5, 1.5),
          r(0.5, 1.4),
          0.015,
          0.05,
        );
        this.water.push(foam);
      }
      for (const side of [-1, 1])
        rock(
          this.scene,
          ['#818774', '#93957c'][i % 2],
          x + r(-0.8, 0.8),
          0.1,
          riverZ + side * (riverDepth / 2 + 0.1),
          r(0.3, 0.6),
        );
    }
    // Stepping-stone trails join the beats of the level.
    const path = (points: Array<[number, number]>) => {
      for (let p = 0; p < points.length - 1; p++) {
        const [ax, az] = points[p],
          [bx, bz] = points[p + 1];
        const len = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t <= len; t += 0.78) {
          const x = ax + ((bx - ax) * t) / len,
            z = az + ((bz - az) * t) / len;
          if (z < RIVER.maxZ + 0.4 && z > RIVER.minZ - 0.4) continue;
          const stone = cylinder(
            this.scene,
            ['#afaa84', '#a7a681', '#b9b28a'][Math.floor(r(0, 3))],
            x + r(-0.15, 0.15),
            0.06,
            z + r(-0.15, 0.15),
            r(0.34, 0.5),
            0.48,
            0.07,
            5,
          );
          stone.rotation.y = r(0, 6);
        }
      }
    };
    path([
      [0, 14],
      [0.5, 6],
      [0, 1],
      [0, -7.5],
    ]);
    path([
      [0, -13.5],
      [0, -20],
      [0, -25],
      [0, -32.5],
      [0, -34],
      [0, -40.5],
      [0, -42],
    ]);
    path([
      [0, -3],
      [-12.5, -4],
    ]);
    path([
      [0.5, -5],
      [4, -6],
    ]);
    path([
      [2, -28.5],
      [13, -28.5],
    ]);
    // Dense canopy fills everything that is not walkable, so the level reads
    // as clearings joined by trails rather than a flat board.
    const open = new Set(GATES.map((g) => g.id));
    const clearOf = (x: number, z: number, margin: number) => {
      for (const [dx, dz] of [
        [0, 0],
        [margin, 0],
        [-margin, 0],
        [0, margin],
        [0, -margin],
        [margin * 0.7, margin * 0.7],
        [-margin * 0.7, margin * 0.7],
        [margin * 0.7, -margin * 0.7],
        [-margin * 0.7, -margin * 0.7],
      ])
        if (isWalkable(x + dx, z + dz, open)) return false;
      return true;
    };
    for (let z = b.minZ - 6; z <= b.maxZ + 5; z += 2.3)
      for (let x = b.minX - 6; x <= b.maxX + 6; x += 2.3) {
        const px = x + r(-0.8, 0.8),
          pz = z + r(-0.8, 0.8);
        if (pz < RIVER.maxZ + 0.6 && pz > RIVER.minZ - 0.6) continue;
        if (px < -7.5 && px > -12 && pz > 4 && pz < 18) continue; // waterfall cliff
        if (!clearOf(px, pz, 1.6)) continue;
        // The camera looks from the south-east; tall trees there would hide
        // the hero, so that edge gets low undergrowth instead.
        const hides = [1.2, 2.2, 3.2, 4.2].some((k) =>
          isWalkable(px - k * 0.6, pz - k * 0.8, open),
        );
        if (hides) {
          if (rng() < 0.5) this.fern(px, pz, r(0.9, 1.3), '#3e7855');
          else rock(this.scene, '#56664f', px, 0.3, pz, r(0.5, 0.9));
        } else if (rng() < 0.18) this.palm(px, pz, r(0.9, 1.25));
        else this.tree(px, pz, r(0.75, 1.3), rng);
      }
    // Undergrowth along the clearing edges; never on objects, enemies or trails.
    const blocked = [
      ...LEVEL_OBJECTS.map((o) => [o.x, o.z]),
      ...ENEMY_DEFINITIONS.map((e) => [e.x, e.z]),
    ];
    for (const region of REGIONS)
      for (const rect of region.rects) {
        const count = Math.round(((rect.maxX - rect.minX) * (rect.maxZ - rect.minZ)) / 9);
        for (let i = 0; i < count; i++) {
          const edge = rng() < 0.75;
          const x = edge
            ? rng() < 0.5
              ? r(rect.minX, rect.minX + 1.4)
              : r(rect.maxX - 1.4, rect.maxX)
            : r(rect.minX, rect.maxX);
          const z = r(rect.minZ, rect.maxZ);
          if (Math.abs(x) < 1.6 || blocked.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 1.8))
            continue;
          if (i % 4 === 0) {
            const m = rock(
              this.scene,
              ['#6c7965', '#8c9276', '#586a56'][i % 3],
              x,
              0.17,
              z,
              r(0.2, 0.5),
            );
            m.rotation.y = rng() * 6;
          } else this.fern(x, z, r(0.4, 0.8), i % 3 === 0 ? '#84a45b' : '#3e7855');
        }
      }
    this.buildWaterfall();
    this.buildCamp(-4.8, 13.2);
    this.buildHollowSet();
    this.buildStockade();
    this.buildPirateOutpost(6.2, -26.6);
    this.buildCove();
    this.buildAntechamber();
    this.buildGuardianSanctuary(0, -46);
    this.buildTemple(0, -49.5);
    this.toucan(-6.2, 1.5, 7.2);
    this.toucan(5.8, 0.4, -12.4);
    this.toucan(-8.4, 1.1, -22.5);
  }
  private buildWaterfall() {
    // West of the landing so the cliff frames the start instead of hiding it.
    const g = new THREE.Group();
    g.position.set(-9.6, 0, 11.5);
    this.scene.add(g);
    for (let i = 0; i < 7; i++) {
      const cliff = rock(
        g,
        i % 2 ? '#5d6b5a' : '#6f7b66',
        -0.6,
        1.6 + (i % 3) * 0.5,
        -6 + i * 2,
        1.8,
      );
      cliff.scale.y = 2;
    }
    for (let i = 0; i < 4; i++) {
      const fall = box(g, i % 2 ? '#8fd3cc' : '#b4e6de', 0.9, 2.3, -1.5 + i, 0.12, 4.6, 0.9);
      this.water.push(fall);
    }
    const pool = cylinder(g, '#3e9e92', 1.9, 0.03, 0, 2.4, 2.4, 0.08, 10);
    pool.scale.x = 0.6;
    this.water.push(pool);
    for (let i = 0; i < 6; i++)
      rock(g, '#8c9276', 2.4 + Math.cos(i) * 1.2, 0.12, Math.sin(i) * 2.2, 0.3);
  }
  private buildCamp(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    this.scene.add(g);
    const tent = mesh(g, new THREE.ConeGeometry(1.4, 1.9, 4, 1, true), '#a18453', 0, 0.95, 0);
    tent.rotation.y = Math.PI / 4;
    tent.scale.z = 1.2;
    const door = mesh(g, new THREE.ConeGeometry(0.6, 1.3, 3), '#463f2d', 0, 0.66, 1.05);
    door.scale.z = 0.08;
    for (let i = 0; i < 8; i++)
      rock(
        g,
        '#899076',
        2.3 + Math.cos((i * Math.PI) / 4) * 0.5,
        0.13,
        0.4 + Math.sin((i * Math.PI) / 4) * 0.5,
        0.2,
      );
    for (let i = 0; i < 3; i++) {
      const flame = mesh(
        g,
        new THREE.ConeGeometry(0.17, 0.6, 5),
        i % 2 ? '#edbf6d' : '#e99445',
        2.3 + (i - 1) * 0.12,
        0.4,
        0.4,
        true,
      );
      this.fire.push(flame);
    }
    const light = new THREE.PointLight('#ffb04c', 3.5, 5);
    light.position.set(2.3, 1, 0.4);
    g.add(light);
    box(g, '#786348', 2.8, 0.2, 1.6, 1.5, 0.34, 0.45);
  }
  private buildHollowSet() {
    // Boar den: churned earth and a ring of broken stones.
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      rock(
        this.scene,
        '#6b604a',
        -7 + Math.cos(a) * 1.9,
        0.18,
        -4 + Math.sin(a) * 1.9,
        0.3 + (i % 3) * 0.1,
      );
    }
    cylinder(this.scene, '#5b4b36', -7, 0.03, -4, 1.4, 1.4, 0.03, 9);
    // Fallen logs frame the clearing.
    for (const [x, z, a] of [
      [-9.5, 0.8, 0.3],
      [5, 1.2, -0.4],
      [-4.5, -7.3, 0.1],
    ]) {
      const log = cylinder(this.scene, '#6a5236', x, 0.3, z, 0.3, 0.34, 3.2, 7);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = a;
    }
    // Bridge-head posts on both banks.
    for (const z of [-7.6, -13.4])
      for (const x of [-1.6, 1.6]) {
        cylinder(this.scene, '#66553a', x, 0.8, z, 0.12, 0.15, 1.6, 6);
        crystal(this.scene, '#8ee5cf', x, 1.72, z, 0.1);
      }
    // A hint of the grotto: a dark cave mouth to the west.
    for (let i = 0; i < 6; i++)
      rock(
        this.scene,
        i % 2 ? '#4f5b4d' : '#5d6858',
        -15.8,
        0.6 + (i % 3) * 0.7,
        -6.3 + i * 1.1,
        1.1,
      );
    box(this.scene, '#1b241f', -15.6, 0.9, -4, 0.2, 1.8, 2.2);
  }
  private buildStockade() {
    // Sharpened palisade around the yard with openings for the gate, the
    // barricade and the cove path. Openings are exactly the walkable links.
    const post = (x: number, z: number, i: number) => {
      cylinder(
        this.scene,
        i % 2 ? '#6d5334' : '#7c5f3b',
        x,
        1.1,
        z,
        0.2,
        0.24,
        2.2 + (i % 3) * 0.2,
        6,
      );
      cylinder(this.scene, '#8a6c45', x, 2.35 + (i % 3) * 0.1, z, 0, 0.2, 0.4, 6);
    };
    let i = 0;
    for (let x = -9.6; x <= 9.6; x += 0.46) {
      if (Math.abs(x) > 2.3) post(x, -24.1, i++);
      if (Math.abs(x) > 2.3) post(x, -33.4, i++);
    }
    for (let z = -24.1; z >= -33.4; z -= 0.46) {
      post(-9.6, z, i++);
      if (z > -25.6 || z < -31.4) post(9.6, z, i++);
    }
    for (const x of [-2.5, 2.5]) {
      cylinder(this.scene, '#5b4632', x, 1.8, -24.1, 0.3, 0.34, 3.6, 7);
      crystal(this.scene, '#f0b66a', x, 3.75, -24.1, 0.13);
    }
    // Watchtower behind the lookout.
    for (const [x, z] of [
      [-8.3, -26.2],
      [-7.1, -26.2],
      [-8.3, -25.2],
      [-7.1, -25.2],
    ])
      cylinder(this.scene, '#5f4a31', x, 1.7, z, 0.1, 0.12, 3.4, 5);
    box(this.scene, '#7a5a37', -7.7, 3.45, -25.7, 1.7, 0.16, 1.5);
    box(this.scene, '#963f37', -7.7, 4.1, -25.7, 1.8, 0.08, 1.6);
    // Captain's red sail tent.
    const tent = mesh(
      this.scene,
      new THREE.ConeGeometry(1.6, 2.4, 4, 1, true),
      '#8e3b39',
      4.8,
      1.2,
      -32,
    );
    tent.rotation.y = Math.PI / 4;
    for (let k = 0; k < 5; k++)
      box(this.scene, '#815b36', -3 + k * 0.9, 0.35, -32.6, 0.7, 0.7, 0.7).rotation.y = k * 0.3;
  }
  private buildCove() {
    for (let i = 0; i < 5; i++) {
      const pool = cylinder(
        this.scene,
        i % 2 ? '#368f84' : '#3e9e92',
        10.6 + i * 1.2,
        0.03,
        -30.3 + (i % 2) * 0.5,
        0.8,
        0.8,
        0.06,
        8,
      );
      this.water.push(pool);
    }
    for (let i = 0; i < 10; i++)
      rock(
        this.scene,
        i % 2 ? '#8c9276' : '#b0a88a',
        9 + i * 0.7,
        0.15,
        -25.8 - (i % 3) * 0.2,
        0.25 + (i % 3) * 0.1,
      );
  }
  private buildAntechamber() {
    for (const x of [-7.4, 7.4])
      for (let k = 0; k < 4; k++) {
        const z = -34.5 - k * 2;
        cylinder(
          this.scene,
          k % 2 ? '#78836b' : '#8f9371',
          x,
          1.4,
          z,
          0.35,
          0.45,
          2.8 - (k % 2) * 0.9,
          6,
        );
        if (k % 2 === 0) crystal(this.scene, '#72d9b7', x, 3, z, 0.18);
      }
    for (let k = 0; k < 6; k++) {
      const block = box(
        this.scene,
        '#9a9776',
        -6 + k * 2.4,
        0.2,
        -40.9,
        1.6,
        0.4 + (k % 2) * 0.5,
        0.8,
      );
      block.rotation.y = k * 0.1;
    }
    for (const x of [-2.6, 2.6]) {
      // Kept low: a tall portal would hide the boss arena from the camera.
      cylinder(this.scene, '#78836b', x, 1.4, -41.2, 0.45, 0.55, 2.8, 6);
      box(this.scene, '#aaa77f', x, 2.9, -41.2, 1.1, 0.3, 1.1);
    }
    box(this.scene, '#a4a083', 0, 3.2, -41.2, 6.4, 0.45, 1.1);
  }
  private buildPirateOutpost(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    this.scene.add(g);
    // Supply dump inside the stockade: crates, a sail mast and a brazier.
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
  private buildGuardianSanctuary(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
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
  private buildTemple(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
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
  /** Gates react to progress, so they stay outside the static mesh batches. */
  private buildGates() {
    const add = (id: GateId) => {
      const g = new THREE.Group();
      g.userData.gate = id;
      this.wildsScene.add(g);
      this.gateMeshes.set(id, g);
      return g;
    };
    // Rope bridge: the deck hinges at the far bank and is raised until the winch turns.
    const bridge = add('bridge');
    bridge.position.set(0, 0.22, -13.3);
    const deck = new THREE.Group();
    deck.name = 'deck';
    bridge.add(deck);
    for (let i = 0; i < 11; i++)
      box(deck, i % 2 ? '#806846' : '#987a4e', 0, 0, 0.3 + i * 0.52, 2.8, 0.12, 0.46).rotation.y =
        ((i % 3) - 1) * 0.03;
    for (const x of [-1.45, 1.45]) box(deck, '#b59a66', x, 0.45, 2.9, 0.05, 0.05, 5.7);
    // Stockade gate: two heavy doors swing inwards.
    const stockade = add('stockade');
    stockade.position.set(0, 0, -24.1);
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.name = side < 0 ? 'left' : 'right';
      hinge.position.x = side * 2.2;
      stockade.add(hinge);
      for (let k = 0; k < 5; k++)
        cylinder(
          hinge,
          k % 2 ? '#6d5334' : '#7c5f3b',
          -side * (0.22 + k * 0.42),
          1.2,
          0,
          0.19,
          0.22,
          2.4,
          6,
        );
      box(hinge, '#b18a50', -side * 1.05, 1.5, 0.2, 2.1, 0.14, 0.08);
      box(hinge, '#b18a50', -side * 1.05, 0.7, 0.2, 2.1, 0.14, 0.08);
    }
    // Barricade: crates, barrels and a red sail; it drops away when Redsail falls.
    const barricade = add('barricade');
    barricade.position.set(0, 0, -33.3);
    for (let k = 0; k < 5; k++) {
      const crate = box(
        barricade,
        '#815b36',
        -1.8 + k * 0.9,
        0.45 + (k % 2) * 0.35,
        0,
        0.8,
        0.8,
        0.8,
      );
      crate.rotation.y = k * 0.4;
    }
    cylinder(barricade, '#6a4a2e', 1.4, 1.3, 0.2, 0.35, 0.35, 0.8, 8);
    mesh(
      barricade,
      geometry('barricade-sail', () => new THREE.PlaneGeometry(4, 1.2)),
      '#963f37',
      0,
      1.7,
      -0.2,
    );
    // Sanctum door: a carved slab with three seal sockets.
    const sanctum = add('sanctum');
    sanctum.position.set(0, 0, -41.2);
    const slab = new THREE.Group();
    slab.name = 'slab';
    sanctum.add(slab);
    box(slab, '#6f7d66', 0, 1.5, 0, 4.4, 3, 0.6);
    for (let k = 0; k < 3; k++) {
      const socket = crystal(slab, '#8ff0bc', -1.2 + k * 1.2, 1.9, 0.35, 0.2);
      socket.name = `socket-${k}`;
    }
  }
  private buildObjects() {
    for (const object of LEVEL_OBJECTS) {
      const g = new THREE.Group();
      g.position.set(object.x, 0, object.z);
      g.userData.levelObject = object.id;
      this.wildsScene.add(g);
      this.objectMeshes.set(object.id, g);
      const accent =
        object.kind === 'chest'
          ? '#e2c071'
          : object.kind === 'lore'
            ? '#d8d2b0'
            : object.kind === 'shrine'
              ? '#7fe0d2'
              : object.kind === 'seal'
                ? object.id === 'seal-west'
                  ? '#8ad0f0'
                  : object.id === 'seal-east'
                    ? '#f0c27a'
                    : '#9ef0b4'
                : '#86e7c5';
      g.userData.accent = accent;
      ring(g, accent, 0.95, 0, 0);
      if (object.kind === 'chest' || object.kind === 'puzzle') {
        box(g, object.kind === 'puzzle' ? '#4f5b4d' : '#6d4e32', 0, 0.33, 0, 1.1, 0.56, 0.72);
        const lid = new THREE.Group();
        lid.name = 'lid';
        lid.position.set(0, 0.62, -0.36);
        g.add(lid);
        box(lid, object.kind === 'puzzle' ? '#65755f' : '#a18548', 0, 0.07, 0.36, 1.16, 0.14, 0.76);
        for (const x of [-0.38, 0.38]) box(g, '#c4a867', x, 0.4, 0.37, 0.08, 0.5, 0.03);
        box(g, '#ead18b', 0, 0.42, 0.39, 0.15, 0.18, 0.05);
        if (object.kind === 'puzzle')
          for (let k = 0; k < 4; k++) crystal(g, '#86e7c5', -0.42 + k * 0.28, 0.72, 0.4, 0.07);
      } else if (object.kind === 'lore') {
        const stone = box(g, '#8e9275', 0, 0.75, 0, 0.7, 1.5, 0.3);
        stone.rotation.y = 0.2;
        box(g, '#c9bd8c', 0.04, 0.95, 0.16, 0.42, 0.5, 0.03).rotation.y = 0.2;
      } else if (object.kind === 'shrine') {
        cylinder(g, '#8e9275', 0, 0.3, 0, 0.7, 0.85, 0.6, 7);
        const basin = cylinder(g, '#6fd0c6', 0, 0.62, 0, 0.55, 0.55, 0.05, 10);
        basin.name = 'basin';
        crystal(g, '#7fe0d2', 0, 1.3, 0, 0.22);
      } else if (object.kind === 'mechanism' && object.id === 'bridge-winch') {
        for (const x of [-0.55, 0.55]) box(g, '#5f4a31', x, 0.6, 0, 0.16, 1.2, 0.3);
        const drum = cylinder(g, '#8a6c45', 0, 0.9, 0, 0.38, 0.38, 0.95, 10);
        drum.rotation.z = Math.PI / 2;
        drum.name = 'drum';
        box(g, '#b59a66', 0.62, 0.9, 0.3, 0.06, 0.06, 0.6);
      } else if (object.kind === 'mechanism') {
        box(g, '#5b4632', 0, 0.8, 0, 0.9, 1.6, 0.3);
        const dial = cylinder(g, '#d0ad63', 0, 1.05, 0.2, 0.3, 0.3, 0.08, 12);
        dial.rotation.x = Math.PI / 2;
        dial.name = 'dial';
      } else {
        cylinder(g, '#78836b', 0, 0.9, 0, 0.35, 0.5, 1.8, 6);
        const gem = crystal(g, accent, 0, 2.15, 0, 0.36);
        gem.name = 'gem';
      }
      // Floating quest marker: shown only while the object is usable.
      const marker = crystal(g, object.task ? '#f0cf74' : '#f4f0d8', 0, 2.9, 0, 0.16);
      marker.name = 'marker';
      marker.material = mat(object.task ? '#f0cf74' : '#f4f0d8', 1, true);
    }
  }
  /** Apply gate/object progress to the scene; animation eases toward these targets. */
  private syncLevel(snapshot: RpgWorldSnapshot) {
    const view: LevelView = {
      resolved: snapshot.resolved ?? [],
      defeated: snapshot.enemies.filter((e) => e.hp === 0).map((e) => e.key as EnemyKey),
    };
    this.open = openGates(view);
    for (const [id, g] of this.gateMeshes) g.userData.open = this.open.has(id);
    for (const object of LEVEL_OBJECTS) {
      const g = this.objectMeshes.get(object.id);
      if (!g) continue;
      const done = view.resolved.includes(object.id);
      const available = !done && objectAvailable(object, view);
      g.userData.done = done;
      g.userData.available = available;
      const marker = g.getObjectByName('marker');
      if (marker) marker.visible = available;
      const gem = g.getObjectByName('gem');
      if (gem) (gem as THREE.Mesh).material = mat(done ? '#56615a' : g.userData.accent, 1, !done);
    }
    const sockets = GATES.find((gate) => gate.id === 'sanctum')!.objects;
    sockets.forEach((id, k) => {
      const socket = this.gateMeshes.get('sanctum')?.getObjectByName(`socket-${k}`);
      if (socket)
        (socket as THREE.Mesh).material = mat(
          view.resolved.includes(id) ? '#3c4a42' : '#8ff0bc',
          1,
          !view.resolved.includes(id),
        );
    });
  }
  /** Ease gates and containers toward their progress state; reduced motion snaps. */
  private animateLevel(dt: number) {
    const k = this.motion ? 1 : 1 - Math.exp(-dt * 3);
    const ease = (from: number, to: number) => from + (to - from) * k;
    for (const [id, g] of this.gateMeshes) {
      const open = !!g.userData.open;
      if (id === 'bridge') {
        const deck = g.getObjectByName('deck')!;
        deck.rotation.x = ease(deck.rotation.x, open ? 0 : -1.25);
      } else if (id === 'stockade') {
        const left = g.getObjectByName('left')!,
          right = g.getObjectByName('right')!;
        left.rotation.y = ease(left.rotation.y, open ? 1.7 : 0);
        right.rotation.y = ease(right.rotation.y, open ? -1.7 : 0);
      } else if (id === 'barricade') {
        g.position.y = ease(g.position.y, open ? -2.6 : 0);
        g.visible = g.position.y > -2.5;
      } else {
        const slab = g.getObjectByName('slab')!;
        slab.position.y = ease(slab.position.y, open ? -4.3 : 0);
      }
    }
    for (const g of this.objectMeshes.values()) {
      const lid = g.getObjectByName('lid');
      if (lid) lid.rotation.x = ease(lid.rotation.x, g.userData.done ? -1.9 : 0);
      const drum = g.getObjectByName('drum');
      if (drum && g.userData.done && !this.motion && drum.userData.spin !== true) {
        drum.userData.spin = true;
        drum.userData.until = this.elapsed + 1.5;
      }
      if (drum?.userData.spin && this.elapsed < drum.userData.until) drum.rotation.x += dt * 9;
      const dial = g.getObjectByName('dial');
      if (dial) dial.rotation.y = ease(dial.rotation.y, g.userData.done ? Math.PI * 1.5 : 0);
    }
  }
  /** Walk a planned route to a point; tell the player why if a gate is in the way. */
  private replanned = false;
  private routeTo(to: { x: number; z: number }, explain = true) {
    if (explain) this.replanned = false;
    const route = findPath({ x: this.player.position.x, z: this.player.position.z }, to, this.open);
    this.route = route.points.map((p) => new THREE.Vector3(p.x, 0, p.z));
    this.target = this.route.shift() ?? null;
    if (explain && route.blockedBy) this.options.onBlocked?.(route.blockedBy.closedHint);
    return route;
  }
  goTo(id: string) {
    const object = objectById(id);
    if (!object || this.rpg?.zone !== 'wilds') return;
    this.pendingEnemy = null;
    this.pendingZone = false;
    this.pendingInteraction = id;
    this.routeTo(nearestWalkable({ x: object.x, z: object.z + 1.1 }, this.open));
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
      const colour =
        enemy.key === 'prowler' ? '#7a6048' : enemy.key === 'stalker' ? '#4d5a3c' : '#655242';
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
    if (enemy.rank === 'elite') {
      // Elites read as bigger threats before the player reads their name.
      g.scale.setScalar(1.28);
      ring(g, '#e0a452', 1.05, 0, 0);
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
    this.wildsScene.visible = snapshot.zone === 'wilds';
    this.villageScene.visible = snapshot.zone === 'village';
    if (changedZone) {
      this.target = null;
      this.pendingEnemy = null;
      this.pendingZone = false;
      this.pendingInteraction = null;
      this.route = [];
      if (snapshot.zone === 'village') this.player.position.set(0, 0, 4);
      else this.player.position.set(SPAWN.x, 0, SPAWN.z);
      this.player.rotation.y = Math.PI;
      this.snapCamera = true;
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
    this.syncLevel(snapshot);
  }
  approachEnemy(id: string) {
    const enemy = this.rpg?.enemies.find((e) => e.id === id && e.hp > 0);
    if (!enemy || this.rpg?.zone !== 'wilds') return;
    this.pendingInteraction = null;
    this.pendingZone = false;
    this.pendingEnemy = id;
    const route = this.routeTo(nearestWalkable({ x: enemy.x, z: enemy.z + 1.35 }, this.open));
    if (!route.reached && route.blockedBy) this.pendingEnemy = null;
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
  control(key: string, down: boolean) {
    if (down) this.keys.add(key);
    else this.keys.delete(key);
  }
  celebrate(id: string) {
    const l = objectById(id);
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
    const tagged = (hit: THREE.Intersection | undefined, key: string) => {
      let node: THREE.Object3D | null = hit?.object ?? null;
      while (node && node.userData[key] === undefined) node = node.parent;
      return node ? (node.userData[key] as string) : null;
    };
    if (this.wildsScene.visible) {
      const enemyId = tagged(
        ray.intersectObjects(
          [...this.enemyMeshes.values()].filter((g) => g.visible),
          true,
        )[0],
        'enemy',
      );
      if (enemyId) {
        this.approachEnemy(enemyId);
        return;
      }
      const objectId = tagged(
        ray.intersectObjects([...this.objectMeshes.values()], true)[0],
        'levelObject',
      );
      if (objectId) {
        this.goTo(objectId);
        return;
      }
      const gateId = tagged(
        ray.intersectObjects(
          [...this.gateMeshes.values()].filter((g) => !g.userData.open),
          true,
        )[0],
        'gate',
      );
      if (gateId) {
        const gate = GATES.find((g) => g.id === gateId)!;
        this.options.onBlocked?.(gate.closedHint);
      }
    }
    if (this.villageScene.visible && ray.intersectObject(this.villageGate, true).length) {
      this.target = new THREE.Vector3(0, 0, -5.7);
      this.route = [];
      this.pendingZone = true;
      return;
    }
    this.pendingZone = false;
    this.pendingEnemy = null;
    this.pendingInteraction = null;
    const point = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point)) return;
    if (this.rpg?.zone === 'village') {
      point.x = THREE.MathUtils.clamp(point.x, -9, 8);
      point.z = THREE.MathUtils.clamp(point.z, -6, 8);
      this.route = [];
      this.target = point;
    } else this.routeTo({ x: point.x, z: point.z });
  };
  private animate = (now: number) => {
    if (this.disposed) return;
    const rawDt = (now - (this.last || now)) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.last = now;
    this.elapsed += dt;
    let moving = false,
      moved = false;
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
      if (x || z) this.route = [];
      if (this.target && direction.lengthSq() === 0) {
        direction.copy(this.target).sub(this.player.position);
        direction.y = 0;
        if (direction.length() < 0.12) {
          this.target = this.route.shift() ?? null;
          direction.set(0, 0, 0);
        }
      }
      if (direction.lengthSq() > 0) {
        direction.normalize();
        // Low frame rates take larger steps; sub-step so no wall or gap is skipped.
        const distance = Math.min(rawDt, 0.1) * 5.4;
        const steps = Math.max(1, Math.ceil(distance / 0.2));
        for (let step = 0; step < steps; step++) {
          const p = this.player.position.clone().addScaledVector(direction, distance / steps);
          const current = this.player.position;
          if (this.rpg?.zone === 'village') {
            p.x = THREE.MathUtils.clamp(p.x, -9, 8);
            p.z = THREE.MathUtils.clamp(p.z, -6, 8);
            const blocked = (x: number, z: number) =>
              [
                [-6, 0, 2, 1.5],
                [-5.5, -6, 2, 1.5],
                [6, -1, 2, 1.5],
                [3, 0.2, 1.05, 1.05],
                [6, 5, 1.7, 0.85],
              ].some(([cx, cz, rx, rz]) => Math.abs(x - cx) < rx && Math.abs(z - cz) < rz);
            if (blocked(p.x, p.z)) {
              if (!blocked(p.x, current.z)) p.z = current.z;
              else if (!blocked(current.x, p.z)) p.x = current.x;
              else p.copy(current);
            }
          } else if (!isWalkable(p.x, p.z, this.open)) {
            // Slide along clearing edges and closed gates rather than sticking.
            if (isWalkable(p.x, current.z, this.open)) p.z = current.z;
            else if (isWalkable(current.x, p.z, this.open)) p.x = current.x;
            else {
              p.copy(current);
              // Re-plan once from here; stop only if the planner cannot help.
              const goal = this.route.at(-1) ?? this.target;
              this.target = null;
              this.route = [];
              if (goal && !this.replanned) {
                this.replanned = true;
                this.routeTo({ x: goal.x, z: goal.z }, false);
              }
              break;
            }
          }
          p.y = 0;
          moved = p.distanceToSquared(current) > 1e-6;
          this.player.position.copy(p);
          if (this.target && this.player.position.distanceTo(this.target) < 0.12) break;
        }
        if (moved) this.player.rotation.y = Math.atan2(direction.x, direction.z);
        moving = moved;
      }
      let id: string | null = null;
      if (this.wildsScene.visible) {
        let best = INTERACT_RANGE;
        for (const [objectId, g] of this.objectMeshes) {
          const d = Math.hypot(
            this.player.position.x - g.position.x,
            this.player.position.z - g.position.z,
          );
          if (d < best) {
            best = d;
            id = objectId;
          }
        }
      }
      if (id !== this.nearby) {
        this.nearby = id;
        this.options.onNearby(id);
      }
      if (this.pendingEnemy) {
        const enemy = this.rpg?.enemies.find((e) => e.id === this.pendingEnemy && e.hp > 0);
        if (!enemy) {
          this.pendingEnemy = null;
          this.target = null;
          this.route = [];
        } else if (
          Math.hypot(this.player.position.x - enemy.x, this.player.position.z - enemy.z) < 2.25
        ) {
          const enemyId = enemy.id;
          this.pendingEnemy = null;
          this.target = null;
          this.route = [];
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
        this.route = [];
        this.options.onTargetInteract(interaction);
      }
    }
    // Follow camera in the wilds; the village keeps its framed establishing shot.
    const focus =
      this.rpg?.zone === 'wilds'
        ? new THREE.Vector3(
            THREE.MathUtils.clamp(
              this.player.position.x,
              LEVEL_BOUNDS.minX + 4,
              LEVEL_BOUNDS.maxX - 4,
            ),
            0,
            THREE.MathUtils.clamp(
              this.player.position.z,
              LEVEL_BOUNDS.minZ + 3,
              LEVEL_BOUNDS.maxZ - 5,
            ),
          )
        : new THREE.Vector3(0, 0, -1);
    if (this.snapCamera || this.motion) this.look.copy(focus);
    else this.look.lerp(focus, 1 - Math.exp(-dt * 5));
    this.snapCamera = false;
    this.camera.position.set(this.look.x + 25, 30, this.look.z + 33);
    this.camera.lookAt(this.look);
    this.sun.position.set(this.look.x - 12, 23, this.look.z + 8);
    this.sun.target.position.copy(this.look);
    this.particles.position.set(this.look.x, 0, this.look.z);
    this.animateLevel(dt);
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
      for (const g of this.objectMeshes.values()) {
        const marker = g.getObjectByName('marker');
        if (marker?.visible) {
          marker.position.y = 2.9 + Math.sin(this.elapsed * 2.4 + g.position.x) * 0.14;
          marker.rotation.y = this.elapsed * 1.6;
        }
        const gem = g.getObjectByName('gem');
        if (gem && !g.userData.done) gem.rotation.y = this.elapsed * 0.8;
      }
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
