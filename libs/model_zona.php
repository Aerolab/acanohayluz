<?php


class Model_Zona extends RedBean_SimpleModel {


  /**
   * Ineficientísimo
   */
  public function contiene_punto( $lat, $long ) {

    if( $long < $this->bound_sw_long or $long > $this->bound_ne_long or
        $lat < $this->bound_sw_lat or $lat > $this->bound_ne_lat ){ return FALSE; }

    $mapa = imagecreatefrompng( dirname(__FILE__).'/../static/zonas/'. $this->id .'.png' );

    $size_x = imagesx($mapa);
    $size_y = imagesy($mapa);

    $scale_x = $this->bound_ne_long - $this->bound_sw_long;
    $scale_y = $this->bound_ne_lat - $this->bound_sw_lat;

    // Arma los puntos *en píxeles*
    $x = round(($long - $this->bound_sw_long) / $scale_x * $size_x);
    $y = round(($this->bound_ne_lat - $lat) / $scale_y * $size_y);

    if( imagecolorat($mapa, $x, $y) <= 1 ){ return TRUE; }
    else{ return FALSE; }
  }


  public function get_estado($coeficiente = NULL) {
    $limites_estado = array(
      'apagonazo' => array('min' => 0.0, 'max' => 0.2 ),
      'apagon' => array('min' => 0.2, 'max' => 0.6 ),
      'cortes' => array('min' => 0.6, 'max' => 0.9 ),
      'inconvenientes' => array('min' => 0.9, 'max' => 0.99 ),
      'luz' => array('min' => 0.99, 'max' => 1.0 )
    );

    $coeficiente = is_null($coeficiente) ? $this->estado : $coeficiente;
    $estado_key = 'luz';
    foreach( $limites_estado as $key => $limites ) {
      if( $coeficiente >= $limites['min'] and $coeficiente < $limites['max'] ) {
        $estado_key = $key;
        break;
      }
    }

    return $estado_key;
  }


  public function get_nombre_estado($estado = NULL) {

    $estado = $estado == NULL ? $this->get_estado() : $estado;

    if( $estado == 'apagonazo' ) {
      return 'Apagonazos';
    } else if( $estado == 'apagon' ) {
      return 'Apagones';
    } else if( $estado == 'cortes' ) {
      return 'Cortes Aislados';
    } else if( $estado == 'inconvenientes' ) {
      return 'Algunos Cortes';
    } else {
      return 'Hay Luz';
    }
  }


  public function sin_coordenadas() {
    return (! $this->lat or ! $this->long);
  }


  function get_bounds() {

    // Devuelve los cacheados si los hay
    if( $this->bound_sw_long and $this->bound_sw_lat and $this->bound_ne_long and $this->bound_ne_lat ) {
      return array( 'sw' => array((float) $this->bound_sw_long, (float) $this->bound_sw_lat),
                    'ne' => array((float) $this->bound_ne_long, (float) $this->bound_ne_lat) );
    }

    $poligono = json_decode($this->poligono, TRUE);
    $poligono = $poligono[0];
    $sw = array( $poligono[0][0], $poligono[0][1] );
    $ne = array( $poligono[0][0], $poligono[0][1] );

    foreach( $poligono as $punto ) {
      $sw[0] = (float) ($punto[0] < $sw[0] ? $punto[0] : $sw[0]);
      $sw[1] = (float) ($punto[1] < $sw[1] ? $punto[1] : $sw[1]);
      $ne[0] = (float) ($punto[0] > $ne[0] ? $punto[0] : $ne[0]);
      $ne[1] = (float) ($punto[1] > $ne[1] ? $punto[1] : $ne[1]);
    }

    return array( 'sw' => $sw, 'ne' => $ne );
  }


  function get_extended_bounds() {
    $bounds = $this->get_bounds();
    $bounds['sw'][0] -= 0.005;
    $bounds['sw'][1] += 0.005;
    $bounds['ne'][0] += 0.005;
    $bounds['ne'][1] -= 0.005;

    return $bounds;
  }


  public function get_reportes() {

    if( ! $this->id ){ return array(); }

    $reportes = R::find('reporte', ' zona_id = :zona_id AND
                                     fruta = 0 AND anulado = 0 AND fecha >= :fecha ',
                                    array(
                                      ':zona_id' => $this->id,
                                      ':fecha' => date('Y-m-d H:i:s', time()-60*60*24)
                                    ));

    return $reportes;
  }



  public function distancia_a_reporte( $reporte ) {

    $latitudeFrom = $this->lat;
    $longitudeFrom = $this->long;
    $latitudeTo = $reporte->lat;
    $longitudeTo = $reporte->long;
    $earthRadius = 6371000;

    // convert from degrees to radians
    $latFrom = deg2rad($latitudeFrom);
    $lonFrom = deg2rad($longitudeFrom);
    $latTo = deg2rad($latitudeTo);
    $lonTo = deg2rad($longitudeTo);

    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;

    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
        cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    return $angle * $earthRadius;
  }


  public function recalcular_estado( $verbose = FALSE ) {

    if( ! $this->id ){ return; }

    $estado_original = $this->get_estado();

    // Obtiene todos los reportes de las últimas horas y obtiene una idea general del estado de la zona
    $horas = 24;
    $reportes = R::find('reporte', ' zona_id = ? AND fecha >= ? AND fruta = 0 ORDER BY id DESC LIMIT 100 ',
                                    array($this->id, date('Y-m-d H:i:s', time()-60*60*$horas)));

    $reportes_luz = array();
    foreach( $reportes as $reporte ) {
      if( $reporte->estado == 'hay-luz' ){
        $reportes_luz[] = $reporte;
      }
    }

    $puntajes = array('corte-cuadra' => 0, 'corte-amplio' => 0);
    foreach( $reportes as $reporte ) {
      if( ! isset($puntajes[$reporte->estado]) or $reporte->estado == 'hay-luz' ){ continue; }

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

    // El score es el porcentaje de votos negativos, levemente atenuado con un mínimo de votos.
    $score_negativo = $puntajes['corte-cuadra'] + $puntajes['corte-amplio'] * 4;

    // Esto es para tomar en cuenta cuántos reportes hacen falta
    $atenuacion = 150;

    $this->estado = 1 - ($score_negativo / ($score_negativo + $atenuacion));

    if( $this->get_estado() != $estado_original ) {
      $this->actualizar_dependencias();
    }
    
    $this->fecha_update_estado = date('Y-m-d H:i:s');

    R::store($this->bean);
  }


  public function actualizar_dependencias() {

    $bounds = $this->get_bounds();
    // Flaguea los tiles donde aparece la zona como modificados
    $tiles_afectados = R::find('tile', ' (bound_ne_long >= :sw_long AND bound_sw_long <= :ne_long) AND
                                         (bound_ne_lat >= :sw_lat AND bound_sw_lat <= :ne_lat)',
                                        array(
                                          ':sw_long' => $bounds['sw'][0],
                                          ':sw_lat' => $bounds['sw'][1],
                                          ':ne_long' => $bounds['ne'][0],
                                          ':ne_lat' => $bounds['ne'][1]
                                        ));

    foreach( $tiles_afectados as $tile ) {
      $tile->actualizar = 1;
      R::store($tile);
    }
  }


}
