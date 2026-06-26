<?php

/**
 * Plugin Name:  Euclid
 * Description:  Convert raster images into clean SVGs inside WordPress.
 * Version:      1.0.0
 * Author:       Open Studios
 * Author URI:   https://openstudios.xyz
 * Text Domain:  euclid
 * Contributors: https://github.com/OpenStudiosCo/Euclid/graphs/contributors
 * Tags:         svg, vector, image, media, graphics, logo
 * License:      GPLv2 or later
 * License URI:  https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Kudos to blocksy for the load order.
function euclid_sanitize_svg( $content ) {
    $base_path = plugin_dir_path(__FILE__) . 'vendor/svg-sanitizer/src';

    require_once($base_path . '/data/AttributeInterface.php');
	require_once($base_path . '/data/TagInterface.php');
	require_once($base_path . '/data/AllowedAttributes.php');
	require_once($base_path . '/data/AllowedTags.php');
	require_once($base_path . '/data/XPath.php');
	require_once($base_path . '/ElementReference/Resolver.php');
	require_once($base_path . '/ElementReference/Subject.php');
	require_once($base_path . '/ElementReference/Usage.php');
	require_once($base_path . '/Exceptions/NestingException.php');
	require_once($base_path . '/Helper.php');
	require_once($base_path . '/Sanitizer.php');

	$sanitizer = new enshrined\svgSanitize\Sanitizer();

	return $sanitizer->sanitize($content);
}

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
             '1.16',
             true
        );

        wp_enqueue_script(
             'euclid-libs-imagetracer',
             plugin_dir_url(__FILE__) . 'vendor/imagetracer_v1.2.6.js',
             ['jquery'],
             '1.2.6',
             true
        );

        // Handle WP 6.9 changes
        // @see https://www.reddit.com/r/Wordpress/comments/1peoabm/wordpress_69_enqueue_script_issue_fix/
        wp_register_script_module(
            'euclid-admin-bootstrap',
            plugin_dir_url(__FILE__) . 'js/admin.js',
            [],
            '1.0.0',
            array( 'in_footer' => true )
        );

        wp_enqueue_script_module(
            'euclid-admin-bootstrap'
        );

    }
}
add_action('admin_enqueue_scripts', 'euclid_enqueue_media_edit_js');

add_filter( 'script_module_data_euclid-admin-bootstrap', function ( array $data ): array {
    $data['ajax_url']   = admin_url('admin-ajax.php');
    $data['nonce']    = wp_create_nonce('euclid_save_svg_nonce');

    return $data; // Must return an array
});

add_action('wp_ajax_euclid_save_svg', 'euclid_save_svg');
function euclid_save_svg() {

    check_ajax_referer('euclid_save_svg_nonce', 'nonce');

    if (!current_user_can('upload_files')) {
        wp_send_json_error(__('Permission denied', 'euclid'));
    }

    // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
    $svg_raw = isset($_POST['svg'])
        ? wp_unslash($_POST['svg'])
        : '';

    if (empty($svg_raw)) {
        wp_send_json_error(__('Missing SVG data', 'euclid'));
    }

    // Sanitize the SVG data with svg-sanitizer
    $svg = euclid_sanitize_svg($svg_raw);

    if (!$svg) {
        wp_send_json_error(__('Invalid SVG data', 'euclid'));
    }

    $attachment_id = isset($_POST['attachment_id'])
        ? intval($_POST['attachment_id'])
        : 0;

    if (!$attachment_id) {
        wp_send_json_error(__('Internal error: Missing attachment id', 'euclid'));
    }

    // Get original attachment
    $original = get_post($attachment_id);
    if (!$original || $original->post_type !== 'attachment') {
        wp_send_json_error(__('Invalid attachment', 'euclid'));
    }

    // Upload dir
    $upload_dir = wp_upload_dir();

    // Generate filename
    $original_filename = get_post_meta($attachment_id, '_wp_attached_file', true);
    $filename_base = sanitize_file_name(pathinfo($original_filename, PATHINFO_FILENAME));
    $filename = $filename_base . '-' . time() . '-vector.svg';

    $file_path = $upload_dir['path'] . '/' . $filename;
    $file_url  = $upload_dir['url'] . '/' . $filename;

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

add_filter('plugin_row_meta', function ($links, $file) {

    if ($file !== plugin_basename(__FILE__)) {
        return $links;
    }

    $links[] = '<a href="https://openstudios.xyz/" target="_blank">' . __('Visit plugin site', 'euclid') . '</a>';

    return $links;

}, 10, 2);
