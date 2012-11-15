/*

bma_gis.js

carto helpers 

*/



// from http://wiki.openstreetmap.org/wiki/Mercator
var Conv=({
    r_major:6378137.0,//Equatorial Radius, WGS84
    r_minor:6356752.314245179,//defined as constant
    f:298.257223563,//1/f=(a-b)/a , a=r_major, b=r_minor
          deg2rad:function(d)
          {
              var r=d*(Math.PI/180.0);
              return r;
          },
          rad2deg:function(r)
          {
              var d=r/(Math.PI/180.0);
              return d;
          },
          ll2m:function(lon,lat) //lat lon to mercator
          {
              //lat, lon in rad
              var x=this.r_major * this.deg2rad(lon);
              
              if (lat > 89.5) lat = 89.5;
                        if (lat < -89.5) lat = -89.5;
                        
                        
                        var temp = this.r_minor / this.r_major;
              var es = 1.0 - (temp * temp);
              var eccent = Math.sqrt(es);
              
              var phi = this.deg2rad(lat);
              
              var sinphi = Math.sin(phi);
              
              var con = eccent * sinphi;
              var com = .5 * eccent;
              var con2 = Math.pow((1.0-con)/(1.0+con), com);
              var ts = Math.tan(.5 * (Math.PI*0.5 - phi))/con2;
              var y = 0 - this.r_major * Math.log(ts);
              var ret={'x':x,'y':y};
              return ret;
          },
          m2ll:function(x,y) //mercator to lat lon
          {
              var lon=this.rad2deg((x/this.r_major));
              
              var temp = this.r_minor / this.r_major;
              var e = Math.sqrt(1.0 - (temp * temp));
              var lat=this.rad2deg(this.pj_phi2( Math.exp( 0-(y/this.r_major)), e));
              
              var ret={'lon':lon,'lat':lat};
              return ret;
          },
          pj_phi2:function(ts, e) 
          {
              var N_ITER=15;
              var HALFPI=Math.PI/2;
              
              
              var TOL=0.0000000001;
              var eccnth, Phi, con, dphi;
              var i;
              var eccnth = .5 * e;
              Phi = HALFPI - 2. * Math.atan (ts);
              i = N_ITER;
              do 
              {
                  con = e * Math.sin (Phi);
                  dphi = HALFPI - 2. * Math.atan (ts * Math.pow((1. - con) / (1. + con), eccnth)) - Phi;
                  Phi += dphi;
                  
              } 
              while ( Math.abs(dphi)>TOL && --i);
                        return Phi;
          }
});

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
    ctrl_zoom : L.Control.Zoom.extend({
        onAdd: function (map) {
            var className = 'bma-control-zoom',
            container = L.DomUtil.create('div', className);
            this._createButton('Zoom in', className + '-in', container, map.zoomIn, map);
            this._createButton('Zoom out', className + '-out', container, map.zoomOut, map);
            return container;
        }
    }),
    attribution: L.Control.Attribution.extend({
        onAdd: function(map){
            this._container = L.DomUtil.create('div', 'bma-attribution');
            L.DomEvent.disableClickPropagation(this._container);
            this._update();
            return this._container;
            return 
        }
    }),
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
            crs: L.CRS.EPSG900913,
        });
        
        this.map.removeControl(this.map.zoomControl).addControl(new this.ctrl_zoom({position:'topright'}));
//         this.map.removeControl(this.map.attributionControl).addControl(new L.Control.Attribution({position:'bottomleft', prefix:false}));
        this.map.removeControl(this.map.attributionControl);
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
        var interests = ['load','zoomend', 'moveend'];
        for(var ii = 0; ii < interests.length; ii++)
        {
            this.map.on(interests[ii], function(evt){
                that.get_visible_features(function(data){
                    for(var io = 0; io < that.observers_[ctnr].length; io++)
                    {
                        that.observers_[ctnr][io](data);
                    }
                });
            });
        }
        // little little hack to trigger a fake 'load' event
        that.get_visible_features(function(data){
            for(var io = 0; io < that.observers_[ctnr].length; io++)
            {
                that.observers_[ctnr][io](data);
            }
        });
        
        // test
        this.map.on('click', function(evt){
            var mll = that.map.mouseEventToLatLng(evt.originalEvent);
            console.log(mll);
            that.get_feature(evt.latlng, function(data){
                console.log(data);
            })
        });
        
    },
    install_features:function(map_id, handlers, options){
        map = this.maps_[map_id];
        var that = this;
        this.get_all(function(data){
            that.features_ = [];
            var reader = Object.create(WKTReader);
            for(var idx=0; idx < data.length; idx++)
            {
                var d = data[idx];
                var wkt = d.geom;
                var multi_polygon = reader.read(wkt);
                var res = new L.MultiPolygon(multi_polygon, options);
                res.pid = d.pid;
                that.features_.push({pid:d.pid, feature:res});
                for(var kh in handlers)
                {
                    res.on(kh, handlers[kh], res);
                }
                res.addTo(map);
            }
            
        });
    },
    get_map: function(id)
    {
        if(id == undefined)
            return this.map;
        return this.maps_[id];
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
    translate_pos_: function(coords, container){
        return this.maps_[container].latLngToContainerPoint(new L.LatLng(coords[1], coords[0]));
    },
    // pass the centroid position (in container coordinates) of a feature to the callback 
    get_pos : function(id, container, cb, u_data){
        var that = this;
        if(that.pos_cache_ === undefined)
        {
            that.pos_cache_ = new Object();
        }
        if(that.pos_cache_[id] !== undefined)
        {
            var data = that.pos_cache_[id];
            data.ctnr_point = that.translate_pos_(data.coordinates, container);
            if(u_data != undefined){
                data.data = u_data;
            }
            cb(data);
            return;
        }
        if(id === 'null')
            throw "Trying to get position of a NULL feature";
        $.getJSON(this.pg_+'pos/'+id, {srid:4326}, function(data){
            that.pos_cache_[id] = data;
            data.ctnr_point = that.translate_pos_(data.coordinates, container);
            if(u_data != undefined){
                data.data = u_data;
            }
            cb(data);
        });
    },
    get_feature : function(ll, cb){
        var pt = L.CRS.EPSG900913.project(ll);
        
        $.getJSON(this.pg_+'feature/',{lat:pt.y, lng:pt.x, srid:900913}, function(data){
            cb(data);
        });
        
    }, 
    // (was) rather intended for debug purpose 
    get_all: function(cb){
        if(this.all_cache_ === undefined)
        {
            $.getJSON(this.pg_+'all',{srid:4326}, function(data){
                this.all_cache_ = data;
                cb(data);
            });
        }
        else
        {
            cb(this.all_cache_);
        }
    }
}

