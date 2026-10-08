"use strict";

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target !== "textlift-offscreen" || sender.id !== chrome.runtime.id || sender.tab) return;
  if (message.type !== "copy" || typeof message.text !== "string" || message.text.length > 1_000_000) return;
  const field = document.getElementById("clipboard");
  try {
    field.value = message.text;
    field.focus();
    field.select();
    // Offscreen documents cannot gain window focus. This is the Chrome-supported
    // offscreen clipboard pattern; navigator.clipboard can require window focus.
    const ok = document.execCommand("copy");
    respond({ ok });
  } catch {
    respond({ ok: false });
  } finally {
    field.value = "";
  }
});
