/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var currentRecordObj = currentRecord.get();
    var flag = false
    function setInv(custId){
        var allInv = []
        if(custId){
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
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "amountremaining", label: "Amount Remaining"})
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
        console.log('allInv', allInv)
        if(allInv.length > 0){
            console.log('ada inv')
            var invField = currentRecordObj.getCurrentSublistField({
                sublistId: 'recmachcustrecord_rda_giro_id',
                fieldId: 'custpage_rda_invoice_number',
            });
            // console.log('invField', invField)
            // if (invField && invField.removeSelectOption) {
            //     console.log('delete select option')
            //     invField.removeSelectOption({
            //         value: null
            //     });
                
            // }
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
    function pageInit(context) {
        console.log('test');
        
        var mode = context.mode;
        console.log('mode', mode);

    }

    function validateLine(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'recmachcustrecord_rda_giro_id') {
            console.log('masuk validateLine')
            var currentRecordObj = context.currentRecord;
            var currentLineIndex = context.line;
            var cekLine = currentRecordObj.getLineCount({
                sublistId: 'recmachcustrecord_rda_giro_id'
            });

            if (cekLine > 0) {
                var currentInvoiceNumber = currentRecordObj.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rda_giro_id',
                    fieldId: 'custpage_rda_invoice_number'
                });

                for (var i = 0; i < cekLine; i++) {
                    if (i === currentLineIndex) continue; // Skip the current line being validated

                    var existingInvoiceNumber = currentRecordObj.getSublistValue({
                        sublistId: 'recmachcustrecord_rda_giro_id',
                        fieldId: 'custpage_rda_invoice_number',
                        line: i
                    });

                    if (currentInvoiceNumber === existingInvoiceNumber) {
                        alert('Invoice Number must be unique within this transaction.');
                        return false; // Stop the user from saving this line
                    }
                }
            }
            var amtHeader = currentRecordObj.getValue('custbody_rda_giro_amount') || 0;

            var amtLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "recmachcustrecord_rda_giro_id",
                fieldId: "custrecord_rda_giro_amountinvoice",
            }));
            log.debug('amtLine', amtLine)
            var total = Number(amtHeader) + Number(amtLine);
            log.debug('total after add line', total);

            // currentRecordObj.setValue({
            //     fieldId: 'custbody_rda_giro_amount',
            //     value: total,
            // });
            
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

            log.debug('Line Initialized', 'Set custrecord_rda_girodetail_customer');
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

            // currentRecordObj.setValue({
            //     fieldId: 'custbody_rda_giro_amount',
            //     value: total,
            // });
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
            if(custId){
                setSublist(custId);
                setInv(custId)
                
            }
            
        }
        if(sublistName == 'recmachcustrecord_rda_giro_id'){
            if(fieldNam == 'custpage_rda_invoice_number'){
                    var valInv = vrecord.getCurrentSublistValue({
                        sublistId : 'recmachcustrecord_rda_giro_id',
                        fieldId : 'custpage_rda_invoice_number'
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
            if(fieldNam == 'custrecord_rda_giro_invoicenum'){
                var invId = vrecord.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_rda_giro_id',
                    fieldId : 'custrecord_rda_giro_invoicenum'
                })
                console.log('invId', invId)
                if(invId){
                    var invoiceSearchObj = search.create({
                        type: "invoice",
                        settings: [
                            {"name": "consolidationtype", "value": "ACCTTYPE"},
                            {"name": "includeperiodendtransactions", "value": "F"}
                        ],
                        filters: [
                            ["type", "anyof", "CustInvc"], 
                            "AND", 
                            ["status", "anyof", "CustInvc:A"], 
                            "AND", 
                            ["internalid", "anyof", invId], 
                            "AND", 
                            ["mainline", "is", "T"]
                        ],
                        columns: [
                            search.createColumn({name: "amountremaining", label: "Amount Remaining"})
                        ]
                    });
            
                    var result = invoiceSearchObj.run().getRange({start: 0, end: 1});
                    if(result.length > 0){
                        var amountRemaining = result[0].getValue({name: "amountremaining"}) || 0;
                        console.log('amountRemaining', amountRemaining)
                        rec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_rda_giro_id',
                            fieldId: 'custrecord_rda_giro_amountinvoice',
                            value: amountRemaining
                        });
                    }
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
                            fieldId: 'custpage_rda_amount',
                            value: amtInv
                        });
                        flag = false
                    }
                   
              
            }   
        }
        if(sublistName == 'recmachcustrecord_rda_giro_id'){
            if(fieldNam == 'custpage_rda_amount'){
                    if(flag){
                        return false
                    }
                    var amtCustom = vrecord.getCurrentSublistValue({
                        sublistId : 'recmachcustrecord_rda_giro_id',
                        fieldId : 'custpage_rda_amount'
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
