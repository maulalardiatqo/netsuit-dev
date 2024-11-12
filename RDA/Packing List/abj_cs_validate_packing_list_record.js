/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], 
    function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
        function saveRecord(context) {
            var rec = currentRecord.get();
            var idRec = rec.id
            var recType = rec.type
            var msg = ''
            if(recType == 'customtransaction_rda_collection_mgm'){
                msg = 'Collection Management'
            }else{
                msg = 'Packing List'
            }
            console.log('recType', recType)
            console.log('idRec', idRec)
            if (!rec.id) {
                dialog.alert({
                    title: "Tidak Bisa Menyimpan",
                    message: "Anda tidak bisa membuat "+ msg +" dari halaman ini"
                });
                return false; 
            }
            
            return true;
        }
        
        return {
            saveRecord: saveRecord
        };
    });
    