# Upload TextLift to the Chrome Web Store

TextLift 1.0.1 is prepared for a first Chrome Web Store submission. Upload the extension package, then add the separate listing text and images in your developer account. The package and documentation do not constitute store approval.

## Developer account

Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Register with the Google account that should own the extension and pay the one-time registration fee shown there. [Google's registration instructions](https://developer.chrome.com/docs/webstore/register/)

Set your publisher name and verify your contact email. Enable 2-Step Verification before publishing. Complete any additional account or trader-status verification requested by your dashboard. [Account setup](https://developer.chrome.com/docs/webstore/set-up-account), [2-Step Verification requirement](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification)

## Extension package

Use **TextLift-1.0.1-chrome-web-store.zip** for the extension upload. Its manifest is at the ZIP root, as required by [Google's packaging instructions](https://developer.chrome.com/docs/webstore/prepare). The original TextLift-v1.zip and GitHub's Download ZIP archive are source downloads and have a containing folder; they are not the store upload package.

To rebuild the package from this repository on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/package-store.ps1
```

The script writes the upload ZIP to dist/. It includes the manifest, executable source, help page, bundled privacy policy, and icons. Listing images and repository files stay outside that ZIP.

## Create the item and listing

1. In the dashboard, choose **Add new item** and upload the extension package.
2. In **Store listing**, copy the name, description, and URLs from [LISTING.md](LISTING.md).
3. Upload assets/store-icon-128.png, assets/promo-440x280.png, and the two screenshot files in assets/.
4. In **Privacy**, copy the single purpose and permission justifications from [PRIVACY-FIELDS.md](PRIVACY-FIELDS.md). Declare local webpage-content handling accurately, provide the policy URL, and read the limited-use certifications before accepting them.
5. In **Distribution**, choose your intended visibility and countries. Public is suitable for a general release; private trusted testers can be used for a trial.
6. In **Test instructions**, paste the instructions below. No reviewer login is required.
7. Resolve any dashboard validation errors, then choose **Submit for Review**. For control over the release date, choose deferred publishing and publish manually after approval.

[Google's submission instructions](https://developer.chrome.com/docs/webstore/publish/)

## Reviewer test instructions

No account, payment, or external service is required to use TextLift.

1. Open https://example.com, then click the TextLift toolbar icon.
2. Hover over the "Learn more" link. Its label should appear in the preview with a green outline.
3. Click the link while picking. TextLift should capture its label without navigating.
4. Edit the preview or select part of its text, then click Copy text or Copy selection. Paste into an ordinary text field or editor to verify the clipboard result.
5. Choose Pick again to capture another element. Press Escape to close. Ordinary page clicks should work again.

The default shortcut is Alt+Shift+L. If it is already assigned, use the toolbar icon or change the shortcut in chrome://extensions/shortcuts.

Chrome's internal pages, the Chrome Web Store, and some built-in viewers block picker injection. Images, canvas text, embedded frames, and closed web components are outside version 1's scope. This is documented in the listing and help page.

## Images and future updates

The promotional tile is 440×280. The two genuine screenshots are 1280×800, and the 128×128 icon has transparent padding. These dimensions follow [Google's image guidelines](https://developer.chrome.com/docs/webstore/images).

For each later package upload, increase manifest.json's version and rebuild the entire extension ZIP. Existing store users receive updates through the store after review and publication. [Updating an item](https://developer.chrome.com/docs/webstore/update)
