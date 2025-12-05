import browser from 'webextension-polyfill';
import { StorageManager } from '../utils/storage';
import { PrivacyBlocker } from './blocker';

console.log('WebRTC Matrix: Background service worker started.');

// Helper to check active tab and apply context-aware policy
async function checkActiveTab() {
    try {
        const queryOptions = { active: true, currentWindow: true };
        const [tab] = await browser.tabs.query(queryOptions);
        if (tab && tab.url) {
            // Apply policy based on the specific URL of the active tab.
            await PrivacyBlocker.applyGlobalPolicy(tab.url);
        } else {
            // No active tab or no URL (e.g. devtools), revert to global policy.
            await PrivacyBlocker.applyGlobalPolicy();
        }
    } catch (e) {
        console.error('[Background] Error checking active tab:', e);
    }
}

browser.runtime.onInstalled.addListener(async () => {
    console.log('WebRTC Matrix: Extension installed/updated.');
    await StorageManager.init();
    PrivacyBlocker.init();
    // Check initial tab on startup to ensure correct policy is applied immediately.
    checkActiveTab();
});

// Watch for tab activation (switching tabs).
// When user switches tabs, we must re-evaluate the policy for the new context.
browser.tabs.onActivated.addListener(() => {
    checkActiveTab();
});

// Watch for tab updates (navigation in current tab)
browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
        // Only check if it's the active tab
        if (tab.active) {
            PrivacyBlocker.applyGlobalPolicy(tab.url);
        }
    }
});

// Watch for window focus changes
browser.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== browser.windows.WINDOW_ID_NONE) {
        checkActiveTab();
    }
});

// Also init on normal load (service worker wakeup)
PrivacyBlocker.init();

