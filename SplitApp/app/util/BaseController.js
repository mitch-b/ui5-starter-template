sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History"
], function(Controller, History) {
  "use strict";

  /**
   * Constructor for BaseController
   *
   * @constructor
   *
   * @class
   * Serves as primary <code>.extend()</code> for all controllers. Provides helper methods.
   * @author Mitchell Barry
   * @extends sap.ui.core.mvc.Controller
   * @alias replace.namespace.util.BaseController
   */
  var BaseController = Controller.extend("replace.namespace.util.BaseController",
    /** @lends replace.namespace.util.BaseController.prototype */
    {

      /**
       * Generic function to format i18n strings given data from XML views. This is a convenience method.
       *
       * @author Mitchell Barry
       * @version 1.2016.0405.1
       * @example
       *
       * <Text text="{ parts: [{ path: 'view>/i18n/StatusExpandedMessage' }, { path: 'Description' }], formatter: '.i18nFormatter' }" />
       *
       * @param {string} sKey - this is the i18n key in your messageBundle to use. !!! IMPORTANT !!! this key must be sent through
       *                        a model (like View JSONModel). You cannot pass string literals in the <code>{ parts: [] }</code> array in XML.
       * @param {string} [dynamic] - This function accepts any number of strings (parts) to add to i18n string.
       *                             These dynamic strings are added to i18n with <code>Array.prototype.slice.call(arguments, 1)</code>.
       */
      i18nFormatter: function (sKey) {
        if (sKey) {
          return this.getResourceBundle().getText(sKey, Array.prototype.slice.call(arguments, 1));
        } else {
          return null;
        }
      },

      /**
       * Call this method to strap the controller's model to <code>sap.ui.getCore()</code>'s
       * implementation of OData network activity.
       * @public
       * @function
       */
      setupODataStatusModel: function() {
        this.setModel(sap.ui.getCore().getModel("odataStatus"), "odataStatus");
      },

      /**
       * Get instance of PendingChangeHelper for this controller
       * @returns {CAG.SharedSvcs.PMO.ResourcePlanning.Projects.util.PendingChangeHelper} oPendingChangeHelper
       */
      getPendingChangeHelper: function() {
        if(!this._oPendingChangeHelper){
          this._oPendingChangeHelper = new PendingChangeHelper(this);
        }
        return this._oPendingChangeHelper;
      },

      /**
       * Add a new pending change for this controller
       * @param {CAG.SharedSvcs.PMO.ResourcePlanning.Projects.model.PendingChange} oPendingChange - Add this pending change to internal PendingChangeHelper
       */
      addPendingChange: function(oPendingChange) {
        this.getPendingChangeHelper().addChange(oPendingChange);
      },

      /**
       * When user clicks on their named button, show UserInfo fragment.
       *
       * @event
       */
      onUserInfoPress: function(oEvent) {
        if (!this._oUserInfoPopover) {
          this._oUserInfoPopover = sap.ui.xmlfragment("replace.namespace.view.fragment.UserInfo", this);
          this.getView().addDependent(this._oUserInfoPopover);
        }
        this._oUserInfoPopover.openBy(oEvent.getSource());
      },

      /**
       * Event handler for personalization functionality
       *
       * @event
       */
      onCloseUserInfo: function(oEvent) {
        this._oUserInfoPopover.close();
      },

      /**
       * Convenience method for accessing the event bus.
       * @public
       * @returns {sap.ui.core.EventBus} the event bus for this component
       */
      getEventBus: function() {
        return this.getOwnerComponent().getEventBus();
      },

      /**
       * Convenience method for accessing the router.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter: function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
      },

      /**
       * Convenience method for getting the view model by name.
       * @public
       * @param {string} [sName] the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel: function(sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Convenience method for setting the view model.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setModel: function(oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      /**
       * Getter for the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle: function() {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      /**
       * Navigates back in the browser history, if the entry was created by this app.
       * If not, it navigates to a route passed to this function.
       *
       * @public
       * @param {string} sRoute the name of the route if there is no history entry
       * @param {object} mData the parameters of the route, if the route does not need parameters, it may be omitted.
       */
      myNavBack: function(sRoute, mData) {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        // if this function is called by an EventHandler, throw some defaults in
        if (typeof sRoute === 'object') {
          mData = sRoute;
          sRoute = "main"; // default Main route
        }

        //The history contains a previous entry
        if (sPreviousHash !== undefined && sRoute === undefined) {
          /*eslint-disable */
          window.history.go(-1);
          /*eslint-enable */
        } else if (sRoute === "FLPBackToHome") {
          // navigate back to FLP home
          // TODO: Test this in a working sandbox, with the current version it is not possible
          var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
          if (oCrossAppNavigator) {
            oCrossAppNavigator.toExternal({
              target: {
                shellHash: "#"
              }
            });
          }
        } else {
          var bReplace = true; // otherwise we go backwards with a forward history
          this.getRouter().navTo(sRoute, mData, bReplace);
        }
      }

    });

  return BaseController;

});
