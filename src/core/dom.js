/**
 * Query a single element.
 * @template {Element} T
 * @param {string} sel - CSS selector.
 * @param {ParentNode} [el=document] - Root to query within.
 * @returns {T|null}
 */
export const qs  = (sel, el = document) => el.querySelector(sel);

/**
 * Query multiple elements and return an array.
 *
 * @param {string} sel - CSS selector.
 * @param {ParentNode} [el=document] - Root to query within.
 * @returns {Element[]} Array of matching elements.
 */
export const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

/**
 * Create a DOM element with attributes and children.
 *
 * Attributes are assigned as properties when possible, otherwise via setAttribute.
 *
 * @param {keyof HTMLElementTagNameMap} tag
 * @param {Record<string, any>} [attrs]
 * @param {(Node|string)[]} [children]
 * @returns {HTMLElement}
 */
export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) =>
    (k in node ? (node[k] = v) : node.setAttribute(k, v))
  );
  children.forEach((c) => node.append(c));
  return node;
};
