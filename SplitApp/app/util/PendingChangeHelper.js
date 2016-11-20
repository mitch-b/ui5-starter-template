sap.ui.define([
    'sap/ui/base/Object',
    'sap/m/MessageBox',
    'sap/ui/model/json/JSONModel',
    'replace/namespace/IMMDashboard/model/PendingChange'
], function(SAPObject, MessageBox, JSONModel, PendingChange) {
    "use strict";

    /**
     * Constructor for PendingChangeHelper.
     * @constructor
     *
     * @class
     * This class is a wrapper around the <code>{PendingChanges>/}</code> JSONModel.
     * Use this class when working with PendingChanges model <strong>always</strong>.
     * This reduces string paths littered around the code.
     *
     * @public
     * @extends sap.ui.base.Object
     * @alias replace.namespace.util.PendingChangeHelper
     */
    var PendingChangeHelper = SAPObject.extend("replace.namespace.util.PendingChangeHelper",
        /** @lends replace.namespace.util.PendingChangeHelper.prototype */
        {
            constructor: function(oContext) {
                this.oContext = oContext;
            },

            getChangeStorageModel: function() {
                var oPendingChangesModel = this.oContext.getModel('PendingChanges');
                if (!oPendingChangesModel) { // create if not existing on first retrieval
                    oPendingChangesModel = new JSONModel();
                    this.oContext.setModel(oPendingChangesModel, 'PendingChanges');
                }
                return oPendingChangesModel;
            },

            /**
             * Use this method to receive a list of PendingChanges.
             * @function
             * @param {string} [sEntity] - PendingChange.Entity storage. if not provided, returns all objects.
             * @returns {replace.namespace.model.PendingChange[]} aChanges - Pending Changes
             */
            getPendingChanges: function(sEntity) {
                if (!sEntity) {
                    return this._getAllPendingChanges();
                }
                var oPendingChangesModel = this.getChangeStorageModel();
                if (!oPendingChangesModel.getProperty('/' + sEntity)) { // if no entity of this type exists yet, create empty storage array
                    oPendingChangesModel.setProperty('/' + sEntity, []);
                }
                return (oPendingChangesModel.getProperty('/' + sEntity) || []);
            },

            /**
             * Return a list of all <code>PendingChange</code> objects.
             * @private
             * @returns {replace.namespace.model.PendingChange[]} aChanges - List of all PendingChange objects
             */
            _getAllPendingChanges: function() {
                var oPendingChangesModel = this.getChangeStorageModel();
                var aKeys = Object.keys(oPendingChangesModel.getProperty('/'));
                var aChanges = [];
                for (var i = 0; i < aKeys.length; i++) {
                    var aEntityChanges = oPendingChangesModel.getProperty('/' + aKeys[i]);
                    aChanges = aChanges.concat(aEntityChanges);
                }
                return aChanges;
            },

            setPendingChanges: function(sEntity, aChanges) {
                var oPendingChangesModel = this.getChangeStorageModel();
                oPendingChangesModel.setProperty('/' + sEntity, (aChanges || []));
                oPendingChangesModel.refresh(true);
            },

            hasPendingChanges: function(sEntity) {
                var oPendingChangesModel = this.getChangeStorageModel();
                if (sEntity) {
                    return oPendingChangesModel.getProperty('/' + sEntity).length > 0;
                } else {
                    var aKeys = Object.keys(oPendingChangesModel.getProperty('/'));
                    var iCount = 0;
                    for (var i = 0; i < aKeys.length; i++) {
                        var aChanges = oPendingChangesModel.getProperty('/' + aKeys[i]);
                        iCount += (aChanges || []).length;
                    }
                    return iCount > 0;
                }
            },

            /**
             * Add a pending change to internal list. If there is a conflict with the <code>sChangeId</code>, the old item will be
             * purged and the new PendingChange object will be added.
             *
             * @param {replace.namespace.model.PendingChange} oPendingChange - Pending Change to add to list
             */
            addChange: function(oPendingChange) {
                var oPendingChangesModel = this.getChangeStorageModel();
                if (oPendingChange.getChangeId()) {
                    this.removeChangeId(oPendingChange.getEntity(), oPendingChange.getChangeId());
                }
                var aChanges = this.getPendingChanges(oPendingChange.getEntity());
                aChanges.push(oPendingChange);
                oPendingChangesModel.setProperty('/' + oPendingChange.getEntity(), aChanges);
                oPendingChangesModel.refresh(true);
                $.sap.log.debug('replace_title: Added change, now ' + aChanges.length + ' changes pending.');
            },

            getChange: function(sEntity, sChangeId) {
                var aChanges = this.getPendingChanges(sEntity);
                for (var i = 0; i < aChanges.length; i++) {
                    var oChange = aChanges[i];
                    if (oChange.getChangeId() === sChangeId) {
                        return oChange;
                    }
                }
                return null;
            },

            removeChangeId: function(sEntity, sChangeId) {
                if (!sEntity || !sChangeId) {
                    return;
                }
                var aChanges = this.getPendingChanges(sEntity);
                for (var i = 0; i < aChanges.length; i++) {
                    var oExistingChange = aChanges[i];
                    if (oExistingChange.getChangeId() === sChangeId) {
                        aChanges.splice(i, 1);
                        $.sap.log.debug('replace_title: Removed change ID ' + sChangeId);
                    }
                }
                this.getChangeStorageModel().refresh(true); // update UI
            },

            /**
             * Clear Pending Changes. You can optionally specify an Entity to only remove
             * the changes associated with that entity type. If you know the ChangeID, you can
             * use <code>removeChangeId(sChangeId)</code> to remove a single entry.
             *
             * @param {string} sEntity - Entity type to remove
             */
            clearAll: function(sEntity) {
                this.setPendingChanges(sEntity, []);
            },

            /**
             * Save a single PendingChange object (Experimental)
             *
             * @example
             *
             * var oPendingChangeHelper = this.getPendingChangeHelper();
             * oPendingChangeHelper.save(
             *  oDataModel, // OData model
             *  oPendingChangeHelper.getChange(PendingChange.Entity.Project, 'changeId123'), // Pending Change
             *  {
             *    fnSuccess: this.handleProjectSavedSuccess.bind(this)
             *    fnError: function(oError) { ... }
             *  }
             * );
             * @function
             * @param {sap.ui.model.odata.v2.ODataModel} oDataModel - ODataModel used to make API calls
             * @param {CAG.SharedSvcs.PMO.ResourcePlanning.Projects.model.PendingChange} oPendingChange - PendingChange to save
             * @param {map} mSettings - settings object used to store callback functions:<br />
             *                          * fnSuccess - called upon all items saved Successfully <br />
             *                          * fnError - called upon items saved erroneously
             */
            save: function(oDataModel, oPendingChange, mSettings) {
                mSettings = mSettings || {};

                var fnApiCall = this['sendApi' + oPendingChange.getType()]; // sendApiCreate, sendApiUpdate, sendApiDelete
                if (!fnApiCall) {
                    var sMessage = 'Invalid PendingChange.Type';
                    $.sap.log.error('replace_title: ' + sMessage);
                    if (mSettings.fnError) {
                        mSettings.fnError({
                            message: sMessage
                        });
                    }
                    return;
                }
                
                // dynamically call the proper API method based on the PendingChange.Type.x
                // property.
                var fn = function(mSettings) {
                    fnApiCall(oPendingChange, {
                        oDataModel: oDataModel,
                        mPayload: oPendingChange.getData(),
                        fnSuccess: function(oData, sResponse) {
                            this.handleApiSuccess(oData, sResponse, oPendingChange);
                            // callback on PendingChange object
                            if (oPendingChange && oPendingChange.getFnSuccess()) {
                                oPendingChange.getFnSuccess().apply(this, [oData, sResponse]);
                            }
                            // callback on specific .save() call
                            if (mSettings.fnSuccess) {
                                mSettings.fnSuccess(oData, sResponse);
                            }
                        }.bind(this),
                        fnError: function(oError) {
                            this.handleApiError(oError, oPendingChange);
                            // callback on PendingChange object
                            if (oPendingChange && oPendingChange.getFnError()) {
                                oPendingChange.getFnError().apply(this, [oError]);
                            }
                            // callback on specific .save() call
                            if (mSettings.fnError) {
                                mSettings.fnError(oError);
                            }
                        }.bind(this)
                    });
                }.bind(this);
                fn(mSettings);
            },

            /**
             * Loop through internal PendingChanges model and save to ODataModel
             *
             * @function
             * @param {sap.ui.model.odata.v2.ODataModel} oDataModel - ODataModel used to make API calls
             * @param {string} sEntity - PendingChange.Entity to save
             * @returns {$.Deferred[]} aDeferreds - array of $.Deferred objects which can be waited until resolve by caller
             */
            saveAll: function(oDataModel, sEntity) {
                var aChanges = this.getPendingChanges(sEntity);
                var aDeferreds = [];
                for (var i = 0; i < aChanges.length; i++) {
                    var oPendingChange = aChanges[i];
                    var oDeferred = new $.Deferred();
                    aDeferreds.push(oDeferred);

                    var fnApiCall = this['sendApi' + oPendingChange.getType()]; // sendApiCreate, sendApiUpdate, sendApiDelete
                    if (!fnApiCall) {
                        $.sap.log.error('replace_title: Invalid PendingChange.Type');
                        continue;
                    }
                    // dynamically call the proper API method based on the PendingChange.Type.x
                    // property.
                    var fn = function(oDeferred) {
                        fnApiCall(oPendingChange, {
                            oDataModel: oDataModel,
                            mPayload: oPendingChange.getData(),
                            fnSuccess: function(oData, sResponse) {
                                this.handleApiSuccess(oData, sResponse, oPendingChange);
                                if (oPendingChange && oPendingChange.getFnSuccess()) {
                                    oPendingChange.getFnSuccess().apply(this, [oData, sResponse]);
                                }
                                oDeferred.resolve();
                            }.bind(this),
                            fnError: function(oError) {
                                this.handleApiError(oError, oPendingChange);
                                if (oPendingChange && oPendingChange.getFnError()) {
                                    oPendingChange.getFnError().apply(this, [oError]);
                                }
                                oDeferred.fail();
                            }.bind(this)
                        });
                    }.bind(this);
                    fn(oDeferred);
                }
                return aDeferreds;
            },

            /**
             * Send API <code>HTTP POST</code> request to create a new entry.This method
             * contains no logic, only submits API request and uses callbacks from incoming <code>mSettings</code> parameter.
             * @example
             *
             * this.sendApiCreate(oPendingChange, {
             *  oDataModel: oDataModel,
             *  mPayload: oPendingChange.mPayload,
             *  fnSuccess: function(oData, sResponse) { this.handleApiSuccess(oData, sResponse); },
             *  fnError: function(oError) { this.handleApiError(oError); }
             * });
             *
             * @function
             * @param {Object} mSettings - settings object which contains properties:
             *                             oDataModel, (ODataModel used to make API call)
             *                             mPayload, (object to send to API)
             *                             fnSuccess, (callback function on success (oData, sResponse parameters sent))
             *                             fnError, (callback function on failure (oError parameter sent))
             */
            sendApiCreate: function(oPendingChange, mSettings) {
                var mPayload = mSettings.mPayload;
                var oDataModel = (mSettings.oDataModel || this.oContext.getModel());

                oDataModel.create('/' + oPendingChange.getEntity(), mPayload, {
                    success: function(oData, sResponse) {
                        if (mSettings.fnSuccess) {
                            mSettings.fnSuccess(oData, sResponse);
                        }
                    }.bind(this),
                    error: function(oError) {
                        if (mSettings.fnError) {
                            mSettings.fnError(oError);
                        }
                    }.bind(this)
                });
            },

            /**
             * Send API <code>HTTP POST (x-http-header PATCH)</code> request to update an entry.This method
             * contains no logic, only submits API request and uses callbacks from incoming <code>mSettings</code> parameter.
             * @example
             *
             * this.sendApiUpdate(oPendingChange, {
             *  oDataModel: oDataModel,
             *  mPayload: oPendingChange.mPayload,
             *  fnSuccess: function(oData, sResponse) { this.handleApiSuccess(oData, sResponse); },
             *  fnError: function(oError) { this.handleApiError(oError); }
             * });
             *
             * @function
             * @param {Object} mSettings - settings object which contains properties:
             *                             oDataModel, (ODataModel used to make API call)
             *                             mPayload, (object to send to API)
             *                             fnSuccess, (callback function on success (oData, sResponse parameters sent))
             *                             fnError, (callback function on failure (oError parameter sent))
             */
            sendApiUpdate: function(oPendingChange, mSettings) {
                var mPayload = mSettings.mPayload;
                var oDataModel = (mSettings.oDataModel || this.oContext.getModel());

                if (!oPendingChange.getEntity() || !oPendingChange.getId()) {
                    var sMessage = 'replace_title: Insufficient details stored in PendingChange object to submit to API: ' + JSON.stringify(oPendingChange);
                    $.sap.log.error(sMessage);
                    if (mSettings.fnError) {
                        mSettings.fnError({
                            message: sMessage
                        });
                    }
                }

                var sEndpoint = '/' + oPendingChange.getEntity();
                var sId = oPendingChange.getId();
                if (isNaN(sId) && !oPendingChange.isCompositeKeyObject()) {
                    sEndpoint = sEndpoint + "('" + sId + "')";
                } else {
                    sEndpoint = sEndpoint + "(" + sId + ")";
                }


                oDataModel.update(sEndpoint, mPayload, {
                    success: function(oData, sResponse) {
                        if (mSettings.fnSuccess) {
                            mSettings.fnSuccess(oData, sResponse);
                        }
                    }.bind(this),
                    error: function(oError) {
                        if (mSettings.fnError) {
                            mSettings.fnError(oError);
                        }
                    }.bind(this)
                });
            },

            /**
             * Send API <code>HTTP DELETE</code> request to remove an entry. This method
             * contains no logic, only submits API request and uses callbacks from incoming <code>mSettings</code> parameter.
             * @example
             *
             * this.sendApiDelete(oPendingChange, {
             *  oDataModel: oDataModel,
             *  mPayload: oPendingChange.mPayload,
             *  fnSuccess: function(oData, sResponse) { this.handleApiSuccess(oData, sResponse); },
             *  fnError: function(oError) { this.handleApiError(oError); }
             * });
             *
             * @function
             * @param {Object} mSettings - settings object which contains properties:
             *                             oDataModel, (ODataModel used to make API call)
             *                             mPayload, (object not used)
             *                             fnSuccess, (callback function on success (oData, sResponse parameters sent))
             *                             fnError, (callback function on failure (oError parameter sent))
             */
            sendApiDelete: function(oPendingChange, mSettings) {
                var mPayload = mSettings.mPayload;
                var oDataModel = (mSettings.oDataModel || this.oContext.getModel());

                if (!oPendingChange.getEntity() || !oPendingChange.getId()) {
                    var sMessage = 'replace_title: Insufficient details stored in PendingChange object to submit to API: ' + JSON.stringify(oPendingChange);
                    $.sap.log.error(sMessage);
                    if (mSettings.fnError) {
                        mSettings.fnError({
                            message: sMessage
                        });
                    }
                }

                var sEndpoint = '/' + oPendingChange.getEntity();
                var sId = oPendingChange.getId();
                if (isNaN(sId) && !oPendingChange.isCompositeKeyObject()) {
                    sEndpoint = sEndpoint + "('" + sId + "')";
                } else {
                    sEndpoint = sEndpoint + "(" + sId + ")";
                }

                oDataModel.remove(sEndpoint, {
                    success: function(oData, sResponse) {
                        if (mSettings.fnSuccess) {
                            mSettings.fnSuccess(oData, sResponse);
                        }
                    }.bind(this),
                    error: function(oError) {
                        if (mSettings.fnError) {
                            mSettings.fnError(oError);
                        }
                    }.bind(this)
                });
            },

            handleApiSuccess: function(oData, sResponse, oPendingChange) {
                $.sap.log.debug('replace_title: Saved PendingChange (' + oPendingChange.getType() + ' /' + oPendingChange.getEntity() + ')');
            },

            handleApiError: function(oError, oPendingChange) {
                $.sap.log.error('replace_title: Error while saving (/' + oPendingChange.getEntity() + '): ' + JSON.stringify(oError));
            }

        });

    return PendingChangeHelper;

});
