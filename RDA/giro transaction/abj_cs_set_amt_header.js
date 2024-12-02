/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var currentRecordObj = currentRecord.get();
    var flag = false

    function pageInit(context) {
        console.log('test')
    }

    function validateLine(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'recmachcustrecord_rda_giro_id') {
            var currentRecordObj = context.currentRecord;
            
            

            var amtHeader = currentRecordObj.getValue('custbody_rda_giro_amount') || 0;

            var amtLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "recmachcustrecord_rda_giro_id",
                fieldId: "custrecord_rda_giro_amountinvoice",
            }));
            log.debug('amtLine', amtLine)
            var total = Number(amtHeader) + Number(amtLine);
            log.debug('total after add line', total);

            currentRecordObj.setValue({
                fieldId: 'custbody_rda_giro_amount',
                value: total,
            });
        }
        return true; 
    }
    function lineInit(context) {

        if (context.sublistId === 'recmachcustrecord_rda_giro_id') {
            var headerCustomer = currentRecordObj.getValue('custbody_rda_giro_customer')
            log.debug('headerCustomer', headerCustomer)
            currentRecordObj.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rda_giro_id',
                fieldId: 'custrecord_rda_girodetail_customer',
                value: headerCustomer
            });

            log.debug('Line Initialized', 'Set custrecord_rda_girodetail_customer to 24');
        }

        return true;
    }
    function validateDelete(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'recmachcustrecord_rda_giro_id') {
            var currentRecordObj = context.currentRecord;

           
            var amtHeader = currentRecordObj.getValue('custbody_rda_giro_amount') || 0;

            var amtLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "recmachcustrecord_rda_giro_id",
                fieldId: "custrecord_rda_giro_amountinvoice",
            }));
            log.debug('amtLine', amtLine)
            var total = Number(amtHeader) - Number(amtLine);
            log.debug('total after delete', total);

            currentRecordObj.setValue({
                fieldId: 'custbody_rda_giro_amount',
                value: total,
            });
        }
        return true;
    }
    
    function fieldChanged(context){
        var rec = currentRecord.get();
        var vrecord = context.currentRecord;
        var fieldNam = context.fieldId;
        var sublistName = context.sublistId;
        if (fieldNam == 'custbody_rda_giro_customer') {
            console.log('trigerred')
            

            var custId = rec.getValue('custbody_rda_giro_customer');
            console.log('custId', custId)
            var allInv = []
            if(custId){
                setSublist(custId);

                var invoiceSearchObj = search.create({
                    type: "invoice",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                    filters:
                    [
                        ["type","anyof","CustInvc"], 
                        "AND", 
                        ["status","anyof","CustInvc:A"], 
                        "AND", 
                        ["customer.internalid","anyof",custId], 
                        "AND", 
                        ["mainline","is","T"]
                    ],
                    columns:
                    [
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug("invoiceSearchObj result count",searchResultCount);
                invoiceSearchObj.run().each(function(result){
                    var idInv = result.getValue({
                        name: "internalid"
                    });
                    var docNumb = result.getValue({
                        name: "tranid"
                    })
                    if(idInv){
                        allInv.push({
                            idInv : idInv,
                            docNumb : docNumb
                        })
                    }
                    return true;
                });
            }
            if(allInv.length > 0){
                console.log('ada inv')
                var invField = vrecord.getCurrentSublistField({
                    sublistId: 'recmachcustrecord_rda_giro_id',
                    fieldId: 'custpage_sublist_list_field',
               });
                console.log('invField', invField)
                allInv.forEach(function(inv) {
                    var idInv = inv.idInv;
                    console.log('idInv', idInv)
                    var docNumb = inv.docNumb;
                    invField.insertSelectOption({
                        value: idInv,
                        text: docNumb
                    });
                })
                

            }
        }
        if(sublistName == 'recmachcustrecord_rda_giro_id'){
            if(fieldNam == 'custpage_sublist_list_field'){
                var valInv = vrecord.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_rda_giro_id',
                    fieldId : 'custpage_sublist_list_field'
                });
                console.log('valInv',valInv)
                if(valInv){
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rda_giro_id',
                        fieldId: 'custrecord_rda_giro_invoicenum',
                        value: valInv
                    });
                }
               
            }   
        }
        if(sublistName == 'recmachcustrecord_rda_giro_id'){
            if(fieldNam == 'custrecord_rda_giro_amountinvoice'){
                if(flag){
                    return false
                }
                var amtInv = vrecord.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_rda_giro_id',
                    fieldId : 'custrecord_rda_giro_amountinvoice'
                });
                console.log('amtInv',amtInv)
                
                if(amtInv){
                    flag = true
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rda_giro_id',
                        fieldId: 'custpage_sublist_amount',
                        value: amtInv
                    });
                    flag = false
                }
               
            }   
        }
        if(sublistName == 'recmachcustrecord_rda_giro_id'){
            if(fieldNam == 'custpage_sublist_amount'){
                if(flag){
                    return false
                }
                var amtCustom = vrecord.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_rda_giro_id',
                    fieldId : 'custpage_sublist_amount'
                });
                console.log('amtCustom',amtCustom)
                
                if(amtCustom){
                    flag = true
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rda_giro_id',
                        fieldId: 'custrecord_rda_giro_amountinvoice',
                        value: amtCustom
                    });
                    flag = false
                }
               
            }   
        }
        
    }
    function setSublist(custId){
        currentRecordObj.selectNewLine({ sublistId: 'recmachcustrecord_rda_giro_id' });
        currentRecordObj.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_rda_giro_id',
            fieldId: 'custrecord_rda_girodetail_customer',
            value: custId
        });
        // currentRecordObj.commitLine({ sublistId: 'recmachcustrecord_rda_giro_id' });
    }

    return {
        pageInit: pageInit,
        validateLine: validateLine,
        validateDelete: validateDelete,
        fieldChanged : fieldChanged,
        lineInit : lineInit
    };
});
