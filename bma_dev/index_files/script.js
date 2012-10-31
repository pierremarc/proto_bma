var ie = jQuery.browser.msie;
var d;
var LabelEscape = new Object();
LabelEscape['&#233;'] = 'é';
LabelEscape['&#232;'] = 'è';
LabelEscape['&#234;'] = 'ê';
LabelEscape['&#235;'] = 'ë';
LabelEscape['&#146;'] = '’';
LabelEscape['&#224;'] = 'à';
LabelEscape['&#8217;'] = '’';
LabelEscape['&#226;'] = 'â';
var pForm = "";
var proj_in_page = 0;

function GetLabel(l)
{
	var ret = l;
	for (var key in LabelEscape) 
	{
		ret = ret.replace(new RegExp(key,'g'), LabelEscape[key]);
	}
	return ret;
}
function valueToDigit (v) {
	return Math.round( parseFloat(v) );
}
function getSearchCriterias (form) {
	var fields = $(form).serializeArray();
	var criterias = "";
	jQuery.each(fields, function(i, field){
		if (field.value != "") {
			criterias += '.'+field.value;
		};
	});
	return criterias;
}
function displayItem (element, criterias) {
	if (criterias != "") {
		$(element+criterias).show();
		$(element).not(criterias).hide();
	} else {
		$(element).show();
	};
	return $(element+criterias).length;
}
function displayResults (n, no, one, many) {
	to_insert = "";
	if (n == 0) {
		to_insert = no;
	} else if (n == 1) {
		to_insert = n+" "+one;
	} else {
		to_insert = n+" "+many;
	};
	return to_insert;
}
function refreshProjectsListing () {
	criterias = getSearchCriterias('#Projects');
	n = displayItem('.Project', criterias)
	to_insert = displayResults (n, no_project, project, projects);
	$('#Projects .autoComplete').html('<span>'+to_insert+"</span>");
	if ($('body.Projects').length == 0) {
		$('#map .container').css( 'height', valueToDigit( $('#content').outerHeight()) - 5 );
	};
	if ($('#map div.point').length > 0 ) {
		displayItem('#map .point', criterias);
		if ( $('#content').outerHeight() < $('#map_container').outerHeight() ) {
			$('#content').css('height', $('#map_container').outerHeight() -16 );
		};
	};
	$('#content').css( 'height', $('#media').outerHeight() );
}

function expandNavigation (element) {
	if ($('#navigation ul>li>ul:visible').length == 0 || $(element).next('ul:visible').length > 0) {
		$(element).next('ul').slideToggle('fast');
	} else {
		$('#navigation ul>li>ul:visible').slideUp('fast', function() {
			$(element).next('ul').slideToggle('fast');
		});
	}
}

function submenuToggle (menu) {
	li = $(menu+" li").length;
	li_v = $(menu+" li:visible").length;
	if (li_v == 0 || li_v == li) {
		$(menu+" li").slideToggle();
	} else {
		$(menu+" li:hidden").slideToggle();
	};
}
function zoomImg (fullpath) {
	path = fullpath.replace('http://bma.officity.com/Files', '');
	path = path.replace('http://bmabru.be/Files', '');
	path = path.replace('http://www.bmabru.be/Files', '');
	img = $('img[src*="'+path+'"]');
	info = img.attr('alt');
	w = img.width();
	h = img.height();
	ratio = w / h;
	if (ratio > 1.2) {
		dimension = '&width=970';
		iW = '970px';
	} else {
		dimension = '&height=500';
		iW = Math.round(ratio*500)+'px';
	};
	$('#lightbox_container .autoComplete').html('<img src="img_resize.php?path='+path+dimension+'"/>');
	$('#lightbox').slideToggle();
	$('#lightbox ul.tools').css('width', iW);
	$('#lightbox li.info').text(info);
	$('body').css('overflow', 'hidden');
}
function closeLB () {
	$('#lightbox').slideToggle('fast', function() {
		$('#lightbox_container .autoComplete').html('');
		$('#lightbox li.info').text('');		
		$('body').css('overflow', 'auto');
	});	
}
function checkForm (form) {
	button = $(form+" .button_container").html();
	$(form+" .button_container").html('').addClass('loading');
	fields = form+" input.mandatory, "+form+" select.mandatory, "+form+" textarea.mandatory";
	valid = 1;
	$(form+" label").removeClass('alert');
	$(fields).map(function () {
		if ($(this).val() == "") {
			valid = 0;
			$(this).siblings('label').addClass('alert');
		}
	});
	if (valid == 1) {
		$(form).submit()
	} else {
		alert(GetLabel(fill_mandatory_fields));
		$(form+" .button_container").html(button).removeClass('loading');
	};
}
function expandProjectsForm () {
	p = $('#Projects');
	if (p.hasClass('expand') == true) {
		p.children('div').slideUp();
		p.removeClass('expand');
	} else {
		p.children('div').slideDown('fast', function (){
			if (p.hasClass('placed') == false) {
				elementToColumnByHeight('#Projects ul.Localites', 4);
				elementToColumnByHeight('#Projects ul.Typology', 4);
				p.addClass('placed');
			};
			p.addClass('expand');
			resizeContent();
		});
	}
}
function resizeContent () {
	w_h = $(window).height();
	toMatch = $('#map .container');
	rec = 0;
	min_h = $('#content .media').outerHeight();
	max_h = w_h;
	if ( min_h < $('#content .navigation').outerHeight() ) {
		min_h = $('#content .navigation').outerHeight() + 15;
	};
	if (toMatch.length == 0) {
		toMatch = $('.bigpicture.vertical');
		min_h = $('.bigpicture.vertical img').outerHeight();
		max_h = $('.bigpicture.vertical img').outerHeight();
	};
	if ( $('body.Projects').length > 0) {
		rec = 10;
	} else if ( $('body.Project').length > 0 ) {
		rec = 4;
	} else if ( $('body.Website').length == 0 ) {
		rec = 15;
	}
	if ( toMatch.length > 0) {
		c_h = $('#content .media').outerHeight() + 15;
		if ($('body').hasClass('Website') == true) {c_h = $('#content .mediaContent').outerHeight()};
		m_h = w_h-90;
		if (m_h > 1061) { 
			m_h = 1061;
		} else if (m_h < min_h) {
			m_h = min_h;
		}
		st = $(window).scrollTop();
		if (m_h > c_h) {
			$('#content').css('height', m_h - rec);
			toMatch.css('height', m_h);
//			$('body').attr('alors', '1').attr('m_h', m_h).attr('c_h', c_h).attr('scroll', st).attr('wh', w_h);
		} else if (m_h > c_h - 45){
			toMatch.css('height', w_h -46);
			$('#content').css('height', c_h);
//			$('body').attr('alors', '2').attr('m_h', m_h).attr('c_h', c_h).attr('scroll', st).attr('wh', w_h);
		} else {
			m_h = m_h + 44 - rec ;
			if (m_h > max_h) { m_h = max_h;};
			$('#content').css('height', c_h);
			toMatch.css('height', m_h);
//			$('body').attr('alors', '3').attr('m_h', m_h).attr('c_h', c_h).attr('scroll', st).attr('wh', w_h);
		}
		if ($('body.Projects').length > 0) {
			t_h = $('#map').outerHeight() - $('#Projects').outerHeight() - 6;
			$('#content .data').css({height: t_h});
		};
		adjustMapHeight();
	}
}
function lbInit () {
	if ($('#lightbox').length > 0) {
		$('#lightbox_container').hover(function(){ 
	        mouse_is_inside=true; 
	    }, function(){ 
	        mouse_is_inside=false; 
	    });
	    $('#lightbox').mousedown(function(){ 
	        if(! mouse_is_inside) {
				closeLB();
		}
	    });
	};
}
function ie7PlaceContractedMap () {
	if ($('body.Website').length > 0) {
		sc_h = $('#content .mediaSideContent').outerHeight();
		n_m_h = mapHeight - sc_h + 49;
		$('#map').css({height: n_m_h, top: 46+sc_h});
	} else if( $('body.Section').length > 0 ) {
		sc_h = $('#direct_access .medias').outerHeight();
		n_m_h = mapHeight - sc_h + 44;
		$('#map').css({height: n_m_h/*, top: 45+sc_h*/});
	}
	}

function initMap () {
	if ($('#map').length > 0) {
		c_h = $('#content').outerHeight();
		c_w = $('#content').outerWidth();
		$('#map_container').mapbox({pan:true});						
		ID = $('body').attr('id');
		$.get('loadMapProjects.php',{ID:ID},function(data) {
			placed_item = $('#map_bg .projects').html();
			objects_to_place = placed_item+data;
			$('#map_bg .projects').html(objects_to_place);
			placeProjects();
			if ($('body.Projects').length == 0) {
				// get projects info for listing
				if ($('#map .p_listing').children().length == 0) {
					p_list = '';
					$('#map div.point').map(function(){
						tc = $(this).attr('class');
						td = $(this).children('div.details').html();
						p_list += '<div class="Project '+tc+'">'+td+'</div>';
					});
					var reg=new RegExp("<h4>", "g");
					p_list = p_list.replace(reg, '<h3><span>');
					var reg=new RegExp("</h4>", "g");
					p_list = p_list.replace(reg, '</span></h3>');
					$('#map_container .p_listing').append(p_list);
				};				
			};
			if ($('body.Project').length > 0) {
				$('#map .point').hide();
				$('#map .point#p'+ID).show();
				mapFocus('#p'+ID);
				$('#p'+ID+'p.more').hide();
			}
		});
	}
}
function adjustMapHeight () {
	w_h = $(window).height();
	s_h = $(window).scrollTop();
	c_h = 45+$('#content').outerHeight();
	if (c_h > w_h) {
		adj = c_h - w_h - s_h;
		$('body').attr('adj', adj).attr('sh', s_h);
		if (adj < 0 && adj > -20 ) {
			n_h = $('#content').outerHeight() - s_h + adj + 9;
			$('#map_container').css({height: n_h});
			$('body').attr('n_h', n_h);
		} else {
			$('#map_container').css({height: w_h - 45});
		}
	};
}
function initPage () {
	original_content_height = $('#content').outerHeight();
	original_body_height = $('body').outerHeight();
	lbInit();	
	resizeContent();
	$(window).load(function(){resizeContent();});
	$(window).scroll(function(){adjustMapHeight();})
	if ($('#map div.projects>div.point').length > 0) {
		placeProjects();
//		initLegendItemActivity();
	};
	if ($('#Projects').length > 0) {
		ncols = 4;
		if ( $('body.Website').length > 0 ) {
			ncols = 5;
		}
		elementToColumnByHeight('#Projects ul.Localites', ncols);
		elementToColumnByHeight('#Projects ul.Typology', ncols);
	};
	initMap();
}
function elementToColumnByItem (element, cols, mBottom, mRight) {
	n = $(element).children(':visible').length;
	margins = (cols - 1) * mRight;
	w = Math.floor( ($(element).outerWidth() - margins) / cols );
	lines = Math.ceil(n / cols);
	if (mBottom == undefined | mBottom == "") {mBottom = 0};
	if (mRight == undefined | mRight == "") {mRight = 0};
	max_h = 0;
	for (var i=0; i < cols; i++) {
		x = w*i;
		if ( i > 0) { x+=mRight;};
		height = 0;
		for (var j=0; j < lines; j++) {
			e = lines * i + j;
			y = height + (mBottom * j);
			$(element).children().eq(e).css({ position:'absolute', top:y, left:x, width:w});
			height += $(element).children().eq(e).outerHeight();
		};
		if (height > max_h) {
			max_h = height;
		};
	};
	$(element).css({height: max_h});
}
function elementToColumnByHeight (element, cols) {
	$(element).css({height: 'auto'});
	$(element).children('li').css({position: 'static'});
	n = $(element).children().length;
	w = Math.floor( $(element).outerWidth() / cols );
	av_h = Math.floor( $(element).outerHeight() / cols ) + 10;
	ny = 0;
	y = 0;
	x = 0;
	max_h = 0;	
	for (var i=0; i < n; i++) {
		if (i == 0) {x=10;};
		ny = y + $(element).children('li').eq(i).outerHeight();
		if ( ny > av_h && y > 0) {
			if (y > max_h) {
				max_h = y;
			};
			y = 0;
			x += w;
		} else {
			if (ny > max_h) {
				max_h = ny;
			};
		}
		$(element).children().eq(i).css({ position:'absolute', top:y, left:x});
		y += $(element).children().eq(i).outerHeight();				
	};
	$(element).css({height: max_h});
}

$(document).ready(function() {initPage();});
$(window).resize(function(){resizeContent();});