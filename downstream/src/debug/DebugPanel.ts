import type Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import type { MapView } from '../entities/MapView';
import type { LevelConfig } from '../levels/types';
import { performance, tally } from '../systems/score';
import type { SimState } from '../systems/sim';

// Dev-only balancing panel. LevelScene only imports this behind import.meta.env.DEV,
// so it never ships in a production build. Toggle with the backtick key.

type Num = Record<string, number>;
interface Ctx {
  sim: SimState | undefined;
  map: MapView;
  level: LevelConfig;
}

const SLIDERS: [keyof typeof TUNING, string, number, number, number][] = [
  ['bin', 'effectiveness', 0, 1, 0.05],
  ['trap', 'capacity', 5, 120, 1],
  ['filter', 'efficiency', 0, 1, 0.05],
  ['filter', 'capacity', 5, 80, 1],
  ['boom', 'steering', 0, 1, 0.05],
  ['transport', 'lateralDiffusion', 0, 1.5, 0.05],
  ['retention', 'retainPerSecond', 0, 3, 0.05],
  ['retention', 'remobilizePerSecond', 0, 0.5, 0.01],
];

export const DebugPanel = {
  attach(scene: Phaser.Scene, ctx: () => Ctx): void {
    document.getElementById('m80-debug')?.remove();
    const root = document.createElement('div');
    root.id = 'm80-debug';
    root.style.cssText =
      'position:fixed;top:8px;right:8px;width:300px;max-height:95vh;overflow:auto;background:#2d2a26ee;color:#fbf6ea;' +
      'font:12px/1.4 system-ui;padding:10px;border:1px solid #d9603b;border-radius:6px;z-index:9999;display:none';
    root.innerHTML = '<b>DEV · Balancing</b> (toggle: `)<br>Changes apply to the next flow.';

    const slider = (
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
      const show = () => (value.textContent = ` ${obj[key]}`);
      input.oninput = () => {
        obj[key] = Number(input.value);
        show();
      };
      show();
      row.append(label, value, input);
      root.append(row);
    };
    for (const level of ['light', 'moderate', 'heavy'] as const) {
      slider(`${level} rain wash`, TUNING.weather[level] as unknown as Num, 'wash', 0, 2, 0.05);
      slider(`${level} rain flow`, TUNING.weather[level] as unknown as Num, 'flow', 0, 3, 0.05);
    }
    slider('dry flow', TUNING.weather.dry as unknown as Num, 'flow', 0, 1, 0.05);
    for (const [group, key, min, max, step] of SLIDERS)
      slider(`${group}.${key}`, TUNING[group] as unknown as Num, key, min, max, step);
    const level = ctx().level;
    for (const src of level.sources)
      slider(`${src.label} rate`, src as unknown as Num, 'rate', 0, 2, 0.05);
    slider('level target', level as unknown as Num, 'target', 0.3, 1, 0.01);

    const toggles = document.createElement('div');
    for (const [label, flag] of [
      ['flow arrows', 'showFlowArrows'],
      ['GPS trails', 'showTrails'],
    ] as const) {
      const b = document.createElement('button');
      b.textContent = `toggle ${label}`;
      b.onclick = () => (ctx().map[flag] = !ctx().map[flag]);
      toggles.append(b);
    }
    const stats = document.createElement('pre');
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export run + config JSON';
    exportBtn.onclick = () => {
      const { sim, level: lvl } = ctx();
      const data = {
        level: lvl,
        tuning: TUNING,
        run: sim
          ? {
              time: sim.time,
              tally: tally(sim.items),
              deployment: sim.deployment,
              orientations: sim.orientations,
              used: sim.used,
            }
          : null,
      };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      a.download = `downstream-${lvl.id}-run.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    root.append(toggles, stats, exportBtn);
    document.body.append(root);

    const timer = window.setInterval(() => {
      const sim = ctx().sim;
      if (!sim) return;
      const t = tally(sim.items);
      const byState: Record<string, number> = {};
      for (const i of sim.items) byState[i.state] = (byState[i.state] ?? 0) + 1;
      stats.textContent = `t=${sim.time.toFixed(1)}s  ${sim.conditions}\nperformance ${(performance(t) * 100).toFixed(1)}%\n${JSON.stringify(byState, null, 1)}`;
    }, 300);
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
