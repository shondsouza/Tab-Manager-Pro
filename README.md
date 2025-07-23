# Tab Manager Pro

Tab Manager Pro is a Chrome extension designed to help users manage their browser tabs efficiently. This project provides a user-friendly interface for organizing, searching, and navigating through open tabs.

## Project Structure

```
smart-tab
├── manifest.json
├── popup.html
├── popup.js
├── popup.css
├── background.js
├── icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Files Description

- **manifest.json**: Contains metadata for the Chrome extension, including the manifest version, name, permissions, and the default popup file.
  
- **popup.html**: Defines the structure of the popup interface that appears when the extension icon is clicked. It includes HTML elements for user interaction.

- **popup.js**: Contains the JavaScript code that handles the logic for the popup, including event listeners and interactions with the Chrome extension APIs.

- **popup.css**: Contains the styles for the popup interface, defining the visual appearance of the HTML elements.

- **background.js**: Contains the background script for the extension, which runs in the background and can handle events, manage tabs, and perform tasks that do not require user interaction.

- **icons/**: Directory containing the icons for the extension.
  - **icon16.png**: 16x16 pixel icon used for the extension in the browser toolbar.
  - **icon48.png**: 48x48 pixel icon used for the extension in the Chrome Web Store and other places.
  - **icon128.png**: 128x128 pixel icon used for the extension in the Chrome Web Store and other places.

## Installation

1. Clone the repository or download the project files.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the `smart-tab` directory.
5. The Tab Manager Pro extension should now be installed and visible in your extensions list.

## Usage

- Click on the Tab Manager Pro icon in the browser toolbar to open the popup interface.
- Use the provided features to manage your tabs effectively.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.