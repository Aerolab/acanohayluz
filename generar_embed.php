<?php
require_once('libs/connect.php');
require_once('libs/drawing.php');

// Genera un Mapa estático basado en Google Maps con los overlays correspondientes
// Google Maps está limitado a 640x640
$dimensiones = array(640, 640);

$embeds = R::findAll('embed');

foreach( $embeds as $embed ) {

  // Si no hay un mapa ya guardado (de Google), lo descarga
  if( ! file_exists( dirname(__FILE__).'/static/mapas/'. $embed->id .'.png' ) ) {
    $mapa_bin = file_get_contents( 'http://maps.googleapis.com/maps/api/staticmap?center=-34.61983,-58.43683&zoom=12&size=640x640&sensor=false' );
    file_put_contents( dirname(__FILE__).'/static/mapas/'. $embed->id .'.png', $mapa_bin );
  }

  // Carga el mapa de google
  $mapa = imagecreatefrompng( dirname(__FILE__).'/static/mapas/'. $embed->id .'.png' );
  imagealphablending($mapa, true);
  imagesavealpha($mapa, true);

  // Empieza a poner los tiles correspondientes encima del mapa original
  $tiles = R::find('tile', ' (bound_ne_long >= :sw_long AND bound_sw_long <= :ne_long) AND
                             (bound_ne_lat >= :sw_lat AND bound_sw_lat <= :ne_lat) AND z = 12 ',
                            array(
                              ':sw_long' => $embed->bound_sw_long,
                              ':sw_lat' => $embed->bound_sw_lat,
                              ':ne_long' => $embed->bound_ne_long,
                              ':ne_lat' => $embed->bound_ne_lat
                            ));

  foreach( $tiles as $tile ) {

    // Obtiene el tamaño del tile en el mapa
    $bounds = $tile->get_bounds();
    $proporcion_x = abs($bounds['ne'][0] - $bounds['sw'][0]) / abs($embed->bound_ne_long - $embed->bound_sw_long);
    $proporcion_y = abs($bounds['ne'][1] - $bounds['sw'][1]) / abs($embed->bound_ne_lat - $embed->bound_sw_lat);
    $size_x = round($proporcion_x * $dimensiones[0]);
    $size_y = round($proporcion_y * $dimensiones[1]);

    $offset_x = round(($bounds['sw'][0] - $embed->bound_sw_long) / $proporcion_x * $dimensiones[0]);
    $offset_y = round(($embed->bound_ne_lat - $bounds['ne'][1]) / $proporcion_y * $dimensiones[1]);


    $imagen_tile = imagecreatefrompng( dirname(__FILE__).'/static/tiles/acanohayluz-'. $tile->z .'-'. $tile->x .'-'. $tile->y .'.png' );
    imagealphablending($imagen_tile, true);
    imagesavealpha($imagen_tile, true);
    imagecopyresampled( $mapa, $imagen_tile, $offset_x, $offset_y, 0, 0, $size_x, $size_y, imagesx($imagen_tile), imagesy($imagen_tile) );
  }

  header('Content-type: image/png');
  imagepng($mapa);

}
