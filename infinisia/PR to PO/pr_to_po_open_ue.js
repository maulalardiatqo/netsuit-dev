/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {
  
  function beforeLoad(context) {
    function remove_duplicates_in_list(arr) {
      var uniques = [];
      var itemsFound = {};
      for (var i = 0, l = arr.length; i < l; i++) {
        var stringified = JSON.stringify(arr[i]);
        if (itemsFound[stringified]) {
          continue;
        }
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
      }
      return uniques;
    }
    try {
      if (context.type == context.UserEventType.CREATE) {
        var poData = context.newRecord;
        var PO_lines = []
        var vendorID, currencySet;
        if (context.request) {
          if (context.request.parameters) {
            vendorID = context.request.parameters.vendorID;
            currencySet = context.request.parameters.currencySet;
            var POlinesStr = context.request.parameters.PO_lines;
            log.debug('POlinesStr', POlinesStr)
            var allIdSummary
            if(POlinesStr){
              try{
                allIdSummary = JSON.parse(POlinesStr); 
                log.debug('allIdSymmary', allIdSummary)
              }catch(e){
                log.debug('error', e)
              }
            }else {
                log.debug('Info', 'Parameter PO_lines tidak ditemukan di URL');
            }
            
            var itemIds = [];
            var unitNames = [];
            log.debug('allIdSummary', allIdSummary);
            poData.setValue({
              fieldId: 'custbody_all_id_summary',
              value: allIdSummary, 
              ignoreFieldChange: true 
          });
              var prToPO = search.load({
                  id: "customsearch1094",
              });
          
              prToPO.filters.push(
                  search.createFilter({
                      name: "internalid",
                      join: "custrecord_iss_pr_parent", 
                      operator: search.Operator.ANYOF, 
                      values: allIdSummary, 
                  })
              );
              
              var prToPOSet = prToPO.run();
              var prToPO = prToPOSet.getRange(0, 300);
              log.debug('prToPO.length', prToPO.length); 
              if(prToPO.length > 0) {
                for (let i = 0; i < prToPO.length; i++) {

                  let internalIDPR = prToPO[i].getValue({
                    name: prToPOSet.columns[10],
                  });
                 
                  PO_lines.push({
                    internalIDPR : internalIDPR,
                  })
                }
              }
            
          }
        }
        if (vendorID) {
          poData.setValue({
            fieldId: "customform",
            value: 104,
          });
          var exchangerate = 0
          if(currencySet){
            var currencySearchObj = search.create({
              type: "currency",
              filters:
              [
                  ["internalid","anyof",currencySet]
              ],
              columns:
              [
                  search.createColumn({name: "name", label: "Name"}),
                  search.createColumn({name: "exchangerate", label: "Exchange Rate"})
              ]
            });
            var searchResultCurr = currencySearchObj.run().getRange({start: 0, end: 1});
            if (searchResultCurr.length > 0) {
              var exc = searchResultCurr[0].getValue({name: "exchangerate"});
              if(exc){
                exchangerate = exc
              }
            } 
            poData.setValue({
              fieldId: "currency",
              value: currencySet,
            });
          }
          var currentEmployee = runtime.getCurrentUser();
          poData.setValue({
            fieldId: "employee",
            value: currentEmployee.id,
          });
          poData.setValue({
            fieldId: "custbody_convert_from_pr",
            value: true,
          });

          var today = new Date();
          poData.setValue({
            fieldId: "trandate",
            value: today,
          });
          poData.setValue({
            fieldId: "entity",
            value: vendorID,
            ignoreFieldChange: true
          });
          poData.setValue({
            fieldId: "customform",
            value: 104,
          });
          var line_idx = 0;
          var arrayPR = [];
          log.debug('PO_lines', PO_lines)
          for (var i in PO_lines) {
             var POLine = PO_lines[i];
            var internalIDPR = POLine.internalIDPR;
            arrayPR.push(internalIDPR);
          }

          arrayPR = remove_duplicates_in_list(arrayPR);
          poData.setValue({
            fieldId: "custbody_convert_from_prid",
            value: arrayPR,
          });
          var dataTerakhir = arrayPR[arrayPR.length - 1];
            poData.setValue({
              fieldId: "custbody_abj_pr_number",
              value: dataTerakhir,
          });
       
          
        }
      }
    } catch (e) {
      log.debug("Error in before load", e.name + " : " + e.message);
    }
  }
  return {
    beforeLoad: beforeLoad
  };
});
