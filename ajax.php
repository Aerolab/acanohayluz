<?php
require_once('libs/connect.php');

$zona = R::load('zona', 8);
$zona->recalcular_estado();

if( ! isset($_GET['m']) ){ exit(); }

if( $_GET['m'] == 'nuevo' ) {

  $reporte = R::dispense('reporte');

  $reporte->import($_POST, 'direccion_completa,direccion_id,lat,long,estado,horas,zona_id');

  $reporte->horas = intval($reporte->horas);
  $reporte->horas = ($reporte->horas == '') ? NULL : intval($reporte->horas);
  $reporte->zona_id = ($reporte->zona_id) ? intval($reporte->zona_id) : NULL;
  $reporte->fecha = date('Y-m-d H:i:s');

  // Guarda la ip, dispositivo y fingerprint del browser
  $reporte->ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : NULL;
  $reporte->user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : NULL;
  $reporte->device = isset($_POST['d']) ? $_POST['d'] : NULL;
  $reporte->fingerprint = isset($_POST['f']) ? $_POST['f'] : NULL;

  // Flaguea como fruta los pines con duraciones muy grandes (>10 días)
  if( $reporte->horas > 10*24 ) { $reporte->fruta = 1; }
  // También los que tienen estados fake
  if( ! in_array($reporte->estado, array('hay-luz', 'corte-cuadra', 'corte-amplio')) ){ $reporte->fruta = 1; }
  // Anula los reportes imprecisos (sin altura)
  if( function_exists('preg_match') ) {
    if( ! preg_match('/[0-9]+/', $reporte->direccion_completa) ){ $reporte->impreciso = 1; }
  }

  R::store($reporte);

  header('Content-type: application/json');
  echo json_encode( array('zona' => array(
    'id' => $reporte->zona_id,
    'nombre' => $reporte->zona ? $reporte->zona->nombre : null
  )) );
  exit();

}

elseif( $_GET['m'] == 'reportes_zona' ) {

  // Deprecado

  $pines_enabled = FALSE;
  $horas_pines = 12;
  $limit = isset($_GET['n']) ? intval($_GET['n']) : 100;
  $limit = ($limit > 200) ? 200 : (($limit < 0) ? 0 : $limit);

  $reportes = array();

  if( $pines_enabled ) {
    if( isset($_GET['zona']) ) {
      $reportes =
      R::getAll(' SELECT `lat`, `long`, `estado`, `horas`, `fecha` FROM reporte
                  WHERE `zona_id` = :zona_id AND `fecha` >= :fecha AND `fruta` = 0 AND `anulado` = 0
                  ORDER BY `fecha` DESC LIMIT :limit ',
                  array(':zona_id' => intval($_GET['zona']),
                        ':fecha' => date('Y-m-d H:i:s', time()-60*60*$horas_pines),
                        ':limit' => $limit)
             );
    }
    elseif( isset($_GET['bounds']) ) {
      $reportes =
      R::getAll(' SELECT `lat`, `long`, `estado`, `horas`, `fecha` FROM reporte
                  WHERE `lat` >= :lat_sw AND `lat` <= :lat_ne AND `long` >= :long_sw AND `long` <= :long_ne
                  AND `fecha` >= :fecha AND `fruta` = 0 AND `anulado` = 0 AND `puntaje` >= 0.1
                  ORDER BY `fecha` DESC LIMIT :limit',
                  array(':lat_sw' => (float) $_GET['bounds']['sw'][0],
                        ':lat_ne' => (float) $_GET['bounds']['ne'][0],
                        ':long_sw' => (float) $_GET['bounds']['sw'][1],
                        ':long_ne' => (float) $_GET['bounds']['ne'][1],
                        ':fecha' => date('Y-m-d H:i:s', time()-60*60*$horas_pines),
                        ':limit' => $limit)
                );
    }
  }

  $reportes_json = array();
  foreach( $reportes as $reporte ) {
    $reportes_json[] = array(
      'lat' => (float) $reporte['lat'],
      'long' => (float) $reporte['long'],
      'horas' => $reporte['horas'],
      'estado' => $reporte['estado'],
      'fecha' => $reporte['fecha']
    );
  }

  header('Content-type: application/json');
  echo json_encode($reportes_json);
  exit();

}
