"use strict";
document.getElementById("unavailable").hidden = location.hash !== "#unavailable";
document.getElementById("shortcuts").addEventListener("click", () => {
  if (globalThis.chrome?.tabs?.create) chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
