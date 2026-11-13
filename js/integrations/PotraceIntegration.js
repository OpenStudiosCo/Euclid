/**
 * Potrace integration.
 *
 * Black-and-white tracing adapter: levels preprocess, then a mid-grey cut,
 * then Potrace. Presets and fine-tune options arrive from the Tools UI.
 */

import { applyHueSaturationLevels, applyThreshold } from '../lib/image-adjust.js';
import { BW_PRESETS, DEFAULT_BW_PRESET } from '../lib/trace-presets.js';
import { traceMask } from '../lib/potrace-mask.js';

/**
 * After levels, the centre stop sits on mid-grey. Cutting there makes the
 * three levels handles the light/dark distribution of the trace.
 */
const LEVELS_TRACE_CUT = 128;

/**
 * @typedef {Object} PotraceIntegrationOptions
 * @property {number} [levelsDark]
 * @property {number} [levelsCenter]
 * @property {number} [levelsLight]
 * @property {number} [alphamax]
 * @property {boolean} [optcurve]
 * @property {number} [opttolerance]
 * @property {number} [turdsize]
 * @property {string} [turnpolicy]
 */

export default class PotraceIntegration {

    /**
     * @param {PotraceIntegrationOptions} [options]
     */
    constructor(options = {}) {
        const defaults = BW_PRESETS[DEFAULT_BW_PRESET];
        this.options = {
            ...defaults,
            ...options,
        };
    }

    /**
     * @param {PotraceIntegrationOptions} options
     */
    setOptions(options = {}) {
        this.options = { ...this.options, ...options };
    }

    /**
     * @returns {PotraceIntegrationOptions}
     */
    getOptions() {
        return { ...this.options };
    }

    /**
     * Apply a named B&W preset.
     *
     * @param {string} presetKey
     */
    applyPreset(presetKey) {
        const preset = BW_PRESETS[presetKey];
        if (!preset) {
            return;
        }
        this.setOptions({ ...preset });
    }

    /**
     * Apply current Potrace curve-fitting parameters.
     */
    _applyPotraceParams() {
        Potrace.setParameter({
            alphamax: this.options.alphamax,
            optcurve: this.options.optcurve,
            opttolerance: this.options.opttolerance,
            turdsize: this.options.turdsize,
            turnpolicy: this.options.turnpolicy,
        });
    }

    /**
     * Load the source image, apply levels, then cut at mid-grey.
     *
     * @param {string} src
     * @returns {Promise<ImageData>}
     */
    _loadThresholdedImageData(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                applyHueSaturationLevels(imageData, {
                    levelsDark: this.options.levelsDark,
                    levelsCenter: this.options.levelsCenter,
                    levelsLight: this.options.levelsLight,
                });
                applyThreshold(imageData, LEVELS_TRACE_CUT);
                resolve(imageData);
            };
            img.onerror = () => reject(new Error('Failed to load image for B&W trace'));
            img.src = src;
        });
    }

    /**
     * Create an SVG from the source image and current settings.
     *
     * @param {string} src
     * @param {(svg: string) => void} callbackFn
     */
    createSVG(src, callbackFn) {
        this._applyPotraceParams();

        this._loadThresholdedImageData(src)
            .then((imageData) => traceMask(imageData))
            .then(({ d, width, height }) => {
                const path = d
                    ? `<path d="${d}" stroke="none" fill="black" fill-rule="evenodd"/>`
                    : '';
                const svg =
                    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ` +
                    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
                    path +
                    `</svg>`;
                callbackFn(svg);
            })
            .catch((err) => {
                console.error('PotraceIntegration failed:', err);
                callbackFn('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
            });
    }

    preview() {
        this.createSVG(window.ositv.src, function (svg) {
            window.ositv.preview.show(svg);
        });
    }

    save() {
        this.createSVG(window.ositv.src, window.ositv.submitFile);
    }
}
