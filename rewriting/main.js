// Starts the web player: loads the WebAssembly and the puzzle list, then
// shows the list or a puzzle. Puzzles are addressed by the URL's hash, the
// puzzle's file name without ".toml" (like #05-swap), so they can be linked
// to directly.

import init, { Game, palette } from "./pkg/rwweb.js";
import { el } from "./dom.js";
import { Player } from "./player.js";

const app = document.getElementById("app");
// `[{file, title}]`, from puzzles/index.json.
let puzzles = [];
let player = null;
// Counts routes, so a puzzle that finishes loading after the player has
// gone somewhere else is dropped.
let routes = 0;

const slug = (listing) => listing.file.replace(/\.toml$/, "");
const link = (listing) => "#" + encodeURIComponent(slug(listing));

async function start() {
  try {
    await init();
    const response = await fetch("puzzles/index.json");
    if (!response.ok) throw new Error(`the puzzle list didn't load (${response.status})`);
    puzzles = await response.json();
  } catch (error) {
    const hint =
      location.protocol === "file:"
        ? " Browsers won't run this from a file. Serve the folder from a web server instead, " +
          "such as with `cargo xtask serve`."
        : "";
    showProblem(`The game couldn't start: ${error.message}.${hint}`, false);
    return;
  }
  window.addEventListener("hashchange", route);
  route();
}

function route() {
  routes += 1;
  player?.destroy();
  player = null;
  const name = decodeURIComponent(location.hash.slice(1));
  const index = puzzles.findIndex((listing) => slug(listing) === name);
  if (index < 0) showList();
  else openPuzzle(index, routes);
}

function showList() {
  document.title = "Rewriting";
  const items = puzzles.map((listing) => el("li", {}, el("a", { href: link(listing) }, listing.title)));
  app.replaceChildren(
    el("section", { class: "list" }, [
      el("h1", {}, "Rewriting"),
      el(
        "p",
        { class: "hint" },
        "Write rules that rewrite the board, to carry colors from the inputs to the outputs.",
      ),
      el("p", { class: "intro" }, [
        el("a", { class: "button", href: "tutorial.html" }, "How to play"),
        el("span", { class: "hint" }, "New here? Start with the basics."),
      ]),
      items.length ? el("ol", {}, items) : el("p", {}, "There are no puzzles yet."),
    ]),
  );
}

async function openPuzzle(index, route) {
  const listing = puzzles[index];
  document.title = `${listing.title} · Rewriting`;
  app.replaceChildren(el("p", { class: "notice" }, "Loading…"));
  let game;
  try {
    const response = await fetch("puzzles/" + encodeURIComponent(listing.file));
    if (!response.ok) throw new Error(`it didn't load (${response.status})`);
    game = new Game(await response.text());
  } catch (error) {
    if (route === routes) showProblem(`${listing.title} couldn't be opened: ${error.message}`, true);
    return;
  }
  if (route !== routes) {
    game.free();
    return;
  }
  const next = puzzles[index + 1];
  player = new Player(app, game, { palette: palette(), next: next && link(next) });
}

function showProblem(text, back) {
  app.replaceChildren(
    el("section", { class: "list" }, [
      el("p", { class: "problem-text" }, text),
      back && el("a", { class: "button", href: "#" }, "Back to the puzzles"),
    ]),
  );
}

start();
