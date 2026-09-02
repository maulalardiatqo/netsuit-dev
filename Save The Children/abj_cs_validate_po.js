/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
    'N/search', 
    'N/log', 
    'N/https', 
    'N/url', 
    'N/runtime', 
    'N/format', 
    'N/ui/dialog', 
    'N/currentRecord', 
    'N/currency', 
    'N/record', 
    'N/ui/message'
], (search, log, https, url, runtime, format, dialog, currentRecord, currency, record, message) => {

    // =====================================================================
    // ENTRY POINT
    // =====================================================================
    function saveRecord(scriptContext) {
        console.log('validate saved record jalan')
        const rec = scriptContext.currentRecord;

        // ---------------------------------------------------------------
        // 1. VALIDASI PO TYPE & RECRUITMENT (Dari Script Kedua)
        // ---------------------------------------------------------------
        const cekTypePO = rec.getValue('custbody_stc_po_type');
        console.log('cekTypePO', cekTypePO);

        if (cekTypePO == 2) {
            const cektypeRecruitment = rec.getValue('custbody_stc_type_recruitement');
            const cekTotalTrans = Number(rec.getValue('total')) || 0;
            console.log('cekTotalTrans', cekTotalTrans);

            if (cektypeRecruitment == 1) {
                if (cekTotalTrans < 25000000) {
                    dialog.alert({ title: 'Validasi FAS', message: 'The FAS amount must be greater than 25 million' });
                    return false;
                }
            } else {
                if (cekTotalTrans > 25000000) {
                    dialog.alert({ title: 'Validasi PAF', message: 'The PAF amount must be less than 25 million' });
                    return false;
                }
            }
        }

        return true;   // ← WAJIB ada return true di akhir kalau semua validasi lolos
    }

    return {
        saveRecord: saveRecord
    };
});