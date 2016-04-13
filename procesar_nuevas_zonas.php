<?php
require_once('libs/connect.php');
require_once('libs/drawing.php');
require_once('libs/blackout.php');


$zonas = R::find('zona', ' ORDER BY id DESC ');

foreach( $zonas as $zona ) {

  if( is_null($zona->bound_sw_long) ) {
    $bounds = $zona->get_bounds();
    $zona->bound_sw_long = $bounds['sw'][0];
    $zona->bound_sw_lat = $bounds['sw'][1];
    $zona->bound_ne_long = $bounds['ne'][0];
    $zona->bound_ne_lat = $bounds['ne'][1];

    R::store($zona);
  }
}



/**
 * Esto es una cagada.
 * Se generan una imagen de los polígonos para poder testear a qué área pertenece un punto con la imagen.
 * Sí, es ineficiente, pero no hay una lib simple para ver si un punto está en un polígono (incompleto, como los mapas) en php
 */

$zonas = R::find('zona', ' ORDER BY id DESC ');
$render_size = 2000;

foreach( $zonas as &$zona ) {

  if( file_exists(dirname(__FILE__).'/static/zonas/'.$zona->id.'.png') ){ continue; }

  $poligono = json_decode( $zona->poligono, TRUE );
  $poligono = $poligono[0];

  $bounds = $zona->get_bounds();

  $scale_x = $bounds['ne'][0] - $bounds['sw'][0];
  $scale_y = $bounds['ne'][1] - $bounds['sw'][1];

  if( $scale_x > $scale_y ) {
    $size_x = $render_size;
    $size_y = ($scale_y / $scale_x) * $render_size;
  } else {
    $size_y = $render_size;
    $size_x = ($scale_x / $scale_y) * $render_size;
  }

  $points = array();
  // Arma los puntos *en píxeles*
  foreach( $poligono as $punto ) {
    $points[] = round(($punto[0] - $bounds['sw'][0]) / $scale_x * $size_x);
    $points[] = round(($bounds['ne'][1] - $punto[1]) / $scale_y * $size_y);
  }

  $image = imagecreatetruecolor($size_x, $size_y);
  imagealphablending($image, true);
  imagesavealpha($image, true);
  //imageantialias($image, true);
  $transparente = imagecolorallocatealpha($image,255,255,255,127);
  imagefill($image, 0, 0, $transparente);

  $color_fill = imagecolorallocatealpha($image, 0, 0, 0, 0);

  imagefilledpolygon($image, $points, count($points) / 2, $color_fill);

  imagepng($image, dirname(__FILE__).'/static/zonas/'.$zona->id.'.png');
}



$reportes = R::find('reporte', ' WHERE zona_id IS NULL ORDER BY id DESC ');
foreach( $reportes as &$reporte ) {
  // Hace un trigger de actualizar dependencias
  $reporte->update();
  R::store($reporte);
}



// Empieza a buscar tiles que puedan no estar cubiertos por las nuevas zonas
// Va de punta a punta con Zoom 11 buscando zonas que matcheen

function crear_subtiles($tile) {

  if( $tile->z >= 14 ){ return; }

  // Abre la zona en 4, duplicando x, y (siguiente nivel)
  $scope_x = $tile->x*2;
  $scope_y = $tile->y*2;
  $z = $tile->z + 1;

  for( $x=$scope_x; $x<=$scope_x+1; $x++ ) {
    for( $y=$scope_y; $y<=$scope_y+1; $y++ ) {

      if( ! R::findOne('tile', ' x = :x AND y = :y AND z = :z ', array(':x' => $x, ':y' => $y, ':z' => $z)) ) {
        // Crea este tile y todos los inferiores hasta el nivel 14
        $tile = R::dispense('tile');
        $tile->x = $x;
        $tile->y = $y;
        $tile->z = $z;

        if( ! $tile->get_zonas() ){ continue; }

        R::store($tile);
        crear_subtiles($tile);
      }

    }
  }
}


$zonas = R::findAll('zona');

foreach( $zonas as &$zona ) {

  if( ! $zona->bound_ne_long or ! $zona->bound_ne_lat ){ continue; }

  // Empieza desde el nivel 11 y de ahí va para abajo
  $zoom_base = 11;
  $x_start = long2tile( $zona->bound_sw_long, $zoom_base );
  $x_end = long2tile( $zona->bound_ne_long, $zoom_base );
  $y_start = lat2tile( $zona->bound_ne_lat, $zoom_base );
  $y_end = lat2tile( $zona->bound_sw_lat, $zoom_base );
  $z = $zoom_base;

  for( $x=$x_start; $x<=$x_end; $x++ ) {

    for( $y=$y_start; $y<=$y_end; $y++ ) {

      $tile = R::findOne('tile', ' x = :x AND y = :y AND z = :z ', array(':x' => $x, ':y' => $y, ':z' => $z));

      if( ! $tile ) {
        // Crea este tile y todos los inferiores hasta el nivel 14
        $tile = R::dispense('tile');
        $tile->x = $x;
        $tile->y = $y;
        $tile->z = $z;

        if( ! $tile->get_zonas() ){ continue; }

        R::store($tile);
        crear_subtiles($tile);
      }
    }
  }

}