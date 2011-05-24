(function($) {
  $.fn.swipeSlide = function(options) {
    var options = $.extend({
      content_selector: 'ul', // parent element of the slides
      vertical: false,   
      tolerance:0.3,     // values between 0 and 1, where 1 means you have to drag to the center of the slide
      delay: 0.3,        // animation speed in seconds
      bullet_navigation: 'link',   // false, true or link (event handlers will be attached)
      directional_navigation: false,
      touch_navigation: true,
      fancy_cursor: true,
      threeD: false
    }, options);

    return this.each(function(index) {
      var touch  = {}, current_slide = 0, nav_bullets,
          self   = $(this).addClass('ui-swipeslide').addClass('ui-swipeslide-' + (options.vertical ? 'vertical' : 'horizontal')).addClass(options.threeD ? 'ui-swipeslide-3d' : ''),
          reel   = self.find(options.content_selector).first().addClass('ui-swipeslide-content'),
          slides = reel.children().addClass('ui-swipeslide-slide'),
          alpha  = 360/slides.length * (options.vertical ? -1 : 1), revolution = radius = 0;

      if (options.bullet_navigation) build_bullet_navigation();
      if (options.directional_navigation) build_directional_navigation();

      init(); $(window).bind('resize', init);

      /* bind touch events */
      if (options.touch_navigation) {
        reel.bind('mousedown touchstart', function(e) {
          /* if (e.touches && e.touches.length > 1) return container.trigger('touchend'); */
          touch.x1 = touch.x2 = e.pageX || e.touches[0].pageX;
          touch.y1 = touch.y2 = e.pageY || e.touches[0].pageY;
          if (!e.touches) e.preventDefault();
        }).bind('mousemove touchmove', function(e){
          if (!touch.x1 || !touch.x2) return;
          e.preventDefault();
          touch.x2 = e.pageX || e.touches[0].pageX;
          touch.y2 = e.pageY || e.touches[0].pageY;
          var distance = swipe_distance(touch);
          // if (Math.abs(distance) > container_dimension()) { return reel.trigger('touchend'); }
          move_slider(distance);
        }).bind('mouseup mouseout touchend touchcancel touchleave', function(e) {
          var distance  = swipe_distance(touch);
          var tolerance = options.tolerance * container_dimension() / 2;
          if (Math.abs(distance) > tolerance) {
            current_slide = distance < 0 ? next_slide() : prev_slide();
          }
          move_slider(0, options.delay);
          touch = {};
        });
      }
      
      /* bind listeners to any elments with '.prev' or '.next' class */
      self.delegate('.next', 'click', function(){ current_slide = next_slide(); move_slider(0, options.delay); })
          .delegate('.prev', 'click', function(){ current_slide = prev_slide(); move_slider(0, options.delay); })
          .delegate('.first','click', function(){ current_slide = 0; move_slider(0, options.delay); })
          .delegate('.last', 'click', function(){ current_slide = slides.length-1; move_slider(0, options.delay); });
      
      function init() {
        var c = container_dimension();
          reel.css(options.vertical ? 'height' : 'width', c * (options.threeD ? 1 : slides.length)+'px');
        slides.css(options.vertical ? 'height' : 'width', c+'px');
        
        if (options.threeD) {
          radius = Math.round( (c/2) / Math.tan(Math.PI / slides.length) );
          slides.each(function(i, slide) {
            var vectors = [0,0,0];
            vectors[options.vertical ? 0 : 1] = 1;
            $(slide).css('-webkit-transform', 'rotate3d('+vectors.join(',')+','+ (alpha * i)+'deg) translate3d(0,0,'+radius+'px)');
          });
        }
        move_slider();
      }
      function move_slider(distance, delay) {
        reel.anim(animation_properties(distance || 0), delay || 0);
        slides.removeClass('active').eq(current_slide).addClass('active');
        if (options.fancy_cursor && options.touch_navigation) set_cursor();
        if (options.bullet_navigation) set_active_bullet();
      }
      function animation_properties(distance) {
        var vectors = [0,0,0];
        if (options.threeD) {
          var delta = (-current_slide * alpha) - (revolution * 360) + (alpha * (distance/container_dimension()));
          vectors[options.vertical ? 0 : 1] = 1;
          return { translate3d: '0,0,'+ -radius + 'px', rotate3d: vectors.join(',') +','+ delta + 'deg' }
        } else {
          var position = -current_slide * container_dimension() + distance;
          vectors[options.vertical ? 1 : 0] = position + 'px';
          return { translate3d: vectors.join(',') }
        }
      }
      function container_dimension() {
        return parseInt(self.css(options.vertical ? 'height' : 'width'), 10);
      }
      function swipe_distance(t) {
        return options.vertical ? (t.y2 - t.y1) : (t.x2 - t.x1);
      }
      function prev_slide() {
        var p = current_slide-1;
        if (options.threeD) {
          if (p < 0) { p = slides.length + p; revolution--; }
          return Math.abs(p % slides.length);
        }
        return Math.max(p, 0);
      }
      function next_slide() { 
        var n = current_slide+1;
        if (options.threeD) {
          if (n / slides.length == 1) revolution++;
          return n % slides.length;
        }
        return Math.min(n, slides.length-1);
      }

      /* optional fancy stuff */
      function set_cursor() {
        var c = options.vertical ? 'ns' : 'ew';
        if (!options.threeD) {
          switch(current_slide) {
            case 0:                 c = options.vertical ? 'n' : 'w'; break;
            case slides.length - 1: c = options.vertical ? 's' : 'e'; break;
          }
        }
        reel.css('cursor', c + '-resize');
      }
      /* bullet navigation */
      function build_bullet_navigation() {
        var s = ''; for (i=0; i<slides.length; i++) s+='<li data-index="'+i+'">'+(i+1)+'</li>';
        nav_bullets = $('<ul class="ui-swipeslide-bullets"></ul>').html(s);
        if (options.bullet_navigation == 'link') {
          nav_bullets.delegate('li', 'click', function() {
            current_slide = (parseInt($(this).attr('data-index'), 10));
            move_slider(0, options.delay);
          });
        }
        self.append(nav_bullets);
      }
      function set_active_bullet() {
        nav_bullets.children('li').removeClass('active').eq(current_slide).addClass('active');
      }
      /* prev/next navigation */
      function build_directional_navigation() {
        self.append('<ul class="ui-swipeslide-nav"><li class="prev">Previous</li><li class="next">Next</li></ul>');
      }
    })
  }
})(Zepto);
