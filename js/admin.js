jQuery(function ($) {

    // Modal (Media Library)
    $(document).on("image-editor-ui-ready", () => {
        euclid_init($);
    });

    // Uncomment and figure out why this breaks the modal;
    // // Edit Media screen fallback
    // const observer = new MutationObserver(() => {
    //     if ($(".imgedit-wrap").length) {
    //         euclid_init($);
    //     }
    // });

    // observer.observe(document.body, {
    //     childList: true,
    //     subtree: true,
    // });
});

function euclid_init($) {
    // Add our Convert to Vector button
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

    const tools = $(
        `<div class="imgedit-group imgedit-euclid">
          <div class="imgedit-group-controls">
            <h2>Vectorisation Settings</h2>
            <p>Aspect ratio fields here</p>
          </div>
        </div>`,
    );

    const toolArea = $(".imgedit-tool-active");
    toolArea.append(tools);

    const src = $(".imgedit-crop-wrap img").attr("src");

    // Create an SVG from data and settings, draw to screen.
    Potrace.clear();
    Potrace.loadImageFromSrc(src);
    Potrace.process(function () {
        var svg = Potrace.getSVG(1);
        const previewBox = $(".imgedit-crop-preview");
        previewBox.html(svg);
    });
}
