/*

bma_gis.js

carto helpers 

*/


window.BG = {
    // MUST be called first to setup everything
    init: function(wms, pg_bridge, layer, title)
    {
        this.wms_url_ = wms;
        this.layer_name_ = layer;
        this.title_ = title || 'bMa & OpenStreetMap';
        this.pg_ = pg_bridge + '/';
    },
    // install the main map in the specified container
    install_map: function(container){
        this.layer = L.tileLayer.wms(this.wms_url_, {
            layers: this.layer_name_,
            format: 'image/png',
            transparent: true,
            attribution: "OpenStreetMap styled by Speculoos"
        });
        
        this.map =  L.map(container, {
            layers: [this.layer],
            center: [50.854075572144815, 4.38629150390625],
            zoom: 12,
            crs: L.CRS.EPSG900913
        });
    },
    // Pass an array of IDs of visible bMa features to the callback
    get_visible_features : function(cb){
        var NE = this.map.getBounds().getNorthEast();
        var SW = this.map.getBounds().getSouthWest();
        var rect = {
            N:NE.lat,
            E:NE.lng,
            S:SW.lat,
            W:SW.lng,
            srid:4326
        };
        $.getJSON(this.pg_+'rect', rect, function(data){
            cb(data);
        });
    },
    // pass the centroid position (in document coordinates) of a feature to the callback  
    get_pos : function(id, cb){
        $.getJSON(this.pg_+'pos/'+id, function(data){
            cb(data);
        });
    },
    // rather intended for debug purpose
    get_all: function(cb){
        $.getJSON(this.pg_+'all', function(data){
            cb(data);
        });
    }
}

