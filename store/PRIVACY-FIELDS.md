# TextLift privacy fields

## Single purpose

Help users capture and copy text from webpage elements that are difficult to select, with a local preview for editing and choosing the text to copy.

## Permission justifications

activeTab: Provides temporary access to the active webpage only when the user explicitly invokes TextLift through its toolbar action or keyboard shortcut. This access is needed to read and preview the element the user points at. The extension does not request persistent access to all websites.

scripting: Injects the text extraction and picker interface into the page where the user invokes the extension. The scripts create the hover outline, temporarily intercept picking gestures, and show the editable preview.

clipboardWrite: Writes only the text the user explicitly chooses in the preview to the system clipboard. The extension does not request clipboardRead and never reads clipboard content.

offscreen: Creates a temporary extension document to write the chosen text to the clipboard from Manifest V3, including when the source webpage is HTTP. The field is cleared after the operation and the document is closed.

## Remote code

Select "No, I am not using remote code." All executable extension code is included in the upload ZIP. The GitHub links open only when the user clicks them; they do not supply executable code to the extension.

## Data use

Disclose **Website content**: TextLift reads user-selected webpage text and available labels locally to provide its preview and copy feature. Do not claim that it handles no user data simply because it has no server. Google's [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) explicitly includes local processing in its disclosure requirements.

The current data flow has no transmission to the publisher, analytics, sale, or saved browsing/copy history. The selected webpage text or form value may itself contain personal information, communications, financial details, health information, or other sensitive text. Review the dashboard's definitions of these categories and disclose any applicable categories; describe their handling as local, temporary, and limited to the copy feature. Password-type fields are excluded, but ordinary page text can still contain sensitive information.

The three limited-use certifications are consistent with this implementation: data is not sold or transferred outside permitted uses, used for purposes unrelated to the extension's single purpose, or used for creditworthiness or lending decisions. Read the wording in your dashboard before certifying it.

## Privacy policy URL

https://github.com/ae-mhd/TextLift/blob/main/PRIVACY.md

The bundled options page also links to the same policy content in privacy.html.
