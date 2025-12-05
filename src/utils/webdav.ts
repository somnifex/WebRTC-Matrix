/**
 * Simple WebDAV Client for WebRTC Matrix
 */

export interface WebDAVConfig {
    url: string;
    username?: string;
    password?: string;
}

export class WebDAVClient {
    private config: WebDAVConfig;

    constructor(config: WebDAVConfig) {
        this.config = config;
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
        const url = this.config.url.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
        const headers: HeadersInit = {
            'Content-Type': 'application/json', // Default to JSON for our config
        };

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

    /**
     * Test connection to the WebDAV server (PROPFIND on root)
     */
    async checkConnection(): Promise<boolean> {
        try {
            // PROPFIND is standard for checking WebDAV existence/properties
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
            const response = await this.fetch('PUT', filename, content);
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
            const response = await this.fetch('GET', filename);
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (e) {
            console.error('[WebDAV] Download failed', e);
            throw e;
        }
    }
}
