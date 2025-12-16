/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/error"], function(
    record,
    search,
    serverWidget,
    runtime,
    error
    ) {
  function beforeLoad(context) {
        if(context.type == context.UserEventType.VIEW || context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY){
            try {
                var rec = context.newRecord;
                var form = context.form;
                var cekApprovalLevel = rec.getValue('custrecord_approval_level');
                log.debug('cekApprovalLevel', cekApprovalLevel)
                if(cekApprovalLevel && cekApprovalLevel.includes('Pending Setup COA')){
                    log.debug('masuk kondisi panggil client')
                    
                }else{
                    context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_pengajuan_dana.js';
                }
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Print Pengajuan Dana",
                    functionName: "printPengajuan()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_validate_pengajuandana.js"
                
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    function createJe(idFund){
        var idJe = ''
        if(idFund){
            var recFund = record.load({
                type : 'customrecord_request_for_fund',
                id : idFund
            });
            
            var cekLine = recFund.getLineCount({
                sublistId : 'recmachcustrecord_fund_journal'
            });
            if(cekLine > 0){
                var dateFund = recFund.getValue('custrecord_fund_date');
                var memoFund = recFund.getValue('custrecord_fund_memo');
                var paymentType = recFund.getValue('custrecord_fund_payment_type');
                log.debug('paymentType', paymentType)
                var allDataLine = []
                for(var i =0; i < cekLine; i++){
                    var acc = recFund.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_j_account',
                        line : i
                    })
                    var debit = recFund.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_j_debit',
                        line : i
                    }) || 0
                    var credit = recFund.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_credit',
                        line : i
                    }) || 0
                    var department = recFund.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_je_department',
                        line : i
                    })
                    var purpose
                    var ptext = recFund.getSublistText({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_j_purpouse',
                        line : i
                    })
                    var remarks = recFund.getSublistText({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_j_f_remarks',
                        line : i
                    })
                    if(remarks){
                        purpose = remarks
                    }else{
                        purpose = ptext
                    }
                    allDataLine.push({
                        acc : acc,
                        debit : debit,
                        credit : credit,
                        department : department,
                        purpose : purpose
                    })
                }
                if(allDataLine.length > 0){
                    var recCreateJE = record.create({
                        type : 'journalentry',
                        isDynamic: true
                    });
                    
                    if(paymentType == '1'){
                        // transfer
                        // jika transfer atau satu maka jenis transaksi bank keluar
                        // customform
                        recCreateJE.setValue({  
                            fieldId : 'customform',
                            value : '158'
                        })
                        recCreateJE.setValue({  
                            fieldId : 'custbody13',
                            value : '1'
                        })
                        recCreateJE.setValue({  
                            fieldId : 'custbody_custom_transaksi_list_bank',
                            value : '2'
                        })
                    }else{
                        // jenis transaksi cash out
                        recCreateJE.setValue({  
                            fieldId : 'customform',
                            value : '159'
                        })
                        recCreateJE.setValue({  
                            fieldId : 'custbody13',
                            value : '2'
                        })
                        recCreateJE.setValue({  
                            fieldId : 'custbody_custom_transksi_list_cash',
                            value : '2'
                        })
                    }
                    recCreateJE.setValue({  
                        fieldId : 'trandate',
                        value : dateFund
                    })
                    recCreateJE.setValue({
                        fieldId : 'memo',
                        value : memoFund
                    })
                    allDataLine.forEach((data)=>{
                        var acc = data.acc
                        var debit = data.debit
                        var credit = data.credit
                        var department = data.department
                        var purpose = data.purpose
                        recCreateJE.selectNewLine({
                            sublistId: "line",
                        })
                        recCreateJE.setCurrentSublistValue({
                            sublistId: "line",
                            fieldId: "account",
                            value: acc,
                            ignoreFieldChange: true,
                        });
                        recCreateJE.setCurrentSublistValue({
                            sublistId: "line",
                            fieldId: "debit",
                            value: debit,
                            ignoreFieldChange: true,
                        });
                        recCreateJE.setCurrentSublistValue({
                            sublistId: "line",
                            fieldId: "credit",
                            value: credit,
                            ignoreFieldChange: true,
                        });
                        recCreateJE.setCurrentSublistValue({
                            sublistId: "line",
                            fieldId: "department",
                            value: department,
                            ignoreFieldChange: true,
                        });
                        recCreateJE.setCurrentSublistValue({
                            sublistId: "line",
                            fieldId: "memo",
                            value: purpose,
                            ignoreFieldChange: true,
                        });
                        recCreateJE.commitLine({ sublistId: 'line' });
                    })
                    idJe = recCreateJE.save()
                }
            }
        }
        return idJe
    }
    function afterSubmit(context){
        var rec = context.newRecord;
        var recOld = context.oldRecord
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY){
            var recordCust = record.load({
                type : 'customrecord_request_for_fund',
                id : rec.id
            })
            var totalAMount = 0;
            var cekLine = recordCust.getLineCount({
                sublistId : 'recmachcustrecord_fund_head'
            })
            // approval
            if(context.type == context.UserEventType.EDIT){
                var oldRec = context.oldRecord;
                var cekStatusOld = oldRec.getValue('custrecord_fund_approval');
                log.debug('cekStatusOld', cekStatusOld);
                var cekStatusNew = recordCust.getValue('custrecord_fund_approval');
                if(cekStatusOld == '1' && cekStatusNew == '2'){
                    log.debug('approved');
                    var idJe = createJe(rec.id);
                    log.debug('idJe', idJe)
                    if(idJe){
                        recordCust.setValue({
                            fieldId : 'custrecord_link_journal_entry',
                            value : idJe
                        })
                    }
                }
                var cekAppLev = recOld.getValue('custrecord_approval_level')
                log.debug('cekAppLev', cekAppLev)
                if (cekAppLev && cekAppLev.includes('Pending Setup COA')) {
                    var cekLineJournal = recordCust.getLineCount({
                        sublistId: 'recmachcustrecord_fund_journal'
                    });

                    if (cekLineJournal < 1) {
                        var message = 'Please fill the journal';
                        throw message;
                        
                    }else{
                        var totalDebit = 0;
                        var totalCredit = 0
                        for(var j = 0; j < cekLineJournal; j++){
                            var debit = recordCust.getSublistValue({
                                sublistId : 'recmachcustrecord_fund_journal',
                                fieldId : 'custrecord_fund_j_debit',
                                line : j
                            }) || 0
                            var credit = recordCust.getSublistValue({
                                sublistId : 'recmachcustrecord_fund_journal',
                                fieldId : 'custrecord_fund_credit',
                                line : j
                            }) || 0
                            totalDebit = Number(totalDebit) + Number(debit)
                            totalCredit = Number(totalCredit) + Number(credit)
                        }
                        log.debug('total', {
                            totalDebit : totalDebit,
                            totalCredit : totalCredit
                        })
                        recordCust.setValue({
                            fieldId : 'custrecord_fund_total_debit',
                            value : totalDebit
                        })
                        recordCust.setValue({
                            fieldId : 'custrecord_fund_total_credit',
                            value : totalCredit
                        })
                    }
                }
                
            }
            log.debug('cekLine', cekLine)
            if(cekLine > 0){
                for(var i = 0; i < cekLine; i++){
                    var amt = recordCust.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_head',
                        fieldId : 'custrecord_fund_amount',
                        line : i
                    })
                    if(amt){
                        totalAMount = Number(totalAMount) + Number(amt)
                    }
                }
            }
            log.debug('totalAMount', totalAMount);
            if(totalAMount){
                recordCust.setValue({
                    fieldId : 'custrecord_total_pengajuan_dana',
                    value : totalAMount
                })
            }
            recordCust.save()
        }
        
    }
    return{
        beforeLoad : beforeLoad,
        afterSubmit : afterSubmit
    }
});