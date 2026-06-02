/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/ui/dialog"], function (dialog) {
    
    function saveRecord(context) {
        const rec = context.currentRecord;
        
        const dateDepartureBody = rec.getValue('custrecord_ter_travel_date_from');
        const dateReturnBody = rec.getValue('custrecord_ter_travel_date_to');

        if (!dateDepartureBody || !dateReturnBody) {
            return true; 
        }

        const bodyStart = dateDepartureBody.getTime();
        const bodyEnd = dateReturnBody.getTime();

        const sublistId = 'recmachcustrecord_terd_id';
        const sublistCount = rec.getLineCount({ sublistId: sublistId });

        let minLineTime = null;
        let maxLineTime = null;
        
        let minLineIndex = -1;
        let maxLineIndex = -1;

        for (let i = 0; i < sublistCount; i++) {
            let lineDate = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_terd_date',
                line: i
            });

            if (!lineDate) continue;

            let lineTime = lineDate.getTime();

            if (minLineTime === null || lineTime < minLineTime) {
                minLineTime = lineTime;
                minLineIndex = i + 1; 
            }
            if (maxLineTime === null || lineTime > maxLineTime) {
                maxLineTime = lineTime;
                maxLineIndex = i + 1;
            }
        }
        const txtDepartureBody = rec.getText('custrecord_ter_travel_date_from');
        const txtReturnBody = rec.getText('custrecord_ter_travel_date_to');
        console.log('txtDepartureBody', txtDepartureBody)
        console.log('txtReturnBody', txtReturnBody)
        console.log('minLineTime', minLineTime)
        console.log('bodyStart', bodyStart)
        console.log('maxLineTime', maxLineTime)
        console.log('bodyEnd', bodyEnd)
        
        if (minLineTime !== null && minLineTime < bodyStart) {
            dialog.alert({
                title: 'Validation Error',
                message: `Tanggal pada baris ${minLineIndex} berada di luar rentang jadwal utama.\n\n` +
                         `Tanggal terawal di detail line tidak boleh lebih kecil dari Travel Date From (${txtDepartureBody}).`
            });
            return false; 
        }

        if (maxLineTime !== null && maxLineTime > bodyEnd) {
            dialog.alert({
                title: 'Validation Error',
                message: `Tanggal pada baris ${maxLineIndex} berada di luar rentang jadwal utama.\n\n` +
                         `Tanggal terakhir di detail line tidak boleh melebihi Travel Date To (${txtReturnBody}).`
            });
            return false; 
        }
        
        return true; 
    }

    return {
        saveRecord: saveRecord
    };
});