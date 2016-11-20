/*global history */
sap.ui.define([
  "replace/namespace/util/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/Device",
  "replace/namespace/model/formatter"
], function(BaseController, JSONModel, Filter, FilterOperator, Device, formatter) {
  "use strict";

  /**
   * Constructor for Master Controller
   * @constructor
   *
   * @class
   * Master Controller contains logic for -----
   *
   * @author Mitchell Barry
   * @extends replace.namespace.util.BaseController
   * @alias replace.namespace.controller.Master
   */
  var MasterController = BaseController.extend("replace.namespace.controller.Master",
    /** @lends replace.namespace.controller.Master.prototype */
    {

      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
       * @public
       */
      onInit: function() {
        // Control state model
        var oList = this.byId("supplierList"),
          oViewModel = this._createViewModel(),
          // Put down master list's original value for busy indicator delay,
          // so it can be restored later on. Busy handling on the master list is
          // taken care of by the master list itself.
          iOriginalBusyDelay = oList.getBusyIndicatorDelay();

        this._oList = oList;
        // keeps the filter and search state
        this._oListFilterState = {
          aFilter: [],
          aSearch: []
        };

        this.setModel(oViewModel, "masterView");
        // Make sure, busy indication is showing immediately so there is no
        // break after the busy indication for loading the view's meta data is
        // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
        oList.attachEventOnce("updateFinished", function() {
          // Restore original busy indicator delay for the list
          oViewModel.setProperty("/delay", iOriginalBusyDelay);
        });

        this.getView().addEventDelegate({
          onBeforeFirstShow: function() {
            this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
          }.bind(this)
        });

        this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
        this.getRouter().attachBypassed(this.onBypassed, this);
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * After list data is available, this handler method updates the
       * master list counter and hides the pull to refresh control, if
       * necessary.
       * @param {sap.ui.base.Event} oEvent the update finished event
       * @public
       */
      onUpdateFinished: function(oEvent) {
        // update the master list object counter after new data is loaded
        this._updateListItemCount(oEvent.getParameter("total"));
        // hide pull to refresh if necessary
        this.byId("pullToRefresh").hide();
      },

      /**
       * Event handler for the master search field. Applies current
       * filter value and triggers a new search. If the search field's
       * 'refresh' button has been pressed, no new search is triggered
       * and the list binding is refresh instead.
       * @param {sap.ui.base.Event} oEvent the search event
       * @public
       */
      onSearch: function(oEvent) {
        if (oEvent.getParameters().refreshButtonPressed) {
          // Search field's 'refresh' button has been pressed.
          // This is visible if you select any master list item.
          // In this case no new search is triggered, we only
          // refresh the list binding.
          this.onRefresh();
          return;
        }

        var sQuery = oEvent.getParameter("query");

        if (sQuery) {
          this._oListFilterState.aSearch = [new Filter("Name", FilterOperator.Contains, sQuery)];
        } else {
          this._oListFilterState.aSearch = [];
        }
        this._applyFilterSearch();

      },

      /**
       * Event handler for refresh event. Keeps filter, sort
       * and group settings and refreshes the list binding.
       * @public
       */
      onRefresh: function() {
        this._oList.getBinding("items").refresh();
      },

      /**
       * Event handler for the list selection event
       * @param {sap.ui.base.Event} oEvent the list selectionChange event
       * @public
       */
      onSelectionChange: function(oEvent) {
        // get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
        this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
      },

      /**
       * Event handler for the bypassed event, which is fired when no routing pattern matched.
       * If there was an object selected in the master list, that selection is removed.
       * @public
       */
      onBypassed: function() {
        this._oList.removeSelections(true);
      },

      /**
       * Event handler for navigating back.
       * We navigate back in the browser historz
       * @public
       */
      onNavBack: function() {
        history.go(-1);
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */


      _createViewModel: function() {
        return new JSONModel({
          delay: 0,
          title: this.getResourceBundle().getText("masterTitleCount", [0]),
          noDataText: this.getResourceBundle().getText("masterListNoDataText")
        });
      },

      /**
       * If the master route was hit (empty hash) we have to set
       * the hash to to the first item in the list as soon as the
       * listLoading is done and the first item in the list is known
       * @private
       */
      _onMasterMatched: function() {
        this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
          function(mParams) {
            if (mParams.list.getMode() === "None") {
              return;
            }
            var sSupplierID = mParams.firstListitem.getBindingContext().getProperty("ID");
            this.getRouter().navTo("supplier", {
              supplierId: sSupplierID
            }, true);
          }.bind(this),
          function(mParams) {
            if (mParams.error) {
              return;
            }
            this.getRouter().getTargets().display("detailNoSuppliersAvailable");
          }.bind(this)
        );
      },

      /**
       * Shows the selected item on the detail page
       * On phones a additional history entry is created
       * @param {sap.m.ObjectListItem} oItem selected Item
       * @private
       */
      _showDetail: function(oItem) {
        var bReplace = !Device.system.phone;
        this.getRouter().navTo("supplier", {
          supplierId: oItem.getBindingContext().getProperty("ID")
        }, bReplace);
      },

      /**
       * Sets the item count on the master list header
       * @param {integer} iTotalItems the total number of items in the list
       * @private
       */
      _updateListItemCount: function(iTotalItems) {
        var sTitle;
        // only update the counter if the length is final
        if (this._oList.getBinding("items").isLengthFinal()) {
          sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
          this.getModel("masterView").setProperty("/title", sTitle);
        }
      },

      /**
       * Internal helper method to apply both filter and search state together on the list binding
       * @private
       */
      _applyFilterSearch: function() {
        var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
          oViewModel = this.getModel("masterView");
        this._oList.getBinding("items").filter(aFilters, "Application");
        // changes the noDataText of the list in case there are no filter results
        if (aFilters.length !== 0) {
          oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
        } else if (this._oListFilterState.aSearch.length > 0) {
          // only reset the no data text to default when no new search was triggered
          oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
        }
      }

    });

    return MasterController;

});
