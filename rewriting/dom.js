// A small helper for building DOM nodes.

// Makes a `tag` element. Attributes starting with "on" become event
// listeners, `class` sets the class, an object `style` is assigned to the
// style, and null, undefined and false attributes are left out. Children can
// be nodes, strings, or arrays of them, nested as deep as they like, and
// null, undefined and false children are skipped.
export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value == null || value === false) continue;
    if (name.startsWith("on")) node.addEventListener(name.slice(2), value);
    else if (name === "class") node.className = value;
    else if (name === "style" && typeof value === "object") Object.assign(node.style, value);
    else node.setAttribute(name, value === true ? "" : value);
  }
  node.append(...[children].flat(Infinity).filter((c) => c != null && c !== false));
  return node;
}
