goog.provide('zoom.model.SensorModel');

goog.require('pstj.ds.ListItem');



/**
 * @constructor
 * @extends {pstj.ds.ListItem}
 * @param {Object|Array} data The data to use as source for the item.
 */
zoom.model.SensorModel = function(data) {
  goog.base(this, data);
};
goog.inherits(zoom.model.SensorModel, pstj.ds.ListItem);


/**
 * @enum {string}
 */
zoom.model.SensorModel.DEFS = {
  COLOR: 'font_color',
  WIDTH: 'left',
  HEIGHT: 'top',
  PERCENT_TOP: 'py',
  PERCENT_LEFT: 'px',
  SIZE: 'size',
  NAME: 'name',
  UNIT: 'unit',
  BACKGROUND_COLOR: 'dot_color',
  VALUE: 'current'
};


goog.scope(function() {
var _ = zoom.model.SensorModel.prototype;
var defs = zoom.model.SensorModel.DEFS;


/**
 * Generates the border to be applied to the item based on the model.
 * @return {string}
 */
_.getBorderStyle = function() {
  var color = goog.asserts.assertString(this.getProp(defs.BACKGROUND_COLOR));
  var size = goog.asserts.assertNumber(this.getProp(defs.SIZE));
  return Math.ceil(size) + 'px solid ' + color;
};


/**
 * Getter for the formatted value.
 * @return {string}
 */
_.getFormatedValue = function() {
  var value = this.getProp(defs.VALUE);
  if (goog.isNull(value)) return '';
  return goog.asserts.assertString(
      this.getProp(defs.VALUE) + this.getProp(defs.UNIT));
};


/**
 * @return {string}
 */
_.getFontColor = function() {
  return goog.asserts.assertString(this.getProp(defs.COLOR));
};


/**
 * Getter for the size of the item.
 * @return {number}
 */
_.getSize = function() {
  return goog.asserts.assertNumber(this.getProp(defs.SIZE));
};


/**
 * Calculates and returns the percent based top value.
 * @return {string}
 */
_.getPercentTop = function() {
  return this.getProp(defs.PERCENT_TOP) + '%';
};


/**
 * Caluclates and returns the percent based value for left position.
 * @return {string}
 */
_.getPercentLeft = function() {
  return this.getProp(defs.PERCENT_LEFT) + '%';
};


/**
 * Getter for the native offsets of the point.
 * @param {boolean} is_x If the X offset should be returned.
 * @return {number}
 */
_.getOffset = function(is_x) {
  if (is_x) return goog.asserts.assertNumber(this.getProp(defs.WIDTH));
  return goog.asserts.assertNumber(this.getProp(defs.HEIGHT));
}

});  // goog.scope
