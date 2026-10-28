import { FunctionAnimation } from 'skinview3d';

// Idle animation of the character on the home page: it breathes calmly, looks around
// a little and waves with its right arm every few seconds. All times in seconds.
const BREATH_PERIOD = 3.6;
const WAVE_CYCLE = 9;
const WAVE_START = 2.5;
const WAVE_RAISE = 0.5;
const WAVE_HOLD = 1.8;
const WAVE_LOWER = 0.5;
/** Arm angle while waving: almost straight up, slightly to the side (radians). */
const WAVE_ARM_ANGLE = 2.6;

function easeInOut(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** 0 = arm down, 1 = arm raised; eased in and out, so the arm never jumps. */
function waveAmount(timeInCycle: number): number {
  const t = timeInCycle - WAVE_START;
  if (t < 0) return 0;
  if (t < WAVE_RAISE) return easeInOut(t / WAVE_RAISE);
  if (t < WAVE_RAISE + WAVE_HOLD) return 1;
  if (t < WAVE_RAISE + WAVE_HOLD + WAVE_LOWER) return 1 - easeInOut((t - WAVE_RAISE - WAVE_HOLD) / WAVE_LOWER);
  return 0;
}

export function createIdleAnimation(): FunctionAnimation {
  return new FunctionAnimation((player, time) => {
    const { head, leftArm, rightArm } = player.skin;

    // Breathing: head and shoulders rise and fall by a fraction of a pixel.
    const breath = Math.sin((time / BREATH_PERIOD) * 2 * Math.PI);
    head.position.y = breath * 0.12;
    leftArm.position.y = -2 + breath * 0.1;
    rightArm.position.y = -2 + breath * 0.1;

    // Arms swing slightly away from the body, like skinview3d's IdleAnimation.
    const armSway = Math.cos(time * 2) * 0.03 + Math.PI * 0.02;
    leftArm.rotation.z = armSway;

    // Wave: raise the right arm, swing it from the shoulder, lower it again.
    const timeInCycle = time % WAVE_CYCLE;
    const wave = waveAmount(timeInCycle);
    const swing = Math.sin((timeInCycle - WAVE_START) * 2 * Math.PI * 1.4) * 0.28 * wave;
    rightArm.rotation.z = -(armSway + (WAVE_ARM_ANGLE - armSway) * wave) + swing;

    // The head looks around slowly and tilts a little while waving.
    head.rotation.y = Math.sin(time * 0.37) * 0.08;
    head.rotation.x = breath * 0.02;
    head.rotation.z = -0.06 * wave;

    // Only visible once an account with a cape is signed in.
    player.cape.rotation.x = Math.PI * 0.06 + breath * 0.01;
  });
}
