/**
 * Live view of source-image adjustments on the Media Library picture.
 *
 * Tracing still starts from the original file URL. This overlay only shows
 * the same preprocess, so a hue, saturation or levels change is visible
 * without waiting for Potrace.
 */

import {
    adjustmentIsNeutral,
    adjustmentsForMethod,
    applyHueSaturationLevels,
} from '../lib/image-adjust.js';

const PREVIEW_MAX_EDGE = 800;

export default class SourceImage {

    /**
     * @param {HTMLImageElement|null} img Editor image (`#image-preview-*`)
     */
    constructor(img) {
        this.img = img && img.parentElement ? img : null;
        this.canvas = null;
        this._base = null;
        this._width = 0;
        this._height = 0;
        this._latest = null;
        this._ready = !this.img;
        this._frame = null;

        if (!this.img) {
            return;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'ositv-source-preview';
        // Inline, so a missing stylesheet cannot leave a second copy of the
        // picture sitting beside the editor image.
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.display = 'none';
        this.canvas.style.zIndex = '1';
        this.img.parentElement.querySelectorAll('.ositv-source-preview').forEach((node) => {
            node.remove();
        });
        this.img.insertAdjacentElement('afterend', this.canvas);

        const parent = this.img.parentElement;
        if (window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }

        this._observer = new ResizeObserver(() => this._fit());
        this._observer.observe(this.img);

        this._load();
    }

    /**
     * Paint the adjustments belonging to the active vectorisation method.
     */
    renderActiveAdjustments() {
        const method = window.ositv.method || 'colour';
        const integration = method === 'colour' ? window.ositv.colour : window.ositv.potrace;
        if (!integration) {
            return;
        }
        this.render(adjustmentsForMethod(method, integration.getOptions()));
    }

    /**
     * @param {import('../lib/image-adjust.js').HueSaturationLevels} adjust
     */
    render(adjust) {
        this._latest = adjust;
        if (!this._ready || this._frame) {
            return;
        }
        this._frame = requestAnimationFrame(() => this._drawLatest());
    }

    _load() {
        const img = this.img;
        const prepare = () => {
            try {
                this._capture(img);
            } catch (err) {
                console.error('Could not prepare the source image preview:', err);
            } finally {
                this._ready = true;
                this._drawLatest();
            }
        };

        if (img.complete && img.naturalWidth) {
            prepare();
            return;
        }

        img.addEventListener('load', prepare, { once: true });
        img.addEventListener('error', () => {
            this._ready = true;
        }, { once: true });
    }

    /**
     * @param {HTMLImageElement} img
     */
    _capture(img) {
        const longest = Math.max(img.naturalWidth, img.naturalHeight);
        const scale = Math.min(1, PREVIEW_MAX_EDGE / longest);
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const buffer = document.createElement('canvas');
        buffer.width = width;
        buffer.height = height;
        const ctx = buffer.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        this._width = width;
        this._height = height;
        this._base = new Uint8ClampedArray(imageData.data);
    }

    _drawLatest() {
        this._frame = null;
        if (!this.img || !this._base || !this._latest) {
            return;
        }

        if (adjustmentIsNeutral(this._latest)) {
            this._showOriginal();
            return;
        }

        const copy = new ImageData(new Uint8ClampedArray(this._base), this._width, this._height);
        applyHueSaturationLevels(copy, this._latest);

        if (this.canvas.width !== this._width || this.canvas.height !== this._height) {
            this.canvas.width = this._width;
            this.canvas.height = this._height;
        }
        this.canvas.getContext('2d').putImageData(copy, 0, 0);
        this.img.classList.add('ositv-source-adjusted');
        this.canvas.classList.add('is-live');
        this._fit();
        if (!this.canvas.style.width) {
            return;
        }
        this.canvas.style.display = 'block';
        this.img.style.visibility = 'hidden';
    }

    _showOriginal() {
        if (this.canvas) {
            this.canvas.classList.remove('is-live');
            this.canvas.style.display = 'none';
        }
        if (this.img) {
            this.img.classList.remove('ositv-source-adjusted');
            this.img.style.visibility = '';
        }
    }

    _fit() {
        if (!this.canvas || !this.canvas.classList.contains('is-live') || !this.img) {
            return;
        }

        const imgRect = this.img.getBoundingClientRect();
        if (imgRect.width < 1 || imgRect.height < 1) {
            return;
        }

        const parent = this.img.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const parentStyle = window.getComputedStyle(parent);
        const borderLeft = parseFloat(parentStyle.borderLeftWidth) || 0;
        const borderTop = parseFloat(parentStyle.borderTopWidth) || 0;

        this.canvas.style.left = `${imgRect.left - parentRect.left - borderLeft}px`;
        this.canvas.style.top = `${imgRect.top - parentRect.top - borderTop}px`;
        this.canvas.style.width = `${imgRect.width}px`;
        this.canvas.style.height = `${imgRect.height}px`;
    }
}
