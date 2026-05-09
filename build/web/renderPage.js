"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWebPage = void 0;
const clientScript_1 = require("./clientScript");
const styles_1 = require("./styles");
const renderWebPage = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ascii-os web</title>
  <style>${styles_1.webStyles}</style>
</head>
<body>
  <div class="wrap">
    <div class="head">ascii-os:web</div>
    <div class="term">
      <div id="screen">
        <div id="out"></div>
        <form class="row" id="form">
          <span class="muted" id="prompt">ascii-os:[/]> </span>
          <input id="in" autocomplete="off" />
        </form>
      </div>
    </div>
  </div>
  <script>${clientScript_1.clientScript}</script>
</body>
</html>`;
exports.renderWebPage = renderWebPage;
