sap.ui.define([
  'sap/ui/base/Object',
  'sap/m/MessageBox'
], function(SAPObject, MessageBox) {
  "use strict";

  /**
   * Constructor for PendingChange.
   * @constructor
   *
   * @class
   * Serves as a "contract" that all pending change objects must fulfill.
   *
   * @public
   * @extends sap.ui.base.Object
   * @alias replace.namespace.model.PendingChange
   */
  var PendingChange = SAPObject.extend("replace.namespace.model.PendingChange",
    /** @lends replace.namespace.model.PendingChange.prototype */
    {
      /**
       * @property {boolean} bPersist - If PendingChange should be stored within LocalStorage. Set in constructor.
       */
      _bPersist: false,
      /**
       * @property {Object} oData - Data pending transmission to API. Set in constructor (or setter method).
       */
      _oData: null,
      /**
       * @property {String} sId - ID of Entity being sent to API. null if Create/Delete.
       */
      _sId: null,
      /**
       * @property {String} sPath - Path in ODataModel. null if Create.
       */
      _sPath: null,
      /**
       * @property {String} sEntity - enum value of PendingChange.Entity. Set in constructor.
       */
      _sEntity: null,
      /**
       * @property {String} sType - enum value of PendingChange.Type. Set in constructor.
       */
      _sType: null,
      /**
       * @property {String} sChangeId - unique ID of PendingChange
       */
      _sChangeId: null,
      /**
       * @property {function} fnSuccess - function called upon successful execution of API call. Two parameters returned: oData, sResponse
       */
      _fnSuccess: null,
      /**
       * @property {function} fnErrork - function called upon failed execution of API call. One parameter returned: oError
       */
      _fnError: null,

      /**
       * Called upon creation of Pending Change entity.
       *
       * @example
       *
       * var sChangeId = PendingChange.Entity.Demand + '-' + 1234;
       * var oPendingChange = new PendingChange(
       *    sChangeId,
       *    PendingChange.Entity.Demand,
       *    PendingChange.Type.Update,
       *    {
       *        data: oData,
       *        id: 1234,
       *        persist: false, // do not use - not implemented yet
       *        fnSuccess: function(oData, sResponse) { },
       *        fnError: function(oError) {}
       *    }
       * );
       *
       * @param {string} [sChangeId=null] - unique ID of pending change. use this to reference it within <code>PendingChangeHelper</code>.
       * @param {string} sPendingChangeEntity - uses enum of PendingChange.Entity
       * @param {string} sPendingChangeType - uses enum of PendingChange.Type
       * @param {Map} [mSettings] - key/value pair of settings for the pending change.<br />
       *                            keys include:<br />
       *                              * data {object}: data to associate with pending change (this object is sent to API)<br />
       *                              * persist {boolean}: retain in localStorage (Not Yet Implemented)<br />
       *                              * id {string}: ID to send to API<br />
       *                              * path {string}: path in ODataModel object <br />
       *                              * fnSuccess {function}: function called upon successful execution of API call <br />
       *                              * fnError {function}: function called upon failed execution of API call <br />
       * @public
       * @override
       */
      constructor: function(sChangeId, sEntity, sType, mSettings) {

        this._sChangeId = sChangeId;
        this._sEntity = sEntity;
        this._sType = sType;
        this._mSettings = mSettings;

        if (typeof sType !== 'string') { // if sChangeId was omitted, shift parameters
          this._sChangeId = null;
          this._sEntity = sChangeId; // actually sEntity
          this._sType = sEntity; // actually sType
          this._mSettings = sType; // actually mSettings
        }

        if ((this._mSettings || {}).persist) {
          this._bPersist = this._mSettings.persist;
        }
        if ((this._mSettings || {}).id) {
          this.setId(this._mSettings.id);
        }
        if ((this._mSettings || {}).data) {
          this.setData(this._mSettings.data);
        }
        if ((this._mSettings || {}).path) {
          this.setPath(this._mSettings.path);
        }
        if ((this._mSettings || {}).fnSuccess) {
          this.setFnSuccess(this._mSettings.fnSuccess);
        }
        if ((this._mSettings || {}).fnError) {
          this.setFnError(this._mSettings.fnError);
        }
      },

      /**
       * Get ID of pending change itself (useful when stored in PendingChangeHelper)
       * @returns {string} sId - ID of entity pending change to API
       */
      getChangeId: function() {
        return this._sChangeId;
      },

      /**
       * Set ID of pending change itself (useful when storing in PendingChangeHelper)
       * @param {string}
       */
      setChangeId: function(sChangeId) {
        this._sChangeId = sChangeId;
      },

      /**
       * Get path of pending change
       * @returns {string} sPath - path of pending change (ties up to ODataModel)
       */
      getPath: function() {
        return this._sPath;
      },

      /**
       * Set path of pending change (ties up to ODataModel)
       * @param {string}
       */
      setPath: function(sPath) {
        this._sPath = sPath;
      },

      /**
       * Store API entity associated with the Pending Change. If the PendingChange was marked
       * to persist when it was instantiated, it should handle this accordingly.
       * @param {Object} oData - Data which should be sent to API
       */
      setData: function(oData) {
        this._oData = oData;
        if (this._bPersist) {
          // store in local storage?
          // unimplemented functionality
        }
      },

      /**
       * Get API entity associated with the Pending Change
       * @returns {Object} oData - Data which should be sent to API
       */
      getData: function() {
        return this._oData;
      },

      /**
       * Set ID of Entity contained within pending change
       * @param {string|Object} sId - ID of entity pending change to API. Object can be passed for multiple keys in ID.
       */
      setId: function(sId) {
        if (typeof sId === 'object') {
          this.setCompositeKeyObject(true);
          this._sId = Object.keys(sId).map(function(k){return k + '=' + sId[k]}).join(",");
        } else {
          this.setCompositeKeyObject(false);
          this._sId = '' + sId;
        }
      },

      /**
       * Get ID of Entity contained within pending change
       * @returns {string} sId - ID of entity pending change to API
       */
      getId: function() {
        return '' + this._sId;
      },

      /**
       * Set function called upon successful execution of API call for pending change
       * @param {function} fnSuccess - Success callback handler after API call completes.
       */
      setFnSuccess: function(fnSuccess) {
        this._fnSuccess = fnSuccess;
      },

      /**
       * Get function called upon successful execution of API call for pending change
       * @returns {function} fnSuccess - Success callback handler after API call completes.
       */
      getFnSuccess: function() {
        return this._fnSuccess;
      },

      /**
       * Set function called upon failed execution of API call for pending change
       * @param {function} fnSuccess - Failure callback handler after API call completes.
       */
      setFnError: function(fnError) {
        this._fnError = fnError;
      },

      /**
       * Get function called upon failed execution of API call for pending change
       * @returns {function} fnError - Failure callback handler after API call completes.
       */
      getFnError: function() {
        return this._fnError;
      },

      /**
       * Change setting on whether or not to persist PendingChange in localStorage
       * @param {boolean} bPersist - true if localStorage should be used
       */
      setPersist: function(bPersist) {
        this._bPersist = bPersist;
        if (this._bPersist) { // if newly persisted, store it again with persist settings
          this.setData(this.getData());
        }
      },

      /**
       * Get setting on whether or not to persist PendingChange in localStorage
       * @returns {boolean} bPersist - true if localStorage is in use
       */
      isPersisted: function() {
        return this._bPersist;
      },

      /**
       * Change setting on whether or not object has multiple properties in its key
       * @param {boolean} bCompositeKeyObject - true if object has a composite key
       */
      setCompositeKeyObject: function(bCompositeKeyObject) {
        this._bCompositeKeyObject = bCompositeKeyObject;
      },

      /**
       * Get setting on whether or not object has multiple properties in its key
       * @returns {boolean} bCompositeKeyObject - true if object has a composite key
       */
      isCompositeKeyObject: function() {
        return this._bCompositeKeyObject;
      },

      /**
       * @returns {string} sType
       */
      getType: function() {
        return this._sType;
      },

      /**
       * Set PendingChange.Type value
       */
      setType: function(sType) {
        this._sType = sType;
      },

      /**
       * @returns {string} sEntity
       */
      getEntity: function() {
        return this._sEntity;
      },

      /**
       * Set PendingChange.Entity value
       */
      setEntity: function(sEntity) {
        this._sEntity = sEntity;
      }

    });

  /**
   * @enum {String} PendingChangeType - type of pending change
   */
  PendingChange.Type = {
    Create: 'Create',
    Update: 'Update',
    Delete: 'Delete'
  };

  /**
   * // TODO: Add with app-specific entities
   * @enum {String} PendingChangeEntity - entity of pending change. the string value is the API endpoint (used when communicating with API on Save)
   */
  PendingChange.Entity = {
    SampleObject: "SampleObjects",
    AnotherSampleObject: "AnotherSampleObjects"
  };

  PendingChange.EntityTemplate = {
    SampleObject: {
      PROPERTY_1: '',
      PROPERTY_2: 0
    },
    AnotherSampleObject: {
      PROPERTY_1: '',
      PROPERTY_2: 0
    }
  };

  return PendingChange;
});
