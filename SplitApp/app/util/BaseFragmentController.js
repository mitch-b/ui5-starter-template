sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History"
], function(Controller, History) {
  "use strict";

  /**
   * Constructor for BaseFragmentController
   *
   * @constructor
   *
   * @class
   * Serves as primary <code>.extend()</code> for all controllers. Provides helper methods.
   * @author Mitchell Barry
   * @extends sap.ui.core.mvc.Controller
   * @alias replace.namespace.util.BaseFragmentController
   */
  var BaseFragmentController = Controller.extend("replace.namespace.util.BaseFragmentController",
    /** @lends replace.namespace.util.BaseFragmentController.prototype */
    {
      /**
       * Allow fragment to communicate with component
       * @param {Object} oComponent - UIComponent the fragment lives in
       */
      setComponent: function(oComponent) {
        this._oComponent = oComponent;
      },

      /**
       * @returns {Object} oComponent - containing UIComponent (either set or reading from Controller)
       */
      getComponent: function() {
        return this._oComponent || this.getController().getOwnerComponent();
      },

      setController: function(oController) {
        this._oController = oController;
      },

      getController: function() {
        return this._oController;
      },

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
      i18nFormatter: function(sKey) {
        if (sKey) {
          return this.getResourceBundle().getText(sKey, Array.prototype.slice.call(arguments, 1));
        } else {
          return null;
        }
      },

      /**
       * Return the JSONModel for appConfig (easily retrieve config values)
       * @function
       * @returns {sap.ui.model.json.JSONModel} oAppConfigModel - JSONModel from UIComponent with contents of /model/appConfig.json
       */
      getAppConfig: function() {
        return this.getComponent().getModel('appConfig');
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
        return this.getComponent().getEventBus();
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
       * @returns {sap.ui.model.Model} the model instance (try in View, then in Component)
       */
      getModel: function(sName) {
        return this.getController().getView().getModel(sName) || this.getComponent().getModel(sName);
      },

      /**
       * Getter for the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle: function() {
        return this.getComponent().getModel("i18n").getResourceBundle();
      }
    });

  return BaseFragmentController;

});
