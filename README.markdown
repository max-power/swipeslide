# SwipeSlide

A Zepto Plugin for iOS like swipe navigation.

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
  first: 0,                     // number of first slide to show
  vertical: false,              // horizontal or vertical
  tolerance:0.3,                // values between 0 and 1, where 1 means you have to drag to the center of the slide
  delay: 0.3,                   // animation speed in seconds
  threeD: false,                // 3D Carousel instead of linear slider
  visibleSlides: 1,             // number of slides visible at the same time
  useTranslate3d: true,         // will use translateX or translateY if set to false
  onChange: function() { ... }    // after slide transition callback
}
```
