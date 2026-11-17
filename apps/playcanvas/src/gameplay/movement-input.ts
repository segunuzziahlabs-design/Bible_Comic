import { actionBindings, createActionRouter, heldBindings, type Direction, type PlayerAction } from './action-router';

const stickRadius = 34;
const editable = (target: EventTarget | null) => target instanceof Element && !!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"]');

export function createMovementInput(canvas: HTMLCanvasElement, pad: HTMLElement, allowAim = false) {
  const listeners = new AbortController(), options = { signal: listeners.signal };
  const router = createActionRouter(), down = new Set<string>();
  const virtualReleases = new Set<() => void>();
  let move: { id: number; x: number; y: number } | undefined;
  let look: { id: number; x: number; y: number } | undefined;
  let mouseDown: { id: number; x: number; y: number; moved: boolean } | undefined;
  let lookX = 0, lookY = 0, aimMode = false, fire = false;
  let mouseAim: { x: number; y: number } | undefined;
  const enabled = () => router.read().enabled;

  function setStick(x: number, y: number) {
    router.setAnalog('stick', x, -y);
    pad.style.setProperty('--stick-x', `${x * stickRadius}px`);
    pad.style.setProperty('--stick-y', `${y * stickRadius}px`);
  }
  function release(target: Element, id?: number) { if (id !== undefined && target.hasPointerCapture(id)) target.releasePointerCapture(id); }
  function clear() {
    const moveId = move?.id, lookId = look?.id ?? mouseDown?.id;
    move = look = mouseDown = undefined; down.clear(); lookX = lookY = 0; mouseAim = undefined; fire = false;
    virtualReleases.forEach(cancel => cancel()); setStick(0, 0); router.clear();
    release(pad, moveId); release(canvas, lookId);
  }
  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || editable(event.target)) return;
    const held = heldBindings[event.code], action = actionBindings[event.code];
    if (held) {
      if (!enabled() || (!allowAim && held.startsWith('aim'))) return;
      event.preventDefault();
      if (held.startsWith('aim')) mouseAim = undefined;
      if (!event.repeat) router.setHeld(`key:${event.code}`, held);
    } else if (action && router.has(action)) {
      // Space/Enter on a focused button retain native button activation.
      if (event.code === 'Space' && event.target instanceof Element && event.target.closest('button,a')) return;
      if (!enabled() && action !== 'pause') return;
      event.preventDefault();
      if (!event.repeat && !down.has(event.code)) { down.add(event.code); router.request(action); }
    }
  }, options);
  window.addEventListener('keyup', event => { down.delete(event.code); router.setHeld(`key:${event.code}`); }, options);

  pad.addEventListener('pointerdown', event => {
    if (!enabled() || move || event.button !== 0) return;
    event.preventDefault(); move = { id: event.pointerId, x: event.clientX, y: event.clientY };
    pad.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
  }, options);
  pad.addEventListener('pointermove', event => {
    if (move?.id !== event.pointerId) return;
    const x = event.clientX - move.x, y = event.clientY - move.y, scale = Math.max(stickRadius, Math.hypot(x, y));
    setStick(x / scale, y / scale);
  }, options);
  function endStick(event: PointerEvent) {
    if (move?.id !== event.pointerId) return;
    move = undefined; setStick(0, 0); release(pad, event.pointerId);
  }
  pad.addEventListener('pointerup', endStick, options);
  pad.addEventListener('lostpointercapture', endStick, options);

  function pointMouse(event: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    mouseAim = { x: Math.max(.045, Math.min(.955, (event.clientX - box.left) / box.width)),
      y: Math.max(.06, Math.min(.92, (event.clientY - box.top) / box.height)) };
  }
  canvas.addEventListener('pointerdown', event => {
    if (!enabled() || look || mouseDown || event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    if (aimMode && event.pointerType === 'mouse') {
      pointMouse(event); mouseDown = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    } else look = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  }, options);
  canvas.addEventListener('pointermove', event => {
    if (enabled() && aimMode && event.pointerType === 'mouse') {
      pointMouse(event);
      if (mouseDown && Math.hypot(event.clientX - mouseDown.x, event.clientY - mouseDown.y) > 6) mouseDown.moved = true;
      return;
    }
    if (look?.id !== event.pointerId) return;
    lookX += event.clientX - look.x; lookY += event.clientY - look.y;
    look.x = event.clientX; look.y = event.clientY;
  }, options);
  canvas.addEventListener('pointerup', event => {
    if (mouseDown?.id === event.pointerId) {
      pointMouse(event); const shouldFire = enabled() && !mouseDown.moved; mouseDown = undefined;
      if (shouldFire) { if (router.has('sling')) router.request('sling'); else fire = true; }
    }
    if (look?.id === event.pointerId) look = undefined;
    release(canvas, event.pointerId);
  }, options);
  canvas.addEventListener('lostpointercapture', event => {
    if (look?.id === event.pointerId) look = undefined;
    if (mouseDown?.id === event.pointerId) mouseDown = undefined;
  }, options);
  window.addEventListener('pointercancel', clear, options);
  window.addEventListener('blur', clear, options);
  window.addEventListener('resize', clear, options);
  document.addEventListener('visibilitychange', clear, options);

  function bindDirection(button: HTMLButtonElement, direction: Direction) {
    const pointers = new Set<number>(), source = (id: number) => `direction:${id}:${direction}`;
    const cancel = () => { for (const id of pointers) { pointers.delete(id); router.setHeld(source(id)); release(button, id); } router.setHeld(`button-key:${direction}`); };
    virtualReleases.add(cancel);
    button.addEventListener('pointerdown', event => {
      if (!enabled() || event.button !== 0) return;
      event.preventDefault(); pointers.add(event.pointerId); router.setHeld(source(event.pointerId), direction);
      button.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
    }, options);
    const end = (event: PointerEvent) => { if (!pointers.delete(event.pointerId)) return; router.setHeld(source(event.pointerId)); release(button, event.pointerId); };
    button.addEventListener('pointerup', end, options); button.addEventListener('lostpointercapture', end, options);
    button.addEventListener('keydown', event => { if (event.code !== 'Space' && event.code !== 'Enter') return; event.preventDefault(); event.stopPropagation(); if (!event.repeat) router.setHeld(`button-key:${direction}`, direction); }, options);
    button.addEventListener('keyup', event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); event.stopPropagation(); router.setHeld(`button-key:${direction}`); } }, options);
    button.addEventListener('blur', () => router.setHeld(`button-key:${direction}`), options);
  }
  function bindButton(button: HTMLButtonElement, action: PlayerAction) {
    let pointer: number | undefined, lastActivation = -Infinity, suppressPointerClick = false;
    const usable = () => !button.disabled && !button.hidden && !!button.getClientRects().length;
    const cancel = () => { const id = pointer; pointer = undefined; if (id !== undefined) suppressPointerClick = true; release(button, id); };
    virtualReleases.add(cancel);
    button.dataset.playerAction = action;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointer !== undefined || !usable()) return;
      suppressPointerClick = false; pointer = event.pointerId; button.setPointerCapture(event.pointerId);
    }, options);
    button.addEventListener('pointerup', event => {
      if (pointer !== event.pointerId) return;
      pointer = undefined; release(button, event.pointerId);
      if (!usable() || !button.contains(document.elementFromPoint(event.clientX, event.clientY))) { suppressPointerClick = true; return; }
      lastActivation = performance.now(); router.request(action);
      if (action !== 'pause') canvas.focus({ preventScroll: true });
    }, options);
    button.addEventListener('lostpointercapture', event => { if (pointer === event.pointerId) { pointer = undefined; suppressPointerClick = true; } }, options);
    button.addEventListener('click', event => {
      // Ignore the compatibility click following pointerup, including two-thumb touch.
      if (!usable() || ((event.detail > 0 || (event instanceof PointerEvent && !!event.pointerType)) && (suppressPointerClick || performance.now() - lastActivation < 700))) return;
      router.request(action); if (action !== 'pause') canvas.focus({ preventScroll: true });
    }, options);
  }
  return {
    setEnabled(value: boolean) { if (enabled() === value) return; clear(); router.setEnabled(value); },
    clear, bindDirection, bindButton, bindActions: router.bind, subscribe: router.subscribe, state: router.read,
    refreshActions: router.refresh, can: router.available, hasAction: router.has,
    pointerAim: () => mouseAim,
    setAimMode(value: boolean) { if (aimMode === value) return; aimMode = value; mouseAim = mouseDown = undefined; fire = false; },
    read() {
      const { x, forward, aimX, aimY } = router.read();
      const result = { x, forward, lookX, lookY, aimX, aimY, mouseAim, fire };
      lookX = lookY = 0; fire = false; return result;
    },
    dispose() { clear(); listeners.abort(); },
  };
}

export type MovementInput = ReturnType<typeof createMovementInput>;
