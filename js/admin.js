
// Integrations
import ColourIntegration from "./integrations/ColourIntegration.js";
import PotraceIntegration from "./integrations/PotraceIntegration.js";

// UI
import LaunchButton from "./ui/LaunchButton.js";
import PreviewArea        from "./ui/PreviewArea.js";
import SourceImage        from "./ui/SourceImage.js";
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

    // SVG preview. The selector is recorded after the node exists.
    window.ositv.preview = new PreviewArea($);
    window.ositv.selectors.preview = $("#ositv-vector-preview");

    // The Media Library preview image. Tracing keeps using this URL; the
    // source overlay only paints adjustments on top of it.
    const sourceImg = document.querySelector('img[id^="image-preview-"]')
        || document.querySelector('.imgedit-crop-wrap > img');
    window.ositv.src = sourceImg ? (sourceImg.currentSrc || sourceImg.src) : '';

    // Tracing integrations (constructed before Tools so the panel can sync controls)
    window.ositv.colour = new ColourIntegration();
    window.ositv.potrace = new PotraceIntegration();

    window.ositv.sourceImage = new SourceImage(sourceImg);

    // Output Options panel
    window.ositv.tools = new Tools($);

    // Record the method. The traced grid waits for Convert to Vector.
    window.ositv.changeMethod();

}

/**
 * Frontend Settings scaffold.
 */
window.ositv.initialSettings = ($) => {
    let settings = {
        method: "colour",
        selectors: {},
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
        window.ositv.colour.save();
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
 * Changes the active vectorisation method and refreshes the preview.
 */
window.ositv.changeMethod = function () {
    const method = jQuery("#ositv-vectorisation-method").val();
    window.ositv.method = method;
    if (window.ositv.sourceImage) {
        window.ositv.sourceImage.renderActiveAdjustments();
    }
    window.ositv.preview.loadSVG();
}
