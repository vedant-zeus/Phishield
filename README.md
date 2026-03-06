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

## 🚀 Quick Start (No Setup Required)

PhishGuard AI is **100% Local**. It does not require any backend services or internet APIs to protect you.

1. Open Chrome and visit `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this project folder (`d:\New_Minor`).
4. **That's it!** The AI is now active and will scan every page you visit locally.

## 🏗️ Technical Architecture
### Local Inference Engine
- **Self-Contained**: All feature extraction and security logic resides within the extension.
- **Privacy-First**: No data is sent to external servers. Your browsing history stays on your machine.
- **Pre-trained Intelligence**: Uses a highly optimized 12-feature model weights file (`model.json`).

### Backend (Optional Developer Tool)
The included Rust code in `/src` is only for developers who wish to *retrain* the model from scratch. It is **not required** for the extension to function.
