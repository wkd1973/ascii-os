import { clientScript } from "./clientScript";
import { webStyles } from "./styles";

export const renderWebPage = (): string => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ascii-os web</title>
  <style>${webStyles}</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div class="head-brand">
        <span>ascii-os:web</span>
        <span class="head-sep">|</span>
        <a href="#" id="aoc-link" class="head-link">commander</a>
      </div>
      <div id="sys-stats">
        <span id="sys-ram">640K OK</span>
        <span id="sys-clock">00:00:00</span>
      </div>
    </div>
    <div class="term">
      <div id="cli-view">
        <div id="screen">
          <div id="out"></div>
          <form class="row" id="form">
            <span class="muted" id="prompt">ascii-os:[/]> </span>
            <input id="in" autocomplete="off" />
          </form>
        </div>
      </div>
      <div id="aoc-view" style="display: none;">
        <div id="aoc-left" class="aoc-pane">
          <div class="aoc-title">Directory</div>
          <div id="aoc-list"></div>
        </div>
        <div class="touch-bar" id="touch-bar">
          <div class="t-btn" id="t-up">UP</div>
          <div class="t-btn" id="t-dn">DN</div>
          <div class="t-btn" id="t-tab">TAB</div>
          <div class="t-btn" id="t-ent">ENT</div>
          <div class="t-btn" id="t-esc">ESC</div>
        </div>
        <div id="aoc-right" class="aoc-pane">
          <div class="aoc-title">Preview</div>
          <div id="aoc-preview"></div>
        </div>
      </div>
    </div>
    <div id="cli-foot" class="foot">
      <div class="f-key" onclick="fKey(1)"><span class="f-num">Alt+1</span><span class="f-label">Help</span></div>
      <div class="f-key" onclick="fKey(2)"><span class="f-num">Alt+2</span><span class="f-label">Home</span></div>
      <div class="f-key" onclick="fKey(3)"><span class="f-num">Alt+3</span><span class="f-label">Proj</span></div>
      <div class="f-key" onclick="fKey(4)"><span class="f-num">Alt+4</span><span class="f-label">About</span></div>
      <div class="f-key" onclick="fKey(5)"><span class="f-num">Alt+5</span><span class="f-label">CV</span></div>
      <div class="f-key" onclick="fKey(6)"><span class="f-num">Alt+6</span><span class="f-label">Guide</span></div>
      <div class="f-key" onclick="fKey(7)"><span class="f-num">Alt+7</span><span class="f-label">Mode</span></div>
      <div class="f-key" onclick="fKey(8)"><span class="f-num">Alt+8</span><span class="f-label">Cls</span></div>
      <div class="f-key" onclick="fKey(9)"><span class="f-num">Alt+9</span><span class="f-label">Boot</span></div>
      <div class="f-key" onclick="fKey(0)"><span class="f-num">Alt+0</span><span class="f-label">Exit</span></div>
    </div>
    <div id="aoc-foot" class="foot" style="display: none;">
      <div class="f-key" onclick="fKey(1)"><span class="f-num">Alt+1</span><span class="f-label">Help</span></div>
      <div class="f-key" onclick="fKey(2)"><span class="f-num">Alt+2</span><span class="f-label">Home</span></div>
      <div class="f-key" onclick="fKey(3)"><span class="f-num">Alt+3</span><span class="f-label">View</span></div>
      <div class="f-key" onclick="fKey(4)"><span class="f-num">Alt+4</span><span class="f-label">About</span></div>
      <div class="f-key" onclick="fKey(5)"><span class="f-num">Alt+5</span><span class="f-label">CV</span></div>
      <div class="f-key" onclick="fKey(6)"><span class="f-num">Alt+6</span><span class="f-label">Guide</span></div>
      <div class="f-key" onclick="fKey(7)"><span class="f-num">Alt+7</span><span class="f-label">Mode</span></div>
      <div class="f-key" onclick="fKey(8)"><span class="f-num">Alt+8</span><span class="f-label">Cls</span></div>
      <div class="f-key" onclick="fKey(9)"><span class="f-num">Alt+9</span><span class="f-label">Boot</span></div>
      <div class="f-key" onclick="fKey(0)"><span class="f-num">Alt+0</span><span class="f-label">Quit</span></div>
    </div>
  </div>
  <script>${clientScript}</script>
</body>
</html>`;
