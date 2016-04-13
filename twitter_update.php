<?php
require_once('libs/connect.php');
require_once('libs/twitter_api_exchange.php');
require_once('libs/foreign_chars.php');

/** Set access tokens here - see: https://dev.twitter.com/apps/ **/
$settings = array(
  'oauth_access_token' => "",
  'oauth_access_token_secret' => "",
  'consumer_key' => "",
  'consumer_secret' => ""
);


/** Perform a GET request and echo the response **/
/** Note: Set the GET field BEFORE calling buildOauth(); **/
$url = 'https://api.twitter.com/1.1/search/tweets.json';
$getfield = '?q=%23AcaNoHayLuz&result_type=recent';
$requestMethod = 'GET';
$twitter = new TwitterAPIExchange($settings);
$updates = json_decode( $twitter->setGetfield($getfield)
                                ->buildOauth($url, $requestMethod)
                                ->performRequest(), TRUE );

$tweets = $updates['statuses'];

$nombres_zonas = R::findAll('aliaszona');

foreach( $tweets as $tweet ) {

  $texto_tweet = strtolower( convert_accented_characters($tweet['text']) );
  $zona_id = NULL;

  foreach( $nombres_zonas as $alias ) {
    if( strpos($texto_tweet, strtolower(convert_accented_characters($alias->nombre))) !== FALSE ) {
      $zona_id = $alias->zona_id;
      break;
    }
  }

  if( $zona_id ) {
    $previo = R::findOne('reporte', ' tweet_id = ? ', array($tweet['id_str']));
    if( $previo ){ continue; }

    $reporte = R::dispense('reporte');

    $reporte->zona_id = $zona_id;
    $reporte->ip = NULL;
    $reporte->tweet_id = $tweet['id_sr'];
    $reporte->tweet = json_encode( $tweet );
    $reporte->fecha = date('Y-m-d H:i:s', strtotime($tweet['created_at']) );

    R::store($reporte);
  }
}

