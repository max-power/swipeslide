(function($) {
  $.fn.swipeSlide = function(options) {
    // Merge passed options with defaults
    var options = $.extend({
      contentSelector: 'ul',        // parent element of the slides
      vertical: false,              // horizontal or vertical
      tolerance:0.3,                // values between 0 and 1, where 1 means you have to drag to the center of the slide
      delay: 0.3,                   // animation speed in seconds
      bulletNavigation: 'link',     // false, true or link (event handlers will be attached)
      directionalNavigation: false, // will inset previous and next links
      touchNavigation: true,        // will bind touch events. you don't need this if you don't develop for iOS devices.
      fancyCursor: true,            // this you won't see on touch based devises.
      threeD: false,                // 3D Carousel instead of linear slider
      preventDefault: true ,        // prevent horizontal or vertical scroll event
      visibleSlides: 1,             // number of slides visible at the same time
      change: null                  // after slide transition callback
    }, options);

    var touchScreen = 'ontouchstart' in document.documentElement;

    return this.each(function(index) {

      // Initialize element variables.
      var self = $(this),
          reel = self.find(options.contentSelector).first(),
          slides = reel.children();

      // Do not swipeslide if no slides or multiple reels.
      if (reel.length != 1 || slides.length <= 1) return;

      // Add swipeslide css classes.
      self.addClass('ui-swipeslide').addClass('ui-swipeslide-' + (options.vertical ? 'vertical' : 'horizontal')).addClass(options.threeD ? 'ui-swipeslide-3d' : '');
      reel.addClass('ui-swipeslide-content');
      slides.addClass('ui-swipeslide-slide');

      // Initialize remaining variables.
      var touch  = {}, currentSlide = 0, navBullets,
          alpha  = 360/slides.length * (options.vertical ? -1 : 1), revolution = radius = 0,
          // number of "screens"
          nbBullets = Math.ceil(slides.length / options.visibleSlides);

      if (options.bulletNavigation) buildBulletNavigation();
      if (options.directionalNavigation) buildDirectionalNavigation();

      init(); $(window).bind('resize', init);

      /* bind touch events */
      if (options.touchNavigation) {
        // Save the position where the user started to touch the current slide
        reel.bind(touchScreen ? 'touchstart' : 'mousedown', function(e) {
          /* if (e.touches && e.touches.length > 1) return container.trigger('touchend'); */
          touch.x1 = touch.x2 = e.pageX || e.touches[0].pageX;
          touch.y1 = touch.y2 = e.pageY || e.touches[0].pageY;
          if (!e.touches) e.preventDefault();
        })
          // Save the position where the user is moving the current slide, and move it
          .bind(touchScreen ? 'touchmove' : 'mousemove', function(e){
          // Don't do anything if the mousedown/touchstart events didn't happen
          if (!touch.x1 || !touch.x2) return;
          touch.x2 = e.pageX || e.touches[0].pageX;
          touch.y2 = e.pageY || e.touches[0].pageY;
          var distance = swipeDistance(touch);
          // Don't move if it's the (First slide + right swipe) or (Last slide + left swipe).
          
          if (!options.threeD && (currentSlide==0 && distance > 0) || (currentSlide==slides.length-1 && distance < 0)) {
            moveSlider();
          } else {
            if (options.preventDefault) e.preventDefault();
            moveSlider(distance);
          }
        })
          // Save the position where the user is releasing the current slide, and move it
          .bind(touchScreen ? 'touchend touchcancel touchleave' : 'mouseup mouseout', function(e) {
          var distance  = swipeDistance(touch);
          var tolerance = options.tolerance * containerDimension() / 2;
          if (Math.abs(distance) > tolerance) {
            currentSlide = distance < 0 ? nextSlide() : prevSlide();
            moveSlider(0, options.delay, options.change);
          } else {
            moveSlider(0, options.delay);
          }
          // Reinitialize the touch object for the next touch events
          touch = {};
        });
      }

      /* bind listeners to any elments with '.prev' or '.next' class */
      self.delegate('.next', touchScreen ? 'touchend' : 'click', function(){ currentSlide = nextSlide(); moveSlider(0, options.delay, options.change); })
          .delegate('.prev', touchScreen ? 'touchend' : 'click', function(){ currentSlide = prevSlide(); moveSlider(0, options.delay, options.change); })
          .delegate('.first',touchScreen ? 'touchend' : 'click', function(){ currentSlide = 0; moveSlider(0, options.delay, options.change); })
          .delegate('.last', touchScreen ? 'touchend' : 'click', function(){ currentSlide = slides.length-1; moveSlider(0, options.delay, options.change); });

      /**
       * Initalize the slider
       *
       * Set css properties on the slider and the current slide
       */
      function init() {
        var c = containerDimension();
          reel.css(options.vertical ? 'height' : 'width', c * (options.threeD ? 1 : nbBullets)+'px');
        slides.css(options.vertical ? 'height' : 'width', (c / options.visibleSlides)+'px');
        
        if (options.threeD) {
          radius = Math.round( (c/2) / Math.tan(Math.PI / slides.length) );
          slides.each(function(i, slide) {
            var vectors = [0,0,0];
            vectors[options.vertical ? 0 : 1] = 1;
            $(slide).css('-webkit-transform', 'rotate3d('+vectors.join(',')+','+ (alpha * i)+'deg) translate3d(0,0,'+radius+'px)');
          });
        }
        moveSlider();
      }

      /**
       * Animate the slides
       *
       * @param distance Integer the distance to add to the slides movement in pixels
       * @param delay Integer the delay in seconds before moving the slides
       */
      function moveSlider(distance, delay, callback) {
        opts = { duration: ((delay || 0) * 1000), complete: callback };
        reel.animate(animationProperties(distance || 0), opts)
        slides.removeClass('active').eq(currentSlide).addClass('active');
        if (options.fancyCursor && options.touchNavigation) setCursor();
        if (options.bulletNavigation) setActiveBullet();
      }

      /**
       * Calculate the tridimensionnal amount of movement necessary to apply to the slides
       *
       * @param distance Integer the distance to add to the slides movement in pixels
       * @return Object the css properties to animate and their values
       */
      function animationProperties(distance) {
        var vectors = [0,0,0];
        if (options.threeD) {
          var delta = (-currentSlide * alpha) - (revolution * 360) + (alpha * (distance/containerDimension()));
          vectors[options.vertical ? 0 : 1] = 1;
          return { translate3d: '0,0,'+ -radius + 'px', rotate3d: vectors.join(',') +','+ delta + 'deg' }
        } else {
          var position = -currentSlide * (containerDimension() / options.visibleSlides) + distance;
          if (options.vertical) {
            return { translateY: position + 'px' }
          } else {
            return { translateX: position + 'px' }
          }
        }
      }

      /**
       * Calculate the container dimension
       *
       * @return Integer the container dimension in pixels
       */
      function containerDimension() {
        return parseInt(self.css(options.vertical ? 'height' : 'width'), 10);
      }

      /**
       * Calculate the distance swiped by the user
       *
       * @param t Object the touch object that holds the touched positions
       * @return Integer the swiped distance in pixels
       */
      function swipeDistance(t) {
        return options.vertical ? (t.y2 - t.y1) : (t.x2 - t.x1);
      }

      /**
       * Calculate the index of the previous slide
       *
       * @return Integer the index of the previous slide
       */
      function prevSlide() {
        var p = currentSlide-options.visibleSlides;
        if (options.threeD) {
          if (p < 0) { p = slides.length + p; revolution--; }
          return Math.abs(p % slides.length);
        }
        return Math.max(p, 0);
      }

      /**
       * Calculate the index of the next slide
       *
       * @return Integer the index of the next slide
       */
      function nextSlide() {
        var n = currentSlide+options.visibleSlides;
        if (options.threeD) {
          if (n / slides.length == 1) revolution++;
          return n % slides.length;
        }
        return Math.min(n, slides.length-1);
      }

      /* optional fancy stuff */
      function setCursor() {
        var c = options.vertical ? 'ns' : 'ew';
        if (!options.threeD) {
          switch(currentSlide) {
            case 0:                 c = options.vertical ? 'n' : 'w'; break;
            case slides.length - 1: c = options.vertical ? 's' : 'e'; break;
          }
        }
        reel.css('cursor', c + '-resize');
      }

      /* bullet navigation */
      function buildBulletNavigation() {
        var s = '';
        for (i=0; i<nbBullets; i++) s+='<li data-index="'+(i*options.visibleSlides)+'">'+(i*options.visibleSlides+1)+'</li>';
        navBullets = $('<ul class="ui-swipeslide-bullets"></ul>').html(s);
        if (options.bulletNavigation == 'link') {
          navBullets.delegate('li', touchScreen ? 'touchend' : 'click', function() {
            currentSlide = (parseInt($(this).attr('data-index'), 10));
            moveSlider(0, options.delay, options.change);
          });
        }
        self.append(navBullets);
      }

      function setActiveBullet() {
        navBullets.children('li').removeClass('active').eq(currentSlide/options.visibleSlides).addClass('active');
      }

      /* prev/next navigation */
      function buildDirectionalNavigation() {
        self.append('<ul class="ui-swipeslide-nav"><li class="prev">Previous</li><li class="next">Next</li></ul>');
      }
    })
  }
})(Zepto);