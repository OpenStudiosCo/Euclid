const isMediaLibrary = () => window.location.href.includes( '/upload.php' );

(function($){
    $(document).ready(function(){
        if ( wp?.media?.view?.Attachment?.Details?.TwoColumn ) {
            wp.media.view.Attachment.Details.TwoColumn = wp.media.view.Attachment.Details.TwoColumn.extend( {
                render() {
                    wp.media.view.Attachment.Details.prototype.render.apply( this, arguments );

                    var convertButton = $('<button class="button convert-to-vector">Convert to vector</button>');
                    console.log(this);
                     
                    debugger;

                    // // Add button to the "Edit Image" section
                    // this.$el.find('.imgedit-menu').prepend(convertButton);

                    // // Click handler
                    // convertButton.on('click', function(e){
                    //     e.preventDefault();
                    //     var attachmentId = this.model.get('id');
                    //     alert('You clicked Convert to Vector for image ID ' + attachmentId);
                    //     // Here you can trigger your conversion AJAX call
                    // }.bind(this));
    
                    return this;
                }
            } );
        }
    });
})(jQuery);
