goog.provide('zoom.control.Main');

goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math.Size');
goog.require('pstj.ds.List');
goog.require('pstj.lab.style.css');
goog.require('pstj.math.utils');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.SheetFrame');
goog.require('pstj.ui.Touchable.EventType');
goog.require('zoom.component.FloorPlan');
goog.require('zoom.component.SensorLayer');
goog.require('zoom.model.FloorModel');
goog.require('zoom.model.SensorModel');



/**
 * The main app controller
 * @constructor
 */
zoom.control.Main = function() {
  // preload data
  var container = goog.dom.createDom('div', goog.getCssName('container'));
  goog.dom.removeNode(document.querySelector('.loader'));
  goog.dom.appendChild(document.body, container);

  var sheet = goog.dom.createDom('div', goog.getCssName('sheet'));
  goog.dom.appendChild(container, sheet);

  var sensorlayer = goog.dom.createDom('div', goog.getCssName('sensorlayer'));
  goog.dom.appendChild(container, sensorlayer);

  this.desiredScaleRatio = 1;
  this.processData();
  this.animationStage = 0;

  this.frame = new pstj.ui.SheetFrame();
  this.sheet = new zoom.component.FloorPlan();
  this.sensorlayer = new zoom.component.SensorLayer();

  this.frame.decorate(container);
  this.sheet.decorate(sheet);
  this.sensorlayer.decorate(sensorlayer);

  var size = this.floormodel.size.clone().scaleToFit(this.frame.size);

  this.sheet.setSize(size);
  this.sensorlayer.setSize(size.clone());
  this.frame.addChild(this.sheet);
  this.frame.addChild(this.sensorlayer);

  goog.events.listen(this.sheet.getElement(),
      goog.events.EventType.TRANSITIONEND, this.continueAnimation.bind(this));

  this.animationButton = new pstj.ui.Button();
  this.animationButton.decorate(document.querySelector('#animationbutton'));
  goog.dom.appendChild(document.body, this.animationButton.getElement());
  goog.events.listen(this.animationButton, goog.ui.Component.EventType.ACTION,
      function(e) {
        console.log('Toggle action');
        if (!this.isAnimationRunning) {
          this.isAnimationRunning = true;
          this.startAnimation();
        } else {
          this.isAnimationRunning = false;
          this.stopAnimation();
        }

      }.bind(this));

  var s = this.sheet;
  var mousewheelhandler = new goog.events.MouseWheelHandler(
      this.sensorlayer.getElement());

  // redirect touch events to the floor plan layer.
  goog.events.listen(this.sensorlayer, [
    pstj.ui.Touchable.EventType.MOVE,
    pstj.ui.Touchable.EventType.PRESS,
    pstj.ui.Touchable.EventType.RELEASE
  ], function(e) {
    s.dispatchEvent(e);
  });
  goog.events.listen(mousewheelhandler,
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      function(e) {
        s.handleWheel(e);
      });

  this.sensorlayer.setModel(this.points);
  this.currentPointIndex = 0;
  this.isAnimationRunning = false;
  this.style = null;
  this.lastUsedScale = 1;

};
goog.addSingletonGetter(zoom.control.Main);


zoom.control.Main.DEFS = {
  CB1: 'cubic-bezier(0, .10, .02, .74)',
  CB2: 'cubic-bezier(.96, .31, .98, .91)'
}


goog.scope(function() {
var _ = zoom.control.Main.prototype;
var defs = zoom.control.Main.DEFS;

_.getVendorPrefixedName = function(eventName) {
  return goog.userAgent.WEBKIT ? '-webkit-' + eventName :
      (goog.userAgent.OPERA ? '-o-' + eventName.toLowerCase() :
          eventName.toLowerCase());
};

/**
 * We assume the data is readily provided in the HTML body as inlined JS object.
 * @protected
 */
_.processData = function() {
  var data = goog.global['DATA'];
  var points = data['points'];
  var floor = data['floor'];
  var originalwidth = pstj.configure.getRuntimeValue('WIDTH',
      goog.asserts.assertNumber(floor['w']), 'AREOUS.FIXED_SIZE');
  var list = new pstj.ds.List();
  var scaleFactor = floor['w'] / originalwidth;
  goog.array.forEach(points, function(item) {
    item['x'] = item['x'] * scaleFactor;
    item['y'] = item['y'] * scaleFactor;
    item['px'] = pstj.math.utils.getPercentFromValue(item['x'], floor['w']);
    item['py'] = pstj.math.utils.getPercentFromValue(item['y'], floor['h']);
    var li = new zoom.model.SensorModel(item);
    list.add(li);
  });
  this.points = list;
  this.points.enableListRewind(true);
  this.floormodel = new zoom.model.FloorModel(floor);
  this.desiredScaleRatio = this.floormodel.getScale();

};

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


/**
 * [continueAnimation description]
 */
_.continueAnimation = function() {
  if (this.animationStage == 0) {
    this.setAnimationClass(false);
    this.sheet.applySize();
    this.sensorlayer.applySize();
    this.sheet.update();
    this.sensorlayer.update();
    this.showToolTip();
    this.animationStage = 1;
    this.points.setCurrent(this.points.getNext());
    setTimeout(this.startSlideAnimation.bind(this), 1000);
  } else if (this.animationStage == 1) {
    this.animationStage = 2;
    this.finishSlideAnimation();
  } else if (this.animationStage == 2) {
    this.animationStage = 1;
    this.showToolTip();
    this.points.setCurrent(this.points.getNext());
    setTimeout(this.startSlideAnimation.bind(this), 1000);
  }
};

_.finishSlideAnimation = function() {
  var point = this.points.getCurrent();
  var oldPoint = this.points.getPrevious();
  var sr = this.floormodel.size.width / this.sheet.size.width;
  var scale = 1;
  var x = (point.getOffset(true) / sr);
  var y = (point.getOffset(false) / sr);
  var sx = -x + (this.frame.size.width / 2);
  var sy = -y + (this.frame.size.height / 2);
  this.updateStyles((3 - (3*this.lastUsedScale)).toFixed(2), defs.CB2);
  pstj.lab.style.css.setTranslation(this.sheet.getElement(),
      sx, sy, undefined, 'scale(' + scale + ')');
  pstj.lab.style.css.setTranslation(this.sensorlayer.getElement(),
      sx, sy, undefined, 'scale(' + scale + ')');
};


_.startSlideAnimation = function() {
  this.setAnimationClass(true);
  var point = this.points.getCurrent();
  var oldPoint = this.points.getPrevious();

  var distance = Math.sqrt(((oldPoint.getOffset(true) - point.getOffset(true)) *
      (oldPoint.getOffset(true) - point.getOffset(true))) +
      (oldPoint.getOffset(false) - point.getOffset(false) *
      (oldPoint.getOffset(false) - point.getOffset(false))));
  var scale = (100 - pstj.math.utils.getPercentFromValue(
      distance,
      Math.sqrt((this.floormodel.size.width*this.floormodel.size.width) +
          (this.floormodel.size.height*this.floormodel.size.height))
      )) / 100;

  var sr = this.floormodel.size.width / this.sheet.size.width;
  var mx = (oldPoint.getOffset(true) + point.getOffset(true)) / 2;
  var my =  (oldPoint.getOffset(false) + point.getOffset(false)) / 2;
  var x = (mx / sr) * scale;
  var y = (my / sr) * scale;
  var sx = ((this.sheet.size.width * scale) - this.sheet.size.width) / 2;
  var sy = ((this.sheet.size.height * scale) - this.sheet.size.height) / 2;
  var scx = this.frame.size.width / 2;
  var scy = this.frame.size.height / 2;
  sx = sx - x;
  sy = sy - y;
  sx = sx + scx;
  sy = sy + scy;
  this.lastUsedScale = scale;
  console.log('Speed', (2*scale)/2);
  this.updateStyles((3 - ((3*scale))).toFixed(2), defs.CB1);
  pstj.lab.style.css.setTranslation(this.sheet.getElement(),
      sx, sy, undefined, 'scale(' + scale + ')');
  pstj.lab.style.css.setTranslation(this.sensorlayer.getElement(),
      sx, sy, undefined, 'scale(' + scale + ')');

};


_.showToolTip = function() {
  console.log('Whatever');
};


_.setAnimationClass = function(yes) {
  goog.dom.classlist.enable(this.sheet.getElement(),
      goog.getCssName('animating'), yes);
  goog.dom.classlist.enable(this.sensorlayer.getElement(),
      goog.getCssName('animating'), yes);
};


/**
 * Start the anomation
 * @protected
 */
_.startAnimation = function() {
  var point = this.points.getCurrent()
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
  this.updateStyles('2', 'linear');
  pstj.lab.style.css.setTranslation(this.sheet.getElement(),
      sx, sy, undefined, 'scale(' + scale + ')');
  pstj.lab.style.css.setTranslation(this.sensorlayer.getElement(),
      sx, sy, undefined, 'scale(' + scale + ')');

};

_.stopAnimation = function() {

}

});  // goog.scope
