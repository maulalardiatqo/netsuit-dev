/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/format', 'N/ui/message', 'N/log', 'N/url', 'N/https'],
    function(search, format, message, log, url, https) {

        const CONFIG = {
            TRIGGER_FIELD: 'custrecord_ter_tar_no',
            SUBLIST_ID: 'recmachcustrecord_terd_id'
        };

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
                    message: 'Generating Per Diem lines... Please wait.', 
                    type: message.Type.INFORMATION 
                });
                msg.show();
                setTimeout(() => {
                    try {
                        processTarExpenses(rec, tarId, msg);
                    } catch (e) {
                        msg.hide();
                        handleError('Process Error', e);
                    }
                }, 100);

            } catch (e) {
                handleError('Unexpected Error', e);
            }
        }

        function processTarExpenses(rec, tarId, msg) {
            const rawData = fetchTarData(tarId);
            clearSublist(rec, CONFIG.SUBLIST_ID);
            log.debug('rawData', rawData)
            if (!rawData || rawData.length === 0) {
                if (msg) msg.hide();
                return;
            }

            const linesToSet = [];
            rawData.forEach(row => {
                const expanded = expandDateRange(row);
                if (expanded && expanded.length > 0) {
                    linesToSet.push(...expanded);
                }
            });
            log.debug('linesToSet', linesToSet)
            populateSublistRecursive(rec, linesToSet, msg);
        }

        function populateSublistRecursive(rec, lines, msg) {
    const sublistId = CONFIG.SUBLIST_ID;

    function processLine(index) {
        if (index >= lines.length) {
            if (msg) msg.hide();
            console.log('Finished populating all lines');
            return;
        }

        const lineData = lines[index];

        try {
            log.debug('lineData', lineData);
            rec.selectNewLine({ sublistId: sublistId });

            safeSet(rec, sublistId, 'custrecord_ted_item', lineData.itemDiem, true);
            safeSet(rec, sublistId, 'custrecord_terd_from', lineData.travelFrom);
            safeSet(rec, sublistId, 'custrecord_terd_to', lineData.travelTo);

            const dateObj = convertToDateObject(lineData.generatedDate);
            safeSet(rec, sublistId, 'custrecord_terd_date', dateObj);

            safeSet(rec, sublistId, 'custrecord_terd_description', lineData.memo);
            safeSet(rec, sublistId, 'custrecord_terd_rate', lineData.finalAmount);
            safeSet(rec, sublistId, 'custrecord_terd_amount', lineData.finalAmount);
            safeSet(rec, sublistId, 'custrecord_terd_donor', lineData.sof, false);
            safeSet(rec, sublistId, 'custrecord_terd_sourcing_of_funding', lineData.sourceOfFunding, false);

            safeSet(rec, sublistId, 'custrecord_terd_cost_center', lineData.costCenter);
            safeSet(rec, sublistId, 'custrecord_terd_project_code', lineData.projectCode);

            if (lineData.projectTask) {
                safeSet(rec, sublistId, 'custrecord_terd_project_task', lineData.projectTask);
            }

            safeSet(rec, sublistId, 'custrecord_ter_activity_code', lineData.activityCode);
            safeSet(rec, sublistId, 'custrecord_ter_diem_business_unit', lineData.businessUnit);
            safeSet(rec, sublistId, 'custrecord_ter_dea', lineData.dea);
            safeSet(rec, sublistId, 'custrecord_ter_drc', lineData.drc);
            safeSet(rec, sublistId, 'custrecord_terd_approver', lineData.approver);
            safeSet(rec, sublistId, 'custrecord_ter_approver_fa', lineData.approverFa);

            const committed = rec.commitLine({ sublistId: sublistId });
            console.log(`Line ${index + 1} Committed: ${committed}`);

            setTimeout(function() {
                processLine(index + 1);
            }, 300);

        } catch (err) {
            console.error(`Error processing line ${index}`, err);
            processLine(index + 1);
        }
    }

    processLine(0);
}

function safeSet(rec, sublist, fieldId, value, ignoreChange = true) {
    if (value !== null && value !== undefined && value !== '') {
        rec.setCurrentSublistValue({
            sublistId: sublist,
            fieldId: fieldId,
            value: value,
            ignoreFieldChange: ignoreChange,
            forceSyncSourcing: true
        });
    }
}


        function safeSet(rec, sublist, fieldId, value, ignoreChange = true) {
            if (value !== null && value !== undefined && value !== '') {
                rec.setCurrentSublistValue({
                    sublistId: sublist, 
                    fieldId: fieldId, 
                    value: value,
                    ignoreFieldChange: ignoreChange,
                    forceSyncSourcing: true
                });
            }
        }

        function convertToDateObject(dateValue) {
            if (!dateValue) return null;
            if (dateValue instanceof Date) return dateValue;
            return format.parse({ value: dateValue, type: format.Type.DATE });
        }

        function fetchTarData(tarId) {
            const suiteletUrl = url.resolveScript({
                scriptId: "customscript_abj_sl_get_data_tar",
                deploymentId: "customdeploy_abj_sl_get_data_tar",
                params: { custscript_item_id: tarId }
            });
            const response = https.get({ url: suiteletUrl });
            return response.body ? JSON.parse(response.body) : [];
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
            } catch (e) { log.error('Expand Error', e); }
            return dailyLines;
        }

        function clearSublist(rec, sublistId) {
            const count = rec.getLineCount({ sublistId: sublistId });
            for (let i = count - 1; i >= 0; i--) {
                rec.removeLine({ sublistId: sublistId, line: i });
            }
        }

        function handleError(title, error) {
            log.error(title, error);
            message.create({
                title: 'Error',
                message: `${title}: ${error.message || error}`,
                type: message.Type.ERROR
            }).show();
        }

        return { fieldChanged: fieldChanged };
    }
);