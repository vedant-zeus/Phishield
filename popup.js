// PhishGuard AI - Revamped Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const scoreCircle = document.getElementById('score-circle');
  const scoreValue = document.getElementById('score-value');
  const statusTitle = document.getElementById('status-title');
  const statusCard = document.getElementById('status-card');
  const urlBox = document.getElementById('url-box');
  const phishingDetails = document.getElementById('phishing-details');

  const featKeywords = document.getElementById('feat-keywords');
  const featDigits = document.getElementById('feat-digits');
  const featAge = document.getElementById('feat-age');

  function updateUI(data) {
    const { url, score, isPhishing, features } = data;
    const verifVal = document.getElementById('verif-val');

    animateValue(scoreValue, 0, score, 800);
    scoreCircle.style.setProperty('--progress', `${score}%`);

    const displayUrl = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    urlBox.innerText = displayUrl;

    // Phase 5: Verification Status
    const isWhitelisted = features && features[13] > 0.5;
    const isHttps = features && features[12] > 0.5;

    if (isWhitelisted && isHttps) {
      verifVal.innerText = "Verified Safe";
      verifVal.style.color = "var(--success)";
    } else if (isHttps) {
      verifVal.innerText = "SSL Secure";
      verifVal.style.color = "#888";
    } else {
      verifVal.innerText = "Unverified";
      verifVal.style.color = "var(--warning)";
    }

    if (score > 80 && !isWhitelisted) {
      statusTitle.innerText = "Harmful Site Detected";
      statusTitle.style.color = "var(--primary)";
      document.documentElement.style.setProperty('--primary', '#ff4b2b');
      statusCard.classList.add('pulse');
      phishingDetails.style.display = 'grid';
      if (features) {
        featKeywords.innerText = features[10] || 0;
      }
      if (data.age) {
        document.getElementById('feat-age').innerText = data.age;
      }
    } else if (score > 40 && !isWhitelisted) {
      statusTitle.innerText = "Suspicious Activity";
      statusTitle.style.color = "var(--warning)";
      document.documentElement.style.setProperty('--primary', 'var(--warning)');
      phishingDetails.style.display = 'grid';
    } else {
      statusTitle.innerText = isWhitelisted ? "Verified Safe" : "Connection Secure";
      statusTitle.style.color = "var(--success)";
      document.documentElement.style.setProperty('--primary', 'var(--success)');
      statusCard.classList.remove('pulse');
      phishingDetails.style.display = 'grid';
      if (data.age) {
        document.getElementById('feat-age').innerText = data.age;
      }
    }

    // DOM Insights Row (Phase 6)
    const hasPassword = features && features[14] > 0.5;
    const linkMismatch = features && features[15] > 0.5;

    if (hasPassword || linkMismatch) {
      const insightEl = document.createElement('div');
      insightEl.className = 'feature-item animate-in';
      insightEl.style.gridColumn = '1 / -1';
      insightEl.style.marginTop = '10px';
      insightEl.innerHTML = `
            <span class="feature-label">Deep Scan</span>
            <span class="feature-val" style="color: var(--warning)">
                ${hasPassword ? '⚠️ Login Field ' : ''}
                ${linkMismatch ? '⚠️ Link Mismatch' : ''}
            </span>
        `;
      // Avoid duplicates
      const existing = phishingDetails.querySelector('.deep-scan-insight');
      if (!existing) {
        insightEl.classList.add('deep-scan-insight');
        phishingDetails.appendChild(insightEl);
      }
    }
  }

  // Initial check
  chrome.storage.local.get(['lastCheck'], (result) => {
    if (result.lastCheck) {
      updateUI(result.lastCheck);
    } else {
      chrome.runtime.sendMessage({ type: "REQUEST_SCAN" }, (response) => {
        statusTitle.innerText = "Scanning page...";
      });
    }
  });

  // Listen for storage updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.lastCheck) {
      updateUI(changes.lastCheck.newValue);
    }
  });

  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
});
