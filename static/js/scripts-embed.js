var mapaPanControl = false;


$(document).ready(function(){
  // Inicializa el Autocomplete
  setup_autocomplete();

  // Inicializa el Form
  setup_form();

  // Inicializa la UI
  setup_ui_embed();

  // Inicializa el Mapa
  init_mapa();
});

function setup_ui_embed() {

  $(".abrir-panel").click(function(event){
    event.preventDefault();
    $('#reportar').show();
    $('#container').addClass('reportando');
  });

  $(".header .cerrar").click(function(event){
    event.preventDefault();
    $('#container').removeClass('reportando');
    setTimeout(function(){
      if( $('#reportar').is(':visible') ) {
        $('#reportar').hide();
      }
    }, 300);
  });
}