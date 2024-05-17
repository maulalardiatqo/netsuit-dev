/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        console.log('init masuk')
    }
    function validasiLine(context) {
        var rec = context.currentRecord;
        var currentId = rec.getValue('id');
        var currPosition = rec.getValue('custrecord_abj_manhour_position');
        var currRate = rec.getValue('custrecord_abj_manhour_rate');
        var currTier = rec.getValue('custrecord__abj_manhour_tier');
        var dataCek = currentId + '-' + currPosition + '-' + currRate + '-' + currTier 
    }
    function saveRecord(context) {
        console.log('masuk function save');
        if (validasiLine(context)) {
            return true;
        } else {
            return false;
        }
    }
    return {
        pageInit: pageInit,
        saveRecord : saveRecord
    };
});