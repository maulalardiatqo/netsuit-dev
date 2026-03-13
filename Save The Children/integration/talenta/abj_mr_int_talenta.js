/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/file', 'N/search', 'N/log', 'N/runtime', 'N/format'], (record, file, search, log, runtime, format) => {

    const getInputData = () => {
        const logId = runtime.getCurrentScript().getParameter({ name: 'custscript_abj_log_id' });
        try {
            const logRec = record.load({ type: 'customtransaction_abj_integration_log', id: logId });
            const fileId = logRec.getValue('custbody_file_integration');
            const fileObj = file.load({ id: fileId });
            const content = JSON.parse(fileObj.getContents());

            return content.items.map(item => {
                return {
                    employeeData: item,
                    endDate: content.period.end_date,
                    logId: logId
                };
            });
        } catch (e) {
            updateLogStatus(logId, 2, e.message);
            log.error('Error getInputData', e.message);
            return [];
        }
    };

    const map = (context) => {
        const input = JSON.parse(context.value);
        log.debug('input', input)
        const logId = input.logId;
        
        try {
            const empItem = input.employeeData;
            const endDate = input.endDate;

            if (!empItem.employee || !empItem.employee.user_id) {
                throw new Error("Employee object or user_id is missing in JSON item");
            }

            let talentaUserId = empItem.employee.user_id;
            let employeeInfo = lookupEmployee(talentaUserId);

            if (employeeInfo) {
                empItem.employee.nsInternalId = employeeInfo.id;
                empItem.employee.nsDepartment = employeeInfo.dept;
                empItem.periodEndDate = endDate;

                context.write({
                    key: logId,
                    value: empItem
                });
            } else {
                throw new Error(`Employee with Talenta User ID ${talentaUserId} not found in NetSuite.`);
            }
        } catch (e) {
            updateLogStatus(logId, 2, e.message);
            log.error('Error Map', e.message);
        }
    };

    const reduce = (context) => {
        const logId = context.key;
        const employeeItems = context.values.map(val => JSON.parse(val));
        
        try {
            const rawEndDate = employeeItems[0].periodEndDate;
            const parsedEndDate = format.parse({
                value: new Date(rawEndDate),
                type: format.Type.DATE
            });

            let jeRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
            jeRecord.setValue({ fieldId: 'custbody_stc_journal_type', value: 1 }); 
            jeRecord.setValue({ fieldId: 'trandate', value: parsedEndDate });
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
                    } else {
                        throw new Error(`Account mapping for "${line.name}" is missing.`);
                    }
                });
            });

            const jeId = jeRecord.save();
            
            const successResponse = {
                status: "success",
                message: "Journal Entry successfully",
                jeId: jeId
            };

            record.submitFields({
                type: 'customtransaction_abj_integration_log',
                id: logId,
                values: {
                    'custbody_abj_integration_status': 1,
                    'custbody_abj_trx_numb_int': jeId,
                    'custbody_abj_respons_body_int': JSON.stringify(successResponse, null, 4),
                    'custbody_error_message': '',
                    'custbody_abj_source_name' : 'Talenta',
                    'custbody_abj_created_at_int' : new Date()
                }
            });

        } catch (e) {
            log.error('Error Reduce', e.message);
            updateLogStatus(logId, 2, e.message);
        }
    };

    const summarize = (summary) => {
        log.audit('Summary', 'Processing complete');
    };

    function updateLogStatus(id, statusId, errorMsg) {
        const errorResponse = {
            status: "Failed",
            message: errorMsg
        };

        record.submitFields({
            type: 'customtransaction_abj_integration_log',
            id: id,
            values: {
                'custbody_abj_integration_status': statusId,
                'custbody_abj_respons_body_int': JSON.stringify(errorResponse, null, 4),
                'custbody_error_message': errorMsg,
                'custbody_abj_source_name' : 'Talenta',
                'custbody_abj_created_at_int' : new Date()
            }
        });
    }

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