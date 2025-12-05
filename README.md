# WebRTC Matrix

[中文文档](./README_ZH.md)

**WebRTC Matrix** allows you to manage WebRTC permissions on a per-domain basis. Unlike standard extensions that offer a simple global on/off switch, WebRTC Matrix provides a tiered protection system with domain-specific rules, a global fallback policy, and WebDAV synchronization to keep your privacy settings consistent across devices.

## Features

- **Per-Domain Control**: Toggle WebRTC on/off for specific websites directly from the popup.
- **Global Fallback Policy**: Set a default browser-level policy (e.g., "Default Public Interface Only" or "Disable Non-Proxied UDP") for sites without specific rules.
- **Smart Injection**: Uses DOM-level interception to prevent WebRTC leaks even before the page fully loads.
- **Cloud Sync**: Synchronize your rule list using any WebDAV-compatible server (Phase 2).
- **Modern UI**: Clean, dark-mode friendly interface built with Vue 3.

## Installation

### From Source (Developer Mode)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/somnifex/webrtc-matrix.git
    cd webrtc-matrix
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the extension**:
    ```bash
    npm run build
    # Or for watching changes:
    npm run dev
    ```

4.  **Load in Browser**:
    - **Chrome/Edge**:
        - Go to `chrome://extensions` or `edge://extensions`.
        - Enable **Developer Mode**.
        - Click **Load unpacked**.
        - Select the `dist` folder generated in the project root.

## Usage

### Popup Control
Click the **WebRTC Matrix icon** in your browser toolbar to view the status for the current site.
- **Green**: WebRTC is allowed.
- **Red**: WebRTC is blocked.
- Click the large power button to toggle the rule for the current domain instantly.

### Dashboard (Options)
Right-click the extension icon and select "Options", or click "Dashboard" in the popup.
- **General Settings**: Configure the global fallback policy.
- **Rule Management**: View, search, and delete specific domain rules.
- **Cloud Sync**: Configure your WebDAV server details to backup/restore your rules.

## Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) + [CRXJS](https://crxjs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State**: Chrome Storage API

## License
GPL-3.0
