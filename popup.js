// Cookie Manager Pro - Popup Script
class CookieManager {
    constructor() {
        this.currentDomain = '';
        this.cookies = [];
        this.init();
    }

    async init() {
        await this.loadCurrentTab();
        this.setupEventListeners();
        await this.updateCookieCount();
        await this.loadCookies();
    }

    async loadCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                const url = new URL(tab.url);
                this.currentDomain = url.hostname;
                document.getElementById('current-domain').textContent = this.currentDomain;
            } else {
                document.getElementById('current-domain').textContent = 'No active tab';
            }
        } catch (error) {
            console.error('Error loading current tab:', error);
            document.getElementById('current-domain').textContent = 'Error loading domain';
        }
    }

    setupEventListeners() {
        document.getElementById('refresh-domain').addEventListener('click', () => {
            this.loadCurrentTab();
            this.updateCookieCount();
            this.loadCookies();
        });

        document.getElementById('export-current').addEventListener('click', () => {
            this.exportCookies(false);
        });

        document.getElementById('export-all').addEventListener('click', () => {
            this.exportCookies(true);
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        document.getElementById('import-text').addEventListener('input', () => {
            this.updateImportButton();
        });

        document.getElementById('import-cookies').addEventListener('click', () => {
            this.importCookies();
        });

        document.getElementById('clear-import').addEventListener('click', () => {
            this.clearImport();
        });

        document.getElementById('toggle-cookies').addEventListener('click', () => {
            this.toggleCookieList();
        });
    }

    async updateCookieCount() {
        try {
            if (this.currentDomain) {
                const cookies = await chrome.cookies.getAll({ domain: this.currentDomain });
                document.getElementById('cookie-count').textContent = cookies.length;
            } else {
                const allCookies = await chrome.cookies.getAll({});
                document.getElementById('cookie-count').textContent = allCookies.length;
            }
        } catch (error) {
            console.error('Error updating cookie count:', error);
            document.getElementById('cookie-count').textContent = '0';
        }
    }

    async loadCookies() {
        try {
            if (this.currentDomain) {
                this.cookies = await chrome.cookies.getAll({ domain: this.currentDomain });
            } else {
                this.cookies = await chrome.cookies.getAll({});
            }
            this.renderCookieList();
        } catch (error) {
            console.error('Error loading cookies:', error);
            this.showStatus('Error loading cookies', 'error');
        }
    }

    renderCookieList() {
        const cookieList = document.getElementById('cookie-list');
        cookieList.innerHTML = '';

        if (this.cookies.length === 0) {
            cookieList.innerHTML = '<div class="cookie-item text-center">No cookies found</div>';
            return;
        }

        this.cookies.forEach(cookie => {
            const cookieItem = document.createElement('div');
            cookieItem.className = 'cookie-item';

            const infoContainer = document.createElement('div');
            const nameDiv = document.createElement('div');
            nameDiv.className = 'cookie-name';
            nameDiv.textContent = this.escapeHtml(cookie.name);
            const domainDiv = document.createElement('div');
            domainDiv.className = 'cookie-domain';
            domainDiv.textContent = this.escapeHtml(cookie.domain);
            infoContainer.appendChild(nameDiv);
            infoContainer.appendChild(domainDiv);

            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'cookie-actions';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-icon';
            deleteBtn.title = 'Delete cookie';
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/></svg>';
            deleteBtn.addEventListener('click', () => {
                this.deleteCookie(cookie.name, cookie.domain, cookie.path, !!cookie.secure);
            });
            actionsContainer.appendChild(deleteBtn);

            cookieItem.appendChild(infoContainer);
            cookieItem.appendChild(actionsContainer);
            cookieList.appendChild(cookieItem);
        });
    }

    async deleteCookie(name, domain, path, secure) {
        try {
            const normalizedDomain = (domain || '').replace(/^\./, '');
            const normalizedPath = path || '/';
            const scheme = secure ? 'https' : 'http';
            const url = `${scheme}://${normalizedDomain}${normalizedPath}`;
            await chrome.cookies.remove({ url, name });

            this.showStatus('Cookie deleted successfully', 'success');
            await this.loadCookies();
            await this.updateCookieCount();
        } catch (error) {
            console.error('Error deleting cookie:', error);
            this.showStatus('Error deleting cookie', 'error');
        }
    }

    async exportCookies(exportAll = false) {
        try {
            let cookies;
            let filename;

            if (exportAll) {
                cookies = await chrome.cookies.getAll({});
                filename = 'all-cookies.json';
            } else {
                if (!this.currentDomain) {
                    this.showStatus('No domain selected for export', 'error');
                    return;
                }
                cookies = await chrome.cookies.getAll({ domain: this.currentDomain });
                filename = `${this.currentDomain}-cookies.json`;
            }

            const includeSecure = document.getElementById('include-secure').checked;
            const includeHttpOnly = document.getElementById('include-http-only').checked;

            const filteredCookies = cookies.filter(cookie => {
                if (!includeSecure && cookie.secure) return false;
                if (!includeHttpOnly && cookie.httpOnly) return false;
                return true;
            });

            const exportData = {
                exportDate: new Date().toISOString(),
                domain: exportAll ? 'all' : this.currentDomain,
                cookies: filteredCookies.map(cookie => ({
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite,
                    expirationDate: cookie.expirationDate
                }))
            };

            this.downloadJSON(exportData, filename);
            this.showStatus(`Exported ${filteredCookies.length} cookies`, 'success');
        } catch (error) {
            console.error('Error exporting cookies:', error);
            this.showStatus('Error exporting cookies', 'error');
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                document.getElementById('import-text').value = content;
                this.updateImportButton();
            } catch (error) {
                console.error('Error reading file:', error);
                this.showStatus('Error reading file', 'error');
            }
        };
        reader.readAsText(file);
    }

    updateImportButton() {
        const importText = document.getElementById('import-text').value.trim();
        const importButton = document.getElementById('import-cookies');
        importButton.disabled = !importText;
    }

    async importCookies() {
        const importText = document.getElementById('import-text').value.trim();
        if (!importText) {
            this.showStatus('No data to import', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(importText);

            // Accept either { cookies: [...] } or raw array formats
            const cookiesArray = Array.isArray(parsed)
                ? parsed
                : (Array.isArray(parsed.cookies) ? parsed.cookies : null);

            if (!cookiesArray) {
                throw new Error('Invalid cookie data format (expected array or { cookies: [] })');
            }

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const raw of cookiesArray) {
                try {
                    const name = raw.name || raw.cookieName || raw.key;
                    const value = raw.value || raw.cookieValue || raw.val;
                    let domain = (raw.domain || raw.host || raw.domainName || this.currentDomain || '').toString();
                    if (!domain) throw new Error('Missing domain');
                    domain = domain.replace(/^\./, '');

                    const path = (raw.path || '/').toString();
                    const secure = !!(raw.secure || raw.isSecure);
                    const httpOnly = !!(raw.httpOnly || raw.isHttpOnly);

                    // Normalize sameSite
                    const sameSiteRaw = (raw.sameSite || raw.same_site || '').toString().toLowerCase();
                    let sameSite;
                    switch (sameSiteRaw) {
                        case 'strict': sameSite = 'strict'; break;
                        case 'lax': sameSite = 'lax'; break;
                        case 'none':
                        case 'no_restriction': sameSite = 'no_restriction'; break;
                        case 'unspecified': sameSite = 'unspecified'; break;
                        default: sameSite = 'unspecified';
                    }

                    // Normalize expiration
                    const expiration = raw.expirationDate || raw.expiry || raw.expires || undefined;

                    // Enforce Secure when SameSite=None (Chrome requirement)
                    const mustBeSecure = (sameSite === 'no_restriction');
                    const effectiveSecure = mustBeSecure ? true : secure;
                    const scheme = effectiveSecure ? 'https' : 'http';
                    const cookie = {
                        url: `${scheme}://${domain}${path}`,
                        name,
                        value,
                        domain,
                        path,
                        secure: effectiveSecure,
                        httpOnly,
                        sameSite
                    };
                    if (expiration) cookie.expirationDate = Number(expiration);

                    await chrome.cookies.set(cookie);
                    successCount++;
                } catch (e) {
                    errorCount++;
                    errors.push({ name: raw && raw.name, error: e && e.message });
                    console.error('Error importing cookie:', raw && raw.name, e);
                }
            }

            if (successCount > 0) {
                this.showStatus(`Imported ${successCount} cookies successfully`, 'success');
                await this.loadCookies();
                await this.updateCookieCount();
            }

            if (errorCount > 0) {
                this.showStatus(`${errorCount} cookies failed to import`, 'error');
            }

        } catch (error) {
            console.error('Error parsing import data:', error);
            this.showStatus('Invalid JSON format', 'error');
        }
    }

    clearImport() {
        document.getElementById('import-text').value = '';
        document.getElementById('import-file').value = '';
        this.updateImportButton();
    }

    toggleCookieList() {
        const cookieList = document.getElementById('cookie-list');
        const toggleButton = document.getElementById('toggle-cookies');
        
        if (cookieList.classList.contains('hidden')) {
            cookieList.classList.remove('hidden');
            toggleButton.textContent = 'Hide';
        } else {
            cookieList.classList.add('hidden');
            toggleButton.textContent = 'Show';
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.classList.remove('hidden');

        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let cookieManager;
document.addEventListener('DOMContentLoaded', () => {
    cookieManager = new CookieManager();
});


