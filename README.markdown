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


<script type="text/javascript" src="zepto.js">
<script type="text/javascript" src="swipeslide.js">
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
  content_selector: 'ul', // parent element of the slides
  vertical: false,        // horizontal or vertical
  tolerance:0.3,          // values between 0 and 1, where 1 means you have to drag to the center of the slide
  delay: 0.3,             // animation speed in seconds
  bullet_navigation: 'link',   // false, true or link (event handlers will be attached)
  directional_navigation: false,  // will inset previous and next links
  touch_navigation: true,         // will bind touch events. you don't need this if you don't develop for iOS devices.
  fancy_cursor: true,     // this you won't see on touch based devises.
  threeD: false,          // 3D Carousel instead of linear slider
  visible_slides: 1       // number of slides visible at the same time
}
```
