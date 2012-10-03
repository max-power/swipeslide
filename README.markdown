# SwipeSlide

A Zepto Plugin for iOS like swipe navigation. WebKit only.

## Usage

```html
<div id="container">
  <ul>
    <li style="background: #f00;">1</li>
    <li style="background: #0f0;">2</li>
    <li style="background: #00f;">3</li>
  </ul>
</div>


<script type="text/javascript" src="zepto.js"></script>
<script type="text/javascript" src="swipeslide.js"></script>
<link rel="stylesheet" href="swipeslide.css">
<script type="text/javascript">
  $(document).ready(function() {
    $('#container').swipeSlide();
  }
</script>
```

## Options

You may pass some options to the swipeSlide function:

```javascript
{
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
  change: function() { ... }    // after slide transition callback
}
```
