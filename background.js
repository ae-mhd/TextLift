"use strict";

const tabJobs = new Map();
let clipboardQueue = Promise.resolve();

chrome.action.onClicked.addListener((tab) => {
  if (!Number.isInteger(tab.id) || tabJobs.has(tab.id)) return;
  const job = activate(tab).finally(() => tabJobs.delete(tab.id));
  tabJobs.set(tab.id, job);
});

async function activate(tab) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["extract.js", "picker.js"]
    });
  } catch (error) {
    console.warn("TextLift could not start:", error.message);
    // An ordinary extension page provides a readable error on restricted tabs.
    await chrome.tabs.create({ url: chrome.runtime.getURL("guide.html#unavailable") });
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target !== "textlift-background" || sender.id !== chrome.runtime.id) return;
  if (message.type !== "copy" || !sender.tab || sender.frameId !== 0) return;
  if (typeof message.text !== "string" || !message.text.trim() || message.text.length > 1_000_000) {
    respond({ ok: false, error: "Choose some text to copy (up to 1 million characters)." });
    return;
  }

  // Serialize requests so two open tabs cannot overwrite the clipboard textarea.
  const job = clipboardQueue.then(() => copyText(message.text));
  clipboardQueue = job.catch(() => {});
  job.then(() => respond({ ok: true }), () => respond({
    ok: false,
    error: "Clipboard access failed. Select the text in the preview and press Ctrl+C (Command+C on Mac)."
  }));
  return true;
});

async function copyText(text) {
  const documentUrl = chrome.runtime.getURL("offscreen.html");
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [documentUrl]
  });
  if (!contexts.length) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["CLIPBOARD"],
      justification: "Copy only the text the user explicitly chooses in the TextLift preview."
    });
  }
  try {
    const result = await chrome.runtime.sendMessage({
      target: "textlift-offscreen", type: "copy", text
    });
    if (!result?.ok) throw new Error("Clipboard write failed");
  } finally {
    await chrome.offscreen.closeDocument().catch(() => {});
  }
}
