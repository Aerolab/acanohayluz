<?php
include('libs/twitteroauth/twitteroauth.php');
session_start();

// The TwitterOAuth instance

$CONSUMER_KEY = '';
$CONSUMER_SECRET = '';

if( isset($_GET['oauth_verifier']) ) {
  $twitteroauth = new TwitterOAuth($CONSUMER_KEY, $CONSUMER_SECRET, $_SESSION['oauth_token'], $_SESSION['oauth_token_secret']);

  $access_token = $twitteroauth->getAccessToken($_GET['oauth_verifier']);

  if( $access_token ) {
    echo '<pre>';
    print_r($access_token);
    $connection = new TwitterOAuth($CONSUMER_KEY, $CONSUMER_SECRET, $access_token['oauth_token'], $access_token['oauth_token_secret']);
    $params =array();
    $params['include_entities']='false';
    $content = $connection->get('account/verify_credentials',$params);
    print_r($content);
    echo '</pre>';
  }
  die();
}


$twitteroauth = new TwitterOAuth('', '');

// Requesting authentication tokens, the parameter is the URL we will be redirected to
$request_token = $twitteroauth->getRequestToken('http://acanohayluz.com.ar/auth.php');


// Saving them into the session
$_SESSION['oauth_token'] = $request_token['oauth_token'];
$_SESSION['oauth_token_secret'] = $request_token['oauth_token_secret'];

// If everything goes well..
if($twitteroauth->http_code==200){
    // Let's generate the URL and redirect
    $url = $twitteroauth->getAuthorizeURL($request_token['oauth_token']);
    header('Location: '.$url);
} else {
    // It's a bad idea to kill the script, but we've got to know when there's an error.
    die('Something wrong happened.');
}
