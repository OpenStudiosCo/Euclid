/**
 * Colour vectorisation integration.
 *
 * Quantization + Inkscape-style stacked Potrace layers via ColorPotrace.
 * Presets / fine-tune UI come later; this pass uses all-rounder defaults.
 */

import ColorPotrace from './ColorPotrace.js';

export default class ImagetracerIntegration {

    /** @type {ColorPotrace} */
    colorPotrace;

    constructor() {
        this.colorPotrace = new ColorPotrace({
            numberofcolors: 8,
            removeBackground: 'auto',
            turdsize: 20,
        });
    }

    preview() {
        this.colorPotrace.createSVG(window.ositv.src, function (svg) {
            const previewBox = jQuery('.imgedit-crop-preview');
            previewBox.html(svg);
        });
    }

    save() {
        this.colorPotrace.createSVG(window.ositv.src, window.ositv.submitFile);
    }
}
