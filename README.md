# Cookie Extractor (minimal)

Chrome/Chromium extension that automatically exports cookies for websites you visit. No need to open the popup!

## Features
- **Automatic Export**: Cookies are automatically exported when:
  - You visit a new website (tab URL changes)
  - Every 5 minutes for the active tab
- **Keyboard Shortcut**: Press `Ctrl+Shift+E` (Windows/Linux) or `Command+Shift+E` (Mac) to manually trigger export
- **File Format**: Cookies are saved as JSON files with timestamp in filename
- **Filtering**: Configurable to include/exclude secure and httpOnly cookies

## Installation
1. Open chrome://extensions (or edge://extensions)
2. Enable Developer mode
3. Click "Load unpacked" and select this `cookie-extractor` folder

## How it works
- The extension runs in the background and monitors your browsing
- When you visit a new site, it automatically saves that site's cookies
- Files are saved as `domain-name-TIMESTAMP.json` in your downloads folder
- You can still use the popup to manually export if needed

## Settings
Default settings (stored in chrome.storage.local):
- Auto-export enabled: true
- Include secure cookies: true
- Include HttpOnly cookies: true
- Export interval: 5 minutes

## Security Note
- This extension will automatically download cookie data
- Cookie files may contain sensitive information
- Be careful with the exported files and don't share them
- Consider disabling auto-export and using the keyboard shortcut instead if security is a concern

## Privacy
- Files are saved locally only
- No data is sent to any remote servers
- You can review the code to verify this
