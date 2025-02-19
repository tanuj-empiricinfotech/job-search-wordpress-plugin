<?php
/**
 * Plugin Name: WP React Page Template
 * Description: A custom page template rendered using ReactJS.
 * Version: 1.0.21
 * Author: Empiric Infotech LLP
 * License: GPL2
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Enqueue the React app's JavaScript
function wp_react_page_template_enqueue() {
    // Include the asset file generated by wp-scripts
    $asset_file = include plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

    // Enqueue the JavaScript file with dependencies and version
    $ver = $asset_file['version'].time();
    wp_enqueue_script(
        'wp-react-page-template',
        plugin_dir_url( __FILE__ ) . 'build/index.js', // Path to the bundled React app
        $asset_file['dependencies'], // Dependencies (from the asset file)
        $ver, // Version (from the asset file)
        true // Load in the footer
    );

    wp_enqueue_style(
        'wp-react-page-style',
        plugins_url('/build/index.css', __FILE__),
        array('tablepress-default', 'elementor-post-130', 'elementor-post-131'),
        $ver
    );
}
add_action( 'wp_enqueue_scripts', 'wp_react_page_template_enqueue' );


// Create the page template
function wp_react_page_template_include( $template ) {
    if ( is_page_template( 'react-page-template.php' ) ) {
        // Return the custom page template
        return plugin_dir_path( __FILE__ ) . 'includes/template-functions.php';
    }
    return $template;
}
add_filter( 'template_include', 'wp_react_page_template_include' );

// Register the page template in WordPress
function wp_react_page_template_register() {
    add_filter( 'theme_page_templates', function( $templates ) {
        $templates['react-page-template.php'] = 'React Page Template';
        return $templates;
    });
}
add_action( 'init', 'wp_react_page_template_register' );


function send_job_search_data_to_api( $campaignCity, $campaignTitle, $campaignCountry, $globalAuthUserDetails, $resumeFileUrl, $radius, $industry, $emailNotifications ) {
    // $url = 'https://api.headhuntrai.com/api/job-searches/';
    $url = 'http://139.59.186.59:8000/api/job-searches/';
    // $url = 'https://9421-110-226-18-217.ngrok-free.app/api/job-searches/';
    // $url = 'https://13fb-110-226-18-217.ngrok-free.app/api/job-searches/';
    
    // Prepare the form data
    $data = array(
        'city'          => sanitize_text_field( $campaignCity ),
        'keyword'       => sanitize_text_field( $campaignTitle ),
        'country'       => sanitize_text_field( explode( '.', $campaignCountry )[0] ),
        'user_id'       => intval( $globalAuthUserDetails['id'] ),
        'email'         => sanitize_email( $globalAuthUserDetails['email'] ),
        'distance'      => sanitize_text_field( $radius ),
        'user_name'     => sanitize_text_field( $globalAuthUserDetails['username'] ),
        'email_status'  => sanitize_text_field( $emailNotifications ),
    );

    // Optionally add industry if it's not empty
    if ( !empty( $industry ) ) {
        $data['industry'] = sanitize_text_field( $industry );
    }

    // Prepare the file data for resume upload (make sure $resumeFile is a valid file)
    // if ( isset( $resumeFile ) && !empty( $resumeFile['tmp_name'] ) ) {
    if ( isset( $resumeFileUrl ) ) {
        // Add the resume file to the data array using CURLFile
        // $data['resume'] = new CURLFile( $resumeFilePath );
        // $data['resume'] = $resumeFileUrl;
        $data['resume_url'] = $resumeFileUrl;
    } else {
        return new WP_Error( 'missing_file', 'Resume file is required for submission' );
    }

    // return $resumeFile;
    
    // Set up arguments for the POST request (no need to manually set Content-Type)
    $args = array(
        'method'      => 'POST',
        'body'        => $data,  // Automatically handles multipart/form-data
        'timeout'     => 45,     // Set timeout to prevent long waits
        'host' => 'https://headhuntrai.com',
    );

    // Send the POST request using wp_remote_post
    $response = wp_remote_post( $url, $args );

    // Check if the request was successful
    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'api_error', 'Error occurred while sending data: ' . $response->get_error_message() );
    }

    // Get the body of the response
    $body = wp_remote_retrieve_body( $response );
    $status_code = wp_remote_retrieve_response_code( $response );

    // Decode the response from JSON
    $data = json_decode( $body, true );

    if ( is_null( $data ) ) {
        return new WP_Error( 'json_error', 'Failed to decode JSON response' );
    }

    return ['data' => $data, 'status' => $status_code]; // Returns the decoded data from the API
}

function save_resume_file_and_get_url( $file, $user_id ) {
    // Check if the file is valid
    if ( isset( $file ) && !empty( $file['tmp_name'] ) ) {
        // Include WordPress functions to handle the file
        require_once( ABSPATH . 'wp-admin/includes/image.php' );
        require_once( ABSPATH . 'wp-admin/includes/file.php' );
        require_once( ABSPATH . 'wp-admin/includes/media.php' );

        // Generate a unique file name using the user ID
        $file_name = $user_id . '-' . sanitize_file_name( $file['name'] );
        
        // Modify the file array with the new file name
        $file['name'] = $file_name;

        // Handle the upload using WordPress media upload functions
        $upload = wp_handle_upload( $file, array( 'test_form' => false ) );

        // Check for errors in the upload process
        if ( isset( $upload['error'] ) ) {
            return new WP_Error( 'upload_error', 'Error uploading file: ' . $upload['error'] );
        }

        // The file was uploaded successfully, now we need to save it in the media library
        $file_url = $upload['url']; // URL of the uploaded file
        $file_path = $upload['file']; // Path to the uploaded file on the server

        // Prepare an attachment array for the media library
        $file_info = array(
            'guid'           => $file_url,
            'post_mime_type' => $file['type'],
            'post_title'     => sanitize_file_name( $file['name'] ),
            'post_content'   => '',
            'post_status'    => 'inherit',
        );

        // Insert the file into the WordPress media library
        $attachment_id = wp_insert_attachment( $file_info, $file_path );

        // Generate metadata for the attachment (image size, etc.)
        $attachment_metadata = wp_generate_attachment_metadata( $attachment_id, $file_path );
        wp_update_attachment_metadata( $attachment_id, $attachment_metadata );

        // Return the URL of the uploaded file
        return ["url"=>$file_url, "path"=>$file_path];
    } else {
        return new WP_Error( 'no_file', 'No file uploaded or invalid file.' );
    }
}

// Add campaign
function handle_job_search_ajax_request() {
    try {
        // Verify nonce for security
        if ( !isset($_POST['nonce']) || !wp_verify_nonce( $_POST['nonce'], 'job_search_nonce' ) ) {
            echo json_encode( array( 'message' => 'Invalid nonce' ) );
            wp_die();
        }

        // Get POST data from AJAX request
        $campaignCity = sanitize_text_field( $_POST['city'] );
        $campaignTitle = sanitize_text_field( $_POST['keyword'] );
        $campaignCountry = sanitize_text_field( $_POST['country'] );
        $globalAuthUserDetails = array(
            'id' => intval( $_POST['user_id'] ),
            'email' => sanitize_email( $_POST['email'] ),
            'username' => sanitize_text_field( $_POST['user_name'] )
        );
        $resumeFile = $_FILES['resume'];
        $radius = sanitize_text_field( $_POST['distance'] );
        $industry = sanitize_text_field( $_POST['industry'] );
        $emailNotifications = sanitize_text_field( $_POST['email_status'] );

        // wp_send_json_success( array( 'file' => $resumeFile ) );
        $file = save_resume_file_and_get_url($resumeFile, $globalAuthUserDetails['id']);
        // $file_content = file_get_contents( $file_url );
        // $resumeFile = base64_encode( $file_content );

        // wp_send_json_error( array( 'message' => $file_url ) );

        // $resumeFilePath = $file["path"];
        $resumeFileUrl = $file["url"];

        // Call the function to send data to the API
        $response = send_job_search_data_to_api( $campaignCity, $campaignTitle, $campaignCountry, $globalAuthUserDetails, $resumeFileUrl, $radius, $industry, $emailNotifications );

        if ( is_wp_error( $response ) ) {
            // Return error message
            echo json_encode( array( 'message' => $response->get_error_message() ) );
        } else {
            // Return success response
            echo json_encode($response['data']);
        }
        wp_die();
    } catch (\Throwable $th) {
        //throw $th;
        echo $th->getMessage();
        wp_die();
    }
}
add_action( 'wp_ajax_send_job_search_data', 'handle_job_search_ajax_request' ); // For logged-in users
add_action( 'wp_ajax_nopriv_send_job_search_data', 'handle_job_search_ajax_request' ); // For non-logged-in users

add_action( 'rest_api_init', function () {
    register_rest_route( 'job-search/v1', '/country-list-proxy', array( // Replace 'job-search' with your plugin's namespace
        'methods'  => 'GET',
        'callback' => 'fetch_country_list_proxy',
        'permission_callback' => '__return_true', // Adjust permission callback as needed for security
    ) );

    register_rest_route( 'job-search/v1', '/cities-list-proxy/(?P<country_id>\d+)', array( // Define endpoint and parameter
        'methods'  => 'GET', // Accept GET requests
        'callback' => 'get_cities_list_proxy', // Callback function to handle requests
        'permission_callback' => '__return_true', // Set permissions (adjust as needed)
    ) );
});
  
function fetch_country_list_proxy( WP_REST_Request $request ) {
    $api_url = 'https://api.headhuntrai.com/api/country-list/';

    $response = wp_remote_get( $api_url );

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'api_error', 'Failed to fetch data from API', array( 'status' => 500 ) );
    }

    $body = wp_remote_retrieve_body( $response );
    $data = json_decode( $body, true ); // Decode JSON response

    if ( is_null( $data ) && !empty( $body ) ) {
        // Handle cases where the body is not valid JSON but not empty (e.g., HTML error page)
        return new WP_Error( 'invalid_json', 'Invalid JSON response from API', array( 'status' => 500, 'response_body' => $body ) );
    } else if ( is_null( $data ) && empty( $body )) {
        // Handle empty body response
        return new WP_Error( 'empty_response', 'Empty response from API', array( 'status' => 500 ) );
    }


    return rest_ensure_response( $data ); // Ensure proper REST response
}

function get_cities_list_proxy( $request ) {
    $country_id = $request['country_id']; // Get country_id from the URL parameter
    $api_url    = str_replace( '<country_id>', $country_id, 'https://api.headhuntrai.com/api/city-list/<country_id>/' ); // Construct final URL

    $response = wp_remote_get( $api_url ); // Fetch data from the external API

    if ( is_wp_error( $response ) ) { // Check for WordPress errors
        return new WP_Error( 'api_error', 'Error fetching cities list from external API', array( 'status' => 500 ) );
    }

    $body = wp_remote_retrieve_body( $response ); // Get the response body
    $data = json_decode( $body, true ); // Decode JSON response

    if ( json_last_error() !== JSON_ERROR_NONE ) { // Check for JSON decoding errors
        return new WP_Error( 'json_error', 'Error decoding JSON response from external API', array( 'status' => 500 ) );
    }

    return rest_ensure_response( $data ); // Return the data as a REST API response
}
