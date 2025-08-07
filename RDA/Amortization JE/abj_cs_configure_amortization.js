/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record'], (currentRecordModule, recordModule) => {
    function pageInit(context){
        console.log('pageInit Masuk')
    }
    function configureAmortization() {
        const currentRecordObj = currentRecordModule.get();
        const recordType = currentRecordObj.type;
        const recordId = currentRecordObj.id;

        recordModule.load.promise({
            type: recordType,
            id: recordId,
            isDynamic: true
        }).then((rec) => {
            return rec.save();
        }).then((id) => {
            alert('Record updated and saved successfully.');
            window.location.reload();
        }).catch((err) => {
            console.error(err);
            alert('Error: ' + err.message);
        });
    }

    return { 
        pageInit : pageInit,
        configureAmortization : configureAmortization
    };
});
