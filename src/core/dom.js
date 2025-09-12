export const qs = (sel, el = document) => el.querySelector(sel);
export const el = (tag, attrs = {}, children = []) => {
const node = document.createElement(tag);
Object.entries(attrs).forEach(([k, v]) => (k in node ? (node[k] = v) : node.setAttribute(k, v)));
children.forEach((c) => node.append(c));
return node;
};