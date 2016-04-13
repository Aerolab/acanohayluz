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
