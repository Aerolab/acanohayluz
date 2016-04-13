<?php
require_once('libs/connect.php');
require_once('libs/twitter_api_exchange.php');
require_once('libs/foreign_chars.php');

foreach( $zonas as $zona ) {
  $zona->recalcular_estado();
}

$settings = array(
  'oauth_access_token' => "",
  'oauth_access_token_secret' => "",
  'consumer_key' => "",
  'consumer_secret' => ""
);


// Obtiene las zonas a twittear
$zonas = R::findAll('zona');


foreach( $zonas as $zona )
{
  if( $zona->get_estado($zona->estado) == $zona->get_estado($zona->estado_ultimo_tweet) ) { continue; }

  $texto_tweet = '';
  $hashtag_zona = '#'.str_replace(array(' ', '.', '-'), '', $zona->nombre);

  switch( $zona->get_estado($zona->estado) )
  {
    case 'apagonazo':
      $texto_tweet = 'Avanza un apagón en '. $hashtag_zona .' D: ! Seguí los cortes de luz en http://acanohayluz.com.ar #AcaNoHayLuz';
      break;
    case 'apagon':
      if( $zona->estado > $zona->estado_ultimo_tweet ) {
        $texto_tweet = 'Se va resolviendo el apagón en '. $hashtag_zona .'. Seguí los cortes en http://acanohayluz.com.ar #AcaNoHayLuz';
      } else {
        $texto_tweet = 'Empeoran los cortes de luz en '. $hashtag_zona .'. Seguí los cortes en http://acanohayluz.com.ar #AcaNoHayLuz';
      }
      break;
    case 'cortes':
      if( $zona->estado > $zona->estado_ultimo_tweet ) {
        $texto_tweet = 'Todavía hay varios cortes de luz en '. $hashtag_zona .'. Seguí los cortes en http://acanohayluz.com.ar #AcaNoHayLuz';
      } else {
        $texto_tweet = 'Hay varios cortes de luz en '. $hashtag_zona .'. Seguí los cortes en http://acanohayluz.com.ar #AcaNoHayLuz';
      }
      break;
    case 'inconvenientes':
      if( $zona->estado > $zona->estado_ultimo_tweet ) {
        $texto_tweet = 'Están terminando los cortes de luz en '. $hashtag_zona .'. Seguí el estado de los cortes en http://acanohayluz.com.ar #AcaNoHayLuz';
      } else {
        $texto_tweet = 'Aparecen algunos cortes de luz en '. $hashtag_zona .'. Seguí el estado de los cortes en http://acanohayluz.com.ar #AcaNoHayLuz';
      }
      break;
    case 'luz':
      $texto_tweet = 'Está volviendo la luz a '. $hashtag_zona .'! Gracias acanohayluz.com.ar por avisar #AcaNoHayLuz';
      break;
  }

  // Por las dudas, si se excede quita el hashtag
  if( strlen($texto_tweet) >= 140 ) { $texto_tweet = trim(str_replace('#AcaNoHayLuz', '', $texto_tweet)); }

  /** Perform a GET request and echo the response **/
  /** Note: Set the GET field BEFORE calling buildOauth(); **/
  try {
    $url = 'https://api.twitter.com/1.1/statuses/update.json';
    $postfields = array('status' => $texto_tweet);
    $requestMethod = 'POST';
    $twitter = new TwitterAPIExchange($settings);
    $result = $twitter->setPostfields($postfields)
                      ->buildOauth($url, $requestMethod)
                      ->performRequest();

    $result = json_decode($result, TRUE);
  } catch( Exception $e ){ $result = array(); }

  $zona->estado_ultimo_tweet = $zona->estado;
  R::store($zona);

  if( isset($result['id_str']) ) {

    R::exec('INSERT INTO tweet(id) VALUES(?) ON DUPLICATE KEY UPDATE id = id', array($result['id_str']));

    $tweet = R::load('tweet', $result['id_str']);
    $tweet->id = $result['id_str'];
    $tweet->text = $result['text'];
    $tweet->json = json_encode( $result );
    $tweet->fecha = date('Y-m-d H:i:s');
    $tweet->zona_id = $zona->id;

    R::store($tweet);
  }

}

