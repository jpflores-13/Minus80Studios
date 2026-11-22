import Phaser from 'phaser';

// Code-drawn placeholder art for ONE DROP/RECONSTRUCT specimens and DIVE wildlife. Each distinct
// organism gets its own small silhouette, generated once into a texture and reused (the same
// convention other Minus 80 Studios games use — see e.g. ridgerunner/src/render/art.ts) rather
// than drawing shapes fresh every frame or falling back to a plain colored circle for everything.
//
// Shapes are drawn in near-white fill with dark detail lines, at a fixed 64x64 reference size,
// so a scene can `.setTint()` the existing kind color (target/non-target/artifact/unknown) onto
// the near-white fill while the dark detail lines stay legible — species identity and the
// existing color-coded classification both read at once, from the same sprite.
//
// Where a shape reflects a real, well-established structural feature (a copepod's antennae, a
// diatom's symmetric striated shell, a dinoflagellate's trailing flagellum, a virus's polyhedral
// capsid, krill's segmented body) that is grounded in natural history — see docs/SCIENCE.md and
// docs/ORGANISM_DATABASE.md. Where we are not confident of a specific real silhouette (artifacts,
// noise, uncertain/"unknown" particles, a generic swarm or fragment), the shape stays simple and
// deliberately abstract instead of inventing anatomical detail we can't support.

const SIZE = 64;
const C = SIZE / 2;
const FILL = 0xf2f8f9; // near-white: tints cleanly to any kind color
const DETAIL = 0x0c1a20; // near-black: stays dark under any tint, keeps detail legible

function tex(
  scene: Phaser.Scene,
  key: string,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, SIZE, SIZE);
  g.destroy();
}

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

// --- ONE DROP / RECONSTRUCT organisms -------------------------------------------------------

/** A copepod: a small elongated body, a forked tail, and antennae much longer than the body —
 * the single most characteristic copepod silhouette feature. */
const drawCopepod: DrawFn = (g) => {
  g.fillStyle(FILL, 1).fillEllipse(C, C + 2, 26, 14);
  g.lineStyle(2, DETAIL, 1);
  g.lineBetween(C - 13, C + 2, C - 24, C - 6);
  g.lineBetween(C - 13, C + 2, C - 24, C + 10);
  g.lineBetween(C + 11, C - 3, C + 27, C - 16);
  g.lineBetween(C + 11, C + 1, C + 27, C + 12);
  g.fillStyle(DETAIL, 1).fillCircle(C + 12, C, 2);
  g.lineStyle(1.5, DETAIL, 0.8);
  g.lineBetween(C - 2, C + 9, C - 5, C + 16);
  g.lineBetween(C + 5, C + 9, C + 3, C + 16);
};

/** A juvenile krill (larval stage): a slimmer, plainer capsule than the adult, with faint
 * segmentation and a small tail fan but no antennae yet — reads as "simpler/younger" next to the
 * adult krill sprite below. */
const drawKrillLarva: DrawFn = (g) => {
  g.fillStyle(FILL, 0.95).fillEllipse(C, C, 30, 11);
  g.lineStyle(1.5, DETAIL, 0.7);
  for (const dx of [-10, -4, 2, 8]) g.lineBetween(C + dx, C - 5, C + dx, C + 5);
  g.lineBetween(C - 15, C, C - 23, C - 7);
  g.lineBetween(C - 15, C, C - 23, C + 7);
  g.fillStyle(DETAIL, 1).fillCircle(C + 14, C, 1.8);
};

/** A diatom: an elongated, bilaterally symmetric shell (a "pennate" frustule shape) with a
 * central raphe line and fine transverse striations — real diatoms are famous for exactly this
 * kind of symmetric, ornamented silica shell. */
const drawDiatom: DrawFn = (g) => {
  g.fillStyle(FILL, 1).fillEllipse(C, C, 34, 14);
  g.lineStyle(1, DETAIL, 0.8);
  g.lineBetween(C - 15, C, C + 15, C);
  for (let dx = -12; dx <= 12; dx += 4) g.lineBetween(C + dx, C - 5, C + dx, C + 5);
  g.lineStyle(1.8, DETAIL, 0.9).strokeEllipse(C, C, 34, 14);
};

/** A dinoflagellate: a rounded body wrapped by an equatorial girdle groove, trailing a single
 * whip-like flagellum — dinoflagellates are defined by exactly these two flagella. */
const drawDinoflagellate: DrawFn = (g) => {
  g.fillStyle(FILL, 1).fillCircle(C - 2, C, 14);
  g.lineStyle(1.3, DETAIL, 0.8).strokeEllipse(C - 2, C, 30, 11);
  g.lineStyle(1.6, DETAIL, 0.9);
  g.lineBetween(C + 11, C + 2, C + 20, C + 11);
  g.lineBetween(C + 20, C + 11, C + 27, C + 7);
  g.lineBetween(C + 27, C + 7, C + 32, C + 15);
};

/** A ciliate: an oval body densely fringed with short cilia all around the edge — the defining
 * feature of this group. */
const drawCiliate: DrawFn = (g) => {
  g.fillStyle(FILL, 1).fillEllipse(C, C, 26, 18);
  g.lineStyle(1, DETAIL, 0.8);
  const n = 18;
  const rx = 13;
  const ry = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x0 = C + Math.cos(a) * rx;
    const y0 = C + Math.sin(a) * ry;
    const x1 = C + Math.cos(a) * (rx + 5);
    const y1 = C + Math.sin(a) * (ry + 5);
    g.lineBetween(x0, y0, x1, y1);
  }
};

/** A labelled bacterial cell: a simple rod (bacillus) shape with a bright fluorescent core —
 * "labelled" means stained for fluorescence microscopy, hence the glow. */
const drawBacterium: DrawFn = (g) => {
  g.fillStyle(0x9beeea, 0.3).fillEllipse(C, C, 38, 20);
  g.fillStyle(FILL, 1).fillRoundedRect(C - 17, C - 7, 34, 14, 7);
  g.lineStyle(1.3, DETAIL, 0.8).strokeRoundedRect(C - 17, C - 7, 34, 14, 7);
  g.fillStyle(0x6ff0d8, 0.9).fillCircle(C, C, 3);
};

/** A virus-like particle: a small polyhedral capsid with short surface projections — many real
 * viruses have an icosahedral or otherwise polyhedral capsid; this stays generic rather than
 * claiming a specific virus's exact structure. */
const drawVirus: DrawFn = (g) => {
  const r = 15;
  g.fillStyle(FILL, 1);
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = C + Math.cos(a) * r;
    const y = C + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
  g.lineStyle(1.4, DETAIL, 0.9);
  g.strokePath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6;
    const x0 = C + Math.cos(a) * r;
    const y0 = C + Math.sin(a) * r;
    const x1 = C + Math.cos(a) * (r + 5);
    const y1 = C + Math.sin(a) * (r + 5);
    g.lineBetween(x0, y0, x1, y1);
  }
};

/** Antarctic krill (adult): an elongated segmented body, a tail fan, a large dark eye near the
 * head, and short legs beneath — the well-documented krill body plan, more defined than the
 * larval-stage sprite above. */
const drawKrill: DrawFn = (g) => {
  g.fillStyle(FILL, 1).fillEllipse(C, C, 42, 16);
  g.lineStyle(1.4, DETAIL, 0.8);
  for (const dx of [-15, -9, -3, 3, 9, 15]) g.lineBetween(C + dx, C - 7, C + dx, C + 7);
  g.lineBetween(C - 21, C, C - 30, C - 8);
  g.lineBetween(C - 21, C, C - 30, C + 8);
  g.lineBetween(C - 21, C, C - 31, C);
  g.fillStyle(DETAIL, 1).fillCircle(C + 18, C - 1, 3);
  g.lineStyle(1, DETAIL, 0.7);
  for (const dx of [-8, -2, 4, 10]) g.lineBetween(C + dx, C + 7, C + dx - 1, C + 13);
};

/** A copepod swarm: several small copepod-like blobs clustered together — a reasonable
 * abstraction for "many tiny organisms at once," not a claim about one specific animal's shape. */
const drawCopepodSwarm: DrawFn = (g) => {
  const pts: [number, number][] = [
    [-11, -6],
    [3, -10],
    [12, 3],
    [-5, 8],
    [8, 12],
    [-13, 5],
  ];
  g.fillStyle(FILL, 0.95);
  for (const [dx, dy] of pts) g.fillEllipse(C + dx, C + dy, 9, 5);
  g.lineStyle(1, DETAIL, 0.6);
  for (const [dx, dy] of pts) g.lineBetween(C + dx + 4, C + dy, C + dx + 8, C + dy - 3);
};

/** A host cell fragment: a ragged, irregular shape with no implied anatomy — explicitly kept
 * abstract since this is debris, not a specific organism. */
const drawFragment: DrawFn = (g) => {
  const pts: [number, number][] = [
    [-11, -4],
    [-4, -11],
    [6, -8],
    [11, 1],
    [7, 10],
    [-3, 11],
    [-11, 5],
  ];
  g.fillStyle(0xeaf2f3, 0.85);
  g.beginPath();
  pts.forEach(([dx, dy], i) => {
    if (i === 0) g.moveTo(C + dx, C + dy);
    else g.lineTo(C + dx, C + dy);
  });
  g.closePath();
  g.fillPath();
  g.lineStyle(1, DETAIL, 0.6);
  g.strokePath();
};

/** A microbial aggregate: a loose cluster of small round cells, not a single organism's shape —
 * deliberately generic, like the fragment above. */
const drawAggregate: DrawFn = (g) => {
  const pts: [number, number][] = [
    [-8, -5],
    [2, -9],
    [9, 2],
    [-2, 8],
    [-9, 1],
  ];
  g.fillStyle(FILL, 0.9);
  for (const [dx, dy] of pts) g.fillCircle(C + dx, C + dy, 6);
  g.lineStyle(1, DETAIL, 0.5);
  for (const [dx, dy] of pts) g.strokeCircle(C + dx, C + dy, 6);
};

// --- Generic, deliberately abstract motifs (artifacts, noise, uncertain particles) ----------
// These are not organisms, so there is no real structure to reflect — each stays a simple,
// clearly-abstract shape rather than inventing anatomy. Drawn in white so a scene's kind-color
// tint (coral for artifacts, amber for unknowns) does all the coloring.

/** An air bubble: a ring with a small highlight. */
const drawBubble: DrawFn = (g) => {
  g.lineStyle(2.4, 0xffffff, 0.9).strokeCircle(C, C, 17);
  g.fillStyle(0xffffff, 0.5).fillCircle(C - 6, C - 6, 3.5);
};

/** Debris / imaging noise: a scatter of small flecks, no implied shape. */
const drawSpeckle: DrawFn = (g) => {
  const pts: [number, number][] = [
    [-9, -6],
    [5, -11],
    [11, 3],
    [-3, 9],
    [-12, 2],
    [7, 11],
    [1, 1],
  ];
  g.fillStyle(0xffffff, 0.85);
  for (const [dx, dy] of pts) g.fillCircle(C + dx, C + dy, 2.2);
};

/** Out-of-focus blur / background signal / ice glare: a soft radial glow, nothing sharp. */
const drawBlur: DrawFn = (g) => {
  for (let r = 22; r > 0; r -= 3) g.fillStyle(0xffffff, 0.1).fillCircle(C, C, r);
};

/** A faint, uncertain particle: a thin, broken-looking ring around a dim center — reads as
 * "something is here, but it isn't resolved," matching the game's honest-uncertainty framing. */
const drawFaint: DrawFn = (g) => {
  g.lineStyle(1.6, 0xffffff, 0.55).strokeCircle(C, C, 17);
  g.fillStyle(0xffffff, 0.35).fillCircle(C, C, 5);
};

/** Which draw function each ONE DROP specimen type uses. Entries not listed here (RECONSTRUCT's
 * molecular-scale quality categories) are handled by ReconstructScene's own frame presentation,
 * deliberately kept abstract — see that scene's doc comment for why. */
const ORGANISM_DRAW: Record<string, DrawFn> = {
  copepod: drawCopepod,
  krillLarva: drawKrillLarva,
  bubble: drawBubble,
  debris: drawSpeckle,
  faintShape: drawFaint,
  diatom: drawDiatom,
  dinoflagellate: drawDinoflagellate,
  ciliate: drawCiliate,
  outOfFocus: drawBlur,
  ambiguousCell: drawFaint,
  labeledBacterium: drawBacterium,
  aggregate: drawAggregate,
  backgroundSignal: drawBlur,
  noise: drawSpeckle,
  dimParticle: drawFaint,
  virusParticle: drawVirus,
  hostFragment: drawFragment,
  stainArtifact: drawSpeckle,
  faintSignal: drawFaint,
  krill: drawKrill,
  copepodSwarm: drawCopepodSwarm,
  iceGlare: drawBlur,
  distantShape: drawFaint,
};

export function organismTextureKey(typeId: string): string {
  return `organism-${typeId}`;
}

// --- DIVE wildlife -----------------------------------------------------------------------------

/** A seal: a sleek elongated body tapering to a small tail, with a pair of small front flippers
 * and a rounded head — the general pinniped body plan shared by both DIVE seal species. */
function sealBody(g: Phaser.GameObjects.Graphics, headScale: number): void {
  g.fillStyle(FILL, 1).fillEllipse(C - 2, C, 46, 20);
  g.fillEllipse(C + 18, C, 16 * headScale, 14 * headScale);
  g.lineStyle(1.4, DETAIL, 0.8);
  g.lineBetween(C - 2, C + 9, C - 10, C + 15);
  g.lineBetween(C - 2, C - 9, C - 10, C - 15);
  g.fillStyle(DETAIL, 1).fillCircle(C + 21, C - 3, 1.8);
}

/** Weddell seal: the baseline seal body, a moderate head. */
const drawWeddellSeal: DrawFn = (g) => sealBody(g, 1);

/** Leopard seal: the same body plan with a distinctly larger, wider head relative to the body —
 * leopard seals are well known for an outsized, reptilian-looking head compared to other seals. */
const drawLeopardSeal: DrawFn = (g) => sealBody(g, 1.4);

/** Adelie penguin: a rounded torpedo body, a small pointed beak, and a short flipper — the
 * classic penguin silhouette. */
const drawPenguin: DrawFn = (g) => {
  g.fillStyle(FILL, 1).fillEllipse(C, C + 2, 24, 34);
  g.lineStyle(1.4, DETAIL, 0.8);
  g.beginPath();
  g.moveTo(C, C - 20);
  g.lineTo(C + 9, C - 13);
  g.lineTo(C, C - 10);
  g.closePath();
  g.strokePath();
  g.fillStyle(DETAIL, 0.9);
  g.beginPath();
  g.moveTo(C, C - 20);
  g.lineTo(C + 9, C - 13);
  g.lineTo(C, C - 10);
  g.closePath();
  g.fillPath();
  g.lineStyle(1.3, DETAIL, 0.7).lineBetween(C - 10, C - 2, C - 20, C + 10);
  g.fillStyle(DETAIL, 1).fillCircle(C + 3, C - 16, 1.6);
};

/** Crocodile icefish: an elongated fish body, a tail fin, and a large eye. */
const drawIcefish: DrawFn = (g) => {
  g.fillStyle(FILL, 0.9).fillEllipse(C - 3, C, 38, 13);
  g.lineStyle(1.3, DETAIL, 0.8);
  g.lineBetween(C + 15, C, C + 25, C - 10);
  g.lineBetween(C + 15, C, C + 25, C + 10);
  g.lineBetween(C + 15, C, C + 26, C);
  g.fillStyle(DETAIL, 1).fillCircle(C - 15, C - 1, 2.6);
};

/** Antarctic krill swarm (DIVE scale): several of the adult krill silhouette clustered together,
 * reusing the same drawing so the "many krill at once" read is consistent with the ONE DROP
 * krill sprite. */
const drawKrillSwarmWildlife: DrawFn = (g) => {
  const offsets: [number, number][] = [
    [-12, -9],
    [10, -6],
    [-4, 10],
    [12, 9],
  ];
  for (const [dx, dy] of offsets) {
    g.fillStyle(FILL, 0.85).fillEllipse(C + dx, C + dy, 18, 7);
    g.lineStyle(1, DETAIL, 0.6);
    g.lineBetween(C + dx - 9, C + dy, C + dx - 13, C + dy - 3);
    g.lineBetween(C + dx - 9, C + dy, C + dx - 13, C + dy + 3);
  }
};

const WILDLIFE_DRAW: Record<string, DrawFn> = {
  weddellSeal: drawWeddellSeal,
  leopardSeal: drawLeopardSeal,
  adeliePenguin: drawPenguin,
  icefish: drawIcefish,
  krillSwarm: drawKrillSwarmWildlife,
};

export function wildlifeTextureKey(id: string): string {
  return `wildlife-${id}`;
}

/** Generates every organism/wildlife texture once (idempotent — safe to call repeatedly; each
 * key is only drawn the first time). Call from BootScene before any scene that renders them. */
export function makeArt(scene: Phaser.Scene): void {
  for (const [id, draw] of Object.entries(ORGANISM_DRAW)) tex(scene, organismTextureKey(id), draw);
  for (const [id, draw] of Object.entries(WILDLIFE_DRAW)) tex(scene, wildlifeTextureKey(id), draw);
}
