/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/record", "N/log", "N/search"], function (record, log, search) { 
    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                var requestBody = JSON.parse(context.request.body);
                var recId = requestBody.recId;
                var recType = requestBody.recType;
                var source = requestBody.source;
            
                var idToLoad = (recId == source) ? source : recId;
                
                log.debug('data', { 
                    recId: recId,
                    source: source,
                    idToLoad: idToLoad
                });
                
                var recLoad = record.load({
                    type: recType,
                    id: idToLoad
                });

                var nameOfActifity = recLoad.getValue('custrecord_tor_name_of_activity');
                var date = recLoad.getValue('custrecord_tor_date');
                var attachment = recLoad.getValue('custrecord_tor_attachment');
                var backGround = recLoad.getValue('custrecord_tor_background');
                var objectiv = recLoad.getValue('custrecord_tor_objectives');
                var expectedOutput = recLoad.getValue('custrecord_tor_expected_output');
                var createdBy = recLoad.getValue('custrecord_tor_create_by');
                var sentEmailBh = recLoad.getValue('custrecord_tor_sent_email_budget_hldr');
                var budgetAlert = recLoad.getValue('custrecord_tor_budget_alert');
                var periodFrom = recLoad.getValue('custrecord_tor_timeline_p_from');
                var periodTo = recLoad.getValue('custrecord_tor_timeline_period_to');

                var attachedFileIds = [];
                const customrecord_torSearchObj = search.create({
                    type: recType, 
                    filters:
                    [
                        ["internalid", "anyof", idToLoad]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "file",
                            label: "Internal ID"
                        })
                    ]
                });

                customrecord_torSearchObj.run().each(function(result) {
                    var fileId = result.getValue({ name: "internalid", join: "file" });
                    if (fileId) {
                        attachedFileIds.push(fileId);
                    }
                    return true;
                });
                log.debug('attachedFileIds', attachedFileIds)
                var newRec = record.create({
                    type: recType,
                    isDynamic: false
                });

                newRec.setValue({ fieldId: 'custrecord_source_tor_amendment', value: source });
                newRec.setValue({ fieldId: 'custrecord_tor_name_of_activity', value: nameOfActifity });
                newRec.setValue({ fieldId: 'custrecord_tor_date', value: date });
                
                if (attachment) newRec.setValue({ fieldId: 'custrecord_tor_attachment', value: attachment });
                
                newRec.setValue({ fieldId: 'custrecord_tor_background', value: backGround });
                newRec.setValue({ fieldId: 'custrecord_tor_objectives', value: objectiv });
                newRec.setValue({ fieldId: 'custrecord_tor_expected_output', value: expectedOutput });
                newRec.setValue({ fieldId: 'custrecord_tor_create_by', value: createdBy });
                newRec.setValue({ fieldId: 'custrecord_tor_approval_by_budget_h', value: "" });
                newRec.setValue({ fieldId: 'custrecord_tor_last_approve_finance', value: "" });
                newRec.setValue({ fieldId: 'custrecord_tor_next_approver', value: "" });
                newRec.setValue({ fieldId: 'custrecord_tor_last_approve_b_holder', value: "" });
                newRec.setValue({ fieldId: 'custrecord_tor_last_approve_line_mng', value: "" });
                newRec.setValue({ fieldId: 'custrecord_tor_approval_by_finance', value: "" });
                
                newRec.setValue({ fieldId: 'custrecord_tor_sent_email_budget_hldr', value: sentEmailBh });
                newRec.setValue({ fieldId: 'custrecord_tor_budget_alert', value: budgetAlert });
                newRec.setValue({ fieldId: 'custrecord_tor_timeline_p_from', value: periodFrom });
                newRec.setValue({ fieldId: 'custrecord_tor_timeline_period_to', value: periodTo });

                var sublistFields = [
                    "custrecord_tori_item", "custrecord_tor_transaction_type", "custrecord_tor_unit_cost", 
                    "custrecord_tor_quantity", "custrecord_tor_uom", "custrecord_tori_amount", 
                    "custrecord_tor_description", "custrecord_tori_cost_center", "custrecord_tori_project_code", 
                    "custrecord_tor_project", "custrecord_tor_project_task", "custrecord_tor_activity_code", 
                    "custrecord_stc_tor_justification", "custrecord_tor_rpv_vendor", "custrecord_tori_source_of_funding", 
                    "custrecord_tor_drc", "custrecord_tor_dea", "custrecord_tor_business_unit", 
                    "custrecord_tori_approver", "custrecord_tori_approval_status", "custrecord_tori_approver_fa", 
                    "custrecord_tori_approval_status_fa", "custrecord_tor_link_trx_no", "custrecord_tor_link_tar", 
                    "custrecord_tor_donor_currency", "custrecord_tor_exchng_rate_donor", "custrecord_tor_amt_donor_curr", 
                    "custrecord_stc_tor_item_budget_amount", "custrecord_stc_tor_item_budget_consumed", 
                    "custrecord_stc_tor_item_budget_warning", "custrecord_amount_allocated"
                ];

                var sublistId = "recmachcustrecord_tori_id";
                var cekLine = recLoad.getLineCount({ sublistId: sublistId });
                var STATUS_APPROVED = 2;
                var STATUS_PENDING_APPROVAL = 1;

                var groupSummaries = {};
                
                for (var i = 0; i < cekLine; i++) {
                    var transType = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tor_transaction_type', line: i });
                    
                    var linkFieldId = (transType == 4) ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';
                    var linkValue = recLoad.getSublistValue({ sublistId: sublistId, fieldId: linkFieldId, line: i });
                    if (linkValue && linkValue.length > 0) {
                        var torProject = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tor_project', line: i });
                        var lineId = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'id', line: i });
                        var groupKey = (transType == '2') ? torProject : lineId;
                        
                        if (groupKey) {
                            var allocAmount = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_amount_allocated', line: i }) || 0;
                            var lineAmount = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tori_amount', line: i }) || 0;
                            
                            var stringKey = String(groupKey); 
                            
                            if (!groupSummaries[stringKey]) {
                                groupSummaries[stringKey] = {
                                    summaryAmount: 0,
                                    allocationAmount: Number(allocAmount)
                                };
                            }
                            groupSummaries[stringKey].summaryAmount += Number(lineAmount);
                        }
                    }
                }

                log.debug('groupSummaries', groupSummaries);
                
                for (var i = 0; i < cekLine; i++) {
                    var transType = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tor_transaction_type', line: i });
                    var linkFieldId = (transType == 4) ? 'custrecord_tor_link_tar' : 'custrecord_tor_link_trx_no';
                    var linkValue = recLoad.getSublistValue({ sublistId: sublistId, fieldId: linkFieldId, line: i });
                    
                    var newApprovalStatus = null;
                    
                    if (!linkValue || linkValue.length === 0) {
                        newApprovalStatus = STATUS_PENDING_APPROVAL;
                    } 
                    else {
                        var torProject = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'custrecord_tor_project', line: i });
                        var lineId = recLoad.getSublistValue({ sublistId: sublistId, fieldId: 'id', line: i });
                        
                        var groupKey = (transType == '2') ? torProject : lineId;
                        
                        if (groupKey) {
                            var stringKey = String(groupKey);
                            var summaryData = groupSummaries[stringKey];
                            
                            if (summaryData && summaryData.allocationAmount > 0) {
                                if (summaryData.allocationAmount < summaryData.summaryAmount) {
                                    newApprovalStatus = STATUS_PENDING_APPROVAL;
                                } 
                                else {
                                    newApprovalStatus = STATUS_APPROVED;
                                }
                            }
                        }
                    }

                    for (var f = 0; f < sublistFields.length; f++) {
                        var fieldId = sublistFields[f];
                        
                        var val = recLoad.getSublistValue({
                            sublistId: sublistId,
                            fieldId: fieldId,
                            line: i
                        });
                        if (newApprovalStatus !== null && (fieldId === 'custrecord_tori_approval_status' || fieldId === 'custrecord_tori_approval_status_fa')) {
                            val = newApprovalStatus; 
                        }

                        if (val !== null && val !== '') {
                            newRec.setSublistValue({
                                sublistId: sublistId,
                                fieldId: fieldId,
                                line: i,
                                value: val
                            });
                        }
                    }
                }
                var newRecordId = newRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                if (newRecordId) {
                    
                    if (attachedFileIds.length > 0) {
                        attachedFileIds.forEach(function(fileId) {
                            try {
                                record.attach({
                                    record: {
                                        type: 'file',
                                        id: fileId
                                    },
                                    to: {
                                        type: recType,
                                        id: newRecordId
                                    }
                                });
                            } catch (e) {
                                log.error('Gagal melampirkan file ID: ' + fileId, e.message);
                            }
                        });
                    }

                    var sourceLookup = search.lookupFields({
                        type: recType,
                        id: source,
                        columns: ['name', 'custrecord_abj_tor_amendment_list']
                    });

                    var torNo = sourceLookup.name;

                    var rawAmandement = sourceLookup.custrecord_abj_tor_amendment_list || [];
                    var cekAmandementRaw = rawAmandement
                        .filter(function (v) { return v && v.value !== null && v.value !== undefined && v.value !== ''; })
                        .map(function (v) { return String(v.value); });

                    var cekAmandement = [];
                    if (cekAmandementRaw.length > 0) {
                        var validationSearch = search.create({
                            type: recType,
                            filters: [["internalid", "anyof", cekAmandementRaw]],
                            columns: ["internalid"]
                        });
                        validationSearch.run().each(function (result) {
                            cekAmandement.push(result.getValue({ name: "internalid" }));
                            return true;
                        });

                        var staleIds = cekAmandementRaw.filter(function (id) {
                            return cekAmandement.indexOf(id) === -1;
                        });
                        if (staleIds.length > 0) {
                            log.audit('Stale amendment reference dibuang', staleIds);
                        }
                    }

                    var newTorNo;
                    if (cekAmandement.length < 1) newTorNo = torNo + '/A1';
                    else if (cekAmandement.length == 1) newTorNo = torNo + '/A2';
                    else newTorNo = torNo + '/A3';

                    cekAmandement.push(String(newRecordId));

                    log.debug('cekAmandement (final, before submitFields)', cekAmandement);

                    record.submitFields({
                        type: recType,
                        id: source,
                        values: {
                            custrecord_abj_tor_amendment_list: cekAmandement
                        },
                        options: {
                            enablesourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                    context.response.write(JSON.stringify({
                        success: true,
                        newTorNo: newTorNo
                    }));
                }

            } catch (e) {
                log.error("Error Processing Amendment", e.message);
                context.response.write(JSON.stringify({
                    success: false,
                    message: e.message
                }));
            }
        }
    }
    
    return { onRequest: onRequest };
});