goog.provide('zoom.component.Info');
goog.provide('zoom.component.InfoTemplate');

goog.require('goog.dom.classlist');
goog.require('goog.style');
goog.require('goog.ui.ControlRenderer');
goog.require('pstj.ui.Button');
goog.require('pstj.ui.CustomButtonRenderer');
goog.require('pstj.ui.Template');
goog.require('pstj.ui.Templated');
goog.require('pstj.ui.ngAgent');
goog.require('zoom.template');



/**
 * @constructor
 * @extends {pstj.ui.Template}
 */
zoom.component.InfoTemplate = function() {
  goog.base(this);
};
goog.inherits(zoom.component.InfoTemplate, pstj.ui.Template);
goog.addSingletonGetter(zoom.component.InfoTemplate);


goog.scope(function() {
var _ = zoom.component.InfoTemplate.prototype;


/** @inheritDoc */
_.getTemplate = function() {
  return zoom.template.info({}).getContent();
};

});  // goog.scope



/**
 * @constructor
 * @extends {pstj.ui.Templated}
 */
zoom.component.Info = function() {
  goog.base(this, zoom.component.InfoTemplate.getInstance());
  /**
   * Reference the size of the tip.
   * @type {goog.math.Size}
   */
  this.size = null;
  /**
   * Cached size.
   * @type {goog.math.Size}
   * @private
   */
  this.cachedSize_ = null;
  this.graphButton = new pstj.ui.Button(
      (/** @type {goog.ui.ButtonRenderer} */(
      goog.ui.ControlRenderer.getCustomRenderer(
          pstj.ui.CustomButtonRenderer, goog.getCssName('tip-button')))));
  this.pinButton = new pstj.ui.Button(
      (/** @type {goog.ui.ButtonRenderer} */(
      goog.ui.ControlRenderer.getCustomRenderer(
          pstj.ui.CustomButtonRenderer, goog.getCssName('tip-button')))));
  this.closeButton = new pstj.ui.Button(
      (/** @type {goog.ui.ButtonRenderer} */(
      goog.ui.ControlRenderer.getCustomRenderer(
          pstj.ui.CustomButtonRenderer, goog.getCssName('close-button')))));

  this.addChild(this.graphButton);
  this.addChild(this.pinButton);
  this.addChild(this.closeButton);
  /**
   * The tip element.
   * @type {?Element}
   * @protected
   */
  this.tip = null;
  /**
   * The size of the tip. Used in calculation.
   * @type {number}
   * @protected
   */
  this.tipSize = 0;
  /**
   * Flag for active state, used in main.
   * @type {boolean}
   */
  this.isActive = false;
};
goog.inherits(zoom.component.Info, pstj.ui.Templated);


/**
 * @enum {number}
 */
zoom.component.Info.TipOrientation = {
  TOP: 0,
  BOTTOM: 1,
  LEFT: 2,
  RIGHT: 3,
  TOP_LEFT: 4,
  TOP_RIGHT: 5,
  BOTTOM_LEFT: 6,
  BOTTOM_RIGHT: 7
};


goog.scope(function() {
var _ = zoom.component.Info.prototype;
var o = zoom.component.Info.TipOrientation;


/** @inheritDoc */
_.setModel = function(model) {
  goog.asserts.assertInstanceof(model, pstj.ds.ListItem);
  if (!goog.isNull(this.getElement())) {
    goog.dom.classlist.enable(
      this.getElement(),
      goog.getCssName('small-text'),
      model.getProp(zoom.model.SensorModel.DEFS.NAME).split('\r')[0].length > 20);
  }
  goog.base(this, 'setModel', model);
  pstj.ui.ngAgent.getInstance().apply(this);

};


/** @inheritDoc */
_.render = function(el) {
  goog.base(this, 'render', el);
  this.graphButton.decorate(this.querySelector('.' + goog.getCssName('graph')));
  this.pinButton.decorate(this.querySelector('.' + goog.getCssName('pin')));
  this.closeButton.decorate(this.querySelector('.' + goog.getCssName('close')));
};


/** @inheritDoc */
_.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.tip = this.querySelector('.' + goog.getCssName('tip'));
  this.getHandler().listen(this.closeButton, goog.ui.Component.EventType.ACTION,
      this.onCloseButtonAction);
  this.size = goog.style.getSize(this.getElement());
  this.tipSize = goog.style.getSize(this.tip).width;
};


/**
 * Handles the activation of the close button.
 * @param {goog.events.Event} e The ACTION event.
 * @protected
 */
_.onCloseButtonAction = function(e) {
  e.stopPropagation();
  this.setActive(false);
};


/**
 * Enables the animation mode for the tip.
 * @param {boolean} enable If true sets the needed class.
 */
_.setAnimationMode = function(enable) {
  goog.dom.classlist.enable(this.getElement(),
      goog.getCssName('animation-mode'), enable);
};


/**
 * Sets the active state of the component.
 * The implementation is in CSS.
 * @param {boolean} active If true the active class will be added.
 * @param {goog.math.Size=} opt_ss Current screen size.
 * @param {number=} opt_cs The size of the circle.
 */
_.setActive = function(active, opt_ss, opt_cs) {
  this.isActive = active;
  var x = 0;
  var y = 0;
  if (active) {
    if (!goog.isDef(opt_ss) || !goog.isNumber(opt_cs)) {
      throw new Error('Cannot position without screen size');
    }
    if (goog.isNull(this.cachedSize_) || !goog.math.Size.equals(
        this.cachedSize_, goog.asserts.assertInstanceof(opt_ss,
            goog.math.Size))) {
      this.cachedSize_ = goog.asserts.assertInstanceof(opt_ss,
          goog.math.Size).clone();
    }
    // we are at 0,0, we need to go to exact ceneter minus our
    // full height and minus half our width
    x = (this.cachedSize_.width / 2) - (this.size.width / 2);
    y = (this.cachedSize_.height / 2) - this.size.height - this.tipSize -
        opt_cs;
    this.setTip(o.BOTTOM);
  } else {
    x = x = (this.cachedSize_.width / 2) - (this.size.width / 2);
    y = this.size.height * -1 - this.tipSize;
  }
  pstj.lab.style.css.setTranslation(this.getElement(), x, y);
};


/**
 * Shows the tooltip on the desired coordinate.
 * @param {goog.math.Coordinate} coord The x.y where the tooltip should.
 * @param {goog.math.Size} viewsize The size to which to castrate the view.
 * position itself.
 * @param {number} yadd The value to add to the Y coordinate if needed to
 * match the point position.
 */
_.showOnCoordinate = function(coord, viewsize, yadd) {
  var x = coord.x - (this.size.width / 2);
  var y = coord.y - this.size.height - this.tipSize - yadd;
  this.setTip(o.BOTTOM);

  // top left corner
  if (y < 0 && x < 0) {
    x = coord.x + this.tipSize + yadd;
    y = coord.y + this.tipSize;
    this.setTip(o.TOP_LEFT);
  }

  // top right corner
  if (y < 0 && x + this.size.width > viewsize.width) {
    x = coord.x - this.size.width - this.tipSize - yadd;
    y = coord.y + this.tipSize;
    this.setTip(o.TOP_RIGHT);
  }

  // bottom left corner
  // U can never be less than the screen 'coz the point would not be
  // visible so we check only X
  if (x < 0) {
    // initially calculate side view (tip on the RIGHT)
    x = coord.x + this.tipSize + yadd;
    y = coord.y - (this.size.height / 2);
    this.setTip(o.RIGHT);
    // now check if we are still into view.
    if (y + this.size.height > viewsize.height) {
      // ops we are too low, move to bottom left.
      y = coord.y - this.size.height;
      this.setTip(o.BOTTOM_LEFT);
    }
  }

  // bottom right corner.
  if (x + this.size.width > viewsize.width) {
    // position for left side view.
    x = coord.x - this.size.width - this.tipSize - yadd;
    y = coord.y - (this.size.height / 2);
    this.setTip(o.LEFT);
    // now check if we are still completely into view.
    if (y + this.size.height > viewsize.height) {
      // position bottom right
      y = coord.y - this.size.height;
      this.setTip(o.BOTTOM_RIGHT);
    }
  }

  // tip is too hight (top is out of screen)
  if (y < 0) {
    // we need to revert the calculation
    y = coord.y + this.tipSize + yadd;
    this.setTip(o.TOP);
  }

  pstj.lab.style.css.setTranslation(this.getElement(), x, y);

};


/**
 * Sets the tip position.
 * @param {o} orientation The orientation of the tip.
 * @protected
 */
_.setTip = function(orientation) {
  var x = 0;
  var y = 0;
  var addition = ' rotate(45deg)';
  if (orientation == o.TOP) {
    x = (this.size.width / 2) - (this.tipSize / 2);
    y = this.tipSize / -2;
  } else if (orientation == o.BOTTOM) {
    x = (this.size.width / 2) - (this.tipSize / 2);
    y = this.size.height - (this.tipSize / 2);
  } else if (orientation == o.RIGHT) {
    x = this.tipSize / -2;
    y = (this.size.height / 2) - (this.tipSize / 2);
  } else if (orientation == o.LEFT) {
    x = this.size.width - (this.tipSize / 2);
    y = (this.size.height / 2) - (this.tipSize / 2);
  } else if (orientation == o.TOP_LEFT) {
    x = 0;
    y = 0;
    addition = ' skew(45deg)';
  } else if (orientation == o.TOP_RIGHT) {
    x = this.size.width - this.tipSize;
    y = 0;
    addition = ' skew(-45deg)';
  } else if (orientation == o.BOTTOM_LEFT) {
    x = 0;
    y = this.size.height - this.tipSize;
    addition = ' skew(-45deg)';
  } else if (orientation == o.BOTTOM_RIGHT) {
    x = this.size.width - this.tipSize;
    y = this.size.height - this.tipSize;
    addition = 'skew(45deg)';
  }

  pstj.lab.style.css.setTranslation(this.querySelector('.' +
      goog.getCssName('tip')), x, y, undefined, addition);
};

});  // goog.scope
