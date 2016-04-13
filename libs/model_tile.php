<?php

class Model_Tile extends RedBean_SimpleModel {

  public function update() {
    if( ! $this->bound_sw_long ) {
      $bounds = $this->get_bounds();
      $this->bound_sw_long = $bounds['sw'][0];
      $this->bound_sw_lat = $bounds['sw'][1];
      $this->bound_ne_long = $bounds['ne'][0];
      $this->bound_ne_lat = $bounds['ne'][1];
      $this->actualizar = 1;
    }
  }

  public function get_bounds() {

    return array(
      'sw' => array( tile2long($this->x, $this->z), tile2lat($this->y+1, $this->z) ),
      'ne' => array( tile2long($this->x+1, $this->z), tile2lat($this->y, $this->z) )
    );

  }


  /**
   * Obtiene los bounds incluyendo los tiles adyacentes
   */
  public function get_extended_bounds() {
    return array(
      'sw' => array( tile2long($this->x-1, $this->z), tile2lat($this->y+2, $this->z) ),
      'ne' => array( tile2long($this->x+2, $this->z), tile2lat($this->y-1, $this->z) )
    );
  }


  /**
   * Obtiene las zonas que figuran en este tile
   */
  public function get_zonas() {

    $bounds = $this->get_bounds();

    $zonas = R::find('zona', ' (bound_ne_long >= :sw_long AND bound_sw_long <= :ne_long) AND
                               (bound_ne_lat >= :sw_lat AND bound_sw_lat <= :ne_lat)',
                              array(
                                ':sw_long' => $bounds['sw'][0],
                                ':sw_lat' => $bounds['sw'][1],
                                ':ne_long' => $bounds['ne'][0],
                                ':ne_lat' => $bounds['ne'][1]
                              ));
    return $zonas;
  }


  /**
   * Obtiene los reportes que deberían mostrarse en este tile
   * Incluye los reportes de los tiles adyacentes para mostrar las áreas afectadas
   */
  public function get_reportes( $limit=1000, $horas=24, $proporcional=TRUE, $extended_bounds=FALSE ) {

    if( $extended_bounds ) {
      $bounds = $this->get_extended_bounds();
    } else {
      $bounds = $this->get_bounds();
    }

    // Si es proporcional, obtiene la cantidad de reportes del periódo y luego respeta esa proporción
    // para obtener los cortes de luz y vueltas de luz (sino queda sesgado a la última data)
    $cantidad_por_tipo = $this->get_num_reportes_por_tipo( $horas );
    if( $cantidad_por_tipo['_total'] == 0 ){ return array(); }

    $sets = array(
      'cortes-luz' => array(
        'estados' => array('corte-amplio', 'corte-cuadra'),
        'cantidad' => ceil(($cantidad_por_tipo['_cortes'] / $cantidad_por_tipo['_total']) * $limit)
      ),
      'hay-luz' => array(
        'estados' => array('hay-luz'),
        'cantidad' => ceil(($cantidad_por_tipo['hay-luz'] / $cantidad_por_tipo['_total']) * $limit)
      )
    );

    $reportes = array();

    foreach( $sets as $set ) {
      $reporte_luz  = R::find('reporte', ' `lat` <= :ne_lat AND `lat` >= :sw_lat AND
                                           `long` <= :ne_long AND `long` >= :sw_long AND
                                           fruta = 0 AND anulado = 0 AND fecha >= :fecha AND puntaje > 0.1
                                           AND zona_id IS NOT NULL
                                           AND estado IN("'.implode('","', $set['estados']).'")
                                           ORDER BY fecha DESC LIMIT :limit ',
                                          array(
                                            ':sw_long' => $bounds['sw'][0],
                                            ':sw_lat' => $bounds['sw'][1],
                                            ':ne_long' => $bounds['ne'][0],
                                            ':ne_lat' => $bounds['ne'][1],
                                            ':fecha' => date('Y-m-d H:i:s', time()-60*60*$horas),
                                            ':limit' => $set['cantidad']
                                          ));

      $reportes = array_merge($reportes, $reporte_luz);
    }

    return $reportes;
  }


  public function get_num_reportes_por_tipo( $horas=24 ) {

    $bounds = $this->get_bounds();

    $cantidades = R::getAll('SELECT estado, COUNT(*) AS cantidad
                             FROM reporte
                             WHERE `lat` <= :ne_lat AND `lat` >= :sw_lat AND
                                   `long` <= :ne_long AND `long` >= :sw_long AND
                                   fruta = 0 AND anulado = 0 AND fecha >= :fecha AND puntaje > 0.1
                                   AND zona_id IS NOT NULL
                             GROUP BY estado',
                            array(
                              ':sw_long' => $bounds['sw'][0],
                              ':sw_lat' => $bounds['sw'][1],
                              ':ne_long' => $bounds['ne'][0],
                              ':ne_lat' => $bounds['ne'][1],
                              ':fecha' => date('Y-m-d H:i:s', time()-60*60*$horas)
                            ));



    $tipos = array('hay-luz' => 0, 'corte-amplio' => 0, 'corte-cuadra' => 0, '_cortes' => 0, '_total' => 0);

    foreach( $cantidades as $cantidad ) {
      if( ! isset($tipos[$cantidad['estado']]) ){ continue; }
      $tipos[$cantidad['estado']] = $cantidad['cantidad'];
    }
    $tipos['_cortes'] = $tipos['corte-amplio'] + $tipos['corte-cuadra'];
    $tipos['_total'] = $tipos['corte-amplio'] + $tipos['corte-cuadra'] + $tipos['hay-luz'];

    return $tipos;
  }


}

