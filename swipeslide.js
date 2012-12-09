var SwipeSlide = function(container, options){
  this.options = $.extend({
    first: 0,                     // the first visible slide on initialization
    visibleSlides: 1,             // number of slides visible at the same time
    vertical: false,              // horizontal or vertical
    tolerance:0.5,                // values between 0 and 1, where 1 means you have to drag to the center of the slide (a value of 1 equals the ios behaviour)
    delay: 0.3,                   // animation speed in seconds,
    autoPlay: false,              // false, or value in seconds to start auto slideshow
    useTranslate3d: true,
    bulletNavigation: 'link',    // false, true or 'link' (event handlers will be attached)
    directionalNavigation: false,  // will inset previous and next links
    onChange: null,              // after slide transition callback
  }, options)

  this.container   = $(container).addClass('ui-swipeslide').addClass('ui-swipeslide-'+['horizontal','vertical'][+this.options.vertical])
  this.reel        = this.container.children().first().addClass('ui-swipeslide-reel')
  this.slides      = this.reel.children().addClass('ui-swipeslide-slide')
  this.numPages    = Math.ceil(this.slides.length / this.options.visibleSlides)
  this.currentPage = this.validPage(this.options.first)
  this.isTouch     = 'ontouchstart' in document.documentElement
  this.touch       = {}
  
  if (this.options.bulletNavigation) this.setupBulletNavigation()
  if (this.options.directionalNavigation) this.setupDirectionalNavigation()
  this.setup()
  this.addEventListeners()
  if (this.options.autoPlay) this.autoPlay()
}

SwipeSlide.prototype = {
  // public
  page: function(index) {
    this.stopAutoPlay()
    var newPage = this.validPage(index), callback
    // only set callback function if a slide happend
    if (this.currentPage != newPage) {
      callback = $.proxy(this.callback, this)
      this.currentPage = newPage
      if (this.options.bulletNavigation) this.setActiveBullet()
    } else if (this.options.autoPlay){
      callback = $.proxy(this.autoPlay, this)
    }
    this.move(0, this.options.delay, callback)
  },
  first:   function(){ this.page(0) },
  next:    function(){ this.page(this.currentPage+1) },
  prev:    function(){ this.page(this.currentPage-1) },
  last:    function(){ this.page(this.numPages-1) },
  isFirst: function(){ return this.currentPage == 0 },
  isLast:  function(){ return this.currentPage == this.numPages-1 },
  validPage: function(num){ return Math.max(Math.min(num, this.numPages-1), 0) },
    
  // private
  move: function(distance, delay, callback) {
    this.reel.animate(this.animationProperties(distance), { 
      duration: delay * 1000, 
      easing: 'ease-out', 
      complete: callback
    })
  },

  animationProperties: function(distance) {
    var position = -this.currentPage * this.dimension + distance + 'px', props = {}
    if (this.options.useTranslate3d) {
      var vectors=[0,0,0]; vectors[+this.options.vertical] = position
      props['translate3d'] = vectors.join(',')
    } else {
      props[this.options.vertical ? 'translateY' : 'translateX'] = position
    }
    return props
  },
    
  setup: function(){
    var fn = this.options.vertical ? 'height' : 'width'
    this.dimension = this.container[fn]()
    this.tolerance = this.options.tolerance * this.dimension / 2
    // set height or width of reel and slides
    this.reel[fn](this.dimension * this.numPages + 'px')
    this.slides[fn](this.dimension / this.options.visibleSlides + 'px')
    // move to first slide without animation
    this.move(0,0)
  },
  
  events: {
    start: this.isTouch ? 'touchstart' : 'mousedown',
    move:  this.isTouch ? 'touchmove'  : 'mousemove',
    end:   this.isTouch ? 'touchend touchcancel' : 'mouseup mouseout mouseleave',
    click: this.isTouch ? 'touchend' : 'click'
  },
    
  addEventListeners: function(){
    // bind listeners for touch movement
    this.reel
      .on(this.events.start, $.proxy(this.touchStart, this))
      .on(this.events.move,  $.proxy(this.touchMove, this))
      .on(this.events.end,   $.proxy(this.touchEnd, this))
      
    // bind listeners to any elments with '.prev', '.next', '.first' or '.last' class 
    this.container
      .on(this.events.click, '.next',  $.proxy(this.next,  this))
      .on(this.events.click, '.prev',  $.proxy(this.prev,  this))
      .on(this.events.click, '.first', $.proxy(this.first, this))
      .on(this.events.click, '.last',  $.proxy(this.last,  this))

    // recalculate dimension on window resize or orientation change
    $(window).bind('resize', $.proxy(this.setup, this))
  },
    
  touchStart: function(e){
    if (!this.touch.start) this.touch.start = this.trackTouch(e)
    this.stopAutoPlay()
    return false
  },
    
  touchMove: function(e){
    if (!this.touch.start) return

    this.touch.end = this.trackTouch(e)
    var distance = this.distance()
    //add some resistance if first or last slide
    if (this.isFirst() && distance > 0 || this.isLast() && distance < 0) {
      distance /= 1 + Math.abs(distance) / this.dimension
    }
    this.move(distance, 0)
    return false
  },
    
  touchEnd: function(e){
    if (!this.touch.start && !this.touch.end) return
    var distance = this.distance()
    if (Math.abs(distance) > this.tolerance) {
      distance < 0 ? this.next() : this.prev()
    } else {
      this.page(this.currentPage)
    }
    this.touch = {}
  },
    
  callback: function(){
    // call user defined callback function with the currentPage number and an array of visible slides
    if ($.isFunction(this.options.onChange)) this.options.onChange(this, this.currentPage, this.visibleSlides())
    if (this.options.autoPlay) this.autoPlay()
  },
  
  autoPlay: function(){
    var fn = this.isLast() ? this.first : this.next
    this.timeout = setTimeout($.proxy(fn, this), this.options.autoPlay * 1000) 
  },
  
  stopAutoPlay: function(){
    clearTimeout(this.timeout)
    this.timeout = null
  },

  trackTouch: function(e) {
    var o = this.isTouch ? e.touches[0] : e
    return { x: o.pageX, y: o.pageY, t: +new Date() }
  },
  
  distance: function() {
    try {
      var d = this.options.vertical ? 'y' : 'x'
      return this.touch.end[d] - this.touch.start[d]
    } catch(e) {
      return 0
    }
  },
  
  visibleSlides: function(){
    return this.slides.slice(this.currentPage, this.currentPage+this.options.visibleSlides)
  },


  /* prev/next navigation */
  setupDirectionalNavigation: function() {
    this.container.append('<ul class="ui-swipeslide-nav"><li class="prev">Previous</li><li class="next">Next</li></ul>')
  },
  
  /* bullet navigation */
  setupBulletNavigation: function() {
    this.navBullets = $('<ul class="ui-swipeslide-bullets"></ul>')
    for (i=0; i<this.numPages; i++) this.navBullets.append('<li data-index="'+i+'">'+(i+1)+'</li>')
    if (this.options.bulletNavigation == 'link') {
      this.navBullets.on(this.events.click, 'li', $.proxy(function(e){
        this.page($(e.currentTarget).data('index'))
      }, this))
    }
    this.container.append(this.navBullets)
    this.setActiveBullet()
  },
  setActiveBullet: function() {
    this.navBullets.children('li').removeClass('active').eq(this.currentPage).addClass('active')
  }
}



var SwipeSlide3D = function(container, options) {
  SwipeSlide.call(this, container, options)
  this.alpha = 360/this.slides.length * (this.options.vertical ? -1 : 1)
  this.revolution = 0
  this.radius = 0
  this.container.addClass('ui-swipeslide-3d')
  this.setup()
}
SwipeSlide3D.prototype = new SwipeSlide

$.extend(SwipeSlide3D.prototype, {
  setup: function() {
    var fn = this.options.vertical ? 'height' : 'width'
    this.dimension = this.container[fn]()
    this.tolerance = this.options.tolerance * this.dimension / 2
    this.radius = Math.round( (this.dimension/2) / Math.tan(Math.PI / this.slides.length) );
    this.slides.each($.proxy(this.positionSlide, this))
    this.move(0,0)
  },
  validPage: function(num){ 
    if (num < 0) {
      num += this.numPages; this.revolution--
    } else if (num >= this.numPages) {
      num %= this.numPages; this.revolution++
    }
    return num
  },
  animationProperties: function(distance) {
    var vectors = [0,0,0]; vectors[+!this.options.vertical] = 1;
    var delta = (this.alpha * distance / this.dimension) - (this.alpha * this.currentPage) - (this.revolution * 360)
    return { translate3d: '0,0,'+ -this.radius + 'px', rotate3d: vectors.join(',') +','+ delta + 'deg' }
  },
  positionSlide: function(i, slide){
    var vectors = [0,0,0]; vectors[+!this.options.vertical] = 1;
    $(slide).animate({
      rotate3d: vectors.join(',')+','+ (this.alpha * i)+'deg', 
      translate3d: '0,0,'+this.radius+'px'
    }, {duration: 0})
  }
})

// zepto plugin
;(function($) {
  $.fn.swipeSlide = function(options) {
    var klass = (options=options||{}).threeD ? SwipeSlide3D : SwipeSlide
    return this.each(function() { new klass(this, options) })
  }
})(window.Zepto)