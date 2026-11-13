/**
 * Image preprocess helpers for tracing.
 *
 * Adjustments happen on ImageData before Potrace or median-cut, so we never
 * patch the vendored Potrace luminance cut-off.
 */

/**
 * Three-stop levels. The centre value is the input that maps to mid-grey,
 * sitting between the dark and light boundaries.
 *
 * @typedef {Object} LevelsStops
 * @property {number} dark
 * @property {number} center
 * @property {number} light
 */

/**
 * @typedef {Object} HueSaturationLevels
 * @property {number} [hue]            Degrees to shift hue (−180…180)
 * @property {number} [saturation]     Saturation bias (−100…100)
 * @property {number} [levelsDark]     Dark boundary, 0…255
 * @property {number} [levelsCenter]   Centre, mapped to mid-grey
 * @property {number} [levelsLight]    Light boundary, 0…255
 */

export const LEVELS_DARK_DEFAULT = 0;
export const LEVELS_CENTER_DEFAULT = 128;
export const LEVELS_LIGHT_DEFAULT = 255;

/**
 * Convert an RGB pixel to HSL (h in [0,1), s/l in [0,1]).
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{ h: number, s: number, l: number }}
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) {
        return { h: 0, s: 0, l };
    }
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    switch (max) {
        case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
        case g:
            h = ((b - r) / d + 2) / 6;
            break;
        default:
            h = ((r - g) / d + 4) / 6;
            break;
    }
    return { h, s, l };
}

/**
 * @param {number} p
 * @param {number} q
 * @param {number} t
 * @returns {number}
 */
function hueToRgb(p, q, t) {
    let tt = t;
    if (tt < 0) {
        tt += 1;
    }
    if (tt > 1) {
        tt -= 1;
    }
    if (tt < 1 / 6) {
        return p + (q - p) * 6 * tt;
    }
    if (tt < 1 / 2) {
        return q;
    }
    if (tt < 2 / 3) {
        return p + (q - p) * (2 / 3 - tt) * 6;
    }
    return p;
}

/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {{ r: number, g: number, b: number }}
 */
function hslToRgb(h, s, l) {
    if (s === 0) {
        const v = Math.round(l * 255);
        return { r: v, g: v, b: v };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hueToRgb(p, q, h) * 255),
        b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
    };
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInt(value, min, max) {
    const rounded = Math.round(Number(value) || 0);
    return Math.max(min, Math.min(max, rounded));
}

/**
 * Keep the three stops in order: dark < centre < light.
 *
 * @param {number} dark
 * @param {number} center
 * @param {number} light
 * @returns {LevelsStops}
 */
export function normaliseLevels(dark, center, light) {
    let d = clampInt(dark ?? LEVELS_DARK_DEFAULT, 0, 255);
    let c = clampInt(center ?? LEVELS_CENTER_DEFAULT, 0, 255);
    let l = clampInt(light ?? LEVELS_LIGHT_DEFAULT, 0, 255);

    if (l - d < 2) {
        if (d > 253) {
            d = 253;
            l = 255;
        } else {
            l = Math.min(255, d + 2);
        }
    }

    if (c <= d) {
        c = d + 1;
    }
    if (c >= l) {
        c = l - 1;
    }

    return { dark: d, center: c, light: l };
}

/**
 * True when hue, saturation and levels would leave pixels unchanged.
 *
 * @param {HueSaturationLevels} [adjust]
 * @returns {boolean}
 */
export function adjustmentIsNeutral(adjust = {}) {
    const hue = adjust.hue || 0;
    const saturation = adjust.saturation || 0;
    const { dark, center, light } = normaliseLevels(
        adjust.levelsDark,
        adjust.levelsCenter,
        adjust.levelsLight,
    );
    return hue === 0
        && saturation === 0
        && dark === LEVELS_DARK_DEFAULT
        && center === LEVELS_CENTER_DEFAULT
        && light === LEVELS_LIGHT_DEFAULT;
}

/**
 * Adjustments the active method should show on the source picture.
 * Black and white shares levels, and ignores hue and saturation.
 *
 * @param {string} method
 * @param {HueSaturationLevels} [options]
 * @returns {HueSaturationLevels}
 */
export function adjustmentsForMethod(method, options = {}) {
    const colour = method === 'colour';
    return {
        hue: colour ? (options.hue || 0) : 0,
        saturation: colour ? (options.saturation || 0) : 0,
        levelsDark: options.levelsDark,
        levelsCenter: options.levelsCenter,
        levelsLight: options.levelsLight,
    };
}

/**
 * Gamma that maps the centre stop onto 50% grey between the boundaries.
 *
 * @param {number} dark
 * @param {number} center
 * @param {number} light
 * @returns {number}
 */
function gammaForCentre(dark, center, light) {
    const mid = (center - dark) / (light - dark);
    if (Math.abs(mid - 0.5) < 1e-6) {
        return 1;
    }
    const clamped = Math.min(0.99, Math.max(0.01, mid));
    return Math.log(0.5) / Math.log(clamped);
}

/**
 * Map one channel through the dark boundary, centre and light boundary.
 *
 * @param {number} value
 * @param {number} dark
 * @param {number} light
 * @param {number} gamma
 * @returns {number}
 */
function mapChannel(value, dark, light, gamma) {
    const t = (value - dark) / (light - dark);
    if (t <= 0) {
        return 0;
    }
    if (t >= 1) {
        return 255;
    }
    const shaped = gamma === 1 ? t : Math.pow(t, gamma);
    return Math.max(0, Math.min(255, Math.round(shaped * 255)));
}

/**
 * Binarise by luminance threshold. Pixels darker than threshold become black
 * (foreground for Potrace); others become white.
 *
 * Mutates and returns the same ImageData.
 *
 * @param {ImageData} imageData
 * @param {number} threshold 0…255 (default 128 matches vendored Potrace)
 * @returns {ImageData}
 */
export function applyThreshold(imageData, threshold = 128) {
    const cut = Math.max(0, Math.min(255, threshold | 0));
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const lum = 0.2126 * data[i] + 0.7153 * data[i + 1] + 0.0721 * data[i + 2];
        const v = lum < cut ? 0 : 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
    }
    return imageData;
}

/**
 * Apply hue / saturation / levels before tracing.
 *
 * Levels is a three-stop remap: values at or below the dark boundary become
 * black, values at or above the light boundary become white, and the centre
 * stop is the input that lands on mid-grey. Mutates and returns the same
 * ImageData. No-ops when every adjustment is neutral.
 *
 * @param {ImageData} imageData
 * @param {HueSaturationLevels} [adjust]
 * @returns {ImageData}
 */
export function applyHueSaturationLevels(imageData, adjust = {}) {
    if (adjustmentIsNeutral(adjust)) {
        return imageData;
    }

    const hue = adjust.hue || 0;
    const saturation = adjust.saturation || 0;
    const { dark, center, light } = normaliseLevels(
        adjust.levelsDark,
        adjust.levelsCenter,
        adjust.levelsLight,
    );
    const levelsNeutral = dark === LEVELS_DARK_DEFAULT
        && center === LEVELS_CENTER_DEFAULT
        && light === LEVELS_LIGHT_DEFAULT;
    const gamma = levelsNeutral ? 1 : gammaForCentre(dark, center, light);

    const hueShift = ((hue % 360) + 360) % 360 / 360;
    const satMul = 1 + saturation / 100;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 32) {
            continue;
        }

        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (!levelsNeutral) {
            r = mapChannel(r, dark, light, gamma);
            g = mapChannel(g, dark, light, gamma);
            b = mapChannel(b, dark, light, gamma);
        }

        if (hue || saturation) {
            const hsl = rgbToHsl(r, g, b);
            hsl.h = (hsl.h + hueShift) % 1;
            hsl.s = Math.max(0, Math.min(1, hsl.s * satMul));
            const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
            r = rgb.r;
            g = rgb.g;
            b = rgb.b;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }

    return imageData;
}
