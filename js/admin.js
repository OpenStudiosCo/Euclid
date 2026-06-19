
// Integrations
import PotraceIntegration from "./integrations/PotraceIntegration.js";

// UI
import LaunchButton from "./ui/LaunchButton.js";
import PreviewArea        from "./ui/PreviewArea.js";
import Tools              from "./ui/Tools.js";

window.euclid = {};

jQuery(function ($) {

    // Modal (Media Library)
    $(document).on("image-editor-ui-ready", () => {
        window.euclid.init($);
    });
});

/**
 * Initialise the Euclid editor.
 *
 * @param jQuery $
 */
window.euclid.init = ($) => {

    // Populate initial settings.
    window.euclid.initialSettings($);

    // Add our Convert to Vector button
    window.euclid.launchButton = new LaunchButton($);

    // SVG preview and tools
    window.euclid.preview = new PreviewArea($);
    window.euclid.tools   = new Tools($);

    // Potrace integration
    window.euclid.potrace = new PotraceIntegration($);

    // Source image.
    window.euclid.src = $(".imgedit-crop-wrap img").attr("src");

}

/**
 * Frontend Settings scaffold.
 */
window.euclid.initialSettings = ($) => {
    let settings = {
        method: "imagetracer",
        selectors: {
            preview: $(".imgedit-crop-preview"),
        }
    };
    for (let key in settings) {
        let value = settings[key];
        window.euclid[key] = value;
    }
}

/**
 * Save SVG Ajax caller.
 */
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

/**
 * Changes the active vectorisation library and displayed tools.
 */
window.euclid.changeMethod = function () {
    const method = jQuery("#euclid-vectorisation-method").val();
    window.euclid.method = method;
    window.euclid.preview.loadSVG();
}
