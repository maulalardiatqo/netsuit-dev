/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
    "N/runtime", 
    "N/log", 
    "N/url", 
    "N/currentRecord", 
    "N/currency", 
    "N/record", 
    "N/search", 
    "N/ui/message"
], function(runtime, log, url, currentRecord, currency, record, search, message) {
    
    function pageInit(context) {
        try {
            const currentRecord = context.currentRecord;
            
            log.debug("Page Init Trigger Check", cekTrigger);
            const cekTrigger = currentRecord.getValue("custbody_abj_trigger_client");
            if (cekTrigger) {
               
                log.debug("Currency ID", currencyId);
                var cekCustomForm = currentRecord.getValue("customform");
                if(cekCustomForm != 104){
                    currentRecord.setValue({
                        fieldId: "customform",
                        value: 104,
                    });
                }
                
                
            }
        } catch (error) {
            log.error("Error in pageInit", error);
        }
    }
    function fieldChange(context){
        var records = context.currentRecord;
        var fieldName = context.fieldId;
        if(fieldName == 'customform'){
            log.debug('changeForm');
            var getForm = records.getValue('customform');
            log.debug('getForm',getForm)
            if(getForm == 104){
                log.debug('PO')
                const cekTrigger = currentRecord.getValue("custbody_abj_trigger_client");
                if(cekTrigger == true){
                    const allId = currentRecord.getValue("custbody_abj_all_id_pr_sum");
                    const currencyId = currentRecord.getValue("currency");
                    if (allId) {
                        setSublist(records, allId, currencyId);
                        
                    }
                }
                
            }
        }
    }
    function setSublist(currentRecord, allId, currencyId) {
        try {
            const allIdSummary = allId.split(",").map(item => item.trim());
            log.debug("All ID Summary", allIdSummary);

            const prToPO = search.load({ id: "customsearch1021" });
            prToPO.filters.push(
                search.createFilter({
                    name: "internalid",
                    join: "custrecord_iss_pr_parent",
                    operator: search.Operator.ANYOF,
                    values: allIdSummary,
                })
            );

            const searchResults = prToPO.run().getRange({ start: 0, end: 300 });
            log.debug("Search Results Count", searchResults.length);

            if (searchResults.length > 0) {
                const PO_lines = searchResults.map(result => ({
                    itemID: result.getValue({ name: prToPO.columns[0] }),
                    incomingStock: result.getValue({ name: prToPO.columns[3] }),
                    currentStock: result.getValue({ name: prToPO.columns[2] }),
                    salesRepID: result.getValue({ name: prToPO.columns[4] }),
                    customerID: result.getValue({ name: prToPO.columns[26] }),
                    internalIDPR: result.getValue({ name: prToPO.columns[11] }),
                    totalPackaging: parseFloat(result.getValue({ name: prToPO.columns[35] }) || 0),
                    qtyPO: parseFloat(result.getValue({ name: prToPO.columns[27] }) || 0),
                    ratePackSize: parseFloat(result.getValue({ name: prToPO.columns[37] }) || 0),
                }));

                processPOLines(currentRecord, PO_lines, currencyId);
            }
        } catch (error) {
            log.error("Error in setSublist", error);
        }
    }

    function processPOLines(currentRecord, PO_lines, currencyId) {
        try {
            let exchangerate = getExchangeRate(currencyId);

            PO_lines.forEach(line => {
                const totalOrder = Math.abs(line.totalPackaging - line.qtyPO) * line.ratePackSize;

                currentRecord.selectNewLine({ sublistId: "item" });
                currentRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "item", value: line.itemID });
                currentRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_pr_number", value: line.internalIDPR });
                currentRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_abj_onhand", value: line.currentStock });
                currentRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol5", value: line.incomingStock });
                currentRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol9", value: totalOrder });
                currentRecord.commitLine({ sublistId: "item" });
            });
        } catch (error) {
            log.error("Error in processPOLines", error);
        }
    }

    function getExchangeRate(currencyId) {
        try {
            if (!currencyId) return 0;

            const currencySearch = search.create({
                type: "currency",
                filters: [["internalid", "anyof", currencyId]],
                columns: [search.createColumn({ name: "exchangerate" })],
            });

            const results = currencySearch.run().getRange({ start: 0, end: 1 });
            return results.length > 0 ? parseFloat(results[0].getValue("exchangerate")) : 0;
        } catch (error) {
            log.error("Error in getExchangeRate", error);
            return 0;
        }
    }

    return {
        pageInit : pageInit,
        fieldChange : fieldChange
    };
});
