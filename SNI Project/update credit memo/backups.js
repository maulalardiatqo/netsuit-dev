/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/file', 'N/format'],
  function(search, record, email, runtime, file, format) {
    
    function execute(scriptContext) {
        try {
            var creditmemoSearchObj = search.create({
                type: "creditmemo",
                filters:
                [
                    ["mainline","is","T"], 
                    "AND", 
                    ["type","anyof","CustCred"], 
                    "AND", 
                    ["createdby","anyof","200281","216887","216888","200818"], 
                    "AND", 
                    ["status","anyof","CustCred:A"], 
                    "AND", 
                    ["appliedtolinktype","anyof","@NONE@"],
                    "AND",
                    ["internalid","is","6835040"]

                ],
                columns:
                [
                    search.createColumn({
                        name: "trandate",
                        sort: search.Sort.ASC,
                        label: "Date"
                    }),
                    search.createColumn({
                        name: "tranid",
                        sort: search.Sort.ASC,
                        label: "Document Number"
                    }),
                    search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                    search.createColumn({name: "entity", label: "Name"}),
                    search.createColumn({name: "account", label: "Account"}),
                    search.createColumn({name: "otherrefnum", label: "PO/Withdrawal Number"}),
                    search.createColumn({name: "statusref", label: "Status"}),
                    search.createColumn({name: "memo", label: "Memo"}),
                    search.createColumn({name: "currency", label: "Currency"}),
                    search.createColumn({name: "amount", label: "Amount"}),
                    search.createColumn({name: "appliedtotransaction", label: "Applied To Transaction"}),
                    search.createColumn({name: "applyingtransaction", label: "Applying Transaction"}),
                    search.createColumn({
                        name: "createdfrom",
                        join: "createdFrom",
                        label: "Invoice"
                    }),
                    search.createColumn({name: "amountremaining", label: "Amount Remaining"})
                ]
            });
            var searchResultCount = creditmemoSearchObj.runPaged().count;
            log.debug("creditmemoSearchObj result count",searchResultCount);
            creditmemoSearchObj.run().each(function(result){
                
                var amountCredit = result.getValue({
                    name: "amount"
                });
                var idCm = result.getValue({
                    name: "tranid"
                })
                var dateCm = result.getValue({
                    name: "trandate"
                })
                log.debug('dateCm', dateCm)
                
                var invoiceId = result.getValue({
                    name: "createdfrom",
                    join: "createdFrom",
                });
                log.debug('invoiceId', invoiceId)
                var recInv = record.load({
                    type: 'invoice',
                    id: invoiceId,
                    isDynamic: true
                });
                var customerId = recInv.getValue('entity');

                var amtInv = recInv.getValue('total');

                var createPy = record.create({
                    type: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });
                createPy.setValue({
                    fieldId: 'customer',
                    value: customerId
                });
                createPy.setValue({
                    fieldId: 'autoapply',
                    value: false
                });
                // createPy.setValue({
                //     fieldId: 'trandate',
                //     value: dateCm
                // });

                // setApply
                createPy.setValue({
                    fieldId: 'applylist',
                    value: [{
                        'internalid': invoiceId
                    }]
                });
                // createPy.setSublistValue({
                //     sublistId: 'apply',
                //     fieldId: 'apply',
                //     value: true,
                //     line:1
                // });

                // setCredit
                
                // createPy.setSublistValue({
                //     sublistId: 'credit',
                //     fieldId: 'apply',
                //     value: true,
                //     line:1
                // });

                var pyId = createPy.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('pyId', pyId);
                
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