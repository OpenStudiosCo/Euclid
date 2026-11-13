/**
 * Inkscape-style colour tracing: quantize → stacked masks → Potrace per layer.
 *
 * Quantization uses median-cut. Curve fitting is Potrace. Optional hue,
 * saturation and three-stop levels run before quantization.
 */

import { applyHueSaturationLevels } from './image-adjust.js';
import { quantizeMedianCut } from './median-cut.js';
import { traceMask } from './potrace-mask.js';
import { MAX_COLOURS } from './trace-presets.js';

const ALPHA_CUTOFF = 32;
const DEFAULT_COLOURS = 8;

/**
 * @typedef {Object} ColourTracerOptions
 * @property {number} [numberofcolors]
 * @property {number} [hue]
 * @property {number} [saturation]
 * @property {number} [levelsDark]
 * @property {number} [levelsCenter]
 * @property {number} [levelsLight]
 * @property {boolean|string} [removeBackground] true | false | 'auto'
 * @property {number} [turdsize]
 * @property {number} [alphamax]
 * @property {boolean} [optcurve]
 * @property {number} [opttolerance]
 * @property {string} [turnpolicy]
 */

export default class ColourTracer {

    /**
     * @param {ColourTracerOptions} [options]
     */
    constructor(options = {}) {
        this.options = {
            numberofcolors: DEFAULT_COLOURS,
            hue: 0,
            saturation: 0,
            levelsDark: 0,
            levelsCenter: 128,
            levelsLight: 255,
            removeBackground: 'auto',
            turdsize: 20,
            alphamax: 1,
            optcurve: false,
            opttolerance: 0.2,
            turnpolicy: 'black',
            ...options,
        };
    }

    /**
     * Update runtime options (e.g. from the Tools UI).
     *
     * @param {ColourTracerOptions} options
     */
    setOptions(options = {}) {
        this.options = { ...this.options, ...options };
    }

    /**
     * @returns {ColourTracerOptions}
     */
    getOptions() {
        return { ...this.options };
    }

    /**
     * Trace a source image URL into a multi-colour stacked SVG.
     *
     * @param {string} src
     * @param {(svg: string) => void} callbackFn
     */
    createSVG(src, callbackFn) {
        this._loadImageData(src)
            .then((imgd) => this._traceImageData(imgd))
            .then(callbackFn)
            .catch((err) => {
                console.error('ColourTracer failed:', err);
                callbackFn('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
            });
    }

    /**
     * @param {string} src
     * @returns {Promise<ImageData>}
     */
    _loadImageData(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            };
            img.onerror = () => reject(new Error('Failed to load image for colour trace'));
            img.src = src;
        });
    }

    /**
     * @param {ImageData} imgd
     * @returns {Promise<string>}
     */
    async _traceImageData(imgd) {
        applyHueSaturationLevels(imgd, {
            hue: this.options.hue,
            saturation: this.options.saturation,
            levelsDark: this.options.levelsDark,
            levelsCenter: this.options.levelsCenter,
            levelsLight: this.options.levelsLight,
        });

        const width = imgd.width;
        const height = imgd.height;
        const data = imgd.data;

        const transparent = new Uint8Array(width * height);
        let transparentCount = 0;
        for (let p = 0, i = 0; p < data.length; p += 4, i++) {
            if (data[p + 3] < ALPHA_CUTOFF) {
                transparent[i] = 1;
                transparentCount++;
            }
        }

        const colourCount = Math.max(2, Math.min(MAX_COLOURS, this.options.numberofcolors | 0));
        const { indexed: rawIndexed, palette } = quantizeMedianCut(
            imgd,
            colourCount,
            transparent
        );

        // Collapse anti-alias duplicates before stacking. A fixed distance
        // chains across a large palette and folds it into one fill.
        const merged = this._mergeSimilarColours(
            palette,
            rawIndexed,
            this._mergeDistance(colourCount)
        );
        let { palette: workingPalette, indexed } = merged;

        // Sort palette dark → light; remap indices (Inkscape stack order).
        const order = workingPalette
            .map((c, i) => ({ i, lum: c.r + c.g + c.b }))
            .sort((a, b) => a.lum - b.lum);

        const remap = new Int16Array(workingPalette.length);
        const sortedPalette = order.map((o, newIndex) => {
            remap[o.i] = newIndex;
            return workingPalette[o.i];
        });

        for (let i = 0; i < indexed.length; i++) {
            const raw = indexed[i];
            indexed[i] = raw < 0 ? -1 : remap[raw];
        }

        const dropBackground = this._shouldRemoveBackground(
            sortedPalette,
            indexed,
            width,
            height,
            transparentCount / (width * height)
        );

        let layerCount = sortedPalette.length;
        if (dropBackground && layerCount > 1) {
            // Drop lightest, plus any trailing near-paper swatches left after merge.
            layerCount = this._backgroundCutIndex(sortedPalette);
        }

        Potrace.setParameter({
            alphamax: this.options.alphamax,
            optcurve: this.options.optcurve,
            opttolerance: this.options.opttolerance,
            turdsize: this.options.turdsize,
            turnpolicy: this.options.turnpolicy,
        });

        const layers = [];
        for (let colourIndex = 0; colourIndex < layerCount; colourIndex++) {
            const mask = this._buildStackedMask(indexed, width, height, colourIndex);
            if (!this._maskHasForeground(mask)) {
                continue;
            }
            const traced = await traceMask(mask);
            if (!traced.d) {
                continue;
            }
            const c = sortedPalette[colourIndex];
            layers.push({
                d: traced.d,
                fill: `rgb(${c.r},${c.g},${c.b})`,
            });
        }

        // Lightest remaining underlay first; darkest on top.
        layers.reverse();

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
        for (const layer of layers) {
            svg += `<path d="${layer.d}" fill="${layer.fill}" stroke="none" fill-rule="evenodd"/>`;
        }
        svg += '</svg>';
        return svg;
    }

    /**
     * How close two swatches must be before one is discarded.
     * Wide at logo counts, tight once the user has asked for a large palette.
     *
     * @param {number} colourCount
     * @returns {number}
     */
    _mergeDistance(colourCount) {
        const scaled = 36 * Math.sqrt(8 / Math.max(2, colourCount));
        return Math.max(8, Math.min(36, scaled));
    }

    /**
     * Fold each swatch into the nearest kept colour within `threshold`.
     *
     * Matching is not transitive. A chain of small steps must not pull
     * distant colours into the same fill.
     *
     * @param {{ r: number, g: number, b: number, a?: number }[]} palette
     * @param {Int16Array} indexed
     * @param {number} threshold
     */
    _mergeSimilarColours(palette, indexed, threshold) {
        const n = palette.length;
        const counts = new Int32Array(n);
        for (let i = 0; i < indexed.length; i++) {
            const idx = indexed[i];
            if (idx >= 0) {
                counts[idx]++;
            }
        }

        const order = [];
        for (let i = 0; i < n; i++) {
            order.push(i);
        }
        order.sort((a, b) => counts[b] - counts[a]);

        const thresh2 = threshold * threshold;
        const remap = new Int16Array(n);
        const newPalette = [];

        for (let k = 0; k < order.length; k++) {
            const source = order[k];
            const colour = palette[source];
            let match = -1;
            let best = thresh2;
            for (let j = 0; j < newPalette.length; j++) {
                const kept = newPalette[j];
                const dr = colour.r - kept.r;
                const dg = colour.g - kept.g;
                const db = colour.b - kept.b;
                const dist = dr * dr + dg * dg + db * db;
                if (dist <= best) {
                    best = dist;
                    match = j;
                }
            }
            if (match >= 0) {
                remap[source] = match;
            } else {
                remap[source] = newPalette.length;
                newPalette.push({ ...colour });
            }
        }

        const outIndexed = new Int16Array(indexed.length);
        for (let i = 0; i < indexed.length; i++) {
            const idx = indexed[i];
            outIndexed[i] = idx < 0 ? -1 : remap[idx];
        }

        return { palette: newPalette, indexed: outIndexed };
    }

    /**
     * How many stacked layers to keep when removing a paper-like background.
     * Drops the lightest scan and any trailing near-white duplicates.
     *
     * @param {{ r: number, g: number, b: number }[]} sortedPalette
     * @returns {number}
     */
    _backgroundCutIndex(sortedPalette) {
        const lightest = sortedPalette[sortedPalette.length - 1];
        let cut = sortedPalette.length - 1;
        for (let i = sortedPalette.length - 2; i >= 1; i--) {
            const c = sortedPalette[i];
            const lum = c.r + c.g + c.b;
            if (lum < 600) {
                break;
            }
            const dr = c.r - lightest.r;
            const dg = c.g - lightest.g;
            const db = c.b - lightest.b;
            if (dr * dr + dg * dg + db * db <= 45 * 45) {
                cut = i;
            } else {
                break;
            }
        }
        return Math.max(1, cut);
    }

    /**
     * Inkscape “Remove background” is optional. Blindly dropping the lightest
     * scan punches holes in full-bleed art (sky, neon, highlights).
     * Auto: only drop when pale paper-like colour dominates the border.
     *
     * @param {{ r: number, g: number, b: number }[]} sortedPalette
     * @param {Int16Array} indexed
     * @param {number} width
     * @param {number} height
     * @param {number} transparentRatio
     * @returns {boolean}
     */
    _shouldRemoveBackground(sortedPalette, indexed, width, height, transparentRatio) {
        const mode = this.options.removeBackground;
        if (mode === false || mode === 'false') {
            return false;
        }
        if (mode === true || mode === 'true') {
            return sortedPalette.length > 1;
        }

        // auto
        if (sortedPalette.length < 2) {
            return false;
        }

        const lightest = sortedPalette[sortedPalette.length - 1];
        const lum = lightest.r + lightest.g + lightest.b;
        if (lum < 600) {
            return false;
        }

        let borderTotal = 0;
        let borderPaper = 0;
        const sample = (x, y) => {
            const idx = indexed[y * width + x];
            if (idx < 0) {
                return;
            }
            borderTotal++;
            const c = sortedPalette[idx];
            const clum = c.r + c.g + c.b;
            const dr = c.r - lightest.r;
            const dg = c.g - lightest.g;
            const db = c.b - lightest.b;
            if (clum >= 600 && dr * dr + dg * dg + db * db <= 50 * 50) {
                borderPaper++;
            }
        };
        for (let x = 0; x < width; x++) {
            sample(x, 0);
            sample(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
            sample(0, y);
            sample(width - 1, y);
        }

        if (borderTotal === 0) {
            return false;
        }

        const borderRatio = borderPaper / borderTotal;
        if (borderRatio >= 0.6) {
            return true;
        }

        return transparentRatio > 0.15 && borderRatio >= 0.35;
    }

    /**
     * @param {Int16Array} indexed
     * @param {number} width
     * @param {number} height
     * @param {number} colourIndex
     * @returns {ImageData}
     */
    _buildStackedMask(indexed, width, height, colourIndex) {
        const mask = new ImageData(width, height);
        const data = mask.data;
        for (let i = 0; i < indexed.length; i++) {
            const idx = indexed[i];
            const on = idx >= 0 && idx <= colourIndex;
            const v = on ? 0 : 255;
            const p = i * 4;
            data[p] = v;
            data[p + 1] = v;
            data[p + 2] = v;
            data[p + 3] = 255;
        }
        return mask;
    }

    /**
     * @param {ImageData} mask
     * @returns {boolean}
     */
    _maskHasForeground(mask) {
        const data = mask.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 128) {
                return true;
            }
        }
        return false;
    }
}
