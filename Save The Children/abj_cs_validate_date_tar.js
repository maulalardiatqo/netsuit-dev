/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/ui/dialog"], function (dialog) {
    function saveRecord(context) {
        var rec = context.currentRecord;
        
        var dateDepartureBody = rec.getValue('custrecord_tar_expected_date_of_depature');
        var dateReturnBody = rec.getValue('custrecord_tar_expected_date_of_return');

        if (dateDepartureBody && dateReturnBody) {
            var bodyStart = dateDepartureBody.getTime();
            var bodyEnd = dateReturnBody.getTime();

            var sublistId = 'recmachcustrecord_tar_e_id';
            var sublistCount = rec.getLineCount({ sublistId: sublistId });

            for (var i = 0; i < sublistCount; i++) {
                var dateDepartLine = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_tar_expctd_date_depart',
                    line: i
                });
                var dateReturnLine = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_tar_expctd_date_rtn',
                    line: i
                });

                if (dateDepartLine && dateReturnLine) {
                    var lineStart = dateDepartLine.getTime();
                    var lineEnd = dateReturnLine.getTime();

                    if (lineStart < bodyStart || lineEnd > bodyEnd) {
                        dialog.alert({
                            title: 'Validation Error',
                            message: 'Tanggal pada baris ' + (i + 1) + ' berada di luar rentang jadwal utama. \n\n' +
                                    'Jadwal Utama: ' + rec.getText('custrecord_tar_expected_date_of_depature') + ' s/d ' + rec.getText('custrecord_tar_expected_date_of_return')
                        });
                        return false; 
                    }

                    if (lineStart > lineEnd) {
                        dialog.alert({
                            title: 'Validation Error',
                            message: 'Pada baris ' + (i + 1) + ', Expected Date of Departure tidak boleh melewati Expected Date of Return.'
                        });
                        return false;
                    }
                }
            }
        }
        
        return true; 
    }

    return {
        saveRecord: saveRecord
    };
});