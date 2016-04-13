
function setup_selector_zona() {

  $('#ubicacion .seleccionada').click(function(event){
    event.preventDefault();
    $('#ubicacion').toggleClass('open');
  });

  $('#ubicacion ul.opciones').html('');
  var html = '';

  for( var ix in ZONAS_SELECCIONABLES ) {
    html += '<li data-slug="'+ZONAS_SELECCIONABLES[ix].slug+'">'+ ZONAS_SELECCIONABLES[ix].nombre +'</li>';
  }
  $('#ubicacion ul.opciones').html(html);

  $('#ubicacion ul.opciones li').click(function(event){
    event.preventDefault();

    var zona = ZONAS_SELECCIONABLES[ $(this).data('slug') ];

    $('#ubicacion .seleccionada').text( zona.nombre );
    $('#ubicacion').removeClass('open');

    var bounds = new google.maps.LatLngBounds();
    bounds.extend( new google.maps.LatLng(zona.bounds.sw[1], zona.bounds.sw[0]) );
    bounds.extend( new google.maps.LatLng(zona.bounds.ne[1], zona.bounds.ne[0]) );

    map.fitBounds( bounds );

    ga('send', 'event', 'actividad', 'ver_zona', zona.nombre);
  });

  $('#ubicacion ul.opciones li:first-child').trigger('click');

  $('#ubicacion').show();
}


function setup_form() {

  $('#direccion .ubicacion .cerrar').click(function(event){
    event.preventDefault();
    $('#direccion input').val('').focus();
    $('#direccion').removeClass('found');

    $('#reportar input[name=direccion_completa]').val('');
    $('#reportar input[name=direccion_id]').val('');
    $('#reportar input[name=zona_nombre]').val('');
    $('#reportar input[name=lat]').val('');
    $('#reportar input[name=long]').val('');
    $('#reportar input[name=zona_id]').val('');
  });

  $('#reportar form').submit(function(event){
    event.preventDefault();
    return false;
  });

  // Esto es para IE8
  if( $('html').hasClass('shitty-browser') ) {
    $('#reportar label.estado-luz').click(function(event){
      event.preventDefault();
      $("#"+$(this).attr("for")).click().change();
    });
  }

  $('#reportar input[type=radio]').change(function(event){
    $('#reportar input[type=radio]').each(function(){
      if( $(this).is(':checked') ) {
        $(this).parent().addClass('active');
      } else {
        $(this).parent().removeClass('active');
      }
    });
  }).trigger('change');


  $('#reportar input, #reportar select, #reportar textarea').bind('change keyup', function(event){
    validar_form();
  });


  $('#reportar button').click(function(event){

    event.preventDefault();

    validar_form();

    if( ! $(this).hasClass('disabled') ) {

      $('#reportar form').hide();
      $('#reportar .box-gracias').show();

      $.post('/ajax.php?m=nuevo',
        $('#reportar form').serialize(),
        function(data, textStatus){

        // Guardado optimista.
        // Como callback sólo cambia los botones de share para personalizarlos (la zona se devuelve server side)
        if( data['zona']['id'] !== null && parseInt(data['zona']['id']) > 0 ) {
          nombre_zona = data['zona']['nombre'];
        }
        else {
          var nombre_zona = 'casa';
        }

        var estado = $('#reportar input[name=estado]:checked').val();

        if( estado == 'hay-luz' ) {
          $('.box-social .facebook').attr('href', 'http://www.facebook.com/sharer/sharer.php?s=100&p[url]=http://acanohayluz.com.ar&p[images][0]=http://acanohayluz.com.ar/static/icons/facebook-share.png&p[title]=Volvió la luz en '+nombre_zona+'!&p[summary]=Mirá dónde más volvió en http://acanohayluz.com.ar %23AcaNoHayLuz');
          $('.box-social .twitter').attr('href', 'https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Facanohayluz.com.ar%2F&text=Volvió la luz en '+nombre_zona+'! Mirá dónde más volvió en http://acanohayluz.com.ar %23AcaNoHayLuz');
        }
        else {
          $('.box-social .facebook').attr('href', 'http://www.facebook.com/sharer/sharer.php?s=100&p[url]=http://acanohayluz.com.ar&p[images][0]=http://acanohayluz.com.ar/static/icons/facebook-share.png&p[title]=Estoy en '+nombre_zona+' y %23AcaNoHayLuz&p[summary]=Mirá dónde más no hay en http://acanohayluz.com.ar');
          $('.box-social .twitter').attr('href', 'https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Facanohayluz.com.ar%2F&text=Estoy en '+nombre_zona+' y %23AcaNoHayLuz. Mirá dónde más se cortó la luz en http://acanohayluz.com.ar');
        }

      }, 'json');

      // Mete una cookie recordando que el usuario ya envió las cosas por 24hs
      var hoy = new Date();
      var cookie_options = { expiresAt: (new Date()).setDate(hoy.getDate()+1) };
      cookies.set('fecha_enviado', new Date() * 1, cookie_options);
      cookies.set('estado_enviado', $('#reportar input[name=estado]:checked').val(), cookie_options);
      cookies.set('lat_enviado', $('#reportar input[name=lat]').val(), cookie_options);
      cookies.set('long_enviado', $('#reportar input[name=long]').val(), cookie_options);

      ga('send', 'event', 'actividad', 'reporte', {'zona': nombre_zona, 'estado': estado});
    }

  });

  // Buscar la direccion usando GPS
  $('#reportar .buscar-location').on('click', function (e){
    e.preventDefault();
    $('#reportar .buscar-location').addClass('buscando');
    getLocation();
  });
}



function validar_form() {

  var errores = false;

  if( $('#reportar input[name=direccion_completa]').val() == '' ) { errores = true; }

  if( $('#reportar input[name=estado]:checked').val() == 'hay-luz' ) {
    $('#reportar .adicional.horas').hide();
  }
  else {
    $('#reportar .adicional.horas').show();
    if( ! (parseInt($('#reportar input[name=horas]').val()) >= 0) ){ errores = true; }
  }

  // Actualiza el marker del reporte
  var tipo_corte = $('#reportar input[name=estado]:checked').val();

  if( typeof sugerenciaMarker != 'undefined' ) {
    sugerenciaMarker.setIcon({
      url: STATIC_URL+'css/images/reporte-'+tipo_corte+'.png',
      animation: google.maps.Animation.DROP,
      scaledSize: new google.maps.Size(35, 53),
      anchor: new google.maps.Point(18, 53),
      origin: new google.maps.Point(0,0),
      size: new google.maps.Size(35, 53)
    });
  }


  // Pone la clase y textos correctos al submit
  $('#reportar button').attr('class', 'btn');
  if( ! errores ) {
    $('#reportar button').addClass( tipo_corte );

    switch( tipo_corte ) {
      case 'hay-luz':
        $('#reportar button').text('Avisar que Hay Luz');
        break;
      case 'corte-cuadra':
        $('#reportar button').text('Denunciar Corte de Luz');
        break;
      case 'corte-amplio':
        $('#reportar button').text('Denunciar Apagón');
        break;
    }
  }
  else {
    $('#reportar button').addClass('disabled').text('Completa el formulario');
  }
}


/* Autocomplete *******************************************************************************************************/

function setup_autocomplete() {

  if( typeof autocomplete != 'undefined' ){ return; }

  // Init Autocomplete
  autocomplete = new google.maps.places.Autocomplete(
    $("#direccion input[name=direccion]")[0],
    {types: ['geocode']}
  );
  autocomplete.setComponentRestrictions( {'country': 'ar'} )


  $("#direccion input[name=direccion]").blur(function(event){
    // getPlace() tiene un pequeño lag para obtener la dirección
    setTimeout(function(){
      if( $('#reportar input[name=direccion_completa]').val() == '' ) {
        $('#direccion .error').text('Por favor, elegí una dirección.').show();
      }
      else {
        $('#direccion .error').hide();
      }
    }, 300)
  });

  // Selecciona el lugar del dropdown
  google.maps.event.addListener(autocomplete, 'place_changed', function() {

    if( typeof sugerenciaMarker != 'undefined' ) {
      sugerenciaMarker.setVisible(false);
    }

    var place = autocomplete.getPlace();
    if (typeof place == 'undefined' || !place.geometry) {
      return;
    }

    seleccionarDireccion(place);
  });

  if (is_mobile()) {
    $('#reportar .buscar-location').show();
  }
}

function mostrar_error(mensaje) {
  $('#direccion .error').text(mensaje).show();
  setTimeout(function(){
    $('#direccion .error').hide();
  }, 3000);
}

