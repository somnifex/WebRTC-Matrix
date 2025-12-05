import browser from 'webextension-polyfill';
import { StorageManager } from '../utils/storage';
import { PrivacyBlocker } from './blocker';

console.log('WebRTC Matrix: Background service worker started.');

browser.runtime.onInstalled.addListener(async () => {
    console.log('WebRTC Matrix: Extension installed/updated.');
    await StorageManager.init();
    PrivacyBlocker.init();
});

// Also init on normal load (service worker wakeup)
PrivacyBlocker.init();
