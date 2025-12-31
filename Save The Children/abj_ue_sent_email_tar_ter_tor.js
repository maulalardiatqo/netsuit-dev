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
                        + '<td><b>Name Of Actifity</b></td>'
                        + '<td>' + (data.nameOfActifity || '-') + '</td>'
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
                function buildEmailBodyTar(data) {
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
                        + '<td><b>Travel From</b></td>'
                        + '<td>' + (data.travelFrom || '-') + '</td>'
                        + '</tr>'
                         + '<tr>'
                        + '<td><b>Travel To</b></td>'
                        + '<td>' + (data.travelTo || '-') + '</td>'
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
                function buildEmailBodyTer(data) {
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
                        + '<td><b>Purpose of Travel</b></td>'
                        + '<td>' + (data.purpose|| '-') + '</td>'
                        + '</tr>'
                         + '<tr>'
                        + '<td><b>Travel To</b></td>'
                        + '<td>' + (data.travelTo || '-') + '</td>'
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
                const recLoad = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: false
                });
                var fieldTrigerBudget
                var fieldTriggerFa
                var fieldCreatedBy
                var fieldNameActifity
                var fieldDate
                var fieldApprover
                var fieldApproverFa
                var fieldApproverExp
                var fieldApproverFaExp
                var sublistItem
                var sublistExpense
                var linkTrans
                var fieldTravelFrom
                var fieldTravelTo
                var fieldPurpose
                var transName = ''
                var transType = rec.type;
                if(transType == 'customrecord_tor'){
                    linkTrans = 'https://11635025.app.netsuite.com/app/common/custom/custrecordentry.nl'
                    + '?id=' + rec.id
                    + '&rectype=314&whence=';
                    transName = 'Term of References (TOR)'
                    fieldTrigerBudget = 'custrecord_tor_sent_email_budget_hldr'
                    fieldTriggerFa = 'custrecord_tor_sent_email_finc'
                    fieldCreatedBy = 'custrecord_tor_create_by'
                    fieldNameActifity = 'custrecord_tor_name_of_activity'
                    fieldDate = 'custrecord_tor_date'
                    sublistItem = 'recmachcustrecord_tori_id'
                    fieldApprover = 'custrecord_tori_approver'
                    fieldApproverFa = 'custrecord_tori_approver_fa'
                }else if(transType == 'customrecord_tar'){
                    linkTrans = 'https://11635025.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=309&id=' + rec.id
                    transName = 'Travel Authorization Request (TAR)'
                    sublistItem = 'recmachcustrecord_tar_e_id'
                    fieldApprover = 'custrecord_tare_approver'
                    fieldTravelFrom = 'custrecord_tar_travel_from'
                    fieldTravelTo = 'custrecord_tar_travel_to'
                    fieldDate = 'custrecord_tar_date'
                    fieldCreatedBy = 'custrecord_tar_created_by'
                    fieldTrigerBudget = 'custrecord_tar_sent_email_bdgt_hldr'
                }else if(transType == 'customrecord_ter'){
                    linkTrans = 'https://11635025.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=312&id=' + rec.id
                    transName = 'Travel Expense Report (TER)'
                    sublistItem = 'recmachcustrecord_terd_id'
                    fieldApprover = 'custrecord_terd_approver'
                    fieldApproverFa = 'custrecord_ter_approver_fa'
                    fieldCreatedBy  = 'custrecord_ter_created_by'
                    fieldDate = 'custrecord_ter_date'
                    sublistExpense = 'recmachcustrecord_tar_id_ter'
                    fieldApproverExp = 'custrecord_tare_approver'
                    fieldApproverFaExp = 'custrecord_tar_approver_fa'
                    fieldPurpose = 'custrecord_ter_purpose_of_travel'
                    fieldTrigerBudget = 'custrecord_ter_sent_email_bdgt_hldr'
                    fieldTriggerFa = 'custrecord_ter_sent_email_finc'
                    fieldTravelTo = 'custrecord_ter_travel_to'
                }
                log.debug('transType', transType)

                var newTrigger = recLoad.getValue(fieldTrigerBudget);
                var oldTrigger = recOld.getValue(fieldTrigerBudget);
                log.debug('newTrigger', {
                    newTrigger : newTrigger,
                    oldTrigger : oldTrigger
                });
                if(fieldTriggerFa){
                    var newtriggerFA = recLoad.getValue(fieldTriggerFa);
                    var oldtriggerFA = recOld.getValue(fieldTriggerFa);
                }
                
                var trandId = recLoad.getValue('name')
                var createdBy = recLoad.getValue(fieldCreatedBy);
                var empName
                if(createdBy){
                    var empLook = search.lookupFields({
                        type: "employee",
                        id: createdBy,
                        columns: ["altname"],
                    });
                    empName = empLook.altname
                }
                log.debug('empName', empName)
                if(fieldNameActifity){
                    var nameOfActifity = recLoad.getValue(fieldNameActifity);
                }
                if(fieldTravelFrom){
                    var travelFrom = recLoad.getValue(fieldTravelFrom)
                }
                if(fieldTravelTo){
                    var travelTo = recLoad.getValue(fieldTravelTo)
                }
                if(fieldPurpose){
                    var purpose = recLoad.getValue(fieldPurpose)
                }
                var trandate = recLoad.getText(fieldDate)
                if(oldTrigger == false && newTrigger == true){
                    log.debug('masuk kondisi budget')
                    if(sublistItem){
                        var cekLineItem = recLoad.getLineCount({
                            sublistId : sublistItem
                        });
                        var allApprover = []
                        if(cekLineItem > 0){
                            for(var i = 0; i < cekLineItem; i++){
                                var approver = recLoad.getSublistValue({
                                    sublistId : sublistItem,
                                    fieldId : fieldApprover,
                                    line : i
                                })
                                log.debug('approver', approver)
                                if(approver){
                                    allApprover.push(approver)
                                }
                                
                            }
                        }
                    }
                    
                    if(sublistExpense){
                        var cekLineExp = recLoad.getLineCount({
                        sublistId : sublistExpense
                        });
                        if(cekLineExp > 0){
                            for(var j = 0; j < cekLineExp; j++){
                                var approverExp = recLoad.getSublistValue({
                                    sublistId : sublistExpense,
                                    fieldId : fieldApproverExp  ,
                                    line : j
                                })
                                if(approverExp){
                                    allApprover.push(approverExp)
                                }
                            }
                        }
                    }
                    
                    allApprover = removeDuplicate(allApprover)
                    log.debug('allApprover', allApprover)
                    if(allApprover.length > 0){
                        allApprover.forEach((emp)=>{
                            var emailId = getEmail(emp);
                            log.debug('emailId', emailId)
                            var emailBody
                            if(transType == 'customrecord_tar'){
                                emailBody = buildEmailBodyTar({
                                    tranid: trandId,
                                    createdBy: empName,
                                    trandate: trandate,
                                    travelFrom: travelFrom,
                                    travelTo  : travelTo,
                                    transName : transName,
                                    linkTrans : linkTrans
                                });
                            }else if(transType == 'customrecord_tor'){
                                emailBody = buildEmailBody({
                                    tranid: trandId,
                                    createdBy: empName,
                                    trandate: trandate,
                                    nameOfActifity: nameOfActifity,
                                    transName : transName,
                                    linkTrans : linkTrans
                                });
                            }else{
                                 emailBody = buildEmailBodyTer({
                                    tranid: trandId,
                                    createdBy: empName,
                                    trandate: trandate,
                                    purpose: purpose,
                                    travelTo  : travelTo,
                                    transName : transName,
                                    linkTrans : linkTrans
                                });
                            }
                            
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
                if(fieldTriggerFa){
                    var allApproverFa = []
                    if(oldtriggerFA == false && newtriggerFA == true){
                        if(sublistItem){
                            var cekLineItemFA = recLoad.getLineCount({
                                sublistId : sublistItem
                            });
                            var allApprover = []
                            if(cekLineItemFA > 0){
                                for(var iFa = 0; iFa < cekLineItemFA; iFa++){
                                    var approverFa = recLoad.getSublistValue({
                                        sublistId : sublistItem,
                                        fieldId : fieldApproverFa,
                                        line : iFa
                                    })
                                    log.debug('approverFa', approverFa)
                                    if(approverFa){
                                        allApproverFa.push(approverFa)
                                    }
                                    
                                }
                            }
                        }
                        if(sublistExpense){
                            var cekLineExpFA = recLoad.getLineCount({
                                sublistId : sublistExpense
                            });
                            if(cekLineExpFA > 0){
                                for(var jFa = 0; jFa < cekLineExpFA; jFa++){
                                    var approverExpFa = recLoad.getSublistValue({
                                        sublistId : sublistExpense,
                                        fieldId : fieldApproverFaExp,
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
                                var emailBody
                                if(transType == 'customrecord_tar'){
                                    emailBody = buildEmailBodyTar({
                                        tranid: trandId,
                                        createdBy: empName,
                                        trandate: trandate,
                                        travelFrom: travelFrom,
                                        travelTo  : travelTo,
                                        transName : transName,
                                        linkTrans : linkTrans
                                    });
                                }else if(transType == 'customrecord_tor'){
                                    emailBody = buildEmailBody({
                                        tranid: trandId,
                                        createdBy: empName,
                                        trandate: trandate,
                                        nameOfActifity: nameOfActifity,
                                        transName : transName,
                                        linkTrans : linkTrans
                                    });
                                }else{
                                    emailBody = buildEmailBodyTer({
                                        tranid: trandId,
                                        createdBy: empName,
                                        trandate: trandate,
                                        purpose: purpose,
                                        travelTo  : travelTo,
                                        transName : transName,
                                        linkTrans : linkTrans
                                    });
                                }
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
                }
                
            }catch(e){
                log.debug('error', e)
            }

    }
    return{
        afterSubmit : afterSubmit
    }
});