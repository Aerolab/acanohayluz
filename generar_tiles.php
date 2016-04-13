<?php
require_once('libs/connect.php');
require_once('libs/drawing.php');

$tile_size = 256;
$max_zoom_level = 14;

// Se da la posibilidad de tener varios """workers""" con w(id>=0) y n(cantidad)
if( isset($_GET['w']) and isset($_GET['n']) ) {
  $tiles_a_actualizar = R::find('tile', ' MOD(id, :n) = :w AND actualizar = 1 ORDER BY z ASC ',
                                        array(':w' => intval($_GET['w']), ':n' => intval($_GET['n'])));
}
else {
  $tiles_a_actualizar = R::find('tile', ' actualizar = 1 ORDER BY z ASC ');
}

foreach( $tiles_a_actualizar as $tile ) {

  $zonas_a_dibujar = $tile->get_zonas();

  if( ! $zonas_a_dibujar ){ continue; }

  $reportes_a_dibujar = $tile->get_reportes( 10000, 24, TRUE, TRUE );

  // Crea la imagen principal del tile
  // Renderiza la imagen al doble de resolución para aplicar un "antialias"
  // al resizearla con resampling al final del proceso
  $render_size = $tile_size * 2;

  $imagen_tile = get_imagen_transparente( $render_size, $render_size );
  build_tile( $tile->x, $tile->y, $tile->z, $zonas_a_dibujar, $render_size, $imagen_tile );

  $imagen_reportes = get_imagen_transparente( $render_size, $render_size );
  build_reportes( $tile, $reportes_a_dibujar, $render_size, $imagen_reportes );

  // Pega los reportes sobre la imagen anterior
  imagecopyresampled( $imagen_tile, $imagen_reportes, 0, 0, 0, 0, $render_size, $render_size, $render_size, $render_size );

  // Resizea la imagen de nuevo para aplicar un "antialias"
  $image_aa = get_imagen_transparente( $tile_size, $tile_size );
  imagecopyresampled( $image_aa, $imagen_tile, 0, 0, 0, 0, $tile_size, $tile_size, $render_size, $render_size );

  // Guarda la pic
  imagepng($image_aa, dirname(__FILE__).'/static/tiles/acanohayluz-'.$tile->z.'-'.$tile->x.'-'.$tile->y.'.png', 9);

  imagedestroy($imagen_tile);
  imagedestroy($imagen_reportes);
  imagedestroy($image_aa);

  $tile->actualizar = 0;
  $tile->timestamp = time();

  R::store($tile);
}


function build_tile($x, $y, $zoom, &$zonas_a_dibujar, $render_size = 512, &$image) {

  global $max_zoom_level;

  $tile_bounds = get_tile_bounds($x, $y, $zoom);
  $tile_scale_x = $tile_bounds['ne'][0] - $tile_bounds['sw'][0];
  $tile_scale_y = $tile_bounds['ne'][1] - $tile_bounds['sw'][1];

  // Dibuja las zonas del tile
  foreach( $zonas_a_dibujar as &$zona ) {

    $poligono = json_decode( $zona->poligono, TRUE );
    $poligono = $poligono[0];

    $bounds = $zona->get_bounds();

    $scale_x = $bounds['ne'][0] - $bounds['sw'][0];
    $scale_y = $bounds['ne'][1] - $bounds['sw'][1];
    $size_x = $scale_x / $tile_scale_x * $render_size;
    $size_y = $scale_y / $tile_scale_y * $render_size;

    $start_x = round(($bounds['sw'][0] - $tile_bounds['sw'][0]) / $tile_scale_x * $render_size);
    $start_y = round(($tile_bounds['ne'][1] - $bounds['ne'][1]) / $tile_scale_y * $render_size);

    $points = array();
    // Arma los puntos *en píxeles*
    foreach( $poligono as $punto ) {
      $points[] = round(($punto[0] - $bounds['sw'][0]) / $scale_x * $size_x) + $start_x;
      $points[] = round(($bounds['ne'][1] - $punto[1]) / $scale_y * $size_y) + $start_y;
    }


    $colores = get_color_zona( $zona );

    $color_fill = hex2rgb($colores['fill']);
    $color_fill = imagecolorallocatealpha($image, $color_fill[0], $color_fill[1], $color_fill[2], $zona->civilizacion ? 90 : 109);
    $color_borde = hex2rgb($colores['borde']);
    $color_borde = imagecolorallocatealpha($image, $color_borde[0], $color_borde[1], $color_borde[2], ($zoom < $max_zoom_level) ? ($zona->civilizacion ? 64 : 77) : ($zona->civilizacion ? 90 : 109) );

    // Crea el polígono
    imagefilledpolygon($image, $points, count($points) / 2, $color_fill);

    // Dibuja los bordes de la zona
    $last_x = $points[0];
    $last_y = $points[1];
    foreach( array_chunk(array_slice($points,2), 2) as $coord ) {
      imagelinethick($image, $last_x, $last_y, $coord[0], $coord[1], $color_borde, ($zoom > 12 and $zoom < $max_zoom_level) ? 2 : 1);
      $last_x = $coord[0];
      $last_y = $coord[1];
    }

  }

}


function build_reportes($tile, &$reportes_a_dibujar, $render_size = 512, &$image) {

  if( $tile->z < 13 ){ return; }

  global $max_zoom_level;

  imagealphablending($image, false);

  $bounds = $tile->get_bounds();
  $scale_x = $bounds['ne'][0] - $bounds['sw'][0];
  $scale_y = $bounds['ne'][1] - $bounds['sw'][1];

  $color_apagon = imagecolorallocatealpha($image, 100, 0, 0, 110);
  $color_apagon_2 = imagecolorallocatealpha($image, 100, 0, 0, 102);
  $color_apagon_3 = imagecolorallocatealpha($image, 100, 0, 0, 97);
  $color_luz = imagecolorallocatealpha($image, 255, 255, 255, 127);

  // Hace 3 pasadas para hacer los gradients de los reportes
  // El tamaño del elipse de apagón es de 100px en zoom 14 y se va duplicando
  // El de corte y volvió la luz es de 40px en zoom 14

  foreach( $reportes_a_dibujar as &$reporte ) {
    $posicion = get_posicion_reporte($reporte, $bounds, $scale_x, $scale_y, $render_size);
    $ancho = get_ancho_reporte($reporte, $tile);
    if( $reporte->estado == 'hay-luz' ) { }
    else {
      imagefilledellipse( $image, $posicion['x'], $posicion['y'], $ancho, $ancho, $color_apagon );
    }
  }


  foreach( $reportes_a_dibujar as &$reporte ) {
    $posicion = get_posicion_reporte($reporte, $bounds, $scale_x, $scale_y, $render_size);
    $ancho = get_ancho_reporte($reporte, $tile);
    if( $reporte->estado == 'hay-luz' ) { }
    else {
      imagefilledellipse( $image, $posicion['x'], $posicion['y'], $ancho/1.5, $ancho/1.5, $color_apagon_2 );
    }
  }


  foreach( $reportes_a_dibujar as &$reporte ) {
    $posicion = get_posicion_reporte($reporte, $bounds, $scale_x, $scale_y, $render_size);
    $ancho = get_ancho_reporte($reporte, $tile);
    if( $reporte->estado == 'hay-luz' ) { }
    else {
      imagefilledellipse( $image, $posicion['x'], $posicion['y'], $ancho/2.5, $ancho/2.5, $color_apagon_3 );
    }
  }


  // Activa el alpha blending para las vueltas de luz
  foreach( $reportes_a_dibujar as &$reporte ) {
    $posicion = get_posicion_reporte($reporte, $bounds, $scale_x, $scale_y, $render_size);
    $ancho = get_ancho_reporte($reporte, $tile);
    if( $reporte->estado == 'hay-luz' ) {
      imagefilledellipse( $image, $posicion['x'], $posicion['y'], $ancho, $ancho, $color_luz );
    }
  }

}


function get_posicion_reporte( &$reporte, $bounds, $scale_x, $scale_y, $render_size ) {
  return array(
    'x' => round(($reporte->long - $bounds['sw'][0]) / $scale_x * $render_size),
    'y' => round(($bounds['ne'][1] - $reporte->lat) / $scale_y * $render_size)
  );
}


function get_ancho_reporte( &$reporte, &$tile ) {
  $ancho = 30;
  if( $reporte->estado == 'corte-amplio' ){ $ancho = 55; }
  if( $reporte->estado == 'hay-luz' ){ $ancho = 55; }
  $ancho *= (($tile->z - 13)+1);

  return $ancho;
}


function get_color_zona( &$zona ) {

  $estado = $zona->get_estado();

  global $COLORES;

  // Elige los colores óptimos
  $color_fill = $COLORES['verde'];
  $color_borde = $COLORES['verde_oscuro'];

  if( $estado == 'apagonazo' ) {
    $color_fill = $COLORES['azul'];
    $color_borde = $COLORES['azul_oscuro'];
  }
  else if( $estado == 'apagon' ) {
    $color_fill = $COLORES['rojo'];
    $color_borde = $COLORES['rojo_oscuro'];
  }
  else if( $estado == 'cortes' ) {
    $color_fill = $COLORES['naranja'];
    $color_borde = $COLORES['naranja_oscuro'];
  }
  else if( $estado == 'inconvenientes' ) {
    $color_fill = $COLORES['amarillo'];
    $color_borde = $COLORES['amarillo_oscuro'];
  }

  return array(
    'fill' => $color_fill,
    'borde' => $color_borde
  );
}



function get_imagen_transparente( $ancho, $alto ) {

  $image = imagecreatetruecolor($ancho, $alto);
  imagealphablending($image, true);
  imagesavealpha($image, true);
  //imageantialias($image, true);
  $transparente = imagecolorallocatealpha($image,255,255,255,127);
  imagefill($image, 0, 0, $transparente);

  return $image;
}

echo 'OK';
