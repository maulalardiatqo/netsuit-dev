/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try {
                var rec = context.newRecord;
    
                var recordLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var customForm = recordLoad.getValue("customform");
                if (customForm == 138) {
                    var employee_id = rec.getValue('employee') || null;
                    log.debug('employee_id', employee_id);
    
                    var is_saleprep = false;
                    var salesRepId 
                    if (employee_id == null) {
                        var user_id = runtime.getCurrentUser().id || null;
                        log.debug('user_id', user_id);
                        var fieldLookUp = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: user_id,
                            columns: ['issalesrep']
                        });
                        log.debug('fieldLookUp', fieldLookUp);
                        is_saleprep = fieldLookUp.issalesrep;
                        if(is_saleprep == true){
                            salesRepId = user_id
                        }
                    } else {
                        var fieldLookUp = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: employee_id,
                            columns: ['issalesrep']
                        });
                        log.debug('fieldLookUp', fieldLookUp);
                        is_saleprep = fieldLookUp.issalesrep;
                        if(is_saleprep == true){
                            salesRepId = employee_id
                        }
                    }
                    log.debug('is_saleprep', is_saleprep)
                    if(is_saleprep == true){
                        log.debug('masuk true')
                        var countLine = recordLoad.getLineCount({
                            sublistId : "item"
                        });
                        log.debug('countLine', countLine)
                        if(countLine > 0){
                            for(var i = 0; i < countLine; i++){
                                log.debug('i', i);
                                log.debug('salesRepId', salesRepId)
                                recordLoad.selectLine({
                                    sublistId : "item",
                                    line : i
                                })
                                recordLoad.setCurrentSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'custcol_abj_sales_rep_line',
                                    line : i,
                                    value : salesRepId
                                });
                                
                                recordLoad.commitLine("item")
                            }
                            var saveRec = recordLoad.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true,
                            });
                            log.debug('saveRec', saveRec)
                        }
                    }
                    
                }
            }catch(e){
                log.debug('error', e)
            }
        }
        
    }
    return {
        afterSubmit: afterSubmit,
      };
    });
    