/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/email"], function(
    record,
    search,
    serverWidget,
    runtime,
    email
    ) {
    function afterSubmit(context) {
            try{
                function buildEmailBody(data) {
                    return ''
                        + '<p>Dear Mr/Mrs,</p>'
                        + '<p>'
                        + 'A new '+data.transName+' with ID <b>' + data.tranid + '</b> been submitted by '
                        + '<b>' + data.createdBy + '</b> and is awaiting your approval:'
                        + '</p>'

                        + '<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse; width:100%;">'
                        + '<tr>'
                        + '<td style="width:30%;"><b>Document No</b></td>'
                        + '<td>' + data.tranid + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td><b>Created By</b></td>'
                        + '<td>' + data.createdBy + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td><b>Date</b></td>'
                        + '<td>' + data.trandate + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td><b>Memo</b></td>'
                        + '<td>' + (data.memo || '-') + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td><b>Total Amount</b></td>'
                        + '<td>' + data.totalAmount + '</td>'
                        + '</tr>'
                        + '</table>'

                        + '<br/>'
                        + '<p>Thank you for your attention to this matter.</p>'

                        + '<br/>'
                        + '<p>'
                        + '<a href="' + data.linkTrans + '" target="_blank">'
                        + '<b> View Record </b>'
                        + '</a>'
                        + '</p>';
                }

                function removeDuplicate(arr) {
                    var unique = {};
                    var result = [];

                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] && !unique[arr[i]]) {
                            unique[arr[i]] = true;
                            result.push(arr[i]);
                        }
                    }
                    return result;
                }
                function getEmail(empId){
                    var emailEmp
                    var empLook = search.lookupFields({
                        type: "employee",
                        id: empId,
                        columns: ["email"],
                    });
                    emailEmp = empLook.email
                    return emailEmp
                }
                const rec    = context.newRecord;
                const recOld = context.oldRecord;
                const recType = rec.type
                log.debug('recType', recType)
                const recLoad = record.load({
                    type: recType,
                    id: rec.id,
                    isDynamic: false
                });
                var newTrigger = recLoad.getValue('custbody_stc_sent_email_budget_holder');
                var oldTrigger = recOld.getValue('custbody_stc_sent_email_budget_holder');
                log.debug('newTrigger', {
                    newTrigger : newTrigger,
                    oldTrigger : oldTrigger
                });
                var linkTrans
                var transName = ''
                var transType = rec.type;
                if(transType == 'purchaseorder'){
                    linkTrans = 'https://11635025.app.netsuite.com/app/accounting/transactions/purchord.nl?id=' + rec.id
                    transName = 'Purchase Order'
                }else if(transType == 'purchaserequisition'){
                    linkTrans = 'https://11635025.app.netsuite.com/app/accounting/transactions/purchreq.nl?id=' + rec.id
                    transName = 'Requisition'
                }else if(transType == 'vendorbill'){
                    linkTrans = 'https://11635025.app.netsuite.com/app/accounting/transactions/vendbill.nl?id=' + rec.id
                    transName = 'Bill'
                }else if(transType == 'expensereport'){
                    transName = 'Expense Management'
                    linkTrans = 'https://11635025.app.netsuite.com/app/accounting/transactions/exprept.nl?id=' + rec.id
                }
                log.debug('transType', transType)
                // var newtriggerFA = recLoad.getValue('custbody_stc_approval_budget_holder');
                var fieldTriggerFa = 'custbody_stc_approval_budget_holder'
                var oldtriggerFA = 'custbody_stc_approval_budget_holder'
                var lookupField = search.lookupFields({
                        type: rec.type,
                        id: rec.id,
                        columns: [fieldTriggerFa]
                    });
                var toBeSent = true
                log.debug('transType', transType)
                var poType = ''
                if(transType == 'purchaseorder'){
                    poType = recLoad.getValue('custbody_stc_po_type');
                    var cForm = recLoad.getValue('customform');
                    log.debug('cForm', cForm)
                    if(cForm == '123'){
                        var cekType = recLoad.getValue('custbody_stc_po_type');
                        log.debug('cekType', cekType)
                        if(cekType == '1'){
                            toBeSent = false
                            fieldTriggerFa = 'custbody_stc_sent_email_finance'
                            oldtriggerFA = 'custbody_stc_sent_email_finance'
                        }
                    }
                }
                var newtriggerFA = recLoad.getValue(fieldTriggerFa)
                log.debug('newtriggerFA', newtriggerFA)
                var oldtriggerFA = recOld.getValue(oldtriggerFA);
                log.debug('oldtriggerFA', oldtriggerFA)
                var trandId = recLoad.getValue('tranid')
                var createdBy = recLoad.getValue('custbody_stc_create_by');
                var empName
                if(createdBy){
                    var empLook = search.lookupFields({
                        type: "employee",
                        id: createdBy,
                        columns: ["firstname"],
                    });
                    empName = empLook.firstname
                }
                log.debug('empName', empName)
                var memo = recLoad.getValue('memo');
                
                let trandateRaw = rec.getValue('trandate');
                log.debug('trandateRaw', trandateRaw)
            const trandate = trandateRaw ? trandateRaw.toString() : '-';
            log.debug('trandate', trandate)
                var totalAmount = recLoad.getValue('total')
                if(recType == 'purchaserequisition'){
                    totalAmount = recLoad.getValue('estimatedtotal')
                }
                
                log.debug('cek trigger budget Holder', { oldTrigger : oldTrigger, newTrigger : newTrigger, toBeSent : toBeSent})
                if(oldTrigger == false && newTrigger == true && toBeSent == true){
                    log.debug('masuk kondisi budget')
                    var cekLineItem = recLoad.getLineCount({
                        sublistId : 'item'
                    });
                    var allApprover = []
                    if(cekLineItem > 0){
                        for(var i = 0; i < cekLineItem; i++){
                            var approver = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol_stc_approver_linetrx',
                                line : i
                            })
                            log.debug('approver', approver)
                            if(approver){
                                allApprover.push(approver)
                            }
                            
                        }
                    }
                    var cekLineExp = recLoad.getLineCount({
                        sublistId : 'expense'
                    });
                    if(cekLineExp > 0){
                        for(var j = 0; j < cekLineExp; j++){
                            var approverExp = recLoad.getSublistValue({
                                sublistId : 'expense',
                                fieldId : 'custcol_stc_approver_linetrx',
                                line : j
                            })
                            if(approverExp){
                                allApprover.push(approverExp)
                            }
                        }
                    }
                    allApprover = removeDuplicate(allApprover)
                    log.debug('allApprover', allApprover)
                    log.debug('totalAmount', totalAmount)
                    if(allApprover.length > 0){
                        allApprover.forEach((emp)=>{
                            var emailId = getEmail(emp);
                            log.debug('emailId', emailId)
                            var emailBody = buildEmailBody({
                                tranid: trandId,
                                createdBy: empName,
                                trandate: trandate,
                                memo: memo,
                                totalAmount: totalAmount,
                                transName : transName,
                                linkTrans : linkTrans
                            });
                            var sendEmail = email.send({
                                author: 3,
                                recipients: emailId,
                                subject: 'New ' + transName  + ' Awaiting Your Approval ',
                                body: emailBody
                            });
                            log.debug('sendEmail', sendEmail)
                        })
                    }
                }
                var allApproverFa = []
                
                if(oldtriggerFA == false && newtriggerFA == true){
                    log.debug('eksekusi FA email', {oldtriggerFA : oldtriggerFA, newtriggerFA : newtriggerFA})
                    var allApprover = []
                   if(poType == "4"){
                        log.debug('Skipping FA email: poType adalah 4', {poType: poType});
                        var allApprover = []
                    }else{
                        var cekLineItemFA = recLoad.getLineCount({
                            sublistId : 'item'
                        });
                        
                        if(cekLineItemFA > 0){
                            for(var iFa = 0; iFa < cekLineItemFA; iFa++){
                                var approverFa = recLoad.getSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'custcol_stc_approver_fa',
                                    line : iFa
                                })
                                log.debug('approverFa', approverFa)
                                if(approverFa){
                                    allApproverFa.push(approverFa)
                                }
                                
                            }
                        }
                        var cekLineExpFA = recLoad.getLineCount({
                            sublistId : 'expense'
                        });
                        if(cekLineExpFA > 0){
                            for(var jFa = 0; jFa < cekLineExpFA; jFa++){
                                var approverExpFa = recLoad.getSublistValue({
                                    sublistId : 'expense',
                                    fieldId : 'custcol_stc_approver_fa',
                                    line : jFa
                                })
                                if(approverExpFa){
                                    allApproverFa.push(approverExpFa)
                                }
                            }
                        }
                    }
                    
                    allApproverFa = removeDuplicate(allApproverFa)
                    log.debug('allApproverFa', allApproverFa)
                    if(allApproverFa.length > 0){
                        allApproverFa.forEach((emp)=>{
                            var emailId = getEmail(emp);
                            log.debug('emailId', emailId)
                            var emailBody = buildEmailBody({
                                tranid: trandId,
                                createdBy: empName,
                                trandate: trandate,
                                memo: memo,
                                totalAmount: totalAmount,
                                transName : transName,
                                linkTrans : linkTrans
                            });
                            var sendEmail = email.send({
                                author: 3,
                                recipients: emailId,
                                subject: 'New ' +transName+' Awaiting Your Approval ',
                                body: emailBody
                            });
                            log.debug('sendEmail', sendEmail)
                        })
                    }
                }
            }catch(e){
                log.debug('error', e)
            }

    }
    return{
        afterSubmit : afterSubmit
    }
});