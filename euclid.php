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

add_action('wp_ajax_euclid_save_svg', 'euclid_save_svg');
function euclid_save_svg() {

    if (!current_user_can('upload_files')) {
        wp_send_json_error('Permission denied');
    }

    $svg = isset($_POST['svg']) ? wp_unslash($_POST['svg']) : '';
    $attachment_id = intval($_POST['attachment_id']);

    if (!$svg || !$attachment_id) {
        wp_send_json_error('Missing data');
    }

    // Get original attachment
    $original = get_post($attachment_id);
    if (!$original) {
        wp_send_json_error('Invalid attachment');
    }

    // Upload dir
    $upload_dir = wp_upload_dir();

    // Generate filename
    $original_filename = get_post_meta($attachment_id, '_wp_attached_file', true);
    $filename_base = pathinfo($original_filename, PATHINFO_FILENAME);
    $filename = $filename_base . '-vector.svg';

    $file_path = $upload_dir['path'] . '/' . $filename;
    $file_url  = $upload_dir['url'] . '/' . $filename;

    // Save SVG file
    file_put_contents($file_path, $svg);

    // Prepare attachment post
    $attachment = [
        'post_mime_type' => 'image/svg+xml',
        'post_title'     => $original->post_title . ' (Vector)',
        'post_content'   => '',
        'post_status'    => 'inherit',
    ];

    // Insert attachment
    $new_attachment_id = wp_insert_attachment($attachment, $file_path);

    // Copy alt text
    $alt = get_post_meta($attachment_id, '_wp_attachment_image_alt', true);
    if ($alt) {
        update_post_meta($new_attachment_id, '_wp_attachment_image_alt', $alt);
    }

    // Copy other useful meta if needed
    update_post_meta($new_attachment_id, '_euclid_source_id', $attachment_id);

    // Generate metadata (won’t do much for SVG, but keeps WP happy)
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attach_data = wp_generate_attachment_metadata($new_attachment_id, $file_path);
    wp_update_attachment_metadata($new_attachment_id, $attach_data);

    wp_send_json_success([
        'id'  => $new_attachment_id,
        'url' => $file_url,
    ]);
}
