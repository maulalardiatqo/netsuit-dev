/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format', 'N/log'], (record, search, format, log) => {

    // Pemetaan rule dinamis berdasarkan filter dari Map/Reduce
    const CONFIG_MAP = {
        'purchaserequisition': {
            dateCol: 'trandate',
            rules: [
                { target: 'nextapprover', reqEmpty: ['custbody_stc_apprvd_byapproval'] }
            ]
        },
        'purchaseorder': {
            dateCol: 'trandate',
            rules: [
                { target: 'nextapprover', match: { 'custbody_stc_po_type': ['1'] }, reqEmpty: ['custbody_stc_last_approve_spc'] },
                { target: 'nextapprover', match: { 'custbody_stc_po_type': ['2', '3', '4'] }, reqEmpty: ['custbody29'] },
                { target: 'custbody_stc_apprvl_fince_rec_form', match: { 'custbody_stc_po_type': ['2'] }, reqEmpty: ['custbody_stc_apprvd_byfinance'] },
                { target: 'custbody_stc_apprvl_pod', match: { 'custbody_stc_po_type': ['2', '4'] }, reqEmpty: ['custbody_stc_apprvd_bypod'] }
            ]
        },
        'vendorbill': {
            dateCol: 'trandate',
            rules: [
                { target: 'nextapprover', reqEmpty: ['custbody_stc_apprvd_byapproval'] }
            ]
        },
        'expensereport': {
            dateCol: 'trandate',
            rules: [
                { target: 'nextapprover', reqEmpty: ['custbody_stc_apprvd_byapproval'] }
            ]
        },
        'invoice': { dateCol: 'trandate', rules: [{ target: 'nextapprover' }] },
        'timebill': { dateCol: 'date', rules: [{ target: 'nextapprover' }] },
        'journalentry': { dateCol: 'trandate', rules: [{ target: 'nextapprover' }] },
        'vendorpayment': { dateCol: 'trandate', rules: [{ target: 'nextapprover' }] },
        'customrecord_tor': {
            dateCol: 'custrecord_tor_date',
            rules: [
                { target: 'custrecord_tor_next_approver', reqEmpty: ['custrecord_tor_last_approve_line_mng'] }
            ]
        },
        'customrecord_ter': {
            dateCol: 'custrecord_ter_date',
            rules: [
                { target: 'custrecord_ter_next_approver', reqEmpty: ['custrecord_ter_last_apprv_mngr'] }
            ]
        },
        'customrecord_tar': {
            dateCol: 'custrecord_tar_date',
            rules: [
                { target: 'custrecord_tar_next_approver', reqEmpty: ['custrecord_tar_last_apprv_mngr'] }
            ]
        }
    };

    const afterSubmit = (context) => {
        const validEvents = [context.UserEventType.CREATE, context.UserEventType.EDIT, context.UserEventType.COPY];
        if (!validEvents.includes(context.type)) return;

        const rec = context.newRecord;
        const conf = CONFIG_MAP[rec.type];
        if (!conf) return;

        try {
            // 1. Ekstraksi semua field yang dibutuhkan untuk divalidasi secara dinamis
            const lookupCols = new Set([conf.dateCol]);
            conf.rules.forEach(rule => {
                lookupCols.add(rule.target);
                if (rule.reqEmpty) rule.reqEmpty.forEach(f => lookupCols.add(f));
                if (rule.match) Object.keys(rule.match).forEach(f => lookupCols.add(f));
            });

            // Tarik data terbaru paska workflow afterSubmit tereksekusi
            const currentData = search.lookupFields({
                type: rec.type,
                id: rec.id,
                columns: Array.from(lookupCols)
            });

            const tranDateRaw = currentData[conf.dateCol];
            if (!tranDateRaw) return;

            const tranDate = format.parse({ value: tranDateRaw, type: format.Type.DATE }).getTime();
            const payload = {};
            const empCache = {};

            const getVal = (val) => (Array.isArray(val) && val.length > 0) ? val[0].value : val;
            const isEmpty = (val) => !val || val === '' || (Array.isArray(val) && val.length === 0);

            // 2. Evaluasi Rules
            conf.rules.forEach(rule => {
                let isValid = true;

                // Cek apakah target field kosong
                if (rule.reqEmpty) {
                    isValid = rule.reqEmpty.every(f => isEmpty(currentData[f]));
                }

                // Cek apakah parameter tipe PO/Form sesuai
                if (isValid && rule.match) {
                    isValid = Object.keys(rule.match).every(f => {
                        const actualVal = getVal(currentData[f]);
                        return rule.match[f].includes(actualVal);
                    });
                }

                // 3. Proses Delegasi jika lolos validasi
                if (isValid) {
                    const approverId = getVal(currentData[rule.target]);
                    if (approverId) {
                        if (empCache[approverId] === undefined) {
                            empCache[approverId] = getDelegation(approverId);
                        }

                        const delg = empCache[approverId];
                        if (delg && delg.subId && approverId !== delg.subId) {
                            if (tranDate >= delg.start && tranDate <= delg.end) {
                                payload[rule.target] = delg.subId;
                            }
                        }
                    }
                }
            });

            // 4. Submit perubahan sekaligus (hemat governance unit)
            if (Object.keys(payload).length > 0) {
                record.submitFields({
                    type: rec.type,
                    id: rec.id,
                    values: payload,
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
                log.audit('Delegation Applied', `Type: ${rec.type} ID: ${rec.id} Fields: ${JSON.stringify(payload)}`);
            }

        } catch (e) {
            log.error('UE Header Delegation Error', `Type: ${rec.type} ID: ${rec.id} - ${e.message}`);
        }
    };

    const getDelegation = (empId) => {
        const empData = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: empId,
            columns: ['custentity_stc_subtitute_apprvl', 'custentity_stc_delgtion_date_from', 'custentity_stc_delegation_date_to']
        });

        const sub = empData.custentity_stc_subtitute_apprvl;
        const dFrom = empData.custentity_stc_delgtion_date_from;
        const dTo = empData.custentity_stc_delegation_date_to;

        if (!sub || !sub.length || !dFrom || !dTo) return null;

        return {
            subId: sub[0].value,
            start: format.parse({ value: dFrom, type: format.Type.DATE }).getTime(),
            end: format.parse({ value: dTo, type: format.Type.DATE }).getTime()
        };
    };

    return { afterSubmit };
});