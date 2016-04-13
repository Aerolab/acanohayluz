<?php
require_once('libs/connect.php');

$zonas = R::findAll('zona');
$tiles = R::findAll('tile');

$zonas_json = array();
$zonas_seleccionables_json = array();

$zonas_seleccionables_json['buenos-aires'] = array(
  'id' => NULL,
  'nombre' => 'Ciudad de Buenos Aires',
  'slug' => 'buenos-aires',
  'bounds' => array('sw' => array(-58.5126502, -34.6606746), 'ne' => array(-58.35, -34.551117)),
  'lat' => -34.6033,
  'long' => -58.4317,
  'civilizacion' => 1,
  'estado' => '',
  'estado_nombre' => '',
);

foreach( $zonas as $zona ) {
  $data_zona = array(
    'id' => $zona->id,
    'nombre' => $zona->nombre,
    'slug' => $zona->slug,
    'bounds' => $zona->get_bounds(),
    'lat' => (float) $zona->lat,
    'long' => (float) $zona->long,
    'civilizacion' => intval($zona->civilizacion),
    'estado' => $zona->get_estado(),
    'estado_nombre' => $zona->get_nombre_estado(),
  );

  $zonas_json[] = $data_zona;
  if( $zona->seleccionable ) {
    $zonas_seleccionables_json[$zona->slug] = $data_zona;
  }
}

// Los tiles son para verificar rápidamente si un tile existe en el mapa y cuándo fue updateado y no tirar 404.
$tiles_json = array();
foreach( $tiles as $tile ) {
  $tiles_json[$tile->z][$tile->x][$tile->y] = $tile->timestamp;
}

$json_zonas = '';

$json_zonas .= 'var ZONAS = '. json_encode($zonas_json).';'."\n";
$json_zonas .= 'var ZONAS_SELECCIONABLES = '. json_encode($zonas_seleccionables_json).';'."\n";
$json_zonas .='var TILES = '. json_encode($tiles_json).';'."\n";

file_put_contents( dirname(__FILE__).'/static/zonas.js', $json_zonas );

echo 'OK';
