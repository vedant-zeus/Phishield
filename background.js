// PhishGuard AI - Background Script

let modelData = null;

// Load model metadata on startup
fetch(chrome.runtime.getURL('model.json'))
  .then(response => response.json())
  .then(data => {
    modelData = data;
    console.log("Model loaded:", modelData);
  })
  .catch(err => console.error("Failed to load model:", err));

// Top 100 popular domains to trust (small subset of Tranco for demo)
const WHITELIST = new Set([
  "google.com", "amazon.com", "facebook.com", "apple.com", "microsoft.com",
  "netflix.com", "github.com", "wikipedia.org", "twitter.com", "linkedin.com",
  "instagram.com", "youtube.com", "gmail.com", "outlook.com", "reddit.com"
]);

function extractFeatures(urlString) {
  try {
    const url = new URL(urlString);
    const features = [];
    const host = url.hostname.toLowerCase();

    // 1. URL Length
    features.push(urlString.length);
    // 2. Dot count
    features.push((urlString.match(/\./g) || []).length);
    // 3. Hyphen count
    features.push((urlString.match(/-/g) || []).length);
    // 4. At count
    features.push((urlString.match(/@/g) || []).length);
    // 5. Slash count
    features.push((urlString.match(/\//g) || []).length);
    // 6. Question mark count
    features.push((urlString.match(/\?/g) || []).length);
    // 7. Equal count
    features.push((urlString.match(/=/g) || []).length);
    // 8. Digit count
    features.push((urlString.match(/\d/g) || []).length);

    // 9. Has IP
    const hasIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ? 1.0 : 0.0;
    features.push(hasIp);

    // 10. Subdomain count
    const subdomainCount = host.split('.').length;
    features.push(subdomainCount);

    // 11. Special keywords
    const keywords = ["login", "verify", "update", "account", "bank", "secure", "signin", "password"];
    let keywordCount = 0;
    const lowerUrl = urlString.toLowerCase();
    keywords.forEach(kw => {
      if (lowerUrl.includes(kw)) keywordCount++;
    });
    features.push(keywordCount);

    // 12. Shortened URL check
    const shorteners = ["bit.ly", "goo.gl", "tinyurl.com", "t.co"];
    const isShortened = shorteners.some(s => host.includes(s)) ? 1.0 : 0.0;
    features.push(isShortened);

    // --- Trust Signals (Phase 5) ---
    // 13. SSL Check (Current protocol)
    const isHttps = url.protocol === "https:" ? 1.0 : 0.0;
    features.push(isHttps);

    // 14. Whitelist Check
    const rootDomain = host.split('.').slice(-2).join('.');
    const isWhitelisted = WHITELIST.has(rootDomain) ? 1.0 : 0.0;
    features.push(isWhitelisted);

    // --- DOM Traits (Phase 6) ---
    // These are updated later via DOM_REPORT
    features.push(0.0); // 15. hasPassword
    features.push(0.0); // 16. linkMismatch
    features.push(0.0); // 17. formCount

    return features;
  } catch (e) {
    return new Array(17).fill(0);
  }
}

function predict(features) {
  if (!modelData) return 0.5;

  const { coefficients, intercept } = modelData;
  let z = intercept || 0;

  for (let i = 0; i < features.length; i++) {
    z += features[i] * (coefficients[i] || 0);
  }

  const isWhitelisted = features[13];
  const isHttps = features[12];
  const hasPassword = features[14];

  let score = 1 / (1 + Math.exp(-z));

  // Anti-False-Positive Whitelist Override
  if (isWhitelisted && isHttps) {
    score *= 0.1;
  }

  // Phishing Signal: Password field on unverified/non-HTTPS site
  if (hasPassword && !isHttps && !isWhitelisted) {
    score = Math.max(score, 0.95);
  }

  return score;
}

// Intercept navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    scanUrl(tab.url, tabId);
  }
});

// Scan on tab switch
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url && tab.url.startsWith('http')) {
      scanUrl(tab.url, tab.id);
    }
  });
});

// Handle reports and requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "REQUEST_SCAN") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
        scanUrl(tabs[0].url, tabs[0].id);
        sendResponse({ status: "scanning" });
      }
    });
    return true;
  }

  if (request.type === "DOM_REPORT") {
    updateScanWithDom(request.url, request.payload, sender.tab.id);
  }
});

async function updateScanWithDom(url, domTraits, tabId) {
  chrome.storage.local.get(['lastCheck'], (result) => {
    if (result.lastCheck && result.lastCheck.url === url) {
      const data = result.lastCheck;
      // Update the DOM slots (14, 15, 16)
      data.features[14] = domTraits.hasPassword;
      data.features[15] = domTraits.linkMismatch;
      data.features[16] = domTraits.formCount;

      // Re-predict with DOM data
      data.score = Math.round(predict(data.features) * 100);

      chrome.storage.local.set({ lastCheck: data });

      if (data.score > 80 && !data.features[13]) {
        chrome.tabs.sendMessage(tabId, {
          type: "PHISHING_DETECTED",
          score: data.score / 100,
          url: url
        }).catch(() => { });
      }
    }
  });
}

async function scanUrl(url, tabId) {
  const features = extractFeatures(url);
  const score = predict(features);

  console.log(`[PHISHGUARD] Scanned: ${url}, Score: ${score}`);

  const checkData = {
    url: url,
    score: Math.round(score * 100),
    isPhishing: score > 0.8,
    timestamp: Date.now(),
    features: features,
    age: "Checking..."
  };

  chrome.storage.local.set({ lastCheck: checkData });

  // Asynchronous RDAP Age lookup
  try {
    const domain = new URL(url).hostname;
    const age = await fetchDomainAge(domain);
    if (age) {
      checkData.age = age;
      chrome.storage.local.set({ lastCheck: checkData });
    }
  } catch (e) { }

  if (score > 0.8 && !features[13]) { // Only warn if not whitelisted
    chrome.tabs.sendMessage(tabId, {
      type: "PHISHING_DETECTED",
      score: score,
      url: url
    }).catch(() => { });
  }
}

async function fetchDomainAge(domain) {
  try {
    const rootDomain = domain.split('.').slice(-2).join('.');
    const response = await fetch(`https://rdap.org/domain/${rootDomain}`);
    const data = await response.json();

    // Find registration date in event list
    const registrationEvent = data.events.find(e => e.eventAction === 'registration');
    if (registrationEvent) {
      const regDate = new Date(registrationEvent.eventDate);
      const years = new Date().getFullYear() - regDate.getFullYear();
      return years > 0 ? `${years} years` : "Less than 1 year";
    }
  } catch (e) { }
  return null;
}
