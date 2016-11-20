sap.ui.define([
  'jquery.sap.global'
], function($) {
  "use strict";

  /**
   * Constructor for StringUtils.
   * @constructor
   *
   * @class
   * Contains helper methods to manipulate Strings in JavaScript.
   *
   * @public
   * @extends sap.ui.base.Object
   * @alias replace.namespace.util.StringUtils
   */
  var StringUtils =
    /** @lends replace.namespace.util.StringUtils.prototype */
    {

      /**
       * Pad a string with a character (typically used with '0').
       *
       * http://stackoverflow.com/a/2998822/569531
       *
       * @function
       * @param {int} iNum - number to pad
       * @param {int} iSize - length of padded string
       * @param {string} [sChar='0'] - character to pad with
       * @returns {string} sPaddedResponse - result of pad
       */
      pad: function(iNum, iSize, sChar) {
        sChar = typeof sChar !== 'undefined' ? sChar : '0';
        var sPaddedResponse = iNum + "";
        while (sPaddedResponse.length < iSize) {
          sPaddedResponse = sChar + sPaddedResponse;
        }
        return sPaddedResponse;
      }

    };

  return StringUtils;

});
