//create the empty layers
        var focustracts = L.layerGroup(),
        zipcodes = L.layerGroup(); 
        var gradeIncrement;
        
    //Initialize the leaflet map
        var map = L.map('map', {
            center: [38.0147,-84.483],
            zoom: 11,
            zoomControl: true,
            dragging: true,
        });

    // Create additional map panes to fix layering issue
        map.createPane("pane200").style.zIndex = 200; // tile pane
        map.createPane("pane450").style.zIndex = 450; // between overlays and shadows
        map.createPane("pane600").style.zIndex = 600; // marker pane
               
    //Create the baselayer and add it to the map
    var layer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});
map.addLayer(layer);
        
    //Create the census tract layer from the geojson
       $.getJSON("data/focustracts.geojson", function(data) {
            focustractsLayer = L.geoJson(data, {
            onEachFeature: function (feature, layer){
                focustracts.addLayer(layer), layer.bindPopup('<b>'+feature.properties.NAMELSAD10+'</b>')},
            pane: "pane450",
            weight: 1,
            opacity: 1,
            color: '#fa0000',
            dashArray: '3'
        }).addTo(map);
    });
          
    //Create the zipcode layer from the geojson
         $.getJSON("data/zipcode_tally.geojson", function(data) {
             var counts = Array();
             var someFeatures = data.features;
            $.each(someFeatures, function(i, obj){
                counts.push(obj.properties.Count)
            })
             
             console.log(counts);
             var countMax = counts.sort(function(a, b){return b-a})[0] ;
             gradeIncrement = Math.floor(countMax/5);
             doLegendyThings();
             
             
            zipcodesLayer = L.geoJson(data, {
                style: style,
                onEachFeature: function (feature, layer){
                zipcodes.addLayer(layer), layer.bindPopup('<b>'+feature.properties.Count+'</b>')}, 
        }).addTo(map);
    });
    
        
    // Add layers to map so they are automatically selected in the layer control
        map.addLayer(focustracts)
        map.addLayer(zipcodes)
    
    // Create groupings for layer controller
        var userLayers = {
            "Focus Tracts": focustracts,
            //"Zipcodes": zipcodes
        };

    // Add layer controller to Map
        L.control.layers(null, userLayers).addTo(map); // the first item is always a radio button

        		
    //Create a leaflet control for the legend
    //Give the legend an onAdd handler
    //Add the legend to the map
                
    function doLegendyThings() {
        var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
			grades = [0, gradeIncrement, gradeIncrement * 2, gradeIncrement * 3, gradeIncrement * 4],
			labels = [],
			from, to;

		for (var i = 0; i < grades.length; i++) {
			from = grades[i];
			to = grades[i + 1];

			labels.push(
				'<i style="background:' + getColor(from + 1) + '"></i> ' +
				from + ((to - 1) ? '&ndash;' + (to-1) : '+'));
		}

		div.innerHTML = labels.join('<br>');
		return div;
	};
        legend.addTo(map);
    }
        
    //STYLE CREATION    
    //Given a value for the property Count, return a specific color
    //This should be written to autogenerate quantiles
    function getColor(Count) {
        return Count >= (gradeIncrement * 4)-.01 ? '#333333' :
           Count >= (gradeIncrement * 3)-.01 ? '#4D4D4D' :
           Count >= (gradeIncrement * 2)-.01 ? '#666666' :
           Count >= (gradeIncrement * 1)-.01 ? '#999999' :
           '#CCCCCC';
    } 
        
    //Given a feature, return an object with style properties that leaflet unsderstands   
    function style(feature) {
        return {
            fillColor: getColor(feature.properties.Count),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        }
    }    
 
    //**
    //DOM EVENTS (Interactive stuff)
    //Change a layer's style when passed a DOM event (e)
    function highlightFeature(e) {
    	var layer = e.target;
    	layer.setStyle({
    		weight: 5,
    		color: '#666',
    		dashArray: '',
    		fillOpacity: 0.7
        });

    	if (!L.Browser.ie && !L.Browser.opera) {
    		layer.bringToFront();
    	}

        //FIXME: Info hasn't been defined
	    info.update(layer.feature.properties);
    }
    
    //Reset a layer's style when passed a DOM event 
    //(I guess leaflet keeps track of past layer styles?)    
    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        //FIXME: Info hasn't been defined
    	info.update();
    }
    
    //Zoom to a feature when passed a DOM event
    function zoomToFeature(e) {
    	map.fitBounds(e.target.getBounds());
    }
    
    //Now that the event handlers are written, assign them to
    //specific DOM events that could happen to the layer
    function onEachFeature(feature, layer) {
    	/*layer.on({
    		mouseover: highlightFeature,
    		mouseout: resetHighlight,
    		click: zoomToFeature
    	});*/
    }