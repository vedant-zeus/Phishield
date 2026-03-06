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

function extractFeatures(urlString) {
  try {
    const url = new URL(urlString);
    const features = [];

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
    const host = url.hostname;
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

    return features;
  } catch (e) {
    return new Array(12).fill(0);
  }
}

function predict(features) {
  if (!modelData) return 0.5;

  const { coefficients, intercept } = modelData;
  let z = intercept || 0;
  for (let i = 0; i < features.length; i++) {
    z += features[i] * coefficients[i];
  }

  return 1 / (1 + Math.exp(-z));
}

// Intercept requests
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const features = extractFeatures(tab.url);
    const score = predict(features);

    console.log(`URL: ${tab.url}, Score: ${score}`);

    const checkData = {
      url: tab.url,
      score: Math.round(score * 100),
      isPhishing: score > 0.8,
      timestamp: Date.now(),
      features: features // Store features for popup
    };

    chrome.storage.local.set({ lastCheck: checkData });

    if (score > 0.8) {
      chrome.tabs.sendMessage(tabId, {
        type: "PHISHING_DETECTED",
        score: score,
        url: tab.url
      });
    }
  }
});
