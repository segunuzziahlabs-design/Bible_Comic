export type JumpPhase = 'grounded' | 'takeoff' | 'airborne' | 'landing';
export const standingHeight = 1.66;
export const jumpTuning = { takeoff: .16, landing: .22, gravity: 14, launchSpeed: 4.65 } as const;

/** Absolute feet height, substepped gravity, one physical arc per request. */
export function createJumpMotor() {
  let phase: JumpPhase = 'grounded', time = 0, feet = 0, floor = 0, velocity = 0, cameraLift = 0;
  let started = 0, landed = 0, ceilingHits = 0;
  const active = () => phase !== 'grounded';
  function reset(ground = 0) { phase = 'grounded'; time = 0; floor = feet = ground; velocity = cameraLift = 0; }
  function request(ground: number, ceiling = Infinity) {
    if (active() || ceiling - ground - standingHeight < .08) return false;
    floor = feet = ground; velocity = 0; time = 0; phase = 'takeoff'; started++; return true;
  }
  function step(delta: number, ground: number, ceiling = Infinity) {
    floor = ground;
    const count = Math.max(1, Math.ceil(Math.max(0, delta) / (1 / 120))), dt = Math.max(0, delta) / count;
    for (let i = 0; i < count; i++) {
      time += dt;
      if (phase === 'grounded') feet = ground;
      else if (phase === 'takeoff') {
        feet = ground;
        if (time >= jumpTuning.takeoff) { phase = 'airborne'; time = 0; velocity = jumpTuning.launchSpeed; }
      } else if (phase === 'airborne') {
        feet += velocity * dt - .5 * jumpTuning.gravity * dt * dt; velocity -= jumpTuning.gravity * dt;
        if (feet + standingHeight > ceiling) { feet = Math.max(ground, ceiling - standingHeight - .01); velocity = Math.min(0, velocity); ceilingHits++; }
        if (feet <= ground && velocity <= 0) { feet = ground; velocity = 0; phase = 'landing'; time = 0; landed++; }
      } else {
        feet = ground;
        if (time >= jumpTuning.landing) { phase = 'grounded'; time = 0; }
      }
    }
    cameraLift += (Math.max(0, feet - ground) * .55 - cameraLift) * (1 - Math.exp(-11 * delta));
  }
  function animation() {
    if (phase === 'grounded') return;
    return { clip: phase === 'takeoff' ? 'jump_takeoff' : phase === 'airborne' ? 'jump_air' : 'jump_land',
      progress: Math.min(1, time / (phase === 'takeoff' ? jumpTuning.takeoff : phase === 'landing' ? jumpTuning.landing : 2 * jumpTuning.launchSpeed / jumpTuning.gravity)) };
  }
  return { request, step, reset, active, animation,
    sample: () => ({ phase, time, feet, ground: floor, height: Math.max(0, feet - floor), velocity, cameraLift, started, landed, ceilingHits }),
  };
}
