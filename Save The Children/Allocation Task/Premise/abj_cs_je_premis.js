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
        var cForm = records.getValue('customform');
        if (cForm == 140) {
            var fieldName = context.fieldId;
            if (fieldName == 'custbody_stc_source_account_allocation') {
                var cekAccount = records.getValue('custbody_stc_source_account_allocation');
                var periodId = records.getValue('postingperiod');

                if (cekAccount && periodId) {
                    console.log('data filter', {
                        cekAccount: cekAccount,
                        periodId: periodId
                    });

                    var searchAmt = search.load({
                        id: 'customsearch_abj_premise_allocate_amou_2'
                    });

                    var filters = searchAmt.filters;
                    filters.push(search.createFilter({
                        name: 'account',
                        operator: search.Operator.IS,
                        values: cekAccount
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

                } else {
                    alert('Please Fill Account & Period');
                }
            }
        }
    }

    function generate(context){
        console.log('called generate')
        var sofIdHead = records.getValue('cseg_stc_sof');
        var accountHeader = records.getValue('custbody_stc_source_account_allocation');
        var amountAllocated = records.getValue('custbody_abj_amount_to_allocate');
        if(sofIdHead == '' || sofIdHead == null){
            alert('please select SOF in Header')
            return false
        }
        if(accountHeader == '' || accountHeader == null){
            alert('please select Account')
            return false
        }
        var searchSof = search.load({
            id : 'customsearch_sof_premise'
        })
        var sofResult = [];
        var pagedData = searchSof.runPaged({ pageSize: 1000 }); 

        pagedData.pageRanges.forEach(function (pageRange) {
            var page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach(function (result) {
                sofResult.push({
                    sofId: result.getValue({ name: 'internalid' })
                });
            });
        });
        console.log('sofResult.length', sofResult.length)
        var idDea =''
        if(accountHeader && sofIdHead){
            console.log('masuk search')
            var searchDea = search.load({
                id : 'customsearch_dea_promise'
            });
            var filters = searchDea.filters;
            // filters.push(search.createFilter({
            //     name: 'custrecord_stc_dea_account_relation',
            //     operator: search.Operator.IS,
            //     values: accountHeader
            // }));
            filters.push(search.createFilter({
                name: 'cseg_stc_segmentdea_filterby_cseg_stc_sof',
                operator: search.Operator.IS,
                values: sofIdHead
            }));
            searchDea.filters = filters;

            var result = searchDea.run().getRange({ start: 0, end: 1 });

            if (result && result.length > 0) {
                var firstResult = result[0];
                console.log('Result ditemukan:', firstResult);
                idDea = firstResult.getValue({
                    name: "internalid",
                });
                console.log('idDea:', idDea);
            }
            sofResult.forEach(function (item) {
                var sofId = item.sofId;
                records.selectNewLine({ sublistId: 'recmachcustrecord_stc_trx_id_allocation' });
                records.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    fieldId: 'custrecord_stc_list_coa_allocation',
                    value: accountHeader
                });
                records.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    fieldId: 'custrecord_stc_list_sof_allocation',
                    value: sofId
                });
                if(idDea){
                    records.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                        fieldId: 'custrecord_stc_list_dea_to_allocate',
                        value: idDea
                    });
                }
                 
                records.commitLine({ sublistId: 'recmachcustrecord_stc_trx_id_allocation' });
            });
        }
        

    }
    function calculate(context){
        console.log('called calculate')
    }
    return {
        pageInit: pageInit,
        calculate: calculate,
        generate : generate,
        fieldChanged : fieldChanged
    };
});