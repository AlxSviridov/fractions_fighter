import { useEffect, useState } from 'react';
import { Check, Coins, Gem, Heart, Shield, Swords } from 'lucide-react';
import { LootArt } from './LootArt';
import { PACK_HEIGHT, PACK_WIDTH, itemSize } from '../game/inventory';
import type { InventoryDestination } from '../game/inventory';
import { CLASSES, equipmentPreview, statBreakdown } from '../game/rpg';
import type { Item, ItemSlot, RpgState } from '../game/rpg';
import type { Zone } from '../game/rpg';
import { TOPICS } from '../game/math';

type Props = {
  rpg: RpgState;
  heroName: string;
  zone: Zone;
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  onEquip: (item: Item) => void;
  onUnequip: (slot: ItemSlot) => void;
  onMove: (itemId: string, destination: InventoryDestination) => boolean;
};

const slots: ItemSlot[] = ['weapon', 'armour', 'relic'];
const label = (slot: ItemSlot) => slot[0].toUpperCase() + slot.slice(1);

export function InventoryPanel({
  rpg,
  heroName,
  zone,
  selectedItemId,
  onSelectItem,
  onEquip,
  onUnequip,
  onMove,
}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | null>(null);
  const [tab, setTab] = useState<'pack' | 'stash'>('pack');
  const [feedback, setFeedback] = useState('');
  const stats = statBreakdown(rpg);
  const stashIds = new Set(rpg.inventoryLayout.stash);
  const visibleItems = rpg.inventory.filter((item) => zone === 'village' || !stashIds.has(item.id));
  const activeItem =
    visibleItems.find((item) => item.id === selectedItemId) ??
    visibleItems[visibleItems.length - 1];
  const preview = activeItem ? equipmentPreview(rpg, activeItem.id) : null;
  const storedIds = new Set([
    ...Object.keys(rpg.inventoryLayout.pack),
    ...rpg.inventoryLayout.stash,
  ]);
  const activeStored = !!activeItem && storedIds.has(activeItem.id);
  const activeInStash = !!activeItem && stashIds.has(activeItem.id);
  const stashItems = rpg.inventoryLayout.stash
    .map((id) => rpg.inventory.find((item) => item.id === id))
    .filter((item): item is Item => !!item);

  useEffect(() => {
    if (zone !== 'village') {
      setTab('pack');
      if (stashIds.has(selectedItemId ?? '')) onSelectItem(null);
    } else if (stashIds.has(selectedItemId ?? '')) setTab('stash');
  }, [zone, rpg.inventoryLayout.stash, selectedItemId, onSelectItem]);

  const occupiedCells = Object.keys(rpg.inventoryLayout.pack).reduce((total, id) => {
    const item = rpg.inventory.find((candidate) => candidate.id === id);
    const size = item && itemSize(item);
    return total + (size ? size.width * size.height : 0);
  }, 0);

  function selectItem(itemId: string) {
    setSelectedSlot(null);
    onSelectItem(itemId);
    setFeedback('');
  }
  function move(itemId: string, destination: InventoryDestination) {
    if (onMove(itemId, destination)) {
      setFeedback('');
      if (destination.kind === 'stash') setTab('stash');
    } else {
      setFeedback('That item cannot fit there. Choose another space or move an item first.');
    }
  }
  function drop(event: React.DragEvent<HTMLElement>, destination: InventoryDestination) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain');
    if (itemId) move(itemId, destination);
  }
  function beginDrag(event: React.DragEvent<HTMLElement>, itemId: string) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', itemId);
  }
  function placeSelected(x: number, y: number) {
    if (!activeItem || !activeStored) {
      setFeedback('Select an item from your pack or Haven stash before placing it.');
      return;
    }
    move(activeItem.id, { kind: 'pack', x, y });
  }

  return (
    <div className="inventory-panel">
      <p className="world-paused" role="status">
        World paused · Manage your gear safely.
      </p>
      <div className="inventory-stats">
        <span>
          <Swords size={16} />
          {stats.attack.total} Attack
        </span>
        <span>
          <Shield size={16} />
          {stats.defence.total} Defence
        </span>
        <span>
          <Heart size={16} />
          {rpg.hp} / {stats.maxHp} Health
        </span>
        <span>
          <Coins size={16} />
          {rpg.gold} Gold
        </span>
      </div>
      <section className="character-sheet" aria-label="Character statistics">
        <header>
          <div>
            <small>{heroName.toUpperCase()} · CHARACTER</small>
            <h2>
              Level {stats.level} {CLASSES[rpg.classId].name}
            </h2>
          </div>
          <strong>
            {rpg.hp} / {stats.maxHp} health
          </strong>
        </header>
        <div className="sheet-xp" aria-label={`Experience: ${rpg.xp} XP`}>
          <span>XP {rpg.xp}</span>
          <strong>
            {stats.level < 100
              ? `${stats.xpIntoLevel} / ${stats.xpForNextLevel} to level ${stats.level + 1}`
              : 'Maximum level reached'}
          </strong>
          <i style={{ width: `${(stats.xpIntoLevel / 120) * 100}%` }} />
        </div>
        <dl className="stat-breakdown">
          <div>
            <dt>Attack</dt>
            <dd>
              {stats.attack.base} base + {stats.attack.level} level + {stats.attack.equipment}{' '}
              equipment = <strong>{stats.attack.total}</strong>
            </dd>
          </div>
          <div>
            <dt>Defence</dt>
            <dd>
              {stats.defence.base} base + {stats.defence.equipment} equipment ={' '}
              <strong>{stats.defence.total}</strong>
            </dd>
          </div>
        </dl>
      </section>
      <div className="inventory-layout spatial-inventory-layout">
        <section className="equipped-panel" aria-label="Equipped items">
          <h3>Equipped</h3>
          {slots.map((slot) => {
            const item = rpg.inventory.find((candidate) => candidate.id === rpg.equipment[slot]);
            return (
              <button
                key={slot}
                className={`equip-slot ${item ? `rarity-${item.rarity}` : ''} ${selectedSlot === slot ? 'selected' : ''}`}
                aria-pressed={selectedSlot === slot}
                onClick={() => {
                  setSelectedSlot(slot);
                  onSelectItem(item?.id ?? null);
                }}
              >
                {item ? <LootArt item={item} size={38} /> : <Gem size={19} />}
                <span>
                  <small>{slot.toUpperCase()}</small>
                  <strong>{item?.name ?? `Empty ${label(slot)} slot`}</strong>
                </span>
              </button>
            );
          })}
        </section>
        <section className="spatial-storage" aria-label="Backpack and Haven stash">
          <div className="storage-tabs" role="tablist" aria-label="Item storage">
            <button role="tab" aria-selected={tab === 'pack'} onClick={() => setTab('pack')}>
              Backpack <span>{occupiedCells} / 40</span>
            </button>
            {zone === 'village' && (
              <button role="tab" aria-selected={tab === 'stash'} onClick={() => setTab('stash')}>
                Haven stash <span>{stashItems.length}</span>
              </button>
            )}
          </div>
          {tab === 'pack' ? (
            <div className="spatial-pack" role="grid" aria-label="10 by 4 backpack">
              {Array.from({ length: PACK_WIDTH * PACK_HEIGHT }, (_, index) => {
                const x = index % PACK_WIDTH;
                const y = Math.floor(index / PACK_WIDTH);
                return (
                  <button
                    key={`${x}-${y}`}
                    className="pack-cell"
                    role="gridcell"
                    aria-label={`Pack cell ${x + 1}, ${y + 1}`}
                    style={{ gridColumn: x + 1, gridRow: y + 1 }}
                    onClick={() => placeSelected(x, y)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => drop(event, { kind: 'pack', x, y })}
                  />
                );
              })}
              {Object.entries(rpg.inventoryLayout.pack).map(([id, position]) => {
                const item = rpg.inventory.find((candidate) => candidate.id === id);
                if (!item) return null;
                const size = itemSize(item);
                return (
                  <button
                    key={id}
                    draggable
                    className={`spatial-item rarity-${item.rarity} ${activeItem?.id === id ? 'selected' : ''}`}
                    style={{
                      gridColumn: `${position.x + 1} / span ${size.width}`,
                      gridRow: `${position.y + 1} / span ${size.height}`,
                    }}
                    aria-label={`Inspect ${item.name}, ${size.width} by ${size.height}`}
                    onClick={() => selectItem(id)}
                    onDragStart={(event) => beginDrag(event, id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => drop(event, { kind: 'pack', x: position.x, y: position.y })}
                  >
                    <LootArt item={item} size={38} />
                    <small>{item.name}</small>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="stash-list"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(event, { kind: 'stash' })}
            >
              {stashItems.length ? (
                stashItems.map((item) => (
                  <button
                    key={item.id}
                    draggable
                    className={`stash-item rarity-${item.rarity} ${activeItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => selectItem(item.id)}
                    onDragStart={(event) => beginDrag(event, item.id)}
                  >
                    <LootArt item={item} size={34} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {itemSize(item).width} × {itemSize(item).height}
                      </small>
                    </span>
                  </button>
                ))
              ) : (
                <p>Your Haven stash is empty.</p>
              )}
            </div>
          )}
          {feedback && (
            <p className="inventory-feedback" role="status">
              {feedback}
            </p>
          )}
        </section>
        {selectedSlot && !rpg.equipment[selectedSlot] ? (
          <article className="item-detail empty-slot-detail">
            <span>{selectedSlot.toUpperCase()} SLOT</span>
            <h3>Empty {label(selectedSlot)} slot</h3>
            <p>
              Choose a {selectedSlot} from your pack to equip it. An empty slot grants no item
              bonuses.
            </p>
          </article>
        ) : activeItem ? (
          <article className={`item-detail rarity-${activeItem.rarity}`}>
            <span>
              {activeItem.rarity.toUpperCase()} {activeItem.slot.toUpperCase()}
            </span>
            <h3>{activeItem.name}</h3>
            <p>{activeItem.description}</p>
            <div>
              {activeItem.attack > 0 && <strong>+{activeItem.attack} attack</strong>}
              {activeItem.defence > 0 && <strong>+{activeItem.defence} defence</strong>}
              <small>Affinity: {TOPICS[activeItem.topic]}</small>
              {preview && rpg.equipment[activeItem.slot] !== activeItem.id && (
                <small className="upgrade-comparison">
                  Total attack: {preview.current.attack} → {preview.next.attack}
                  <br />
                  Total defence: {preview.current.defence} → {preview.next.defence}
                  {preview.replaced && <em> Replaces {preview.replaced.name}.</em>}
                </small>
              )}
            </div>
            {rpg.equipment[activeItem.slot] === activeItem.id ? (
              <button className="secondary full" onClick={() => onUnequip(activeItem.slot)}>
                Unequip {activeItem.name}
              </button>
            ) : (
              <button className="primary full" onClick={() => onEquip(activeItem)}>
                Equip {activeItem.name}
                <Check size={15} />
              </button>
            )}
            {zone === 'village' && activeStored && !activeInStash && (
              <button
                className="text-button stash-action"
                onClick={() => move(activeItem.id, { kind: 'stash' })}
              >
                Store in Haven stash
              </button>
            )}
          </article>
        ) : (
          <article className="item-detail empty-slot-detail">
            <span>HAVEN STASH</span>
            <h3>Your carried pack is empty</h3>
            <p>Return to Haven to retrieve stored gear from your stash.</p>
          </article>
        )}
      </div>
    </div>
  );
}
