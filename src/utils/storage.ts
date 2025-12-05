import browser from 'webextension-polyfill';

// Define types for Settings and Rules
export type GlobalPolicy = 'disable_non_proxied_udp' | 'default_public_interface_only' | 'default';
export type RuleAction = 'allow' | 'block';

export interface Rule {
    id: string;
    domain: string;
    action: RuleAction;
    note?: string;
    timestamp: number;
}

export interface Settings {
    globalPolicy: GlobalPolicy;
    defaultRule: RuleAction;
    showIconBadge: boolean;
}

export interface AppState {
    settings: Settings;
    rules: Rule[];
    userFilters?: string;
    meta: {
        version: number;
        lastModified: number;
    };
}

/**
 * Default settings for the extension.
 * - globalPolicy: 'default_public_interface_only' balances privacy and functionality.
 * - defaultRule: 'block' ensures maximum privacy for unknown sites.
 */
const DEFAULT_SETTINGS: Settings = {
    globalPolicy: 'default_public_interface_only', // Balanced default
    defaultRule: 'block', // Privacy-first default
    showIconBadge: true,
};

/**
 * Default application state.
 */
const DEFAULT_STATE: AppState = {
    settings: DEFAULT_SETTINGS,
    rules: [],
    meta: {
        version: 1,
        lastModified: Date.now(),
    },
};

export class StorageManager {
    /**
     * Initialize storage with default values if empty
     */
    static async init(): Promise<void> {
        const data = await browser.storage.local.get('settings');
        if (!data.settings) {
            await browser.storage.local.set(DEFAULT_STATE);
        }
    }

    static async getSettings(): Promise<Settings> {
        const { settings } = await browser.storage.local.get('settings');
        return settings || DEFAULT_SETTINGS;
    }

    static async setSettings(settings: Partial<Settings>): Promise<void> {
        const current = await this.getSettings();
        const newSettings = { ...current, ...settings };
        // Clean data (remove Vue proxies)
        const cleanSettings = JSON.parse(JSON.stringify(newSettings)) as Settings;
        await browser.storage.local.set({
            settings: cleanSettings,
            meta: { ...await this.getMeta(), lastModified: Date.now() }
        });
    }

    static async getRules(): Promise<Rule[]> {
        const { rules } = await browser.storage.local.get('rules');
        return rules || [];
    }

    static async setRules(rules: Rule[]): Promise<void> {
        // Clean data (remove Vue proxies)
        const cleanRules = JSON.parse(JSON.stringify(rules)) as Rule[];
        await browser.storage.local.set({
            rules: cleanRules,
            meta: { ...await this.getMeta(), lastModified: Date.now() }
        });
    }

    static async getMeta() {
        const { meta } = await browser.storage.local.get('meta');
        return meta || DEFAULT_STATE.meta;
    }
}
