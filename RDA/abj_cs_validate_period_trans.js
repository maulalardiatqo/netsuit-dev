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
    function formatTrandate(dateString) {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options).replace(',', '');
    }
    function getNextMonth(trandate) {
        let date = new Date(trandate);
    
        let currentMonth = date.getUTCMonth(); 
        let currentYear = date.getUTCFullYear();
    
        let nextMonth = currentMonth + 1;
        let nextYear = currentYear;
    
        if (nextMonth > 11) {
            nextMonth = 0; 
            nextYear += 1;
        }
    
        let nextMonthDate = new Date(Date.UTC(nextYear, nextMonth, date.getUTCDate()));
    
        while (nextMonthDate.getUTCMonth() !== nextMonth) {
            nextMonthDate.setUTCDate(nextMonthDate.getUTCDate() - 1);
        }
    
        return nextMonthDate.toISOString();
    }
    function getEndOfMonthDates(trandateafterFormat, amorPeriod) {
        var startDate = new Date(trandateafterFormat);
    
        var endOfMonthDates = [];
        for (var i = 0; i < amorPeriod; i++) {
            var tempDate = new Date(startDate);
            tempDate.setMonth(tempDate.getMonth() + i + 1);
            
            tempDate.setDate(0);
            
            var formattedDate = formatPeriodDate(tempDate);
            endOfMonthDates.push(formattedDate);
        }
    
        return endOfMonthDates;
    }
    
    function formatPeriodDate(date) {
        var options = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Intl.DateTimeFormat('en-GB', options).format(date);
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
    function saveRecord(context) {
        var currentRecordObj = context.currentRecord;
        var typeRec = currentRecordObj.getValue('type');
    
        if (typeRec == 'vendbill') {
            var trandate = currentRecordObj.getValue('trandate');
            log.debug('trandate', trandate);
            var trandateafter = getNextMonth(trandate);
            log.debug('trandateafter', trandateafter);
            var cekLineExp = currentRecordObj.getLineCount({ sublistId: 'expense' });
    
            if (cekLineExp > 0) {
                for (var i = 0; i < cekLineExp; i++) {
                    var cekAmor = currentRecordObj.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amortizationsched',
                        line: i
                    });
                    log.debug('cekAmor', cekAmor);
    
                    if (cekAmor) {
                        var recAmor = record.load({
                            type: 'revRecTemplate',
                            id: cekAmor
                        });
                        var amorPeriod = recAmor.getValue('amortizationperiod');
                        var periodOffset = recAmor.getValue('periodoffset');
                        var startOffset = recAmor.getValue('revrecoffset');
                        log.debug('amorPeriod', amorPeriod);
                        
                        var trandateafterFormat = formatTrandate(trandateafter);
                        log.debug('trandateafterFormat (before offset)', trandateafterFormat);
                        
                        if (periodOffset) {
                            var trandateafterDate = new Date(trandateafterFormat);
                            trandateafterDate.setMonth(trandateafterDate.getMonth() + periodOffset);
                            trandateafterFormat = formatTrandate(trandateafterDate);
                        }
                        log.debug('trandateafterFormat (after periodOffset)', trandateafterFormat);
                        
                        var arrayDate = getEndOfMonthDates(trandateafterFormat, amorPeriod);
                        log.debug('arrayDate (before startOffset)', arrayDate);
                        
                        if (startOffset) {
                            arrayDate = arrayDate.slice(startOffset);
                        }
                        log.debug('arrayDate (after startOffset)', arrayDate);
    
                        var isValid = true;
    
                        arrayDate.forEach(function (date) {
                            if (!isValid) return; 
                            log.debug('date', date);
    
                            var cekAp = cekApDate(date);
                            log.debug('cekAp', cekAp);
                            if (cekAp.length == 0) {
                                dialog.alert({
                                    title: 'Warning!',
                                    message: '<div style="color: red;">Accounting Period untuk ammortization Belum dibuat, silahkan buat terlebih dulu!</div>'
                                });
                                isValid = false;
                                return; 
                            }
    
                            var cekTp = cekTpDate(date);
                            log.debug('cekTp', cekTp);
                            if (cekTp.length == 0) {
                                dialog.alert({
                                    title: 'Warning!',
                                    message: '<div style="color: red;">Tax Period untuk ammortization Belum dibuat, silahkan buat terlebih dulu!</div>'
                                });
                                isValid = false;
                                return; 
                            }
                        });
    
                        if (!isValid) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord : saveRecord
    };
});