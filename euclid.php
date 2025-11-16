<?php

/**
 * Plugin Name:  Euclid
 * Description:  Converts raster images into clean, Scalable Vector Graphics (SVG) files.
 * Version:      1.0.0
 * Author:       Open Studios
 * Author URI:   https://openstudios.xyz
 */

 function euclid_enqueue_media_edit_js($hook) {

    // Only load on the attachment edit screen
    if ($hook === 'upload.php' && isset($_GET['mode']) && $_GET['mode'] === 'edit') {
        wp_enqueue_script(
            'euclid-app-bootstrap',
            plugin_dir_url(__FILE__) . 'js/admin.js',
            ['jquery'],
            '1.0',
            true
        );
    }
}
add_action('admin_enqueue_scripts', 'euclid_enqueue_media_edit_js');
