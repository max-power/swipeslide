(function($) {
  $.fn.swipeSlide = function(options) {
    var options = $.extend({
      content_selector: 'ul', // parent element of the slides
      vertical: false,   
      tolerance:0.3,     // values between 0 and 1, where 1 means you have to drag to the center of the slide
      delay: 0.3,        // animation speed in seconds
      bullets: 'link',   // false, true or link (event handlers will be attached)
      fancy_cursor: true
    }, options);

    return this.each(function(index) {
      var touch = {}, current_slide = 0, nav_bullets,
          self   = $(this).addClass('ui-swipeslide').addClass('ui-swipeslide-' + (options.vertical ? 'vertical' : 'horizontal')),
          reel   = self.find(options.content_selector).first().addClass('ui-swipeslide-content'),
          slides = reel.children().addClass('ui-swipeslide-slide');

      if (options.bullets) build_bullets();

      $(window).bind('resize', init); init();

      reel.bind('mousedown touchstart', function(e) {
        /* if (e.touches && e.touches.length > 1) return container.trigger('touchend'); */
        touch.x1 = touch.x2 = e.pageX || e.touches[0].pageX;
        touch.y1 = touch.y2 = e.pageY || e.touches[0].pageY;
        e.preventDefault();
      }).bind('mousemove touchmove', function(e){
        if (!touch.x1 || !touch.x2) return;
        touch.x2 = e.pageX || e.touches[0].pageX;
        touch.y2 = e.pageY || e.touches[0].pageY;
        var distance = swipe_distance(touch);
        if (Math.abs(distance) > container_dimension()) {
          return reel.trigger('touchend');
        }
        recalculate_position(distance);
      }).bind('mouseup mouseout touchend touchcancel touchleave', function(e) {
        var distance  = swipe_distance(touch);
        var tolerance = options.tolerance * container_dimension() / 2;
        if (Math.abs(distance) > tolerance) {
          current_slide = distance < 0 ? next_slide() : prev_slide();
        }
        recalculate_position(0, options.delay);
        touch = {};
      })
      
      function init() {
          reel.css(options.vertical ? 'height' : 'width', container_dimension() * slides.length + 'px');
        slides.css(options.vertical ? 'height' : 'width', container_dimension() + 'px');
        recalculate_position();
      }
      function recalculate_position(distance, delay) {
        var values   = ['0px','0px','0px'];
        var position = -1 * current_slide * container_dimension() + (distance || 0);
        values[options.vertical ? 1 : 0] = position + 'px';
        reel.anim({translate3d: values.join(',') }, delay || 0);
        slides.removeClass('active').eq(current_slide).addClass('active');
        if (options.fancy_cursor) set_cursor();
        if (options.bullets) set_active_bullet();
      }
      function container_dimension() {
        return parseInt(self.css(options.vertical ? 'height' : 'width'), 10);
      }
      function swipe_distance(t) {
        return options.vertical ? (t.y2 - t.y1) : (t.x2 - t.x1);
      }
      function prev_slide() { return Math.max(current_slide-1, 0); }
      function next_slide() { return Math.min(current_slide+1, slides.length-1); }

      /* optional fancy stuff */
      function set_cursor() {
        var c;
        switch(current_slide) {
          case 0:                 c = options.vertical ? 'n' : 'w'; break;
          case slides.length - 1: c = options.vertical ? 's' : 'e'; break;
          default:                c = options.vertical ? 'ns' : 'ew';
        };
        reel.css('cursor', c + '-resize');
      }
      
      function build_bullets() {
        var s = ''; for (i=0; i<slides.length; i++) s+='<li data-index="'+i+'">'+i+'</li>';
        nav_bullets = $('<ul class="ui-swipeslide-bullets"></ul>').html(s);
        self.append(nav_bullets);
        if (options.bullets == 'link') {
          nav_bullets.delegate('li', 'click', function() {
            current_slide = (parseInt($(this).attr('data-index'), 10))
            recalculate_position(0, options.delay);
          });
        }
      }
      function set_active_bullet() {
        nav_bullets.children('li').removeClass('active').eq(current_slide).addClass('active');
      }
    })
  }
})(Zepto);
