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
        if (cForm == 149) {
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
        var period = records.getValue('postingperiod');
        var periodText = records.getText('postingperiod');
        var amountHeader = records.getValue('custbody_abj_amount_to_allocate');
        var accountHeader = records.getValue('custbody_stc_source_account_allocation');
        var accountHeaderText = records.getText('custbody_stc_source_account_allocation');
        if(accountHeader && period && (Number(amountHeader) > 0)){
            const periodFields = search.lookupFields({
                type: record.Type.ACCOUNTING_PERIOD,
                id: period,
                columns: ['startdate', 'enddate']
            });

            const startDate = periodFields.startdate;
            const endDate = periodFields.enddate;
            var allSofId = [];

            var searchSof = search.load({
                id: 'customsearch_sof_resource_timesheet'
            });

            searchSof.run().each(function(result){
                var id = result.getValue({ name: 'internalid' });
                if (id) {
                    allSofId.push(id);
                }
                return true;
            });
            if (allSofId.length > 0) {
                var dataToProcess = [];
                var allDataMaster = [];
                var totalNumberHour = 0; // Inisialisasi total jam

                var search580 = search.load({ id: 'customsearch580' });
                var existingFilters = search580.filters;
    
                existingFilters.push(search.createFilter({
                    name: 'startdate',
                    operator: search.Operator.ONORAFTER,
                    values: [startDate]
                }));

                existingFilters.push(search.createFilter({
                    name: 'enddate',
                    operator: search.Operator.ONORBEFORE,
                    values: [endDate]
                }));

                search580.filters = existingFilters;

                var resultSet = search580.run();
                var columns = search580.columns;

                resultSet.each(function(res) {
                    var numberHour = parseFloat(res.getValue(columns[0])) || 0; 
                    var costCenter = res.getValue(columns[1]); 
                    var projectCode = res.getValue(columns[2]);
                    var sof = res.getValue(columns[3]); 

                    var rowData = {
                        numberHour: numberHour,
                        costCenter: costCenter,
                        projectCode: projectCode,
                        sof: sof
                    };

                    allDataMaster.push(rowData);
                    totalNumberHour += numberHour; 

                    return true;
                });
                if (totalNumberHour > 0) {
                    allDataMaster.forEach(function(row) {
                        if (allSofId.indexOf(row.sof) !== -1) {
                            var prosentHour = row.numberHour / totalNumberHour;
                            var amountDebit = prosentHour * Number(amountHeader);
                            var memo = "Allocation Premis" + ' ' + accountHeaderText + ' ' + periodText

                            row.prosentHour = prosentHour;
                            row.amountDebit = amountDebit;
                            row.memo = memo

                            dataToProcess.push(row);
                        }
                    });
                }

                console.log('Total Jam Keseluruhan:', totalNumberHour);
                console.log('Data Final untuk Proses:', dataToProcess);
                if(dataToProcess.length > 0){
                    prosesJournal(dataToProcess, amountHeader, accountHeader)
                }

            } else {
                alert('no sof to generate');
            }
        }else{
            alert('no data to generate')
        }
    }
function prosesJournal(dataToProcess, amountHeader, accountHeader) {
    var lineCount = records.getLineCount({ sublistId: "line" });
    for (var i = lineCount - 1; i >= 0; i--) {
        records.removeLine({ sublistId: "line", line: i, ignoreRecalc: true });
    }

    dataToProcess.forEach((data, index) => {
        try {
            // Pastikan amountDebit ada dan lebih dari 0
            var debitValue = Number(data.amountDebit) || 0;
            if (debitValue <= 0) return; // Skip jika tidak ada nilai yang di-debit

            records.selectNewLine({ sublistId: "line" });

            records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: accountHeader
            });

            records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "debit",
                // PERBAIKAN: Pastikan ini tipe NUMBER, bukan STRING
                value: Number(debitValue.toFixed(2)) 
            });

            

            records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "department",
                value: data.costCenter
            });

            var finalSofId = data.sof;
            if (finalSofId) {
                try {
                    var sofSearch = search.lookupFields({
                        type: "customrecord_cseg_stc_sof",
                        id: finalSofId,
                        columns: ["custrecord_stc_subtitute_sof"],
                    });

                    if (sofSearch && sofSearch.custrecord_stc_subtitute_sof) {
                        var substitutionArray = sofSearch.custrecord_stc_subtitute_sof;
                        if (substitutionArray.length > 0) {
                            var sofSubstitute = substitutionArray[0].value;
                            if (sofSubstitute) finalSofId = sofSubstitute;
                        }
                    }
                } catch (e) {
                    console.error("SOF Lookup failed for ID: " + finalSofId, e.message);
                }
            }

            records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "class",
                value: data.projectCode
            });
            records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "memo",
                value: data.memo 
            });
      records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "cseg_stc_sof",
                value: finalSofId
            });
            records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "cseg1",
                value: '1'
            });

            var percentageRounded = Math.round((Number(data.prosentHour) || 0) * 100); 
            records.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "custcol_tar_percentage",
                value: percentageRounded 
            });

            records.commitLine({ sublistId: "line" });
            console.log("Line committed successfully: " + index);

        } catch (e) {
            console.error("Critical Error at line index " + index, e.message);
        }
    });
}
    return{
        pageInit : pageInit,
        fieldChanged : fieldChanged,
        onClickGenerate : onClickGenerate
    }
})