goog.provide('zoom.component.FloorPlan');

goog.require('pstj.ui.TouchSheet');


/**
 * @constructor
 * @extends {pstj.ui.TouchSheet}
 */
zoom.component.FloorPlan = function() {
  goog.base(this);
};
goog.inherits(zoom.component.FloorPlan, pstj.ui.TouchSheet);

goog.scope(function() {
var _ = zoom.component.FloorPlan.prototype;

/**
 * Do not use this logic. The client does not need it.
 * @override
 */
_.fitInFrame = function() {};

});
