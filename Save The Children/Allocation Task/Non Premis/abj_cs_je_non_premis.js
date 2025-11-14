/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    
    function pageInit(context) {
        log.debug('init masuk');
    }
    function fieldChanged(context) {
        var records = context.currentRecord;
        var amountAllocated = records.getValue('custbody_abj_amount_to_allocate');
        var cForm = records.getValue('customform');
        var journalType = records.getValue('custbody_stc_journal_type'); //journal type 5 for non promise
        if (cForm == 141) {
            var fieldName = context.fieldId;
            var sublistFieldName = context.sublistId;
            if(fieldName == 'custbody_abj_destination_account'){
                var periodId = records.getValue('postingperiod');
                var accountId = records.getValue('custbody_abj_destination_account');
                var searchAmt = search.load({
                    id: 'customsearch_abj_premise_allocate_amou_3'
                });

                var filters = searchAmt.filters;
                filters.push(search.createFilter({
                    name: 'account',
                    operator: search.Operator.IS,
                    values: accountId
                }));
                filters.push(search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.IS,
                    values: periodId
                }));
                searchAmt.filters = filters;

                var result = searchAmt.run().getRange({ start: 0, end: 1 });

                if (result && result.length > 0) {
                    var firstResult = result[0];
                    console.log('Result ditemukan:', firstResult);
                    var amount = firstResult.getValue({
                        name: "amount",
                        summary: "SUM",
                    });
                    console.log('Amount:', amount);
                    if(amount){
                        records.setValue({
                            fieldId : 'custbody_abj_amount_to_allocate',
                            value : amount
                        })
                    }
                } else {
                    console.log('Tidak ada data ditemukan untuk filter tersebut.');
                    records.setValue({
                        fieldId : 'custbody_abj_amount_to_allocate',
                        value : 0
                    })
                }

            }
        }
    }
    function generate(context){
        var cekAmountAllocate = records.getValue('custbody_abj_amount_to_allocate');
        if(cekAmountAllocate && cekAmountAllocate > 0){
            var searchSof = search.load({
                id : 'customsearch_sof_list_non_premis'
            });
            
        }else{
            alert('amount cannot be empty or 0');
            return false
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
        generate : generate
    };
});