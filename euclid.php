<?php

/**
 * Plugin Name:  Euclid
 * Description:  Converts raster images into clean, Scalable Vector Graphics (SVG) files.
 * Version:      1.0.0
 * Author:       Open Studios
 * Author URI:   https://openstudios.xyz
 */

function euclid_enqueue_media_edit_js($hook) {

    if (in_array($hook, ['upload.php', 'post.php', 'post-new.php'])) {

        wp_enqueue_style(
            'euclid-admin-styles',
            plugin_dir_url(__FILE__) . 'css/admin.css',
            [],
            '1.0',
            true
        );

        wp_enqueue_script(
             'euclid-libs-potrace',
             plugin_dir_url(__FILE__) . 'vendor/potrace.js',
             ['jquery'],
             '1.0',
             true
        );

        wp_enqueue_script(
            'euclid-admin-bootstrap',
            plugin_dir_url(__FILE__) . 'js/admin.js',
            ['jquery', 'euclid-libs-potrace'],
            '1.0',
            true
        );
    }
}
add_action('admin_enqueue_scripts', 'euclid_enqueue_media_edit_js');
