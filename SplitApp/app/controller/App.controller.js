sap.ui.define([
  "jquery.sap.global",
  "replace/namespace/util/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function($, BaseController, JSONModel, MessageToast) {
  "use strict";

  /**
   * Constructor for App Controller
   * @constructor
   *
   * @class
   * App Controller is the parent Controller for the application. The App view loads up a NavContainer
   * which is managed by the OpenUI5 Router. The App Controller should only hold global activities.
   * It's primary purpose is to perform activities like:
   * <ul>
   *   <li>Set entire app <code>busy</code> until OData <code>$metadata</code> document is loaded</li>
   *   <li>Create <code>AJAX</code> request to see if user is running latest version of the app</li>
   * </ul>
   *
   * @author Mitchell Barry
   * @extends replace.namespace.util.BaseController
   * @alias replace.namespace.controller.App
   */
  var AppController = BaseController.extend("replace.namespace.controller.App",
    /** @lends replace.namespace.controller.App.prototype */
    {

      /**
       * Called when the App view is instantiated.
       * @override
       * @references _checkLatestVersion
       */
      onInit: function() {

        var oViewModel,
          fnSetAppNotBusy,
          oListSelector = this.getOwnerComponent().oListSelector,
          iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

        oViewModel = new JSONModel({
          busy: true,
          delay: 0
        });
        this.setModel(oViewModel, "view");

        fnSetAppNotBusy = function() {
          oViewModel.setProperty("/busy", false);
          oViewModel.setProperty("/delay", iOriginalBusyDelay);
        };

        this.getOwnerComponent().oWhenMetadataIsLoaded
          .then(fnSetAppNotBusy, fnSetAppNotBusy);

        // if we are not running on localhost, determine if we are
        // running the latest version of our web application (not-cached)
        if (window.location.hostname !== 'localhost') {
          var oAppConfig = this.getOwnerComponent().getModel("appConfig");
          var sRunningVersion = oAppConfig.getProperty("/version");
          var sAppConfigPath = oAppConfig.getProperty("/appConfigPath");

          this._checkLatestVersion(sRunningVersion, sAppConfigPath);
        }
      },

      /**
       * Create an AJAX request to re-pull the appConfig.json file from web server.
       * We will make sure it is not cached, so we can compare our current
       * version (on site load) to the file residing on the server. If there is a
       * version mismatch, we should propose the user clears their browser cache and
       * reloads.
       *
       * @function
       * @param {string} sRunningVersion current version number from appConfig JSONModel
       * @param {string} sUrl path to appConfig JSON file on web server
       */
      _checkLatestVersion: function(sRunningVersion, sUrl) {
        $.ajax({
          url: sUrl,
          cache: false,
          dataType: 'json',
          success: function(oData, sStatus, jqXHR) {
            var sLatestVersion = oData.version;
            if (sLatestVersion && sRunningVersion !== sLatestVersion) {
              $.sap.log.error("replace_title: New version available: " + sLatestVersion);
              MessageToast.show(
                this.getResourceBundle().getText("errorOldVersionToast", [sRunningVersion, sLatestVersion]), {
                  duration: 10000,
                  width: '50%'
                }
              );
            }
          }.bind(this),
          error: function(oError) {
            $.sap.log.error("replace_title: Failed to retrieve non-cached appConfig from " + sUrl);
          }
        });
      }

    });
  return AppController;
});
