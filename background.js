// Cookie Manager Pro - Background Service Worker (ported)

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.local.set({
            'cookie-manager-installed': true,
            'install-date': new Date().toISOString(),
            'version': chrome.runtime.getManifest().version
        });
    } else if (details.reason === 'update') {
        chrome.storage.local.set({
            'last-update': new Date().toISOString(),
            'version': chrome.runtime.getManifest().version
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getCookies':
            handleGetCookies(request, sendResponse);
            return true;
        case 'setCookie':
            handleSetCookie(request, sendResponse);
            return true;
        case 'removeCookie':
            handleRemoveCookie(request, sendResponse);
            return true;
        case 'exportCookies':
            handleExportCookies(request, sendResponse);
            return true;
        case 'importCookies':
            handleImportCookies(request, sendResponse);
            return true;
        case 'getCurrentTab':
            handleGetCurrentTab(sendResponse);
            return true;
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

async function handleGetCookies(request, sendResponse) {
    try {
        const { domain, allDomains } = request;
        let cookies;
        if (allDomains) {
            cookies = await chrome.cookies.getAll({});
        } else if (domain) {
            cookies = await chrome.cookies.getAll({ domain });
        } else {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                const url = new URL(tab.url);
                cookies = await chrome.cookies.getAll({ domain: url.hostname });
            } else {
                cookies = [];
            }
        }
        sendResponse({ success: true, cookies });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function handleSetCookie(request, sendResponse) {
    try {
        const { cookie } = request;
        if (!cookie || !cookie.name || !cookie.value) {
            throw new Error('Invalid cookie data');
        }
        const cookieToSet = {
            url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path || '/'}`,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            secure: cookie.secure || false,
            httpOnly: cookie.httpOnly || false,
            sameSite: cookie.sameSite || 'no_restriction'
        };
        if (cookie.expirationDate) {
            cookieToSet.expirationDate = cookie.expirationDate;
        }
        const result = await chrome.cookies.set(cookieToSet);
        sendResponse({ success: true, cookie: result });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function handleRemoveCookie(request, sendResponse) {
    try {
        const { name, domain, path } = request;
        if (!name || !domain) {
            throw new Error('Cookie name and domain are required');
        }
        const url = `http://${domain}${path || '/'}`;
        const result = await chrome.cookies.remove({ url, name });
        sendResponse({ success: true, removed: result });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function handleExportCookies(request, sendResponse) {
    try {
        const { domain, allDomains, includeSecure, includeHttpOnly } = request;
        let cookies;
        if (allDomains) {
            cookies = await chrome.cookies.getAll({});
        } else if (domain) {
            cookies = await chrome.cookies.getAll({ domain });
        } else {
            cookies = await chrome.cookies.getAll({});
        }
        const filteredCookies = cookies.filter(cookie => {
            if (!includeSecure && cookie.secure) return false;
            if (!includeHttpOnly && cookie.httpOnly) return false;
            return true;
        });
        const exportData = {
            exportDate: new Date().toISOString(),
            domain: allDomains ? 'all' : domain,
            version: chrome.runtime.getManifest().version,
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
        sendResponse({ success: true, data: exportData });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function handleImportCookies(request, sendResponse) {
    try {
        const { cookies } = request;
        if (!cookies || !Array.isArray(cookies)) {
            throw new Error('Invalid cookie data format');
        }
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        for (const cookieData of cookies) {
            try {
                const cookie = {
                    url: `http${cookieData.secure ? 's' : ''}://${cookieData.domain}${cookieData.path || '/'}`,
                    name: cookieData.name,
                    value: cookieData.value,
                    domain: cookieData.domain,
                    path: cookieData.path || '/',
                    secure: cookieData.secure || false,
                    httpOnly: cookieData.httpOnly || false,
                    sameSite: cookieData.sameSite || 'no_restriction'
                };
                if (cookieData.expirationDate) {
                    cookie.expirationDate = cookieData.expirationDate;
                }
                await chrome.cookies.set(cookie);
                successCount++;
            } catch (error) {
                errorCount++;
                errors.push({ name: cookieData.name, error: error.message });
            }
        }
        sendResponse({ success: true, successCount, errorCount, errors: errors.length ? errors : undefined });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function handleGetCurrentTab(sendResponse) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            const url = new URL(tab.url);
            sendResponse({ success: true, tab: { url: tab.url, domain: url.hostname, title: tab.title } });
        } else {
            sendResponse({ success: false, error: 'No active tab found' });
        }
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // placeholder for tracking
    }
});

chrome.runtime.onSuspend.addListener(() => {
    // service worker suspending
});
