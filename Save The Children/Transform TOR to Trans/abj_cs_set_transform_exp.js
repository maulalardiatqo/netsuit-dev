/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/format', 'N/log'], function(currentRecord, format, log) {

    function pageInit(scriptContext) {
        var rec = scriptContext.currentRecord;
        log.debug('trigerred')
    //    proses pindah ke abj_cs_tax_expese_report
    }

    function parseDateString(dateStr) {
        var parts = dateStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    return {
        pageInit: pageInit
    };
});