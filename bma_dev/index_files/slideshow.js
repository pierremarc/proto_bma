var ss_i = 0;
var slideshow;
var ss_i_total;

function resizeSS () {
	var ss_height = 0;
	slideshow.children('div:visible').map(function() {
		ss_height += valueToDigit( $(this).outerHeight(true) );
	});
	slideshow.animate({height:ss_height}, 'slow', function() {
		resizeContent();
	});
	
}

function displaySSItem (item) {
	if (ss_i < ss_i_total) {
		slideshow.children('.active').removeClass('active');
		item.addClass('active');	
		i_duration = item.attr('duration');
		if (i_duration == '' | i_duration == undefined) {
			i_duration = ss_duration;
		};
		js_fun = item.attr('script');
		if (js_fun == '' | js_fun == undefined) {
			js_fun = 'displaySSItem( slideshow.children().eq(ss_i) )';
		};
		if (ss_i == 0 | item.prev().attr('disappear') == 0) {
			item.slideDown('fast', function() {
				ss_timer = setTimeout(js_fun, i_duration);
			});
		} else {
			item.prev().hide();
			item.show();
			ss_timer = setTimeout(js_fun, i_duration);
		};
		ss_i++;
	} else {
		resizeSS();
	};
}

function startSlideShow () {
	displaySSItem(slideshow.children().eq(ss_i));
}

function initSlideShow () {
	slideshow = $('#'+ss_id);
	ss_i_total = slideshow.children().length;
	if (ss_status == 'play') {
		$(window).load(function(){startSlideShow();});
	} else {
		slideshow.children().last().addClass('active');
	}
}
$(document).ready(function() {initSlideShow();});
