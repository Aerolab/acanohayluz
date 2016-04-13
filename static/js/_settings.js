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
