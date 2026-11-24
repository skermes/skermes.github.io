// The player screen: a puzzle's rules, board and tray, with the controls
// for them. The game, and what's allowed when, lives in rwweb's Game; this
// keeps track of what's on screen (the brush, the selected rule, whatever's
// held) and passes on what the player does.

import { CELL, contrast, drawBoard } from "./board.js";
import { el } from "./dom.js";

const TICK_MS = 100;
// How far the pointer has to move, in CSS pixels, for a press and release
// to count as a drag rather than a click.
const DRAG_DISTANCE = 4;

const STATES = {
  editing: "editing",
  running: "running · reset to edit",
  paused: "paused · reset to edit",
};

export class Player {
  // Shows `game` in `root`. `palette` is rwweb's palette, and `next` is a
  // link to the next puzzle, if there is one.
  constructor(root, game, { palette, next }) {
    this.game = game;
    this.palette = palette;
    this.colorOf = Object.fromEntries(palette.map((swatch) => [swatch.name, swatch.color]));
    this.next = next;
    this.brush = "White";
    this.selected = 0;
    // The object being moved: `{kind, index, grip: [x, y], from: [x, y]}`,
    // where `grip` is the cell it's held by, from its top-left, and `from`
    // is where on screen it was picked up.
    this.holding = null;
    // Where the pointer was last seen on screen, as `[x, y]`.
    this.pointer = null;
    // The board paint stroke in progress: `{value, last: {x, y}}`.
    this.stroke = null;
    // The matcher being painted on rule cells by dragging over them.
    this.ruleStroke = null;
    this.timer = null;
    this.winDismissed = false;
    this.state = game.state();

    this.build(root);
    this.listeners = [
      ["pointermove", (e) => this.onPointerMove(e)],
      ["pointerup", (e) => this.onPointerUp(e)],
      ["pointercancel", () => this.onPointerCancel()],
      ["keydown", (e) => this.onKey(e)],
    ];
    for (const [type, listener] of this.listeners) window.addEventListener(type, listener);
    // The board fills the space it's given, as it does in the terminal.
    this.resizer = new ResizeObserver(() => this.sync());
    this.resizer.observe(this.wrap);
    this.sync();
  }

  destroy() {
    clearInterval(this.timer);
    this.resizer.disconnect();
    for (const [type, listener] of this.listeners) window.removeEventListener(type, listener);
    this.game.free();
  }

  build(root) {
    const button = (label, action, title) =>
      el("button", { type: "button", "data-action": action, title }, label);
    this.buttons = {
      start: button("Start", "start", "Start or pause the run (space)"),
      step: button("Step", "step", "Run one tick (s)"),
      reset: button("Reset", "reset", "End the run and go back to editing (r)"),
      clear: button("Clear", "clear", "Empty the board (c)"),
      add: button("Add", "add", "Add a rule after the selected one (a)"),
      remove: button("Delete", "remove", "Delete the selected rule (d)"),
      up: button("↑", "up", "Move the selected rule up (shift+↑)"),
      down: button("↓", "down", "Move the selected rule down (shift+↓)"),
    };
    const b = this.buttons;
    this.status = el("span", { class: "status" });
    this.ruleList = el("ol", { class: "rule-list" });
    this.canvas = el("canvas", { class: "board" });
    this.wrap = el("div", { class: "board-wrap" }, this.canvas);
    this.progress = el("span", { class: "progress" });
    this.message = el("span", { class: "message" });
    this.inputList = el("ul", { class: "objects" });
    this.outputList = el("ul", { class: "objects" });
    this.trayHint = el("p", { class: "hint" });
    this.swatches = el("div", { class: "swatches" });
    this.brushLabel = el("span", { class: "hint" });
    this.boardHint = el("span", { class: "hint board-hint" });
    this.dialog = el("div", { class: "dialog-backdrop", hidden: true });
    this.tray = el("aside", { class: "tray" }, [
      el("h2", {}, "Inputs"),
      this.inputList,
      el("h2", {}, "Outputs"),
      this.outputList,
      this.trayHint,
    ]);

    const brushes = ["Nothing", "Wildcard", ...this.palette.map((swatch) => swatch.name)];
    this.swatches.append(
      ...brushes.map((name) => {
        const swatch = this.matcherCell(name, { class: "swatch", "data-brush": name, title: this.brushName(name) });
        if (this.state.colors.includes(name)) {
          swatch.classList.add("puzzle-color");
          swatch.style.color = contrast(this.colorOf[name]);
        }
        return swatch;
      }),
    );

    this.node = el("div", { class: "player" }, [
      el("header", { class: "top bar" }, [
        el("a", { class: "button", href: "#", title: "Back to the puzzles (esc)" }, "← Puzzles"),
        el("h1", {}, this.state.title),
        el("div", { class: "group" }, [b.start, b.step, b.reset, b.clear]),
        this.status,
      ]),
      el("aside", { class: "rules" }, [
        el("div", { class: "rules-head" }, [el("h2", {}, "Rules"), b.add, b.remove, b.up, b.down]),
        this.ruleList,
      ]),
      el("section", { class: "stage" }, [
        this.wrap,
        el("div", { class: "board-foot" }, [this.progress, this.message]),
      ]),
      this.tray,
      el("footer", { class: "bottom bar" }, [
        el("span", { class: "label" }, "Brush"),
        this.swatches,
        this.brushLabel,
        this.boardHint,
      ]),
      this.dialog,
    ]);
    root.replaceChildren(this.node);

    this.node.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;
      // Buttons clicked with the mouse let go of focus, so the space bar
      // goes on starting and pausing rather than pressing them again.
      if (e.detail > 0) target.blur();
      this.act(target.dataset.action);
    });
    // Right click erases and puts things back, so it doesn't open menus.
    this.node.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".board, .rules, .tray, .swatches")) e.preventDefault();
    });
    this.swatches.addEventListener("click", (e) => {
      const swatch = e.target.closest("[data-brush]");
      if (!swatch) return;
      this.brush = swatch.dataset.brush;
      this.sync();
    });
    this.ruleList.addEventListener("pointerdown", (e) => this.onRulePress(e));
    this.ruleList.addEventListener("pointerover", (e) => this.onRuleOver(e));
    this.tray.addEventListener("pointerdown", (e) => this.onTrayPress(e));
    this.canvas.addEventListener("pointerdown", (e) => this.onBoardPress(e));
  }

  // Asks the game for its state after a change, and shows it. Runs tick
  // on a timer while the game says it's running.
  sync() {
    // Fit the board to its space. The game only resizes between runs.
    const width = Math.max(1, Math.floor(this.wrap.clientWidth / CELL));
    const height = Math.max(1, Math.floor(this.wrap.clientHeight / CELL));
    this.game.resize(width, height);
    this.state = this.game.state();
    if (this.state.state !== "editing") this.holding = null;
    this.render();

    const running = this.state.state === "running";
    if (running && !this.timer) {
      this.timer = setInterval(() => {
        this.game.step();
        this.sync();
      }, TICK_MS);
    } else if (!running && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  act(action) {
    const game = this.game;
    const rules = this.state.rules;
    switch (action) {
      case "start":
        if (this.state.state === "running") game.pause();
        else game.start();
        break;
      case "step":
        game.step();
        break;
      case "reset":
        game.reset();
        break;
      case "clear":
        game.clear();
        break;
      case "add": {
        const at = game.add_rule(rules.length ? this.selected + 1 : 0);
        if (at !== undefined) this.selected = at;
        break;
      }
      case "remove":
        if (game.remove_rule(this.selected)) this.selected = Math.min(this.selected, rules.length - 2);
        break;
      case "up":
        if (this.selected > 0 && game.swap_rules(this.selected - 1)) this.selected -= 1;
        break;
      case "down":
        if (game.swap_rules(this.selected)) this.selected += 1;
        break;
      case "back":
        location.hash = "";
        return;
      case "next":
        location.hash = this.next;
        return;
      case "stay":
        this.winDismissed = true;
        break;
    }
    this.sync();
  }

  render() {
    const s = this.state;
    const b = this.buttons;
    const editing = s.state === "editing";
    this.selected = Math.max(0, Math.min(this.selected, s.rules.length - 1));
    const editable = (i) => s.rules[i]?.editable ?? false;

    b.start.textContent = s.state === "running" ? "Pause" : "Start";
    b.reset.disabled = editing;
    b.clear.disabled = !editing;
    b.add.disabled = !editing;
    b.remove.disabled = !editable(this.selected);
    b.up.disabled = !(editable(this.selected - 1) && editable(this.selected));
    b.down.disabled = !(editable(this.selected) && editable(this.selected + 1));
    this.canvas.classList.toggle("holding", this.holding != null);

    this.status.textContent = `${STATES[s.state]} · tick ${s.ticks} · ${s.width}×${s.height}`;
    this.progress.replaceChildren(...this.progressParts());
    this.message.textContent = s.error ?? "";
    for (const swatch of this.swatches.children) {
      swatch.classList.toggle("selected", swatch.dataset.brush === this.brush);
    }
    this.brushLabel.textContent = this.brushName(this.brush);
    this.boardHint.textContent = this.hint();

    this.renderRules();
    this.renderTray();
    this.renderBoard();
    this.renderDialog();
  }

  // Completions so far against the goal, for under the board.
  progressParts() {
    const { outputs, goal } = this.state;
    const parts = [outputs.length === 1 ? "Output " : "Outputs "];
    outputs.forEach((output, o) => {
      if (o > 0) parts.push(" · ");
      const label = outputs.length === 1 ? "" : `${o + 1}: `;
      const done = Math.min(output.completions, goal);
      const look = done >= goal ? "good" : output.spot ? null : "hint";
      parts.push(el("span", { class: look }, `${label}${done}/${goal}`));
    });
    return parts;
  }

  brushName(name) {
    if (name === "Nothing") return "Nothing: not part of the rule";
    if (name === "Wildcard") return "Wildcard: any non-empty value";
    if (this.state.colors.includes(name)) return `${name}, a puzzle color: rules only`;
    return name;
  }

  // How to use the board, for the footer.
  hint() {
    if (this.holding) return "Click to put it down, right click to put it back.";
    if (this.state.state !== "editing") return "Reset (r) to edit.";
    const paint = this.state.colors.includes(this.brush)
      ? "Puzzle colors are for rules, not painting"
      : "Click paints the board, right click erases";
    return `${paint}. Drag inputs and outputs to move them.`;
  }

  // A cell showing a matcher: a rule's cell, or a brush.
  matcherCell(name, attributes = {}, text = null) {
    const node = el("span", attributes, text);
    node.classList.add("cell");
    if (name === "Nothing") node.classList.add("nothing");
    else if (name === "Wildcard") {
      node.classList.add("wildcard");
      if (text == null) node.textContent = "✱";
    } else {
      node.style.background = this.colorOf[name];
      if (name === "Empty") node.classList.add("empty");
    }
    return node;
  }

  renderRules() {
    const rules = this.state.rules;
    // Rebuilding the list on every tick would be wasted work, since rules
    // only change between runs.
    const key = JSON.stringify([rules, this.selected]);
    if (key === this.rulesKey) return;
    this.rulesKey = key;
    if (!rules.length) {
      this.ruleList.replaceChildren(
        el(
          "li",
          { class: "hint" },
          "No rules yet. Add one (a), then paint its cells with the brush: the left side is a " +
            "pattern to look for, and the right side is what to replace it with.",
        ),
      );
      return;
    }
    this.ruleList.replaceChildren(...rules.map((rule, i) => this.ruleNode(rule, i)));
    this.ruleList.children[this.selected]?.scrollIntoView({ block: "nearest" });
  }

  ruleNode(rule, index) {
    const problem = rule.problem;
    const unchecked = problem?.kind === "unchecked" ? problem.cells : [];
    const side = (name, matchers) =>
      el(
        "div",
        { class: "pattern", "data-side": name },
        matchers.map((matcher, cell) => {
          // Mark the cells the left side has to check, because the right
          // side writes them.
          const ask = name === "left" && unchecked.includes(cell);
          return ask
            ? el("span", { class: "cell unchecked", "data-cell": cell }, "?")
            : this.matcherCell(matcher, { "data-cell": cell });
        }),
      );
    const classes = ["rule"];
    if (index === this.selected) classes.push("selected");
    if (rule.given) classes.push("given");
    if (rule.editable) classes.push("editable");
    if (problem) classes.push("broken");
    return el("li", { class: classes.join(" "), "data-rule": index }, [
      el("div", { class: "rule-title" }, rule.given ? `${index + 1} · given` : `${index + 1}`),
      el("div", { class: "rule-body" }, [
        side("left", rule.left),
        el("span", { class: "arrow" }, "→"),
        side("right", rule.right),
      ]),
      problem &&
        el("div", { class: "problem" }, [
          problem.kind === "unbalanced" ? this.matcherCell(problem.matcher, { class: "small" }) : "?",
          el("span", {}, problem.text),
        ]),
    ]);
  }

  renderTray() {
    const s = this.state;
    const editing = s.state === "editing";
    const held = this.holding && [this.holding.kind, this.holding.index];
    const key = JSON.stringify([s.inputs, s.outputs.map((o) => o.spot), held, editing]);
    if (key === this.trayKey) return;
    this.trayKey = key;

    const item = (kind, index, spot, swatch) => {
      const isHeld = held?.[0] === kind && held[1] === index;
      const classes = ["object"];
      if (editing) classes.push("movable");
      if (isHeld) classes.push("held");
      return el("li", { class: classes.join(" "), "data-kind": kind, "data-index": index }, [
        el("span", { class: "number" }, String(index + 1)),
        swatch,
        el("span", { class: "where" }, isHeld ? "held" : spot ? "placed" : ""),
      ]);
    };
    this.inputList.replaceChildren(
      ...s.inputs.map((input, i) =>
        item("input", i, input.spot, el("span", { class: "input-swatch", style: { color: this.colorOf[input.value] } })),
      ),
    );
    this.outputList.replaceChildren(
      ...s.outputs.map((output, o) =>
        item("output", o, output.spot, [
          el("span", {}, `${output.width}×${output.height}`),
          el(
            "span",
            { class: "mini-pattern", style: { gridTemplateColumns: `repeat(${output.width}, 12px)` } },
            output.pattern.map((want) =>
              el("span", { class: want === "Empty" ? "empty" : null, style: { background: this.colorOf[want] } }),
            ),
          ),
        ]),
      ),
    );
    this.trayHint.textContent = editing ? "Click or drag them onto the board." : "";
  }

  renderBoard() {
    const spot = this.dropSpot();
    const preview = spot && { kind: this.holding.kind, index: this.holding.index, ...spot };
    drawBoard(this.canvas, this.state, { colorOf: this.colorOf, preview });
  }

  renderDialog() {
    const s = this.state;
    if (!s.solved) this.winDismissed = false;
    const show = s.solved && !this.winDismissed;
    if (show === !this.dialog.hidden) return;
    this.dialog.hidden = !show;
    if (!show) return;
    const primary = this.next
      ? el("button", { type: "button", "data-action": "next" }, "Next puzzle")
      : el("button", { type: "button", "data-action": "back" }, "Back to puzzles");
    this.dialog.replaceChildren(
      el("div", { class: "dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "solved" }, [
        el("h2", { id: "solved" }, "Congratulations!"),
        el("p", {}, `You solved ${s.title} in ${s.ticks} ticks.`),
        el("div", { class: "actions" }, [
          primary,
          this.next && el("button", { type: "button", "data-action": "back" }, "Back to puzzles"),
          el("button", { type: "button", "data-action": "stay", title: "Close (esc)" }, "Stay here"),
        ]),
      ]),
    );
    primary.focus();
  }

  // The board cell under a point on screen, or null if it's off the board.
  cellAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL);
    const y = Math.floor((clientY - rect.top) / CELL);
    const { width, height } = this.state;
    return x >= 0 && y >= 0 && x < width && y < height ? { x, y } : null;
  }

  // The object covering board cell (x, y): `{kind, index, spot}`, or null.
  objectAt(x, y) {
    const { inputs, outputs } = this.state;
    for (const [index, input] of inputs.entries()) {
      if (input.spot?.[0] === x && input.spot[1] === y) return { kind: "input", index, spot: input.spot };
    }
    for (const [index, output] of outputs.entries()) {
      if (!output.spot) continue;
      const [left, top] = output.spot;
      if (x >= left && x < left + output.width && y >= top && y < top + output.height) {
        return { kind: "output", index, spot: output.spot };
      }
    }
    return null;
  }

  // Where the held object would be put down, as `{x, y, free}`, or null if
  // nothing's held or the pointer isn't over the board.
  dropSpot() {
    const held = this.holding;
    const cell = held && this.pointer && this.cellAt(...this.pointer);
    if (!cell) return null;
    return this.game.drop_spot(held.kind, held.index, cell.x, cell.y, ...held.grip) ?? null;
  }

  pickUp(kind, index, grip, e) {
    if (this.state.state !== "editing") return;
    this.holding = { kind, index, grip, from: [e.clientX, e.clientY] };
    this.stroke = null;
  }

  // Puts the held object down under the pointer, if it can go there.
  putDown() {
    const spot = this.dropSpot();
    if (!spot?.free) return;
    this.game.place(this.holding.kind, this.holding.index, spot.x, spot.y);
    this.holding = null;
  }

  // Pressing on an input or output picks it up, or with the right button
  // puts it back in the tray. Anywhere else, it paints.
  onBoardPress(e) {
    this.pointer = [e.clientX, e.clientY];
    const cell = this.cellAt(e.clientX, e.clientY);
    if (!cell || (e.button !== 0 && e.button !== 2)) return;
    const erase = e.button === 2;
    const object = this.state.state === "editing" ? this.objectAt(cell.x, cell.y) : null;
    if (this.holding) {
      if (erase) this.holding = null;
      else this.putDown();
    } else if (object) {
      if (erase) this.game.unplace(object.kind, object.index);
      else this.pickUp(object.kind, object.index, [cell.x - object.spot[0], cell.y - object.spot[1]], e);
    } else {
      const value = erase ? "Empty" : this.brush;
      if (value === "Nothing" || value === "Wildcard") return;
      this.stroke = { value, last: cell };
      this.game.paint(cell.x, cell.y, value);
    }
    this.sync();
  }

  onPointerMove(e) {
    this.pointer = [e.clientX, e.clientY];
    this.showOver(e);
    if (this.stroke) {
      if (!e.buttons) {
        // The release happened somewhere it couldn't be seen.
        this.stroke = null;
        return;
      }
      const cell = this.cellAt(e.clientX, e.clientY);
      if (!cell) return;
      // Fill in any cells a quick drag skipped over.
      for (const [x, y] of line(this.stroke.last, cell)) this.game.paint(x, y, this.stroke.value);
      this.stroke.last = cell;
      this.sync();
    } else if (this.holding) {
      this.renderBoard();
    }
  }

  // Letting go after dragging something puts it down there if that's on
  // the board, or back in the tray if that's where it was dropped.
  onPointerUp(e) {
    this.stroke = null;
    this.ruleStroke = null;
    const held = this.holding;
    if (!held) return;
    const [x, y] = held.from;
    if (Math.hypot(e.clientX - x, e.clientY - y) < DRAG_DISTANCE) return;
    this.pointer = [e.clientX, e.clientY];
    if (this.cellAt(e.clientX, e.clientY)) {
      this.putDown();
    } else if (this.tray.contains(document.elementFromPoint(e.clientX, e.clientY))) {
      this.game.unplace(held.kind, held.index);
      this.holding = null;
    }
    this.sync();
  }

  // Shows a hand over inputs and outputs that can be picked up, since a
  // click there picks them up rather than painting.
  showOver(e) {
    const cell = e.target === this.canvas && this.state.state === "editing" && this.cellAt(e.clientX, e.clientY);
    const over = !this.stroke && cell && this.objectAt(cell.x, cell.y) != null;
    this.canvas.classList.toggle("over-object", Boolean(over));
  }

  onPointerCancel() {
    this.stroke = null;
    this.ruleStroke = null;
  }

  onRulePress(e) {
    const rule = e.target.closest("[data-rule]");
    if (!rule) return;
    const index = Number(rule.dataset.rule);
    this.selected = index;
    const cell = e.target.closest("[data-cell]");
    if (cell && (e.button === 0 || e.button === 2)) {
      // Touches stick to the element they start on; letting go of it lets
      // a drag paint the cells it passes over.
      if (e.target.hasPointerCapture?.(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
      this.ruleStroke = e.button === 2 ? "Nothing" : this.brush;
      this.setRuleCell(index, cell, this.ruleStroke);
    }
    this.sync();
  }

  onRuleOver(e) {
    if (!this.ruleStroke || !e.buttons) return;
    const rule = e.target.closest("[data-rule]");
    const cell = e.target.closest("[data-cell]");
    if (!rule || !cell) return;
    this.selected = Number(rule.dataset.rule);
    this.setRuleCell(this.selected, cell, this.ruleStroke);
    this.sync();
  }

  setRuleCell(index, cell, matcher) {
    const right = cell.parentElement.dataset.side === "right";
    this.game.set_rule_cell(index, right, Number(cell.dataset.cell), matcher);
  }

  onTrayPress(e) {
    const object = e.target.closest("[data-kind]");
    if (!object) return;
    const kind = object.dataset.kind;
    const index = Number(object.dataset.index);
    const isHeld = this.holding?.kind === kind && this.holding.index === index;
    if (e.button === 2) {
      this.game.unplace(kind, index);
      if (isHeld) this.holding = null;
    } else if (e.button === 0) {
      // Clicking the held one again puts it back where it was.
      if (isHeld) this.holding = null;
      else this.pickUp(kind, index, [0, 0], e);
    }
    this.sync();
  }

  onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!this.dialog.hidden) {
      if (e.key === "Escape") this.act("stay");
      return;
    }
    // Let a focused button or link have the keys that press it.
    if ((e.key === " " || e.key === "Enter") && e.target.closest?.("button, a")) return;
    const keys = {
      " ": "start",
      s: "step",
      r: "reset",
      c: "clear",
      a: "add",
      d: "remove",
      Delete: "remove",
    };
    const rules = this.state.rules.length;
    switch (e.key) {
      case "Escape":
        if (this.holding) {
          this.holding = null;
          this.sync();
        } else {
          this.act("back");
        }
        break;
      case "ArrowUp":
        if (e.shiftKey) this.act("up");
        else this.select(this.selected - 1);
        break;
      case "ArrowDown":
        if (e.shiftKey) this.act("down");
        else this.select(Math.min(this.selected + 1, rules - 1));
        break;
      case "ArrowLeft":
      case "ArrowRight":
        this.cycleBrush(e.key === "ArrowLeft" ? -1 : 1);
        break;
      default:
        if (!(e.key in keys)) return;
        this.act(keys[e.key]);
    }
    e.preventDefault();
  }

  select(index) {
    this.selected = Math.max(0, index);
    this.sync();
  }

  cycleBrush(step) {
    const brushes = [...this.swatches.children].map((swatch) => swatch.dataset.brush);
    const at = brushes.indexOf(this.brush);
    this.brush = brushes[(at + step + brushes.length) % brushes.length];
    this.sync();
  }
}

// The cells on a line from `from` to `to`, both included.
function* line(from, to) {
  let [x, y] = [from.x, from.y];
  const [dx, dy] = [Math.abs(to.x - x), -Math.abs(to.y - y)];
  const [sx, sy] = [x < to.x ? 1 : -1, y < to.y ? 1 : -1];
  let error = dx + dy;
  for (;;) {
    yield [x, y];
    if (x === to.x && y === to.y) return;
    const twice = 2 * error;
    if (twice >= dy) {
      error += dy;
      x += sx;
    }
    if (twice <= dx) {
      error += dx;
      y += sy;
    }
  }
}
