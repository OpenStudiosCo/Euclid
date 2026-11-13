
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

/**
 * Open media-library collections on this screen.
 *
 * The grid under the editor modal, and a post editor's media frame, each
 * keep their own library. A saved SVG has to be offered to those libraries
 * or the grid stays on the list from when the page loaded.
 *
 * @returns {object[]}
 */
function openMediaLibraries() {
    const media = window.wp && window.wp.media;
    if (!media) {
        return [];
    }

    const frames = [];
    if (media.frames) {
        if (media.frames.browse) {
            frames.push(media.frames.browse);
        }
        if (media.frames.edit) {
            frames.push(media.frames.edit);
        }
    }
    if (media.frame) {
        frames.push(media.frame);
    }

    const libraries = [];
    frames.forEach(function (frame) {
        if (!frame) {
            return;
        }
        if (frame.states && frame.states.each) {
            frame.states.each(function (state) {
                const library = state.get && state.get('library');
                if (library && libraries.indexOf(library) === -1) {
                    libraries.push(library);
                }
            });
            return;
        }
        if (frame.state && frame.state()) {
            const library = frame.state().get('library');
            if (library && libraries.indexOf(library) === -1) {
                libraries.push(library);
            }
        }
    });

    return libraries;
}

/**
 * Put a saved SVG into the media libraries already open on the page.
 *
 * @param {object} prepared Attachment attributes from wp_prepare_attachment_for_js().
 */
function showInMediaLibrary(prepared) {
    const media = window.wp && window.wp.media;
    if (!media || !media.model || !prepared || !prepared.id || !prepared.mime) {
        return;
    }

    const attachment = media.model.Attachment.create(prepared);
    attachment.set(attachment.parse(Object.assign({}, prepared)));

    openMediaLibraries().forEach(function (library) {
        // The grid's library is the query. A post editor's library mirrors
        // one, and that query counts the new file itself when it is added.
        const query = library.mirroring || library;
        const alreadyThere = !!query.get(attachment);

        if (typeof library.validate === 'function') {
            library.validate(attachment);
        }
        if (library.mirroring && typeof library.mirroring.validate === 'function') {
            library.mirroring.validate(attachment);
        }

        const added = !alreadyThere && !!query.get(attachment);
        if (added && !library.mirroring && typeof query.totalAttachments === 'number') {
            query.totalAttachments += 1;
        }
    });

    refreshLibraryCounts();
}

/**
 * The "Showing x of y" line reads the collection total. Refresh it after
 * the new SVG has been counted.
 */
function refreshLibraryCounts() {
    const media = window.wp && window.wp.media;
    if (!media) {
        return;
    }

    const frames = [];
    if (media.frames) {
        if (media.frames.browse) {
            frames.push(media.frames.browse);
        }
        if (media.frames.edit) {
            frames.push(media.frames.edit);
        }
    }
    if (media.frame) {
        frames.push(media.frame);
    }

    frames.forEach(function (frame) {
        if (!frame) {
            return;
        }
        const views = [];
        if (frame.browserView) {
            views.push(frame.browserView);
        }
        if (frame.content && frame.content.get) {
            views.push(frame.content.get());
        }
        views.forEach(function (view) {
            if (view && typeof view.updateLoadMoreView === 'function') {
                view.updateLoadMoreView();
            }
        });
    });
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
            if (!res.success) {
                alert("Error saving SVG: " + res.data);
                return;
            }

            showInMediaLibrary(res.data);
            alert("SVG created in Media Library");
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
