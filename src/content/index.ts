import { StorageManager } from '../utils/storage';
import { matchRule } from '../utils/match';
import { injectionCode } from './injection';

/**
 * Main Logic for Content Script
 * 1. Checks the current hostname against the rules.
 * 2. Determines if blocking is required based on Rule > Global Default.
 * 3. Injects the blocking script (Level 1 Protection) if needed.
 */
async function performCheck() {
    const hostname = window.location.hostname;
    const rules = await StorageManager.getRules();
    const settings = await StorageManager.getSettings();

    // Determine action
    // 1. Check specific rules
    const ruleAction = matchRule(hostname, rules);

    let shouldBlock = false;

    if (ruleAction) {
        shouldBlock = ruleAction === 'block';
    } else {
        // 2. Fallback to default rule (Level 2 concept in doc is Global Browser Policy, but doc also says "Default Rule: allow/block")
        shouldBlock = settings.defaultRule === 'block';
    }

    // DEBUG:
    // console.log(`[WebRTC Matrix] Checking ${hostname}. Action: ${ruleAction || 'default'}. Block: ${shouldBlock}`);

    if (shouldBlock) {
        injectBlocker();
    }
}

/**
 * Injects the script that overrides window.RTCPeerConnection and navigator.mediaDevices.getUserMedia.
 * This runs in the MAIN world (page context) to effectively intercept API calls.
 */
function injectBlocker() {
    const script = document.createElement('script');
    script.textContent = injectionCode;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}

// Run immediately
// Note: transforming to async immediately
performCheck();
