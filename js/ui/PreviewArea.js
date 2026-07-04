export default class PreviewArea {
  constructor($) {

    // Add the preview to the sidebar.
    const preview = $(
        `<div class="imgedit-group imgedit-ositv">
            <div class="imgedit-group-controls">
                <div class="imgedit-crop-wrap">
                    <div class="imgedit-crop-preview"></div>
                </div>
            </div>
        </div>`,
    );

    const previewArea = $(".imgedit-tools");
    previewArea.append(preview);
  }


  loadSVG() {
      if (window.ositv.method === "imagetracer") {
          window.ositv.imagetracer.preview();
      }
      else {
          window.ositv.potrace.preview();
      }
  }


}
