
jQuery(function($) {
    $( document ).on( 'image-editor-ui-ready', () => {
        // Add our Convert to Vector button
        const cropButton = $('.imgedit-crop');
        const convertBtn = $('<button class="button convert-to-vector">Convert to Vector</button>');
        cropButton.after(convertBtn);

        convertBtn.on('click', function(e) {
            e.preventDefault();

            const euclidContainer = $('#imgedit-euclid');
            euclidContainer.addClass('imgedit-panel-active');
        });

        const toolArea = $('.imgedit-tool-active');

            
        // Add the preview to the sidebar.
        const preview = $(
            `<div class="imgedit-group" id="imgedit-euclid">
                <div class="imgedit-group-controls">
                    <div class="imgedit-crop-wrap"></div>
                    <h2>Crop Settings</h2>
                    <p>Aspect ratio fields here</p>
                </div>
            </div>`);
        toolArea.append(preview);



    });
});
