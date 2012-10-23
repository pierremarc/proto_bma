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
        this.maps_ = {};
        this.observers_ = {};
        this.map = undefined;
    },
    // install the main map in the specified container
    install_map: function(container, observers){
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
        this.maps_[container] = this.map;
        
        // Event handlers
        this.observers_[container] = new Array();
        if(observers != undefined)
        {
            if(typeof observers === 'function')
            {
                observers = [observers];
            }
            for(var io = 0; io < observers.length; io++)
            {
                this.observers_[container].push(observers[io]);
            }
        }
        var that = this;
        var ctnr = container;
        var interests = ['zoomend', 'moveend'];
        for(var ii = 0; ii < interests.length; ii++)
        {
            this.map.on(interests[ii], function(evt){
                that.get_visible_features(function(data){
                    for(var io = 0; io < this.observers_[ctnr].length; io++)
                    {
                        this.observers_[ctnr][io](data);
                    }
                });
            });
        }
        
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

