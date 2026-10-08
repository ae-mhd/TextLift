(() => {
  "use strict";
  const key = "__textLiftPickerV1";
  if (globalThis[key]) { globalThis[key].close(); return; }
  if (!document.documentElement) return;

  const previousFocus = document.activeElement;
  const lifetime = new AbortController();
  let phase = "picking";
  let candidate = null;
  let lastPoint = null;
  let frame = 0;
  let revision = 0;

  const host = document.createElement("div");
  host.id = "textlift-overlay";
  host.setAttribute("popover", "manual");
  for (const [property, value] of Object.entries({
    all: "initial", position: "fixed", inset: "0", width: "100%", height: "100%",
    margin: "0", padding: "0", border: "0", background: "transparent",
    "pointer-events": "none", "z-index": "2147483647", overflow: "visible"
  })) host.style.setProperty(property, value, "important");

  const shadow = host.attachShadow({ mode: "open" });
  // Only this constant markup is parsed. Website text is assigned via .value/textContent.
  shadow.innerHTML = `
    <style>
      :host { color-scheme: light; }
      :host::backdrop { background: transparent; pointer-events: none; }
      *, *::before, *::after { box-sizing: border-box; }
      [hidden] { display: none !important; }
      .shield { position: fixed; inset: 0; cursor: crosshair; pointer-events: auto; }
      .outline { position: fixed; pointer-events: none; border: 2px solid #087c69; border-radius: 5px; background: #087c6912; box-shadow: 0 0 0 3px #ffffffb3; }
      .panel { position: fixed; right: 24px; bottom: 24px; width: min(370px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow: auto; pointer-events: auto; padding: 22px; border: 1px solid #d6dfdb; border-radius: 20px; background: #fbfcf9; box-shadow: 0 16px 60px #143b3233, 0 2px 8px #143b3210; color: #193b32; font: 14px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; text-align: left; direction: ltr; }
      .header, .actions, .meta { display: flex; align-items: center; gap: 10px; }
      .header { justify-content: space-between; margin-bottom: 20px; }
      .brand { display: flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 750; letter-spacing: -.3px; }
      .mark { width: 25px; height: 27px; border: 2px solid #087c69; border-radius: 5px; box-shadow: -4px 4px 0 #dfebe5; position: relative; }
      .mark::after { content: ''; position: absolute; left: 5px; right: 5px; top: 7px; height: 2px; background: #087c69; box-shadow: 0 5px 0 #087c69; }
      button { appearance: none; font: inherit; cursor: pointer; border-radius: 10px; padding: 10px 14px; border: 1px solid #d3ded7; background: white; color: #21483d; font-weight: 650; line-height: 1.3; }
      button:hover { background: #eef4ee; }
      button:focus-visible, textarea:focus-visible { outline: 3px solid #ecb351; outline-offset: 3px; }
      .close { border: 0; background: transparent; padding: 5px 9px; font-size: 19px; }
      h2 { margin: 0 0 6px; font-size: 25px; font-weight: 750; letter-spacing: -.9px; line-height: 1.2; }
      .description { margin: 0 0 18px; color: #597267; font-size: 13px; }
      .meta { justify-content: space-between; margin-bottom: 7px; font-size: 11px; letter-spacing: .4px; }
      label { font-weight: 750; text-transform: uppercase; }
      .source { color: #647b6f; }
      textarea { display: block; width: 100%; min-height: 110px; max-height: 260px; resize: vertical; padding: 12px; border: 1px solid #d4ddd6; border-radius: 11px; background: white; color: #234337; font: 14px/1.55 system-ui, sans-serif; user-select: text; -webkit-user-select: text; }
      textarea[readonly] { background: #f0f4ef; }
      .status { min-height: 36px; margin: 10px 0 12px; color: #5a7267; font-size: 12px; }
      .status[data-tone='success'] { color: #087c69; font-weight: 650; }
      .status[data-tone='error'] { color: #a13b24; }
      .actions { gap: 8px; }
      .primary { flex: 1; background: #087c69; border-color: #087c69; color: white; }
      .primary:hover { background: #066452; }
      .primary:disabled { cursor: default; background: #c7d5cc; border-color: #c7d5cc; color: #eef3ee; }
      .footer { margin-top: 15px; font-size: 11px; color: #758579; }
      kbd { font: inherit; font-weight: 650; color: #40604f; }
      @media (max-width: 500px) { .panel { right: 12px; bottom: 12px; padding: 18px; } }
      @media (forced-colors: active) { .outline { border-color: Highlight; } .panel, textarea, button { border: 1px solid CanvasText; } }
    </style>
    <div class="shield" aria-hidden="true"></div>
    <div class="outline" hidden aria-hidden="true"></div>
    <section class="panel" role="dialog" aria-labelledby="textlift-title" aria-describedby="description">
      <div class="header"><div class="brand"><span class="mark" aria-hidden="true"></span>TextLift</div><button class="close" aria-label="Close TextLift" title="Close (Esc)">×</button></div>
      <h2 id="textlift-title">Point. Pick. Copy.</h2>
      <p class="description" id="description">Hover over a button, tab, or label. Click to capture its text.</p>
      <div class="meta"><label for="preview">Text under pointer</label><span class="source"></span></div>
      <textarea id="preview" dir="auto" readonly spellcheck="false" placeholder="Your text will appear here…"></textarea>
      <p class="status" role="status" aria-live="polite">Picking is on. Page clicks are paused.</p>
      <div class="actions"><button class="repick" hidden>Pick again</button><button class="primary" disabled>Copy text</button></div>
      <div class="footer"><kbd>Esc</kbd> to close · Text stays on your device</div>
    </section>`;

  const $ = (selector) => shadow.querySelector(selector);
  const shield = $(".shield");
  const outline = $(".outline");
  const panel = $(".panel");
  const preview = $("textarea");
  const status = $(".status");
  const copyButton = $(".primary");

  function on(target, type, listener, options = {}) {
    target.addEventListener(type, listener, { ...options, signal: lifetime.signal });
  }

  function tell(text, tone = "") {
    status.textContent = text;
    status.dataset.tone = tone;
  }

  function close() {
    if (phase === "closed") return;
    const restoreFocus = phase === "picking" || shadow.contains(shadow.activeElement);
    phase = "closed";
    lifetime.abort();
    cancelAnimationFrame(frame);
    host.remove();
    if (globalThis[key]?.close === close) delete globalThis[key];
    if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }

  function elementAt(x, y) {
    shield.style.pointerEvents = "none";
    let element;
    try {
      element = document.elementFromPoint(x, y);
      while (element?.shadowRoot) {
        const deeper = element.shadowRoot.elementFromPoint(x, y);
        if (!deeper || deeper === element) break;
        element = deeper;
      }
    } finally { shield.style.pointerEvents = ""; }
    return element;
  }

  function updateCandidate(x, y) {
    candidate = globalThis.TextLiftText.pick(elementAt(x, y));
    preview.value = candidate?.text || "";
    $(".source").textContent = candidate?.source || "";
    outline.hidden = !candidate?.element;
    if (candidate?.element) {
      const rect = candidate.element.getBoundingClientRect();
      Object.assign(outline.style, {
        left: `${rect.left - 3}px`, top: `${rect.top - 3}px`,
        width: `${rect.width + 6}px`, height: `${rect.height + 6}px`
      });
    }
    tell(candidate?.reason || (candidate?.text ? "Click to capture this text." : "Point at some text. Images may have no readable text."));
  }

  function refresh() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (phase === "picking" && lastPoint) updateCandidate(lastPoint.x, lastPoint.y);
    });
  }

  function isPanelEvent(event) { return event.composedPath().includes(panel); }
  function stop(event) { event.preventDefault(); event.stopImmediatePropagation(); }

  function lockCandidate(event) {
    if (phase !== "picking" || isPanelEvent(event)) return;
    stop(event);
    if (event.button !== 0) return;
    updateCandidate(event.clientX, event.clientY);
    if (!candidate?.text) return;
    phase = "preview";
    revision++;
    shield.hidden = true;
    outline.hidden = true;
    preview.readOnly = false;
    $("h2").textContent = "Make it yours.";
    $(".description").textContent = "Edit the text, or select just the words you want to copy.";
    $("label").textContent = "Captured text";
    $(".repick").hidden = false;
    copyButton.disabled = false;
    tell("Text captured. The page is active again.");
    preview.focus({ preventScroll: true });
    preview.setSelectionRange(0, 0);
  }

  function startAgain() {
    revision++;
    phase = "picking";
    candidate = null;
    lastPoint = null;
    shield.hidden = false;
    outline.hidden = true;
    preview.value = "";
    preview.readOnly = true;
    $("h2").textContent = "Point. Pick. Copy.";
    $(".description").textContent = "Hover over a button, tab, or label. Click to capture its text.";
    $("label").textContent = "Text under pointer";
    $(".source").textContent = "";
    $(".repick").hidden = true;
    copyButton.disabled = true;
    copyButton.textContent = "Copy text";
    tell("Picking is on. Page clicks are paused.");
    $(".close").focus({ preventScroll: true });
  }

  function selectedText() {
    const { selectionStart, selectionEnd, value } = preview;
    return selectionEnd > selectionStart ? value.slice(selectionStart, selectionEnd) : value;
  }

  function updateCopyButton() {
    if (phase !== "preview") return;
    copyButton.disabled = !selectedText().trim();
    copyButton.textContent = preview.selectionEnd > preview.selectionStart ? "Copy selection" : "Copy text";
  }

  async function copy() {
    if (phase !== "preview" || copyButton.disabled) return;
    const text = selectedText();
    if (!text.trim()) return;
    const operation = revision;
    copyButton.disabled = true;
    tell("Copying…");
    try {
      const result = await chrome.runtime.sendMessage({ target: "textlift-background", type: "copy", text });
      if (!result?.ok) throw new Error(result?.error || "Clipboard access failed. Select the preview text and copy it manually.");
      if (phase === "preview" && revision === operation) tell("Copied to clipboard.", "success");
    } catch (error) {
      if (phase === "preview" && revision === operation) tell(error.message, "error");
    } finally {
      if (phase === "preview" && revision === operation) updateCopyButton();
    }
  }

  on(window, "pointermove", (event) => {
    if (phase !== "picking" || isPanelEvent(event)) return;
    lastPoint = { x: event.clientX, y: event.clientY };
    refresh();
  }, { capture: true });

  // A transparent shield receives these gestures instead of the site's buttons.
  // Event suppression supplements the shield for delegated click handlers.
  for (const type of ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "auxclick", "contextmenu", "dragstart"]) {
    on(window, type, (event) => {
      if (phase === "picking" && !isPanelEvent(event)) stop(event);
    }, { capture: true });
  }
  on(window, "click", lockCandidate, { capture: true });
  on(window, "keydown", (event) => {
    if (event.key === "Escape") { stop(event); close(); return; }
    if (isPanelEvent(event)) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { stop(event); void copy(); }
      return;
    }
    if (phase === "picking" && ["Enter", " ", "Tab"].includes(event.key)) {
      stop(event);
      $(".close").focus({ preventScroll: true });
    }
  }, { capture: true });
  on(window, "scroll", refresh, { capture: true, passive: true });
  on(window, "resize", refresh, { passive: true });
  on(window, "pagehide", close);
  on(window, "popstate", close);
  on($(".close"), "click", close);
  on($(".repick"), "click", startAgain);
  on(copyButton, "click", () => void copy());
  for (const type of ["input", "select", "keyup", "pointerup"]) on(preview, type, updateCopyButton);
  on(preview, "input", () => { revision++; tell("Ready to copy your edited text."); });

  globalThis[key] = Object.freeze({ close });
  document.documentElement.append(host);
  try { host.showPopover(); } catch { host.removeAttribute("popover"); }
  $(".close").focus({ preventScroll: true });
})();
