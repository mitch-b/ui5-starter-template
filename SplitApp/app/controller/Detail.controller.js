/*global location */
sap.ui.define([
		"replace/namespace/util/BaseController",
		"sap/ui/model/json/JSONModel",
		"replace/namespace/model/formatter"
	], function (BaseController, JSONModel, formatter) {
		"use strict";

    /**
     * Constructor for Detail Controller
     * @constructor
     *
     * @class
     * Detail Controller contains logic for -----
     *
     * @author Mitchell Barry
     * @extends replace.namespace.util.BaseController
     * @alias replace.namespace.controller.Detail
     */
		var DetailController = BaseController.extend("replace.namespace.controller.Detail",
      /** @lends replace.namespace.controller.Detail.prototype */
      {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0,
					productListTitle : this.getResourceBundle().getText("detailProductTableHeading")
				});

				this.getRouter().getRoute("supplier").attachPatternMatched(this._onSupplierMatched, this);

				this.setModel(oViewModel, "supplierView");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Updates the item count within the product table's header
			 * @param {object} oEvent an event containing the total number of items in the list
			 * @private
			 */
			onListUpdateFinished : function (oEvent) {
				var sTitle,
					iTotalItems = oEvent.getParameter("total"),
					oViewModel = this.getModel("supplierView");

				// only update the counter if the length is final
				if (this.byId("productList").getBinding("items").isLengthFinal()) {
					if (iTotalItems) {
						sTitle = this.getResourceBundle().getText("detailProductTableHeadingCount", [iTotalItems]);
					} else {
						//Display 'Products' instead of 'Products (0)'
						sTitle = this.getResourceBundle().getText("detailProductTableHeading");
					}
					oViewModel.setProperty("/productListTitle", sTitle);
				}
			},

			/**
			 * Event handler  for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();

				if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("master", {}, true);
				}
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onSupplierMatched : function (oEvent) {
				var sSupplierID =  oEvent.getParameter("arguments").supplierId;
				this.getModel().metadataLoaded().then( function() {
					var sSupplierPath = this.getModel().createKey("Suppliers", {
						ID : sSupplierID
					});
					this._bindView("/" + sSupplierPath);
				}.bind(this));
			},

			/**
			 * Binds the view to the Supplier path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sSupplierPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sSupplierPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("supplierView");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sSupplierPath,
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("detailSupplierNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}

				var sPath = oElementBinding.getPath(),
					oResourceBundle = this.getResourceBundle(),
					oSupplier = oView.getModel().getObject(sPath),
					sSupplierId = oSupplier.ID,
					sSupplierName = oSupplier.Name,
					oViewModel = this.getModel("supplierView");

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			},

			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("supplierView"),
					oProductTable = this.byId("productList"),
					iOriginalProductTableBusyDelay = oProductTable.getBusyIndicatorDelay();

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);
				oViewModel.setProperty("/productTableDelay", 0);

				oProductTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for product table
					oViewModel.setProperty("/productTableDelay", iOriginalProductTableBusyDelay);
				});

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			}

		});

    return DetailController;

	}
);
