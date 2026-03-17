/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/format', 'N/log'], function(currentRecord, format, log) {

    function pageInit(scriptContext) {
        var rec = scriptContext.currentRecord;
        log.debug('trigerred')
        var urlParams = new URLSearchParams(window.location.search);
        console.log('urlParams', urlParams)
        log.debug('urlParams', urlParams)
        var rawData = urlParams.get('dataParamsString');
        console.log('rawData', rawData)

        if (!rawData) return;

        try {
            var data = JSON.parse(rawData);
            if (data && data.length > 0) {
                
                var totalAmount = 0;

                for (var i = 0; i < data.length; i++) {
                    var lineData = data[i];
                    rec.selectNewLine({ sublistId: 'expense' });

                    var safeSublist = function(field, val) {
                        if (val !== null && val !== undefined && val !== '') {
                            try {
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: field,
                                    value: val,
                                    ignoreFieldChange: false 
                                });
                            } catch (err) {
                                console.error('Gagal set field sublist: ' + field, err.message);
                            }
                        }
                    };
                    if (data[0].date) {
                        var parsedDate = parseDateString(data[0].date);
                        safeSublist('expensedate', parsedDate);
                    }

                    safeSublist('currency', '1');
                    safeSublist('expenseaccount', '488'); 
                    
                    if (lineData.noTor) safeSublist('memo', lineData.noTor);
                    
                    totalAmount += Number(lineData.amount || 0);
                    safeSublist('amount', lineData.amount);

                    if (lineData.costCenter) safeSublist('department', lineData.costCenter);
                    if (lineData.projectCode) safeSublist('class', lineData.projectCode);
                    if (lineData.project) safeSublist('customer', lineData.project);
                    
                    if (lineData.projectTask) {
                        safeSublist('projecttask', lineData.projectTask);
                        safeSublist('custrecord_tare_project_task', lineData.projectTask);
                    }
                    
                    if (lineData.activityCode) safeSublist('cseg_paactivitycode', lineData.activityCode);
                    if (lineData.bussinessUnit) safeSublist('cseg1', lineData.bussinessUnit);
                    if (lineData.drc) safeSublist('cseg_stc_drc_segmen', lineData.drc);
                    if (lineData.dea) safeSublist('cseg_stc_segmentdea', lineData.dea);
                    if (lineData.sof) safeSublist('cseg_stc_sof', lineData.sof);
                    rec.commitLine({ sublistId: 'expense' });
                }

                rec.setValue({
                    fieldId: 'custbody_amount_from_tor',
                    value: totalAmount
                });

                console.log('Proses Transform Berhasil. Total Baris: ' + data.length);
            }
        } catch (e) {
            console.error('Error parsing dataParamsString', e);
        }
    }

    function parseDateString(dateStr) {
        var parts = dateStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    return {
        pageInit: pageInit
    };
});