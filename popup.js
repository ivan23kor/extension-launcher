document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('extension-list');
    const searchInput = document.getElementById('search');
    const emptyState = document.getElementById('empty-state');

    let allExtensions = [];

    // Fetch extensions
    chrome.management.getAll((extensions) => {
        // Filter out this extension itself and disabled extensions if desired (optional)
        // For now, we list everything that is enabled and is not this extension
        const selfId = chrome.runtime.id;
        allExtensions = extensions.filter(ext => ext.id !== selfId && ext.enabled);

        // Sort by name
        allExtensions.sort((a, b) => a.name.localeCompare(b.name));

        renderExtensions(allExtensions);
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allExtensions.filter(ext =>
            ext.name.toLowerCase().includes(query)
        );
        renderExtensions(filtered);
    });

    function renderExtensions(extensions) {
        listElement.innerHTML = '';

        if (extensions.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        extensions.forEach(ext => {
            const li = document.createElement('li');
            li.className = 'extension-item';
            li.title = `Open ${ext.name}`;

            // Icon
            const iconUrl = getIconUrl(ext);
            const img = document.createElement('img');
            img.src = iconUrl;
            img.className = 'extension-icon';
            img.alt = ''; // decorative

            // Info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'extension-info';

            const nameSpan = document.createElement('div');
            nameSpan.className = 'extension-name';
            nameSpan.textContent = ext.name;

            const typeSpan = document.createElement('div');
            typeSpan.className = 'extension-type';
            typeSpan.textContent = ext.installType === 'development' ? 'Unpacked' : (ext.isApp ? 'App' : 'Extension');

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(typeSpan);

            li.appendChild(img);
            li.appendChild(infoDiv);

            // Click handler
            li.addEventListener('click', () => {
                openExtension(ext);
            });

            listElement.appendChild(li);
        });
    }

    function getIconUrl(ext) {
        if (ext.icons && ext.icons.length > 0) {
            // Get the largest icon available, or the last one
            return ext.icons[ext.icons.length - 1].url;
        }
        return 'chrome://extension-icon/khgocdoganjmmofojptkpiixnhpibhoj/24/1'; // Generic fallback or placeholder
    }

    function openExtension(ext) {
        if (ext.isApp) {
            chrome.management.launchApp(ext.id, () => {
                window.close(); // Close popup after launching
            });
        } else {
            // Try to open options page
            if (ext.optionsUrl) {
                chrome.tabs.create({ url: ext.optionsUrl });
                window.close();
            } else {
                // Fallback to chrome://extensions details page
                chrome.tabs.create({ url: `chrome://extensions/?id=${ext.id}` });
                window.close();
            }
        }
    }
});
