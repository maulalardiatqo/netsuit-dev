/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
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
                search.createColumn({name: "type", label: "Account Type"})
            ]
        });
        var searchResultCount = accountSearchObj.runPaged().count;
        log.debug("accountSearchObj result count",searchResultCount);
        accountSearchObj.run().each(function(result){
            var idCoa = result.getValue({
                name : "internalid"
            })
            if(idCoa){
                allId.push(idCoa)
            }
            return true;
        });
        console.log('allId', allId)
        var currentRecordObj = context.currentRecord;
        var typeTrans = currentRecordObj.getValue('type');
        console.log('typeTrans', typeTrans);
        if(typeTrans == 'deposit'){
            console.log('deposit');
            var lineOther = currentRecordObj.getLineCount({ sublistId: 'other' });
           
            if(lineOther > 0){
                var allIdinDep = []
                for (var i = 0; i < lineOther; i++) {
                    var coaOther = currentRecordObj.getSublistValue({
                        sublistId: 'other',
                        fieldId: 'account',
                        line: i
                    });
                    console.log('coaOther', coaOther)
                    if(coaOther){
                        allIdinDep.push(coaOther)
                    }
                }
                console.log('allIdinDep', allIdinDep)
                var foundMatch = allIdinDep.some(function (id) {
                    return allId.includes(id);
                });
                console.log('foundMatch', foundMatch)
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
            console.log('check');
            var lineExp = currentRecordObj.getLineCount({ sublistId: 'expense' });
            console.log('lineExp', lineExp)
            if(lineExp > 0){
                var allIdinExp = []
                for (var j = 0; j < lineExp; j++) {
                    
                    var coaExp = currentRecordObj.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account',
                        line: j
                    });
                    console.log('coaExp', coaExp)
                    if(coaExp){
                        allIdinExp.push(coaExp)
                    }
                }
                console.log('allIdinExp', allIdinExp)
                var foundMatchExp = allIdinExp.some(function (id) {
                    return allId.includes(id);
                });
                console.log('foundMatchExp', foundMatchExp)
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