import {
    LEVELS_CENTER_DEFAULT,
    LEVELS_DARK_DEFAULT,
    LEVELS_LIGHT_DEFAULT,
} from '../lib/image-adjust.js';
import {
    BW_PRESET_LABELS,
    BW_PRESETS,
    COLOUR_PRESET_LABELS,
    COLOUR_PRESETS,
    DEFAULT_BW_PRESET,
    DEFAULT_COLOUR_PRESET,
    MAX_COLOURS,
} from '../lib/trace-presets.js';
import LevelsControl from './LevelsControl.js';

const PREVIEW_DEBOUNCE_MS = 300;

/**
 * Neutral slider positions used when the active preset is Custom.
 */
const SLIDER_FALLBACKS = {
    hue: 0,
    saturation: 0,
    numberofcolors: 8,
    levelsDark: LEVELS_DARK_DEFAULT,
    levelsCenter: LEVELS_CENTER_DEFAULT,
    levelsLight: LEVELS_LIGHT_DEFAULT,
};

const SLIDER_IDS = {
    hue: 'ositv-colour-hue',
    saturation: 'ositv-colour-saturation',
    numberofcolors: 'ositv-colour-numberofcolors',
};

/**
 * Build `<option>` markup for a preset map.
 *
 * @param {Record<string, string>} labels
 * @param {string} selectedKey
 * @returns {string}
 */
function presetOptionsHtml(labels, selectedKey) {
    return Object.keys(labels)
        .map((key) => {
            const selected = key === selectedKey ? ' selected' : '';
            return `<option value="${key}"${selected}>${labels[key]}</option>`;
        })
        .join('');
}

/**
 * Lightweight reset icon. A circular arrow, not a full button chrome.
 *
 * @param {string} param
 * @param {string} label
 * @returns {string}
 */
function resetButton(param, label) {
    return `<button type="button" class="ositv-reset" data-reset="${param}" aria-label="Reset ${label}">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M8 2.1a5.9 5.9 0 0 1 5.2 3.1h-2v1.5h4.2V2.5h-1.5v1.7A7.4 7.4 0 1 0 15.2 8h-1.5A5.9 5.9 0 1 1 8 2.1z"></path>
        </svg>
    </button>`;
}

/**
 * One labelled slider row: label, range, value, reset.
 *
 * @param {object} field
 * @returns {string}
 */
function sliderField(field) {
    const modeClass = field.modeClass ? ` ${field.modeClass}` : '';
    const affects = field.affects ? ` data-affects="${field.affects}"` : '';
    return `
        <div class="ositv-field${modeClass}">
            <label for="${field.id}">${field.label}</label>
            <input type="range" id="${field.id}" class="ositv-control" data-param="${field.param}"${affects} min="${field.min}" max="${field.max}" step="${field.step}" />
            <span class="ositv-field-meta">
                <span class="ositv-value" id="${field.id}-val"></span>
                ${resetButton(field.param, field.label)}
            </span>
        </div>`;
}

/**
 * Shared Advanced Potrace controls. Same grid as the sliders above.
 *
 * @param {string} prefix DOM id prefix (bw | colour)
 * @returns {string}
 */
function advancedPotraceHtml(prefix) {
    return `
        <details class="ositv-advanced">
            <summary>Advanced</summary>
            <div class="ositv-field">
                <label for="ositv-${prefix}-turdsize">Turd size</label>
                <input type="number" id="ositv-${prefix}-turdsize" class="ositv-control" data-param="turdsize" min="0" max="500" step="1" />
            </div>
            <div class="ositv-field">
                <label for="ositv-${prefix}-alphamax">Alpha max</label>
                <input type="number" id="ositv-${prefix}-alphamax" class="ositv-control" data-param="alphamax" min="0" max="1.3333" step="0.05" />
            </div>
            <div class="ositv-field">
                <label for="ositv-${prefix}-opttolerance">Opt tolerance</label>
                <input type="number" id="ositv-${prefix}-opttolerance" class="ositv-control" data-param="opttolerance" min="0" max="2" step="0.05" />
            </div>
            <div class="ositv-field">
                <label for="ositv-${prefix}-optcurve">Optimise curves</label>
                <input type="checkbox" id="ositv-${prefix}-optcurve" class="ositv-control" data-param="optcurve" />
            </div>
            <div class="ositv-field">
                <label for="ositv-${prefix}-turnpolicy">Turn policy</label>
                <select id="ositv-${prefix}-turnpolicy" class="ositv-control" data-param="turnpolicy">
                    <option value="black">black</option>
                    <option value="white">white</option>
                    <option value="left">left</option>
                    <option value="right">right</option>
                    <option value="minority">minority</option>
                    <option value="majority">majority</option>
                </select>
            </div>
        </details>`;
}

/**
 * Output Options.
 *
 * Source image rows change the picture itself and repaint it straight away.
 * Vectorisation rows only change how that picture is traced. Each method
 * shows its own rows; the other method's rows are removed from view.
 */
export default class Tools {

    constructor($) {
        this.$ = $;
        this._previewTimer = null;
        this._syncing = false;

        const tools = $(
            `<div id="ositv-container" class="imgedit-group imgedit-ositv is-colour">
              <div class="imgedit-group-controls">
                <h2>Output Options</h2>
                <div class="ositv-field">
                    <label for="ositv-vectorisation-method">Method</label>
                    <select id="ositv-vectorisation-method">
                        <option value="colour" selected>Colour</option>
                        <option value="potrace">Black and White</option>
                    </select>
                </div>

                <section class="ositv-section">
                    <h3 class="ositv-section-title">Source image</h3>
                    <p class="ositv-section-note">Updates the picture straight away.</p>
                    ${sliderField({
                        id: 'ositv-colour-hue',
                        label: 'Hue',
                        param: 'hue',
                        min: -180,
                        max: 180,
                        step: 1,
                        modeClass: 'ositv-colour-only',
                        affects: 'source',
                    })}
                    ${sliderField({
                        id: 'ositv-colour-saturation',
                        label: 'Saturation',
                        param: 'saturation',
                        min: -100,
                        max: 100,
                        step: 1,
                        modeClass: 'ositv-colour-only',
                        affects: 'source',
                    })}
                    <div class="ositv-field ositv-field-levels">
                        <span class="ositv-field-label" id="ositv-levels-label">Levels</span>
                        <div class="ositv-levels" id="ositv-levels" role="group" aria-labelledby="ositv-levels-label">
                            <div class="ositv-levels-track">
                                <div class="ositv-levels-span"></div>
                                <button type="button" class="ositv-levels-handle" data-stop="dark" role="slider" aria-label="Dark boundary" aria-valuemin="0" aria-valuemax="127" aria-valuenow="0"></button>
                                <button type="button" class="ositv-levels-handle" data-stop="center" role="slider" aria-label="Centre" aria-valuemin="1" aria-valuemax="254" aria-valuenow="128"></button>
                                <button type="button" class="ositv-levels-handle" data-stop="light" role="slider" aria-label="Light boundary" aria-valuemin="129" aria-valuemax="255" aria-valuenow="255"></button>
                            </div>
                            <div class="ositv-levels-readout">
                                <span>Dark boundary <strong data-readout="dark">0</strong></span>
                                <span>Centre <strong data-readout="center">128</strong></span>
                                <span>Light boundary <strong data-readout="light">255</strong></span>
                            </div>
                        </div>
                        <span class="ositv-field-meta">
                            ${resetButton('levels', 'levels')}
                        </span>
                    </div>
                </section>

                <section class="ositv-section">
                    <h3 class="ositv-section-title">Vectorisation</h3>
                    <p class="ositv-section-note">Updates the traced paths.</p>
                    <div class="ositv-field ositv-bw-only">
                        <label for="ositv-bw-preset">Preset</label>
                        <select id="ositv-bw-preset">
                            ${presetOptionsHtml(BW_PRESET_LABELS, DEFAULT_BW_PRESET)}
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div class="ositv-field ositv-colour-only">
                        <label for="ositv-colour-preset">Preset</label>
                        <select id="ositv-colour-preset">
                            ${presetOptionsHtml(COLOUR_PRESET_LABELS, DEFAULT_COLOUR_PRESET)}
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    ${sliderField({
                        id: 'ositv-colour-numberofcolors',
                        label: 'Colours',
                        param: 'numberofcolors',
                        min: 2,
                        max: MAX_COLOURS,
                        step: 1,
                        modeClass: 'ositv-colour-only',
                    })}
                    <div class="ositv-bw-only">
                        ${advancedPotraceHtml('bw')}
                    </div>
                    <div class="ositv-colour-only">
                        ${advancedPotraceHtml('colour')}
                    </div>
                </section>

                <p class="ositv-actions">
                    <button type="button" id="ositv-save" class="button">Save SVG</button>
                    <button type="button" disabled class="button">Download SVG</button>
                </p>
              </div>
            </div>`,
        );

        $('.imgedit-tool-active').append(tools);

        this.levels = new LevelsControl(tools.find('.ositv-levels')[0], (stops) => {
            this._onLevelsChange(stops);
        });

        this._bindEvents();
        this._syncModeVisibility();
        this._applyDefaultPresetsToIntegrations();
        this._syncControlsFromIntegrations();
    }

    /**
     * Wire Output Options controls. Avoid inline global handlers so rename
     * of window.ositv methods cannot silently break the panel.
     */
    _bindEvents() {
        const root = this.$('#ositv-container');

        root.on('change', '#ositv-vectorisation-method', () => {
            this._syncModeVisibility();
            const integration = this._activeIntegration();
            if (integration) {
                this._fillLevels(integration.getOptions());
            }
            window.ositv.changeMethod();
        });

        root.on('change', '#ositv-bw-preset', (event) => {
            this._onPresetChange('potrace', event.target.value);
        });

        root.on('change', '#ositv-colour-preset', (event) => {
            this._onPresetChange('colour', event.target.value);
        });

        root.on('input change', '.ositv-control', (event) => {
            if (this._syncing) {
                return;
            }
            this._onControlChange(event.target);
        });

        root.on('click', '.ositv-reset', (event) => {
            event.preventDefault();
            this._onReset(event.currentTarget.dataset.reset);
        });

        root.on('click', '#ositv-save', () => {
            window.ositv.save();
        });
    }

    /**
     * @returns {boolean}
     */
    _isColour() {
        return this.$('#ositv-vectorisation-method').val() === 'colour';
    }

    /**
     * @returns {object|undefined}
     */
    _activeIntegration() {
        return this._isColour() ? window.ositv.colour : window.ositv.potrace;
    }

    /**
     * Hide the other method's rows.
     *
     * The class is what the stylesheet uses. The inline display is there as
     * well, because an admin rule that sets display on divs will otherwise
     * keep both presets and both Advanced blocks on screen.
     */
    _syncModeVisibility() {
        const isColour = this._isColour();
        const root = this.$('#ositv-container');
        root.toggleClass('is-colour', isColour);
        root.toggleClass('is-bw', !isColour);
        root.find('.ositv-colour-only').css('display', isColour ? '' : 'none');
        root.find('.ositv-bw-only').css('display', isColour ? 'none' : '');
    }

    /**
     * @param {'potrace'|'colour'} method
     * @param {string} key
     */
    _onPresetChange(method, key) {
        if (key === 'custom') {
            return;
        }
        const integration = method === 'colour' ? window.ositv.colour : window.ositv.potrace;
        if (!integration) {
            return;
        }
        integration.applyPreset(key);
        this._syncControlsFromIntegrations();
        this._refreshSourceImage();
        this._schedulePreview();
    }

    /**
     * Seed integrations with default presets before first preview.
     */
    _applyDefaultPresetsToIntegrations() {
        if (window.ositv.potrace) {
            window.ositv.potrace.applyPreset(DEFAULT_BW_PRESET);
        }
        if (window.ositv.colour) {
            window.ositv.colour.applyPreset(DEFAULT_COLOUR_PRESET);
        }
    }

    /**
     * Push integration options into the controls.
     */
    _syncControlsFromIntegrations() {
        this._syncing = true;

        if (window.ositv.potrace) {
            this._fillBwControls(window.ositv.potrace.getOptions());
        }
        if (window.ositv.colour) {
            this._fillColourControls(window.ositv.colour.getOptions());
        }

        const active = this._activeIntegration();
        if (active) {
            this._fillLevels(active.getOptions());
        }

        this._syncing = false;
    }

    /**
     * @param {object} options
     */
    _fillBwControls(options) {
        this._fillAdvanced('bw', options);
        this._matchPresetSelect('bw', options, BW_PRESETS);
    }

    /**
     * @param {object} options
     */
    _fillColourControls(options) {
        const $ = this.$;
        $('#ositv-colour-numberofcolors').val(options.numberofcolors);
        $('#ositv-colour-numberofcolors-val').text(options.numberofcolors);
        $('#ositv-colour-hue').val(options.hue);
        $('#ositv-colour-hue-val').text(options.hue);
        $('#ositv-colour-saturation').val(options.saturation);
        $('#ositv-colour-saturation-val').text(options.saturation);
        this._fillAdvanced('colour', options);
        this._matchPresetSelect('colour', options, COLOUR_PRESETS);
    }

    /**
     * @param {object} options
     */
    _fillLevels(options) {
        this.levels.setValues({
            dark: options.levelsDark,
            center: options.levelsCenter,
            light: options.levelsLight,
        });
    }

    /**
     * @param {string} prefix
     * @param {object} options
     */
    _fillAdvanced(prefix, options) {
        const $ = this.$;
        $(`#ositv-${prefix}-turdsize`).val(options.turdsize);
        $(`#ositv-${prefix}-alphamax`).val(options.alphamax);
        $(`#ositv-${prefix}-opttolerance`).val(options.opttolerance);
        $(`#ositv-${prefix}-optcurve`).prop('checked', !!options.optcurve);
        $(`#ositv-${prefix}-turnpolicy`).val(options.turnpolicy);
    }

    /**
     * Set preset select to matching key or Custom.
     *
     * @param {string} mode bw | colour
     * @param {object} options
     * @param {Record<string, object>} presets
     */
    _matchPresetSelect(mode, options, presets) {
        const selectId = mode === 'bw' ? '#ositv-bw-preset' : '#ositv-colour-preset';
        const matchKey = Object.keys(presets).find((key) =>
            this._optionsMatchPreset(options, presets[key])
        );
        this.$(selectId).val(matchKey || 'custom');
    }

    /**
     * @param {object} options
     * @param {object} preset
     * @returns {boolean}
     */
    _optionsMatchPreset(options, preset) {
        return Object.keys(preset).every((key) => {
            const a = options[key];
            const b = preset[key];
            if (typeof a === 'number' && typeof b === 'number') {
                return Math.abs(a - b) < 0.001;
            }
            return a === b;
        });
    }

    /**
     * @param {HTMLElement} el
     */
    _onControlChange(el) {
        const param = el.dataset.param;
        if (!param) {
            return;
        }

        const integration = this._activeIntegration();
        if (!integration) {
            return;
        }

        let value;
        if (el.type === 'checkbox') {
            value = el.checked;
        } else if (param === 'turnpolicy') {
            value = el.value;
        } else {
            value = parseFloat(el.value);
        }

        integration.setOptions({ [param]: value });

        const valSpan = this.$(`#${el.id}-val`);
        if (valSpan.length) {
            valSpan.text(value);
        }

        this._syncPresetSelect(integration);
        if (el.dataset.affects === 'source') {
            this._refreshSourceImage();
        }
        this._schedulePreview();
    }

    /**
     * @param {{ dark: number, center: number, light: number }} stops
     */
    _onLevelsChange(stops) {
        if (this._syncing) {
            return;
        }

        const integration = this._activeIntegration();
        if (!integration) {
            return;
        }

        integration.setOptions({
            levelsDark: stops.dark,
            levelsCenter: stops.center,
            levelsLight: stops.light,
        });
        this._syncPresetSelect(integration);
        this._refreshSourceImage();
        this._schedulePreview();
    }

    /**
     * @param {string} param
     */
    _onReset(param) {
        const integration = this._activeIntegration();
        if (!integration) {
            return;
        }

        if (param === 'levels') {
            const dark = this._defaultFor('levelsDark');
            const center = this._defaultFor('levelsCenter');
            const light = this._defaultFor('levelsLight');
            integration.setOptions({
                levelsDark: dark,
                levelsCenter: center,
                levelsLight: light,
            });
            this.levels.setValues({ dark, center, light });
        } else if (SLIDER_IDS[param]) {
            const value = this._defaultFor(param);
            integration.setOptions({ [param]: value });
            const id = SLIDER_IDS[param];
            this.$(`#${id}`).val(value);
            this.$(`#${id}-val`).text(value);
        } else {
            return;
        }

        this._syncPresetSelect(integration);
        if (param === 'levels' || param === 'hue' || param === 'saturation') {
            this._refreshSourceImage();
        }
        this._schedulePreview();
    }

    /**
     * Named preset value when one is selected, otherwise the neutral default.
     *
     * @param {string} param
     * @returns {number}
     */
    _defaultFor(param) {
        const presets = this._isColour() ? COLOUR_PRESETS : BW_PRESETS;
        const selectId = this._isColour() ? '#ositv-colour-preset' : '#ositv-bw-preset';
        const preset = presets[this.$(selectId).val()];
        if (preset && Object.prototype.hasOwnProperty.call(preset, param)) {
            return preset[param];
        }
        return SLIDER_FALLBACKS[param];
    }

    /**
     * @param {object} integration
     */
    _syncPresetSelect(integration) {
        const isColour = this._isColour();
        this._matchPresetSelect(
            isColour ? 'colour' : 'bw',
            integration.getOptions(),
            isColour ? COLOUR_PRESETS : BW_PRESETS,
        );
    }

    _refreshSourceImage() {
        if (window.ositv.sourceImage) {
            window.ositv.sourceImage.renderActiveAdjustments();
        }
    }

    _schedulePreview() {
        if (this._previewTimer) {
            clearTimeout(this._previewTimer);
        }
        this._previewTimer = setTimeout(() => {
            this._previewTimer = null;
            if (window.ositv.preview) {
                window.ositv.preview.loadSVG();
            }
        }, PREVIEW_DEBOUNCE_MS);
    }
}
