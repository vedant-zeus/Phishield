// PhishGuard AI - Content Script

// DOM Feature Extraction (Phase 6)
function extractDomFeatures() {
  const features = {
    hasPassword: document.querySelectorAll('input[type="password"]').length > 0 ? 1 : 0,
    formCount: document.forms.length,
    linkMismatch: 0,
    hiddenFields: document.querySelectorAll('input[type="hidden"]').length
  };

  // Detect link-text mismatch (e.g. Text: google.com, Href: fake.com)
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    const text = link.innerText.toLowerCase();
    const href = link.href.toLowerCase();
    const domainPattern = /[a-z0-9-]+\.[a-z]{2,}/i;

    if (domainPattern.test(text) && !href.includes(text.match(domainPattern)[0])) {
      features.linkMismatch++;
    }
  });

  return features;
}

// Notify background about DOM features on load
window.addEventListener('load', () => {
  const domTraits = extractDomFeatures();
  chrome.runtime.sendMessage({
    type: "DOM_REPORT",
    payload: domTraits,
    url: window.location.href
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PHISHING_DETECTED") {
    showWarningOverlay(message.score);
  }
});

function showWarningOverlay(score) {
  if (document.getElementById('phish-guard-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'phish-guard-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    text-align: center;
    padding: 20px;
  `;

  overlay.innerHTML = `
    <div style="background: #1e1e1e; padding: 40px; border-radius: 20px; border: 2px solid #ff4b2b; max-width: 500px; box-shadow: 0 0 50px rgba(255, 75, 43, 0.5);">
      <h1 style="color: #ff4b2b; margin-top: 0; font-size: 32px;">⚠️ Phishing Warning</h1>
      <p style="font-size: 18px; line-height: 1.6;">Our AI has detected that this page is likely a phishing scam with a risk score of <strong>${Math.round(score * 100)}%</strong>.</p>
      <p style="color: #aaa; margin-bottom: 30px;">This page may try to steal your personal information like passwords or credit card details.</p>
      <div style="display: flex; gap: 20px; justify-content: center;">
        <button id="pg-go-back" style="background: #ff4b2b; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s;">Get Me Out of Here</button>
        <button id="pg-ignore" style="background: transparent; color: #aaa; border: 1px solid #444; padding: 12px 20px; border-radius: 8px; cursor: pointer;">Ignore (Unsafe)</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('pg-go-back').addEventListener('click', () => {
    window.history.back();
    if (window.history.length <= 1) {
      window.close();
    }
  });

  document.getElementById('pg-ignore').addEventListener('click', () => {
    overlay.remove();
  });
}
