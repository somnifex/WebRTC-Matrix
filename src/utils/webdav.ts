/**
 * Simple WebDAV Client for WebRTC Matrix
 */

export interface WebDAVConfig {
    url: string;
    username?: string;
    password?: string;
}

const APP_DIRECTORY = 'webrtc-matrix';

export class WebDAVClient {
    private config: WebDAVConfig;

    constructor(config: WebDAVConfig) {
        this.config = config;
    }

    private normalizeBaseUrl(): string {
        return this.config.url.replace(/\/+$/, '');
    }

    private isBaseAlreadyAppDirectory(): boolean {
        const normalized = this.normalizeBaseUrl();
        const segments = normalized.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        return !!last && last.toLowerCase() === APP_DIRECTORY;
    }

    private normalizePath(path: string): string {
        return path.replace(/^\/+/, '');
    }

    private buildUrl(path: string = ''): string {
        const base = this.normalizeBaseUrl();
        const cleanedPath = this.normalizePath(path);
        return cleanedPath ? `${base}/${cleanedPath}` : base;
    }

    /**
     * Generates the Basic Auth header from stored credentials.
     * Note: In a production environment, consider more secure storage than cleartext in local/session storage.
     */
    private getAuthHeader(): string {
        if (this.config.username && this.config.password) {
            return 'Basic ' + btoa(`${this.config.username}:${this.config.password}`);
        }
        return '';
    }

    private async fetch(method: string, path: string = '', body?: string | Blob): Promise<Response> {
        const url = this.buildUrl(path);
        const headers: HeadersInit = {};

        if (body && typeof body === 'string') {
            headers['Content-Type'] = 'application/json';
        }

        const auth = this.getAuthHeader();
        if (auth) {
            headers['Authorization'] = auth;
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body
            });
            return response;
        } catch (e) {
            console.error('[WebDAV] Request failed', e);
            throw e;
        }
    }

    private withAppDirectory(path: string): string {
        const cleanedPath = this.normalizePath(path);
        if (this.isBaseAlreadyAppDirectory()) return cleanedPath;
        return `${APP_DIRECTORY}/${cleanedPath}`;
    }

    private async ensureAppDirectory(): Promise<void> {
        if (this.isBaseAlreadyAppDirectory()) return;

        const appDirPath = `${APP_DIRECTORY}/`;

        try {
            const existing = await this.fetch('PROPFIND', appDirPath);
            if (existing.ok || existing.status === 207) {
                return;
            }
        } catch (e) {
            // Ignore fetch failures here; we'll attempt to create the directory next.
        }

        const created = await this.fetch('MKCOL', appDirPath);
        if (created.status === 405) {
            return; // Already exists on some servers but MKCOL not allowed.
        }

        if (!(created.ok || created.status === 201 || created.status === 204)) {
            throw new Error(`[WebDAV] Failed to create "${APP_DIRECTORY}" directory (status ${created.status}).`);
        }
    }

    /**
     * Test connection to the WebDAV server (PROPFIND on root)
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await this.fetch('PROPFIND', '', undefined);
            return response.ok || response.status === 207; // 207 Multi-Status is success for WebDAV
        } catch (e) {
            return false;
        }
    }

    /**
     * Upload configuration file
     */
    async uploadConfig(filename: string, content: string): Promise<boolean> {
        try {
            await this.ensureAppDirectory();
            const targetPath = this.withAppDirectory(filename);
            const response = await this.fetch('PUT', targetPath, content);
            return response.ok || response.status === 201 || response.status === 204;
        } catch (e) {
            console.error('[WebDAV] Upload failed', e);
            throw e;
        }
    }

    /**
     * Download configuration file
     */
    async downloadConfig(filename: string): Promise<string | null> {
        try {
            const targetPath = this.withAppDirectory(filename);
            const response = await this.fetch('GET', targetPath);
            if (response.status === 404 && !this.isBaseAlreadyAppDirectory()) {
                const fallback = await this.fetch('GET', filename);
                if (fallback.status === 404) return null;
                if (!fallback.ok) throw new Error(`HTTP ${fallback.status}`);
                return await fallback.text(); // Backward compatibility for existing uploads.
            }

            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (e) {
            console.error('[WebDAV] Download failed', e);
            throw e;
        }
    }
}
