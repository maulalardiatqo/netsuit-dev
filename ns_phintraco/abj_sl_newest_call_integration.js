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
                const { recId, recType, action } = requestData;

                log.debug('Main Process', `ID: ${recId} | Action: ${action}`);

                const rec = record.load({ type: recType, id: recId, isDynamic: true });
                let isRecordUpdated = false;
                let result = {};

                const currentRev = rec.getValue('custbody_abj_revision_code');
                let nextRevCode = currentRev ? 'R' + (parseInt(currentRev.replace(/\D/g, '') || 0) + 1) : 'R1';

                switch (action) {
                    case 'submitApp':
                        // Create Record baru di website
                        result = sendFullData(rec, 'create', null, "APPROVAL PROCESS");
                        if (result.status === 'success' && result.po_id) {
                            rec.setValue({ fieldId: 'custbody_id_web', value: result.po_id });
                            isRecordUpdated = true;
                        }
                        break;

                    case 'recall':
                        // Update status di website menjadi 'DRAFT'
                        result = sendFullData(rec, 'update', null, 'DRAFT');
                        if (result.status === 'success' || result.status === 'success_update') {
                            rec.setValue({ fieldId: 'custbody_after_recall', value: true });
                            isRecordUpdated = true;
                        }
                        break;

                    case 'resubmitApproval':
                        // Update record yang ada berdasarkan id_web
                        result = sendFullData(rec, 'update', null, 'APPROVAL PROCESS');
                        if (result.status === 'success' || result.status === 'success_update') {
                            rec.setValue({ fieldId: 'approvalstatus', value: '1' });
                            rec.setValue({ fieldId: 'custbody_after_recall', value: false });
                            resetApproverLines(rec);
                            isRecordUpdated = true;
                        }
                        break;

                    case 'resubmitRevission':
                        // Create Record baru + parameter revision_code
                        result = sendFullData(rec, 'create', nextRevCode, 'APPROVAL PROCESS');
                        if (result.status === 'success' || result.status === 'success') {
                            const newIdWeb = result.new_po_id || result.po_id;
                            rec.setValue({ fieldId: 'custbody_id_web', value: newIdWeb });
                            rec.setValue({ fieldId: 'custbody_abj_revision_code', value: nextRevCode });
                            rec.setValue({ fieldId: 'approvalstatus', value: '1' });
                            resetApproverLines(rec);
                            isRecordUpdated = true;
                        }
                        break;
                }

                if (isRecordUpdated) {
                    rec.save({ ignoreMandatoryFields: true });
                }
                log.debug('result', result)
                scriptContext.response.setHeader({ name: 'Content-Type', value: 'application/json' });
                scriptContext.response.write(JSON.stringify(result));

            } catch (e) {
                log.error('Error Suitelet', e);
                scriptContext.response.write(JSON.stringify({ status: 'failed', message: e.message }));
            }
        }
    };

    /**
     * RESET SEMUA APPROVER KE STATUS PENDING (1)
     */
    function resetApproverLines(rec) {
        const count = rec.getLineCount({ sublistId: 'recmachcustrecord_abj_a_id' });
        for (let i = 0; i < count; i++) {
            rec.selectLine({ sublistId: 'recmachcustrecord_abj_a_id', line: i });
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_abj_status_approve', value: '1' });
            rec.commitLine({ sublistId: 'recmachcustrecord_abj_a_id' });
        }
    }

    /**
     * PENGIRIMAN DATA LENGKAP (REFRACTORED)
     */
    function sendFullData(rec, endpointAction, revisionCode, customStatus) {
        // Look up Creator Web ID
        let created_by_web = '';
        const creatorNs = rec.getValue('custbody_abj_creator');
        if (creatorNs) {
            const lookup = search.lookupFields({
                type: 'customrecord_list_users_web',
                id: creatorNs,
                columns: ['custrecord_id_users_web']
            });
            created_by_web = lookup.custrecord_id_users_web;
        }

        const payload = {
            // Meta & Parameters
            action_type: endpointAction, 
            id_netsuite: rec.id,
            id_web: rec.getValue('custbody_id_web') || '',
            codeRevision: revisionCode || rec.getValue('custbody_abj_revision_code') || '',
            status_override: customStatus || '', // Untuk 'DRAFT' saat recall

            // Header Fields
            tranid: rec.getValue('tranid'),
            vendor: rec.getValue('entity'),
            employee: rec.getValue('employee'),
            date: rec.getValue('trandate'),
            memo: rec.getValue('memo') || '',
            categoryPo: rec.getValue('custbodykategori_po') || '',
            product: rec.getValue('custbody17') || '',
            subProduct: rec.getValue('custbodysub_produk') || '',
            noAf: rec.getText('custbody_po_no_af') || '',
            lineCode: rec.getValue('custbody_po_line_code') || '',
            itemAf: rec.getText('custbody_po_af_item_af') || '',
            noPc: rec.getText('custbody_p_no_pc') || '',
            lineCodePc: rec.getValue('custbody_p_line_code_pc') || '',
            itemPC: rec.getText('custbody_p_item_pc') || '',
            noBc: rec.getText('custbody_p_no_bc') || '',
            lineCodeBc: rec.getValue('custbody_p_line_code_bc') || '',
            itemBc: rec.getText('custbody_p_item_bc') || '',
            signPo: rec.getValue('custbody_sign_po') || '',
            subsidiry: rec.getValue('subsidiary') || '',
            location: rec.getValue('location') || '',
            class: rec.getValue('class') || '',
            department: rec.getValue('department') || '',
            currency: rec.getValue('currency') || '',
            exchangeRate: rec.getValue('exchangerate') || '',
            totalAmount: rec.getValue('total'),
            created_by: created_by_web,
            customForm: rec.getValue('customform') || '',
            customform_text: rec.getText('customform') || '',
            series: rec.getValue('custbody_docser_series') || '',
            refertosc: rec.getValue('custbody_ph_refertosc') || '',
            refertopr: rec.getValue('custbodycustbody_ph_refertopr') || '',
            budgetcost_period: rec.getText('custbody_bc_period') || '',
            project_segment: rec.getText('cseg1') || '',
            note_pc: rec.getValue('custbody_po_note_pc') || '',
            note_bc: rec.getValue('custbody_po_note_bc') || '',

            // Sublists & Complex Data
            line_items: getLineItems(rec),
            expenses: getExpenses(rec),
            approvers: getApprovers(rec, (endpointAction === 'create')),
            attachments: getAttachments(rec)
        };

        log.debug(`Sending ${endpointAction}`, payload);

        const response = https.post({
            url: WEBSITE_API_URL + endpointAction,
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        return JSON.parse(response.body || '{}');
    }

    // --- HELPER GETTERS (ITEM, EXPENSE, APPROVER, ATTACH) ---

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
                lineItemBc: rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_p_line_item_bc', line: i }),
                lineNoBc: rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_p_line_no_bc', line: i }),
                grossAmt: rec.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i }),
                location: rec.getSublistText({ sublistId: 'item', fieldId: 'location', line: i }),
                class: rec.getSublistText({ sublistId: 'item', fieldId: 'class', line: i }),
                segmen: rec.getSublistValue({ sublistId: 'item', fieldId: 'cseg1', line: i }),
                no_af: rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_bill_no_af', line: i }),
                item_af: rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_bill_item_af', line: i }),
                line_code_af: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_bill_line_code', line: i }),
                budget_cost_period: rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_bc_period_line', line: i }),
                no_pc: rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_p_line_no_pc', line: i }),
                item_pc: rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_p_line_item_pc', line: i }),
                line_code_pc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_p_line_line_code_pc', line: i }),
                sub_product: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcolsub_produk_line', line: i }),
                descItem: rec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }),
                taxCode: rec.getSublistText({ sublistId: 'item', fieldId: 'taxcode', line: i }),
                taxRate: rec.getSublistText({ sublistId: 'item', fieldId: 'taxrate1', line: i }),
                tax1amt: rec.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }),
                customRate: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ph_customrate', line: i }),
                discount: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ph_discountpercentage', line: i }),
                rateAfterDisc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ph_customrateafterdiscount', line: i }),
                itm_note_pc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_note_pc', line: i }),
                itm_note_bc: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_note_bc', line: i }),
                
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

    function getApprovers(rec, isNew) {
        const approvers = [];
        const count = rec.getLineCount({ sublistId: 'recmachcustrecord_abj_a_id' });
        
        let minGroup = null;
        if (isNew) {
            for (let j = 0; j < count; j++) {
                let g = parseInt(rec.getSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_approval_group', line: j }));
                if (minGroup === null || g < minGroup) minGroup = g;
            }
        }

        for (let i = 0; i < count; i++) {
            const appNsId = rec.getSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_abj_user_need_approval', line: i });
            let webUserId = '';
            if (appNsId) {
                const look = search.lookupFields({ type: 'customrecord_list_users_web', id: appNsId, columns: ['custrecord_id_users_web'] });
                webUserId = look.custrecord_id_users_web;
            }

            let group = parseInt(rec.getSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_approval_group', line: i }));

            approvers.push({
                user_approver: webUserId,
                approval_group: group,
                status_approve: (isNew && group === minGroup) ? '1' : rec.getSublistValue({ sublistId: 'recmachcustrecord_abj_a_id', fieldId: 'custrecord_abj_status_approve', line: i }),
                approval_no: i + 1
            });
        }
        return approvers;
    }

    function getAttachments(rec) {
        const files = [];
        const count = rec.getLineCount({ sublistId: 'recmachcustrecord_a_id' });
        for (let i = 0; i < count; i++) {
            const fId = rec.getSublistValue({ sublistId: 'recmachcustrecord_a_id', fieldId: 'custrecord_a_attachment', line: i });
            if (fId) {
                try {
                    const fObj = file.load({ id: fId });
                    files.push({ name: fObj.name, type: fObj.fileType, content: fObj.getContents() });
                } catch (e) { log.error('File Load Error', e); }
            }
        }
        return files;
    }

    return { onRequest };
});