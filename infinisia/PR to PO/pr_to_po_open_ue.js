/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {
  
  function beforeLoad(context) {
    
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
            var allIdSummary = JSON.parse(POlinesStr); 
            const arrayString = allIdSummary.join(',');
            poData.setValue({
              fieldId : 'custbody_abj_all_id_pr_sum',
              value : arrayString
            })
            log.debug('allIdSummary', allIdSummary);
            
          }
        }
        if (vendorID) {
          poData.setValue({
            fieldId: "customform",
            value: 104,
          });
          poData.setValue({
            fieldId: "custbody_abj_trigger_client",
            value : true
          })
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
          // log.debug('exchangerate', exchangerate)
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
          });
          poData.setValue({
            fieldId: "customform",
            value: 104,
          });
       
          
        }
      }
    } catch (e) {
      log.debug("Error in before load", e.name + " : " + e.message);
    }
  }

  function beforeSubmit(context) {
    if (context.type == context.UserEventType.CREATE) {
      var dataRec = context.newRecord;
      var isConvertPR = dataRec.getValue("custbody_convert_from_pr");
      if (isConvertPR) {
        dataRec.setValue({
          fieldId: "customform",
          value: 104,
          ignoreFieldChange: true,
        });
      }
    }
   
  }


  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
  };
});
