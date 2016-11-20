sap.ui.define([
  "jquery.sap.global",
  "sap/ui/core/UIComponent",
  "sap/ui/model/resource/ResourceModel",
  "sap/ui/Device",
  "sap/ui/model/odata/v2/ODataModel",
  "sap/ui/model/json/JSONModel",
  "replace/namespace/util/ListSelector",
  "replace/namespace/util/ErrorHandler"
], function($, UIComponent, ResourceModel, Device, ODataModel, JSONModel, ListSelector, ErrorHandler) {
  "use strict";

  /**
   * Constructor for replace_title Component
   * @constructor
   *
   * @class
   * This replace_title Component is the first object initialized in the UI5 application.
   * The component is responsible for coordinating all of the inner-workings of the views,
   * controllers, and related content. If you need something to run <strong>at the VERY beginning</strong>
   * of the application, place it here. If it can wait (less priority), place it in {@link replace.namespace.controller.App App controller}.
   *
   * The Component is critical to set up these primary application functions :
   * <ul>
   *   <li>Connect to the <code>manifest.json</code> file for configuration settings</li>
   *   <li>Initialize the UI5 Router</li>
   *   <li>
   *      Create critical <code>sap.ui.model.*</code> objects and attach to <code>Component</code>
   *      <ul>
   *        <li><i><strong><code>[blank]</code></strong></i> - this is the primary ODataModel (unnamed)</li>
   *        <li><strong><code>i18n</code></strong> - Resource Bundle</li>
   *        <li><strong><code>appConfig</code></strong> - An accessible JSONModel with all entries found in <code>model/appConfig.json</code></li>
   *        <li><strong><code>masterData</code></strong> - An accessible JSONModel with necessary Master Data from our ODataModel (like UnitOfMeasures, DemandTypes)</li>
   *        <li><strong><code>user</code></strong> - A JSONModel with information about current user and roles (populated by <code>odatav3</code> ODataModel)</li>
   *        <li><strong><code>device</code></strong> - An accessible JSONModel with contents of <code>sap.ui.Device</code> information</li>
   *        <li><strong><code>odataStatus</code></strong> - JSONModel which keeps track of ongoing ODataModel requests and informs view if currently busy</li>
   *        <li><strong><code>odatav3</code></strong> - Similar to blank ODataModel, but has <code>maxDataServiceVersion</code> set to '3.0'</li>
   *      </ul>
   *   </li>
   *   <li>Attach {@link replace.namespace.util.ErrorHandler custom ErrorHandler} to Application</li>
   *   <li>Attach {@link replace.namespace.util.ListSelector custom ListSelector} to Application (to choose items in Master view automatically)</li>
   *   <li>Attach global JavaScript promise (so view knows when <code>$metadata</code> document is loaded)</li>
   *   <li>Determine if on desktop/mobile and set global CSS styles accordingly (cozy class)</li>
   *   <li>Parse and determine User Roles</li>
   * </ul>
   *
   * @author Mitchell Barry
   * @extends sap.ui.core.UIComponent
   * @alias replace.namespace.Component
   */
  var Component = UIComponent.extend("replace.namespace.Component",
    /** @lends replace.namespace.Component */
    {
      /**
       * @property {Object} oDeferredMasterDataRequests - JavaScript map of <code>jQuery.Deferred</code> objects
       *                      from Master Data reads.
       */
      oDeferredMasterDataRequests: {},

      /**
       * Routes, dataSource endpoints can be found
       * in manifest.json file
       */
      metadata: {
        manifest: "json"
      },

      /**
       * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
       * In this function, the resource and application models are set and the router is initialized.
       * @public
       * @override
       */
      init: function() {
        // https://help.sap.com/saphelp_nw74/helpdata/en/be/0cf40f61184b358b5faedaec98b2da/content.htm
        var metadata = this.getMetadata();
        // set the internationalization model
        this.setModel(new ResourceModel({
          bundleUrl: metadata.getManifestEntry("sap.app").i18n
        }), "i18n");

        var appConfigModel = new JSONModel();
        appConfigModel.loadData(
          metadata.getManifestEntry("sap.ui5").config.appConfig, // path
          {}, // parameters
          false // async (false, we want to load right away)
        );
        appConfigModel.setProperty("/appConfigPath", metadata.getManifestEntry("sap.ui5").config.appConfig);
        this.setModel(appConfigModel, "appConfig");

        var oAppModel = new ODataModel(
          appConfigModel.getData().service, {
            json: true,
            defaultCountMode: sap.ui.model.odata.CountMode.None,
            useBatch: false,
            sizeLimit: 1000
          }
        );
        this.setModel(oAppModel);
        this._setupODataStatusModel(oAppModel);

        // OData maxDataServiceVersion 3.0 model required for UserRoles endpoint *only*
        var oAppModelv3 = new ODataModel(
          appConfigModel.getData().service, {
            json: true,
            defaultCountMode: sap.ui.model.odata.CountMode.None,
            useBatch: false,
            maxDataServiceVersion: '3.0',
            sizeLimit: 1000
          }
        );
        this.setModel(oAppModelv3, "odatav3");

        // create the metadata promise
        this._createMetadataPromise(oAppModel);

        // this model will contain things like DemandTypes, Statuses, ProjectTypes, UnitsOfMeasure, ConversionFactors
        var oMasterDataModel = new JSONModel();
        this.setModel(oMasterDataModel, "masterData");

        this._createMasterDataPromise(oMasterDataModel);
        this._loadMasterData(oAppModel, oMasterDataModel);

        // set the device model
        var oDeviceModel = new JSONModel(Device);
        oDeviceModel.setDefaultBindingMode("OneWay");
        this.setupDeviceModel(oDeviceModel);
        this.setModel(oDeviceModel, "device");

        this._setupUserModel(oAppModelv3);

        // initialize the error handler with the component
        this._oErrorHandler = new ErrorHandler(this, this.getModel());
        this.oListSelector = new ListSelector();

        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // add tons of logging for development purposes
        // hint: use Chrome's log Regex Filter: "replace_title:" (without quotes)
        if (/localhost/.test(window.location.hostname)) {
          //$.sap.log.setLevel($.sap.log.LogLevel.DEBUG);
        }

        // create the views based on the url/hash
        this.getRouter().initialize();
      },

      /**
			 * The component is destroyed by UI5 automatically.
			 * In this method, the ListSelector and ErrorHandler are destroyed.
			 * @public
			 * @override
			 */
			destroy : function () {
				this.oListSelector.destroy();
				this._oErrorHandler.destroy();
				// call the base component's destroy function
				UIComponent.prototype.destroy.apply(this, arguments);
			},

      /**
			 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
			 * design mode class should be set, which influences the size appearance of some controls.
			 * @public
			 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
			 */
			getContentDensityClass : function() {
				if (this._sContentDensityClass === undefined) {
					// check whether FLP has already set the content density class; do nothing in this case
					if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
						this._sContentDensityClass = "";
					} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
						this._sContentDensityClass = "sapUiSizeCompact";
					} else {
						// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
						this._sContentDensityClass = "sapUiSizeCozy";
					}
				}
				return this._sContentDensityClass;
			},

      /**
       * Creates a promise which is resolved when the metadata is loaded.
       * @param {sap.ui.core.Model} oModel the app model
       * @private
       */
      _createMetadataPromise: function(oModel) {
        this.oWhenMetadataIsLoaded = new Promise(function(fnResolve, fnReject) {
          oModel.attachEventOnce("metadataLoaded", fnResolve);
          oModel.attachEventOnce("metadataFailed", fnReject);
        });
      },

      /**
       * Creates a promise which is resolved when the Master Data is loaded.
       *
       * Since multiple requests are queued up, use <code>jQuery.Deferred()</code> to
       * wait for each item to resolve.
       *
       * When the app loads, we want to bring into memory these types for use in various parts of the application:
       * <ul>
       *   <li>UnitOfMeasures</li>
       *   <li>DemandTypes</li>
       * </ul>
       * @see #_loadMasterData
       * @param {sap.ui.model.json.JSONModel} oModel - the master data model
       * @private
       */
      _createMasterDataPromise: function(oModel) {

        /*
          Create multiple $.Deferred() objects for each MasterData API call you make.
          These objects are resolved within this._loadMasterData()
        */

        this.oDeferredMasterDataRequests.UnitOfMeasures = $.Deferred();
        this.oDeferredMasterDataRequests.DemandTypes = $.Deferred();

        /*
          Then, create a Promise object which resolves when each API call completes
        */

        this.oWhenMasterDataIsReady = new Promise(function(fnResolve, fnReject) {
          $.when(
            this.oDeferredMasterDataRequests.UnitOfMeasures,
            this.oDeferredMasterDataRequests.DemandTypes
          ).done($.proxy(fnResolve, this));
        }.bind(this));
      },

      /**
       * Load Master Data from OData source into JSON model 'masterData' set at Component level
       * @function
       * @param {sap.ui.model.odata.v2.ODataModel} oDataModel - OData model to read Master Data
       */
      _loadMasterData: function(oDataModel) {
        /*

          Example implementation of this method from Resource Planning application:

          // load UnitOfMeasures + ConversionFactors
          oDataModel.read('/UnitOfMeasures', {
            parameters: {
              expand: 'ConversionFactors',
              select: 'ConversionFactors/ConversionFactorID,ConversionFactors/UomToID,ConversionFactors/Factor,UomID,Description'
            },
            success: function(oData, sResponse) {
              var oMasterDataModel = this.getModel('masterData');
              oMasterDataModel.setProperty('/UnitOfMeasures', oData);
              // create /UnitOfMeasures/ByID/{}
              var mUnitOfMeasures = {};
              for (var i = 0; i < oData.results.length; i++) {
                var oUom = oData.results[i];
                mUnitOfMeasures[oUom.UomID] = oUom;
              }
              oMasterDataModel.setProperty('/UnitOfMeasures/ByID', mUnitOfMeasures);
              this.oDeferredMasterDataRequests.UnitOfMeasures.resolve();
              $.sap.log.debug('replace_title: Loaded /UnitOfMeasures');
            }.bind(this),
            error: function(oError) {
              $.sap.log.error('replace_title: Error Loading /UnitOfMeasures');
            }
          });
        */
      },

      /**
       * Set 'user' OData model
       *
       * !!! the AuthorizedUserRoles endpoint requires understanding a data-type that only OData 3.0 clients
       * can understand. Use a separate OData model for this endpoint.
       *
       * @param {sap.ui.model.odata.v2.ODataModel} oDataModel requires OData maxDataServiceVersion of 3.0
       * @function
       */
      _setupUserModel: function(oDataModel) {
        if (!oDataModel) {
          $.sap.log.error("replace_title: Unable to setup user model. null oDataModel");
        }
        var userModel = {
          IsAdministrator: false,
          IsSupport: false,
          IsReadOnly: false,
          UserRoles: [],
          Name: "",
          UserID: ""
        };
        /*
          // TODO: User Model needs to be configured here!
        */
        $.sap.log.error("replace_title: User model needs to be configured.");
        /*
          // TODO: User Model needs to be configured here!
        */
        this.setModel(new JSONModel(userModel), "user");
      },

      /**
       * Perform Device model setup. This will include requiring <code>jquery.sap.storage</code>
       * module and checking if <code>localStorage</code> is supported.
       *
       * @param {sap.ui.model.json.JSONModel} oDeviceModel - <code>sap.ui.Device</code> in a JSONModel
       * @function
       */
      setupDeviceModel: function(oDeviceModel) {
        $.sap.require("jquery.sap.storage");
        var oStorage = this.getLocalStorage();
        oDeviceModel.setProperty('/storageSupported', oStorage.isSupported());
      },

      /**
       * Return jQuery.sap.storage instance for localStorage
       * @return {jQuery.sap.storage} storage object
       * @function
       */
      getLocalStorage: function() {
        return $.sap.storage($.sap.storage.Type.local);
      },

      /**
       * Create a JSONModel (<code>odataStatus</code>) attached to <code>sap.ui.getCore()</code>
       * which contains information about currently active OData requests
       *
       * This is useful to the end-user to see a BusyIndicator which
       * implies network activity.
       *
       * @function
       * @param {sap.ui.model.odata.v2.ODataModel} oModel - ODataModel to monitor for requests pending
       */
      _setupODataStatusModel: function(oModel) {
        var oStatusModel = {
          pendingRequests: 0,
          busy: false
        };

        sap.ui.getCore().setModel(new JSONModel(oStatusModel), "odataStatus");

        oModel.attachEvent("requestSent", function(oEvent) {
          $.sap.log.info("replace_title XHR: START " + oEvent.getParameter("url"));
          var oStatusModel = sap.ui.getCore().getModel("odataStatus"),
            pendingRequests = oStatusModel.getProperty("/pendingRequests");
          pendingRequests += 1;
          oStatusModel.setProperty("/pendingRequests", pendingRequests);
          oStatusModel.setProperty("/busy", pendingRequests > 0);
        });
        oModel.attachEvent("requestCompleted", function(oEvent) {
          $.sap.log.info("replace_title XHR: END " + oEvent.getParameter("url"));
          var oStatusModel = sap.ui.getCore().getModel("odataStatus"),
            pendingRequests = oStatusModel.getProperty("/pendingRequests");
          pendingRequests -= 1;
          oStatusModel.setProperty("/pendingRequests", pendingRequests);
          oStatusModel.setProperty("/busy", pendingRequests > 0);
        });
      }

    });

  return Component;

});
