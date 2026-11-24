export type Direction = 'forward' | 'back' | 'left' | 'right';
export type HeldAction = Direction | 'aimUp' | 'aimDown' | 'aimLeft' | 'aimRight';
export type PlayerAction = 'interact' | 'sling' | 'dodge' | 'jump' | 'jumpShot' | 'collectStones' | 'pause';
export type ActionHandler = { run: () => void; available?: () => boolean };
export type ActionHandlers = Partial<Record<PlayerAction, ActionHandler>>;

export const heldBindings: Readonly<Record<string, HeldAction>> = {
  KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyI: 'aimUp', KeyK: 'aimDown', KeyJ: 'aimLeft', KeyL: 'aimRight',
};
export const actionBindings: Readonly<Record<string, PlayerAction>> = {
  KeyE: 'interact', KeyF: 'sling', KeyQ: 'jumpShot', KeyR:'collectStones', ShiftLeft: 'dodge', ShiftRight: 'dodge', Space: 'jump', Escape: 'pause',
};

/** Device-independent state. Each held source owns its own release. */
export function createActionRouter() {
  let enabled = false;
  const held = new Map<string, HeldAction>();
  const analog = new Map<string, { x: number; forward: number }>();
  const handlers: ActionHandlers = {};
  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach(update => update());
  function clear() { held.clear(); analog.clear(); notify(); }
  function read() {
    const actions = new Set(held.values());
    let x = Number(actions.has('right')) - Number(actions.has('left'));
    let forward = Number(actions.has('forward')) - Number(actions.has('back'));
    for (const vector of analog.values()) { x += vector.x; forward += vector.forward; }
    const length = Math.max(1, Math.hypot(x, forward));
    return { enabled, x: x / length, forward: forward / length,
      aimX: Number(actions.has('aimRight')) - Number(actions.has('aimLeft')),
      aimY: Number(actions.has('aimDown')) - Number(actions.has('aimUp')),
      held: actions };
  }
  return {
    read, clear,
    setEnabled(value: boolean) { if (value === enabled) return; enabled = value; clear(); },
    setHeld(source: string, action?: HeldAction) {
      if (enabled && action) { if (held.get(source) === action) return; held.set(source, action); }
      else if (!held.delete(source)) return;
      notify();
    },
    setAnalog(source: string, x: number, forward: number) {
      if (enabled && (x || forward)) analog.set(source, { x, forward }); else analog.delete(source);
      notify();
    },
    bind(added: ActionHandlers) { Object.assign(handlers, added); notify(); },
    refresh: notify,
    available(action: PlayerAction) { const handler = handlers[action]; return !!handler && (enabled || action === 'pause') && handler.available?.() !== false; },
    has(action: PlayerAction) { return !!handlers[action]; },
    request(action: PlayerAction) {
      const handler = handlers[action];
      if (!handler || (!enabled && action !== 'pause') || handler.available?.() === false) return false;
      handler.run(); return true;
    },
    subscribe(update: () => void) { subscribers.add(update); update(); return () => { subscribers.delete(update); }; },
  };
}
