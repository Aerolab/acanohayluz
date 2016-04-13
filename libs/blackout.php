<?php


function actualizar_puntaje_reportes( &$reportes ) {

  $horas = 24;
  $reportes_luz = array();
  foreach( $reportes as &$reporte ) {
    if( $reporte->estado == 'hay-luz' ){
      $reportes_luz[] = &$reporte;
    }
  }

  $puntajes = array('corte-cuadra' => 0, 'corte-amplio' => 0);

  foreach( $reportes as &$reporte ) {

    if( ! isset($puntajes[$reporte->estado]) or $reporte->estado == 'hay-luz' ){ continue; }

    // Los reportes están atenuados por gravedad y antigüedad
    // Cada 2 horas de corte se suma un punto
    // Se atenúan linealmente por la antigüedad del reporte

    // Adicional: Si hay un reporte de que la luz volvió (posterior al reporte de corte), afecta todos los puntos cercanos
    $score_volvio_luz = 0;
    foreach( $reportes_luz as &$reporte_luz ) {

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

    $reporte->puntaje = (floor($reporte->horas/2) + 1) * $atenuacion;

    R::store($reporte);

  }


  // Procesa los reportes de luz
  foreach( $reportes_luz as &$reporte ) {
    if( $reporte->estado !== 'hay-luz' ){ continue; }


    $score_no_hay_luz = 0;
    foreach( $reportes as &$reporte_corte ) {
      if( ! isset($puntajes[$reporte->estado]) or $reporte->estado == 'hay-luz' ){ continue; }
      if( $reporte_corte->fecha < $reporte->fecha ) { continue; }

      $distancia = $reporte->distancia_a_reporte( $reporte_corte );

      // Distancia de 50m se considera resuelto
      // Por encima de eso se atenúa linealmente hasta 500m
      if( $distancia <= 50.0 ) {
        $score_no_hay_luz += 1;
      }
      elseif( $distancia <= 500.0 ) {
        $score_no_hay_luz += 1 - (($distancia - 50.0) / (500.0 - 50.0));
      }
    }

    $reporte->puntaje = ($score_no_hay_luz >= 1.0) ? 0.0 : (1.0-$score_no_hay_luz);


    R::store($reporte);
  }

}
