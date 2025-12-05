import browser from 'webextension-polyfill';
import { StorageManager } from '../utils/storage';
import { matchRule } from '../utils/match';

/**
 * Handles Global Privacy Policy logic using the chrome.privacy API.
 * This serves as the Level 2 (Global Fallback) protection.
 */
export class PrivacyBlocker {
    // Cache the current applied policy to avoid unnecessary API calls
    private static currentPolicy: string | null = null;

    /**
     * Reads current settings and applies the WebRTC IP handling policy to the browser.
     * Supported policies:
     * - default: Browser default
     * - default_public_interface_only: Hide private IPs (Standard privacy)
     * - disable_non_proxied_udp: Force Proxy (High privacy)
     * 
     * @param contextUrl Optional URL to check for specific rules that override global policy
     */
    static async applyGlobalPolicy(contextUrl?: string) {
        const settings = await StorageManager.getSettings();
        let policy = settings.globalPolicy;

        // Dynamic Policy Switching:
        // The chrome.privacy.network.webRTCIPHandlingPolicy setting is GLOBAL for the entire browser.
        // It cannot be set per-tab or per-origin via the API directly.
        // To support "Allow" rules (which require relaxed policy) when the global policy is "Force Proxy",
        // we must dynamically relax the GLOBAL policy whenever the user is interacting with an ALLOWED site.
        // 
        // Logic:
        // 1. If contextUrl is provided (active tab), check if it matches an ALLOW rule.
        // 2. If it matches, temporarily change the global policy to 'default' (or a lesser restriction).
        // 3. If it doesn't match, or if no context is active, enforce the user's selected global policy.
        if (contextUrl) {
            try {
                const urlObj = new URL(contextUrl);
                const hostname = urlObj.hostname;
                const rules = await StorageManager.getRules();
                const matchedAction = matchRule(hostname, rules);

                if (matchedAction === 'allow') {
                    console.log(`[PrivacyBlocker] Domain ${hostname} is ALLOWED. Relaxing global policy.`);
                    // Relax to default so WebRTC works fully.
                    // This affects ALL tabs while this site is active.
                    policy = 'default';
                }
            } catch (e) {
                // Invalid URL or other error, fallback to global policy
                console.warn('[PrivacyBlocker] Invalid context URL:', contextUrl);
            }
        }

        // Optimization: Don't re-apply if it's the same policy to avoid API overhead
        if (this.currentPolicy === policy) {
            return;
        }

        console.log(`[PrivacyBlocker] Applying global policy: ${policy} (Context: ${contextUrl || 'Global'})`);

        // Chrome/Edge implementation using chrome.privacy
        if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCIPHandlingPolicy) {
            chrome.privacy.network.webRTCIPHandlingPolicy.set({
                value: policy
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[PrivacyBlocker] Error setting policy:', chrome.runtime.lastError);
                } else {
                    console.log('[PrivacyBlocker] Policy set successfully.');
                    this.currentPolicy = policy;
                }
            });
        } else {
            console.warn('[PrivacyBlocker] privacy.network.webRTCIPHandlingPolicy API not available.');
        }
    }

    static init() {
        // Apply policy on startup (no context)
        this.applyGlobalPolicy();

        // Listen for storage changes
        browser.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && (changes.settings || changes.rules)) {
                // Re-evaluate with current active tab if possible, or just global
                // For simplicity, just global first, active tab listener in index.ts will pick it up
                // if the user is currently on that tab.
                this.applyGlobalPolicy();
            }
            // Note: If rules changed, we might need to re-apply policy for the *current* tab immediately.
            // Ideally we'd get the active tab here too.
        });
    }
}
