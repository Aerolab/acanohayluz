
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


