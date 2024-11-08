/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
    function cekApDate(periodNameDate){
        var periodSearch = search.create({
            type: "accountingperiod",
            filters: [
                ["periodname", "is", periodNameDate]
            ],
            columns: [
                search.createColumn({name: "periodname", label: "Name"}),
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({name: "fiscalcalendar", label: "fiscalcalendar"})
            ]
        });
        var searchResults = periodSearch.run().getRange({ start: 0, end: 1 });
        return searchResults
    }
    function cekTpDate(periodNameDate){
        var taxperiodSearchObj = search.create({
            type: "taxperiod",
            filters: [
                ["periodname", "is", periodNameDate]
            ],
            columns: [
                search.createColumn({name: "periodname", label: "Name"}),
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({name: "fiscalcalendar", label: "fiscalcalendar"})
            ]
        });
        var searchResults = taxperiodSearchObj.run().getRange({ start: 0, end: 1 });
        return searchResults
    }
    function pageInit(context) {
        log.debug('init masuk');
    }

    function fieldChanged(context){
        var currentRecordObj = context.currentRecord;
        var sublistFieldName = context.fieldId;
        if(sublistFieldName == 'trandate'){
            var trandate = currentRecordObj.getValue({
                fieldId : 'trandate'
            });
            log.debug('trandate', trandate);
            if(trandate){
                function formatTrandate(trandate) {
                    let date = new Date(trandate);
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                
                    let day = date.getDate().toString().padStart(2);
                    let month = monthNames[date.getMonth()];
                    let year = date.getFullYear();
                
                    return `${day} ${month} ${year}`;
                }
                var periodNameDate = formatTrandate(trandate).trim();
                log.debug('periodNameDate', periodNameDate);
                
                var cekDateAp = cekApDate(periodNameDate);
                var cekDateTp = cekTpDate(periodNameDate);
                log.debug('cekDateAp', cekDateAp.length)
                log.debug('cekDateTp', cekDateTp)
                if(cekDateAp.length > 0){
                    
                }else{
                    log.debug('masuk !cekdateAp')
                    dialog.alert({
                        title: 'Warning!',
                        message: '<div style="color: red;">Please Go TO Set Up -> Accounting -> Manage Accounting Periods Menu. And Create Accounting Period</div>'
                    });
                    currentRecordObj.setValue({
                        fieldId: 'trandate',
                        value: ''
                    })
                }
                if(cekDateTp.length > 0){

                }else{
                    dialog.alert({
                        title: 'Warning!',
                        message: '<div style="color: red;">Please Go TO Set Up -> Accounting -> Manage Tax Periods Menu. And Create Accounting Period</div>'
                    });
                    currentRecordObj.setValue({
                        fieldId: 'trandate',
                        value: ''
                    })
                }
            }
            
        }
        
    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});