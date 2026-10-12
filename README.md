# THE BETRAYAL — A Dark Fantasy Mystery Card Game

> *“The Crown Has Fallen. Find the Traitor.”*

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Online-C5A15B?style=for-the-badge&logo=google-chrome&logoColor=white)](https://shre0857.github.io/the-betrayal/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-8F1D2C?style=for-the-badge&logo=github&logoColor=white)](https://github.com/shre0857/the-betrayal)
[![GDGC Round 2](https://img.shields.io/badge/GDGC-Web_Dev_Lead-4A111B?style=for-the-badge)](https://github.com/shre0857)

A fully playable, cinematic, single-player dark medieval fantasy mystery, deduction, and interactive card game developed for Round 2 of the **Google Developer Groups on Campus (GDGC) Web Development Lead** selection.

---

## 🏰 Game Concept & Story

Under the veil of midnight, the King was murdered inside his sealed castle chambers. Three trusted court figures held access to the royal wing. Each harbors a secret motive, but only one is guilty of regicide.

As the appointed Royal Inquisitor, examine sealed evidence, interrogate the three lords, connect the deduction trail in your Detective Journal, and expose the traitor before your inquiries are exhausted!

---

## 🎮 Core Gameplay Loop

1. **Enter the Kingdom:** Opening briefing with animated gothic atmosphere and procedural Web Audio soundtrack.
2. **Case Dossier:** Official royal decree outlining the crime and introducing the three persons of interest.
3. **Investigation Arena:**
   - **5 Sealed Evidence Cards:** Interactive 3D card flips revealing the dagger, missing key, servant's testimony, torn ledger, and secret letter.
   - **3 Royal Suspects:** Interrogate Lord Aldric (The Northern Lord), Lady Seraphine (The Royal Advisor), and Lord Malrec (The Royal Treasurer).
   - **Detective Journal:** Parchment ledger dynamically tracking discovered clues, testimonies, and deduction checklist.
4. **Accusation Tribunal:** Formally select and accuse the traitor.
   - **Expose Lord Malrec (Guilty):** Victory fanfare, full deduction breakdown, and high score calculation.
   - **False Accusation:** Penalties (-50 PTS, -1 attempt) and defeat sequence if attempts are exhausted.
5. **Replayability:** Instant zero-reload game reset.

---

## 🛠️ Technology Stack

- **HTML5:** Semantic architecture across all 4 screens and modals.
- **CSS3:** Custom Gothic medieval UI, antique-gold foil borders, 3D card flips, responsive flex/grid layouts.
- **Vanilla JavaScript:** Centralized state engine, single source of truth, scoring logic, and deduction verification.
- **Web Audio API:** 100% procedural sound synthesis (wax seal snap, clue chimes, cathedral bells, victory fanfare). No external MP3 files needed.
- **Canvas VFX:** Optimized 60 FPS drifting embers particle engine.
- **Storage:** Browser `localStorage` for high score persistence.

---

## 🚀 Running Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/shre0857/the-betrayal.git
   cd the-betrayal
   ```

2. Start a local HTTP server:
   ```bash
   python -m http.server 5500
   ```

3. Open in your browser:
   ```
   http://localhost:5500
   ```

---

## 👤 Author

Developed by **Shreya Patil** ([@shre0857](https://github.com/shre0857))  
Round 2 Selection Task — GDGC Web Development Lead
