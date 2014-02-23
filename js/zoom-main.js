goog.provide('zoom.control.Main');

goog.require('goog.async.Delay');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('pstj.ds.List');
goog.require('pstj.lab.style.css');
goog.require('pstj.math.utils');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.SheetFrame');
goog.require('pstj.ui.Touchable.EventType');
goog.require('zoom.component.FloorPlan');
goog.require('zoom.component.Info');
goog.require('zoom.component.SensorLayer');
goog.require('zoom.model.FloorModel');
goog.require('zoom.model.SensorModel');
goog.require('zoom.template');
goog.require('zoom.text');



/**
 * The main app controller. Most of the logic is hosted here.
 * @constructor
 */
zoom.control.Main = function() {
  /**
   * The scale ratio that should be used when in presentation mode.
   * It is set by the JSON data in the floor plan section.
   * @type {number}
   * @protected
   */
  this.desiredScaleRatio = 1;
  /**
   * Internal flag for the stage of presenation animation. Used to know
   * which transition to apply next.
   * @type {number}
   * @protected
   */
  this.animationStage = 0;
  /**
   * The info component.
   * @type {zoom.component.Info}
   * @protected
   */
  this.info = new zoom.component.Info();
  /**
   * The main frame of the app - hosts the scaling view. Required for handling
   * resizes.
   * @type {pstj.ui.SheetFrame}
   * @protected
   */
  this.frame = new pstj.ui.SheetFrame();
  /**
   * The floor plan sheet. It hosts the plan drawing.
   * @type {zoom.component.FloorPlan}
   * @protected
   */
  this.sheet = new zoom.component.FloorPlan();
  /**
   * The sensors layer. Hosts the sensors and gathers the interaction events.
   * @type {zoom.component.SensorLayer}
   * @protected
   */
  this.sensorlayer = new zoom.component.SensorLayer();
  /**
   * The trigger button for the presentation mode. Used to handle touch as well.
   * @type {pstj.ui.Button}
   * @protected
   */
  this.animationButton = new pstj.ui.Button();
  /**
   * Flag for the animation state.
   * @type {boolean}
   * @protected
   */
  this.isAnimationRunning = false;
  /**
   * Holds reference to the style sheet used to configure the animation in
   * the presentation mode.
   * @type {StyleSheet|Element}
   */
  this.style = null;
  /**
   * Place to keep reference to the scale used in the first part of two step
   * animations so we do not have to calculate it twice.
   * @type {number}
   * @protected
   */
  this.lastUsedScale = 1;
  /**
   * Reference to the list of sensors.
   * @type {pstj.ds.List}
   * @protected
   */
  this.points = null;
  /**
   * Reference to the floor model. Should be loaded only once per session.
   * @type {zoom.model.FloorModel}
   * @protected
   */
  this.floormodel = null;
  /**
   * Event blocker div - preserves the animation in presentation mode.
   * @type {Element}
   * @private
   */
  this.eventBlocker_ = null;

  /**
   * Reference to the initial fitted size of the sheets.
   * @type {goog.math.Size}
   * @protected
   */
  this.fitScreenSize = null;

  this.hideTooltipDelay_ = new goog.async.Delay(function() {
    this.info.setActive(false);
  }, 2000, this);

  this.init_();
};
goog.addSingletonGetter(zoom.control.Main);


/**
 * The transition timing to use in the two step animation. It might be better
 * to get those from global values to allow easier modification from server
 * side.
 * @enum {string}
 */
zoom.control.Main.DEFS = {
  CB1: 'cubic-bezier(0, .10, .02, .74)',
  CB2: 'cubic-bezier(.96, .31, .98, .91)'
};


goog.scope(function() {
var _ = zoom.control.Main.prototype;
var defs = zoom.control.Main.DEFS;


/**
 * Initialize the controller.
 * @private
 */
_.init_ = function() {
  goog.dom.appendChild(document.body,
      goog.dom.htmlToDocumentFragment(zoom.template.main({})));

  this.frame.decorate(document.querySelector('.' +
      goog.getCssName('container')));
  this.sheet.decorate(document.querySelector('.' +
      goog.getCssName('sheet')));
  this.sensorlayer.decorate(document.querySelector('.' +
      goog.getCssName('sensorlayer')));
  this.animationButton.decorate(document.querySelector('.' +
      goog.getCssName('trigger-button')));
  this.eventBlocker_ = document.querySelector('.' +
      goog.getCssName('event-blocker'));

  this.info.render(document.body);

  goog.style.setElementShown(this.eventBlocker_, false);
  this.animationButton.setValue(zoom.text.startAnimation);

  this.processData();

  this.sheet.getElement().style.backgroundImage = 'url(' +
      this.floormodel.getImageSource() + ')';

  this.sensorlayer.setModel(this.points);
  // Determine and remomeber the initial fitted screen size.
  this.fitScreenSize = goog.asserts.assertInstanceof(
      this.floormodel.size, goog.math.Size).clone().scaleToFit(
      goog.asserts.assertInstanceof(this.frame.size, goog.math.Size));

  // Set the sheets to the initial size.
  this.sheet.setSize(this.fitScreenSize.clone());
  this.sensorlayer.setSize(this.fitScreenSize.clone());
  this.frame.addChild(this.sheet);
  this.frame.addChild(this.sensorlayer);


  var xoffset = ((this.frame.size.width / 2) - (this.sheet.size.width / 2)) * -1;
  var yoffset = ((this.frame.size.height / 2) - (this.sheet.size.height / 2)) * -1;

  this.sheet.setOffsets(xoffset, yoffset);
  this.sensorlayer.setOffsets(xoffset, yoffset);
  this.sheet.update();
  this.sensorlayer.update();

  goog.events.listen(this.sheet.getElement(),
      goog.events.EventType.TRANSITIONEND, this.continueAnimation.bind(this));

  goog.events.listen(this.animationButton, goog.ui.Component.EventType.ACTION,
      function(e) {
        if (!this.isAnimationRunning) {
          this.isAnimationRunning = true;
          this.startAnimation();
        } else {
          this.isAnimationRunning = false;
          this.stopAnimation();
        }
      }.bind(this));

  var s = this.sheet;

  // redirect touch events to the floor plan layer.
  goog.events.listen(this.sensorlayer, [
    pstj.ui.Touchable.EventType.MOVE,
    pstj.ui.Touchable.EventType.PRESS,
    pstj.ui.Touchable.EventType.RELEASE
  ], function(e) {
    s.dispatchEvent(e);
  });

  goog.events.listen((new goog.events.MouseWheelHandler(
      this.sensorlayer.getElement())),
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      function(e) {
        s.handleWheel(e);
      });

  // Give the broser time to render the large images.
  setTimeout(function() {
    goog.dom.removeNode(document.querySelector('.loader'));
  }, 1000);
};


/**
 * Precalculate sensor sizes.
 * @param {string} size The descriptive size name.
 * @return {number} The pixel size.
 */
_.getSensorSize = function(size) {
  if (size == 'sensor-size-small') {
    return 15;
  } else if (size == 'sensor-size-big') {
    return 25;
  } else {
    return 20;
  }
};


/**
 * We assume the data is readily provided in the HTML body as inlined JS object.
 * The method is protected so it can be overriden if needed.
 * @protected
 */
_.processData = function() {
  var data = goog.global['CONFIG'];
  var points = data['placedSensors'];
  var floor = data['floorPlanInfo'];
  //var values = data['values'];
  floor['width'] = parseInt(floor['width'], 10);
  floor['height'] = parseInt(floor['height'], 10);
  floor['zoom_factor'] = parseInt(floor['zoom_factor'], 10);

  var originalwidth = pstj.configure.getRuntimeValue('WIDTH',
      goog.asserts.assertNumber(floor['width']), 'AREOUS.FIXED_SIZE');
  var list = new pstj.ds.List();
  var scaleFactor = floor['width'] / originalwidth;
  goog.array.forEach(points, function(item) {

    item['id'] = parseInt(item['id'], 10);
    item['left'] = parseInt(item['left'], 10) * scaleFactor;
    item['top'] = parseInt(item['top'], 10) * scaleFactor;
    item['size'] = this.getSensorSize(item['size']);
    item['font_color'] = '#' + item['font_color'];
    item['dot_color'] = '#' + item['dot_color'];
    item['px'] = pstj.math.utils.getPercentFromValue(item['left'],
        floor['width']);
    item['py'] = pstj.math.utils.getPercentFromValue(item['top'],
        floor['height']);

    var li = new zoom.model.SensorModel(item);
    list.add(li);
  }, this);
  // ref the points.
  this.points = list;
  // enable list rewinding for continuous presentation mode.
  this.points.enableListRewind(true);
  // ref the floor model.
  this.floormodel = new zoom.model.FloorModel(floor);
  // configure the desired scale ratio
  this.desiredScaleRatio = this.floormodel.getScale();
};


/**
 * Getter for the vendor prefix to use when constructing transition settings.
 * @param {string} eventName The name of the property to vendor-ize.
 * @return {string}
 * @protected
 */
_.getVendorPrefixedName = function(eventName) {
  return goog.userAgent.WEBKIT ? '-webkit-' + eventName :
      (goog.userAgent.OPERA ? '-o-' + eventName.toLowerCase() :
          eventName.toLowerCase());
};


/**
 * Updates the transition styling used in presentation mode.
 * @param {number} duration How long the transition should be.
 * @param {string} timing The timeing of the transition.
 * @protected
 */
_.updateStyles = function(duration, timing) {
  var csstext = '.' + goog.getCssName('animating') + '{';
  csstext += this.getVendorPrefixedName('transition') + ':' +
      this.getVendorPrefixedName('transform') + ' ' + duration + 's' + ' ' +
      timing + ';}';

  if (!this.style) {
    this.style = goog.style.installStyles(csstext);
  } else {
    goog.style.setStyles(this.style, csstext);
  }
};


_.fitInitial = function() {
  // notify completer that we need special tratment so it can call start again.
  this.animationStage = -1;
  var scale = (this.sheet.size.width / this.fitScreenSize.width) / 100;
  this.sheet.setSize(this.fitScreenSize.clone());
  this.sensorlayer.setSize(this.fitScreenSize.clone());
  this.applyTransformation(
    ((this.frame.size.width / 2) - (this.fitScreenSize.width / 2)) * 1,
    ((this.frame.size.height / 2) - (this.fitScreenSize.height / 2)) * 1,
    scale);
};


/**
 * Start the anomation
 * @protected
 */
_.startAnimation = function() {
  this.animationButton.setValue(zoom.text.stopAnimation);
  goog.style.setElementShown(this.eventBlocker_, true);
  if (!goog.math.Size.equals(this.sheet.size, this.fitScreenSize)) {
    // fit to initial size first.
    this.fitInitial();
    return;
  }

  var point = this.points.getCurrent();
  // current scale ratio.
  var sr = this.floormodel.size.width / this.sheet.size.width;
  var scale = this.desiredScaleRatio / 100;
  var x = (point.getOffset(true) / sr) * scale;
  var y = (point.getOffset(false) / sr) * scale;
  // set to 0
  var sx = ((this.sheet.size.width * scale) - this.sheet.size.width) / 2;
  var sy = ((this.sheet.size.height * scale) - this.sheet.size.height) / 2;
  // now calculate offset in regard to screen center.
  var scx = this.frame.size.width / 2;
  var scy = this.frame.size.height / 2;
  // now calculate the position of the point with respect to those offsets.
  sx = sx - x;
  sy = sy - y;
  sx = sx + scx;
  sy = sy + scy;
  this.sheet.size.width = this.sheet.size.width * scale;
  this.sheet.size.height = this.sheet.size.height * scale;
  this.sensorlayer.size.width = this.sheet.size.width;
  this.sensorlayer.size.height = this.sheet.size.height;
  this.setAnimationClass(true);
  var xoff = (-this.sheet.size.width + (this.sheet.size.width - x) +
      (this.frame.size.width / 2)) * -1;
  var yoff = (-this.sheet.size.height + (this.sheet.size.height - y) +
      (this.frame.size.height / 2)) * -1;
  this.sheet.setOffsets(xoff, yoff);
  this.sensorlayer.setOffsets(xoff, yoff);
  this.updateStyles(2, 'linear');
  this.applyTransformation(sx, sy, scale);
};


/**
 * Stops the presentation animation.
 * @protected
 */
_.stopAnimation = function() {
  this.animationButton.setValue(zoom.text.startAnimation);
  this.isAnimationRunning = false;
};


/**
 * Configures and starts the next animation iteration of two step anim.
 * @protected
 */
_.startNextAnimationIteration = function() {
  this.showToolTip();
  // After the tip is shown we can update the list to the next point.
  this.points.setCurrent(this.points.getNext());
  // wait for the tooltip
  setTimeout(this.startSlideAnimation.bind(this), 2500);
};


/**
 * Animation continuation logic.
 * stage 0 -> finished animating from event handing mode to first point
 * stage 1 -> finished step 1 of point to point animation
 * stage 2 -> finished step 2 of point to point animation.
 * @protected
 */
_.continueAnimation = function() {
  if (this.isAnimationRunning) {
    if (this.animationStage == -1) {
      this.animationStage = 0;
      this.setAnimationClass(false);
      this.sheet.applySize();
      this.sensorlayer.applySize();
      this.sheet.update();
      this.sensorlayer.update();
      this.startAnimation();
    } else if (this.animationStage == 0) {
      this.animationStage = 1;
      this.setAnimationClass(false);
      this.sheet.applySize();
      this.sensorlayer.applySize();
      this.sheet.update();
      this.sensorlayer.update();
      this.startNextAnimationIteration();
    } else if (this.animationStage == 1) {
      this.animationStage = 2;
      this.finishSlideAnimation();
    } else if (this.animationStage == 2) {
      this.animationStage = 1;
      this.startNextAnimationIteration();
    }
  } else {
    if (this.animationStage == 0) {
      // we just finished the initial step, revert to original state.
      this.animationStage = 1;
    } else if (this.animationStage == 1) {
      // we are halfway to the next point, continue
      this.animationStage = 2;
      this.finishSlideAnimation();
    } else if (this.animationStage == 2) {
      // we are at the end of the two step animation, revert to original.
      this.animationStage = 3;
      // animate to original scale (on start)

    } else if (this.animationStage == 3) {
      // we are out of animation cycle, remove animation class.
      this.setAnimationClass(false);
      this.animationStage = 0;
      goog.style.setElementShown(this.eventBlocker_, false);
      this.sheet.applySize();
      this.sensorlayer.applySize();
      this.sheet.update();
      this.sensorlayer.update();
    }
  }
};


/**
 * Configures and ruins the second step in the presentation animation.
 * @protected
 */
_.finishSlideAnimation = function() {
  var point = this.points.getCurrent();
  var sr = this.floormodel.size.width / this.sheet.size.width;
  var scale = 1;
  var x = (point.getOffset(true) / sr);
  var y = (point.getOffset(false) / sr);
  var sx = -x + (this.frame.size.width / 2);
  var sy = -y + (this.frame.size.height / 2);
  this.updateStyles((3 - (3 * this.lastUsedScale)), defs.CB2);
  this.applyTransformation(sx, sy, scale);
};


/**
 * Configures and run the first step in the presentation animation.
 * @protected
 */
_.startSlideAnimation = function() {

  // add animation classes
  this.setAnimationClass(true);

  // get local ref to the two points.
  var point = this.points.getCurrent();
  var oldPoint = this.points.getPrevious();

  // calculate the distance between the two points
  // sq root of the sum of the squares,
  var distance = Math.sqrt(
      (
          (oldPoint.getOffset(true) - point.getOffset(true)) *
          (oldPoint.getOffset(true) - point.getOffset(true))
      ) + (
          (oldPoint.getOffset(false) - point.getOffset(false)) *
          (oldPoint.getOffset(false) - point.getOffset(false))
      ));

  // calculate the scale to achieve in the middle of the step animation.
  // the value should be < 1.
  var scale = (100 - pstj.math.utils.getPercentFromValue(distance,
      Math.sqrt(
          (this.floormodel.size.width * this.floormodel.size.width) +
          (this.floormodel.size.height * this.floormodel.size.height)
      )
      )) / 100;

  // calculate the scale ratio currently applied to the sheet
  // it is the ratio between the original image and the currently displayed
  // size of the image.
  var sr = this.floormodel.size.width / this.sheet.size.width;

  // calculate the X/Y value of the point in the middle between the two points.
  var mx = (oldPoint.getOffset(true) + point.getOffset(true)) / 2;
  var my = (oldPoint.getOffset(false) + point.getOffset(false)) / 2;

  // Scale the middle point's X/Y to the scale ratio with account to the
  // scale that will be applied in the transformation.
  var x = (mx / sr) * scale;
  var y = (my / sr) * scale;

  // calculates the start X/Y (point 0, 0) of the sheet after the scale has
  // been applied
  var sx = ((this.sheet.size.width * scale) - this.sheet.size.width) / 2;
  var sy = ((this.sheet.size.height * scale) - this.sheet.size.height) / 2;

  // calculate the middle of the screen points. The frame sheet matches the
  // screen size in this case
  var scx = this.frame.size.width / 2;
  var scy = this.frame.size.height / 2;

  // Calculates the sheet X/Y point to apply in order for the target point
  // to be at the point calculated as the middle of the distance between the
  // old and new end points.
  sx = sx - x;
  sy = sy - y;
  sx = sx + scx;
  sy = sy + scy;

  // Hold ref to the scale that has been calculated to reuse it.
  this.lastUsedScale = scale;
  this.updateStyles((3 - ((3 * scale))), defs.CB1);
  this.applyTransformation(sx, sy, scale);
};


/**
 * @protected
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} scale the scale.
 */
_.applyTransformation = function(x, y, scale) {
  pstj.lab.style.css.setTranslation(this.sheet.getElement(),
      x, y, undefined, 'scale(' + scale + ')');
  pstj.lab.style.css.setTranslation(this.sensorlayer.getElement(),
      x, y, undefined, 'scale(' + scale + ')');
};


/**
 * Shows the tooltip over the current point.
 * @protected
 */
_.showToolTip = function() {
  this.info.setModel(this.points.getCurrent());
  var y_offset = (this.frame.size.height / 2) - this.info.size.height - 30;
  this.info.setActive(true, y_offset);
  this.hideTooltipDelay_.start();

};


/**
 * Sets / removes the class used for animation in presentation mode.
 * @param {boolean} yes If true the class will be set, else it will be removed.
 */
_.setAnimationClass = function(yes) {
  goog.dom.classlist.enable(this.sheet.getElement(),
      goog.getCssName('animating'), yes);
  goog.dom.classlist.enable(this.sensorlayer.getElement(),
      goog.getCssName('animating'), yes);
};

});  // goog.scope
