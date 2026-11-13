export default class LaunchButton {
  constructor($) {

    const cropButton = $(".imgedit-crop");
    const convertBtn = $(
        '<button class="button convert-to-vector">Convert to Vector</button>',
    );
    cropButton.after(convertBtn);

    convertBtn.on("click", function (e) {
        e.preventDefault();

        const ositvContainer = $(".imgedit-ositv");
        ositvContainer.toggleClass("imgedit-panel-active");

        // The traced grid is drawn only once this panel is open.
        if (window.ositv.preview && window.ositv.preview.isOpen()) {
            window.ositv.preview.loadSVG();
        }
    });

  }

}
