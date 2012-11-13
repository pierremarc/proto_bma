//test
function InitDebug () {
	$('body').prepend('<div id="debug"></div>');
}
function debug ( val, reset ) {
	if (reset == 0) {
		$('#debug').empty();
	};
	$('#debug').append( val+'<br/>' );
}
// vars to init later
var body;
var container;
var ttop;
var navigation;
var cons;
var map;
var horMargins;
var verMargins;
var consoleWidth;
var navMinWidth;

function InitVars () {
	body = $('body');
	cons = $('#console');
	container = $('#container');	
	map = $('#map');
	navigation = $('#navigation');
	ttop = $('#top');
	horMargins = parseInt( $('body').css('margin-left') ) + parseInt( $('body').css('margin-right') );
	verMargins = parseInt( $('body').css('margin-top') ) + parseInt( $('body').css('margin-bottom') );
	consoleWidth = parseInt( cons.css('width') );
}
///
function wW () {
	return $(window).width();
}
function wH () {
	return $(window).height();
}
function eW ( e ) {
	return e.outerWidth();
}
function eH ( e ) {
	return e.outerHeight();
}
function eT ( e ) {
	return e.position().top;
}
function eL ( e ) {
	return e.position().left;
}
//
function MinimumWidth () {
	navMinWidth = 0;
	$('#navigation>ul>li').each( function(){
		navMinWidth += $(this).outerWidth();
	});
	navigation.css({'min-width':navMinWidth});
}
function InitConsole () {
	
}
function InitInterface (argument) {
	MinimumWidth();
	InitConsole();
	WindowResize();
}
function InitMap()
{
    var WMS_URL = 'http://bmawms.specgis.be/service';
    var WMS_LAYER = 'bMa';
    var PG_URL = 'http://specgis.be:8001/';
    var MAP_TITLE = 'Map Title';
    var bmabru_json_url = 'http://www.bmabru.be/Public/json/';
    BG.init(WMS_URL, PG_URL, WMS_LAYER, MAP_TITLE);
    
    BG.get_all(function(all_data){
        
        var cnsl = $('#console'),
               all_elem = new Object();
        for(var i=0; i < all_data.length; i++)
        {
            var elem = $('<div id="console_item_'+all_data[i].pid+'" />');
            elem.addClass('console_item');
            elem.html(all_data[i].name);
            elem.hide();
            elem.css({top:'0px'});
            cnsl.append(elem);
            all_elem[all_data[i].pid] = {elem:elem, data:all_data[i]};
        }
        
        function reset_console(data){
            var elem = data.data.all[data.data.pid];
            var elem_y = $('#map').offset().top + data.ctnr_point.y - cnsl.offset().top;
            elem.elem.show();
            elem.elem.animate({top:elem_y + 'px'});
        };
        
       
        
        BG.install_map('map', function(data){
            $('.console_item').hide();
            for(var idx=0; idx < data.length ; idx++)
            {
                var ftr_id = data[idx];
//                 console.log('## '+idx + ' => ' + ftr_id);
                if(ftr_id)
                {
                    BG.get_pos(ftr_id, 'map', function(gdata){
//                         console.log(idx + ' => ' + ftr_id);
                        reset_console(gdata);
                    }, 
                    {pid:ftr_id, all:all_elem}
                    );
                }
            }
        });
    });
//     $.getJSON('http://specgis.be:8001/all',{srid:4326},function(data){
//         for(var dix = 0; dix < data.length; dix++)
//         {
//             var d = data[dix];
//             var latlngs = new Array();
//             var g = d.geom;
//             g = g.slice('MULTIPOLYGON((('.length, -3);
//             var dg = g.split(',');
//             for(var gix = 0; gix < dg.length; gix += 1)
//             {
//                 var ll = dg[gix].split(' ')
//                 if(ll[0] && ll[1])
//                 {
// //                     var latlon=Conv.m2ll(ll[1], ll[0]);//output latlon.lat, latlon.lon
// //                     if(latlon.lat && latlon.lon)
//                     latlngs.push(new L.LatLng(ll[1], ll[0]))
//                 }
//             }
//             console.log(latlngs);
//             L.polyline(latlngs, {color: 'green'}).addTo(BG.get_map());
//             }
//         });
                
//                 var pos = $('#pos');
//                 BG.get_map().on('mousemove', function(evt){
//                     pos.html('lat: '+evt.latlng.lat+'<br /> lng: '+evt.latlng.lng); 
//                 });
                
}

function Init () {
	InitDebug();
	InitVars();
	InitInterface();
    InitMap();
}
function WindowResize () {
	cH = wH()-verMargins;
	bW = wW()-horMargins;
	container.css({'height':cH});
	body.css({'width':bW});
	lastli = bW-navMinWidth+10;
	if (lastli < 10) {
		lastli = 10;
	};
	$('#navigation>ul>li:last()').css('padding-left',lastli);
	if ( cons.is(':visible') ) {
		map.css({'width':bW-consoleWidth});
		cons.css({'height':cH-(ttop.outerHeight())});
	} else {
		map.css({'width':''});
	}
}
$(document).ready( Init );
$(window).resize( WindowResize );