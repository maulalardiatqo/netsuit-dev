/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/query', 'N/format', 'N/record', 'N/runtime'], 
function(serverWidget, query, format, record, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            let action = context.request.parameters.custparam_action;
            
            // =========================================================
            // 1. API MODE: Fetch Data via SuiteQL + Record Load
            // =========================================================
            if (action === 'get_data') {
                let nextDate = context.request.parameters.custparam_nextdate;
                let sourceAccount = context.request.parameters.custparam_sourceaccount;
                let resultData = [];
                
                try {
                    // LANGKAH 1: Ambil data dasar via SuiteQL (Tanpa filter isinactive karena tidak didukung SQL)
                    let sql = `SELECT id, name, frequency, nextdate FROM allocationschedule`;
                    let params = [];

                    if (nextDate) {
                        sql += ` WHERE nextdate = ?`;
                        params.push(nextDate); 
                    }

                    let queryResults = query.runSuiteQL({ query: sql, params: params }).asMappedResults();

                    // LANGKAH 2: Filter manual Source Account & IsInactive menggunakan Record Load
                    if (sourceAccount) {
                        for (let i = 0; i < queryResults.length; i++) {
                            let row = queryResults[i];
                            
                            // Pengaman Governance Limit (Suitelet max 1000 unit, record.load butuh 10 unit)
                            if (runtime.getCurrentScript().getRemainingUsage() < 50) {
                                break; 
                            }

                            try {
                                let allocRec = record.load({ type: 'allocationschedule', id: row.id });

                                // Pengecekan Inactive secara manual di level record
                                let isInactive = allocRec.getValue({ fieldId: 'isinactive' });
                                if (isInactive === true || isInactive === 'T') {
                                    continue; // Lewati iterasi ini (jangan dimasukkan ke hasil pencarian) jika inactive
                                }

                                let lineCount = allocRec.getLineCount({ sublistId: 'allocationsource' });
                                let isMatch = false;

                                // Cek apakah akun yang dipilih ada di dalam sublist source
                                for (let j = 0; j < lineCount; j++) {
                                    let accId = allocRec.getSublistValue({ sublistId: 'allocationsource', fieldId: 'account', line: j });
                                    if (accId == sourceAccount) {
                                        isMatch = true;
                                        break;
                                    }
                                }

                                if (isMatch) {
                                    resultData.push({
                                        id: row.id,
                                        name: row.name || '-',
                                        frequency: row.frequency || '-',
                                        nextdate: row.nextdate || ''
                                    });
                                }
                            } catch (e) {
                                log.error('Gagal meload Allocation ID: ' + row.id, e.message);
                            }
                        }
                    }

                    context.response.write(JSON.stringify({ status: 'success', data: resultData }));
                } catch (e) {
                    context.response.write(JSON.stringify({ status: 'error', message: e.message }));
                }
                return;
            }

            // =========================================================
            // 2. UI MODE: Render Form
            // =========================================================
            let form = serverWidget.createForm({ title: 'Allocation Batch Bulk' });
            
            form.clientScriptModulePath = 'SuiteScripts/abj_cs_allocation_batch.js'; 

            let accountField = form.addField({ id: 'custpage_source_account', type: serverWidget.FieldType.SELECT, source: 'account', label: 'Source Account' });
            accountField.isMandatory = true; 

            let nextDateField = form.addField({ id: 'custpage_next_date', type: serverWidget.FieldType.DATE, label: 'Next Date' });
            let endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
            nextDateField.defaultValue = format.format({ value: endOfMonth, type: format.Type.DATE });

            let selectAllField = form.addField({ id: 'custpage_select_all', type: serverWidget.FieldType.CHECKBOX, label: 'Select All' });
            selectAllField.defaultValue = 'T';

            form.addButton({ id: 'custpage_btn_process', label: 'Process / Create JE', functionName: 'onProcess' });
            form.addButton({ id: 'custpage_btn_search', label: 'Search', functionName: 'onSearch' });
            form.addButton({ id: 'custpage_btn_reset', label: 'Reset', functionName: 'onReset' });

            let sublist = form.addSublist({ id: 'custpage_alloc_list', type: serverWidget.SublistType.INLINEEDITOR, label: 'Allocation Schedules' });
            sublist.addField({ id: 'custpage_select', type: serverWidget.FieldType.CHECKBOX, label: 'Select' });
            sublist.addField({ id: 'custpage_internalid', type: serverWidget.FieldType.TEXT, label: 'Internal ID' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            sublist.addField({ id: 'custpage_name', type: serverWidget.FieldType.TEXT, label: 'Name' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_frequency', type: serverWidget.FieldType.TEXT, label: 'Frequency' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_nextdate', type: serverWidget.FieldType.DATE, label: 'Next Date' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_status', type: serverWidget.FieldType.TEXT, label: 'Process Status' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            context.response.writePage(form);
        }
    }

    return { onRequest: onRequest };
});