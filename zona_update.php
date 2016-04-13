<?php
require_once('libs/connect.php');

$zonas = R::findAll('zona', ' ORDER by fecha_update_estado ASC ');

foreach( $zonas as $zona ) {
  if( isset($_GET['all']) and $_GET['all'] ) {
    $zona->recalcular_estado( TRUE );
  } else {
    // Update cada 12 horas
    if( strtotime($zona->fecha_update_estado) + (60*60*12) < time() ) {
      echo "Zona ". $zona->id ." - ". $zona->nombre ." actualizada";
      $zona->recalcular_estado( TRUE );
    } else {
      // Nada
    }
  }
}

echo 'OK';