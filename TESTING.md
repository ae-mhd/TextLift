# TextLift validation

Version 1.0.1, tested on Windows in a separate headless Chrome 154.0.8037.95 profile. The extension was loaded from the extracted Chrome Web Store upload ZIP through Chrome's DevTools Extensions API and activated with the real toolbar action, granting activeTab access. The demonstration webpage was supplied by the test runner; no website account was used.

- PASS: Manifest V3 loads in installed Chrome
- PASS: Real toolbar action injects picker using activeTab
- PASS: Hover shows the entire button label
- PASS: Capture does not activate the underlying button
- PASS: Edited text copies through the real offscreen clipboard
- PASS: Copying a selection copies only that substring
- PASS: Offscreen clipboard document closes after copying
- PASS: Normal button clicks resume after capture
- PASS: Pick again captures a website tab without switching it
- PASS: Escape removes the overlay and restores page interaction
- PASS: Invoking the toolbar twice toggles the picker off
- PASS: Hidden DOM text is excluded
- PASS: Link text is captured without following the link
- PASS: Open Shadow DOM text is captured without activating its button
- PASS: An empty icon control offers its accessible label
- PASS: Line breaks survive capture and clipboard copying
- PASS: Unicode and right-to-left text copy correctly
- PASS: Password values are excluded from the preview
- PASS: Empty edited text disables Copy
- PASS: Copy works on an insecure HTTP origin
- PASS: Picker stays above a native modal dialog
- PASS: Preview remains visible at a narrow viewport
- PASS: Restricted Chrome pages show a useful help page
- PASS: Default action shortcut is registered
- PASS: No page JavaScript errors occurred
- PASS: Bundled guide opens the complete local privacy policy

26 checks passed. Clipboard checks used actual extension offscreen copying and browser paste, without mocks. The keyboard shortcut registration was verified; physical shortcut invocation was not automated. Store screenshots were captured directly from this tested package at 1280×800.
