/**
 * Median-cut colour quantization (Inkscape-style posterize input for Potrace layers).
 * Returns an indexed colour map + palette for ColourTracer quantisation,
 * with better separation of distinct hues at low colour counts.
 */

/**
 * @typedef {{ r: number, g: number, b: number, a: number }} PaletteColor
 */

/**
 * @param {ImageData} imgd
 * @param {number} numberOfColors
 * @param {Uint8Array} [transparent] 1 = skip pixel
 * @returns {{ indexed: Int16Array, palette: PaletteColor[], width: number, height: number }}
 */
export function quantizeMedianCut(imgd, numberOfColors, transparent) {
    const width = imgd.width;
    const height = imgd.height;
    const data = imgd.data;
    const n = Math.max(2, numberOfColors | 0);

    /** @type {{ r: number, g: number, b: number, i: number }[]} */
    const pixels = [];
    for (let y = 0, p = 0, i = 0; y < height; y++) {
        for (let x = 0; x < width; x++, p += 4, i++) {
            if (transparent && transparent[i]) {
                continue;
            }
            pixels.push({
                r: data[p],
                g: data[p + 1],
                b: data[p + 2],
                i,
            });
        }
    }

    if (pixels.length === 0) {
        return {
            indexed: new Int16Array(width * height).fill(-1),
            palette: [{ r: 255, g: 255, b: 255, a: 255 }],
            width,
            height,
        };
    }

    /** @type {{ pixels: typeof pixels }[]} */
    let boxes = [{ pixels }];

    // Prefer chromatic splits. Stop early when remaining boxes are flat so a
    // simple logo asked for 8 colours does not burn slots on anti-alias noise.
    const MIN_SPLIT_RANGE = 18;

    while (boxes.length < n) {
        let splitIndex = -1;
        let bestScore = -1;
        let bestRange = -1;
        for (let b = 0; b < boxes.length; b++) {
            if (boxes[b].pixels.length < 2) {
                continue;
            }
            const range = channelRange(boxes[b].pixels);
            if (range.maxRange < MIN_SPLIT_RANGE) {
                continue;
            }
            // Weight by population so large mixed regions split before tiny ones,
            // but only while chromatic range remains meaningful.
            const score = range.maxRange * Math.sqrt(boxes[b].pixels.length);
            if (score > bestScore) {
                bestScore = score;
                bestRange = range.maxRange;
                splitIndex = b;
            }
        }
        if (splitIndex < 0 || bestRange < MIN_SPLIT_RANGE) {
            break;
        }

        const box = boxes[splitIndex];
        const { channel } = channelRange(box.pixels);
        box.pixels.sort((a, b) => a[channel] - b[channel]);
        const mid = Math.floor(box.pixels.length / 2);
        if (mid === 0 || mid === box.pixels.length) {
            break;
        }
        const left = { pixels: box.pixels.slice(0, mid) };
        const right = { pixels: box.pixels.slice(mid) };
        boxes.splice(splitIndex, 1, left, right);
    }

    const palette = boxes.map((box) => averageColor(box.pixels));

    // Map every opaque pixel to nearest palette colour (Euclidean RGB).
    const indexed = new Int16Array(width * height);
    for (let i = 0; i < indexed.length; i++) {
        indexed[i] = -1;
    }

    for (let y = 0, p = 0, i = 0; y < height; y++) {
        for (let x = 0; x < width; x++, p += 4, i++) {
            if (transparent && transparent[i]) {
                continue;
            }
            indexed[i] = nearestIndex(palette, data[p], data[p + 1], data[p + 2]);
        }
    }

    return { indexed, palette, width, height };
}

/**
 * @param {{ r: number, g: number, b: number }[]} pixels
 */
function channelRange(pixels) {
    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
    for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        if (p.r < rMin) rMin = p.r;
        if (p.r > rMax) rMax = p.r;
        if (p.g < gMin) gMin = p.g;
        if (p.g > gMax) gMax = p.g;
        if (p.b < bMin) bMin = p.b;
        if (p.b > bMax) bMax = p.b;
    }
    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;
    if (rRange >= gRange && rRange >= bRange) {
        return { channel: 'r', maxRange: rRange };
    }
    if (gRange >= rRange && gRange >= bRange) {
        return { channel: 'g', maxRange: gRange };
    }
    return { channel: 'b', maxRange: bRange };
}

/**
 * @param {{ r: number, g: number, b: number }[]} pixels
 * @returns {PaletteColor}
 */
function averageColor(pixels) {
    let r = 0, g = 0, b = 0;
    const n = pixels.length || 1;
    for (let i = 0; i < pixels.length; i++) {
        r += pixels[i].r;
        g += pixels[i].g;
        b += pixels[i].b;
    }
    return {
        r: Math.round(r / n),
        g: Math.round(g / n),
        b: Math.round(b / n),
        a: 255,
    };
}

/**
 * @param {PaletteColor[]} palette
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function nearestIndex(palette, r, g, b) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < palette.length; i++) {
        const c = palette[i];
        const dr = c.r - r;
        const dg = c.g - g;
        const db = c.b - b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
            bestDist = dist;
            best = i;
        }
    }
    return best;
}
