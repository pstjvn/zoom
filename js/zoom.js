goog.provide('app');

goog.require('zoom.control.Main');


/**
 * Application's entry point. It is always called app to use the same make
 * command. Used to call the main controller and/or the loader.
 */
app = function() {
  zoom.control.Main.getInstance();
};

app();
