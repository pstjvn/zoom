goog.provide('zoom.model.FloorModel');

goog.require('goog.math.Size');
goog.require('pstj.ds.ListItem');



/**
 * @constructor
 * @extends {pstj.ds.ListItem}
 * @param {Object|Array} data The data to use as source for the item.
 */
zoom.model.FloorModel = function(data) {
  goog.base(this, data);
  this.size = null;
  this.preprocess_();
};
goog.inherits(zoom.model.FloorModel, pstj.ds.ListItem);


/**
 * @enum {string}
 */
zoom.model.FloorModel.DEFS = {
  WIDTH: 'w',
  HEIGHT: 'h',
  SRC: 'imgsrc',
  SCALE: 'scale'
};


goog.scope(function() {
var _ = zoom.model.FloorModel.prototype;
var defs = zoom.model.FloorModel.DEFS;


/**
 * Precalculate the size.
 * @private
 */
_.preprocess_ = function() {
  console.log('Preprocess', this.getProp(defs.WIDTH));
  this.size = new goog.math.Size(
      goog.asserts.assertNumber(this.getProp(defs.WIDTH)),
      goog.asserts.assertNumber(this.getProp(defs.HEIGHT)));
  console.log(this.size.width)
};


/**
 * Getter for the image source for the floor plan.
 * @return {string}
 */
_.getImageSource = function() {
  return goog.asserts.assertString(this.getProp(defs.SRC));
};


/**
 * Getter for the desired scale.
 * @return {number}
 */
_.getScale = function() {
  return goog.asserts.assertNumber(this.getProp(defs.SCALE));
}

});  // goog.scope
