document.addEventListener('DOMContentLoaded', () => {
  const domainEl = document.getElementById('domain');
  const statusEl = document.getElementById('status');

  let currentDomain = null;

  async function loadActiveDomain() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        currentDomain = url.hostname.replace(/^\./, '');
        domainEl.textContent = currentDomain;
        return currentDomain;
      } else {
        domainEl.textContent = 'No active tab';
        return null;
      }
    } catch (e) {
      domainEl.textContent = 'Error';
      console.error(e);
      return null;
    }
  }

  async function exportCookiesAuto() {
    const domain = await loadActiveDomain();
    if (!domain) {
      statusEl.textContent = 'No domain to export';
      return;
    }

    const includeSecure = document.getElementById('include-secure').checked;
    const includeHttpOnly = document.getElementById('include-httponly').checked;

    try {
      const cookies = await chrome.cookies.getAll({ domain });
      const filtered = cookies.filter(c => (includeSecure || !c.secure) && (includeHttpOnly || !c.httpOnly));

      const data = {
        exportDate: new Date().toISOString(),
        domain,
        count: filtered.length,
        cookies: filtered.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: c.sameSite,
          expirationDate: c.expirationDate
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${domain}-cookies.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      statusEl.textContent = `Exported ${data.count} cookies`;
      setTimeout(() => statusEl.textContent = '', 3000);
    } catch (e) {
      console.error(e);
      statusEl.textContent = 'Error exporting cookies';
    }
  }

  // Auto-export when popup opens
  exportCookiesAuto();
});
