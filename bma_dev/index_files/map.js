function gpsToPixel(media, px, py){
	// le point à placer
	/*
	px = 4.354909769299402;
	py = 50.86277365021736;
	*/
	// limites de la carte en X
	xa = 4.2287735849;
	xb = 4.504009433956604;
	// limites de la carte en Y
	ya = 50.92208;
	yb = 50.75232;
	// dimensions de la carte en °’"
	w = xa - xb;
	h = ya - yb;
	// place du point dans la carte par rapport aux limites(0,0)
	x = px - xa;
	y = py - ya;
	// dimensions de la cartes en px
	wpx = 1167;
	hpx = 1061;
	// position du point en px
	xpx = Math.round(x / w * wpx * -1) - 20;
	ypx = Math.round(y / h * hpx * -1);
	$(media).css({top: ypx, left: xpx});
//	alert(media+" "+xpx+" "+ypx);
}
function placeProjects () {
	$('#map div.projects>div.point').not('.nogeo').map(function () {
		media = "#"+$(this).attr('id');
		px = $(this).attr('longitude');
		py = $(this).attr('latitude');
		gpsToPixel( media, px, py );
		$(this).mouseleave(function () {
			rollOutExpandedPoint(this);
		});	
		$(this).children('a.mark').mouseenter(function () {
			rollOverBasicPoint(this);
		});
		$(this).children('a.mark').mousedown(function () {
			clickBasicPoint(this)
		});
	});
	initLegendItemActivity();
	n = $("#map .point").length;
	to_insert = displayResults(n, no_project, project, projects);
	$('#Projects .autoComplete').html(to_insert);
}

function rollOverBasicPoint (mark) {
	// pour uniquement le a.mark
	$(mark).next('div.details').fadeIn('fast').addClass('display');
	$(mark).parent('div.point').addClass('over');
	ne = $(mark).next('div.details');
	//check if outside map - bottom
	ne_l = ne.outerHeight() + valueToDigit( ne.offset().top );
	mch = $('#map_container').outerHeight() + valueToDigit( $('#map_container').offset().top );			
	if (mch < ne_l) {
		d = -1 * (ne_l - mch + 4);
		ne.css('top', d);
	};
	//check if outside map - right
	ne_r = ne.outerWidth() + valueToDigit( ne.offset().left );
	mcw = $('#map_container').outerWidth() + valueToDigit( $('#map_container').offset().left );
	if (mcw < ne_r) {
	//		d = -1 * (ne_l - mch + 4);
		ne.css('left', -165);
	};
	
	
}
function rollOutExpandedPoint (point) {
	// pour tout le DIV.point
	if ( $(point).hasClass('pined') == false ) {
		$(point).children('div.details').fadeOut('fast').removeClass('display');
		$(point).removeClass('over');
	} 
}
function clickBasicPoint (mark) {
	// pour uniquement le a.mark
	$('#map .pined>.details').hide();
	if ( $(mark).parent().hasClass('pined') == true ) {
		//on cache
		$(mark).parent('div.point').removeClass('over').removeClass('pined');	
		$(mark).next('div.details').fadeOut('fast');
		$(mark).next('div.details').removeClass('display');
	} else {
		//on affiche
		$(mark).next('div.details').removeClass('display');
		$(mark).next('div.details').fadeIn('fast');
		$(mark).parent('div.point').removeClass('over').addClass('pined');	
	}
}

function refreshProjectsMap () {
	criterias = getSearchCriterias('#MapProjects');
	n = displayItem('#map .point', criterias);
	to_insert = displayResults(n, no_project, project, projects);
	$('#MapProjects .autoComplete').html('<span>'+to_insert+"</span>");
}
function getSearchCriteriasFromLegend (form) {
	var criterias = "";
	$(form+" ul a.active").map(function () {
		if ($(this).attr('value') != '') {
			criterias += '.'+$(this).attr('value');
		};
	});
	return criterias;
}

function refreshProjectsMapFromLegend (element) {
	if ($(element).hasClass('inactive') == false ) {
		p = "ul."+$(element).parents('ul').attr('class');
		$(p+" a").removeClass('active');
		$(element).addClass('active');
		criterias = getSearchCriteriasFromLegend('#Projects');
		n = displayItem('#map .point', criterias);
		refreshLegendItemActivity(criterias);
		to_insert = displayResults(n, no_project, project, projects);
		$('#Projects .autoComplete').html(to_insert);
	};
}
function refreshProjectsMapAndListingFromLegend (element) {
	if ( $(element).hasClass('inactive') == false ) {
//		$('#content .specific .data>div.Project').css({position: 'static', top:'', left:'' });
		p = "ul."+$(element).parents('ul').attr('class');
		$(p+" a").removeClass('active');
		$(element).addClass('active');
		criterias = getSearchCriteriasFromLegend('#Projects');
		n = displayItem('#map .point', criterias);
		n = displayItem('#content tr.Project', criterias);
		refreshLegendItemActivity(criterias);		
		to_insert = displayResults(n, no_project, project, projects);
		$('#Projects .autoComplete').html(to_insert);		
		//elementToColumnByItem('#content .specific .data', 2, 5, 1);	
		resizeContent();	
	};
}

function legendActivateItem (element, v) {
	if (v != "") {
		if ( $('#map_bg .projects>div.'+v).length == 0 ) {
			$(element).addClass('inactive');
		} else {
			$(element).removeClass('inactive');
		}
	};
}
function refreshLegendItemActivity (criterias) {
	if (criterias != '') {
		$('#Projects ul').map(function() {
			if ( $(this).find('li.l_title a').hasClass('active') == true ) {
				$(this).find('a').map(function(){
					v = criterias +'.'+ $(this).attr('value');
					legendActivateItem(this, v);
				});
			
			};
		});
	} else {
		initLegendItemActivity();
	};
}
function initLegendItemActivity () {
	$('#Projects ul li a').map( function(){
		v = $(this).attr('value');
		legendActivateItem(this, v);
	});
}
function mapFocus (element) {
	if ($(element).hasClass('nogeo') == false) {
		$(element).show();
		ne = $(element+" div.details");
		p = $(element+" a.mark");
		/*if (ne.hasClass('fixed') == true) {
			mouseDownPointFixed(p, ne);
		} else {
		*/	//centered the map		
			x_to = $('#map_container').outerWidth() * 0.33 + $('#map_container').offset().left;
			x_from = $(element).offset().left;
			x_move = Math.round(x_from - x_to);
			y_from = $(element).offset().top - $(window).scrollTop();
			y_to = Math.round($(window).height() * 0.33);
			y_move = y_from - y_to;
			//
			$('#map_bg').animate({top:"-="+y_move, left: "-="+x_move},"slow", function () {
				clickBasicPoint(p);
			});
	//	}
	};
}
