/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/file', 'N/search', 'N/log', 'N/runtime'], (record, file, search, log, runtime) => {

    const getInputData = () => {
        try {
            const logId = runtime.getCurrentScript().getParameter({ name: 'custscript_abj_log_id' });
            log.debug('logId', logId)
            const logRec = record.load({ type: 'customtransaction_abj_integration_log', id: logId });
            const fileId = logRec.getValue('custbody_file_integration');
            
            const fileObj = file.load({ id: fileId });
            const content = JSON.parse(fileObj.getContents());

            return content.items; 
        } catch (e) {
            log.error('Error getInputData', e.message);
            return [];
        }
    };

    const map = (context) => {
        let item = JSON.parse(context.value);
        let talentaUserId = item.employee.user_id;

        let employeeInfo = lookupEmployee(talentaUserId);
        log.debug('employeeInfo', employeeInfo)
        if (employeeInfo) {
            item.employee.nsInternalId = employeeInfo.id;
            item.employee.nsDepartment = employeeInfo.dept;
            
            context.write({
                key: runtime.getCurrentScript().getParameter({ name: 'custscript_abj_log_id' }),
                value: item
            });
        } else {
            log.error('Employee Not Found', `User ID: ${talentaUserId}`);
        }
    };

    const reduce = (context) => {
        const logId = context.key;
        const employeeItems = context.values.map(val => JSON.parse(val));
        log.debug('employeeItems', employeeItems)
        try {
            let jeRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
            jeRecord.setValue({ fieldId: 'custbody_stc_journal_type', value: 1 }); 
            jeRecord.setValue({ fieldId: 'trandate', value: new Date() });
            jeRecord.setValue({ fieldId: 'subsidiary', value: 1 });

            employeeItems.forEach(empItem => {
                const components = empItem.components;
                const nsEmpId = empItem.employee.nsInternalId;
                const nsDept = empItem.employee.nsDepartment;

                const allLines = [
                    ...components.allowances.map(a => ({ ...a, type: 'allowance' })),
                    ...components.deductions.map(d => ({ ...d, type: 'deduction' })),
                    ...components.benefits.map(b => ({ ...b, type: 'benefit' }))
                ];
                log.debug('allLines', allLines)
                allLines.forEach(line => {
                    if (line.amount <= 0) return; 
                    let mapping = lookupMappingAccount(line.name);

                    if (mapping) {
                        jeRecord.selectNewLine({ sublistId: 'line' });
                        jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: mapping.accountId });
                        let side = mapping.side.toLowerCase() === 'debit' ? 'debit' : 'credit';
                        jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: side, value: line.amount });
                        jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: nsEmpId });
                        if (nsDept) jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: nsDept });
                        jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 114 });
                        jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 3 });
                        jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg1', value: 3 });
                        jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: `${line.name} - ${empItem.employee.employee_name}` });
                        jeRecord.commitLine({ sublistId: 'line' });
                    }
                });
            });

            const jeId = jeRecord.save();
            
            record.submitFields({
                type: 'customtransaction_abj_integration_log',
                id: logId,
                values: {
                    'custbody_abj_integration_status': 1,
                    'custbody_abj_trx_numb_int': jeId
                }
            });

        } catch (e) {
            log.error('Error in Reduce', e.message);
            record.submitFields({
                type: 'customtransaction_abj_integration_log',
                id: logId,
                values: { 'custbody_abj_integration_status': 2 }
            });
        }
    };

    const summarize = (summary) => {
        log.audit('Summary', 'Processing complete');
    };

    function lookupEmployee(userId) {
        let empSearch = search.create({
            type: 'employee',
            filters: [['custentity_stc_user_id_talenta', 'is', userId.toString()], 'AND', ['isinactive', 'is', 'F']],
            columns: ['department']
        }).run().getRange({ start: 0, end: 1 });

        return empSearch.length > 0 ? { id: empSearch[0].id, dept: empSearch[0].getValue('department') } : null;
    }

    function lookupMappingAccount(componentName) {
        let mapSearch = search.create({
            type: 'customrecord_stc_mapping_account',
            filters: [['name', 'is', componentName]],
            columns: ['custrecord_stc_mappacc_debitcredit', 'custrecord_stc_mappacc_account']
        }).run().getRange({ start: 0, end: 1 });

        if (mapSearch.length > 0) {
            return {
                side: mapSearch[0].getText('custrecord_stc_mappacc_debitcredit'), 
                accountId: mapSearch[0].getValue('custrecord_stc_mappacc_account')
            };
        }
        return null;
    }

    return { getInputData, map, reduce, summarize };
});