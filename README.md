🧹 Drive Cleaner Pro
Drive Cleaner Pro is a professional Windows storage analysis and cleanup utility designed to help users identify large files, duplicate files, unused software, temporary data, and storage waste.
The application runs entirely on your local machine with no cloud services, telemetry, or external data collection.
✨ Features
📡 Drive Scanner
Scan Windows drives and partitions
Real-time progress updates
Fast multithreaded file analysis
🔍 Duplicate File Finder
Detect duplicate files using SHA256 hashing
Smart size-based filtering before hashing
Bulk cleanup options
🗑️ Junk & Cache Analysis
Analyze storage consumed by:
Windows temporary files
Browser caches
Crash dumps
Windows Update leftovers
📥 Downloads Folder Audit
Identify old downloads
Find unused archives and installers
Cleanup recommendations
🗂️ Installed Software Audit
Detect installed applications from Windows Registry
View software details
Copy uninstall commands for manual removal
🛡️ Safe Mode Protection
Prevents accidental deletion of critical system files and folders including:
`C:\Windows`
`C:\Program Files`
`C:\Program Files (x86)`
`C:\ProgramData`
📄 Report Generation
Export scan results as:
CSV Reports
Interactive HTML Reports
📋 Audit Logging
All cleanup operations are logged locally using SQLite for review and tracking.
---
📂 Project Structure
```text
drive-cleaner-pro/
│
├── backend/
│   ├── api/
│   ├── analyzers/
│   ├── cleanup/
│   ├── database/
│   ├── reports/
│   ├── tests/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```
🚀 Getting Started
Backend Setup
```bash
cd backend
pip install -r requirements.txt
```
```bash
uvicorn main:app --reload --port 8000
```
Frontend Setup
```bash
cd frontend
npm install
```
```bash
npm run dev
```
🔐 Safety Features
No cloud connectivity
No telemetry
No external tracking
No user accounts required
Protected directories:
`C:\Windows`
`C:\Program Files`
`C:\Program Files (x86)`
`C:\ProgramData`
🛠️ Technology Stack
Backend
FastAPI
SQLite
Python
Frontend
React
TypeScript
Vite
Tailwind CSS
Additional Components
WebSockets
SHA256 File Hashing
Windows Registry Analysis
CSV/HTML Reporting
🎯 Goals
Identify storage waste
Locate duplicate files
Analyze installed software
Generate cleanup recommendations
Provide safe and transparent storage management
📜 License
This project runs entirely on the user's machine and is designed with privacy, safety, and transparency as core principles.
