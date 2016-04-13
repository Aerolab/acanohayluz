<?php
require_once('map.php');


class Model_Reporte extends RedBean_SimpleModel {

  public function update() {
    $this->actualizar_dependencias();
  }


  public function actualizar_dependencias() {

    if( $this->fruta or $this->anulado or ! $this->lat or ! $this->long ){ return; }

    // Recalcula el estado de la zona
    if( ! $this->zona_id ) {
      $this->obtener_zona();

      if( $this->zona ) {
        $this->zona->recalcular_estado();
      }
    }

    // Flaguea los tiles donde aparece el reporte como modificados
    // (deja un pequeño margen para dibujar bien el área afectada)
    $tiles_afectados = R::find('tile',' bound_sw_long-0.005 <= :long AND bound_ne_long+0.005 >= :long AND
                                        bound_sw_lat-0.005 <= :lat AND bound_ne_lat+0.005 >= :lat
                                        AND z >= 13 ',
                                        array(':lat' => $this->lat, ':long' => $this->long ));

    foreach( $tiles_afectados as $tile ) {
      $tile->actualizar = 1;
      $tile->actualizar_reportes = 1;
      R::store($tile);
    }
  }


  /**
   * Busca la zona a la que pertenece el reporte
   */
  public function obtener_zona() {

    if( ! $this->lat or ! $this->long ){ return; }

    // Busca las zonas tentativas por bounds,
    // y luego refina por polígono (que es un hack horrible)
    $zonas_tentativas = R::find('zona', ' bound_sw_long <= :long AND bound_ne_long >= :long AND
                                          bound_sw_lat <= :lat AND bound_ne_lat >= :lat ',
                                          array(':lat' => $this->lat, ':long' => $this->long ));

    foreach( $zonas_tentativas as &$zona ) {
      if( $zona->contiene_punto($this->lat, $this->long) ) {
        $this->zona_id = $zona->id;
        break;
      }
    }
  }


  /**
   * Obtiene bounds para el área alrededor del reporte en metros
   */
  public function get_area_cercana( $radio_metros ) {
    $radio_tierra = 6378*1000;
    $new_latitude  = $this->lat  + ($radio_metros / $radio_tierra) * (180 / pi());
    $new_longitude = $this->long + ($radio_metros / $radio_tierra) * (180 / pi()) / cos($this->lat * 180/pi());

    return array(
      'sw' => array(  $this->long - ($radio_metros / $radio_tierra) * (180 / pi()) / cos($this->lat * 180/pi()),
                      $this->lat - ($radio_metros / $radio_tierra) * (180 / pi()) ),
      'ne' => array(  $this->long + ($radio_metros / $radio_tierra) * (180 / pi()) / cos($this->lat * 180/pi()),
                      $this->lat + ($radio_metros / $radio_tierra) * (180 / pi()) )
    );
  }

}
