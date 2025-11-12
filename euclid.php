<?php

/**
 * Plugin Name:  Euclid
 * Description:  Converts raster images into clean, Scalable Vector Graphics (SVG) files.
 * Version:      1.0.0
 * Author:       Open Studios
 * Author URI:   https://openstudios.xyz
 */

// Hook to enqueue admin scripts
add_action('admin_enqueue_scripts', 'euclid_enqueue_admin_scripts');

function euclid_enqueue_admin_scripts($hook) {
    // Only load on Media Library / Media Edit screens
    if ( $hook === 'upload.php' || $hook === 'media-new.php' ) {

        wp_enqueue_script(
            'euclid-admin-js', // Handle
            plugin_dir_url(__FILE__) . 'js/admin.js', // Path to JS file
            array('jquery'), // Dependencies
            '1.0', // Version
            true // Load in footer
        );
    }
}
