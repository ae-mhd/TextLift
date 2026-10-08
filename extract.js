(() => {
  "use strict";
  if (globalThis.TextLiftText) return;

  const interactive = "button,a,[role='button'],[role='tab'],[role='menuitem'],[role='option'],label,summary,input,textarea,select";
  const ignored = "script,style,noscript,template,[hidden]";

  function parentOf(element) {
    return element.assignedSlot || element.parentElement || element.getRootNode()?.host || null;
  }

  function visible(element) {
    if (!element || element.matches(ignored)) return false;
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse" &&
      Number(style.opacity) !== 0 && style.contentVisibility !== "hidden" &&
      (style.display === "contents" || (rect.width > 0 && rect.height > 0));
  }

  function normalize(text) {
    return String(text || "").replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ")
      .replace(/[\t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function visibleText(element) {
    // Read rendered text nodes rather than textContent, which includes hidden text.
    // This also traverses open shadow roots and assigned slots in web components.
    const pieces = [];
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.parentElement && visible(node.parentElement)) {
          const whitespace = node.ownerDocument.defaultView.getComputedStyle(node.parentElement).whiteSpace;
          pieces.push(/^(pre|break-spaces)/.test(whitespace) ? node.nodeValue : node.nodeValue.replace(/\s+/g, " "));
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.tagName === "BR") { pieces.push("\n"); return; }
      if (!visible(node) || node.matches("input,textarea,select")) return;
      const view = node.ownerDocument.defaultView;
      const display = view.getComputedStyle(node).display;
      const block = /^(block|flex|grid|list-item|table-row|flow-root)/.test(display);
      if (block) pieces.push("\n");
      let children = node.shadowRoot?.childNodes || node.childNodes;
      if (node.tagName === "SLOT") {
        const assigned = node.assignedNodes({ flatten: true });
        if (assigned.length) children = assigned;
      }
      for (const child of children) walk(child);
      if (display === "table-cell") pieces.push("\t");
      if (block) pieces.push("\n");
    };
    walk(element);
    return normalize(pieces.join(""));
  }

  function read(element) {
    if (!visible(element)) return null;
    if (element.matches("input[type='password']")) return { text: "", reason: "Password fields are excluded." };
    let text = "";
    if (element.matches("input,textarea")) {
      text = normalize(element.value);
    } else if (element.tagName === "SELECT") {
      text = normalize(Array.from(element.selectedOptions, (option) => option.text).join("\n"));
    } else {
      text = visibleText(element);
    }
    if (text) return { element, text, source: "Visible text" };
    const label = normalize(element.getAttribute("aria-label") ||
      (element.tagName === "IMG" ? element.getAttribute("alt") : "") || element.getAttribute("title"));
    if (label) return { element, text: label, source: "Accessible label" };
    return null;
  }

  function pick(start) {
    if (!(start instanceof Element)) return null;
    if (start.tagName === "IFRAME") return { text: "", reason: "Embedded pages are not supported in this version." };
    // Treat an entire button or tab as one label even when the pointer hits a nested icon.
    for (let element = start; element && !element.matches("body,html"); element = parentOf(element)) {
      if (element.matches(interactive)) {
        const result = read(element);
        if (result) return result;
        break;
      }
    }
    // Prefer a small, nearby text element instead of capturing a whole page.
    let depth = 0;
    for (let element = start; element && depth < 4 && !element.matches("body,html"); element = parentOf(element), depth++) {
      const result = read(element);
      if (result) return result;
    }
    return null;
  }

  globalThis.TextLiftText = Object.freeze({ pick, normalize });
})();
