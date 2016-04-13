<?php
require_once('libs/connect.php');
require_once('libs/drawing.php');
require_once('libs/blackout.php');

$zonas = R::find('zona', ' ORDER BY estado DESC ');

foreach( $zonas as $zona ) {

  if( is_null($zona->bound_sw_long) ) {
    $bounds = $zona->get_bounds();
    $zona->bound_sw_long = $bounds['sw'][0];
    $zona->bound_sw_lat = $bounds['sw'][1];
    $zona->bound_ne_long = $bounds['ne'][0];
    $zona->bound_ne_lat = $bounds['ne'][1];

    R::store($zona);
  }

  if( is_null($zona->fecha_update_reportes) or strtotime($zona->fecha_update_reportes) < (time()-60*60*1) ) {
    $reportes = $zona->get_reportes();
    actualizar_puntaje_reportes($reportes);
    $zona->fecha_update_reportes = date('Y-m-d H:i:s');
    R::store($zona);
  }
}


$tiles = R::find('tile', ' ORDER BY z ASC ');

foreach( $tiles as $tile ) {

  if( is_null($zona->bound_sw_long) ) {
    $bounds = $tile->get_bounds();
    $tile->bound_sw_long = $bounds['sw'][0];
    $tile->bound_sw_lat = $bounds['sw'][1];
    $tile->bound_ne_long = $bounds['ne'][0];
    $tile->bound_ne_lat = $bounds['ne'][1];

    R::store($tile);
  }
}

echo 'OK';
