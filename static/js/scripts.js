

function mobile_setup() {
  // Oculta la nav en iOS y demases
  setTimeout( function(){ window.scrollTo(0, 1); }, 1000 );

  // Inicializa el Autocomplete, SIN EL MAPA (Se cuelga todo sino)
  setup_autocomplete();

  // Inicializa el Form
  setup_form();

  // Pone la UI en mobile (Mapa Separado)
  setup_mobile_ui();
}


function desktop_setup() {
  // Inicializa el Autocomplete
  setup_autocomplete();

  // Inicializa el Form
  setup_form();

  // Inicializa el Mapa
  init_mapa();
}


function setup_mobile_ui() {

  $('#navegacion .boton-mapa').bind('touchstart click', function(event){
    event.preventDefault();
    cambiar_seccion('mapa');
  });
  $('#navegacion .boton-reportar').bind('touchstart click', function(event){
    event.preventDefault();
    cambiar_seccion('reportar');
  });


  function cambiar_seccion(seccion) {
    if( $('#container').hasClass(seccion) ){ return; }

    // Muestra / Oculta los paneles
    $('#container').attr('class', '').addClass(seccion);

    if( seccion == 'mapa' ) {
      $('#navegacion .boton-mapa').hide();
      $('#navegacion .boton-reportar').show();

      setTimeout(function(){
        init_mapa();
      }, 500);
    }
    else {
      $('#navegacion .boton-reportar').hide();
      $('#navegacion .boton-mapa').show();
    }
  }

  $(window).resize(function(){
    $('#mapa').height( $(window).height()-83 );
  }).trigger('resize');

}



$(document).ready(function(){

  // Si es IE8, le vuela el form y lo reemplaza con un aviso de que use un browser
  if( $('html').hasClass('shitty-browser') ) {
    $('#reportar').hide();
    $('body').append('<div id="aviso-shitty-browser">Tu navegador está <strong>desactualizado</strong>. Tiene más de 5 años, es lento y te causa problemas con la mayor parte de la web. <br/><br/>Tomate 2 minutos para poner Google Chrome, <strong>el mejor navegador gratuito</strong>: <strong><a href="https://www.google.com/intl/es/chrome/browser/?hl=es" target="_blank">Actualizate a Google Chrome</a></strong></div>')
  }

  if( is_mobile() ) {
    mobile_setup();
  }
  else {
    desktop_setup();
  }
});

