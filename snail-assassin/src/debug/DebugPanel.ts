import type Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import type { HuntState } from '../systems/hunt';

/**
 * DEVELOPMENT-ONLY balancing panel (never in production builds: HuntScene only
 * imports it inside `if (import.meta.env.DEV)`, which Vite strips from builds).
 *
 * Toggle with the backtick key (`). Sliders edit TUNING and the current
 * character's ability numbers live; the plot shows mean prey state over time;
 * "Export JSON" downloads the current configuration.
 */
type Num = Record<string, number>;

const SLIDERS: {
  group: keyof typeof TUNING;
  key: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { group: 'fish', key: 'baseSpeedMax', min: 20, max: 140, step: 1 },
  { group: 'fish', key: 'fleeSpeedMultiplier', min: 1, max: 4, step: 0.1 },
  { group: 'metabolic', key: 'dropRate', min: 0, max: 2, step: 0.01 },
  { group: 'metabolic', key: 'recoveryRate', min: 0, max: 1, step: 0.01 },
  { group: 'metabolic', key: 'overrideTau', min: 1, max: 30, step: 0.5 },
  { group: 'metabolic', key: 'uptakeRate', min: 0, max: 3, step: 0.05 },
  { group: 'neural', key: 'recoveryRate', min: 0, max: 2, step: 0.05 },
  { group: 'neural', key: 'lockTau', min: 1, max: 20, step: 0.5 },
  { group: 'escape', key: 'detectionRadius', min: 40, max: 300, step: 5 },
  { group: 'escape', key: 'gain', min: 0, max: 4, step: 0.1 },
  { group: 'escape', key: 'fleeAbove', min: 0.1, max: 1, step: 0.05 },
  { group: 'capture', key: 'vulnerabilityThreshold', min: 0.3, max: 1, step: 0.05 },
  { group: 'venom', key: 'regenPerSecond', min: 0, max: 15, step: 0.5 },
  { group: 'current', key: 'strength', min: 0, max: 60, step: 1 },
];

export const DebugPanel = {
  attach(scene: Phaser.Scene, getState: () => HuntState): void {
    document.getElementById('m80-debug')?.remove();
    const root = document.createElement('div');
    root.id = 'm80-debug';
    root.style.cssText =
      'position:fixed;top:8px;right:8px;width:300px;max-height:95vh;overflow:auto;background:#06192bee;color:#eef6f3;' +
      'font:12px/1.4 system-ui;padding:10px;border:1px solid #5fd3c6;border-radius:6px;z-index:9999;display:none';
    const title = document.createElement('div');
    title.innerHTML = '<b>DEV · Balancing</b> (toggle: `)';
    root.append(title);

    const addSlider = (
      label: string,
      obj: Num,
      key: string,
      min: number,
      max: number,
      step: number,
    ) => {
      const row = document.createElement('label');
      row.style.cssText = 'display:block;margin:4px 0';
      const value = document.createElement('span');
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min, max, step, value: String(obj[key]) });
      input.style.width = '100%';
      const sync = () => (value.textContent = ` ${obj[key]}`);
      input.oninput = () => {
        obj[key] = Number(input.value);
        sync();
      };
      sync();
      row.append(`${label}`, value, input);
      root.append(row);
    };

    for (const s of SLIDERS)
      addSlider(`${s.group}.${s.key}`, TUNING[s.group] as Num, s.key, s.min, s.max, s.step);
    const abilities = getState().character.abilities;
    for (const [slot, a] of Object.entries(abilities)) {
      const nums = a as unknown as Num;
      if ('cost' in a) addSlider(`${slot}.cost`, nums, 'cost', 0, 100, 1);
      if ('cooldown' in a) addSlider(`${slot}.cooldown`, nums, 'cooldown', 0.1, 10, 0.1);
      if ('radius' in a) addSlider(`${slot}.radius`, nums, 'radius', 20, 250, 5);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 90;
    canvas.style.cssText = 'background:#02070c;margin-top:6px';
    const legend = document.createElement('div');
    legend.innerHTML =
      '<span style="color:#5fd3c6">glucose</span> · <span style="color:#ffd36b">neural</span> · ' +
      '<span style="color:#ff7a7a">awareness</span> · <span style="color:#c9a2ff">responsiveness</span> (means)';
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export JSON';
    exportBtn.onclick = () => {
      const blob = new Blob([JSON.stringify({ tuning: TUNING, abilities }, null, 2)], {
        type: 'application/json',
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `snail-assassin-tuning-${getState().character.id}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    root.append(canvas, legend, exportBtn);
    document.body.append(root);

    const history: number[][] = [];
    const ctx = canvas.getContext('2d');
    const timer = window.setInterval(() => {
      const live = getState().fish.filter((f) => f.mode !== 'captured');
      if (!ctx || live.length === 0) return;
      const mean = (k: 'glucose' | 'neural' | 'awareness' | 'responsiveness') =>
        live.reduce((s, f) => s + f[k], 0) / live.length;
      history.push([mean('glucose'), mean('neural'), mean('awareness'), mean('responsiveness')]);
      if (history.length > 140) history.shift();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ['#5fd3c6', '#ffd36b', '#ff7a7a', '#c9a2ff'].forEach((color, series) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        history.forEach((h, i) => {
          const y = canvas.height - (h[series] ?? 0) * (canvas.height - 4) - 2;
          if (i === 0) ctx.moveTo(i * 2, y);
          else ctx.lineTo(i * 2, y);
        });
        ctx.stroke();
      });
    }, 200);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') root.style.display = root.style.display === 'none' ? 'block' : 'none';
    };
    window.addEventListener('keydown', onKey);
    scene.events.once('shutdown', () => {
      window.clearInterval(timer);
      window.removeEventListener('keydown', onKey);
      root.remove();
    });
  },
};
