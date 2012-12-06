var SwipeSlide = function(container, options){
  this.options = $.extend({
    first: 0,
    visibleSlides: 1,             // number of slides visible at the same time
    vertical: false,              // horizontal or vertical
    tolerance:0.5,                // values between 0 and 1, where 1 means you have to drag to the center of the slide (a value of 1 equals the ios behaviour)
    delay: 0.3,                   // animation speed in seconds,
    useTranslate3d: true,
    onChange: null,
  }, options)

  this.container   = $(container).addClass('ui-swipeslide')
  this.reel        = this.container.children().first().addClass('ui-swipeslide-'+['horizontal','vertical'][+this.options.vertical])
  this.slides      = this.reel.children().addClass('ui-swipeslide-slide')
  this.numPages    = Math.ceil(this.slides.length / this.options.visibleSlides)
  this.currentPage = this.validPage(this.options.first)
  this.isTouch     = 'ontouchstart' in document.documentElement
  this.touch       = {}
  this.setup()
  this.addEventListeners()
}

SwipeSlide.prototype = {
  // public
  page: function(index) {
    var newPage = this.validPage(index), callback
    // only set callback function if a slide happend
    if (this.currentPage != newPage) {
      callback = $.proxy(this.callback, this)
      this.currentPage = newPage
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
    
  addEventListeners: function(){
    var events = {
      start: this.isTouch ? 'touchstart' : 'mousedown',
      move:  this.isTouch ? 'touchmove'  : 'mousemove',
      end:   this.isTouch ? 'touchend touchcancel' : 'mouseup mouseout',
      click: this.isTouch ? 'touchend' : 'click'
    }
    // bind listeners for touch movement
    this.reel
      .on(events.start, $.proxy(this.touchStart, this))
      .on(events.move,  $.proxy(this.touchMove, this))
      .on(events.end,   $.proxy(this.touchEnd, this))
      
    // bind listeners to any elments with '.prev', '.next', '.first' or '.last' class 
    this.container
      .on(events.click, '.next',  $.proxy(this.next,  this))
      .on(events.click, '.prev',  $.proxy(this.prev,  this))
      .on(events.click, '.first', $.proxy(this.first, this))
      .on(events.click, '.last',  $.proxy(this.last,  this))

    // recalculate dimension on window resize or orientation change
    $(window).bind('resize', $.proxy(this.setup, this))
  },
    
  touchStart: function(e){
    if (!this.touch.start) this.touch.start = this.trackTouch(e)
    e.preventDefault()
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
    e.preventDefault()
  },
    
  touchEnd: function(e){
    var distance = this.distance()
    if (Math.abs(distance) > this.tolerance) {
      distance < 0 ? this.next() : this.prev()
    } else {
      this.page(this.currentPage)
    }
    this.touch = {}
  },
    
  callback: function(){
    var i = this.currentPage * this.options.visibleSlides
    var visibleSlides = this.slides.slice(i, i+this.options.visibleSlides)
    // call user defined callback function with the currentPage number and an array of visible slides
    if ($.isFunction(this.options.onChange)) this.options.onChange(this.currentPage, visibleSlides)
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
  }
}

// zepto plugin
;(function($) {
  $.fn.swipeSlide = function(options) {
    return this.each(function() {
      new SwipeSlide(this, options)
    })
  }
})(window.Zepto)
