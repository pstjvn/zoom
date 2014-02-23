goog.provide('zoom.component.SensorLayer');

goog.require('goog.dom.classlist');
goog.require('pstj.ui.TouchSheet');
goog.require('zoom.component.Sensor');



/**
 * @constructor
 * @extends {pstj.ui.TouchSheet}
 */
zoom.component.SensorLayer = function() {
  goog.base(this);
};
goog.inherits(zoom.component.SensorLayer, pstj.ui.TouchSheet);


goog.scope(function() {
var _ = zoom.component.SensorLayer.prototype;


/** @inheritDoc */
_.setModel = function(model) {
  goog.asserts.assertInstanceof(model, pstj.ds.List);
  goog.base(this, 'setModel', model);
  this.createSensors();
};


/** @override */
_.fitInFrame = function() {};


/**
 * Creates the sensords based on the model.
 * @protected
 */
_.createSensors = function() {
  if (goog.isNull(this.getModel())) {
    this.clearSesonrs();
  } else {
    this.getModel().forEach(this.createSensor, this);
  }
};


/**
 * Removes all sensors.
 */
_.clearSesonrs = function() {
  this.removeChildren(true);
};


/** #inheritDoc */
_.applySize = function() {
  goog.base(this, 'applySize');
  goog.dom.classlist.remove(this.getElement(), goog.getCssName('scaling'));
};


/** @inheritDoc */
_.handleWheel = function(e) {
  goog.dom.classlist.add(this.getElement(), goog.getCssName('scaling'));
  goog.base(this, 'handleWheel', e);
};


/**
 * Creates a single sensor.
 * @param {zoom.model.SensorModel} item The model for the sensor.
 * @param {number} index The index of the model.
 * @protected
 */
_.createSensor = function(item, index) {
  var sensor = new zoom.component.Sensor();
  sensor.setModel(item);
  this.addChild(sensor, true);
};

});  // goog.scope
