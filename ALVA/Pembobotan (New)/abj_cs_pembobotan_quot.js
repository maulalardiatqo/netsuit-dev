/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], 
function (runtime, log, url, currentRecord, currency, record, search, message) {

    var records = currentRecord.get();

    function pageInit(context) {
        console.log('Page Init masuk');

        var lineCount = records.getLineCount({
            sublistId: 'recmachcustrecord_transaction_id'
        });

        for (var i = 0; i < lineCount; i++) {
            var prosentField = records.getSublistField({
                sublistId: 'recmachcustrecord_transaction_id',
                fieldId: 'custrecord_asf_prosent',
                line: i
            });
            prosentField.isDisabled = true;
        }
        var newRowButton = document.getElementById('uir-new-row-content');
        if (newRowButton) {
            newRowButton.style.display = 'none';
            console.log('Tombol New Line disembunyikan');
        }
    }
    
    function sublistChanged(context) {
        var sublistId = context.sublistId;
        if (context.operation === 'remove' && context.sublistId === 'item') {
            var removedLineIndex = context.line;
            // Ambil item dan line index yang dihapus
            var removedItemValue = records.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: removedLineIndex
            });
            var combinedRemovedKey = removedItemValue + '_' + removedLineIndex;
            console.log('Baris dihapus. combinedRemovedKey:', combinedRemovedKey);

            // Dapatkan jumlah baris di sublist pembobotan
            var totalPembobotanLine = records.getLineCount({
                sublistId: 'recmachcustrecord_transaction_id'
            });

            // Loop dari belakang agar tidak terjadi shifting index saat remove
            for (var i = totalPembobotanLine - 1; i >= 0; i--) {
                var lineIdValue = records.getSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_id_line',
                    line: i
                });

                if (lineIdValue === combinedRemovedKey) {
                    console.log('Menghapus baris pembobotan ke-' + i + ' dengan ID:', lineIdValue);
                    records.removeLine({
                        sublistId: 'recmachcustrecord_transaction_id',
                        line: i,
                        ignoreRecalc: true
                    });
                }
            }
        }
        if (sublistId === 'item') {
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
                var complexity = records.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_complexity_level_line'
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
                console.log('complexity:', complexity);

                if(itemValue && complexity){
                    var customrecord_abj_ratecardSearchObj = search.create({
                    type: "customrecord_abj_ratecard",
                    filters:
                    [
                        ["custrecord_abj_rate_card_item_name","anyof",itemValue], 
                        "AND", 
                        ["custrecord_abj_rate_hour_type","anyof",quotationTier], 
                        "AND", 
                        ["custrecord_abj_ratecard_complexity_level","anyof",complexity]
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
                        allDataToset.push({
                            position: position,
                            CategorySOW: CategorySOW,
                            department: department,
                            description: description,
                            hourRate : hourRate,
                            rate: rate,
                            lineItem : lineItem,
                            itemValue : itemValue,
                            combinedValue : combinedValue
                        })
                        return true;
                    });
                    if (allDataToset.length > 0) {
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

                            // Hitung amount: Number(rate) * Number(hourRate)
                            var amount = Number(data.rate) * Number(data.hourRate);
                            records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_amount_pembobotan',
                                value: amount
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

                if (pembobotanChecked) {
                    prosentField.isDisabled = false;
                    deptField.isDisabled = false;
                } else {
                    prosentField.isDisabled = true;
                    deptField.isDisabled = true;
                }
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
                    return false; // tolak insert line manual
                }
                
            }
            return true;
        }
    return {
        pageInit: pageInit,
        sublistChanged: sublistChanged,
        fieldChanged : fieldChanged,
        validateLine : validateLine
    };
});
