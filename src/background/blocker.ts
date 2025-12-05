import browser from 'webextension-polyfill';
import { StorageManager, GlobalPolicy } from '../utils/storage';

/**
 * Handles Global Privacy Policy logic using the chrome.privacy API.
 * This serves as the Level 2 (Global Fallback) protection.
 */
export class PrivacyBlocker {
    /**
     * Reads current settings and applies the WebRTC IP handling policy to the browser.
     * Supported policies:
     * - default: Browser default
     * - default_public_interface_only: Hide private IPs (Standard privacy)
     * - disable_non_proxied_udp: Force Proxy (High privacy)
     */
    static async applyGlobalPolicy() {
        const settings = await StorageManager.getSettings();
        const policy = settings.globalPolicy;

        console.log(`[PrivacyBlocker] Applying global policy: ${policy}`);

        // Chrome/Edge implementation using chrome.privacy
        if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCIPHandlingPolicy) {
            chrome.privacy.network.webRTCIPHandlingPolicy.set({
                value: policy
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[PrivacyBlocker] Error setting policy:', chrome.runtime.lastError);
                } else {
                    console.log('[PrivacyBlocker] Policy set successfully.');
                }
            });
        } else {
            console.warn('[PrivacyBlocker] privacy.network.webRTCIPHandlingPolicy API not available.');
        }
    }

    static init() {
        // Apply policy on startup
        this.applyGlobalPolicy();

        // Listen for storage changes to update policy in real-time
        browser.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.settings) {
                this.applyGlobalPolicy();
            }
        });
    }
}
