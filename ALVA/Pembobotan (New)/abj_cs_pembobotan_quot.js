/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], 
function (runtime, log, url, currentRecord, currency, record, search, message) {

    var records = currentRecord.get();
    let isDeleting = false;
    let currentItemLineId = null;
    

    function pageInit(context) {
        console.log('Page Init masuk');
        
        var newRowButton = document.getElementById('uir-new-row-content');
        if (newRowButton) {
            newRowButton.style.display = 'none';
            console.log('Tombol New Line disembunyikan');
        }
        var recordType = records.type;
        console.log('recordType', recordType)
        if (recordType === 'salesorder') {
            var mode = context.mode;
            console.log('mode', mode)
            if(mode == 'copy' || mode == 'create'){
                var customForm = records.getValue('customform');
                var createdFrom = records.getValue('createdfrom');
                if(customForm == 157){
                    if(createdFrom){
                        loadPembobotanFromQuote(createdFrom, records)
                    }
                }
            }
            var lineCount = records.getLineCount({
                sublistId: 'recmachcustrecord_transaction_id'
            });
            console.log('lineCount', lineCount);
            if(lineCount > 0){
                for (var i = 0; i < lineCount; i++) {
                    var prosentField = records.getSublistField({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_asf_prosent',
                        line: i
                    });

                    var pembobotanValue = records.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_asf_pembobotan',
                        line: i
                    });

                    console.log('masuk disable');

                    // Set isDisabled berdasarkan nilai pembobotanValue
                    prosentField.isDisabled = pembobotanValue !== true;
                }
            }
        }else if(recordType === 'estimate') {
             var lineCount = records.getLineCount({
                sublistId: 'recmachcustrecord_transaction_id'
            });
            console.log('lineCount', lineCount);
            if(lineCount > 0){
                for (var i = 0; i < lineCount; i++) {
                    var prosentField = records.getSublistField({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_asf_prosent',
                        line: i
                    });

                    var pembobotanValue = records.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_asf_pembobotan',
                        line: i
                    });
                    if(pembobotanValue){
                        console.log('pembobotanValue for disable', pembobotanValue);
                        prosentField.isDisabled = true;
                    }else{
                        console.log('pembobotanValue for disable', pembobotanValue);
                        prosentField.isDisabled = false;
                    }
                }
            }
        }
    }
    function loadPembobotanFromQuote(estimateId, rec) {
        try {
            var estimateRecord = record.load({
                type: 'estimate',
                id: estimateId,
                isDynamic: false
            });

            var lineCount = estimateRecord.getLineCount({
                sublistId: 'recmachcustrecord_transaction_id'
            });
            if(lineCount > 0){
                for (var i = 0; i < lineCount; i++) {
                    var lineValues = {
                        custrecord_id_line: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_id_line', line: i }),
                        custrecord_position: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_position', line: i }),
                        custrecord_desc_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_desc_pembobotan', line: i }),
                        custrecord_rate_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_rate_pembobotan', line: i }),
                        custrecord_hour_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_hour_pembobotan', line: i }),
                        custrecord_amount_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_amount_pembobotan', line: i }),
                        custrecord_category_sow: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_category_sow', line: i }),
                        custrecord_department_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_department_pembobotan', line: i }),
                        custrecord_asf_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_asf_pembobotan', line: i }),
                        custrecord_asf_prosent: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_asf_prosent', line: i }),
                        custrecord_item_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_item_pembobotan', line: i })
                    };

                    // Tambahkan line baru di sublist record yang sedang diedit
                    rec.selectNewLine({ sublistId: 'recmachcustrecord_transaction_id' });

                    for (var fieldId in lineValues) {
                        if (lineValues[fieldId]) {
                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: fieldId,
                                value: lineValues[fieldId]
                            });
                        }
                    }

                    rec.commitLine({ sublistId: 'recmachcustrecord_transaction_id' });
                }
            }
            

        } catch (e) {
            console.log('ERROR loadPembobotanFromQuote', e);
        }
    }
    function sublistChanged(context) {
        var sublistId = context.sublistId;
        if (sublistId === 'item') {
            if (isDeleting) {
                console.log('Skipping sublistChanged because delete is in progress');
                isDeleting = false; 
                return;
            }
            var quotationTier = records.getValue({
                fieldId: 'custbody_abj_quotation_tier'
            });

            console.log('Quotation Tier:', quotationTier);
            if (quotationTier) {
                console.log('quotationTier', quotationTier)
                var itemValue = records.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });
                var lineItem = records.getCurrentSublistIndex({
                    sublistId: 'item',
                    fieldId: 'line'
                });

                
                var combinedValue = itemValue + '_' + lineItem;
                if (itemValue) {
                    console.log('masuk kondisi is item value')
                    records.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_item_id_pembobotan',
                        value: combinedValue
                    });
                    console.log('Set custcol_item_id_pembobotan:', combinedValue);
                }
                console.log('Line:', lineItem);
                console.log('Item Value:', itemValue);

                if(itemValue){
                    var customrecord_abj_ratecardSearchObj = search.create({
                    type: "customrecord_abj_ratecard",
                    filters:
                    [
                        ["custrecord_abj_rate_card_item_name","anyof",itemValue], 
                        "AND", 
                        ["custrecord_abj_rate_hour_type","anyof",quotationTier]
                    ],
                    columns:
                    [
                        search.createColumn({name: "scriptid", label: "Script ID"}),
                        search.createColumn({name: "custrecord_abj_rate_card_item_name", label: "Item Name"}),
                        search.createColumn({name: "custrecord_abj_rate_hour_type", label: "Rate/Hour Type"}),
                        search.createColumn({name: "custrecord_abj_ratecard_complexity_level", label: "Complexity Level"}),
                        search.createColumn({
                            name: "custrecord_abj_ratecard_hours_position",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Position"
                        }),
                        search.createColumn({
                            name: "custrecord_alva_accountratecard",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Account Rate Card"
                        }),
                        search.createColumn({
                            name: "custrecord_catsow_ratecard",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Category SOW"
                        }),
                        search.createColumn({
                            name: "custrecord_ratecard_dept",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Department"
                        }),
                        search.createColumn({
                            name: "custrecord_desc_hourratecard",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Description"
                        }),
                        search.createColumn({
                            name: "custrecord_abj_ratecard_hours",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Hours"
                        }),
                        search.createColumn({
                            name: "custrecord_abj_ratecard_hours_rate",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Rate"
                        }),
                        search.createColumn({
                            name: "custrecord4",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "ASF"
                        }),
                        search.createColumn({
                            name: "custrecord_abj_ratecard_hours_total",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "Total"
                        })
                    ]
                    });
                    var allDataToset = [];
                    var searchResultCount = customrecord_abj_ratecardSearchObj.runPaged().count;
                    log.debug("customrecord_abj_ratecardSearchObj result count",searchResultCount);
                    customrecord_abj_ratecardSearchObj.run().each(function(result){
                        var position = result.getValue({
                            name: "custrecord_abj_ratecard_hours_position",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                        var amountPembobotan = result.getValue({
                             name: "custrecord_abj_ratecard_hours_total",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                        var CategorySOW = result.getValue({
                            name: "custrecord_catsow_ratecard",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                        var department = result.getValue({
                            name: "custrecord_ratecard_dept",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                         var description = result.getValue({
                            name: "custrecord_desc_hourratecard",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                        var hourRate = result.getValue({
                            name: "custrecord_abj_ratecard_hours",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                        var rate = result.getValue({
                            name: "custrecord_abj_ratecard_hours_rate",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                        var asf = result.getValue({
                            name: "custrecord4",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                        })
                        allDataToset.push({
                            position: position,
                            CategorySOW: CategorySOW,
                            department: department,
                            description: description,
                            hourRate : hourRate,
                            rate: rate,
                            lineItem : lineItem,
                            itemValue : itemValue,
                            combinedValue : combinedValue,
                            asf : asf,
                            amountPembobotan : amountPembobotan
                        })
                        return true;
                    });
                    if (allDataToset.length > 0) {
                        var alreadyExists = false;
                        var lineCount = records.getLineCount({
                            sublistId: 'recmachcustrecord_transaction_id'
                        });

                        for (var j = 0; j < lineCount; j++) {
                            var existingLineId = records.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_id_line',
                                line: j
                            });

                            if (existingLineId === combinedValue) {
                                alreadyExists = true;
                                break;
                            }
                        }

                        if (alreadyExists) {
                            console.log('Line dengan ID', combinedValue, 'sudah ada, tidak ditambahkan lagi');
                            return;
                        }
                        allDataToset.forEach(function(data) {
                            // Tambah baris baru di sublist
                            records.selectNewLine({
                                sublistId: 'recmachcustrecord_transaction_id'
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_position',
                                value: data.position
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_category_sow',
                                value: data.CategorySOW
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_department_pembobotan',
                                value: data.department
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_desc_pembobotan',
                                value: data.description
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_hour_pembobotan',
                                value: data.hourRate
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_rate_pembobotan',
                                value: data.rate
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_id_line',
                                value: data.combinedValue
                            });

                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_item_pembobotan',
                                value: data.itemValue
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_asf_pembobotan',
                                value: data.asf
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_amount_pembobotan',
                                value: data.amountPembobotan
                            });
                            var prosentField = records.getSublistField({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_asf_prosent',
                                line: records.getCurrentSublistIndex({ sublistId: 'recmachcustrecord_transaction_id' })
                            });
                            prosentField.isDisabled = true;
                            // Simpan barisnya
                            records.commitLine({
                                sublistId: 'recmachcustrecord_transaction_id'
                            });
                        });
                    }

                }
            } else {
                console.log('Quotation Tier belum diisi');
            }
        }
    }
    function fieldChanged(context) {
            var sublistId = context.sublistId;
            var fieldId = context.fieldId;

            if (sublistId === 'recmachcustrecord_transaction_id' && fieldId === 'custrecord_asf_pembobotan') {
                var line = records.getCurrentSublistIndex({ sublistId: 'recmachcustrecord_transaction_id' });
                var pembobotanChecked = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_asf_pembobotan'
                });

                var prosentField = records.getSublistField({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_asf_prosent',
                    line: line
                });

                var deptField = records.getSublistField({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_department_pembobotan',
                    line: line
                });
                console.log('fieldChaged', pembobotanChecked)
                if (pembobotanChecked) {
                    prosentField.isDisabled = false;
                    deptField.isDisabled = false;
                } else {
                    prosentField.isDisabled = true;
                    deptField.isDisabled = true;
                }
            }
            if (sublistId === 'recmachcustrecord_transaction_id' && fieldId === 'custrecord_rate_pembobotan') {
                var ratePembobotan = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_rate_pembobotan'
                });
                var hour = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_hour_pembobotan'
                });
                var amountCount = Number(ratePembobotan) * Number(hour);
                console.log('amountCount', amountCount)
                records.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_amount_pembobotan',
                    value : amountCount
                })
            }
            if(sublistId == 'item' && fieldId == 'item'){
                var itemValue = records.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });
                var lineItem = records.getCurrentSublistIndex({
                    sublistId: 'item',
                    fieldId: 'line'
                });
                var combineLine = itemValue + '_' + lineItem;
                console.log('combineLine', combineLine)
                 if (itemValue) {
                    console.log('masuk kondisi is item value')
                    records.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_item_id_pembobotan',
                        value: combineLine
                    });
                    console.log('Set custcol_item_id_pembobotan:', combineLine);
                }
            }
        }
        function validateLine(context) {
            var sublistId = context.sublistId;
            console.log('sublistId', sublistId)
            if (sublistId === 'recmachcustrecord_transaction_id') {
                var cekTrigger = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_id_line'
                });
                console.log('masuk kondisi')
                if(cekTrigger){
                    return true
                }else{
                    alert('Anda tidak diizinkan menambahkan baris manual.');
                    return false;
                }
                
            }
            return true;
        }

        function validateDelete(context) {
            if (context.sublistId !== 'item') return true;

            isDeleting = true; // ← tandai bahwa proses ini delete

            const currentRecord = context.currentRecord;
            const sublistName = context.sublistId;
            if (sublistName === 'item') {
                const itemId = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_item_id_pembobotan'
                });
                console.log('itemId', itemId)
                 const totalLines = currentRecord.getLineCount({
                    sublistId: 'recmachcustrecord_transaction_id'
                });
                console.log('totalLines', totalLines)
                for (let i = totalLines - 1; i >= 0; i--) {
                    const relatedLineId = currentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_id_line',
                        line: i
                    });
                    console.log('relatedLineId', relatedLineId)
                    if (relatedLineId === itemId) {
                        currentRecord.removeLine({
                            sublistId: 'recmachcustrecord_transaction_id',
                            line: i,
                            ignoreRecalc: true
                        });
                    }
                }

            }
            
            return true;
        }

    return {
        pageInit: pageInit,
        sublistChanged: sublistChanged,
        fieldChanged : fieldChanged,
        validateLine : validateLine,
        validateDelete : validateDelete
    };
});
