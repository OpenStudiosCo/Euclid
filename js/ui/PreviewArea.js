/**
 * Traced-path preview.
 *
 * A second checkerboard under the editor picture. It stays hidden until
 * Convert to Vector is opened, then it copies the source grid's size and
 * pattern so the two frames line up with a gap between them.
 */
export default class PreviewArea {
  constructor($) {
    this.$ = $;

    const preview = $(
        `<div id="ositv-vector-preview" class="ositv-vector-preview imgedit-ositv"></div>`,
    );

    $(".imgedit-tools").append(preview);
    this._watchSourceGrid();
  }

  /**
   * Convert to Vector is the open state. The launch button toggles
   * imgedit-panel-active on every .imgedit-ositv node, including this one.
   *
   * @returns {boolean}
   */
  isOpen() {
    const box = document.getElementById('ositv-vector-preview');
    return !!(box && box.classList.contains('imgedit-panel-active'));
  }

  /**
   * @param {string} svg
   */
  show(svg) {
    const box = this.$('#ositv-vector-preview');
    box.html(svg);
    this.fitToSourceGrid();
  }

  /**
   * Match the WordPress crop wrap: same outer size, same checkerboard,
   * and the trace sitting in the same rectangle as the picture.
   */
  fitToSourceGrid() {
    const wrap = document.querySelector('.imgedit-crop-wrap');
    const image = wrap && wrap.querySelector('img');
    const box = document.getElementById('ositv-vector-preview');
    if (!wrap || !image || !box || !wrap.getBoundingClientRect().width) {
      return;
    }

    const wrapRect = wrap.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const source = getComputedStyle(wrap);

    box.style.width = `${wrapRect.width}px`;
    box.style.height = `${wrapRect.height}px`;

    // Use the editor's own checkerboard when it is painted on the crop wrap.
    if (source.backgroundImage && source.backgroundImage !== 'none') {
      box.style.backgroundColor = source.backgroundColor;
      box.style.backgroundImage = source.backgroundImage;
      box.style.backgroundSize = source.backgroundSize;
      box.style.backgroundPosition = source.backgroundPosition;
      box.style.backgroundRepeat = source.backgroundRepeat;
    }

    const svg = box.querySelector('svg');
    if (!svg) {
      return;
    }

    svg.style.position = 'absolute';
    svg.style.left = `${imageRect.left - wrapRect.left}px`;
    svg.style.top = `${imageRect.top - wrapRect.top}px`;
    svg.style.width = `${imageRect.width}px`;
    svg.style.height = `${imageRect.height}px`;
  }

  loadSVG() {
      if (!this.isOpen()) {
          return;
      }
      if (window.ositv.method === "colour") {
          window.ositv.colour.preview();
      }
      else {
          window.ositv.potrace.preview();
      }
  }

  /**
   * Keep the traced grid matched if the editor picture changes size.
   */
  _watchSourceGrid() {
    const wrap = document.querySelector('.imgedit-crop-wrap');
    if (!wrap || typeof ResizeObserver === 'undefined') {
      return;
    }

    this._observer = new ResizeObserver(() => {
      const box = document.getElementById('ositv-vector-preview');
      if (box && box.querySelector('svg')) {
        this.fitToSourceGrid();
      }
    });
    this._observer.observe(wrap);
  }
}
