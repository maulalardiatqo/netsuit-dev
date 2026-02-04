/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/error", "N/ui/message"], function(
    record,
    search,
    serverWidget,
    runtime,
    error,
    message
    ) {
        function searchData(recId){
            var isValidate = false
            const customrecord_line_request_fundSearchObj = search.create({
            type: "customrecord_line_request_fund",
            filters:
            [
                ["internalid","anyof",recId]
            ],
            columns:
            [
                search.createColumn({
                    name: "custrecord_approval_level",
                    join: "CUSTRECORD_FUND_HEAD",
                    label: "Approval Level"
                }),
                 search.createColumn({
                    name: "custrecord_fund_approval",
                    join: "CUSTRECORD_FUND_HEAD",
                    label: "Approval Status"
                })
            ]
            });
            const searchResultCount = customrecord_line_request_fundSearchObj.runPaged().count;
            log.debug("customrecord_line_request_fundSearchObj result count",searchResultCount);
            customrecord_line_request_fundSearchObj.run().each(function(result){
                var cekLevel = result.getValue({
                    name: "custrecord_approval_level",
                    join: "CUSTRECORD_FUND_HEAD",
                })
                var cekApp = result.getValue({
                    name: "custrecord_fund_approval",
                    join: "CUSTRECORD_FUND_HEAD",
                })
                if(cekLevel && cekLevel.includes('Pending Setup COA')){
                    isValidate = true
                }else{
                    if(cekApp == '2'){
                        isValidate = true 
                    }else{
                        isValidate = false
                    }
                }
            return true;
            });
            return isValidate
        }
    function beforeLoad(context) {
        if( context.type == context.UserEventType.EDIT){
            try {
                var rec = context.newRecord;
                var recId = rec.id;
                log.debug('recId', recId);
                if(recId){
                    var isValidate = searchData(recId)
                    log.debug('isValidate', isValidate)
                    if(isValidate == true){
                        log.debug('cannot edit')
                        var customError = error.create({
                            name: 'AKSES_DITOLAK',
                            message: 'Mohon maaf, Data ini tidak dapat diedit karena sudah divalidasi.',
                            notifyOff: true
                        });
                        throw customError;
                    }
                }
            }catch(e){
                if (e.name === 'AKSES_DITOLAK') {
                        throw 'Mohon maaf, Data ini tidak dapat diedit karena sudah divalidasi.';
                    } else {
                        log.debug('System Error', e);
                    }
            }
        }
    }
    function beforeSubmit(context){
        if(context.type == context.UserEventType.DELETE){
            try{
                var rec = context.newRecord;
                var recId = rec.id;
                log.debug('recId', recId);
                if(recId){
                    var isValidate = searchData(recId)
                    log.debug('isValidate', isValidate)
                    if(isValidate == true){
                        log.debug('cannot edit')
                        var customError = error.create({
                            name: 'AKSES_DITOLAK',
                            message: 'Mohon maaf, Data ini tidak dapat dihapus karena sudah divalidasi.',
                            notifyOff: true
                        });
                        throw customError;
                    }
                }
            }catch(e){
                 if (e.name === 'AKSES_DITOLAK') {
                        throw 'Mohon maaf, Data ini tidak dapat dihapus karena sudah divalidasi.';
                    } else {
                        log.debug('System Error', e);
                    }
            }
        }
    }
    return{
        beforeLoad : beforeLoad,
        beforeSubmit : beforeSubmit
    }
})