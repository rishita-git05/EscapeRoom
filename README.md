# 🧩 Web-Based Coding Escape Room
> **A high-stakes, multi-language competitive programming platform built for live technical events.**

This platform was engineered for a college technical competition, enabling participants to progress through timed rounds by solving challenges in **C, Python, and Java**. It features a custom execution engine that handles real-time submissions and automated evaluation.

---

## 🚀 Key Features
* ⏱️ **Timed Rounds:** Integrated countdowns with automatic submission on expiry.
* 💻 **Multi-Language Support:** Seamless execution for C, Python, and Java.
* ⚙️ **Terminal-Style Interface:** Provides a familiar environment for developers.
* ✅ **Automated Evaluation:** Real-time test case validation and scoring.
* 📊 **Persistent Leaderboard:** Results stored in MongoDB for instant retrieval.
* 🌐 **LAN Optimized:** Specifically architected for low-latency performance in a local network environment.

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **Execution** | Child Process (GCC, Python 3, JDK) |



---

## 🎯 Event Structure
The competition was designed to test speed, logic, and debugging skills across three distinct phases:

1.  **Round 1: Logic Gate** – Basic debugging and syntax-heavy challenges.
2.  **Round 2: Algorithmic Ascent** – Intermediate data structures and logic.

> **Note on Scoring:** Points were calculated using a weighted formula based on test cases passed and time remaining:
> $$Score = (Tests_{passed} \times 100) + (Time_{remaining} \times \text{Multiplier})$$

---

## ⚙️ Installation & Setup
To run this project locally for development:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/coding-escape-room.git](https://github.com/yourusername/coding-escape-room.git)
   cd coding-escape-room

2. **Install dependencies:**
   ```bash
   npm install
3. **Configure Environment:**
   Ensure you have gcc, python3, and java/javac installed and added to your system's PATH.
4. **Start the server:**
   ```bash
   node server.js

---

## 🌱 Future Roadmap
- [ ] **Containerization:** Moving code execution to **Docker** for better security isolation and resource limiting.
- [ ] **Plagiarism Detection:** Integrating **MOSS** (Measure of Software Similarity) or custom logic to detect code sharing.
- [ ] **Cloud Ready:** Migrating from LAN-only to **AWS/GCP** deployment with a scalable architecture.
- [ ] **Live Socket Updates:** Real-time leaderboard shifts and global notifications using **Socket.io**.
- [ ] **Enhanced UI/UX:** Polishing the participant dashboard with a more immersive, "Escape Room" themed interface.
