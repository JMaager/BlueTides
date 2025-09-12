export function spinner(text = "Loading…") {
  const wrap = document.createElement("div");
  wrap.textContent = text;
  return wrap;
}