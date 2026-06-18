window.euclid = {};

jQuery(function ($) {

    // Modal (Media Library)
    $(document).on("image-editor-ui-ready", () => {
        window.euclid.init($);
    });
});

window.euclid.init = ($) => {
    // Add our Convert to Vector button
    const cropButton = $(".imgedit-crop");
    const convertBtn = $(
        '<button class="button convert-to-vector">Convert to Vector</button>',
    );
    cropButton.after(convertBtn);

    convertBtn.on("click", function (e) {
        e.preventDefault();

        const euclidContainer = $(".imgedit-euclid");
        euclidContainer.toggleClass("imgedit-panel-active");
    });

    // Add the preview to the sidebar.
    const preview = $(
        `<div class="imgedit-group imgedit-euclid">
            <div class="imgedit-group-controls">
                <div class="imgedit-crop-wrap">
                    <div class="imgedit-crop-preview"></div>
                </div>
            </div>
        </div>`,
    );

    const previewArea = $(".imgedit-tools");
    previewArea.append(preview);

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
            <select id="euclid-vectorisation-method">
                <option value="potrace">Potrace</option>
                <option value="imagetracer" selected>ImageTracer</option>
            </select>
          </div>
        </div>`,
    );

    const toolArea = $(".imgedit-tool-active");
    toolArea.append(tools);

    const src = $(".imgedit-crop-wrap img").attr("src");

    // Create an SVG from data and settings, draw to screen.
    Potrace.clear();
    Potrace.loadImageFromSrc(src);
    Potrace.process(function () {
        var svg = Potrace.getSVG(1);
        const previewBox = $(".imgedit-crop-preview");
        previewBox.html(svg);
    });
}

window.euclid.save = function () {

    const svg = Potrace.getSVG(1);

    jQuery.ajax({
        url: ajaxurl,
        method: "POST",
        data: {
            action: "euclid_save_svg",
            svg: svg,
            attachment_id: imageEdit.postid,
        },
        success: function (res) {
            console.log("Saved:", res);
            alert("SVG created in Media Library");
        },
        error: function (err) {
            console.error(err);
            alert("Error saving SVG");
        },
    });
}

window.euclid.changeMethod = function () {
    const method = $("#euclid-vectorisation-method").val();
    if (method === "imagetracer") {
        
    }
}
