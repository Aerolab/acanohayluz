// Cookie library
// https://code.google.com/p/cookies/

var cookies = ( function() {

  var resolveOptions, assembleOptionsString, parseCookies, constructor, defaultOptions = {
    expiresAt: null,
    path: '/',
    domain:  null,
    secure: false
  };
  /**
   * resolveOptions - receive an options object and ensure all options are present and valid, replacing with defaults where necessary
   *
   * @access private
   * @static
   * @parameter Object options - optional options to start with
   * @return Object complete and valid options object
   */
  resolveOptions = function( options )
  {
    var returnValue, expireDate;

    if( typeof options !== 'object' || options === null )
    {
      returnValue = defaultOptions;
    }
    else
    {
      returnValue = {
        expiresAt: defaultOptions.expiresAt,
        path: defaultOptions.path,
        domain: defaultOptions.domain,
        secure: defaultOptions.secure
      };

      if( typeof options.expiresAt === 'object' && options.expiresAt instanceof Date )
      {
        returnValue.expiresAt = options.expiresAt;
      }
      else if( typeof options.hoursToLive === 'number' && options.hoursToLive !== 0 )
      {
        expireDate = new Date();
        expireDate.setTime( expireDate.getTime() + ( options.hoursToLive * 60 * 60 * 1000 ) );
        returnValue.expiresAt = expireDate;
      }

      if( typeof options.path === 'string' && options.path !== '' )
      {
        returnValue.path = options.path;
      }

      if( typeof options.domain === 'string' && options.domain !== '' )
      {
        returnValue.domain = options.domain;
      }

      if( options.secure === true )
      {
        returnValue.secure = options.secure;
      }
    }

    return returnValue;
  };
  /**
   * assembleOptionsString - analyze options and assemble appropriate string for setting a cookie with those options
   *
   * @access private
   * @static
   * @parameter options OBJECT - optional options to start with
   * @return STRING - complete and valid cookie setting options
   */
  assembleOptionsString = function( options )
  {
    options = resolveOptions( options );

    return (
      ( typeof options.expiresAt === 'object' && options.expiresAt instanceof Date ? '; expires=' + options.expiresAt.toGMTString() : '' ) +
        '; path=' + options.path +
        ( typeof options.domain === 'string' ? '; domain=' + options.domain : '' ) +
        ( options.secure === true ? '; secure' : '' )
      );
  };
  /**
   * parseCookies - retrieve document.cookie string and break it into a hash with values decoded and unserialized
   *
   * @access private
   * @static
   * @return OBJECT - hash of cookies from document.cookie
   */
  parseCookies = function()
  {
    var cookies = {}, i, pair, name, value, separated = document.cookie.split( ';' ), unparsedValue;
    for( i = 0; i < separated.length; i = i + 1 )
    {
      pair = separated[i].split( '=' );
      name = pair[0].replace( /^\s*/, '' ).replace( /\s*$/, '' );

      try
      {
        value = decodeURIComponent( pair[1] );
      }
      catch( e1 )
      {
        value = pair[1];
      }

      if( typeof JSON === 'object' && JSON !== null && typeof JSON.parse === 'function' )
      {
        try
        {
          unparsedValue = value;
          value = JSON.parse( value );
        }
        catch( e2 )
        {
          value = unparsedValue;
        }
      }

      cookies[name] = value;
    }
    return cookies;
  };

  constructor = function(){};

  /**
   * get - get one, several, or all cookies
   *
   * @access public
   * @paramater Mixed cookieName - String:name of single cookie; Array:list of multiple cookie names; Void (no param):if you want all cookies
   * @return Mixed - Value of cookie as set; Null:if only one cookie is requested and is not found; Object:hash of multiple or all cookies (if multiple or all requested);
   */
  constructor.prototype.get = function( cookieName )
  {
    var returnValue, item, cookies = parseCookies();

    if( typeof cookieName === 'string' )
    {
      returnValue = ( typeof cookies[cookieName] !== 'undefined' ) ? cookies[cookieName] : null;
    }
    else if( typeof cookieName === 'object' && cookieName !== null )
    {
      returnValue = {};
      for( item in cookieName )
      {
        if( typeof cookies[cookieName[item]] !== 'undefined' )
        {
          returnValue[cookieName[item]] = cookies[cookieName[item]];
        }
        else
        {
          returnValue[cookieName[item]] = null;
        }
      }
    }
    else
    {
      returnValue = cookies;
    }

    return returnValue;
  };
  /**
   * filter - get array of cookies whose names match the provided RegExp
   *
   * @access public
   * @paramater Object RegExp - The regular expression to match against cookie names
   * @return Mixed - Object:hash of cookies whose names match the RegExp
   */
  constructor.prototype.filter = function( cookieNameRegExp )
  {
    var cookieName, returnValue = {}, cookies = parseCookies();

    if( typeof cookieNameRegExp === 'string' )
    {
      cookieNameRegExp = new RegExp( cookieNameRegExp );
    }

    for( cookieName in cookies )
    {
      if( cookieName.match( cookieNameRegExp ) )
      {
        returnValue[cookieName] = cookies[cookieName];
      }
    }

    return returnValue;
  };
  /**
   * set - set or delete a cookie with desired options
   *
   * @access public
   * @paramater String cookieName - name of cookie to set
   * @paramater Mixed value - Any JS value. If not a string, will be JSON encoded; NULL to delete
   * @paramater Object options - optional list of cookie options to specify
   * @return void
   */
  constructor.prototype.set = function( cookieName, value, options )
  {
    if( typeof options !== 'object' || options === null )
    {
      options = {};
    }

    if( typeof value === 'undefined' || value === null )
    {
      value = '';
      options.hoursToLive = -8760;
    }

    else if( typeof value !== 'string' )
    {
      if( typeof JSON === 'object' && JSON !== null && typeof JSON.stringify === 'function' )
      {
        value = JSON.stringify( value );
      }
      else
      {
        throw new Error( 'cookies.set() received non-string value and could not serialize.' );
      }
    }


    var optionsString = assembleOptionsString( options );

    document.cookie = cookieName + '=' + encodeURIComponent( value ) + optionsString;
  };
  /**
   * del - delete a cookie (domain and path options must match those with which the cookie was set; this is really an alias for set() with parameters simplified for this use)
   *
   * @access public
   * @paramater MIxed cookieName - String name of cookie to delete, or Bool true to delete all
   * @paramater Object options - optional list of cookie options to specify ( path, domain )
   * @return void
   */
  constructor.prototype.del = function( cookieName, options )
  {
    var allCookies = {}, name;

    if( typeof options !== 'object' || options === null )
    {
      options = {};
    }

    if( typeof cookieName === 'boolean' && cookieName === true )
    {
      allCookies = this.get();
    }
    else if( typeof cookieName === 'string' )
    {
      allCookies[cookieName] = true;
    }

    for( name in allCookies )
    {
      if( typeof name === 'string' && name !== '' )
      {
        this.set( name, null, options );
      }
    }
  };
  /**
   * test - test whether the browser is accepting cookies
   *
   * @access public
   * @return Boolean
   */
  constructor.prototype.test = function()
  {
    var returnValue = false, testName = 'cT', testValue = 'data';

    this.set( testName, testValue );

    if( this.get( testName ) === testValue )
    {
      this.del( testName );
      returnValue = true;
    }

    return returnValue;
  };
  /**
   * setOptions - set default options for calls to cookie methods
   *
   * @access public
   * @param Object options - list of cookie options to specify
   * @return void
   */
  constructor.prototype.setOptions = function( options )
  {
    if( typeof options !== 'object' )
    {
      options = null;
    }

    defaultOptions = resolveOptions( options );
  };

  return new constructor();
} )();
var map, geocoder;
var markers = {}, markerTooltip;
var autocomplete, sugerenciaMarker;

var MAP_MIN_ZOOM = 11;
var MAP_MAX_ZOOM = 16;
var MAX_TILE_LEVEL = 14;
var MIN_ZOOM_MARKERS = 15;

var mapaPanControl = true;

// La session timestamp dura 1 minuto (es para cache)
var session_timestamp = Math.floor(((new Date()*1) / 1000) / 60);
/**
 * Dice si el browser es mobile (hay dos codepaths para el mapa)
 * @returns {boolean}
 */
function is_mobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check || ( $(window).width() <= 768 );
}

function has_transitions() {
  var b = document.body.style;
  if( (b.MozTransition=='' || b.WebkitTransition=='' || b.OTransition=='' || b.transition=='') &&
      (b.MozTransform=='' || b.WebkitTransform=='' || b.OTransform=='' || b.transform=='')) {
    return true;
  } else {
    return false;
  }
}

$(document).ready(function(){

  if( ! has_transitions() ) {
    $('body').addClass('without-transitions');
  }

  // Cookies de Device
  if( cookies.get('__d__') == null ) {
    var value = generateRandomToken(20) + ((new Date())*1);
    cookies.set('__d__', value, {
      'path': '/',
      'expiresAt': (new Date(2038, 0, 1)),
      'secure': false
    });
  }

  $('#reportar input[name=d]').val( cookies.get('__d__') );
  if( typeof JSON.stringify == 'function' ) {
    $('#reportar input[name=f]').val( JSON.stringify(fingerprint()) );
  }

});

/**
 * Convierten de long/lat a tile x/y
 * Se usan para obtener los tiles de reportes
 */
function long2tile(lng, z) {
  return (Math.floor((lng + 180.0) / 360.0 * Math.pow(2.0, z)));
}
function lat2tile(lat, z) {
  return (Math.floor((1.0 - Math.log( Math.tan(lat * Math.PI/180.0) + 1.0 / Math.cos(lat * Math.PI/180.0)) / Math.PI) / 2.0 * Math.pow(2.0, z)));
}

function get_tiles_visibles( z ) {
  if( typeof map == 'undefined' ){ return; }

  var bounds = map.getBounds();
  
  var sw = [ bounds.getSouthWest().lng(), bounds.getSouthWest().lat() ];
  var ne = [ bounds.getNorthEast().lng(), bounds.getNorthEast().lat() ];

  var x_from = long2tile(sw[0], z);
  var x_to = long2tile(ne[0], z);
  var y_from = lat2tile(ne[1], z);
  var y_to = lat2tile(sw[1], z);

  var tiles = [];
  for( var x=x_from; x<=x_to; x++ ) {
    for( var y=y_from; y<=y_to; y++ ) {
      tiles.push({'x': x, 'y': y, 'z': z});
    }
  }

  return tiles;
}


function generateRandomToken(len) {
  if( typeof len != 'number' || len <= 0 ){ return ''; }

  var str = '';
  for(var i=1; i<=Math.ceil(len/16); i++) {
    str += Math.random().toString(36).slice(2);
  }

  return str.slice(0, len);
};


function fingerprint() {
  // Obtiene un fingerprint del dispositivo

  var fp = {};
  // Screen resolution, depth and pixel ratio (retina displays)
  if( typeof screen.width == 'number' && typeof screen.height == 'number' ) {
    fp['r'] = (screen.width).toString() +'x'+ (screen.height.toString());
    if( typeof screen.pixelDepth == 'number' ) {
      fp['r'] = fp['r'] +'@'+ (screen.pixelDepth).toString();
    }
    if( typeof window.devicePixelRatio == 'number' ) {
      fp['r'] = fp['r'] +'#'+ (window.devicePixelRatio).toString();
    }
  }

  fp['p'] = [];
  if( typeof navigator.plugins != 'undefined' ) {
    for( var ix in navigator.plugins ) {
      if( typeof navigator.plugins[ix]['description'] != 'undefined' && navigator.plugins[ix]['description'] != null ) {
        fp['p'].push( navigator.plugins[ix]['description'] );
      } else {
        fp['p'].push( '__'+ navigator.plugins[ix]['name'] +'__'+ navigator.plugins[ix]['filename'] );
      }
    }
  }

  // IE8 Tiene problemitas iterando sobre mimeTypes
  fp['m'] = [];
  if( (document.documentElement.className).indexOf('shitty-browser') == -1 ) {
    if( typeof navigator.mimeTypes != 'undefined' ) {
      for( var ix in navigator.mimeTypes ) {
        fp['m'].push( navigator.mimeTypes[ix]['type'] );
      }
    }
  }

  fp['u'] = (typeof navigator.userAgent != 'undefined') ? navigator.userAgent : null;
  fp['o'] = (typeof navigator.platform != 'undefined') ? navigator.platform : null;
  fp['b'] = (typeof navigator.product != 'undefined') ? navigator.product : null;
  fp['l'] = (typeof navigator.language != 'undefined') ? navigator.language : null;
  fp['j'] = (typeof navigator.javaEnabled == 'function') ? navigator.javaEnabled() : null;
  fp['t'] = (typeof navigator.doNotTrack != 'undefined') ? navigator.doNotTrack : null;

  fp['f'] = getFlashVersion();

  return fp;
}


function getFlashVersion(){
  // ie
  try {
    try {
      // avoid fp6 minor version lookup issues
      // see: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
      var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
      try { axo.AllowScriptAccess = 'always'; }
      catch(e) { return '6,0,0'; }
    } catch(e) {}
    return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
    // other browsers
  } catch(e) {
    try {
      if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){
        return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
      }
    } catch(e) {}
  }
  return '0,0,0';
}


String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};
String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};
String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};


var STR_PAD_LEFT = 1;
var STR_PAD_RIGHT = 2;
var STR_PAD_BOTH = 3;

function pad(str, len, pad, dir) {

  str = (str).toString();

  if (typeof(len) == "undefined") { var len = 0; }
  if (typeof(pad) == "undefined") { var pad = ' '; }
  if (typeof(dir) == "undefined") { var dir = STR_PAD_RIGHT; }

  if (len + 1 >= str.length) {

    switch (dir){

      case STR_PAD_LEFT:
        str = Array(len + 1 - str.length).join(pad) + str;
        break;

      case STR_PAD_BOTH:
        var right = Math.ceil((padlen = len - str.length) / 2);
        var left = padlen - right;
        str = Array(left+1).join(pad) + str + Array(right+1).join(pad);
        break;

      default:
        str = str + Array(len + 1 - str.length).join(pad);
        break;

    } // switch

  }

  return str;

}


function geolocationEnabled() {
	if (navigator.geolocation) {
		return true;
	} else {
		return false;
	}
}

function getLocation() {

	if (geolocationEnabled()) {
		// Looking for geolocation
		navigator.geolocation.getCurrentPosition(getAddress, locationError);
	}
}


function getAddress(position) {
	var lat = position.coords.latitude;
	var lng = position.coords.longitude;
	var latlng = new google.maps.LatLng(lat, lng);

	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'latLng': latlng}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				results[0].adr_address = splitAddress(results[0].formatted_address);
				seleccionarDireccion(results[0]);
			} else {
				// console.log('No results found');
				$('#reportar .buscar-location').removeClass('buscando');
			}
		} else {
			// console.log('Geocoder failed due to: ' + status);
			$('#reportar .buscar-location').removeClass('buscando');
		}
	});
}

function locationError(error) {
	$('#reportar .buscar-location').removeClass('buscando');

	switch(error.code) {
	case error.PERMISSION_DENIED:
		// User denied the request for Geolocation.
		mostrar_error("Debes autorizar el uso de tu ubicacion");
		break;
	case error.POSITION_UNAVAILABLE:
		// Location information is unavailable.
		mostrar_error("Tu ubicacion no esta disponible");
		break;
	case error.TIMEOUT:
		// The request to get user location timed out.
		mostrar_error("Tu ubicacion no esta disponible");
		break;
	case error.UNKNOWN_ERROR:
		// An unknown error occurred.
		mostrar_error("Tu ubicacion no esta disponible");
		break;
	}
}

// Divide formatted_address into spans
function splitAddress(formatted_address) {
	var components = formatted_address.split(",");
	for (var key in components) {
		if (key == 0) {
			// Add Street name
			var html = '<span class="street-address">'+components[key].trim()+'</span>, ';
		} else if ((components.length-1) == key) {
			html += '<span>'+components[key].trim()+'</span>';
		} else {
			html += '<span>'+components[key].trim()+'</span>, ';
		}
		
	}
	return html;
}

// Address components to adr_address
// Droped function, use splitAddress()
function parseAddress(components) {
	var address = {},
		street_address = {}
		,html;
	address.street_address = "";
	for(i in components){
		if(components[i].types[0] == 'route') {
			street_address.street_name = components[i].long_name;
		}
		if(components[i].types[0] == 'street_number') {
			street_address.street_number = components[i].long_name;
		}
		if(components[i].types[0] == 'locality') {
			address.locality = components[i].long_name;
		}
		if(components[i].types[0] == 'administrative_area_level_1') {
			address.region = components[i].long_name;
		}
		if(components[i].types[0] == 'country') {
			address.country = components[i].long_name;
		}
	}

	if (street_address.street_name) {
		address.street_address = street_address.street_name;
		if (street_address.street_number) {
			address.street_address += " "+street_address.street_number;
		}
	}

	for (var key in address) {
		if (address[key] != "undefined" && address[key] != "") {
			html += '<span class="'+key+'">'+address[key]+'</span> ';
		}
	}

	return html;
}
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

var NombreBarrioOverlay;
NombreBarrioOverlay.prototype = new google.maps.OverlayView();

function NombreBarrioOverlay(map, zona) {

  // Initialize all properties.
  this.bounds_ = zona.bounds;
  this.nombre_ = zona.nombre;
  this.slug_ = zona.slug;
  this.estado_ = zona.estado;
  this.nombre_estado_ = zona.estado_nombre;
  this.civilizacion_ = zona.civilizacion;

  // Define a property to hold the image's div. We'll
  // actually create this div upon receipt of the onAdd()
  // method so we'll leave it null for now.
  this.div_ = null;

  // Explicitly call setMap on this overlay.
  this.setMap(map);
}

/**
 * onAdd is called when the map's panes are ready and the overlay has been
 * added to the map.
 */
NombreBarrioOverlay.prototype.onAdd = function() {

  var div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';

  // Descripción del estado de la luz
  var descripcion = '<h6>'+this.nombre_;
  var clase = 'map-barrio '+this.slug_+' '+this.estado_;

  descripcion += '<small>'+this.nombre_estado_+'</small>';
  descripcion += '</h6>';

  div.className = clase;
  div.innerHTML = descripcion;

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.overlayLayer.appendChild(div);
};

NombreBarrioOverlay.prototype.draw = function() {

  // We use the south-west and north-east
  // coordinates of the overlay to peg it to the correct position and size.
  // To do this, we need to retrieve the projection from the overlay.
  var overlayProjection = this.getProjection();

  // Retrieve the south-west and north-east coordinates of this overlay
  // in LatLngs and convert them to pixel coordinates.
  // We'll use these coordinates to resize the div.
  var sw = overlayProjection.fromLatLngToDivPixel(new google.maps.LatLng(this.bounds_.sw[1], this.bounds_.sw[0]));
  var ne = overlayProjection.fromLatLngToDivPixel(new google.maps.LatLng(this.bounds_.ne[1], this.bounds_.ne[0]));

  // Resize the image's div to fit the indicated dimensions.
  var div = this.div_;
  div.style.left = sw.x + 'px';
  div.style.top = ne.y + 'px';
  div.style.width = (ne.x - sw.x) + 'px';
  div.style.height = (sw.y - ne.y) + 'px';
};

// The onRemove() method will be called automatically from the API if
// we ever set the overlay's map property to 'null'.
NombreBarrioOverlay.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);
  this.div_ = null;
};


