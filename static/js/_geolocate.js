

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