/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/file', 'N/format'],
  function(search, record, email, runtime, file, format) {
    
    function execute(scriptContext) {
        try {
            var customerpaymentSearchObj = search.create({
                type: "customerpayment",
                filters:
                [
                    ["type","anyof","CustPymt"], 
                    "AND", 
                    ["createdby","anyof","200281","216887","216888","200818"], 
                    "AND", 
                    ["mainline","is","F"], 
                    "AND", 
                    ["formulanumeric: {amount}+{paidamount}","notequalto","0"],
                    "AND",
                    ["internalid","is","6740758"]
                ],
                columns:
                [
                    search.createColumn({
                        name: "trandate",
                        sort: search.Sort.ASC,
                        label: "Date"
                    }),
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({
                        name: "tranid",
                        sort: search.Sort.ASC,
                        label: "Document Number"
                    }),
                    search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                    search.createColumn({name: "entity", label: "Name"}),
                    search.createColumn({name: "account", label: "Account"}),
                    search.createColumn({name: "statusref", label: "Status"}),
                    search.createColumn({name: "memo", label: "Memo"}),
                    search.createColumn({name: "currency", label: "Currency"}),
                    search.createColumn({name: "amount", label: "Amount"}),
                    search.createColumn({name: "paidamount", label: "Paid Amount"}),
                    search.createColumn({name: "paidtransaction", label: "Paid Transaction"}),
                    search.createColumn({
                        name: "formulacurrency",
                        formula: "{amount}+{paidamount}",
                        label: "Formula (Currency)"
                    })
                ]
            });
            var searchResultCount = customerpaymentSearchObj.runPaged().count;
            log.debug("customerpaymentSearchObj result count",searchResultCount);
            customerpaymentSearchObj.run().each(function(result){
                var idPy = result.getValue({
                    name : 'internalid'
                });
                var idInv = result.getValue({
                    name : 'paidtransaction'
                });
                log.debug('idInv', idInv)
                if(idPy){
                    recPy = record.load({
                        type : 'customerpayment',
                        id : idPy,
                        isDynamic : false,
                    });
                    var unapplied = recPy.getValue('unapplied');
                    log.debug('unapplied', unapplied)
                    var findApply = recPy.findSublistLineWithValue({
                        sublistId : 'apply',
                        fieldId : 'internalid',
                        value : idInv
                    })
                    log.debug('findApply', findApply)
                    var amountPy = recPy.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'amount',
                        line: findApply
                    });
                    log.debug('amountPy', amountPy);
                    var amountCredit = 0
                    var countCredit = recPy.getLineCount({
                        sublistId : 'credit'
                    });
                    if(countCredit > 0){
                        for(var i = 0; i < countCredit; i++){
                            var amountC = recPy.getSublistValue({
                                sublistId : 'credit',
                                fieldId : 'amount',
                                line : i
                            })
                            amountCredit = amountC
                        }
                    }

                    var newAmount = Number(unapplied) + Number(amountPy) + Number(amountCredit);
                    log.debug('newAmount', newAmount);
                    recPy.setValue({
                        fieldId : 'payment',
                        value : newAmount,
                        ignoreFieldChange: true
                    });
                    var savePy = recPy.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('savePy', savePy)
                }
                return true;
            });
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        execute: execute
    };
});