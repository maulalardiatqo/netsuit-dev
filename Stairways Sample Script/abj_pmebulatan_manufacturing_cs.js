/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/currentRecord'], function (currentRecord) {
    var subListId = 'price7'
    function pembulatanSeratus(angka) {
        var roundedValue = Math.ceil(angka / 100) * 100;
        return roundedValue;
    }

    function updateAllLines(currentRecordObj, countLine) {
        for (var i = 0; i < countLine; i++) {
            currentRecordObj.selectLine({ sublistId: subListId, line: i });

            var price_1 = currentRecordObj.getCurrentSublistValue({ sublistId: subListId, fieldId: 'price_1_' });
            var price_2 = currentRecordObj.getCurrentSublistValue({ sublistId: subListId, fieldId: 'price_2_' });
            var price_3 = currentRecordObj.getCurrentSublistValue({ sublistId: subListId, fieldId: 'price_3_' });
            var price_4 = currentRecordObj.getCurrentSublistValue({ sublistId: subListId, fieldId: 'price_4_' });
            var price_5 = currentRecordObj.getCurrentSublistValue({ sublistId: subListId, fieldId: 'price_5_' });

            var roundedPrice_1 = pembulatanSeratus(pembulatan(parseFloat(price_1)));
            var roundedPrice_2 = pembulatanSeratus(pembulatan(parseFloat(price_2)));
            var roundedPrice_3 = pembulatanSeratus(pembulatan(parseFloat(price_3)));
            var roundedPrice_4 = pembulatanSeratus(pembulatan(parseFloat(price_4)));
            var roundedPrice_5 = pembulatanSeratus(pembulatan(parseFloat(price_5)));
            if(!isNaN(roundedPrice_1)){
                currentRecordObj.setCurrentSublistValue({
                    sublistId: subListId,
                    fieldId: 'price_1_',
                    value: roundedPrice_1,
                    ignoreFieldChange: true,
                });
            }
            if(!isNaN(roundedPrice_2)){
                currentRecordObj.setCurrentSublistValue({
                    sublistId: subListId,
                    fieldId: 'price_2_',
                    value: roundedPrice_2,
                    ignoreFieldChange: true,
                });
            }
            if(!isNaN(roundedPrice_3)){
                currentRecordObj.setCurrentSublistValue({
                    sublistId: subListId,
                    fieldId: 'price_3_',
                    value: roundedPrice_3,
                    ignoreFieldChange: true,
                });
            }
            if(!isNaN(roundedPrice_4)){
                currentRecordObj.setCurrentSublistValue({
                    sublistId: subListId,
                    fieldId: 'price_4_',
                    value: roundedPrice_4,
                    ignoreFieldChange: true,
                });
            }
            if(!isNaN(roundedPrice_5)){
                currentRecordObj.setCurrentSublistValue({
                    sublistId: subListId,
                    fieldId: 'price_4_',
                    value: roundedPrice_5,
                    ignoreFieldChange: true,
                });
            }
            

            currentRecordObj.commitLine({ sublistId: subListId });
        }
    }

    function sublistChanged(context) {
        var sublistId = context.sublistId;
        if (sublistId === subListId) {
            console.log(subListId);
            var currentRecordObj = context.currentRecord;
            var countLine = currentRecordObj.getLineCount({ sublistId: subListId });
            console.log('countLine', countLine);

            currentRecordObj.setValue({
                fieldId: 'custrecord_field_id_here',
                value: true,
                ignoreFieldChange: true,
            });

            updateAllLines(currentRecordObj, countLine);
            currentRecordObj.setValue({
                fieldId: 'custrecord_field_id_here',
                value: false,
                ignoreFieldChange: true,
            });
        }
    }

    function pageInit(context) {
        console.log('masuk');
    }
    function pembulatan(angka) {
        if (angka >= 0) {
            var bulat = Math.floor(angka);
            var desimal = angka - bulat;

            if (desimal >= 0.5) {
                return Math.ceil(angka);
            } else {
                return Math.floor(angka);
            }
        } else {
            return Math.ceil(angka);
        }
    }

    return {
        sublistChanged: sublistChanged,
        pageInit: pageInit,
    };
});
