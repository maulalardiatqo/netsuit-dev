/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/log"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, log) {
    function pageInit(context) {
       log.debug('init masuk');
    }

    function saveRecord(context) {
        var allId = []
        var accountSearchObj = search.create({
            type: "account",
            filters:
            [
                ["type","anyof","AcctRec","AcctPay"]
            ],
            columns:
            [
                search.createColumn({name: "name", label: "Name"}),
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({name: "type", label: "Account Type"}),
                search.createColumn({name: "custrecord_is_allow", label: "Allow to make deposits and write checks"})
            ]
        });
        var searchResultCount = accountSearchObj.runPaged().count;
        log.debug("accountSearchObj result count",searchResultCount);
        accountSearchObj.run().each(function(result){
            var idCoa = result.getValue({
                name : "internalid"
            })
            var isAllow = result.getValue({
                name : "custrecord_is_allow"
            });
            if(isAllow){
                log.debug('isAllow', isAllow)
            }else{
                if(idCoa){
                    allId.push(idCoa)
                }
            }
            
            return true;
        });
        log.debug('allId', allId)
        var currentRecordObj = context.currentRecord;
        var typeTrans = currentRecordObj.getValue('type');
        log.debug('typeTrans', typeTrans);
        if(typeTrans == 'deposit'){
            log.debug('deposit');
            var lineOther = currentRecordObj.getLineCount({ sublistId: 'other' });
           
            if(lineOther > 0){
                var allIdinDep = []
                for (var i = 0; i < lineOther; i++) {
                    var coaOther = currentRecordObj.getSublistValue({
                        sublistId: 'other',
                        fieldId: 'account',
                        line: i
                    });
                    log.debug('coaOther', coaOther)
                    if(coaOther){
                        allIdinDep.push(coaOther)
                    }
                }
                log.debug('allIdinDep', allIdinDep)
                var foundMatch = allIdinDep.some(function (id) {
                    return allId.includes(id);
                });
                log.debug('foundMatch', foundMatch)
                if (foundMatch) {
                    dialog.alert({
                        title: 'Warning!',
                        message: '<div style="color: red;">Anda tidak bisa menambahkan Account type Receivable dan Payable Pada Transaksi Ini !</div>'
                    });
                    return false;
                }else{
                    return true;
                }
            }
        }
        if(typeTrans == 'check'){
            log.debug('check');
            var lineExp = currentRecordObj.getLineCount({ sublistId: 'expense' });
            log.debug('lineExp', lineExp)
            if(lineExp > 0){
                var allIdinExp = []
                for (var j = 0; j < lineExp; j++) {
                    
                    var coaExp = currentRecordObj.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account',
                        line: j
                    });
                    log.debug('coaExp', coaExp)
                    if(coaExp){
                        allIdinExp.push(coaExp)
                    }
                }
                log.debug('allIdinExp', allIdinExp)
                var foundMatchExp = allIdinExp.some(function (id) {
                    return allId.includes(id);
                });
                log.debug('foundMatchExp', foundMatchExp)
                if (foundMatchExp) {
                    dialog.alert({
                        title: 'Warning!',
                        message: '<div style="color: red;">Anda tidak bisa menambahkan Account type Receivable dan Payable Pada Transaksi Ini !</div>'
                    });
                    return false;
                }else{
                    return true;
                }
            }
            
        }

    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});