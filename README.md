# Cookie Extractor (minimal)

This is a minimal Chrome/Chromium extension that exports cookies for the currently active tab's domain to a JSON file.

How it works
- The popup queries the active tab URL to determine the domain.
- It calls chrome.cookies.getAll({ domain }) to retrieve cookies for that domain.
- It filters out secure or httpOnly cookies depending on UI checkboxes, then downloads a JSON file.

Load in Chrome/Edge
1. Open chrome://extensions (or edge://extensions).
2. Enable Developer mode.
3. Click "Load unpacked" and select this `cookie-extractor` folder.
4. Open any tab, click the extension icon, then click "Export cookies".

Notes
- This is for debugging and learning; exporting cookies can be sensitive—don't distribute cookie files containing secrets.
- Manifest uses permissions: cookies, tabs, activeTab, storage, and host_permissions for http(s).
