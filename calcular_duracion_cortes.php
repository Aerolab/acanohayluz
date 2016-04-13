<?php
require_once('libs/connect.php');


function buscar_reportes_bounds($bounds, $fecha_desde, $fecha_hasta, $estados=array('hay-luz', 'corte-cuadra', 'corte-amplio') ) {
  $reportes  = R::find('reporte', '`lat` <= :ne_lat AND `lat` >= :sw_lat AND
                                   `long` <= :ne_long AND `long` >= :sw_long AND
                                   fruta = 0 AND anulado = 0 AND fecha >= :fecha_desde AND fecha <= :fecha_hasta
                                   AND zona_id IS NOT NULL
                                   AND estado IN("'.implode('","', $estados).'") ',
                                    array(
                                      ':sw_long' => $bounds['sw'][0],
                                      ':sw_lat' => $bounds['sw'][1],
                                      ':ne_long' => $bounds['ne'][0],
                                      ':ne_lat' => $bounds['ne'][1],
                                      ':fecha_desde' => $fecha_desde,
                                      ':fecha_hasta' => $fecha_hasta,
                                    ));

  return $reportes;
}


$reportes_corte = R::findAll('reporte', ' estado = "hay-luz" ');

foreach( $reportes_corte as &$reporte ) {
  $reportes_corte->fecha_inicio = date('Y-m-d H:i:s', strtotime($reportes_corte->fecha_inicio) - $reportes_corte->horas*60*60);

  // Si es un corte amplio, busca consenso en la zona
  if( $reporte->estado == 'corte-amplio' ) {
    $reportes_similares = buscar_reportes_bounds( $reporte->get_area_cercana(100),
                                                  $reporte->fecha_inicio,
                                                  date('Y-m-d H:i:s', strtotime($reporte->fecha)+24*60*60),
                                                  array('corte-amplio') );


  }
  else {

  }
}


foreach( $reportes_corte as $reporte ) {

  // Los reportes están atenuados por gravedad y antigüedad
  // Cada 2 horas de corte se suma un punto
  // Se atenúan linealmente por la antigüedad del reporte

  // Adicional: Si hay un reporte de que la luz volvió (posterior al reporte de corte), afecta todos los puntos cercanos
  $score_volvio_luz = 0;
  foreach( $reportes_luz as $reporte_luz ) {

    // Los reportes de twitter se marcan como resueltos si hay un reporte de luz posterior (ya que no tienen ubicación precisa)
    // Los reportes de luz sin coordenadas no se toman en cuenta
    if( $reporte_luz->sin_coordenadas() ){ continue; }
    if( $reporte_luz->fecha < $reporte->fecha ) { continue; }

    if( $reporte->sin_coordenadas() ) {
      $score_volvio_luz += 1;
    }
    else {
      $distancia = $reporte->distancia_a_reporte( $reporte_luz );

      // Distancia de 100m se considera resuelto
      // Por encima de eso se atenúa linealmente hasta 500m
      if( $distancia <= 100.0 ) {
        $score_volvio_luz += 1;
      }
      elseif( $distancia <= 500.0 ) {
        $score_volvio_luz += 1 - (($distancia - 100.0) / (500.0 - 100.0));
      }
    }
  }

  $duracion = time() - strtotime($reporte->fecha);
  $maximo = $horas * 60 * 60;
  $atenuacion_por_resuelto = 0.1;

  $atenuacion = ($maximo - $duracion) / $maximo;
  if($score_volvio_luz > 1.0) {
    $atenuacion *= $atenuacion_por_resuelto;
  } else {
    $atenuacion *= (1 - $score_volvio_luz) * (1-$atenuacion_por_resuelto) + $atenuacion_por_resuelto;
  }

  $puntajes[$reporte->estado] += (floor($reporte->horas/2) + 1) * $atenuacion;
}
