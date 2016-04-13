/* Mapa ***************************************************************************************************************/


function init_mapa() {

  if( typeof map != 'undefined' ){ return; }

  $('#mapa').attr('class', '').addClass('barrios-no-visibles');

  var mapOptions = {
    center: new google.maps.LatLng(-34.6033, -58.4317),
    zoom: 13,
    minZoom: MAP_MIN_ZOOM,
    maxZoom: MAP_MAX_ZOOM,
    mapTypeId: google.maps.MapTypeId.ROADMAP,

    mapTypeControl: false,
    panControl: (typeof mapaPanControl == 'undefined' || ! mapaPanControl) ? false : true,
    panControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE,
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    scaleControl: true,
    scaleControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    streetViewControl: false
  };

  // Simplifica el mapa (Sin POIs molestos)
  var styledMap = new google.maps.StyledMapType([
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
  ], {name: "AcaNoHayLuzMap"});

  map = new google.maps.Map(document.getElementById("mapa"), mapOptions);
  map.mapTypes.set('map_style_simple', styledMap);
  map.setMapTypeId('map_style_simple');

  setup_selector_zona();

  sugerenciaMarker = new google.maps.Marker({
    map: map,
    zIndex: 9999
  });
  sugerenciaMarker.setVisible(false);

  google.maps.event.addListener(map,'bounds_changed', function(){
    if( map.zoom >= 13 ) {
      $('#mapa').attr('class', '').addClass('barrios-visibles').addClass('zoom-'+map.zoom);
    } else {
      $('#mapa').attr('class', '').addClass('barrios-no-visibles');
    }
  });

  // Crea el tooltip principal de los reportes
  markerTooltip = new google.maps.InfoWindow({
    content: '',
    pixelOffset: new google.maps.Size(-10, 0)
  });

  // Los markers tienen distintos behaviors en mobile
  var mobile = is_mobile();
  google.maps.event.addListener(map,'bounds_changed', function(){

    if( map.zoom < MIN_ZOOM_MARKERS ) {
      hide_markers();
    }
    else {
      show_markers();
    }

    clearTimeout(markers_timeout);
    markers_timeout = setTimeout(function(){
      update_markers( mobile );
    }, mobile ? 600 : 300);
  });

  dibujar_zonas();
}

function seleccionarDireccion(place) {
  $('#direccion').addClass('found');
  $('#direccion .ubicacion .lugar').html( place.adr_address );

  $('#reportar input[name=direccion_completa]').val( place.formatted_address );

  // Obtiene el barrio o la localidad en su defecto
  for( var i in place.address_components ) {
    if( $.inArray('neighborhood', place.address_components[i].types) >= 0 ) {
      $('#reportar input[name=zona_nombre]').val( place.address_components[i].long_name );
      break;
    }
    else if( $.inArray('locality', place.address_components[i].types) >= 0 ) {
      $('#reportar input[name=zona_nombre]').val( place.address_components[i].long_name );
      break;
    }
  }

  $('#reportar input[name=direccion_id]').val( place.id );
  $('#reportar input[name=lat]').val( place.geometry.location.lat() );
  $('#reportar input[name=long]').val( place.geometry.location.lng() );

  $('#reportar .suministro input').focus();

  validar_form();

  $('#reportar .buscar-location').removeClass('buscando');

  map.setZoom( 17 );
  map.panTo( place.geometry.location );

  sugerenciaMarker.setPosition( place.geometry.location );
  sugerenciaMarker.setVisible(true);
}


function dibujar_zonas() {

  var last_update = Math.floor((new Date() * 1) / 1000 / 60 / 5);
  var MAX_TILE_LEVEL = 14;

  var imageMapZoomOut = new google.maps.ImageMapType({
    minZoom: MAP_MIN_ZOOM,
    maxZoom: MAP_MAX_ZOOM,
    getTileUrl: function(coord, zoom) {
      if( zoom > MAX_TILE_LEVEL || zoom < this.minZoom ){ return null; }
      if( typeof TILES[zoom] == 'undefined' ||
        typeof TILES[zoom][coord.x] == 'undefined' || typeof TILES[zoom][coord.x][coord.y] == 'undefined' ){ return null; }

      return [STATIC_URL, 'tiles/acanohayluz-', zoom, '-', coord.x, '-', coord.y, '.png?', TILES[zoom][coord.x][coord.y]].join('');
    },
    tileSize: new google.maps.Size(256, 256)
  });
  map.overlayMapTypes.push(imageMapZoomOut);


  for( var zoomlevel=MAX_TILE_LEVEL+1; zoomlevel <= MAP_MAX_ZOOM; zoomlevel++ ) {

    var tileMultiplier = Math.pow(2, (zoomlevel - MAX_TILE_LEVEL));
    var tileSize = 256 * tileMultiplier;

    var imageMapZoomIn = new google.maps.ImageMapType({
      minZoom: zoomlevel,
      maxZoom: zoomlevel,
      getTileUrl: function(coord, zoom) {
        if( zoom != this.minZoom ){ return null; }
        if( typeof TILES[MAX_TILE_LEVEL] == 'undefined' ||
          typeof TILES[MAX_TILE_LEVEL][coord.x] == 'undefined' || typeof TILES[MAX_TILE_LEVEL][coord.x][coord.y] == 'undefined' ){ return null; }

        return [STATIC_URL, 'tiles/acanohayluz-', MAX_TILE_LEVEL, '-', coord.x, '-', coord.y, '.png?', TILES[MAX_TILE_LEVEL][coord.x][coord.y]].join('');
      },
      tileSize: new google.maps.Size(tileSize, tileSize)
    });

    map.overlayMapTypes.push(imageMapZoomIn);
  }

  // Crea los labels de las zonas
  for( var ix in ZONAS ) {
    ZONAS[ix].overlay = new NombreBarrioOverlay(map, ZONAS[ix]);
  }
}

var markers_timeout = null;
// Esto se usa para evitar iterar por todos los markers en cada fucking zoom o pan.
var markers_visible = false;

function hide_markers() {
  if( ! markers_visible ){ return; }
  markers_visible = false;
  for( var tile in markers ) {
    for( var i in markers[tile] ) {
      if( typeof markers[tile][i]._marker == 'object' ) {
        markers[tile][i]._marker.setVisible(false);
      }
    }
  }
}
function show_markers() {
  if( markers_visible ){ return; }
  markers_visible = true;

  for( var tile in markers ) {
    for( var i in markers[tile] ) {
      if( typeof markers[tile][i]._marker == 'object' ) {
        markers[tile][i]._marker.setVisible(true);
      }
    }
  }
}

function update_markers( mobile ) {

  if( map.zoom < MIN_ZOOM_MARKERS ) {
    return;
  }

  // Los markers se actualizan por tiles de nivel 13 visibles
  // Están cacheados en archivos JS (usando JSONP) que permiten descargar los pines por tiles
  var z = 13;

  var tiles_visibles = get_tiles_visibles( z );

  for( var ix in tiles_visibles ) {

    var tile_name = tiles_visibles[ix].z+'_'+tiles_visibles[ix].x+'_'+tiles_visibles[ix].y;

    // Si el tile no existe, skippea
    if( typeof TILES[tiles_visibles[ix].z][tiles_visibles[ix].x][tiles_visibles[ix].y] == 'undefined' ){ continue; }

    // Si ya está cargado, skippea
    if( typeof markers[tile_name] != 'undefined' ){ continue; }

    // Crea una JSONP Request para este set de reportes
    var callback = 'acanohayluz_cache_reportes_'+tiles_visibles[ix].z+'_'+tiles_visibles[ix].x+'_'+tiles_visibles[ix].y;

    // Si está esperando, también skippea
    var script_original = document.getElementById(callback);
    if( script_original != null ) { continue; }

    // Crea el script para hacer la request
    var script = document.createElement("script");
    script.id = callback;
    script.setAttribute("charset", "utf-8");
    script.setAttribute("async", "true");

    if( mobile ) {
      script.setAttribute("src", STATIC_URL+"reportes/reportes-"+tiles_visibles[ix].z+'-'+tiles_visibles[ix].x+'-'+tiles_visibles[ix].y+'-light.js?'+session_timestamp);
    } else {
      script.setAttribute("src", STATIC_URL+"reportes/reportes-"+tiles_visibles[ix].z+'-'+tiles_visibles[ix].x+'-'+tiles_visibles[ix].y+'.js?'+session_timestamp);
    }
    document.body.appendChild(script);

  }

}


function acanohayluz_cache_reportes( tile_name, new_markers ) {

  // Carga los markers en el caché local
  if( typeof markers[tile_name] == 'undefined' ){
    markers[tile_name] = new_markers;
    mostrar_markers(tile_name);
  }

}


var last_marker_gc_pass = 0;
function garbage_collector_markers() {
  var z = 13;

  // Algunos IE suelen meter varios Intervals juntos bajo tab switching. Esto evita bobadas.
  var this_gc_pass = (new Date()*1) / 1000 / 5;
  if( last_marker_gc_pass == this_gc_pass ){ return; }
  last_marker_gc_pass = this_gc_pass;

  // Obtiene los tiles visibles y cacheados. Procede a eliminar los innecesarios
  var tiles_visibles_full = get_tiles_visibles( z );
  var tiles_visibles = [];
  for( var i in tiles_visibles_full ) { tiles_visibles.push( tiles_visibles_full[i].z+'_'+tiles_visibles_full[i].x+'_'+tiles_visibles_full[i].y ); }

  var tiles_cacheados = [];
  for( var i in markers ) { tiles_cacheados.push(i); }

  if( tiles_cacheados.length > tiles_visibles.length*2 ){

    // Todo: Eliminarlos por distancia al área visible

    var candidatos_eliminacion = {};
    for( var i in tiles_cacheados ) {
      if( ! $.inArray(tiles_cacheados[i], tiles_visibles) ) {
        candidatos_eliminacion[ tiles_cacheados[i] ];
      }
    }

    var num_eliminar = tiles_cacheados.length - tiles_visibles.length*2;

    for( var i in candidatos_eliminacion ) {

      if( typeof markers[candidatos_eliminacion[i]] == 'undefined' ){ continue; }
      for( var m in markers[candidatos_eliminacion[i]] ) {
        if( typeof markers[candidatos_eliminacion[i]][m]._marker != 'undefined' ) {
          markers[candidatos_eliminacion[i]][m]._marker.setMap(null);
        }
      }

      delete markers[candidatos_eliminacion[i]];
      num_eliminar--;

      if( num_eliminar <= 0 ){ break; }
    }
  }
}

setInterval(function(){
  garbage_collector_markers();
}, 6000);



function mostrar_markers( tile_name ) {

  if( typeof markers[tile_name] == 'undefined' ){ return; }

  // Si se generan los 500 puntos juntos hay un lag importante (freezea 30-60 frames en un desktop decente),
  // Por ende, divide los markers en chunks espaciados para no saturar tanto el CPU
  var chunk_size = 5;
  var num_markers = markers[tile_name].length;
  var num_chunks = Math.ceil( num_markers / chunk_size );
  var current_offset = 0;

  for( var chunk=0; chunk<num_chunks; chunk++ ) {

    // Se hace un chunk cada 2 frames
    setTimeout("mostrar_chunk_markers('"+tile_name+"', "+chunk+", "+chunk_size+");", (1/60) *2 * chunk);
  }
}

function mostrar_chunk_markers(tile_name, chunk, chunk_size) {

  // Va haciendo el setup de cada marker en el mapa para este chunk en particular
  for( var ix=chunk*chunk_size; ix<(chunk+1)*chunk_size; ix++ ) {

    if( typeof markers[tile_name][ix] == 'undefined' ){ break; }
    if( typeof markers[tile_name][ix]._marker != 'undefined' ){ continue; }

    markers[tile_name][ix]._marker = new google.maps.Marker({
      position: (new google.maps.LatLng(markers[tile_name][ix]['lat'], markers[tile_name][ix]['long'])),
      map: map,
      visible: (map.zoom >= MIN_ZOOM_MARKERS) ? true : false,
      icon: {
        url: STATIC_URL+'css/images/reporte-'+markers[tile_name][ix]['estado']+'.png',
        animation: google.maps.Animation.DROP,
        size: new google.maps.Size(35, 53),
        scaledSize: new google.maps.Size(18, 27),
        anchor: new google.maps.Point(9, 27),
        origin: new google.maps.Point(0,0)
      }
    });

    markers[tile_name][ix]._marker.reporte_ = markers[tile_name][ix];

    google.maps.event.addListener(markers[tile_name][ix]._marker, 'click', function() {
      mostrar_tooltip_reporte( this );
    });

  }

}


function mostrar_tooltip_reporte( marker ) {

  var content = '';

  // Esto debería andar de otra forma, pero hay una issue con algunos browsers y Date() poniendo una string en ISO
  var fecha = new Date( parseInt(marker.reporte_.fecha.slice(0,4).ltrim('0')),
                        parseInt(marker.reporte_.fecha.slice(5,7).ltrim('0')) - 1,
                        parseInt(marker.reporte_.fecha.slice(8,10).ltrim('0')),
                        parseInt(marker.reporte_.fecha.slice(11,13).ltrim('0')),
                        parseInt(marker.reporte_.fecha.slice(14,16).ltrim('0')),
                        parseInt(marker.reporte_.fecha.slice(17,19).ltrim('0')) );

  var fecha_inicio = new Date( fecha.getTime() );

  if( marker.reporte_.estado == 'hay-luz' ) {
    content += '<h6 class="'+marker.reporte_.estado+'">¡Volvió la luz!</h6>';
  }
  else {
    if( marker.reporte_.estado == 'corte-amplio' ) {
      content += '<h6 class="'+marker.reporte_.estado+'">Apagón en varias cuadras</h6>';
    } else {
      content += '<h6 class="'+marker.reporte_.estado+'">Corte de luz</h6>';
    }

    // Resta la cantidad de horas sin luz reportadas
    if( typeof parseInt(marker.reporte_.horas) == 'number' ) {
      fecha_inicio.setHours( fecha.getHours() - parseInt(marker.reporte_.horas) );
    }
  }

  var num_horas = Math.round(((new Date()*1) - (fecha.getTime())) / 1000 / (60*60));
  if( num_horas > 1 ) {
    if( marker.reporte_.estado == 'hay-luz' ) {
      content += '<p>Hace '+ Math.ceil(num_horas) +' horas</p>'
    } else {
      content += '<p>Sin luz hace '+ Math.ceil(num_horas) +' horas</p>'
    }
  } else if( num_horas == 1 ) {
    if( marker.reporte_.estado == 'hay-luz' ) {
      content += '<p>Hace '+ Math.ceil(num_horas) +' hora</p>'
    } else {
      content += '<p>Sin luz hace '+ Math.ceil(num_horas) +' hora</p>'
    }
  } else {
    if( marker.reporte_.estado == 'hay-luz' ) {
      content += '<p>Hace unos minutos</p>'
    } else {
      content += '<p>Sin luz hace unos minutos</p>'
    }
  }

  content += '<small>Reportado el '+
    pad(fecha.getDate(), 2, '0', STR_PAD_LEFT) +'/'+ pad(fecha.getMonth()+1, 2, '0', STR_PAD_LEFT) +'/'+ fecha.getFullYear() +
    ' a las '+
    pad(fecha.getHours(), 2, '0', STR_PAD_LEFT) +':'+ pad(fecha.getMinutes(), 2, '0', STR_PAD_LEFT) +'</small>'

  markerTooltip.setContent( content );
  markerTooltip.open(map, marker);
}
