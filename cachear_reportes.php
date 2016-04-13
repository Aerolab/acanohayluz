<?php
require_once('libs/connect.php');
require_once('libs/drawing.php');

// Cachea los pines por tiles
$num_reportes_desktop = 500;
$num_reportes_mobile = 250;

// Los tiles se calculan con 1 hora de caching
$tiles = R::findAll('tile', ' (z = 12 OR z = 13) AND actualizar_reportes = 1 ORDER BY z ASC, id ASC ');
foreach( $tiles as $tile ) {

  $reportes = $tile->get_reportes( $num_reportes_desktop );

  $reportes_json = array();
  foreach( $reportes as $reporte ) {
    $reportes_json[] = array(
      'lat' => (float) $reporte['lat'],
      'long' => (float) $reporte['long'],
      'horas' => intval($reporte['horas']),
      'estado' => $reporte['estado'],
      'fecha' => $reporte['fecha']
    );
  }

  // Los pines se reciben vía JSONP
  $tile_name = $tile->z.'_'.$tile->x.'_'.$tile->y;
  $jsonp_file = 'acanohayluz_cache_reportes("'.$tile_name.'", '.json_encode(array_reverse($reportes_json)).');';

  file_put_contents( dirname(__FILE__).'/static/reportes/reportes-'.$tile->z.'-'.$tile->x.'-'.$tile->y.'.js', $jsonp_file );


  // Hay una versión "light" para mobiles
  $reportes_mobile = $tile->get_reportes( $num_reportes_mobile );

  $reportes_mobile_json = array();
  foreach( $reportes as $reporte ) {
    $reportes_mobile_json[] = array(
      'lat' => (float) $reporte['lat'],
      'long' => (float) $reporte['long'],
      'horas' => intval($reporte['horas']),
      'estado' => $reporte['estado'],
      'fecha' => $reporte['fecha']
    );
  }


  $tile_name = $tile->z.'_'.$tile->x.'_'.$tile->y;
  $jsonp_file = 'acanohayluz_cache_reportes("'.$tile_name.'", '.json_encode(array_reverse($reportes_mobile_json)).');';

  file_put_contents( dirname(__FILE__).'/static/reportes/reportes-'.$tile->z.'-'.$tile->x.'-'.$tile->y.'-light.js', $jsonp_file );

  $tile->actualizar_reportes = 0;
  $tile->fecha_update_reportes = date('Y-m-d H:i:s');
  R::store($tile);

}

echo 'OK';