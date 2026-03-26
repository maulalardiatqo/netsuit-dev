/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/search', 'N/https', 'N/url', 'N/runtime', 'N/log'], 
function(currentRecord, search, https, url, runtime, log) {

    function pageInit(context) {}

    function getTarAmount(id) {
        let alocatAmount = 0;
        let idArray = [];

        if (id) {
            if (Array.isArray(id)) idArray = id;
            else if (typeof id === 'string') idArray = id.split(',');
            else idArray = [id];
        }

        if (idArray.length === 0) return 0;

        const tarSearch = search.create({
            type: "customrecord_tar",
            filters: [["internalid", "anyof", idArray]],
            columns: [
                search.createColumn({
                    name: "custrecord_tare_amount",
                    join: "CUSTRECORD_TAR_E_ID"
                })
            ]
        });

        tarSearch.run().each(function(result) {
            let amt = result.getValue({
                name: "custrecord_tare_amount",
                join: "CUSTRECORD_TAR_E_ID"
            }) || 0;
            alocatAmount += Number(amt);
            return true;
        });
        log.debug('alocatAmount', alocatAmount)
        return alocatAmount;
    }

    function saveRecord(context) {
        // logic pindah ke abj_cs_new_approval_tr.js

        return true;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});