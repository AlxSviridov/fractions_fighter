export const HEROES = [
  { id: '7', name: 'The Trail Scout', subtitle: 'A brave heart. An eye for hidden paths.', heritage: 'Braided explorer', colour: '#b99c61' },
  { id: '12', name: 'The Runeseeker', subtitle: 'Every mystery is a new adventure.', heritage: 'Human adventurer', colour: '#b66b46' },
  { id: '28', name: 'The Sun Ranger', subtitle: 'Fast feet and fearless curiosity.', heritage: 'Human pathfinder', colour: '#bbac71' },
  { id: '39', name: 'The Mooncat', subtitle: 'Nine lives. Quite a few ancient secrets.', heritage: 'Feline spellweaver', colour: '#b18dcc' },
  { id: '49', name: 'The Starforged', subtitle: 'An ancient construct with a golden heart.', heritage: 'Awakened golem', colour: '#80bec0' },
  { id: '58', name: 'The Stormkin', subtitle: 'A little thunder. A lot of possibility.', heritage: 'Cloud elemental', colour: '#b9ccdf' },
];
export const portrait = (id: string) => `/assets/avatars/avatar_${HEROES.some(h=>h.id===id)?id:'7'}.png`;
