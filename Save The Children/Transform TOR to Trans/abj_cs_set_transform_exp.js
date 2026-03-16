/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/search', 'N/currentRecord', 'N/format'], function(url, search, currentRecord, format) {

    function pageInit(context) {
        console.log('trigger cek')
        const objRecord = context.currentRecord;
        console.log('objRecord', objRecord)
        const urlParams = new URLSearchParams(window.location.search);
        const dataParamsString = urlParams.get('dataParamsString');
        console.log('plus dataParamsString', dataParamsString)

        if (context.mode === 'create' && dataParamsString && objRecord.type === 'expensereport') {
            try {
                const data = JSON.parse(dataParamsString);
                console.log('data', data)
                if (Array.isArray(data) && data.length > 0) {
                    if (data[0].transactionType === '2') {
                        transExp(data, objRecord);
                    }
                }
            } catch (e) {
                console.error('Error execution', e);
            }
        }
    }

    function transExp(data, objRecord) {
        console.log('objRecord', objRecord)
        function parseDate(dateStr) {
            if (!dateStr) return new Date();
            let parts = dateStr.split('/');
            if (parts.length !== 3) return new Date();
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }

        objRecord.setValue({ fieldId: 'custbody_id_to', value: data[0].idTor });
        objRecord.setValue({ fieldId: 'custbody_stc_link_to_tor', value: data[0].idTor });
        objRecord.setValue({ fieldId: 'custbody_stc_expense_report_type', value: '1' });
        objRecord.setValue({ fieldId: 'trandate', value: parseDate(data[0].date) });
        objRecord.setValue({ fieldId: 'department', value: data[0].costCenter });
        objRecord.setValue({ fieldId: 'class', value: data[0].projectCode || '114' });
        objRecord.setValue({ fieldId: 'location', value: '3' });
        objRecord.setValue({ fieldId: 'cseg_stc_sof', value: data[0].sof || '66' });

        if (data[0].timeFrom) objRecord.setValue({ fieldId: 'custbody_stc_activity_date_from', value: parseDate(data[0].timeFrom) });
        if (data[0].timeTo) objRecord.setValue({ fieldId: 'custbody_stc_activity_date_to', value: parseDate(data[0].timeTo) });
        
        let totalAmount = 0;

        for (let i = 0; i < data.length; i++) {
            let lineData = data[i];

            objRecord.selectNewLine({ sublistId: 'expense' });

            objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'category', value: '1' }); 
            objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'expensedate', value: parseDate(data[0].date) });
            objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: lineData.amount });
            
            if (lineData.noTor) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'memo', value: lineData.noTor });
            if (lineData.costCenter) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'department', value: lineData.costCenter });
            if (lineData.projectCode) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'class', value: lineData.projectCode });
            if (lineData.project) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'customer', value: lineData.project });

            if (lineData.projectTask) {
                objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'projecttask', value: lineData.projectTask });
            }
           
            if (lineData.activityCode) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg_paactivitycode', value: lineData.activityCode });
            if (lineData.bussinessUnit) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg1', value: lineData.bussinessUnit });
            if (lineData.drc) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg_stc_drc_segmen', value: lineData.drc });
            if (lineData.dea) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg_stc_segmentdea', value: lineData.dea });
            if (lineData.sof) objRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg_stc_sof', value: lineData.sof });

            objRecord.commitLine({ sublistId: 'expense' });
            
            totalAmount += Number(lineData.amount || 0);
        }

        objRecord.setValue({ fieldId: 'custbody_amount_from_tor', value: totalAmount });
    }

    return {
        pageInit: pageInit
    };
});