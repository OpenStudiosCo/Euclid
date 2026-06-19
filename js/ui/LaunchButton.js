export default class LaunchButton {
  constructor($) {

    const cropButton = $(".imgedit-crop");
    const convertBtn = $(
        '<button class="button convert-to-vector">Convert to Vector</button>',
    );
    cropButton.after(convertBtn);

    convertBtn.on("click", function (e) {
        e.preventDefault();

        const euclidContainer = $(".imgedit-euclid");
        euclidContainer.toggleClass("imgedit-panel-active");
    });

  }

}
