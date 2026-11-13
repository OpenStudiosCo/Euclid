/**
 * Shared tracing presets for Output Options.
 *
 * Single source of truth for Tools UI and integrations.
 */

/** @typedef {import('./image-adjust.js').HueSaturationLevels} HueSaturationLevels */

/**
 * @typedef {Object} PotraceParams
 * @property {number} alphamax
 * @property {boolean} optcurve
 * @property {number} opttolerance
 * @property {number} turdsize
 * @property {string} turnpolicy
 */

/**
 * levelsCenter is the input grey that maps to mid-grey. With the boundaries
 * at 0 and 255, black-and-white tracing cuts there, so the centre stop is
 * the light/dark threshold.
 *
 * @typedef {PotraceParams & {
 *   levelsDark: number,
 *   levelsCenter: number,
 *   levelsLight: number,
 * }} BwPreset
 */

/**
 * @typedef {PotraceParams & {
 *   numberofcolors: number,
 *   hue: number,
 *   saturation: number,
 *   levelsDark: number,
 *   levelsCenter: number,
 *   levelsLight: number,
 *   removeBackground: boolean|string
 * }} ColourPreset
 */

/** @type {Record<string, BwPreset>} */
export const BW_PRESETS = {
    silhouette: {
        levelsDark: 0,
        levelsCenter: 140,
        levelsLight: 255,
        turdsize: 150,
        alphamax: 0.5,
        optcurve: true,
        opttolerance: 0.2,
        turnpolicy: 'black',
    },
    handDrawing: {
        levelsDark: 0,
        levelsCenter: 128,
        levelsLight: 255,
        turdsize: 20,
        alphamax: 1.0,
        optcurve: false,
        opttolerance: 0.2,
        turnpolicy: 'black',
    },
    detailed: {
        levelsDark: 0,
        levelsCenter: 128,
        levelsLight: 255,
        turdsize: 2,
        alphamax: 1.3,
        optcurve: false,
        opttolerance: 0.1,
        turnpolicy: 'black',
    },
};

/** @type {Record<string, ColourPreset>} */
export const COLOUR_PRESETS = {
    logo: {
        numberofcolors: 8,
        hue: 0,
        saturation: 0,
        levelsDark: 0,
        levelsCenter: 128,
        levelsLight: 255,
        turdsize: 30,
        alphamax: 1.0,
        optcurve: false,
        opttolerance: 0.2,
        turnpolicy: 'black',
        removeBackground: 'auto',
    },
    posterise: {
        numberofcolors: 6,
        hue: 0,
        saturation: 0,
        levelsDark: 0,
        levelsCenter: 128,
        levelsLight: 255,
        turdsize: 40,
        alphamax: 0.8,
        optcurve: true,
        opttolerance: 0.2,
        turnpolicy: 'black',
        removeBackground: 'auto',
    },
    photoQuality: {
        numberofcolors: 24,
        hue: 0,
        saturation: 0,
        levelsDark: 0,
        levelsCenter: 128,
        levelsLight: 255,
        turdsize: 8,
        alphamax: 1.0,
        optcurve: false,
        opttolerance: 0.2,
        turnpolicy: 'black',
        removeBackground: 'auto',
    },
};

export const DEFAULT_BW_PRESET = 'silhouette';
export const DEFAULT_COLOUR_PRESET = 'logo';

/**
 * Labels shown in the Tools preset selects.
 */
export const BW_PRESET_LABELS = {
    silhouette: 'Silhouette',
    handDrawing: 'Hand Drawing',
    detailed: 'Detailed',
};

export const COLOUR_PRESET_LABELS = {
    logo: 'Logo',
    posterise: 'Posterise',
    photoQuality: 'Photo-quality',
};
