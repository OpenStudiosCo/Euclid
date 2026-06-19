export default class PotraceIntegration {
  constructor($) {

    // Add the preview to the sidebar.
    const preview = $(
        `<div class="imgedit-group imgedit-euclid">
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
      if (window.euclid.method === "imagetracer") {
          console.log('Imagetracer TBD!');
      }
      else {
          window.euclid.potrace.preview();
      }
  }


}
