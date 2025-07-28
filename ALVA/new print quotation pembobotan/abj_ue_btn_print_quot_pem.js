/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/search"], (runtime, log, search) => {

  function isAlvaFamily(subId){
    try {
      if(subId == 46){ // jika ALVA MAKA MUNCUL
        return true;
      }
      let searchSub = search.create({
        type : 'subsidiary',
        filters : [
          ['parent', 'is', 46],
          'AND',
          ['internalid', 'is', subId]
        ],
        columns : [
          'internalid',
          'name',
          'parent'
        ]
      });
  
      let results = [];
      searchSub.run().each(sub=>{
        if(sub.getValue({ name : 'parent'}) == 46){
          results.push({
            internalId : sub.getValue({ name : 'internalid'}),
            parent : sub.getValue({ name : 'parent'}),
            name : sub.getValue({ name : 'name'}),
          });
        }
        return true;
      });
  
      if(results.length == 0){
        return false;
      }
  
      return true;
    } catch (error) {
      throw new Error("Err Search Sub", error);      
    }
  }

  function beforeLoad(context) {
    try {
      if (context.type === context.UserEventType.VIEW) {
        var form = context.form;
        var rec = context.newRecord;
  
        var subsidiaryTransactionId = rec.getValue('subsidiary');
  
        log.debug('SUB', subsidiaryTransactionId);
        
        var isAlvaFamilyCheck = isAlvaFamily(subsidiaryTransactionId);
        
        log.debug('isAlvaFamilyCheck', isAlvaFamilyCheck);
        // var checkSubsi = 
        form.addButton({
          id: "custpage_button_print_quote",
          label: "Print Quotation",
          functionName: "printPDF()",
        });
        if(isAlvaFamilyCheck){
        //   form.addButton({
        //     id: "custpage_button_print_quote",
        //     label: "Print Detail",
        //     functionName: "printPDFV2()",
        //   });
          form.addButton({
            id: "custpage_button_print_quote",
            label: "New Print Detail",
            functionName: "printPDFV2a()",
          });
        }
        var cekMail = rec.getValue('custbody_abj_email_recipients');
        log.debug('cekMail', cekMail);
        if(cekMail){
            form.addButton({
                id: 'custpage_button_print_so',
                label: "Send Email",
                functionName: "sendMail()"
            });
        }
  
        context.form.clientScriptModulePath = "SuiteScripts/quotation_rate_card_cs.js";
      }
    } catch (error) {
      log.error('ERR BEFORE LOAD', error)
    }
  }
  return {
    beforeLoad: beforeLoad,
  };
});
