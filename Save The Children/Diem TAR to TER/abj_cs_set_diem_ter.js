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

            if (!rawData || rawData.length === 0) return;

            const linesToSet = [];
            rawData.forEach(row => {
                const expanded = expandDateRange(row);
                if (expanded && expanded.length > 0) {
                    linesToSet.push(...expanded);
                }
            });

            const currentScrollY = window.scrollY;
            populateSublistRecursive(rec, linesToSet, currentScrollY);
        }

        function fetchTarData(tarId) {
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
                    log.error('Error parsing JSON from Suitelet', e);
                }
            }

            return results;
        }

        function expandDateRange(dataRow) {
            const dailyLines = [];
            if (!dataRow.dateDepart || !dataRow.dateReturn) return dailyLines;

            try {
                const startDate = format.parse({ value: dataRow.dateDepart, type: format.Type.DATE });
                const endDate = format.parse({ value: dataRow.dateReturn, type: format.Type.DATE });
                
                const baseAmount = parseFloat(dataRow.amountBase) || 0;
                const percentage = parseFloat(dataRow.percentage) || 0;
                const calculatedAmount = baseAmount * percentage;

                let currentDate = new Date(startDate.getTime());
                
                while (currentDate <= endDate) {
                    dailyLines.push({
                        ...dataRow,
                        generatedDate: new Date(currentDate),
                        finalAmount: calculatedAmount
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } catch (e) {
                log.error('Error in expandDateRange', e);
            }
            
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
            try {
                return format.parse({ value: dateValue, type: format.Type.DATE });
            } catch (e) {
                return null;
            }
        }

        function populateSublistRecursive(rec, lines, fixedScrollY) {
            const sublistId = CONFIG.SUBLIST_ID;

            function processLine(index) {
                if (index >= lines.length) return;

                const lineData = lines[index];

                try {
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
                    
                    safeSet(rec, sublistId, 'custrecord_terd_donor', lineData.sof, true); 
                    safeSet(rec, sublistId, 'custrecord_terd_sourcing_of_funding', lineData.sourceOfFunding, true);
                    
                    setTimeout(function() {
                        try {
                            if (lineData.projectTask) {
                                console.log('cek projectTask', projectTask)
                                safeSet(rec, sublistId, 'custrecord_terd_project_task', lineData.projectTask, true);
                            }
                            
                            safeSet(rec, sublistId, 'custrecord_ter_dea', lineData.dea, true);
                            safeSet(rec, sublistId, 'custrecord_ter_drc', lineData.drc, true);
                            safeSet(rec, sublistId, 'custrecord_terd_approver', lineData.approver, true);
                            safeSet(rec, sublistId, 'custrecord_ter_approver_fa', lineData.approverFa, true);
                            
                            rec.commitLine({ sublistId: sublistId });
                            
                            if (fixedScrollY !== undefined) window.scrollTo(0, fixedScrollY);

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
                    ignoreFieldChange: ignoreChange
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