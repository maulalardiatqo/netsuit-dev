/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    function pageInit(context){
        console.log('tess')
    }
    function saveRecord(context){
        var currentRecordObj = context.currentRecord;
        var entity = currentRecordObj.getValue('custrecord_tar_staf_name');
        var cekTotalExp = parseFloat(currentRecordObj.getValue('custrecord_tar_advance_request_amount')) || 0;
            
        console.log('cekTotalExp', cekTotalExp);

        if (entity) {
            try {
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_abj_sl_get_employee_data',
                    deploymentId: 'customdeploy_abj_sl_get_employee_data',
                    params: {
                        employee_id: entity
                    }
                });

                const response = https.get({ url: suiteletUrl });
                console.log('response', response)
                if (response.body === 'no_data') {
                    return true; 
                }
                const data = JSON.parse(response.body);
                console.log('data', data)
                const empType = data.empType;
                const isMaxAdvance = data.isMaxAdvance;
                const maxAmount = data.maxAmount;
                const lvEmployee = data.lvEmployee;

                console.log('Data dari Suitelet:', data);
                if (empType == '1' && (isMaxAdvance === true || isMaxAdvance === 'T')) {
                    if (cekTotalExp > maxAmount) {
                        alert('The advance amount can\'t be greater than Max Exclude Advance Amount (' + maxAmount + ')');
                        return false;
                    }
                }
                if (empType == '1' && (isMaxAdvance === false || isMaxAdvance === 'F')) {
                    
                    const level = lvEmployee.toString();

                    if (['4', '5', '6'].includes(level) && cekTotalExp > 30000000) {
                        console.log('masuk kondisi ini')
                        alert('The advance amount can\'t be greater than 30 million');
                        return false;
                    }

                    if (['2', '3'].includes(level) && cekTotalExp > 50000000) {
                        alert('The advance amount can\'t be greater than 50 million');
                        return false;
                    }
                }
            } catch (e) {
                console.error('Error calling Suitelet', e);
            }
            return true
        }
        return true
    }
    return{
        pageInit : pageInit,
        saveRecord : saveRecord
    }
});