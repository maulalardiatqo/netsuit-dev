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
        var journalType = records.getValue('custbody_stc_journal_type');
        if (cForm == 141) {
            var fieldName = context.fieldId;
            var sublistFieldName = context.sublistId;
            if(fieldName == 'custbody_abj_destination_account'){
                var periodId = records.getValue('postingperiod');
                var accountId = records.getValue('custbody_abj_destination_account');
                console.log('accountId', accountId)
                console.log('periodId', periodId)
                var totalAmt = 0
                var searchAmt = search.load({
                    id: 'customsearch_abj_premise_allocate_amou_4'
                });

                var filters = searchAmt.filters;
                filters.push(search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.IS,
                    values: periodId
                }));
                filters.push(search.createFilter({
                    name: 'custrecord_stc_account_cam_mapping',
                    join: 'account',
                    operator: search.Operator.ANYOF,
                    values: accountId
                }));
                searchAmt.filters = filters;

               var resultSet = searchAmt.run().getRange({ start: 0, end: 100 });

                for (var i = 0; i < resultSet.length; i++) {
                    var amount = resultSet[i].getValue({
                        name: 'amount',
                        summary: 'SUM'
                    }) || 0;

                    totalAmt += Number(amount);
                }
                console.log('totalAmt', totalAmt)
                records.setValue({
                    fieldId : 'custbody_abj_amount_to_allocate',
                    value : totalAmt
                })

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

                if (processMsg) {
                    processMsg.hide();
                }

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
            var allDataCredits = []
            var transactionSearchObj = search.create({
            type: "transaction",
            filters:
            [
                ["posting","is","T"], 
                "AND", 
                ["amount","greaterthan","0.00"], 
                "AND", 
                ["formulatext: {account.custrecord_stc_account_cam_mapping}","isnotempty",""], 
                "AND", 
                ["postingperiod","abs",periodId]
            ],
            columns:
            [
                search.createColumn({
                    name: "account",
                    summary: "GROUP",
                    label: "Account"
                }),
                search.createColumn({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "{account.custrecord_stc_account_cam_mapping}",
                    label: "Destination CAM Account"
                }),
                search.createColumn({
                    name: "department",
                    summary: "GROUP",
                    label: "Cost Center"
                }),
                search.createColumn({
                    name: "class",
                    summary: "GROUP",
                    label: "Project Code"
                }),
                search.createColumn({
                    name: "line.cseg_stc_drc_segmen",
                    summary: "GROUP",
                    label: "DRC Segment"
                }),
                search.createColumn({
                    name: "line.cseg_stc_segmentdea",
                    summary: "GROUP",
                    label: "DEA Segment"
                }),
                search.createColumn({
                    name: "postingperiod",
                    summary: "GROUP",
                    label: "Period"
                }),
                search.createColumn({
                    name: "amount",
                    summary: "SUM",
                    label: "Amount"
                })
            ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count",searchResultCount);
            transactionSearchObj.run().each(function(dataRes){
                var acc = dataRes.getValue({
                    name: "account",
                    summary: "GROUP",
                })
                var costCenter = dataRes.getValue({
                    name: "department",
                    summary: "GROUP",
                })
                var projectCode = dataRes.getValue({
                    name: "class",
                    summary: "GROUP",
                })
                var drc = dataRes.getValue({
                    name: "line.cseg_stc_drc_segmen",
                    summary: "GROUP",
                })
                var dea = dataRes.getValue({
                    name: "line.cseg_stc_segmentdea",
                    summary: "GROUP",
                })
                var amt = dataRes.getValue({
                    name: "amount",
                    summary: "SUM",
                });
                allDataCredits.push({
                    acc : acc,
                    costCenter : costCenter,
                    projectCode : projectCode,
                    drc : drc,
                    dea : dea,
                    amt : amt
                })
                return true;
            });


            var dataInclude = [];
            var searchInclude = search.load({
                id : 'customsearch_abj_premise_allocate_amou_4'
            });
            var filters = searchInclude.filters;
            // filters.push(search.createFilter({
            //     name: 'account',
            //     operator: search.Operator.IS,
            //     values: accountHead
            // }));
            filters.push(search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.IS,
                values: periodId
            }));
            filters.push(search.createFilter({
                name: 'custrecord_stc_account_cam_mapping',
                join: 'account',
                operator: search.Operator.ANYOF,
                values: accountHead
            }));
            searchInclude.filters = filters;

            var resultInclude = searchInclude.run().getRange({ start: 0, end: 1 });

            if (resultInclude && resultInclude.length > 0) {
                var firstResult = resultInclude[0];
                var costCenter = firstResult.getValue({
                    name: "department",
                    summary: "GROUP",
                });
                var account = firstResult.getValue({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "{account.custrecord_stc_account_cam_mapping}",
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
                    dea : dea,
                    account : account
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
                var amtSpend = result.getValue(columns[4]); 
                var costCenter = result.getValue(columns[2]); 
                var projectCode = result.getValue(columns[3]); 
                allSpendAmount.push({
                    sofId: sofId,
                    amtSpend: amtSpend,
                    costCenter : costCenter,
                    projectCode : projectCode

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
                var key = d.sofId + "_" + (d.costCenter || "") + "_" + (d.projectCode || "");

                if (!spendMap[key]) {
                    spendMap[key] = {
                        sofId: d.sofId,
                        costCenter: d.costCenter || "",
                        projectCode: d.projectCode || "",
                        amtSpend: 0
                    };
                }

                spendMap[key].amtSpend += Number(d.amtSpend || 0);
            });

            var remainingMap = {};
            allRemaining.forEach(function (d) {
                remainingMap[d.sofIdRemaining] = Number(d.amtRemaining || 0);
            });

            var includeData = dataInclude.length > 0 ? dataInclude[0] : {
                costCenter : "",
                project : "",
                drc : "",
                dea : "",
                account : ""
            };

            var finalData = [];

            Object.keys(spendMap).forEach(function (key) {

                var row = spendMap[key];
                var sof = row.sofId;

                var remaining = remainingMap[sof] || 0;

                if (row.amtSpend > 0) {
                    totalSpendAmt += row.amtSpend;

                    finalData.push({
                        sofId: sof,
                        amtSpend: row.amtSpend,
                        amtRemaining: remaining,
                        costCenter: row.costCenter,
                        project: row.projectCode,
                        drc: includeData.drc,
                        dea: includeData.dea
                    });
                }
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
            console.log('totalSpendAmt', totalSpendAmt)
            console.log('finalData', finalData)
            var dataSisa = []
            finalData.forEach(function(row, index) {
                var sofId = row.sofId;
                var spend = row.amtSpend;
                var remaining = row.amtRemaining;
                var costCenter = row.costCenter;
                var project = row.project;
                var drc = row.drc;
                var dea = row.dea;
                var bobotPerMonth = Number(spend) / Number(totalSpendAmt)
                bobotPerMonth = bobotPerMonth.toFixed(4)
                var prosent = Number(spend) / Number(totalSpendAmt) * 100
                
                var bassicAllocation = (Number(bobotPerMonth) * Number(cekAmountAllocate));
                var amtDebit = 0;
                if(Number(remaining) > Number(bassicAllocation)){
                    amtDebit = bassicAllocation
                }else{
                    amtDebit = remaining
                }
                var cekSisa = Number(amtDebit) - Number(remaining);
                if(cekSisa && cekSisa > 0){
                    dataSisa.push({
                        cekSisa : cekSisa,
                        costCenter : costCenter,
                        project : project
                    })
                }
                console.log('bobotPerMonth, debit', {bobotPerMonth : bobotPerMonth, amtDebit : amtDebit})
                records.selectNewLine({ sublistId: 'line' });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: accountHead
                });
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: amtDebit.toFixed(2)
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
                var prosent = prosent; 
                prosent = Number(prosent).toFixed(2); 
                records.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_tar_percentage',
                    value: prosent
                });
                // if(drc){
                //     records.setCurrentSublistValue({
                //         sublistId: 'line',
                //         fieldId: 'cseg_stc_drc_segmen',
                //         value: drc
                //     });
                // }
                // if(dea){
                //     records.setCurrentSublistValue({
                //         sublistId: 'line',
                //         fieldId: 'cseg_stc_segmentdea',
                //         value: dea
                //     });
                // }
                records.commitLine({ sublistId: 'line' });
                
            });
            if(allDataCredits.length > 0){
                allDataCredits.forEach((credits)=>{
                    var acc = credits.acc
                    var costCenter = credits.costCenter
                    var projectCode = credits.projectCode
                    var drc = credits.drc
                    var dea = credits.dea
                    var amt = credits.amt

                    records.selectNewLine({ sublistId: 'line' });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: acc
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: amt
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: costCenter
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        value: projectCode
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'cseg_stc_sof',
                        value: '57'
                    });
                    // if(drc){
                    //     records.setCurrentSublistValue({
                    //         sublistId: 'line',
                    //         fieldId: 'cseg_stc_drc_segmen',
                    //         value: drc
                    //     });
                    // }
                    // if(dea){
                    //     records.setCurrentSublistValue({
                    //         sublistId: 'line',
                    //         fieldId: 'cseg_stc_segmentdea',
                    //         value: dea
                    //     });
                    // }
                    records.commitLine({ sublistId: 'line' });
                })
            }
            if(dataSisa.length > 0){
                dataSisa.forEach((sisa)=>{
                    var amtDebit = sisa.cekSisa;
                    var costCenter = sisa.costCenter
                    var projectCode = sisa.projectCode
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
                        value: projectCode
                    });
                    records.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'cseg_stc_sof',
                        value: '80'
                    });
                    // if(drc){
                    //     records.setCurrentSublistValue({
                    //         sublistId: 'line',
                    //         fieldId: 'cseg_stc_drc_segmen',
                    //         value: drc
                    //     });
                    // }
                    // if(dea){
                    //     records.setCurrentSublistValue({
                    //         sublistId: 'line',
                    //         fieldId: 'cseg_stc_segmentdea',
                    //         value: dea
                    //     });
                    // }
                    records.commitLine({ sublistId: 'line' });
                })
            }

        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
        generate : generate,
        onClickGenerate : onClickGenerate
    };
});