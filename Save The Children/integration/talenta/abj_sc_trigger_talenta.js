/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/log', 'N/file', 'N/format'], (
    search,
    record,
    log,
    file,
    format
) => {

    const execute = (context) => {
        try {
            const transactionSearchObj = search.create({
                type: "transaction",
                filters: [
                    ["type","anyof","Custom111"], 
                    "AND", 
                    ["custbody_abj_source_name","startswith","Talenta"], 
                    "AND", 
                    ["custbody_stc_map_reuce_process","is","F"], 
                    "AND", 
                    ["custbody_abj_sc_execution","is","F"], 
                ],
                columns: [
                    search.createColumn({ name: "internalid" })
                ]
            });

            const pagedData = transactionSearchObj.runPaged({
                pageSize: 1000
            });

            log.audit({
                title: 'Total Result',
                details: pagedData.count
            });

            pagedData.pageRanges.forEach(pageRange => {
                const page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(result => {
                    const logId = result.getValue({ name: 'internalid' });

                    try {
                        record.submitFields({
                            type: 'customtransaction_abj_integration_log',
                            id: logId,
                            values: {
                                'custbody_abj_sc_execution': true
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                        const logRec = record.load({ type: 'customtransaction_abj_integration_log', id: logId });
                        const fileId = logRec.getValue('custbody_file_integration');
                        
                        if (!fileId) throw new Error("File integration ID is missing.");
                        
                        const fileObj = file.load({ id: fileId });
                        const content = JSON.parse(fileObj.getContents());
                        const rawEndDate = content.period.end_date;
                        
                        const parsedEndDate = format.parse({
                            value: new Date(rawEndDate),
                            type: format.Type.DATE
                        });

                        // ====================================================================
                        // TAMBAHAN VALIDASI: Cek apakah employee sudah ada di empExisting
                        // ====================================================================
                        var empExisting = []; 
                        const journalentrySearchObj = search.create({
                            type: "journalentry",
                            filters: [
                                ["type","anyof","Journal"], 
                                "AND", 
                                ["custbody_stc_from_integration","is","T"], 
                                "AND", 
                                ["cogs","is","F"], 
                                "AND", 
                                ["taxline","is","F"], 
                                "AND", 
                                ["trandate","on",parsedEndDate]
                            ],
                            columns: [
                                search.createColumn({name: "entity", label: "Name"})
                            ]
                        });
                        
                        journalentrySearchObj.run().each(function(res){
                            var exsEmp = String(res.getValue({ name: "entity" }));
                            if(exsEmp) {
                                empExisting.push(exsEmp);
                            }
                            return true;
                        });
                        // ====================================================================

                        // 2. Setup Journal Entry (JE) Record
                        let jeRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
                        jeRecord.setValue({ fieldId: 'custbody_stc_journal_type', value: 1 }); 
                        jeRecord.setValue({ fieldId: 'trandate', value: parsedEndDate });
                        jeRecord.setValue({ fieldId: 'subsidiary', value: 1 });
                        jeRecord.setValue({ fieldId: 'custbody_stc_from_integration', value:true});
                        jeRecord.setValue({fieldId: 'custbody_stc_journal_type', value : "7"})

                        let totalType2 = 0;
                        let totalFormula = 0;
                        let departMent = null;

                        const targetComponents = [
                            'Basic Salary', 'Expertise Allowance', 'Communication Allowance', 
                            'Transportation Allowance', 'Acting Allowance', 'Others', 
                            'Provisional Allowance', 'Back Pay', 'PKWT Compensation', 
                            'Ex Employee Allowance', 'Others Deduction', 'PPH 21 Resign', 'PPH 21'
                        ];

                        // 3. Process Employee Data & Lines
                        content.items.forEach(empItem => {
                            if (!empItem.employee || !empItem.employee.employee_id) {
                                throw new Error("Employee object or user_id is missing in JSON item");
                            }

                            let talentaUserId = empItem.employee.employee_id;
                            let employeeInfo = lookupEmployee(talentaUserId);

                            if (!employeeInfo) {
                                throw new Error(`Employee with Talenta User ID ${talentaUserId} not found in NetSuite.`);
                            }

                            const nsEmpId = String(employeeInfo.id);
                            const nsDept = employeeInfo.dept;
                            if (nsDept) departMent = nsDept;

                            // ====================================================================
                            // VALIDASI: Lempar error jika nsEmpId sudah terbentuk Journal
                            // ====================================================================
                            if (empExisting.includes(nsEmpId)) {
                                throw new Error("Salah Satu data employee sudah terbentuk journal");
                            }
                            // ====================================================================

                            const components = empItem.components;
                            const allLines = [
                                ...components.allowances.map(a => ({ ...a, type: 'allowance' })),
                                ...components.deductions.map(d => ({ ...d, type: 'deduction' })),
                                ...components.benefits.map(b => ({ ...b, type: 'benefit' }))
                            ];

                            allLines.forEach(line => {
                                if (line.amount <= 0) return; 
                                let mapping = lookupMappingAccount(line.name);
                                
                                if (mapping) {
                                    let side = mapping.side.toLowerCase() === 'debit' ? 'debit' : 'credit';

                                    if (String(mapping.type) === '2') {
                                        totalType2 += parseFloat(line.amount);
                                    }
                                    
                                    if (targetComponents.indexOf(line.name) !== -1) {
                                        if (side === 'debit') {
                                            totalFormula += parseFloat(line.amount);
                                        } else {
                                            totalFormula -= parseFloat(line.amount);
                                        }
                                    }

                                    jeRecord.selectNewLine({ sublistId: 'line' });
                                    jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: mapping.accountId });
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

                        // 4. Set Summary Lines (JHT & Take Home Pay)
                        if (totalType2 > 0) {
                            jeRecord.selectNewLine({ sublistId: 'line' });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 268 }); 
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: totalType2 });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: departMent });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 114 });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 3 });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg1', value: 3 });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: 'Total JHT' });
                            jeRecord.commitLine({ sublistId: 'line' });
                        }

                        if (totalFormula !== 0) {
                            jeRecord.selectNewLine({ sublistId: 'line' })
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 265 }); 
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: Math.abs(totalFormula) });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: departMent });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 114 });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 3 });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg1', value: 3 });
                            jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: 'Take Home Pay' });
                            jeRecord.commitLine({ sublistId: 'line' });
                        }

                        const jeId = jeRecord.save();
                        
                        const successResponse = {
                            status: "success",
                            message: "Journal Entry created successfully",
                            jeId: jeId
                        };

                        // 5. Update Log Record (Success)
                        record.submitFields({
                            type: 'customtransaction_abj_integration_log',
                            id: logId,
                            values: {
                                'custbody_abj_integration_status': 1,
                                'custbody_abj_trx_numb_int': jeId,
                                'custbody_abj_respons_body_int': JSON.stringify(successResponse, null, 4),
                                'custbody_error_message': '',
                                'custbody_abj_source_name' : 'Talenta',
                                'custbody_abj_created_at_int' : new Date(),
                                'custbody_stc_map_reuce_process' : true,
                                'custbody_abj_sc_execution': true
                            }
                        });

                        log.audit({
                            title: 'Record Processed Successfully',
                            details: `Log ID: ${logId} | JE ID: ${jeId}`
                        });

                    } catch (e) {
                        // 6. Update Log Record (Failed)
                        // Error "Salah Satu data employee sudah terbentuk journal" akan ditangkap disini
                        log.error({
                            title: `Failed Processing Record ${logId}`,
                            details: e.message
                        });
                        updateLogStatus(logId, 2, e.message);
                    }
                });
            });
        } catch (e) {
            log.error({
                title: 'Scheduled Script Error',
                details: e
            });
        }
    };

    // --- HELPER FUNCTIONS ---

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
                'custbody_abj_created_at_int' : new Date(),
                'custbody_stc_map_reuce_process' : true,
                'custbody_abj_sc_execution': true
            }
        });
    }

    function lookupEmployee(userId) {
        let empSearch = search.create({
            type: 'employee',
            filters: [['custentity_stc_staff_id', 'is', userId.toString()], 'AND', ['isinactive', 'is', 'F']],
            columns: ['department']
        }).run().getRange({ start: 0, end: 1 });
        
        return empSearch.length > 0 ? { id: empSearch[0].id, dept: empSearch[0].getValue('department') } : null;
    }

    function lookupMappingAccount(componentName) {
        let mapSearch = search.create({
            type: 'customrecord_stc_mapping_account',
            filters: [['name', 'is', componentName]],
            columns: ['custrecord_stc_mappacc_debitcredit', 'custrecord_stc_mappacc_account',  'custrecord_stc_type']
        }).run().getRange({ start: 0, end: 1 });

        if (mapSearch.length > 0) {
            return {
                side: mapSearch[0].getText('custrecord_stc_mappacc_debitcredit'), 
                accountId: mapSearch[0].getValue('custrecord_stc_mappacc_account'),
                type : mapSearch[0].getValue('custrecord_stc_type')
            };
        }
        return null;
    }

    return {
        execute
    };
});