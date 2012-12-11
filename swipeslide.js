var SwipeSlide = function(container, options){
  this.options = $.extend({
    first: 0,                     // the first visible slide on initialization
    visibleSlides: 1,             // number of slides visible at the same time
    vertical: false,              // horizontal or vertical
    tolerance:0.5,                // values between 0 and 1, where 1 means you have to drag to the center of the slide (a value of 1 equals the ios behaviour)
    delay: 0.3,                   // animation speed in seconds,
    easing: 'ease-out',           // the easing function
    autoPlay: false,              // false, or value in seconds to start auto slideshow
    useTranslate3d: true,
    bulletNavigation: 'link',     // will insert bullet navigation: false, true or 'link' (event handlers will be attached)
    directionalNavigation: false, // will insert previous and next links
    beforeChange: null,
    afterChange: null                // after slide transition callback
  }, options)

  this.isVertical  = !!this.options.vertical
  this.container   = $(container).addClass('ui-swipeslide').addClass('ui-swipeslide-'+(this.isVertical ? 'vertical' : 'horizontal'))
  this.reel        = this.container.children().first().addClass('ui-swipeslide-reel')
  this.slides      = this.reel.children().addClass('ui-swipeslide-slide')
  this.numPages    = Math.ceil(this.slides.length / this.options.visibleSlides)
  this.currentPage = this.validPage(this.options.first)
  this.touch       = {}
  this.isTouch     = 'ontouchstart' in document.documentElement
  this.events      = {
    start: this.isTouch ? 'touchstart' : 'mousedown',
    move:  this.isTouch ? 'touchmove'  : 'mousemove',
    end:   this.isTouch ? 'touchend touchcancel touchleave' : 'mouseup mouseout mouseleave',
    click: this.isTouch ? 'touchend' : 'click'
  }
  this.setup()
  this.addEventListeners()
  if (this.options.directionalNavigation) this.setupDirectionalNavigation()
  if (this.options.bulletNavigation) this.setupBulletNavigation()
  if (this.options.autoPlay) this.autoPlay()
}

SwipeSlide.prototype = {
  // public
  page: function(index) {
    this.stopAutoPlay()
    var newPage = this.validPage(index), callback
    // only set callback function if a slide happend
    if (this.currentPage != newPage) {
      if($.isFunction(this.options.beforeChange)) this.options.beforeChange(this, this.currentPage, newPage)
      this.currentPage = newPage
      callback = $.proxy(this.callback, this)
    } else if (this.options.autoPlay){
      callback = $.proxy(this.autoPlay, this)
    }
    this.move(0, this.options.delay, callback)
    if (this.options.bulletNavigation) this.setActiveBullet()
  },
  first:     function(){ this.page(0) },
  next:      function(){ this.page(this.currentPage+1) },
  prev:      function(){ this.page(this.currentPage-1) },
  last:      function(){ this.page(this.numPages-1) },
  isFirst:   function(){ return this.currentPage == 0 },
  isLast:    function(){ return this.currentPage == this.numPages-1 },
  validPage: function(num){ return Math.max(Math.min(num, this.numPages-1), 0) },
  autoPlay:  function(){
    if (this.timeout) return false
    var fn = this.isLast() ? this.first : this.next
    this.timeout = setTimeout($.proxy(fn, this), this.options.autoPlay * 1000) 
  },
  stopAutoPlay:  function(){ 
    clearTimeout(this.timeout)
    delete this.timeout 
  },
  visibleSlides: function(){
    return this.slides.slice(this.currentPage, this.currentPage+this.options.visibleSlides)
  },
  
  // private
  move: function(distance, delay, callback) {
    this.reel.animate(this.animationProperties(distance), { duration: delay * 1000, easing: this.options.easing, complete: callback })
  },

  animationProperties: function(distance) {
    var position = -this.currentPage * this.dimension + distance + 'px', props = {}
    if (this.options.useTranslate3d) {
      props['translate3d'] = (this.isVertical ? '0,'+position : position+',0') + ',0'
    } else {
      props[this.isVertical ? 'translateY' : 'translateX'] = position
    }
    return props
  },
    
  setup: function(){
    var fn = this.isVertical ? 'height' : 'width'
    this.dimension = this.container[fn]()
    this.tolerance = this.options.tolerance * this.dimension / 2
    // set height or width of reel and slides
    this.reel[fn](this.dimension * this.numPages + 'px')
    this.slides[fn](this.dimension / this.options.visibleSlides + 'px')
    // move to first slide without animation
    this.move(0,0)
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
    $(window).on('resize', $.proxy(this.setup, this))
  },
    
  touchStart: function(e){
    this.touch.start = this.trackTouch(e)
    delete this.isScroll
    if (!this.isTouch) return false
  },
    
  touchMove: function(e){
    if (!this.touch.start) return
    this.touch.end = this.trackTouch(e)
    var distance   = this.distance(this.isVertical)
    if (typeof this.isScroll == 'undefined') {
      this.isScroll = Math.abs(distance) < Math.abs(this.distance(!this.isVertical))
    }
    if (!this.isScroll) {
      this.stopAutoPlay()
      this.move(this.withResistance(distance), 0)
      return false
    }
  },
    
  touchEnd: function(e){
    if (!this.isScroll) {
      var distance = this.distance(this.isVertical), add = 0
      if (Math.abs(distance) > this.tolerance) add = distance < 0 ? 1 : -1
      this.page(this.currentPage + add)
    }
    this.touch = {}
    return false
  },

  trackTouch: function(e) {
    var o = this.isTouch ? e.touches[0] : e
    return { x: o.pageX, y: o.pageY }
  },
  
  distance: function(vertical) {
    var d = vertical ? 'y' : 'x'
    try { return this.touch.end[d] - this.touch.start[d] } catch(e) {return 0}
  },
  
  withResistance: function(d){
    if (this.isFirst() && d > 0 || this.isLast() && d < 0) d /= (1 + Math.abs(d) / this.dimension)
    return d
  },
  
  callback: function(){
    // call user defined callback function with the currentPage number and an array of visible slides
    if ($.isFunction(this.options.afterChange)) this.options.afterChange(this, this.currentPage)
    if (this.options.autoPlay) this.autoPlay()
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
        this.page(parseInt($(e.currentTarget).data('index'), 10))
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
  this.container.addClass('ui-swipeslide-3d')
}
SwipeSlide3D.prototype = new SwipeSlide

$.extend(SwipeSlide3D.prototype, {
  setup: function() {
    var fn = this.isVertical ? 'height' : 'width'
    this.dimension = this.container[fn]()
    this.tolerance = this.options.tolerance * this.dimension / 2
    this.alpha     = 360/this.slides.length * (this.isVertical ? -1 : 1)
    this.radius    = Math.round((this.dimension/2) / Math.tan(Math.PI / this.slides.length))
    this.slides.each($.proxy(this.positionSlide, this))
    this.move(0,0)
  },
  validPage: function(num){    
    if (num < 0) num += this.numPages
    else if (num >= this.numPages) num %= this.numPages
    return num
  },
  animationProperties: function(distance) {
    var delta = (this.alpha * distance / this.dimension) - (this.alpha * this.currentPage)
    return { translate3d: '0,0,'+ -this.radius + 'px', rotate3d: this.vectorsWithDeg(delta) }
  },
  positionSlide: function(i, slide){
    $(slide).animate({ rotate3d: this.vectorsWithDeg(i*this.alpha), translate3d: '0,0,'+this.radius+'px' }, {duration: 0})
  },
  vectorsWithDeg: function(degree){
    return (this.isVertical ? '1,0' : '0,1') + ',0,' + degree + 'deg'
  },
  withResistance: function(d) {return d} // no resistance for 3d
})

// zepto plugin
;(function($) {
  $.fn.swipeSlide = function(options) {
    var klass = (options=options||{}).threeD ? SwipeSlide3D : SwipeSlide
    return this.each(function() { new klass(this, options) })
  }
})(window.Zepto)