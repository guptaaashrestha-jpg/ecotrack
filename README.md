# 🌍 EcoTrack — Carbon Footprint Dashboard

> Track your carbon footprint with AI-powered insights, 3D visualizations, and actionable sustainability goals.

**[🚀 Live Demo](https://guptaaashrestha-jpg.github.io/ecotrack/)**

---

## 🎯 What is EcoTrack?

EcoTrack is an intelligent carbon footprint tracking dashboard that helps you understand, monitor, and reduce your environmental impact. Built with pure HTML, CSS, and JavaScript — no frameworks, no dependencies, no API keys.

### The Problem
The average person emits **13.1 kg CO₂ per day**, but most people have no idea where their emissions come from. Without data, there's no way to make informed decisions about reducing your carbon footprint.

### The Solution
EcoTrack gives you a **real-time, personalized dashboard** that tracks your daily activities across 4 categories (Transport, Energy, Food, Shopping), analyzes your patterns with a local AI engine, and gives you actionable, data-driven recommendations to reduce emissions.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Real-Time Dashboard** | Live stats, donut chart, 7-day trend line with daily target |
| ⚡ **Quick Activity Logging** | One-tap chips + detailed form with real-time CO₂ estimation |
| 🤖 **Local AI Advisor** | Chat with an AI that reads your actual data — no API, no internet needed |
| 📈 **Smart Insights** | Weekly summaries, category comparison bars, goal progress tracking |
| 🎯 **Goal Setting** | Set weekly CO₂ targets and track progress against them |
| 💾 **Offline-First** | All data stored in LocalStorage — works without internet |
| 🔒 **Privacy-First** | Zero data leaves your device. No accounts, no tracking |
| 🎨 **3D Depth UI** | CSS perspective transforms, parallax tilt, ambient glows |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic markup, accessibility-first
- **CSS3** — Custom properties, 3D transforms, glassmorphism, animations
- **Vanilla JavaScript** — Modular architecture, zero dependencies
- **Chart.js** — Data visualization (CDN)
- **GSAP** — Landing page animations (CDN)
- **Lenis** — Smooth scrolling (CDN)
- **Lucide Icons** — Icon system (CDN)

---

## 🧠 AI Engine

EcoTrack's AI advisor runs **entirely in the browser** — no API calls, no external services, no internet required.

- `analyzeTopCategory()` — Identifies your highest-impact emission category
- `generateTip()` — Creates personalized recommendations using your actual numbers
- `generateWeeklySummary()` — Compares this week vs last week with specific insights
- `chatRespond()` — Keyword-matched responses referencing your real data

All responses generated in **< 5ms** with zero network latency.

---

## 📁 Project Structure

```
ecotrack/
├── index.html        # Animated landing page (GSAP + Lenis)
├── app.html          # Main dashboard application
├── css/
│   └── style.css     # Complete design system
└── js/
    ├── utils.js      # Helper functions
    ├── data.js       # Emission factors + LocalStorage
    ├── ai.js         # Local AI intelligence engine
    ├── charts.js     # Chart.js configuration
    └── app.js        # Main app controller
```

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/guptaaashrestha-jpg/ecotrack.git
   ```
2. Open `index.html` in your browser
3. That's it — no build step, no server, no installation

---

## 📊 Emission Factors

All emission factors are sourced from peer-reviewed data:

| Source | Used For |
|--------|----------|
| **EPA** (US Environmental Protection Agency) | Transport emission factors |
| **DEFRA** (UK Dept for Environment) | Food & shopping factors |
| **Our World in Data** | Global averages & benchmarks |
| **IEA** (International Energy Agency) | Regional electricity factors |

---

## 🏆 Built For

**ML Empowerment Build Challenge 2026** — A global initiative helping students learn AI and apply it to real-world projects.

---

## 📝 License

MIT License — free to use, modify, and distribute.
