"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webStyles = void 0;
exports.webStyles = `
:root { --bg:#0b0f0b; --fg:#c7f9cc; --muted:#6b8f71; --accent:#80ed99; --lh:1.2em; --rows:25; }

body.theme-pearl { --bg:#D0AE54; --fg:#2b2b2b; --muted:#7d6a2a; --accent:#000000; }
body.theme-bw { --bg:#000000; --fg:#ffffff; --muted:#808080; --accent:#ffffff; }
body.theme-blue { --bg:#0000aa; --fg:#ffffff; --muted:#aaaaaa; --accent:#ffff55; }
body.theme-amber { --bg:#0b0d0b; --fg:#ffb000; --muted:#8a5d00; --accent:#ffcc00; }
body.theme-green { --bg:#0b0f0b; --fg:#33ff33; --muted:#008800; --accent:#55ff55; }

body { margin:0; min-height:100dvh; overflow:hidden; display:grid; place-items:center; background:radial-gradient(circle at 20% 20%, #132a13 0%, var(--bg) 55%); color:var(--fg); font-family:"Courier New", monospace; line-height:var(--lh); transition: background 0.3s, color 0.3s, font-size 0.2s; }
body.theme-blue { background: var(--bg); }
body.theme-bw { background: var(--bg); }
body.theme-pearl { background: var(--bg); }

.wrap { width:82ch; max-width: 100vw; height: 100dvh; border:1px solid #2d6a4f; box-shadow:0 0 0 1px #1b4332 inset; display:flex; flex-direction:column; box-sizing:border-box; background:#081c15; position: relative; overflow: hidden; }
.wrap::before { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); z-index: 10; background-size: 100% 2px, 3px 100%; pointer-events: none; }
.wrap::after { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: rgba(18, 16, 16, 0.1); opacity: 0; z-index: 10; pointer-events: none; animation: flicker 8s infinite; }

@keyframes flicker {
  0% { opacity: 0.01; }
  1% { opacity: 0.05; }
  2% { opacity: 0.02; }
  3% { opacity: 0.08; }
  4% { opacity: 0.01; }
  100% { opacity: 0.01; }
}

body.theme-blue .wrap { border-color: #ffffff; background: #0000aa; }
body.theme-bw .wrap { border-color: #ffffff; background: #000000; }
body.theme-pearl .wrap { border-color: #2b2b2b; background: #D0AE54; }

.head { padding:10px 12px; background:#081c15; color:var(--accent); border-bottom:1px solid #2d6a4f; display:flex; justify-content:space-between; align-items:center; flex-shrink: 0; }
.head-brand { display:flex; gap:1ch; align-items:center; }
.head-sep { color:var(--muted); font-weight:normal; opacity:0.5; }
.head-link { color:var(--accent); text-decoration:none; font-weight:bold; font-size:14px; text-transform:uppercase; letter-spacing:1px; border:1px solid transparent; padding:2px 6px; transition: all 0.2s; }
.head-link:hover { background:var(--accent); color:var(--bg); }
body.theme-blue .head { background: #0000aa; border-bottom-color: #ffffff; }
body.theme-bw .head { background: #000000; border-bottom-color: #ffffff; }
body.theme-pearl .head { background: #D0AE54; border-bottom-color: #2b2b2b; }
#sys-stats { display:flex; gap:1.5ch; font-size:14px; font-weight:bold; }
#sys-ram { color:var(--muted); }
#sys-clock { min-width:8ch; text-align:right; }

.term { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }
#cli-view { flex: 1; display: flex; flex-direction: column; min-height: 0; }
#screen { padding: 0 1ch 1rem 1ch; width:100%; flex: 1; overflow-y: auto; overflow-x: hidden; box-sizing: border-box; }
#screen { scrollbar-width: auto; scrollbar-color: var(--accent) var(--bg); }
#screen::-webkit-scrollbar { width: 10px; }
#screen::-webkit-scrollbar-track { background: var(--bg); }
#screen::-webkit-scrollbar-thumb { background: var(--accent); border: 1px solid var(--bg); }
#screen::-webkit-scrollbar-thumb:hover { background: var(--fg); }

#aoc-view { padding: 1ch; width:80ch; max-width: 100%; height:100%; box-sizing:border-box; display:flex; gap:1ch; min-height: 0; flex: 1; }
.aoc-pane { flex:1; border: 1px solid var(--muted); display:flex; flex-direction:column; background: var(--bg); box-shadow: 0 0 0 1px var(--bg) inset; overflow:hidden; min-height: 0; }
.aoc-pane.active { border-color: var(--accent); }
.aoc-title { background: var(--muted); color: var(--bg); text-align: center; padding: 2px 0; font-weight: bold; text-transform: uppercase; font-size: 12px; flex-shrink: 0; }
.aoc-pane.active .aoc-title { background: var(--accent); }
#aoc-list { flex: 1; padding: 4px 8px; overflow: auto; white-space: pre; }
#aoc-preview { flex: 1; padding: 4px 8px; overflow: auto; white-space: pre-wrap; }
.aoc-item { cursor: pointer; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aoc-item.selected { background: var(--accent); color: var(--bg); font-weight: bold; }
.aoc-dir { color: var(--accent); }
#aoc-preview { color: var(--fg); scrollbar-width: thin; scrollbar-color: var(--muted) var(--bg); }
#aoc-preview h1, #aoc-preview h2, #aoc-preview h3 { color: var(--accent); margin: 1em 0 0.5em; text-transform: uppercase; }
#aoc-preview h1 { font-size: 1.2em; border-bottom: 1px dashed var(--muted); }
#aoc-preview h2 { font-size: 1.1em; border-bottom: 1px dotted var(--muted); }
#aoc-preview h3 { font-size: 1.0em; font-style: italic; }
#aoc-preview strong { color: var(--accent); }
#aoc-preview ul { list-style: none; padding-left: 2ch; margin: 0.5em 0; }
#aoc-preview li::before { content: "» "; color: var(--accent); }
#aoc-preview p, #aoc-preview div { margin: 0; min-height: 1em; }
#aoc-preview::-webkit-scrollbar { width: 6px; }
#aoc-preview::-webkit-scrollbar-track { background: var(--bg); }
#aoc-preview::-webkit-scrollbar-thumb { background: var(--muted); }

body.mode-cga { --rows:25; font-size: 20px; }
body.mode-ega { --rows:43; font-size: 18px; }
body.mode-vga { --rows:50; font-size: 16px; }

.touch-bar { display: none; background: var(--bg); border: 1px solid var(--muted); padding: 4px; flex-direction: column; gap: 8px; justify-content: center; flex-shrink: 0; z-index: 20; }
body.is-touch .touch-bar { display: flex; }

@media (max-width: 768px) {
  body { font-size: 14px !important; }
  .wrap { width: 100vw !important; border: none; }
  #aoc-view { flex-direction: column !important; width: 100% !important; padding: 4px; gap: 4px; }
  .aoc-pane { height: auto !important; flex: 1 !important; margin-bottom: 0; min-height: 0; }
  #sys-ram { display: none; }
  .foot { flex-wrap: wrap; gap: 4px; padding: 8px 4px; }
  .f-key { background: rgba(128, 237, 153, 0.1); padding: 2px 6px; border: 1px solid var(--muted); border-radius: 2px; }
  .touch-bar { display: flex !important; flex-direction: row !important; height: auto !important; width: 100% !important; box-sizing: border-box; margin: 2px 0; }
}
.t-btn { border: 1px solid var(--muted); padding: 6px 12px; color: var(--accent); cursor: pointer; font-size: 14px; font-weight: bold; user-select: none; }
.t-btn:active { background: var(--accent); color: var(--bg); }

#out { display:flex; flex-direction:column; gap:0.5rem; margin:0; }

.output-block { white-space:pre-wrap; }
.help-panel { border:1px solid var(--muted); background:var(--bg); padding:0.9rem 1rem 1rem; box-shadow: 0 0 0 1px var(--bg) inset; }
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

.foot { display:flex; background:var(--bg); border-top:1px solid var(--muted); padding:4px 2px; justify-content:space-around; font-size:11px; }
body.theme-blue .foot { background: #0000aa; border-top-color: #ffffff; }
body.theme-bw .foot { background: #000000; border-top-color: #ffffff; }
body.theme-pearl .foot { background: #dcdcdc; border-top-color: #2a2a2a; }

.f-key { display:flex; gap:2px; cursor:pointer; user-select:none; }
.f-num { color:var(--accent); font-weight:bold; }
.f-label { color:var(--muted); }
.f-key:hover .f-label { color:var(--fg); }
`;
