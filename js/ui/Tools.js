export default class Tools {
  constructor($) {

    const tools = $(
        `<div id="euclid-container" class="imgedit-group imgedit-euclid">
          <div class="imgedit-group-controls">
            <h2>Output Options</h2>
            <p>
                Method:
                <select id="euclid-vectorisation-method" onchange="window.euclid.changeMethod()">
                    <option value="potrace" selected>Black and White</option>
                    <option value="imagetracer">Colour</option>
                </select>
            </p>
            <p>
                <button onclick="window.euclid.save()" class="button">Save SVG</button>
                <button disabled class="button">Download SVG</button>
            </p>
          </div>
        </div>`,
    );

    const toolArea = $(".imgedit-tool-active");
    toolArea.append(tools);

  }

}
