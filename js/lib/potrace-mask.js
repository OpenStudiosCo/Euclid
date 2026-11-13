/**
 * Complementary helpers around vendor/potrace.js.
 * Feeds binary masks without modifying the vendored Potrace API.
 */

/**
 * Load an ImageData mask into Potrace via a canvas data URL.
 * Black (luminance < 128) pixels are foreground.
 *
 * @param {ImageData} imageData
 * @returns {Promise<void>}
 */
export function loadMask(imageData) {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            canvas.getContext('2d').putImageData(imageData, 0, 0);

            Potrace.clear();
            Potrace.loadImageFromSrc(canvas.toDataURL('image/png'));

            // Potrace.process polls until the image bitmap is ready.
            Potrace.process(() => resolve());
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Extract the compound path `d` from Potrace.getSVG() output.
 *
 * @param {number} [size=1]
 * @returns {string}
 */
export function getPathData(size = 1) {
    const svg = Potrace.getSVG(size);
    const match = svg.match(/\sd="([^"]*)"/);
    return match ? match[1] : '';
}

/**
 * Trace a binary ImageData mask and return path data + dimensions.
 *
 * @param {ImageData} imageData
 * @param {number} [size=1]
 * @returns {Promise<{ d: string, width: number, height: number }>}
 */
export async function traceMask(imageData, size = 1) {
    await loadMask(imageData);
    return {
        d: getPathData(size),
        width: imageData.width * size,
        height: imageData.height * size,
    };
}
