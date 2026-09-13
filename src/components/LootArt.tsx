import type { Item } from '../game/rpg';

type LootArtProps = {
  item: Item;
  size?: number;
};

const rarityColour: Record<Item['rarity'], string> = {
  common: '#b9c5ac',
  uncommon: '#8ed19d',
  rare: '#79cbed',
  legendary: '#efbd61',
};

function WeaponArt({ name }: { name: string }) {
  const weapon = name.toLowerCase();
  if (weapon.includes('bow'))
    return (
      <>
        <path
          d="M31 14C66 31 66 69 31 86"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d="M33 16L33 84" fill="none" stroke="#e8d6a8" strokeWidth="2" />
        <path d="M21 77L77 22" fill="none" stroke="#d8c8a0" strokeWidth="3" strokeLinecap="round" />
        <path d="M71 19L85 14L79 28Z" fill="#d7e7df" />
        <path d="M22 78L15 86" stroke="#7c513b" strokeWidth="5" strokeLinecap="round" />
      </>
    );
  if (weapon.includes('staff') || weapon.includes('pattern'))
    return (
      <>
        <path d="M44 87L61 27" stroke="#76503b" strokeWidth="9" strokeLinecap="round" />
        <path d="M46 85L63 25" stroke="#bd8e58" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M61 25L51 14L61 4L72 15L68 26Z"
          fill="currentColor"
          stroke="#e7edcb"
          strokeWidth="2"
        />
        <path d="M61 9L66 16L61 22L56 15Z" fill="#f3f0d0" opacity=".9" />
        <path d="M42 64L56 68" stroke="#d4aa58" strokeWidth="4" />
      </>
    );
  return (
    <>
      <path
        d="M54 11L76 20L58 65L47 65L36 55Z"
        fill="currentColor"
        stroke="#e9eed4"
        strokeWidth="2"
      />
      <path d="M55 17L66 22L54 55" fill="none" stroke="#f3f2d6" strokeWidth="3" opacity=".75" />
      <path d="M35 60L62 72" stroke="#d9af5d" strokeWidth="8" strokeLinecap="round" />
      <path d="M31 58L45 67L27 86L18 80Z" fill="#6f4736" stroke="#d3a55c" strokeWidth="2" />
      <path d="M20 83L28 88" stroke="#d9c3a0" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function ArmourArt() {
  return (
    <>
      <path
        d="M28 19L43 10H57L72 19L80 45L69 84H31L20 45Z"
        fill="#617567"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path d="M37 19H63L68 43L59 53H41L32 43Z" fill="#8c9d82" />
      <path d="M42 11V34H58V11" fill="none" stroke="#d3c28d" strokeWidth="4" />
      <path d="M24 47L38 53L33 77M76 47L62 53L67 77" fill="none" stroke="#bdb78b" strokeWidth="3" />
      <path d="M43 57L50 51L57 57L50 67Z" fill="currentColor" stroke="#e6e6c2" strokeWidth="2" />
      <path d="M31 80H69" stroke="#d3b16b" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function RelicArt({ name }: { name: string }) {
  const compass = name.toLowerCase().includes('compass');
  return (
    <>
      <circle cx="50" cy="50" r="34" fill="#475b54" stroke="currentColor" strokeWidth="5" />
      <circle cx="50" cy="50" r="25" fill="#263b39" stroke="#d8c987" strokeWidth="3" />
      {compass ? (
        <>
          <path d="M58 31L67 42L42 69L33 58Z" fill="currentColor" />
          <path d="M42 69L33 58L58 31L67 42Z" fill="#e5ead0" opacity=".82" />
          <circle cx="50" cy="50" r="5" fill="#d4a650" />
        </>
      ) : (
        <>
          <path
            d="M50 18L68 39L59 73H41L32 39Z"
            fill="currentColor"
            stroke="#dfecd1"
            strokeWidth="2"
          />
          <path d="M50 25L59 41L50 60L41 41Z" fill="#e7c77c" />
          <path d="M25 50H75M50 25V75" stroke="#d5b069" strokeWidth="2" opacity=".8" />
        </>
      )}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".45"
      />
    </>
  );
}

/** Original compact item illustrations for inventory cells; their buttons provide the label. */
export function LootArt({ item, size = 44 }: LootArtProps) {
  return (
    <svg
      aria-hidden="true"
      className={`loot-art loot-art--${item.rarity} loot-art--${item.slot}`}
      focusable="false"
      height={size}
      viewBox="0 0 100 100"
      width={size}
      style={{ color: rarityColour[item.rarity] }}
    >
      <g className="loot-art__shadow">
        {item.slot === 'weapon' ? (
          <WeaponArt name={item.name} />
        ) : item.slot === 'armour' ? (
          <ArmourArt />
        ) : (
          <RelicArt name={item.name} />
        )}
      </g>
    </svg>
  );
}
