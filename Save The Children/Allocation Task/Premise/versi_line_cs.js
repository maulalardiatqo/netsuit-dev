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

    function generate(context) {
        console.log('called generate');

        var sofIdHead = records.getValue('cseg_stc_sof');
        var accountHeader = records.getValue('custbody_stc_source_account_allocation');
        var amountAllocated = records.getValue('custbody_abj_amount_to_allocate');

        if (!sofIdHead) {
            alert('Please select SOF in Header');
            return false;
        }
        if (!accountHeader) {
            alert('Please select Account');
            return false;
        }

        var searchSof = search.load({ id: 'customsearch_sof_premise' });
        var sofResult = [];
        var pagedData = searchSof.runPaged({ pageSize: 1000 });

        pagedData.pageRanges.forEach(function (pageRange) {
            var page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach(function (result) {
                sofResult.push({
                    sofId: result.getValue({ name: 'internalid' }),
                    deaPromise: [] 
                });
            });
        });

        console.log('sofResult', sofResult);

        if (accountHeader && sofResult.length > 0) {
            console.log('masuk search DEA Promise');

            var searchDea = search.load({ id: 'customsearch_dea_promise' });
            var filters = searchDea.filters || [];

            filters.push(search.createFilter({
                name: 'cseg_stc_segmentdea_filterby_cseg_stc_sof',
                operator: search.Operator.ANYOF,
                values: sofResult.map(s => s.sofId)
            }));

            // filters.push(search.createFilter({
            //     name: 'custrecord_stc_dea_account_relation',
            //     operator: search.Operator.IS,
            //     values: accountHeader
            // }));

            searchDea.filters = filters;

            var deaPaged = searchDea.runPaged({ pageSize: 1000 });
            deaPaged.pageRanges.forEach(function (pageRange) {
                var page = deaPaged.fetch({ index: pageRange.index });
                page.data.forEach(function (res) {
                    var sofLinked = res.getValue({
                        name: 'cseg_stc_segmentdea_filterby_cseg_stc_sof'
                    });

                    var drcSegmen = res.getValue({
                        name: 'cseg_stc_segmentdea_filterby_cseg_stc_drc_segmen'
                    });

                    var target = sofResult.find(s => s.sofId == sofLinked);
                    if (target) {
                        target.deaPromise.push({
                            deaId: res.getValue({ name: 'internalid' }),
                            deaName: res.getValue({ name: 'name' }),
                            drcSegmen: drcSegmen || null
                        });
                    }
                });
            });

            console.log('sofResult mapped:', JSON.stringify(sofResult));

            var lineCount = records.getLineCount({
                sublistId: 'recmachcustrecord_stc_trx_id_allocation'
            });
            console.log('lineCount existing:', lineCount);

            if (lineCount > 0) {
                for (var i = lineCount - 1; i >= 0; i--) {
                    records.removeLine({
                        sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                        line: i
                    });
                }
                console.log('All existing lines removed.');
            }

            sofResult.forEach(function (item) {
                var sofId = item.sofId;

                if (item.deaPromise.length === 0) {
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
                    // records.setCurrentSublistValue({
                    //     sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    //     fieldId: 'custrecord_stc_list_dea_to_allocate',
                    //     value: null
                    // });
                    // records.setCurrentSublistValue({
                    //     sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    //     fieldId: 'cseg_stc_drc_segmen',
                    //     value: null
                    // });
                    records.commitLine({ sublistId: 'recmachcustrecord_stc_trx_id_allocation' });
                } else {
                    item.deaPromise.forEach(function (dea) {
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
                        records.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                            fieldId: 'custrecord_stc_list_dea_to_allocate',
                            value: dea.deaId || ''
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                            fieldId: 'cseg_stc_segmentdea',
                            value: dea.deaId || ''
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                            fieldId: 'cseg_stc_drc_segmen',
                            value: dea.drcSegmen || ''
                        });
                        records.commitLine({ sublistId: 'recmachcustrecord_stc_trx_id_allocation' });
                    });
                }
            });
        }
    }



    function calculate(context) {
        console.log('called calculate');
        var cekLine = records.getLineCount({
            sublistId: 'recmachcustrecord_stc_trx_id_allocation'
        });
        console.log('calculate cekline', cekLine);

        if (cekLine > 0) {
            var sofIdHead = records.getValue('cseg_stc_sof');
            var accountHeader = records.getValue('custbody_stc_source_account_allocation');
            var amountAllocated = records.getValue('custbody_abj_amount_to_allocate');
            var periodText = records.getText('postingperiod');
            var allDataSet = [];

            for (var i = 0; i < cekLine; i++) {
                var dea = records.getSublistValue({
                    sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    fieldId: 'cseg_stc_segmentdea',
                    line: i
                });
                var drc = records.getSublistValue({
                    sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    fieldId: 'cseg_stc_drc_segmen',
                    line: i
                });
                var sofId = records.getSublistValue({
                    sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    fieldId: 'custrecord_stc_list_sof_allocation',
                    line: i
                });
                var percentage = records.getSublistValue({
                    sublistId: 'recmachcustrecord_stc_trx_id_allocation',
                    fieldId: 'custrecord_stc_percentage_allocation',
                    line: i
                });

                if (percentage) {
                    allDataSet.push({
                        dea: dea,
                        sofId: sofId,
                        percentage: percentage,
                        drc : drc
                    });
                } else {
                    alert('Please make sure that percentage to count is filled');
                    return false;
                }
            }

            var costCenterIdDepartment = 17;
            var projectCodeIdClass = 12;
            var memo = 'Allocation Premise Office Rental ' + periodText;
            console.log('memo', memo);

            if (allDataSet.length > 0) {
                // ✅ CEK apakah sublist "line" sudah ada isinya
                var lineCount = records.getLineCount({ sublistId: 'line' });
                console.log('existing journal lines:', lineCount);

                // Jika ada, hapus semua line dulu
                if (lineCount > 0) {
                    for (var j = lineCount - 1; j >= 0; j--) {
                        records.removeLine({
                            sublistId: 'line',
                            line: j
                        });
                    }
                    console.log('All existing journal lines removed.');
                }

                // ✅ Setelah kosong, baru tambahkan line baru
                var total = 0;
                allDataSet.forEach(function (data) {
                    var dea = data.dea;
                    var drc = data.drc
                    
                    var sofId = data.sofId;
                    var percentage = data.percentage;
                    var memoSet = memo + ' ' + percentage + '%';
                    var amountDebit = Number(amountAllocated) * (Number(percentage) / 100);
                    total += amountDebit;

                    records.selectNewLine({ sublistId: 'line' });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: accountHeader
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: amountDebit
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: costCenterIdDepartment
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        value: projectCodeIdClass
                    });
                    
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'memo',
                        value: memoSet
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'cseg_stc_sof',
                        value: sofId
                    });
                    if(drc){
                        records.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_stc_drc_segmen',
                            value: drc
                        });
                    }
                    if(dea){
                        records.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_stc_segmentdea',
                            value: dea
                        });
                    }
                    
                    records.commitLine({ sublistId: 'line' });
                });

                if (total > 0) {
                    var idDea = ''
                    var idDrc = ''
                    var deaSearch = search.load({
                        id : 'customsearch_dea_promise'
                    });
                    var filters = deaSearch.filters;
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
                    deaSearch.filters = filters;

                    var result = deaSearch.run().getRange({ start: 0, end: 1 });

                    if (result && result.length > 0) {
                        var firstResult = result[0];
                        idDea = firstResult.getValue({
                            name: "internalid"
                        });
                        console.log('idDea', idDea)
                        idDrc = firstResult.getValue({
                            name: "cseg_stc_segmentdea_filterby_cseg_stc_drc_segmen"
                        });
                        console.log('idDrc', idDrc)
                        
                    }
                    records.selectNewLine({ sublistId: 'line' });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: accountHeader
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: total
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: costCenterIdDepartment
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        value: projectCodeIdClass
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'cseg_stc_sof',
                        value: sofIdHead
                    });
                    if(idDrc){
                        records.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_stc_drc_segmen',
                            value: idDrc
                        });
                    }
                    if(idDea){
                        records.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_stc_segmentdea',
                            value: idDea
                        });
                    }
                    records.commitLine({ sublistId: 'line' });
                }
            }
        } else {
            alert('Please generate SOF list first');
        }
    }

    return {
        pageInit: pageInit,
        calculate: calculate,
        generate : generate,
        fieldChanged : fieldChanged
    };
});