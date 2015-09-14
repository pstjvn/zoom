goog.provide('zoom.component.PlanSwitcher');

goog.require('pstj.ui.Template');
goog.require('pstj.ui.Templated');



/**
 * @constructor
 * @extends {pstj.ui.Templeted}
 */
zoom.component.PlanSwitcher = function() {
  goog.base(this);
};
goog.inherits(zoom.component.PlanSwitcher, pstj.ui.Templated);


goog.scope(function(){
var _ = zoom.component.PlanSwitcher.prototype;



});  // goog.scope



/**
 * @constructor
 * @extends {pstj.ui.Template}
 */
zoom.component.PlanSwitcherTemplate = function() {
  goog.base(this);
};
goog.inherits(zoom.component.PlanSwitcherTemplate, pstj.ui.Template);
goog.addSingletonGetter(zoom.component.PlanSwitcherTemplate)


goog.scope(function() {
var _ = zoom.component.PlanSwitcherTemplate.prototype;


/** @inheritDoc */
_.getTemplate = function(data) {
  return zoom.template.switcher(data);
};


/** @inheritDoc */
_.generateTemplateData = function(component) {
  return component.getModel().getRawData();
};

});  // goog.scope
