const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'src';
const OUTPUT_DIR = 'dist';

const manifestV2 = {
  manifest_version: 2,
  name: "Next Page Please",
  version: "1.0",
  description: "Use arrow keys to navigate between pages",
  icons: {
    "48": "icons/icon-48.png",
    "96": "icons/icon-96.png",
    "128": "icons/icon-128.png"
  },
  browser_specific_settings: {
    gecko: {
      id: "nextpageplease@consantor.com"
    }
  },
  browser_action: {
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    },
    default_popup: "popup.html"
  },
  permissions: [
    "activeTab",
    "storage",
    "<all_urls>"
  ],
  content_scripts: [
    {
      "matches": ["<all_urls>"],
      "js": ["navigator.js"]
    }
  ]
};

const manifestV3 = {
  manifest_version: 3,
  name: "Next Page Please",
  version: "1.0",
  description: "Use arrow keys to navigate between pages",
  icons: {
    "48": "icons/icon-48.png",
    "96": "icons/icon-96.png",
    "128": "icons/icon-128.png"
  },
  browser_specific_settings: {
    gecko: {
      id: "nextpageplease@consantor.com"
    }
  },
  action: {
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    },
    default_popup: "popup.html"
  },
  permissions: [
    "activeTab",
    "scripting",
    "storage"
  ],
  host_permissions: [
    "<all_urls>"
  ],
  content_scripts: [
    {
      "matches": ["<all_urls>"],
      "js": ["navigator.js"]
    }
  ]
};

const browserPolyfill = `
const browserAPI = (typeof browser !== 'undefined' ? browser : chrome);

// Storage API compatibility
const storage = {
  local: {
    get: async (key) => {
      if (typeof browser !== 'undefined') {
        return browser.storage.local.get(key);
      }
      return new Promise((resolve) => {
        chrome.storage.local.get(key, resolve);
      });
    },
    set: async (data) => {
      if (typeof browser !== 'undefined') {
        return browser.storage.local.set(data);
      }
      return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
      });
    }
  }
};
`;

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(source, target) {
  fs.copyFileSync(source, target);
}

function modifyScript(content, version) {
  if (version === 2) {
    return browserPolyfill + content.replace(/chrome\./g, 'browserAPI.');
  }
  return content;
}

async function copyDirectory(source, target) {
  ensureDirectoryExists(target);
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  });
}

function build(version) {
  const targetDir = path.join(OUTPUT_DIR, `v${version}`);
  ensureDirectoryExists(targetDir);

  const sourceIconsDir = path.join(__dirname, 'icons');
  const targetIconsDir = path.join(targetDir, 'icons');
  copyDirectory(sourceIconsDir, targetIconsDir);

  const files = fs.readdirSync(SOURCE_DIR);
  files.forEach(file => {
    const sourcePath = path.join(SOURCE_DIR, file);
    const targetPath = path.join(targetDir, file);

    if (file.endsWith('.js')) {
      const content = fs.readFileSync(sourcePath, 'utf8');
      fs.writeFileSync(targetPath, modifyScript(content, version));
    } else {
      copyFile(sourcePath, targetPath);
    }
  });

  const manifest = version === 2 ? manifestV2 : manifestV3;
  fs.writeFileSync(
    path.join(targetDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

async function buildAll() {
  await build(2);
  await build(3);
}

buildAll().catch(console.error);