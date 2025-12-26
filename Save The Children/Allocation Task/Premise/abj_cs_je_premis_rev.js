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
        if (cForm == 140) {
            var fieldName = context.fieldId;
            var sublistFieldName = context.sublistId;
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
            if(sublistFieldName == 'line' && fieldName == 'custcol_tar_percentage'){
                var percentage = records.getCurrentSublistValue({
                    sublistId : 'line',
                    fieldId : 'custcol_tar_percentage'
                });
                console.log('percentage', percentage);
                if(percentage){
                    var cekMemo = records.getCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'memo'
                    });
                    var memoNew = cekMemo + ' ' + percentage + '%'
                    records.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'memo',
                        value : memoNew
                    })
                    var newAmount = Number(amountAllocated) * (Number(percentage) / 100);
                    records.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'debit',
                        value : newAmount
                    })
                }
                // console.log('changed', fieldName)
            }
            
        }
    }

    function generate(context) {
        console.log('called generate');

        var sofIdHead = records.getValue('cseg_stc_sof');
        var accountHeader = records.getValue('custbody_stc_source_account_allocation');
        var amountAllocated = records.getValue('custbody_abj_amount_to_allocate');
        var costCenterIdDepartment = 17;
        var projectCodeIdClass = 12;
        var periodText = records.getText('postingperiod');

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

            var lineCount = records.getLineCount({
                sublistId: 'line'
            });
            console.log('lineCount existing:', lineCount);

            if (lineCount > 0) {
                for (var i = lineCount - 1; i >= 0; i--) {
                    records.removeLine({
                        sublistId: 'line',
                        line: i
                    });
                }
                console.log('All existing lines removed.');
            }
            var totalAmountTemp = 0
            var memoSet = 'Allocation Premise Office Rental ' + periodText;
            sofResult.forEach(function (item) {
                var sofId = item.sofId;
                var amountTempt = 0
                totalAmountTemp = Number(totalAmountTemp) + Number(amountTempt)
                var dea
                var drc
                if (item.deaPromise?.length) {
                    var dea = item.deaPromise[0].deaId;
                    console.log('dea', dea)
                    var drc = item.deaPromise[0].drcSegmen;
                }
                
                    records.selectNewLine({ sublistId: 'line' });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: accountHeader
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: amountTempt
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
                    
                    if(dea){
                        console.log('dea', dea)
                        records.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_stc_segmentdea',
                            value: dea,
                            enableSourcing : false,
                            ignoreFieldChange : true
                        });
                    }
                    if(drc){
                        records.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_stc_drc_segmen',
                            value: drc
                        });
                    }
                    records.commitLine({ sublistId: 'line' });
                
            });
            var idDea = ''
            var idDrc = ''
            var deaSearch = search.load({
                id : 'customsearch_mapping_dea_je_premise'
            });
            var filters = deaSearch.filters;
            filters.push(search.createFilter({
                name: 'custrecord_stc_account_allocation',
                operator: search.Operator.IS,
                values: accountHeader
            }));
            filters.push(search.createFilter({
                name: 'custrecord_stc_account_allocation',
                operator: search.Operator.IS,
                values: sofIdHead
            }));
            deaSearch.filters = filters;

            var result = deaSearch.run().getRange({ start: 0, end: 1 });

            if (result && result.length > 0) {
                var firstResult = result[0];
                idDea = firstResult.getValue({
                    name: "custrecord_dea_allocation"
                });
                console.log('idDea', idDea)
                
                
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
                value: totalAmountTemp
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
                value: sofIdHead,
            });
            records.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'cseg_stc_drc_segmen',
                value: 3,
                enableSourcing : false,
                ignoreFieldChange : true
            });

            records.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'cseg_stc_segmentdea',
                value: idDea,
                 enableSourcing : false,
                ignoreFieldChange : true
            });
            
            records.commitLine({ sublistId: 'line' });
        }
    }



    function calculate(context) {
        try {
            console.log('called calculate');

            var rec = records
            var lineCount = rec.getLineCount({ sublistId: 'line' });
            console.log('lineCount:', lineCount);

            if (lineCount === 0) return;

            var totalDebit = 0;
            var creditLineIndex = -1;

            for (var i = 0; i < lineCount; i++) {
                var debit = parseFloat(rec.getSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    line: i
                })) || 0;

                var credit = rec.getSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    line: i
                });

                if (credit && credit !== 0) {
                    creditLineIndex = i;
                }

                if (i < lineCount - 1) {
                    totalDebit += debit;
                }
            }

            console.log('totalDebit:', totalDebit);

            if (creditLineIndex === -1) {
                creditLineIndex = lineCount - 1;
            }

            rec.selectLine({
                sublistId: 'line',
                line: creditLineIndex
            });
            rec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                value: totalDebit
            });
            rec.commitLine({ sublistId: 'line' });

            console.log('credit set on line:', creditLineIndex);
        } catch (e) {
            console.log('Error in calculate:', e);
        }
    }

    function saveRecord(context) {
        var rec = context.currentRecord;

        var lineCount = rec.getLineCount({
            sublistId: 'line'
        });

        if (lineCount <= 0) {
            return true;
        }

        var totalDebit = 0;
        var creditLineIndex = null;

        for (var i = 0; i < lineCount; i++) {

            var debit = parseFloat(rec.getSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
                line: i
            })) || 0;

            var credit = rec.getSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                line: i
            });

            if (debit !== 0) {
                totalDebit += debit;
            }

            if (credit !== null && credit !== '') {
                creditLineIndex = i;
            }
        }
        if (creditLineIndex !== null) {
            console.log('creditLineIndex', creditLineIndex)
            console.log('totalDebit', totalDebit)
            rec.selectLine({
                sublistId: 'line',
                line: creditLineIndex
            });

            rec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                value: totalDebit,
                ignoreFieldChange: true
            });

            rec.commitLine({
                sublistId: 'line'
            });
        }

        return true;
    }
    return {
        pageInit: pageInit,
        calculate: calculate,
        generate : generate,
        fieldChanged : fieldChanged,
        saveRecord : saveRecord
    };
});