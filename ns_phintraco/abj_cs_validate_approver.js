/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {
    function pageInit(context){
       
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

    return {
        pageInit : pageInit,
        validateLine: validateLine
    };
});