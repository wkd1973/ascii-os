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
  <script>${clientScript}</script>
</body>
</html>`;
