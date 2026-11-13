/**
 * Three-stop levels slider: dark boundary, centre, and light boundary.
 *
 * The stops stay in order. Dragging one stop never pushes the others.
 */

import { normaliseLevels } from '../lib/image-adjust.js';

/** Half the handle width. Keep in step with the track inset in admin.css. */
const HANDLE_INSET = 7;

export default class LevelsControl {

    /**
     * @param {HTMLElement} root `.ositv-levels` element
     * @param {(stops: { dark: number, center: number, light: number }) => void} onChange
     */
    constructor(root, onChange) {
        this.root = root;
        this.onChange = onChange;
        this.track = root.querySelector('.ositv-levels-track');
        this._drag = null;
        this.values = normaliseLevels(0, 128, 255);

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);

        this.track.addEventListener('pointerdown', this._onPointerDown);
        this.track.addEventListener('pointermove', this._onPointerMove);
        this.track.addEventListener('pointerup', this._onPointerUp);
        this.track.addEventListener('pointercancel', this._onPointerUp);
        this.root.querySelectorAll('.ositv-levels-handle').forEach((handle) => {
            handle.addEventListener('keydown', this._onKeyDown);
        });

        this._paint();
    }

    /**
     * Show stops without notifying the listener.
     *
     * @param {{ dark: number, center: number, light: number }} stops
     */
    setValues(stops) {
        this.values = normaliseLevels(stops.dark, stops.center, stops.light);
        this._paint();
    }

    /**
     * @param {PointerEvent} event
     */
    _onPointerDown(event) {
        if (event.button !== 0) {
            return;
        }

        const handle = event.target.closest('.ositv-levels-handle');
        const value = this._valueFromClientX(event.clientX);
        const stop = handle ? handle.dataset.stop : this._nearestStop(value);

        this._drag = stop;
        this.track.setPointerCapture(event.pointerId);
        this._setStop(stop, value);

        const active = this.root.querySelector(`[data-stop="${stop}"]`);
        if (active) {
            active.focus();
        }
        event.preventDefault();
    }

    /**
     * @param {PointerEvent} event
     */
    _onPointerMove(event) {
        if (!this._drag) {
            return;
        }
        this._setStop(this._drag, this._valueFromClientX(event.clientX));
    }

    _onPointerUp() {
        this._drag = null;
        this._paint();
    }

    /**
     * @param {KeyboardEvent} event
     */
    _onKeyDown(event) {
        const stop = event.currentTarget.dataset.stop;
        const step = event.shiftKey ? 10 : 1;
        let next = null;

        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            next = this.values[stop] - step;
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            next = this.values[stop] + step;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = 255;
        }

        if (next === null) {
            return;
        }

        event.preventDefault();
        this._setStop(stop, next);
    }

    /**
     * @param {number} clientX
     * @returns {number}
     */
    _valueFromClientX(clientX) {
        const rect = this.track.getBoundingClientRect();
        const travel = rect.width - (HANDLE_INSET * 2);
        if (travel <= 0) {
            return 0;
        }
        const ratio = (clientX - rect.left - HANDLE_INSET) / travel;
        return Math.round(Math.max(0, Math.min(1, ratio)) * 255);
    }

    /**
     * @param {number} value
     * @returns {string}
     */
    _nearestStop(value) {
        const stops = ['dark', 'center', 'light'];
        let nearest = stops[0];
        let distance = Infinity;
        stops.forEach((stop) => {
            const gap = Math.abs(this.values[stop] - value);
            if (gap < distance) {
                distance = gap;
                nearest = stop;
            }
        });
        return nearest;
    }

    /**
     * @param {string} stop
     * @param {number} raw
     */
    _setStop(stop, raw) {
        const value = Math.max(0, Math.min(255, Math.round(raw)));
        const next = { ...this.values };

        if (stop === 'dark') {
            next.dark = Math.min(value, this.values.center - 1);
        } else if (stop === 'light') {
            next.light = Math.max(value, this.values.center + 1);
        } else {
            next.center = Math.min(
                this.values.light - 1,
                Math.max(this.values.dark + 1, value),
            );
        }

        if (
            next.dark === this.values.dark
            && next.center === this.values.center
            && next.light === this.values.light
        ) {
            return;
        }

        this.values = next;
        this._paint();
        this.onChange({ ...this.values });
    }

    _paint() {
        const { dark, center, light } = this.values;
        const span = this.root.querySelector('.ositv-levels-span');
        span.style.left = this._travelPosition(dark);
        span.style.width = `calc(${(light - dark) / 255} * (100% - ${HANDLE_INSET * 2}px))`;

        this._placeHandle('dark', dark);
        this._placeHandle('center', center);
        this._placeHandle('light', light);

        this.root.querySelector('[data-readout="dark"]').textContent = String(dark);
        this.root.querySelector('[data-readout="center"]').textContent = String(center);
        this.root.querySelector('[data-readout="light"]').textContent = String(light);
    }

    /**
     * @param {string} stop
     * @param {number} value
     */
    _placeHandle(stop, value) {
        const handle = this.root.querySelector(`[data-stop="${stop}"]`);
        const limits = {
            dark: [0, this.values.center - 1],
            center: [this.values.dark + 1, this.values.light - 1],
            light: [this.values.center + 1, 255],
        };
        handle.style.left = this._travelPosition(value);
        handle.setAttribute('aria-valuemin', String(limits[stop][0]));
        handle.setAttribute('aria-valuemax', String(limits[stop][1]));
        handle.setAttribute('aria-valuenow', String(value));
        handle.classList.toggle('is-dragging', this._drag === stop);
    }

    /**
     * Position along the inset track, matching the grey bar in CSS.
     *
     * @param {number} value
     * @returns {string}
     */
    _travelPosition(value) {
        return `calc(${value / 255} * (100% - ${HANDLE_INSET * 2}px) + ${HANDLE_INSET}px)`;
    }
}
