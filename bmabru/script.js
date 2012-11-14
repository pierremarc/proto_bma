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
    
    // Put everything in place _once_ we get the very all data
    BG.get_all(function(all_data){
        $.getJSON('http://www.bmabru.be/Public/json/Projects.php', function( projects_data ){
            $.getJSON('http://www.bmabru.be/Public/json/Builders.php', function( builders_data ){
                
                var projects = new Object();
                for(var pidx in projects_data)
                {
                    var builders = projects_data[pidx].b;
                    var content = '<div class="project-description">';
                    for(var bidx = 0; bidx < builders.length; bidx++)
                    {
                        var bid = builders[bidx];
                        content += '<div class="builder"><a href="#'+bid+'">'+builders_data[bid]+'</a></div>';
                    }
                    content += '</div>';
                    
                    projects[pidx] = {name:projects_data[pidx].t, content:content};
                }
                var cnsl = $('#console'),
                    all_elem = new Object();
                for(var i=0; i < all_data.length; i++)
                {
                    if(all_data[i].pid && all_data[i].pid !== 'null')
                    {
                        var elem = $('<div id="console_item_'+all_data[i].pid+'" />');
                        elem.addClass('console_item');
                        elem.html(all_data[i].name);
        //                 elem.hide();
                        elem.css({top:'0px'});
                        cnsl.append(elem);
                        all_elem[all_data[i].pid] = {elem:elem, data:all_data[i]};
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
                });
                var feature_options = {
                    stroke:false,
                    color: '#f00',
                    weight:2,
                    opacity:1,
                    fill:true,
                    fillColor: '#fff',
                    fillOpacity:0.1,
                    clickable:true
                };
                BG.install_features('map', {
                    click:function(evt){
                        $('.console_item').removeClass('clicked-feature');
                        $('#console_item_'+this.pid).addClass('clicked-feature');
                        
                        // more serious stuff
                        var ctnt = $('#content');
                        ctnt.html(projects[this.pid].content);
                        ctnt.show();
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
	lastli = bW-navMinWidth+10;
	if (lastli < 10) {
		lastli = 10;
	};
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