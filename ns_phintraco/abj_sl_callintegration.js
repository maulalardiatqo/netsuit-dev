/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https', 'N/record', 'N/search', 'N/file', 'N/log'], (https, record, search, file, log) => {

    const WEBSITE_API_URL = 'https://sbapproval.phintraco.com/netsuite/';

    const onRequest = (scriptContext) => {
        if (scriptContext.request.method === 'POST') {
            try {
                const requestData = JSON.parse(scriptContext.request.body);
                const recId = requestData.recId;
                const recType = requestData.recType;
                const action = requestData.action;

                log.debug('Processing ID', `${recId} | Action: ${action}`);

                const rec = record.load({ type: recType, id: recId, isDynamic: true });
                const currentRev = rec.getValue('custbody_abj_revision_code');
                let nextRevisionCode = 'R1';

                if (currentRev) {
                    let numberPart = parseInt(currentRev.replace(/\D/g, ''), 10);
                    
                    if (!isNaN(numberPart)) {
                        nextRevisionCode = 'R' + (numberPart + 1);
                    } else {
                        nextRevisionCode = 'R1';
                    }
                }
                
                log.debug('Revision Logic', `Current: ${currentRev} | Next: ${nextRevisionCode}`);
                let result;
                let isRecordUpdated = false;
                if (action == 'recall') {
                    result = sendRecallData(rec);
                    
                    if (result && result.status === 'success') {
                        rec.setValue({ fieldId: 'custbody_after_recall', value: true });
                        isRecordUpdated = true;
                    }

                } else if (action == 'submitApp') {
                    let revToSend = currentRev || 'R1'; 
                    result = sendFullData(rec, 'create', revToSend);
                    if (result && result.status === 'success') {
                        rec.setValue({ fieldId: 'custbody_abj_flag_approval', value: true });
                        
                        if (!currentRev) {
                            rec.setValue({ fieldId: 'custbody_abj_revision_code', value: 'R1' });
                        }
                        if (result.po_id) { 
                            rec.setValue({ fieldId: 'custbody_id_web', value: result.po_id });
                        }
                        isRecordUpdated = true;
                    }

                } else if (action == 'resubmitData') {
                    result = sendFullData(rec, 'update', currentRev);

                    if (result && result.status === 'success') {
                        rec.setValue({ fieldId: 'custbody_after_recall', value: false });
                        isRecordUpdated = true;
                    }

                } else if (action == 'resubmitRevission') {
                    result = sendFullData(rec, 'revission', nextRevisionCode);

                    if (result && result.status === 'success') {
                        rec.setValue({ fieldId: 'custbody_abj_revision_code', value: nextRevisionCode });
                        isRecordUpdated = true;
                    }
                } else {
                    result = sendFullData(rec, 'create', currentRev || 'R1');
                }
                if (isRecordUpdated) {
                    rec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true 
                    });
                    log.audit('Record Updated', `Record ${recType} ID ${recId} updated successfully.`);
                }
                scriptContext.response.setHeader({ name: 'Content-Type', value: 'application/json' });
                scriptContext.response.write(JSON.stringify(result));

            } catch (e) {
                log.error('Error in Suitelet', e);
                scriptContext.response.write(JSON.stringify({ status: 'failed', message: e.message }));
            }
        }
    };
    function sendRecallData(rec) {
        log.debug('Mode', 'Sending Light Payload (Recall)');

        const payload = {
            id: rec.id, 
            id_web: rec.getValue('custbody_id_web'),
        };

        const response = https.post({
            url: WEBSITE_API_URL + 'recall',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        
        log.debug('Recall Response', response.body);
        return JSON.parse(response.body || '{}');
    }

    function sendFullData(rec, endpointAction, revisionCode) {
        log.debug('Mode', `Sending Heavy Payload (${endpointAction}) with Rev: ${revisionCode}`);
        const appStatus = rec.getValue('approvalstatus') || '';
        const created_by = rec.getValue('entity') || ''; 

        const payload = {
            id: rec.id,
            isRevision: rec.getValue('custbody_abj_revision'),
            tranid: rec.getValue('tranid'),
            vendor: rec.getValue('entity'),
            employee: rec.getValue('employee'),
            date: rec.getValue('trandate'),
            trandId: rec.getValue('tranid'),
            memo: rec.getValue('memo') || '',
            categoryPo: rec.getValue('custbodykategori_po') || '',
            product: rec.getValue('custbody17') || '',
            subProduct: rec.getValue('custbodysub_produk') || '',
            noAf: rec.getValue('custbody_po_no_af') || '',
            lineCode: rec.getValue('custbody_po_line_code') || '',
            itemAf: rec.getValue('custbody_po_af_item_af') || '',
            noPc: rec.getValue('custbody_p_no_pc') || '',
            lineCodePc: rec.getValue('custbody_p_line_code_pc') || '',
            itemPC: rec.getValue('custbody_p_item_pc') || '',
            noBc: rec.getValue('custbody_p_no_bc') || '',
            lineCodeBc: rec.getValue('custbody_p_line_code_bc') || '',
            itemBc: rec.getValue('custbody_p_item_bc') || '',
            signPo: rec.getValue('custbody_sign_po') || '',
            appStatus: appStatus,
            subsidiry: rec.getValue('subsidiary') || '',
            location: rec.getValue('location') || '',
            class: rec.getValue('class') || '',
            department: rec.getValue('department') || '',
            currency: rec.getValue('currency') || '',
            exchangeRate: rec.getValue('exchangerate') || '',
            totalAmount: rec.getValue('total'),
            submission_status: appStatus,
            id_web: rec.getValue('custbody_id_web') || '',
            created_by: created_by,
            codeRevision: revisionCode, 
            
            customForm: rec.getValue('customform') || '',
            series: rec.getValue('custbody_docser_series') || '',
            refertosc: rec.getValue('custbody_ph_refertosc') || '',
            refertopr: rec.getValue('custbodycustbody_ph_refertopr') || '',
            budgetcost_period: rec.getValue('custbody_bc_period') || '',
            project_segment: rec.getValue('cseg1') || '',
            
            action_type: endpointAction, 
            
            line_items: getLineItems(rec),
            expenses: getExpenses(rec),
            approvers: getApprovers(rec),
            attachments: getAttachments(rec)
        };

        const response = https.post({
            url: WEBSITE_API_URL + endpointAction,
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        log.debug(`${endpointAction} Response`, response.body);
        return JSON.parse(response.body || '{}');
    }

    function getLineItems(rec) {
        const lines = [];
        const count = rec.getLineCount({ sublistId: 'item' });
        for (let i = 0; i < count; i++) {
            lines.push({
                po_id: rec.id,
                item: rec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }),
                qty: rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                rate: rec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }),
                amount: rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }),
                idLineNs: rec.getSublistValue({ sublistId: 'item', fieldId: 'id', line: i }),
                lineCodeBc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_p_line_bc', line: i }),
                lineItemBc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_p_line_item_bc', line: i }),
                lineNoBc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_p_line_no_bc', line: i }),
                grossAmt: rec.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i }),
                location: rec.getSublistText({ sublistId: 'item', fieldId: 'location', line: i }),
                class: rec.getSublistText({ sublistId: 'item', fieldId: 'class', line: i }),
                segmen: rec.getSublistValue({ sublistId: 'item', fieldId: 'cseg1', line: i }),
                no_af: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_bill_no_af', line: i }),
                item_af: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_bill_item_af', line: i }),
                line_code_af: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_bill_line_code', line: i }),
                budget_cost_period: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_bc_period_line', line: i }),
                no_pc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_p_line_no_pc', line: i }),
                item_pc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_p_line_item_pc', line: i }),
                line_code_pc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_p_line_line_code_pc', line: i }),
                sub_product: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcolsub_produk_line', line: i }),
                descItem: rec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }),
                taxCode: rec.getSublistText({ sublistId: 'item', fieldId: 'taxcode', line: i }),
                taxRate: rec.getSublistText({ sublistId: 'item', fieldId: 'taxrate1', line: i }),
                tax1amt: rec.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }),
                customRate: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ph_customrate', line: i }),
                discount: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ph_discountpercentage', line: i }),
                rateAfterDisc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ph_customrateafterdiscount', line: i }),
            });
        }
        return lines;
    }

    function getExpenses(rec) {
        const lines = [];
        const count = rec.getLineCount({ sublistId: 'expense' });
        for (let i = 0; i < count; i++) {
            lines.push({
                po_id: rec.id,
                idLineNsExp: rec.getSublistValue({ sublistId: 'expense', fieldId: 'id', line: i }),
                account: rec.getSublistValue({ sublistId: 'expense', fieldId: 'account', line: i }),
                amount: rec.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: i }),
                memo: rec.getSublistValue({ sublistId: 'expense', fieldId: 'memo', line: i })
            });
        }
        return lines;
    }

    function getApprovers(rec) {
        var approvers = [];
        const approvalCount = rec.getLineCount({ sublistId: 'recmachcustrecord_abj_a_id' });
        var approvalNo = 1;
        for (let i = 0; i < approvalCount; i++) {
            var appId = rec.getSublistValue({
                sublistId: 'recmachcustrecord_abj_a_id',
                fieldId: 'custrecord_abj_user_need_approval',
                line: i
            });
            let userId = '';
            try {
                if (appId) {
                    var lookupF = search.lookupFields({
                        type: "customrecord_list_users_web",
                        id: appId,
                        columns: ["custrecord_id_users_web"],
                    });
                    userId = lookupF.custrecord_id_users_web;
                }
            } catch(e) {
                log.error("Lookup Approver Error", e.message);
            }

            approvers.push({
                po_id: rec.id,
                user_approver: userId,
                status_approve: rec.getSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_abj_status_approve', line: i }),
                tgl_approve: rec.getSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_abj_tgl_appprove', line: i }),
                approval_group: rec.getSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_approval_group', line: i }),
                approval_no: approvalNo
            });
            approvalNo = Number(approvalNo) + 1;
        }
        return approvers;
    }

    function getAttachments(rec) {
        var files = [];
        const attachCount = rec.getLineCount({ sublistId: 'recmachcustrecord_a_id' });
        for (let i = 0; i < attachCount; i++) {
            const fileId = rec.getSublistValue({
                sublistId: 'recmachcustrecord_a_id',
                fieldId: 'custrecord_a_attachment',
                line: i
            });
            const desc = rec.getSublistValue({
                sublistId: 'recmachcustrecord_a_id',
                fieldId: 'custrecord_abj_a_keterangan',
                line: i
            });
            
            if (!fileId) continue;

            try {
                const fileObj = file.load({ id: fileId });
                const fileContent = fileObj.getContents();

                files.push({
                    id: fileId,
                    name: fileObj.name,
                    type: fileObj.fileType,
                    content: fileContent,
                    desc: desc
                });
            } catch (e) {
                log.error('Failed to load file', `File ID: ${fileId} | ${e.message}`);
            }
        }
        return files;
    }

    return { onRequest };
});