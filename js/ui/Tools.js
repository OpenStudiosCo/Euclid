export default class Tools {
  constructor($) {

    const tools = $(
        `<div id="ositv-container" class="imgedit-group imgedit-ositv">
          <div class="imgedit-group-controls">
            <h2>Output Options</h2>
            <p>
                Method:
                <select id="ositv-vectorisation-method" onchange="window.ositv.changeMethod()">
                    <option value="potrace" selected>Black and White</option>
                    <option value="imagetracer">Colour</option>
                </select>
            </p>
            <p>
                <button onclick="window.ositv.save()" class="button">Save SVG</button>
                <button disabled class="button">Download SVG</button>
            </p>
          </div>
        </div>`,
    );

    const toolArea = $(".imgedit-tool-active");
    toolArea.append(tools);

  }

}
