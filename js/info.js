goog.provide('zoom.component.Info');

goog.require('goog.dom.classlist');
goog.require('goog.style');
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
  return zoom.template.info({});
};

});  // goog.scope



/**
 * @constructor
 * @extends {pstj.ui.Templated}
 */
zoom.component.Info = function() {
  goog.base(this, zoom.component.InfoTemplate.getInstance());
  this.size = null;
};
goog.inherits(zoom.component.Info, pstj.ui.Templated);


goog.scope(function() {
var _ = zoom.component.Info.prototype;


/** @inheritDoc */
_.setModel = function(model) {
  goog.asserts.assertInstanceof(model, pstj.ds.ListItem);
  goog.base(this, 'setModel', model);
  pstj.ui.ngAgent.getInstance().apply(this);
};


/** @inheritDoc */
_.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.size = goog.style.getSize(this.getElement());
};


/**
 * Sets the active sttae of the component.
 * The implementation is in CSS.
 * @param {boolean} active If true the active class will be added.
 * @param {number=} opt_offset The offset to send the tooltip to.
 */
_.setActive = function(active, opt_offset) {
  if (!goog.isNumber(opt_offset)) opt_offset = -200;
  goog.dom.classlist.enable(this.getElement(), goog.getCssName('active'),
      active);
  pstj.lab.style.css.setTranslation(this.getElement(), 0, opt_offset);
};

});  // goog.scope
