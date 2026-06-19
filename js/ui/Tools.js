export default class Tools {
  constructor($) {

    const tools = $(
        `<div id="euclid-container" class="imgedit-group imgedit-euclid">
          <div class="imgedit-group-controls">
            <h2>Preview Layout</h2>
            <p>
                <button disabled class="button">Side by side</button>
                <button disabled class="button">Top and bottom</button>
                <button disabled class="button">Overlay</button>
            </p>
            <h2>Output Options</h2>
            <p>
                <button onclick="window.euclid.save()" class="button">Save SVG</button>
                <button disabled class="button">Download SVG</button>
            </p>
            <h2>Vectorisation Settings</h2>
            Method:
            <select id="euclid-vectorisation-method" onchange="window.euclid.changeMethod()">
                <option value="potrace">Potrace</option>
                <option value="imagetracer" selected>ImageTracer</option>
            </select>
          </div>
        </div>`,
    );

    const toolArea = $(".imgedit-tool-active");
    toolArea.append(tools);

  }

}
