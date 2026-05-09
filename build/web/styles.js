"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webStyles = void 0;
exports.webStyles = `
:root { --bg:#0b0f0b; --fg:#c7f9cc; --muted:#6b8f71; --accent:#80ed99; --lh:1.2em; --rows:25; }
body { margin:0; min-height:100dvh; overflow:hidden; display:grid; place-items:center; background:radial-gradient(circle at 20% 20%, #132a13 0%, var(--bg) 55%); color:var(--fg); font:16px/var(--lh) "Courier New", monospace; }
.wrap { width:82ch; border:1px solid #2d6a4f; box-shadow:0 0 0 1px #1b4332 inset; display:flex; flex-direction:column; box-sizing:border-box; background:#081c15; }
.head { padding:10px 12px; background:#081c15; color:var(--accent); border-bottom:1px solid #2d6a4f; }
.term { display:flex; flex-direction:column; flex:1; min-height:0; }
#screen { padding:0 1ch; width:80ch; height:calc(var(--rows) * var(--lh)); overflow:auto; box-sizing:border-box; }
#screen { scrollbar-width: thin; scrollbar-color: #2d6a4f #081c15; }
#screen::-webkit-scrollbar { width: 10px; }
#screen::-webkit-scrollbar-track { background: #081c15; }
#screen::-webkit-scrollbar-thumb { background: #2d6a4f; border: 1px solid #1b4332; border-radius: 0; }
#screen::-webkit-scrollbar-thumb:hover { background: #40916c; }
body.mode-cga { --rows:25; }
body.mode-ega { --rows:43; }
body.mode-vga { --rows:50; }
#out { display:flex; flex-direction:column; gap:0.5rem; margin:0; }
.output-block { white-space:pre-wrap; }
.help-panel { border:1px solid #2d6a4f; background:#071610; padding:0.9rem 1rem 1rem; box-shadow:0 0 0 1px #1b4332 inset; }
.help-title { color:var(--accent); text-transform:uppercase; letter-spacing:0.2em; margin-bottom:0.85rem; font-weight:bold; }
.help-section + .help-section { margin-top:0.85rem; }
.help-section-title { color:var(--accent); margin-bottom:0.35rem; text-transform:uppercase; letter-spacing:0.08em; }
.help-grid { display:grid; grid-template-columns:18ch 1fr; column-gap:1rem; row-gap:0.2rem; }
.help-command { color:var(--fg); white-space:nowrap; }
.help-desc { color:var(--muted); }
.help-note { grid-column:1 / -1; }
.row { display:flex; gap:0; align-items:center; margin-top:2px; }
#in { flex:1; background:transparent; color:var(--fg); border:0; outline:0; padding:0; font:inherit; }
.muted { color:var(--muted); }
`;
