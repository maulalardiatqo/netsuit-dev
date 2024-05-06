/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    var fakturPrev
    function pageInit(context) {
        console.log('init masuk')
        var currentRecordObj = context.currentRecord;
        var oldFaktur = currentRecordObj.getValue({
            fieldId : 'custbody_abj_fp_no'
        })
        if(oldFaktur){
            fakturPrev = oldFaktur
        }
    }
    function unsetFaktur(fakturPrev){
        console.log('masuk unset function')
        var loadFakturPajak = record.load({
            type: "customrecord_abj_no_fp",
            id: fakturPrev,
            isDynamic: true,
        });
        var name = loadFakturPajak.getValue('name');
        var emptyVal = ""
        console.log('name',name);
        loadFakturPajak.setValue({
            fieldId : "custrecord_abj_doc_number_fp",
            value : emptyVal
        });
        loadFakturPajak.setValue({
            fieldId : "custrecord_abj_status",
            value : "2"
        });
        var saveFaktur = loadFakturPajak.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
        });
        console.log('saveFaktur', saveFaktur);
        return true;
    }
    function saveRecord() {
        var currentRecordObj = records;
        var newFaktur = currentRecordObj.getValue({
            fieldId: 'custbody_abj_fp_no'
        });
        console.log('fakturPrev', fakturPrev);
        console.log('newFaktur', newFaktur)
        if (fakturPrev && newFaktur && fakturPrev === newFaktur) {
            console.log('Nilai faktur sama');
        }else if(fakturPrev){
            unsetFaktur(fakturPrev)
        }

        return true;
    }
    return {
        pageInit: pageInit,
        saveRecord : saveRecord
    };
});