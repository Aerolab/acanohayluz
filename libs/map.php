<?php

// Colores Estado
$COLORES = array(
  'rojo' => '#F71A16',
  'rojo_oscuro' => '#8F1E1D',
  'blanco' => '#FFFFFF',
  'verde' => '#00E600',
  'verde_oscuro' => '#0F920F',
  'verde_anaranjado' => '#7DD412',
  'naranja' => '#FF7D1F',
  'naranja_oscuro' => '#AB4700',
  'amarillo' => '#FFC00',
  'amarillo_oscuro' => '#D69C00',
  'azul' => '#2A263F',
  'azul_oscuro' => '#221E35'
);


// Obtiene las boundaries del mapa entero
function get_map_bounds( $zonas ) {
  $map_bounds = array(
    'sw' => array( 1000, 1000 ),
    'ne' => array( -1000, -1000 )
  );
  foreach( $zonas as $zona ) {
    $poligono = json_decode( $zona->poligono, TRUE );
    $poligono = $poligono[0];

    $bounds = $zona->get_bounds();

    $map_bounds['sw'][0] = $bounds['sw'][0] < $map_bounds['sw'][0] ? $bounds['sw'][0] : $map_bounds['sw'][0];
    $map_bounds['sw'][1] = $bounds['sw'][1] < $map_bounds['sw'][1] ? $bounds['sw'][1] : $map_bounds['sw'][1];
    $map_bounds['ne'][0] = $bounds['ne'][0] > $map_bounds['ne'][0] ? $bounds['ne'][0] : $map_bounds['ne'][0];
    $map_bounds['ne'][1] = $bounds['ne'][1] > $map_bounds['ne'][1] ? $bounds['ne'][1] : $map_bounds['ne'][1];
  }

  return $map_bounds;
}


// Devuelve los tiles que afectan al mapa de Capital + GBA
function get_google_maps_tiles() {

  // Obtiene los tiles de 256x256 a generar para Gmaps
  $base_level = 11;
  $base_tile = array( 688, 1231,
                      694, 1237);
  $tiles = array();
  for( $level = 11; $level <= 21; $level++ ) {
    $scale = pow(2, ($level - $base_level));
    $tiles[$level] = array( $base_tile[0] * $scale, $base_tile[1] * $scale,
                            $base_tile[2] * $scale, $base_tile[3] * $scale);
  }

  return $tiles;
}


function get_tile_bounds( $x, $y, $z ) {
  return array(
    'sw' => array( tile2long($x, $z), tile2lat($y+1, $z) ),
    'ne' => array( tile2long($x+1, $z), tile2lat($y, $z) )
  );
}


// Conversión de Tiles de Google Maps a Long/Lat
function tile2long($x, $z) {
  return $x / pow(2, $z) * 360 - 180;
}
function tile2lat($y, $z) {
  $n = pi() - 2 * pi() * $y / pow(2, $z);
  return 180 / pi() * atan(0.5 * (exp($n) - exp(-$n)));
}

// Conversión de Long/Lat a Tiles de Google Maps
function long2tile($long, $z) {
  return (floor(($long + 180.0) / 360.0 * pow(2.0, $z)));
}
function lat2tile($lat, $z) {
  return (floor((1.0 - log( tan($lat * pi()/180.0) + 1.0 / cos($lat * pi()/180.0)) / pi()) / 2.0 * pow(2.0, $z)));
}
