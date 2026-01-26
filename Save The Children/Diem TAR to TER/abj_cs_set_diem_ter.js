/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/format', 'N/ui/message', 'N/log', 'N/url', 'N/https'],
    
    function(search, format, message, log, url, https) {

        const CONFIG = {
            TRIGGER_FIELD: 'custrecord_ter_tar_no',
            SUBLIST_ID: 'recmachcustrecord_terd_id',
            TAR_REC_TYPE: 'customrecord_tar_expenses',
            TAR_PARENT_KEY: 'custrecord_tar_e_id'
        };

        function pageInit(context) {}

        function fieldChanged(scriptContext) {
            try {
                const rec = scriptContext.currentRecord;
                if (scriptContext.fieldId !== CONFIG.TRIGGER_FIELD) return;

                const tarId = rec.getValue({ fieldId: CONFIG.TRIGGER_FIELD });
                
                if (!tarId) {
                    clearSublist(rec, CONFIG.SUBLIST_ID);
                    return;
                }

                const msg = message.create({ 
                    title: 'Processing', 
                    message: 'Generating Per Diem lines... Do not move away.', 
                    type: message.Type.INFORMATION 
                });
                msg.show();

                setTimeout(() => {
                    try {
                        processTarExpenses(rec, tarId);
                        msg.hide();
                    } catch (innerError) {
                        msg.hide();
                        handleError('Error processing expenses', innerError);
                    }
                }, 200);

            } catch (e) {
                handleError('Unexpected Error', e);
            }
        }

        function processTarExpenses(rec, tarId) {
            const rawData = fetchTarData(tarId);
            
            clearSublist(rec, CONFIG.SUBLIST_ID);

            if (rawData.length === 0) return;

            const linesToSet = [];
            rawData.forEach(row => {
                linesToSet.push(...expandDateRange(row));
            });

            // --- SCROLL FIX: Ambil posisi scroll saat ini ---
            const currentScrollY = window.scrollY;

            // Oper posisi scroll ke fungsi populate
            populateSublistRecursive(rec, linesToSet, currentScrollY);
        }

        function fetchTarData(tarId) {
            // const results = [];
            // search.create({
            //     type: CONFIG.TAR_REC_TYPE,
            //     filters: [
            //         [CONFIG.TAR_PARENT_KEY, "anyof", tarId], "AND", ["custrecord_tar_diem", "is", "T"]
            //     ],
            //     columns: [
            //         "custrecord_tar_item_diem", 
            //         "custrecord_tare_category",
            //         "custrecord_tar_expctd_date_depart", 
            //         "custrecord_tar_expctd_date_rtn",
            //         "custrecord_tar_prcntg",
            //         "custrecord_tare_memo", 
            //         "custrecord_tare_amount",
            //         "custrecord_tare_cost_center", 
            //         "custrecord_tare_project_code", 
            //         "custrecord_tare_donor",
            //         "custrecord_tar_dea", 
            //         "custrecord_tare_source_of_funding", 
            //         "custrecord_tare_project_task",
            //         "custrecord_tar_drc", 
            //         "custrecord_tare_approver", 
            //         "custrecord_tar_approver_fa",
            //         search.createColumn({ name: "custrecord_tar_travel_from", join: "CUSTRECORD_TAR_E_ID", label: "Travel From" }),
            //         search.createColumn({ name: "custrecord_tar_travel_to", join: "CUSTRECORD_TAR_E_ID", label: "Travel To" }),
            //         search.createColumn({ name: "cost", join: "CUSTRECORD_TAR_ITEM_DIEM", label: "Purchase Price" })
            //     ]
            // }).run().each(res => {
            //     let pctRaw = res.getValue("custrecord_tar_prcntg");
            //     let pct = parseFloat(pctRaw) || 0;
            //     if (typeof pctRaw === 'string' && pctRaw.includes('%')) {
            //         pct /= 100;
            //     } else if (pct > 1) {
            //         pct /= 100;
            //     }

            //     results.push({
            //         itemDiem: res.getValue("custrecord_tar_item_diem"),
            //         dateDepart: res.getValue("custrecord_tar_expctd_date_depart"),
            //         dateReturn: res.getValue("custrecord_tar_expctd_date_rtn"),
            //         percentage: pct,
            //         memo: res.getValue("custrecord_tare_memo"),
            //         amountBase: parseFloat(res.getValue({name: "cost", join: "CUSTRECORD_TAR_ITEM_DIEM"})) || 0,
            //         costCenter: res.getValue("custrecord_tare_cost_center"),
            //         projectCode: res.getValue("custrecord_tare_project_code"),
            //         sof: res.getValue("custrecord_tare_donor"),
            //         dea: res.getValue("custrecord_tar_dea"),
            //         sourceOfFunding: res.getValue("custrecord_tare_source_of_funding"),
            //         projectTask: res.getValue("custrecord_tare_project_task"),
            //         drc: res.getValue("custrecord_tar_drc"),
            //         approver: res.getValue("custrecord_tare_approver"),
            //         approverFa: res.getValue("custrecord_tar_approver_fa"),
            //         travelFrom: res.getValue({ name: "custrecord_tar_travel_from", join: "CUSTRECORD_TAR_E_ID" }),
            //         travelTo: res.getValue({ name: "custrecord_tar_travel_to", join: "CUSTRECORD_TAR_E_ID" })
            //     });
            //     return true;
            // });
            // return results;
                const suiteletUrl = url.resolveScript({
                scriptId: "customscript_abj_sl_get_data_tar",
                deploymentId: "customdeploy_abj_sl_get_data_tar",
                params: {
                    custscript_item_id: tarId,
                }
            });
            const response = https.get({ url: suiteletUrl });

            let results = [];
            if (response.body) {
                try {
                    results = JSON.parse(response.body);
                } catch (e) {
                    console.log('Error parsing JSON from Suitelet', e);
                }
            }

            return results;
        }

        function expandDateRange(dataRow) {
            
            const dailyLines = [];
            if (!dataRow.dateDepart || !dataRow.dateReturn) return dailyLines;

            const startDate = format.parse({ value: dataRow.dateDepart, type: format.Type.DATE });
            const endDate = format.parse({ value: dataRow.dateReturn, type: format.Type.DATE });
            const calculatedAmount = dataRow.amountBase * dataRow.percentage;
            console.log('dataDate', {startDate : startDate, endDate : endDate, calculatedAmount : calculatedAmount} )
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                dailyLines.push({
                    ...dataRow,
                    generatedDate: new Date(currentDate),
                    finalAmount: calculatedAmount
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            console.log('dailyLines', dailyLines)
            return dailyLines;

        }

        function clearSublist(rec, sublistId) {
            const count = rec.getLineCount({ sublistId: sublistId });
            for (let i = count - 1; i >= 0; i--) {
                rec.removeLine({ sublistId: sublistId, line: i });
            }
        }

        function convertToDateObject(dateValue) {
            if (!dateValue) return null;
            if (dateValue instanceof Date) return dateValue;
            return format.parse({ value: dateValue, type: format.Type.DATE });
        }

        // --- Perubahan pada parameter function ---
        function populateSublistRecursive(rec, lines, fixedScrollY) {
            const sublistId = CONFIG.SUBLIST_ID;

            function processLine(index) {
                if (index >= lines.length) {
                    console.log('All lines processed.');
                    return;
                }

                const lineData = lines[index];

                try {
                    // Paksa scroll kembali ke posisi awal SEBELUM selectNewLine
                    // (Terkadang NetSuite scroll saat selectNewLine juga)
                    if (fixedScrollY !== undefined) window.scrollTo(0, fixedScrollY);

                    rec.selectNewLine({ sublistId: sublistId });
                    
                    safeSet(rec, sublistId, 'custrecord_ted_item', lineData.itemDiem, true);
                    safeSet(rec, sublistId, 'custrecord_terd_from', lineData.travelFrom, true);
                    safeSet(rec, sublistId, 'custrecord_terd_to', lineData.travelTo, true);
                    
                    const dateObj = convertToDateObject(lineData.generatedDate);
                    safeSet(rec, sublistId, 'custrecord_terd_date', dateObj, true);
                    
                    safeSet(rec, sublistId, 'custrecord_terd_description', lineData.memo, true);
                    safeSet(rec, sublistId, 'custrecord_terd_rate', lineData.finalAmount, true);
                    safeSet(rec, sublistId, 'custrecord_terd_amount', lineData.finalAmount, true);
                    safeSet(rec, sublistId, 'custrecord_terd_cost_center', lineData.costCenter, true);
                    safeSet(rec, sublistId, 'custrecord_terd_project_code', lineData.projectCode, true);
                    
                    // Trigger Sourcing Donor
                    safeSet(rec, sublistId, 'custrecord_terd_donor', lineData.sof, false); 
                    
                    safeSet(rec, sublistId, 'custrecord_terd_sourcing_of_funding', lineData.sourceOfFunding, true);
                    
                    setTimeout(function() {
                        try {
                            if (lineData.projectTask) {
                                safeSet(rec, sublistId, 'custrecord_terd_project_task', lineData.projectTask, true);
                            }
                            
                            safeSet(rec, sublistId, 'custrecord_ter_dea', lineData.dea, true);
                            safeSet(rec, sublistId, 'custrecord_ter_drc', lineData.drc, true);
                            safeSet(rec, sublistId, 'custrecord_terd_approver', lineData.approver, true);
                            safeSet(rec, sublistId, 'custrecord_ter_approver_fa', lineData.approverFa, true);
                            
                            const commitStatus = rec.commitLine({ sublistId: sublistId });
                            if (fixedScrollY !== undefined) {
                                window.scrollTo(0, fixedScrollY);
                            }
                            // ---------------------------------

                            if (!commitStatus) {
                                log.error('Commit Failed at index ' + index, 'Check mandatory fields.');
                            }

                            processLine(index + 1);

                        } catch (timeoutErr) {
                            log.error('Error inside timeout line ' + index, timeoutErr);
                            processLine(index + 1);
                        }
                    }, 500); 

                } catch (err) {
                    log.error('Error processing line ' + index, err);
                    processLine(index + 1);
                }
            }

            processLine(0);
        }

        function safeSet(rec, sublist, fieldId, value, ignoreChange) {
            if (value !== null && value !== undefined && value !== '') {
                rec.setCurrentSublistValue({
                    sublistId: sublist, 
                    fieldId: fieldId, 
                    value: value,
                    ignoreFieldChange: ignoreChange || false 
                });
            }
        }

        function handleError(title, error) {
            log.error(title, error);
            message.create({
                title: 'Error',
                message: title + ': ' + (error.message || error),
                type: message.Type.ERROR
            }).show();
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };
    }
);