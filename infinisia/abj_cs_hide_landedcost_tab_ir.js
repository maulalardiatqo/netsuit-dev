/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    console.log('tes')
    var landedCostTab = document.getElementById("landedcosttxt");
    console.log('landedCostTab', landedCostTab)
    if(landedCostTab){
        landedCostTab.style.display = "none";
    }
    var landedCostPane = document.getElementById("landedcost_pane");
    console.log('landedCostPane', landedCostPane)
    if(landedCostPane){
        landedCostPane.style.display = "none";
    }
    function pageInit(context) {
        console.log('pageInit')
        
    }
    function fieldChanged(context){

    }

    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged
    };
});