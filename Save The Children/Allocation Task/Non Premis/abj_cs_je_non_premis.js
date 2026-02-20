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
                    id: 'customsearch_abj_premise_allocate_amou_3'
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
            var periodIdText = records.getText('postingperiod');
            var accountHeadText = records.getText('custbody_abj_destination_account');
            var allDataCredits = []
            var transactionSearchObj = search.create({
            type: "transaction",
            filters:
            [
                ["posting","is","T"], 
                "AND", 
                ["amount","greaterthan","0.00"], 
                "AND", 
                ["postingperiod","abs",periodId],
                "AND",
                ["account.custrecord_stc_account_cam_mapping","noneof","@NONE@"], 
                "AND", 
                ["account.custrecord_stc_account_cam_mapping","anyof",accountHead]
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
                }), 
                search.createColumn({
                    name: "line.cseg_stc_sof",
                    summary: "GROUP",
                    label: "Source of Funding"
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
                var sof = dataRes.getValue({
                    name: "line.cseg_stc_sof",
                    summary: "GROUP",
                })
                var sofText = dataRes.getText({
                    name: "line.cseg_stc_sof",
                    summary: "GROUP",
                })
                allDataCredits.push({
                    acc : acc,
                    costCenter : costCenter,
                    projectCode : projectCode,
                    drc : drc,
                    dea : dea,
                    amt : amt,
                    sof : sof,
                    sofText : sofText
                })
                return true;
            });


            var dataInclude = [];
            var searchInclude = search.load({
                id : 'customsearch_abj_premise_allocate_amou_3'
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
                var sof = firstResult.getValue({
                    name: "line.cseg_stc_sof",
                    summary: "GROUP",
                    label: "Source of Funding"
                });
                var sofText = firstResult.getText({
                    name: "line.cseg_stc_sof",
                    summary: "GROUP",
                    label: "Source of Funding"
                });
                dataInclude.push({
                    costCenter : costCenter,
                    project : project,
                    drc : drc,
                    dea : dea,
                    account : account,
                    sof : sof,
                    sofText : sofText
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
                var sofText = result.getText(columns[0]); 
                var amtSpend = result.getValue(columns[6]); 
                var costCenter = result.getValue(columns[2]); 
                var projectCode = result.getValue(columns[3]); 
                allSpendAmount.push({
                    sofId: sofId,
                    sofText : sofText,
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
                // console.log('colRemaining', colRemaining)
                var sofIdRemaining = result.getValue(colRemaining[0]);
                var sofIdRemainingText = result.getText(colRemaining[0]);
                var budget = result.getValue(colRemaining[1]); 
                var actual = result.getValue(colRemaining[2]); 
                var amtRemaining = Number(budget) - Number(actual);
                // if(Number(amtRemaining) <= 0){
                //     amtRemaining = 0
                // } 

                allRemaining.push({
                    sofIdRemaining: sofIdRemaining,
                    sofIdRemainingText : sofIdRemainingText,
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
                        sofText: d.sofText,
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
                account : "",
                sof : "",
            };

            var finalData = [];
            console.log('remainingMap', remainingMap)
            Object.keys(spendMap).forEach(function (key) {
                console.log('key', key)
                var row = spendMap[key];
                var sofIdRow = row.sofId
                var sofText = row.sofText
                console.log('sofIdRow', sofIdRow)
                var remaining = remainingMap[sofIdRow] || 0;

                if (row.amtSpend > 0) {
                    totalSpendAmt += row.amtSpend;

                    finalData.push({
                        amtSpend: row.amtSpend,
                        amtRemaining: remaining,
                        costCenter: row.costCenter,
                        project: row.projectCode,
                        drc: includeData.drc,
                        dea: includeData.dea,
                        sof : sofIdRow,
                        sofText : sofText,
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
           // Helper pembulatan wajib
            function round2(num) {
                return Number(Number(num).toFixed(2));
            }

            var dataSisa = [];
            var memoToSet = 'Allocation Non Premise ' + accountHeadText + ' ' + periodIdText
            finalData.forEach(function (row) {
                console.log('row', row)
                var sofId = row.sof;
                var sofText = row.sofText
                var spend = Number(row.amtSpend);
                var remaining = Number(row.amtRemaining);
                var costCenter = row.costCenter;
                var project = row.project;
                var drc = row.drc;
                var dea = row.dea;
                

                // ==========================
                // Perhitungan bobot + allocation (dibulatkan!)
                // ==========================
                var bobotPerMonth = spend / Number(totalSpendAmt);
                var prosent = Number(bobotPerMonth) * 100 
                var allocation = round2(bobotPerMonth * Number(cekAmountAllocate));

                var amtDebit = 0;
                var sisa = 0;

                if (remaining <= 0) {
                    sisa = round2(allocation);
                } else if (remaining >= allocation) {
                    amtDebit = round2(allocation);
                } else {
                    amtDebit = round2(remaining);
                    sisa = round2(allocation - remaining);
                }

                if (sisa > 0) {
                    dataSisa.push({
                        cekSisa: sisa,
                        costCenter: costCenter,
                        project: project,
                        prosent : prosent,
                        bobotPerMonth : bobotPerMonth,
                        remaining : remaining,
                        sofId : sofId,
                        sofText : sofText
                    });
                }

                console.log("bobotPerMonth, debit", {
                    bobotPerMonth: bobotPerMonth,
                    amtDebit: amtDebit
                });

                if (amtDebit > 0) {
                    records.selectNewLine({ sublistId: "line" });

                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "account",
                        value: accountHead
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "debit",
                        value: amtDebit
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "department",
                        value: costCenter
                    });
                     
                    var sofForMemo = ''
                    if(sofId){
                        console.log('sofId', sofId)
                        var sofSearch = search.lookupFields({
                            type: "customrecord_cseg_stc_sof",
                            id: sofId,
                            columns: ["custrecord_stc_subtitute_sof"],
                        });
                        var cekBf = sofSearch.custrecord_stc_subtitute_sof
                        if(cekBf.length >0){
                            var sofSubtitue = cekBf[0].value;
                            var sofSubtitueText = cekBf[0].text;
                            sofForMemo = sofSubtitueText
                            console.log("sofSubtitue", sofSubtitue);
                            if(sofSubtitue){
                                sofId = sofSubtitue 
                            }
                        }else{
                            sofForMemo = sofText
                        }
                    }
                    var sofMemo = 'Subtitute from SOF'+ sofForMemo
                    var newMemo = memoToSet + ' ' + sofMemo
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "memo",
                        value: newMemo
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "class",
                        value: project
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "cseg_stc_sof",
                        value: sofId
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "custcol_abj_remaining_budget_sof",
                        value: remaining
                    });

                    var prosentFix = Number(prosent).toFixed(2);
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "custcol_tar_percentage",
                        value: prosentFix
                    });

                    records.commitLine({ sublistId: "line" });
                }
            });

            if (allDataCredits.length > 0) {
                allDataCredits.forEach(function (credits) {
                    records.selectNewLine({ sublistId: "line" });

                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "account",
                        value: credits.acc
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "credit",
                        value: round2(credits.amt)
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "department",
                        value: credits.costCenter
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "class",
                        value: credits.projectCode
                    });
                     records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "memo",
                        value: memoToSet
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "cseg_stc_sof",
                        value: "57"
                    });

                    records.commitLine({ sublistId: "line" });
                });
            }


            if (dataSisa.length > 0) {
                dataSisa.forEach(function (sisa) {
                    records.selectNewLine({ sublistId: "line" });

                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "account",
                        value: accountHead
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "debit",
                        value: round2(sisa.cekSisa)
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "department",
                        value: sisa.costCenter
                    });
                    var sofSisa = sisa.sofId
                    var sofText = sisa.sofText
                    if(sofSisa){
                        console.log('sofSisa', sofSisa)
                        var sofSearch = search.lookupFields({
                            type: "customrecord_cseg_stc_sof",
                            id: sofSisa,
                            columns: ["custrecord_stc_subtitute_sof"],
                        });
                        var cekSOf = sofSearch.custrecord_stc_subtitute_sof

                        if(cekSOf.length > 0){
                            var sofSubtitue = cekSOf[0].value;
                            sofText = cekSOf[0].text;
                            console.log("sofSubtitue", sofSubtitue);
                            if(sofSubtitue){
                                sofSisa = sofSubtitue 
                            }
                        }
                        
                    }
                    var memoSOF =  ''
                    if(sofText){
                        memoToSet = 'Subtitute from SOF' + ' ' + sofText
                    }
                
                    memoToSet = memoToSet + ' ' + memoSOF
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "memo",
                        value: memoToSet
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "class",
                        value: sisa.project
                    });
                   
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "cseg_stc_sof",
                        value: sofSisa
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "custcol_abj_remaining_budget_sof",
                        value: sisa.remaining
                    });

                    var prosentFix = Number(sisa.prosent).toFixed(2);
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "custcol_tar_percentage",
                        value: prosentFix
                    });
                    records.commitLine({ sublistId: "line" });
                });
            }

            var totalDebit = 0;
            var totalCredit = 0;
            var lineCount = records.getLineCount({ sublistId: "line" });

            for (var i = 0; i < lineCount; i++) {
                var d = Number(records.getSublistValue({
                    sublistId: "line",
                    fieldId: "debit",
                    line: i
                })) || 0;

                var c = Number(records.getSublistValue({
                    sublistId: "line",
                    fieldId: "credit",
                    line: i
                })) || 0;

                totalDebit += d;
                totalCredit += c;
            }

            totalDebit = round2(totalDebit);
            totalCredit = round2(totalCredit);

            var selisih = round2(totalCredit - totalDebit);

            if (selisih !== 0) {
                var lastDebitLine = -1;

                for (var i = lineCount - 1; i >= 0; i--) {
                    var dVal = Number(records.getSublistValue({
                        sublistId: "line",
                        fieldId: "debit",
                        line: i
                    })) || 0;

                    if (dVal > 0) {
                        lastDebitLine = i;
                        break;
                    }
                }

                if (lastDebitLine >= 0) {
                    var oldDebit = Number(records.getSublistValue({
                        sublistId: "line",
                        fieldId: "debit",
                        line: lastDebitLine
                    })) || 0;

                    records.selectLine({ sublistId: "line", line: lastDebitLine });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "debit",
                        value: round2(oldDebit + selisih)
                    });
                    records.setCurrentSublistValue({
                        sublistId: "line",
                        fieldId: "memo",
                        value: memoToSet
                    });
                    records.commitLine({ sublistId: "line" });
                }
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