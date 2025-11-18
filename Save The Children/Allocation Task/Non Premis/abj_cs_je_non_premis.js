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
                    id: 'customsearch_abj_premise_allocate_amou_4'
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
    var processMsg;  

    function onClickGenerate() {
        var rec = currentRecord.get();

        var btn = document.getElementById('custpage_btn_generate_sof');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = "0.6";
            btn.style.cursor = "not-allowed";
        }

        processMsg = message.create({
            title: "Processing",
            message: "On Process. Please wait...",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        setTimeout(function () {
            try {
                generate({ currentRecord: rec });

                // Setelah selesai → hide message
                if (processMsg) {
                    processMsg.hide();
                }

                // Optional: enable tombol kembali
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                }

            } catch (e) {
                if (processMsg) {
                    processMsg.hide();
                }
                alert("Error: " + e.message);
                console.log(e);
            }
        }, 500);
    }
    function generate(context){
        var cekAmountAllocate = records.getValue('custbody_abj_amount_to_allocate');
        var accountHead = records.getValue('custbody_abj_destination_account');
        console.log('cekAmountAllocate', cekAmountAllocate)
        if(cekAmountAllocate && accountHead){
            var allSofId = [];

            var searchSof = search.load({
                id: 'customsearch_sof_list_non_premis'
            });

            searchSof.run().each(function(result){
                var id = result.getValue({ name: 'internalid' });
                if (id) {
                    allSofId.push(id);
                }
                return true;
            });

            console.log('allSofId', allSofId);
            
        }else{
            alert('Account & Amount To Alocate Cannot Be Empty');
            return false
        }
        if(allSofId.length > 0){
            
            var periodId = records.getValue('postingperiod');
            var dataInclude = [];
            var searchInclude = search.load({
                id : 'customsearch_abj_premise_allocate_amou_4'
            });
            var filters = searchInclude.filters;
            filters.push(search.createFilter({
                name: 'account',
                operator: search.Operator.IS,
                values: accountHead
            }));
            filters.push(search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.IS,
                values: periodId
            }));
            searchInclude.filters = filters;

            var resultInclude = searchInclude.run().getRange({ start: 0, end: 1 });

            if (resultInclude && resultInclude.length > 0) {
                var firstResult = resultInclude[0];
                var costCenter = firstResult.getValue({
                    name: "department",
                    summary: "GROUP",
                });
                var project = firstResult.getValue({
                    name: "class",
                    summary: "GROUP",
                });
                var drc = firstResult.getValue({
                    name: "line.cseg_stc_drc_segmen",
                    summary: "GROUP",
                });
                var dea = firstResult.getValue({
                    name: "line.cseg_stc_segmentdea",
                    summary: "GROUP",
                });
                dataInclude.push({
                    costCenter : costCenter,
                    project : project,
                    drc : drc,
                    dea : dea
                })
                
            }
            console.log('dataInclude', dataInclude)
            var allSpendAmount = [];
            var totalSpendAmt = 0
            // spending amount
            var searchSpendAmount = search.load({
                id: 'customsearch331'
            });

            searchSpendAmount.filters.push(
                search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: periodId
                })
            );

            var results = searchSpendAmount.run().getRange({
                start: 0,
                end: 100
            });

            var columns = searchSpendAmount.columns;  
            console.log("Cek Columns", columns);
            results.forEach(function(result) {

                var sofId = result.getValue(columns[0]); 
                var amtSpend = result.getValue(columns[2]); 
                totalSpendAmt = Number(totalSpendAmt) + Number(amtSpend)
                allSpendAmount.push({
                    sofId: sofId,
                    amtSpend: amtSpend
                });
            });

            console.log("allSpendAmount", allSpendAmount);

            var allRemaining = []
            var searchRemaining = search.load({
                id : 'customsearch326'
            });

            var resultRemaining = searchRemaining.run().getRange({
                start: 0,
                end: 100
            });

            var colRemaining = searchRemaining.columns;  
            resultRemaining.forEach(function(result) {

                var sofIdRemaining = result.getValue(colRemaining[0]); 
                var amtRemaining = result.getValue(colRemaining[2]); 

                allRemaining.push({
                    sofIdRemaining: sofIdRemaining,
                    amtRemaining: amtRemaining
                });
            });
            console.log('allRemaining', allRemaining)

            var spendMap = {};
            allSpendAmount.forEach(function (d) {
                spendMap[d.sofId] = Number(d.amtSpend || 0);
            });

            var remainingMap = {};
            allRemaining.forEach(function (d) {
                remainingMap[d.sofIdRemaining] = Number(d.amtRemaining || 0);
            });

            var includeData = dataInclude.length > 0 ? dataInclude[0] : {
                costCenter : "",
                project : "",
                drc : "",
                dea : ""
            };

            var finalData = [];

            allSofId.forEach(function (sof) {

                var spend = spendMap[sof] || 0;
                var remaining = remainingMap[sof] || 0;

                finalData.push({
                    sofId: sof,
                    amtSpend: spend,
                    amtRemaining: remaining,

                    // inject include data
                    costCenter: includeData.costCenter,
                    project: includeData.project,
                    drc: includeData.drc,
                    dea: includeData.dea
                });
            });
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
            console.log("FINAL MERGED DATA", finalData);
            finalData.forEach(function(row, index) {
                var sofId = row.sofId;
                var spend = row.amtSpend;
                var remaining = row.amtRemaining;
                var costCenter = row.costCenter;
                var project = row.project;
                var drc = row.drc;
                var dea = row.dea;
                var bobotPerMonth = Number(spend) / Number(totalSpendAmt)
                var prosent = Number(spend) / Number(totalSpendAmt) * 100
                
                var bassicAllocation = Number(spend) * Number(bobotPerMonth);
                var amtDebit = 0;
                if(Number(remaining) > Number(bassicAllocation)){
                    amtDebit = bassicAllocation
                }
                records.selectNewLine({ sublistId: 'line' });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: accountHead
                });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: amtDebit
                });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: costCenter
                });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: project
                });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_stc_sof',
                    value: sofId
                });
                
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_abj_remaining_budget_sof',
                    value: remaining
                });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_tar_percentage',
                    value: prosent
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

        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
        generate : generate,
        onClickGenerate : onClickGenerate
    };
});