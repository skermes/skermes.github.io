// Draws the board on a canvas: its cells, the outputs and inputs on them,
// and a held object where it would be put down.

// CSS pixels per cell.
export const CELL = 20;

// Backgrounds that stand in for black in empty cells that belong to an
// object, so the object's extent shows.
const OBJECT = "#282828";
const JUST_COMPLETED = "#6e6428";
const DROP = "#283264";
const DROP_BLOCKED = "#641e1e";
const GRID = "#161616";
const OUTLINE = "#5a5a5a";

// Black or white, whichever stands out more against `color` ("#rrggbb"),
// by WCAG's measure of contrast.
export function contrast(color) {
  const n = parseInt(color.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Against black, (L + 0.05) / 0.05; against white, 1.05 / (L + 0.05).
  return (luminance + 0.05) ** 2 > 0.0525 ? "#000" : "#fff";
}

// Draws `state` (a Game's snapshot) on `canvas`, sizing it to fit. `colorOf`
// maps cell values to colors, and `preview`, if there is one, is a held
// object and where it would go: `{kind, index, x, y, free}`.
export function drawBoard(canvas, state, { colorOf, preview }) {
  const { width, height, cells } = state;
  const ratio = window.devicePixelRatio || 1;
  const [w, h] = [width * CELL, height * CELL];
  if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const at = (x, y) => cells[y * width + x];
  const fill = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  };
  // A small square in the middle of a cell, showing the value an output
  // wants there.
  const ghost = (x, y, want) => {
    const inset = CELL * 0.3;
    const size = CELL - 2 * inset;
    ctx.fillStyle = colorOf[want];
    ctx.fillRect(x * CELL + inset, y * CELL + inset, size, size);
    ctx.lineWidth = 1;
    ctx.strokeStyle = want === "Empty" ? "#777" : "rgba(0, 0, 0, 0.6)";
    ctx.strokeRect(x * CELL + inset + 0.5, y * CELL + inset + 0.5, size - 1, size - 1);
  };
  const outline = (x, y, w, h, color) => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.strokeRect(x * CELL + 0.5, y * CELL + 0.5, w * CELL - 1, h * CELL - 1);
  };
  const ring = (x, y, color) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.strokeRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8);
  };
  const label = (x, y, text, color) => {
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(CELL * 0.55)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, (x + 0.5) * CELL, (y + 0.55) * CELL);
  };
  // Each cell of an output's region at (left, top), with the value its
  // pattern wants there.
  const region = (output, left, top) =>
    output.pattern.map((want, k) => [left + (k % output.width), top + Math.floor(k / output.width), want]);

  ctx.fillStyle = colorOf.Empty;
  ctx.fillRect(0, 0, w, h);
  for (const output of state.outputs) {
    if (!output.spot) continue;
    const tint = output.justCompleted ? JUST_COMPLETED : OBJECT;
    for (const [x, y] of region(output, ...output.spot)) if (at(x, y) === "Empty") fill(x, y, tint);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = GRID;
  ctx.beginPath();
  for (let x = 1; x < width; x++) {
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, h);
  }
  for (let y = 1; y < height; y++) {
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(w, y * CELL + 0.5);
  }
  ctx.stroke();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) if (at(x, y) !== "Empty") fill(x, y, colorOf[at(x, y)]);
  }

  // Outputs show a ghost of what they want wherever it isn't there yet, and
  // are numbered when there's more than one, as they are in the tray.
  const numbered = state.outputs.length > 1;
  state.outputs.forEach((output, o) => {
    if (!output.spot) return;
    const [left, top] = output.spot;
    for (const [x, y, want] of region(output, left, top)) if (at(x, y) !== want) ghost(x, y, want);
    outline(left, top, output.width, output.height, output.justCompleted ? "#d8c040" : OUTLINE);
    if (numbered) {
      const have = at(left, top);
      const bg = have === "Empty" ? (output.justCompleted ? JUST_COMPLETED : OBJECT) : colorOf[have];
      ctx.fillStyle = bg;
      ctx.fillRect(left * CELL + 1, top * CELL + 1, CELL - 2, CELL - 2);
      label(left, top, String(o + 1), contrast(bg));
    }
  });

  for (const input of state.inputs) {
    if (!input.spot) continue;
    const [x, y] = input.spot;
    const have = at(x, y);
    const bg = have === "Empty" ? OBJECT : colorOf[have];
    fill(x, y, bg);
    if (input.blocked) label(x, y, "!!", contrast(bg));
    else ring(x, y, have === "Empty" ? colorOf[input.value] : contrast(bg));
  }

  if (preview) {
    const tint = preview.free ? DROP : DROP_BLOCKED;
    if (preview.kind === "input") {
      fill(preview.x, preview.y, tint);
      ring(preview.x, preview.y, colorOf[state.inputs[preview.index].value]);
    } else {
      const output = state.outputs[preview.index];
      for (const [x, y, want] of region(output, preview.x, preview.y)) {
        fill(x, y, tint);
        if (want !== "Empty") ghost(x, y, want);
      }
      outline(preview.x, preview.y, output.width, output.height, OUTLINE);
    }
  }
}
