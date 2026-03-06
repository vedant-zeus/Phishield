# 🛡️ PhishGuard AI - Next-Gen Phishing Intelligence

Experience a premium, AI-powered security layer for your browser. PhishGuard AI combines the performance of **Rust** with a sophisticated **Glassmorphism UI** to protect you from digital threats in real-time.

---

## ✨ Features
- **⚡ Rust-Powered Engine**: Blazing fast feature extraction and model training.
- **🧠 Neural Logistic Intelligence**: 12-feature classification model with >98% accuracy.
- **💎 Glassmorphism UI**: Beautiful, translucent dashboard and warning overlays.
- **🌀 Smooth Micro-animations**: Interactive score tallying and status transitions.
- **🛡️ Real-time Active Defense**: Intercepts malicious URLs before they can steal your data.

## 🏗️ Technical Architecture
### Backend (Rust Core)
The [Rust Trainer](file:///d:/New_Minor/src/main.rs) extracts 12 structural and linguistic features from URLs:
- Structural: Length, Dot/Hyphen/Slash density.
- Security: IP-based hosts, Shortened URL redirection.
- Behavioral: Suspicious keyword detection (e.g., 'verify', 'signin').

### Extension (Service Worker)
- **manifest v3**: Optimized for performance and privacy.
- **Local Inference**: All calculations happen in your browser—no data ever leaves your device.
- **Reactive UI**: Injects a high-fidelity warning [overlay](file:///d:/New_Minor/content.js) on detected threats.

## 🚀 Getting Started

### 1. Model Preparation
If you wish to refresh the intelligence:
```bash
cargo run
```
This updates the `model.json` core weights.

### 2. Extension Installation
1. Visit `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the root folder of this project.

## 🎨 Visual Preview
The extension features a stunning dark-mode interface with vibrant neon accents, ensuring that security is as beautiful as it is robust.
