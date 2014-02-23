goog.provide('zoom.component.Sensor');

goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.ui.Control');
goog.require('pstj.ds.ListItem');
goog.require('zoom.model.SensorModel');



/**
 * @constructor
 * @extends {goog.ui.Control}
 */
zoom.component.Sensor = function() {
  goog.base(this);
};
goog.inherits(zoom.component.Sensor, goog.ui.Control);

goog.scope(function() {
var _ = zoom.component.Sensor.prototype;


/** @inheritDoc */
_.setModel = function(model) {
  goog.asserts.assertInstanceof(model, zoom.model.SensorModel);
  goog.base(this, 'setModel', model);
};


/** @inheritDoc */
_.enterDocument = function() {
  goog.dom.classlist.add(this.getElement(), goog.getCssName('sensor'));
  if (!goog.isNull(this.getModel())) {
    var span = goog.dom.createDom('span', goog.getCssName('val'));
    goog.dom.setTextContent(span, '10%');
    var size = this.getModel().getSize() + 'px';
    var halfSize = (this.getModel().getSize() / -2) + 'px';
    span.style.top = halfSize;
    span.style.left = halfSize;
    span.style.lineHeight = size;
    span.style.fontSize = halfSize;
    goog.dom.appendChild(this.getElement(), span);
    this.getElement().style.border = this.getModel().getBorderStyle();
    this.getElement().style.top = this.getModel().getPercentTop();
    this.getElement().style.left = this.getModel().getPercentLeft();
    this.getElement().style.borderRadius = size;
    pstj.lab.style.css.setTranslation(this.getElement(),
        this.getModel().getSize() * -1,
        this.getModel().getSize() * -1);
  } else {
    throw new Error('Cannot process without data model');
  }
  goog.base(this, 'enterDocument');
};

});  // goog.scope
