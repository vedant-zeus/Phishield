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

  chrome.storage.local.get(['lastCheck'], (result) => {
    if (result.lastCheck) {
      const { url, score, isPhishing, features } = result.lastCheck;

      // Animate score count-up
      animateValue(scoreValue, 0, score, 800);

      // Update circle progress
      scoreCircle.style.setProperty('--progress', `${score}%`);

      // Update URL display
      const displayUrl = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
      urlBox.innerText = displayUrl;

      // Update status and colors
      if (score > 80) {
        statusTitle.innerText = "Harmful Site Detected";
        statusTitle.style.color = "var(--primary)";
        document.documentElement.style.setProperty('--primary', '#ff4b2b');
        statusCard.classList.add('pulse');
        phishingDetails.style.display = 'grid';

        // If we have features stored, show them
        if (features) {
          featKeywords.innerText = features[10] || 0;
          featDigits.innerText = features[7] || 0;
        }
      } else if (score > 40) {
        statusTitle.innerText = "Suspicious Activity";
        statusTitle.style.color = "var(--warning)";
        document.documentElement.style.setProperty('--primary', 'var(--warning)');
        phishingDetails.style.display = 'grid';
      } else {
        statusTitle.innerText = "Connection Secure";
        statusTitle.style.color = "var(--success)";
        document.documentElement.style.setProperty('--primary', 'var(--success)');
      }
    } else {
      statusTitle.innerText = "No activity yet.";
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
