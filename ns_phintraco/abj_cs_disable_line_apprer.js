/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {
    function pageInit(context){
        var rec = context.currentRecord;
        var cekLine = rec.getLineCount({
            sublistId : 'recmachcustrecord_abj_a_id'
        });
        var cekDissable = false
        if(cekLine > 0){
            for(var i = 0; i < cekLine; i++){
                var statusApproval = rec.getSublistValue({
                    sublistId : 'recmachcustrecord_abj_a_id',
                    fieldId : 'custrecord_abj_status_approve',
                    line : i
                });
                if(statusApproval == '2'){
                    cekDissable = true
                }
            }
        }
        if(cekDissable){
            var fieldCreator = rec.getField({
                fieldId : 'custbody_abj_creator'
            });
            if(fieldCreator){
                fieldCreator.isDisabled = true;
            }
        }
    }


    function validateLine(context) {
        var rec = context.currentRecord;
        var sublistId = context.sublistId;

        if (sublistId === "recmachcustrecord_abj_a_id") {
            console.log('Masuk eksekusi')
            var currentUser = rec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_abj_user_need_approval'
            });
            console.log('currentUser', currentUser)
            if (currentUser) {
                var lineCount = rec.getLineCount({ sublistId: sublistId });
                var currentIndex = rec.getCurrentSublistIndex({ sublistId: sublistId });
                console.log('lineCount', lineCount)
                // Looping ke baris-baris sebelumnya untuk mengecek kesamaan
                for (var i = 0; i < lineCount; i++) {
                    // Skip pengecekan jika index-nya sama dengan line yang sedang diedit
                    if (i === currentIndex) continue; 

                    var existingUser = rec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_abj_user_need_approval',
                        line: i
                    });
                    console.log('existingUser', existingUser)
                    // Jika ada value yang sama, block proses penambahan line
                    if (currentUser === existingUser) {
                        alert("User untuk approval ini sudah ada di baris lain. Silakan pilih user yang berbeda.");
                        return false; 
                    }
                }
            }
        }
        return true;
    }

    function validateDelete(context) {
        var rec = context.currentRecord;
        var sublistId = context.sublistId;

        if (sublistId !== "recmachcustrecord_abj_a_id") return true;

        var line = context.line;

        var statusValue = rec.getCurrentSublistValue({
            sublistId,
            fieldId: 'custrecord_abj_status_approve',
        });

        if (statusValue == 2) {
            alert("Line ini tidak dapat dihapus karena sudah APPROVED.");
            return false; 
        }

        return true;
    }

    function saveRecord(context) {
        var rec = context.currentRecord;

        var countA = rec.getLineCount({
            sublistId: 'recmachcustrecord_abj_a_id'
        });
        if (countA === 0) {
            return true;
        }

        var countB = rec.getLineCount({
            sublistId: 'recmachcustrecord_a_id'
        });

        if (countB === 0) {
            alert('File Attach Must be filled');
            return false;
        }
        return true;
    }

    return {
        pageInit : pageInit,
        lineInit: lineInit,
        validateLine: validateLine, 
        validateDelete : validateDelete,
        saveRecord : saveRecord
    };
});