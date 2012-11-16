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
    
    var Icon0 = L.icon({
        iconUrl: 'images/build1.png',
        iconSize: [386 / 4, 370 / 4],
    });
    var Icon1 = L.icon({
        iconUrl: 'images/build1red.png',
        iconSize: [386 / 4, 370 / 4],
    });
    
    BG.init(WMS_URL, PG_URL, WMS_LAYER, MAP_TITLE);
    
    // Put everything in place _once_ we get the very all data
    BG.get_all(function(all_data){
        $.getJSON('http://www.bmabru.be/Public/json/Projects.php', function( projects_data ){
            $.getJSON('http://www.bmabru.be/Public/json/Builders.php', function( builders_data ){
                
                var projects = new Object();
                var fake_text = '<p>Le projet consiste en la construction d’un complexe d’équipements d’intérêt public au coeur du quartier Primeurs-Pont de Luttre à Forest. Les deux terrains sur lesquels ces équipements seront construits sont situés avenue du Pont de Luttre : soit un terrain triangulaire ceint pas les voies de chemin de fer sur deux de ses côtés et une petite parcelle sise de l’autre côté de l’avenue du Pont de Luttre. Le programme intègre la nécessité de traiter ce lieu comme entrée de ville.</p>';
                var fake_desc = '<div class="short-description"><div class="description-title">Bla bla</div><div class="description-wrapper">'+fake_text+'</div></div>';
                
                var images = new Object();
                
                for(var pidx in projects_data)
                {
                    var builders = projects_data[pidx].b;
                    var content = '<div class="builders">';
                    for(var bidx = 0; bidx < builders.length; bidx++)
                    {
                        var bid = builders[bidx];
                        content += '<div class="builder"><a href="#'+bid+'">'+builders_data[bid]+'</a></div>';
                    }
                    content += '</div>';
                    
                    projects[pidx] = {name:projects_data[pidx].t, content:fake_desc, builders:content};
                }
                var cnsl = $('#console'),
                    all_elem = new Object();
                for(var i=0; i < all_data.length; i++)
                {
                    if(all_data[i].pid && all_data[i].pid !== 'null')
                    {
                        var elem = $('<div id="console_item_'+all_data[i].pid+'" />');
                        elem.addClass('console_item');
//                         elem.html(all_data[i].name);
                        elem.html(projects[all_data[i].pid].builders + '<div class="item-project-name">'+projects[all_data[i].pid].name+'</div>');
        //                 elem.hide();
                        elem.css({top:'0px'});
                        cnsl.append(elem);
                        all_elem[all_data[i].pid] = {elem:elem, data:all_data[i]};
                        
                        
                        // position images
                        var icon_0 = true;
                        BG.get_pos(all_data[i].pid, 'map', function(gdata){
                            var coords = gdata.coordinates;
                            var pid = gdata.data.pid;
                            if(icon_0)
                            {
                                images[pid] = new L.Marker(new L.LatLng(coords[1], coords[0]), {icon:Icon0, clickable:true});
                                icon_0 = false;
                            }
                            else
                            {
                                images[pid] = new L.Marker(new L.LatLng(coords[1], coords[0]), {icon:Icon1, clickable:true});
                                icon_0 = true;
                            }
                            images[pid].on( 'click', function(evt){
                                var ctnt = $('#content');
                                ctnt.html(projects[pid].content);
                                ctnt.show();
                            });
                            images[pid].on( 'mouseover', function(evt){
                                $('.console_item').removeClass('clicked-feature');
                                $('#console_item_'+pid).addClass('clicked-feature');
                            });
                            images[pid].on( 'mouseout', function(evt){
                          $('.console_item').removeClass('clicked-feature');
                      });
                        }, 
                        {pid:all_data[i].pid, imgs:images}
                        );
                    }
                }
                
                function reset_console(data, visible){
                    var elem = data.data.all[data.data.pid];
                    var elem_y = $('#map').offset().top + data.ctnr_point.y - cnsl.offset().top;
                    if(visible)
                    {
                        elem.elem.removeClass('feature-hidden');
                        elem.elem.addClass('feature-visible');
                    }
                    else
                    {
                        elem.elem.removeClass('feature-visible');
                        elem.elem.addClass('feature-hidden');
                    }
                    elem.elem.animate({top:elem_y + 'px'});
                };
                
            
                
                BG.install_map('map', function(data){
                    var map = BG.get_map('map');
                    for(k in images)
                    {
                        map.removeLayer(images[k]);
                    }
                    for(var idx=0; idx < data.length ; idx++)
                    {
                        var ftr_id = data[idx];
                        if(ftr_id && ftr_id !== 'null')
                        {
                            BG.get_pos(ftr_id, 'map', function(gdata){
                                reset_console(gdata, true);
                            }, 
                            {pid:ftr_id, all:all_elem}
                            );
                        }
                    }
                    for(var k in all_elem)
                    {
                        if($.inArray(parseInt(k),data) < 0)
                        {
                            BG.get_pos(k, 'map', function(gdata){
                                reset_console(gdata, false);
                            }, 
                            {pid:k, all:all_elem}
                            );
                        }
                    }
                    var zoom = map.getZoom();
                    if(zoom > 15)
                    {
                        BG.hide_features();
                        for(k in images)
                        {
                            map.addLayer(images[k]);
                        }
                    }
                    else
                    {
                        BG.show_features('map');
                    }
                });
                var feature_options = {
                    stroke:true,
                    color: '#d43b2d',
                    weight:3,
                    opacity:1,
                    fill:true,
                    fillColor: '#d43b2d',
                    fillOpacity:0.5,
                    clickable:true
                };
                BG.install_features('map', {
                    click:function(evt){
                        var ctnt = $('#content');
                        ctnt.html(projects[this.pid].content);
                        ctnt.show();
                    },
                    mouseover:function(evt){
                        $('.console_item').removeClass('clicked-feature');
                        $('#console_item_'+this.pid).addClass('clicked-feature');
                    },
                    mouseout:function(evt){
                        $('.console_item').removeClass('clicked-feature');
                    }
                },feature_options);
            });
        });
    });
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
    $('#map-wrapper').css({'width':bW - consoleWidth});
// 	lastli = bW-navMinWidth+10;
// 	if (lastli < 10) {
// 		lastli = 10;
// 	};
// 	$('#navigation>ul>li:last()').css('padding-left',lastli);
// 	if ( cons.is(':visible') ) {
// 		map.css({'width':bW-consoleWidth});
// 		cons.css({'height':cH-(ttop.outerHeight())});
// 	} else {
// 		map.css({'width':''});
// 	}
}
$(document).ready( Init );
$(window).resize( WindowResize );