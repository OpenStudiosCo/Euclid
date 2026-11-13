/**
 * Colour vectorisation integration.
 *
 * Adapter around ColourTracer (quantize → stacked Potrace layers).
 * Presets and fine-tune options arrive from the Tools UI.
 */

import ColourTracer from '../lib/ColourTracer.js';
import { COLOUR_PRESETS, DEFAULT_COLOUR_PRESET } from '../lib/trace-presets.js';

export default class ColourIntegration {

    /** @type {ColourTracer} */
    colourTracer;

    constructor() {
        const defaults = COLOUR_PRESETS[DEFAULT_COLOUR_PRESET];
        this.colourTracer = new ColourTracer({ ...defaults });
    }

    /**
     * @param {object} options
     */
    setOptions(options = {}) {
        this.colourTracer.setOptions(options);
    }

    /**
     * @returns {object}
     */
    getOptions() {
        return this.colourTracer.getOptions();
    }

    /**
     * Apply a named colour preset.
     *
     * @param {string} presetKey
     */
    applyPreset(presetKey) {
        const preset = COLOUR_PRESETS[presetKey];
        if (!preset) {
            return;
        }
        this.colourTracer.setOptions({ ...preset });
    }

    preview() {
        this.colourTracer.createSVG(window.ositv.src, function (svg) {
            window.ositv.preview.show(svg);
        });
    }

    save() {
        this.colourTracer.createSVG(window.ositv.src, window.ositv.submitFile);
    }
}
