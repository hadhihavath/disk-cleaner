<!DOCTYPE html>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --glass-bg:rgba(255,255,255,0.55);
  --glass-border:rgba(255,255,255,0.75);
  --glass-shadow:0 8px 32px rgba(60,80,160,0.10);
  --accent:#3A7BFF;
  --accent2:#7F77DD;
  --text:#1a1a2e;
  --text2:#4a4a6a;
  --surface:rgba(240,244,255,0.7);
}
@media(prefers-color-scheme:dark){:root{
  --glass-bg:rgba(20,24,48,0.60);
  --glass-border:rgba(80,100,200,0.25);
  --text:#e8eaff;
  --text2:#9aa0cc;
  --surface:rgba(30,35,70,0.7);
}}
body{
  font-family:'Segoe UI',system-ui,sans-serif;
  background:linear-gradient(135deg,#0f1035 0%,#1a2060 40%,#0d2040 100%);
  min-height:100vh;
  padding:2rem 1.5rem 3rem;
  color:var(--text);
}
.hero{
  text-align:center;
  padding:3rem 1rem 2.5rem;
  position:relative;
  animation:fadeDown 0.7s ease both;
}
.logo-icon{
  width:72px;height:72px;
  background:linear-gradient(135deg,#3A7BFF,#7F77DD);
  border-radius:20px;
  display:inline-flex;align-items:center;justify-content:center;
  font-size:36px;
  margin-bottom:1.25rem;
  box-shadow:0 0 40px rgba(58,123,255,0.4);
  animation:pulse 3s ease-in-out infinite;
}
.hero h1{font-size:2.4rem;font-weight:700;letter-spacing:-1px;color:#fff;line-height:1.1;margin-bottom:.5rem}
.hero h1 span{background:linear-gradient(90deg,#3A7BFF,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero .tagline{font-size:1rem;color:rgba(200,210,255,0.75);margin-bottom:1.5rem}
.badge-row{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:2rem}
.badge{background:rgba(58,123,255,0.18);border:1px solid rgba(58,123,255,0.35);color:#a5c0ff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:.5px;text-transform:uppercase}
.glass{
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  border-radius:16px;
  box-shadow:var(--glass-shadow);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
}
.section{margin-bottom:1.5rem;animation:fadeUp 0.5s ease both}
.section-label{
  font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  color:#7090ff;margin-bottom:.75rem;display:flex;align-items:center;gap:6px;
}
.section-label::after{content:'';flex:1;height:1px;background:rgba(100,130,255,0.2)}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem}
.feat{
  padding:1rem 1.1rem;
  background:var(--surface);
  border:1px solid rgba(100,130,255,0.15);
  border-radius:12px;
  transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
  cursor:default;
}
.feat:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(58,123,255,0.2);border-color:rgba(100,150,255,0.4)}
.feat-icon{font-size:22px;margin-bottom:.6rem;display:block}
.feat-title{font-size:.8rem;font-weight:700;color:#c0d0ff;margin-bottom:.3rem}
.feat-desc{font-size:.75rem;color:var(--text2);line-height:1.5}
.tree{
  padding:1.25rem 1.5rem;
  font-family:'Cascadia Code','Fira Code','Consolas',monospace;
  font-size:.78rem;
  line-height:1.85;
  color:#8899dd;
}
.tree .folder{color:#7f77dd;font-weight:600}
.tree .file{color:#5dc0a0}
.tree .comment{color:#4a5580;font-style:italic}
.steps{display:flex;flex-direction:column;gap:.75rem}
.step{
  padding:1rem 1.25rem;
  background:var(--surface);
  border:1px solid rgba(100,130,255,0.12);
  border-radius:12px;
  display:flex;align-items:flex-start;gap:1rem;
  transition:border-color .2s;
}
.step:hover{border-color:rgba(100,160,255,0.35)}
.step-num{
  min-width:28px;height:28px;
  background:linear-gradient(135deg,#3A7BFF,#7F77DD);
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-size:.75rem;font-weight:700;color:#fff;flex-shrink:0;margin-top:2px;
}
.step-content h4{font-size:.85rem;font-weight:700;color:#c0d0ff;margin-bottom:.25rem}
.step-content p{font-size:.78rem;color:var(--text2);line-height:1.5}
code{
  background:rgba(58,123,255,0.15);
  color:#88aaff;
  border:1px solid rgba(58,123,255,0.2);
  padding:1px 6px;border-radius:5px;
  font-family:'Cascadia Code','Fira Code',monospace;
  font-size:.8em;
}
.specs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem}
.spec{
  padding:1rem;
  background:var(--surface);
  border:1px solid rgba(100,130,255,0.12);
  border-radius:12px;
  display:flex;gap:.75rem;align-items:flex-start;
  transition:border-color .2s;
}
.spec:hover{border-color:rgba(100,200,150,0.35)}
.spec-icon{font-size:20px;margin-top:2px;flex-shrink:0}
.spec h4{font-size:.8rem;font-weight:700;color:#a0e8c8;margin-bottom:.25rem}
.spec p{font-size:.75rem;color:var(--text2);line-height:1.5}
.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(100,130,255,0.2),transparent);margin:1.5rem 0}
@keyframes fadeDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 30px rgba(58,123,255,0.35)}50%{box-shadow:0 0 60px rgba(127,119,221,0.55)}}
.s1{animation-delay:.05s}.s2{animation-delay:.12s}.s3{animation-delay:.19s}.s4{animation-delay:.26s}.s5{animation-delay:.33s}
</style>

<div class="hero">
  <div class="logo-icon">🧹</div>
  <h1>Drive Cleaner <span>Pro</span></h1>
  <p class="tagline">A professional, local-first Windows storage utility — no telemetry, no cloud, no compromise.</p>
  <div class="badge-row">
    <span class="badge">🪟 Windows 11</span>
    <span class="badge">⚡ FastAPI + Vite</span>
    <span class="badge">🔒 Localhost only</span>
    <span class="badge">🛡️ Safe mode</span>
    <span class="badge">📊 SQLite audit log</span>
  </div>
</div>

<div class="glass section s1" style="padding:1.5rem">
  <div class="section-label">✦ Features</div>
  <div class="features-grid">
    <div class="feat">
      <span class="feat-icon">📡</span>
      <div class="feat-title">Active Drive Scanner</div>
      <div class="feat-desc">Multithreaded walker pipeline across Windows partitions. Real-time updates via WebSockets.</div>
    </div>
    <div class="feat">
      <span class="feat-icon">🔍</span>
      <div class="feat-title">Duplicate Finder</div>
      <div class="feat-desc">Size-indexed + SHA256 hashing — only hashes size-matched files. Bulk keep-newest/oldest helpers.</div>
    </div>
    <div class="feat">
      <span class="feat-icon">🗑️</span>
      <div class="feat-title">Junk & Cache Analyzer</div>
      <div class="feat-desc">Visualizes temp dirs, browser caches, crash dumps, and Windows Update leftovers.</div>
    </div>
    <div class="feat">
      <span class="feat-icon">📥</span>
      <div class="feat-title">Downloads Audit</div>
      <div class="feat-desc">Highlights old archives and long-untouched files with automated cleanup suggestions.</div>
    </div>
    <div class="feat">
      <span class="feat-icon">🗂️</span>
      <div class="feat-title">Registry Software Audit</div>
      <div class="feat-desc">Maps installed programs via registry paths. Sorts by name or size; copies uninstall strings to clipboard.</div>
    </div>
    <div class="feat">
      <span class="feat-icon">🛡️</span>
      <div class="feat-title">Safe Mode Protection</div>
      <div class="feat-desc">Blocks deletion inside <code>C:\Windows</code>, <code>Program Files</code>, and <code>ProgramData</code>.</div>
    </div>
    <div class="feat">
      <span class="feat-icon">📄</span>
      <div class="feat-title">Interactive Exporter</div>
      <div class="feat-desc">Generate CSV or interactive HTML reports from any scan result.</div>
    </div>
    <div class="feat">
      <span class="feat-icon">📋</span>
      <div class="feat-title">Audit Logger</div>
      <div class="feat-desc">Every delete and cleanup operation is written to a local SQLite database for compliance review.</div>
    </div>
  </div>
</div>

<div class="glass section s2" style="padding:1.5rem">
  <div class="section-label">🗂️ Folder Architecture</div>
  <div class="tree">
<span class="folder">drive-cleaner-pro/</span>
├── <span class="folder">backend/</span>
│   ├── <span class="folder">api/</span>
│   ├── <span class="folder">analyzers/</span>      <span class="comment"># Registry & filesystem crawlers</span>
│   ├── <span class="folder">cleanup/</span>          <span class="comment"># Safe file deleters and Recycle Bin APIs</span>
│   ├── <span class="folder">database/</span>         <span class="comment"># SQLite history and settings</span>
│   ├── <span class="folder">reports/</span>          <span class="comment"># Report exporters (CSV/HTML)</span>
│   ├── <span class="folder">tests/</span>            <span class="comment"># Diagnostic tests</span>
│   ├── <span class="file">main.py</span>           <span class="comment"># FastAPI application entrypoint</span>
│   └── <span class="file">requirements.txt</span>
├── <span class="folder">frontend/</span>
│   ├── <span class="folder">src/</span>
│   │   ├── <span class="folder">components/</span>
│   │   ├── <span class="folder">pages/</span>        <span class="comment"># Dashboard, Scanner, Duplicates views</span>
│   │   ├── <span class="folder">services/</span>     <span class="comment"># REST & WebSocket hooks</span>
│   │   ├── <span class="file">App.tsx</span>       <span class="comment"># Shell container</span>
│   │   └── <span class="file">main.tsx</span>
│   ├── <span class="file">index.html</span>
│   ├── <span class="file">tailwind.config.js</span>
│   └── <span class="file">vite.config.ts</span>
└── <span class="file">README.md</span>
  </div>
</div>

<div class="glass section s3" style="padding:1.5rem">
  <div class="section-label">🚀 Running Locally</div>
  <div class="steps">
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-content">
        <h4>Install backend dependencies</h4>
        <p>Navigate into <code>backend/</code> and run:<br><br><code>pip install -r requirements.txt</code></p>
      </div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-content">
        <h4>Launch the FastAPI server</h4>
        <p><code>uvicorn main:app --reload --port 8000</code><br><br>API available at <code>http://127.0.0.1:8000</code></p>
      </div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-content">
        <h4>Install frontend dependencies</h4>
        <p>Navigate into <code>frontend/</code> and run:<br><br><code>npm install</code></p>
      </div>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <div class="step-content">
        <h4>Launch the Vite dev server</h4>
        <p><code>npm run dev</code><br><br>Open <code>http://localhost:3000</code>. All <code>/api</code> and <code>/ws</code> requests are proxied to the backend automatically.</p>
      </div>
    </div>
  </div>
</div>

<div class="glass section s4" style="padding:1.5rem">
  <div class="section-label">🔐 Safety & Technical Specs</div>
  <div class="specs-grid">
    <div class="spec">
      <span class="spec-icon">🌐</span>
      <div>
        <h4>Localhost-only scope</h4>
        <p>Zero external queries, telemetry, or data collection. Everything stays on your machine.</p>
      </div>
    </div>
    <div class="spec">
      <span class="spec-icon">🛡️</span>
      <div>
        <h4>Bricking protection</h4>
        <p>Safe Mode blocks all deletes inside <code>C:\Windows</code>, <code>Program Files</code>, <code>Program Files (x86)</code>, and <code>ProgramData</code>.</p>
      </div>
    </div>
    <div class="spec">
      <span class="spec-icon">🔬</span>
      <div>
        <h4>Non-destructive scanning</h4>
        <p>Registry audit reads metadata only. Uninstall strings are copied to clipboard — never auto-executed.</p>
      </div>
    </div>
  </div>
</div>

<div class="section s5" style="text-align:center;padding:1rem 0 .5rem;color:rgba(150,170,255,0.5);font-size:.75rem">
  Built for Windows 11 · Runs entirely on your machine · No account required
</div>
