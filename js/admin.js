
// Integrations
import ImagetracerIntegration from "./integrations/ImagetracerIntegration.js";
import PotraceIntegration from "./integrations/PotraceIntegration.js";

// UI
import LaunchButton from "./ui/LaunchButton.js";
import PreviewArea        from "./ui/PreviewArea.js";
import Tools              from "./ui/Tools.js";

const configRaw = document.getElementById('wp-script-module-data-ositv-admin-bootstrap');
const config = JSON.parse(configRaw.textContent);

window.ositv = {};

jQuery(function ($) {

    // Modal (Media Library)
    $(document).on("image-editor-ui-ready", () => {
        window.ositv.init($);
    });
});

/**
 * Initialise the ositv editor.
 *
 * @param jQuery $
 */
window.ositv.init = ($) => {

    // Populate initial settings.
    window.ositv.initialSettings($);

    // Add our Convert to Vector button
    window.ositv.launchButton = new LaunchButton($);

    // SVG preview and tools
    window.ositv.preview = new PreviewArea($);
    window.ositv.tools   = new Tools($);

    // Imagetracer integration
    window.ositv.imagetracer = new ImagetracerIntegration($);

    // Potrace integration
    window.ositv.potrace = new PotraceIntegration($);

    // Source image.
    window.ositv.src = $(".imgedit-crop-wrap img").attr("src");

    // Initialise the preview area by setting the method.
    window.ositv.changeMethod();

}

/**
 * Frontend Settings scaffold.
 */
window.ositv.initialSettings = ($) => {
    let settings = {
        method: "imagetracer",
        selectors: {
            preview: $(".imgedit-crop-preview"),
        }
    };
    for (let key in settings) {
        let value = settings[key];
        window.ositv[key] = value;
    }
}

/**
 * Save SVG Ajax caller.
 */
window.ositv.save = function () {

    if (window.ositv.method === "potrace") {
        window.ositv.potrace.save();
    }
    else {
        window.ositv.imagetracer.save();
    }

}

// Called by the two integration save functions.
window.ositv.submitFile = function (svg) {
    jQuery.ajax({
        url: config.ajax_url,
        method: "POST",
        data: {
            action: "ositv_save_svg",
            svg: svg,
            attachment_id: imageEdit.postid,
            nonce: config.nonce
        },
        success: function (res) {
            if (res.success) {
                alert("SVG created in Media Library");
            }
            else {
                alert("Error saving SVG: " + res.data);
            }

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
window.ositv.changeMethod = function () {
    const method = jQuery("#ositv-vectorisation-method").val();
    window.ositv.method = method;
    window.ositv.preview.loadSVG();
}
