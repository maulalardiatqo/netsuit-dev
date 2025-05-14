/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/search', 'N/runtime'], (log, record, search, runtime) => {
    const execute = (context) => {
        try {
            let scriptObj = runtime.getCurrentScript();
            let recordId = scriptObj.getParameter({ name: 'custscript_id_item_fulfill' });
            let eventTrigger  = scriptObj.getParameter({ name: 'custscript_even_trigger' });
            let allIdFulFill = scriptObj.getParameter({ name: 'custscript_all_id_fulfill' });
            log.debug('recordId', recordId)
            log.debug('allIdFulFill', allIdFulFill)
            log.debug('eventTrigger', eventTrigger)
            if(recordId){
                var nopol = ''
                var isCentang = false
                if(eventTrigger == 'create'){
                    var dataRec = record.load({
                        type : 'customtransaction_rda_packing_list',
                        id : recordId
                    });
                    nopol = dataRec.getValue('custbody_rda_packlist_nopol');
                    isCentang = true;
                    var totalData = 0
                    var allIdFul = dataRec.getValue('custbody_rda_packlist_do_number');
                    allIdFul.forEach(function(id) {
                        totalData = totalData+1
                        if(id){
                            record.submitFields({
                                type: "itemfulfillment",
                                id: id,
                                values: {
                                    custbody_rda_flag_centangpackinglist: isCentang,
                                    custbody_rda_nopol: nopol,
                                    custbody_rda_packing_list_number : recordId
                                }
                            });
                        }
                    });
                    log.debug('totalData', totalData)
                }else{
                    allIdFulFill = JSON.parse(allIdFulFill);
                    if(allIdFulFill.length > 0){
                       log.debug('length lebih dari 0') 
                    }
                    var totalData = 0
                    allIdFulFill.forEach(function(id) {
                        totalData = totalData+1
                        if(id){
                            record.submitFields({
                                type: "itemfulfillment",
                                id: id,
                                values: {
                                    custbody_rda_flag_centangpackinglist: isCentang,
                                    custbody_rda_nopol: nopol,
                                    custbody_rda_packing_list_number : ""
                                }
                            });
                        }
                    });
                    log.debug('totalData', totalData)
                }
                
                
            }
            
        }catch(e){
            log.debug('error', e)
        }
    };

    return { execute };
});