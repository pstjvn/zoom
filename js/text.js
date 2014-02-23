goog.provide('zoom.text');

goog.require('pstj.configure');

goog.scope(function() {
var _ = zoom.text;


/**
 * Predefined the getter for easier use.
 * @private
 * @type {function(string, pstj.configure.Value): pstj.configure.Value}
 */
_.get_ = pstj.configure.createPrefixedLookUp('AREOUS.TEXT');


/**
 * The text when button will start the animation.
 * @type {string}
 */
_.startAnimation = goog.asserts.assertString(
    _.get_('START_ANIMATION', 'Start animation'));


/**
 * The text when the button will stop the animation.
 * @type {string}
 */
_.stopAnimation = goog.asserts.assertString(
    _.get_('STOP_ANIMATION', 'Stop animation'));

});  // goog.scope
