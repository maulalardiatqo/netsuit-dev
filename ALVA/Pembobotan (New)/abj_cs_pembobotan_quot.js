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
    function recalculateSingleLine(rec, currentLineIndex, qtyItem) {
        var soRec = rec;

        // Ambil ID pembobotan dari line item yang sedang diedit
        var itemLineId = soRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_item_id_pembobotan',
            line: currentLineIndex
        });

        if (!itemLineId) {
            console.log('❌ Tidak ada nilai custcol_item_id_pembobotan pada line ini');
            return;
        }

        var qty = qtyItem

        console.log('>> Triggered Single Line Recalculation');
        console.log('itemLineId (custcol_item_id_pembobotan):', itemLineId, 'qty:', qty);

        var pembobotanData = [];
        var lineCount = soRec.getLineCount({
            sublistId: 'recmachcustrecord_transaction_id'
        });

        for (var i = 0; i < lineCount; i++) {
            var lineId = soRec.getSublistValue({
                sublistId: 'recmachcustrecord_transaction_id',
                fieldId: 'custrecord_id_line',
                line: i
            });

            if (String(lineId) === String(itemLineId)) {
                pembobotanData.push({
                    amount: soRec.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_amount_pembobotan',
                        line: i
                    }),
                    asfProsent: soRec.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_asf_prosent',
                        line: i
                    }),
                    amtAsf: soRec.getSublistValue({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId: 'custrecord_amount_asf_pembobotan',
                        line: i
                    })
                });
            }
        }

        if (pembobotanData.length === 0) {
            console.log('⚠️ Tidak ditemukan data pembobotan yang sesuai untuk line ini');
            return;
        }

        // Kalkulasi
        var totalAmount = 0;
        var totalProsent = 0;
        var totalAmtAsf = 0;

        pembobotanData.forEach(function (item) {
            totalAmount += parseFloat(item.amount) || 0;
            totalProsent += parseFloat(item.asfProsent) || 0;
            totalAmtAsf += parseFloat(item.amtAsf) || 0;
        });

        var rate = qty > 0 ? (totalAmount / qty) : 0;
        console.log('rate', rate)
        var amountPembobotan = rate * qty;
        console.log('amountPembobotan', amountPembobotan)
        var prorateASF = qty > 0 ? (totalAmtAsf / qty) : 0;
        console.log('prorateASF', prorateASF)
        var rateToSet = (amountPembobotan / qty) + prorateASF;
        console.log('rateToSet', rateToSet)
        var amountToSet = rateToSet * qty;
        console.log('amountToSet', amountToSet)

        // Tax dan Discount
        var amtTax = soRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'tax1amt',
            line: currentLineIndex
        }) || 0;

        var discountAmt = soRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_abj_disc_line',
            line: currentLineIndex
        }) || 0;

        var grossAmt = (amountToSet - discountAmt) + amtTax;

        // Set nilai baru
        soRec.selectLine({
            sublistId: 'item',
            line: currentLineIndex
        });

        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'price',
            value: '-1'
        });

        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_rate_pembobotan',
            value: rate
        });
        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_amount_pembobotan',
            value: amountPembobotan
        });
        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_total_amount_asf',
            value: totalAmtAsf
        });
        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_alvaprorateasf',
            value: prorateASF
        });
        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'grossamt',
            value: grossAmt
        });
        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: rateToSet,
            ignoreFieldChange: true
        });
        soRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: amountToSet,
            ignoreFieldChange: true
        });


        console.log('✅ Selesai hitung ulang line:', currentLineIndex);
    }

    function recalculateItem(rec){
        var soRec = rec
        var lineCOunt = soRec.getLineCount({
            sublistId : "recmachcustrecord_transaction_id"
        });
        console.log('lineCOunt recalculateItem', lineCOunt)
        if(lineCOunt > 0){
            var groupedData = {};
            for(var i = 0; i < lineCOunt; i++){
                var lineId = soRec.getSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_id_line',
                    line: i
                });
                var amount = soRec.getSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_amount_pembobotan',
                    line: i
                });
                var asfProsent = soRec.getSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_asf_prosent',
                    line: i
                });
                var amtAsf = soRec.getSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_amount_asf_pembobotan',
                    line: i
                });
                if (!groupedData[lineId]) {
                    groupedData[lineId] = [];
                }

                groupedData[lineId].push({
                    amount: amount,
                    asfProsent: asfProsent,
                    amtAsf : amtAsf
                });
                
            }
            console.log('groupedData', groupedData)
            var itemLineCount = soRec.getLineCount({
                sublistId: 'item'
            });
            console.log('itemLineCount', itemLineCount)
            for (var lineKey in groupedData) {
                
                console.log('groupedData.hasOwnProperty(lineKey)', groupedData.hasOwnProperty(lineKey))
                if (groupedData.hasOwnProperty(lineKey)) {
                    for (var j = 0; j < itemLineCount; j++) {
                        var itemLineId = soRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_item_id_pembobotan',
                            line: j
                        });
                        console.log('isDataCocok', {itemLineId : itemLineId, lineKey : lineKey})
                        if (itemLineId == lineKey) {
                            var qty = parseFloat(soRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: j
                            })) || 0;
                            
                            var totalAmount = 0;
                            var totalProsent = 0;
                            var totalAmtAsf = 0;
                            console.log('qty', qty)
                            groupedData[lineKey].forEach(function(item){
                                totalAmount += parseFloat(item.amount) || 0;
                                totalProsent += parseFloat(item.asfProsent) || 0;
                                totalAmtAsf += parseFloat(item.amtAsf) || 0;
                            });
                            console.log('totalAmount', totalAmount);
                            console.log('totalProsent', totalProsent)
                            var rate = qty > 0 ? (totalAmount / qty) : 0;
                            console.log('rate', rate)
                            console.log('Set Rate', 'Line: ' + itemLineId + ', Qty: ' + qty + ', Amount: ' + totalAmount + ', Rate: ' + rate);

                            soRec.selectLine({
                                sublistId: 'item',
                                line: j
                            });
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: '-1'
                            })
                            console.log('rate', rate)
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_rate_pembobotan',
                                value: rate
                            });
                            var amountPembobotan = Number(rate) * Number(qty);
                            console.log('amountPembobotan', amountPembobotan)
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_amount_pembobotan',
                                value: amountPembobotan
                            });
                            console.log('totalAmtAsf', totalAmtAsf)
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_total_amount_asf',
                                value: totalAmtAsf
                            });
                            var prorateASF = Number(totalAmtAsf) / Number(qty);
                            console.log('prorateASF', prorateASF)
                            var rateToset = (Number(amountPembobotan) / Number(qty)) + Number(prorateASF);
                            console.log('rateToset', rateToset)
                            console.log('qty', qty)
                            var amountToset = Number(rateToset) * Number(qty);
                            console.log('amountToset 1', amountToset)
                            
                            
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_alvaprorateasf',
                                value: prorateASF
                            });
                            var amtTax = soRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId : 'tax1amt'
                            }) || 0;
                            
                            var discountAmt = soRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId : 'custcol_abj_disc_line'
                            }) || 0;
                            console.log('amtTax', amtTax);
                            console.log('discountAmt', discountAmt)
                            console.log('amountToset', amountToset)
                            var grossAmt = (Number(amountToset) - Number(discountAmt)) +(Number(amtTax));
                            console.log('grossAmt', grossAmt)
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                value: 0
                            });
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                value: grossAmt
                            });
                            var cekAmount = soRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount'
                            })
                            console.log('cekAmount', cekAmount)
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: 0,
                                ignoreFieldChange : true
                            });
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: rateToset,
                                ignoreFieldChange : true
                            });
                            soRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: amountToset,
                                ignoreFieldChange : true
                            });
                            soRec.commitLine({
                                sublistId: 'item'
                            });
                        }
                    }
                }
            }
        }
    }
    function pageInit(context) {
        console.log('Page Init masuk');
        
        var newRowButton = document.getElementById('uir-new-row-content');
        if (newRowButton) {
            newRowButton.style.display = 'none';
            console.log('Tombol New Line disembunyikan');
        }
        var recordType = records.type;
        console.log('recordType', recordType)
        var trigger = ''
        if (recordType === 'salesorder') {
            var mode = context.mode;
            console.log('mode', mode)
            if(mode == 'copy' || mode == 'create'){
                var customForm = records.getValue('customform');
                var createdFrom = records.getValue('createdfrom');
                trigger = 'salesorder'
                if(customForm == 156){
                    if(createdFrom){
                        loadPembobotanFromQuote(createdFrom, records, trigger)
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
            var mode = context.mode;
            console.log('mode', mode)
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
        }else if(recordType === 'invoice'){
            var mode = context.mode;
            console.log('mode', mode)
            if(mode == 'copy' || mode == 'create'){
                var customForm = records.getValue('customform');
                var createdFrom = records.getValue('createdfrom');
                trigger = 'invoice'
                console.log('customForm', customForm)
                if(customForm == 157){
                    if(createdFrom){
                        loadPembobotanFromQuote(createdFrom, records, trigger)
                        setTimeout(function() {
                            disableSublistFields(records);
                        }, 500);
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
        }else if(recordType === 'returnauthorization'){
            var mode = context.mode;
            console.log('mode', mode)
            if(mode == 'copy' || mode == 'create'){
                var createdFrom = records.getValue('createdfrom');
                trigger = 'returnauthorization'
                console.log('customForm', customForm)
                
                    if(createdFrom){
                        loadPembobotanFromQuote(createdFrom, records, trigger)
                        setTimeout(function() {
                            disableSublistFields(records);
                        }, 500);
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
        }else if(recordType === 'creditmemo'){
            var mode = context.mode;
            console.log('mode', mode)
            if(mode == 'copy' || mode == 'create'){
                var customForm = records.getValue('customform');
                var createdFrom = records.getValue('createdfrom');
                trigger = 'creditmemo'
                console.log('customForm', customForm)
                if(customForm == 159){
                    if(createdFrom){
                        loadPembobotanFromQuote(createdFrom, records, trigger)
                        setTimeout(function() {
                            disableSublistFields(records);
                        }, 500);
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
        }
    }
    function disableSublistFields(rec) {
        const sublistId = 'recmachcustrecord_transaction_id';
        const fieldIds = [
            'custrecord_position',
            'custrecord_desc_pembobotan',
            'custrecord_rate_pembobotan',
            'custrecord_hour_pembobotan',
            'custrecord_amount_pembobotan',
            'custrecord_category_sow',
            'custrecord_department_pembobotan',
            'custrecord_asf_pembobotan',
            'custrecord_asf_prosent',
            'custrecord_item_pembobotan'
        ];

        var lineCount = rec.getLineCount({ sublistId });

        for (var i = 0; i < lineCount; i++) {
            fieldIds.forEach(function(fieldId) {
                var field = rec.getSublistField({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    line: i
                });

                if (field) {
                    field.isDisabled = true;
                }
            });
        }
    }
    function loadPembobotanFromQuote(estimateId, rec, trigger) {
        try {
            var recordToLoad = '';
            if(trigger == 'salesorder'){
                recordToLoad = 'estimate'
            }else if(trigger == 'creditmemo'){
                 const result = search.lookupFields({
                            type: 'transaction',
                            id: estimateId,
                            columns: ['recordtype', 'tranid']
                        });

                        const recordType = result.recordtype;
                        const tranid = result.tranid;
                recordToLoad = recordType
            }else{
                 const result = search.lookupFields({
                            type: 'transaction',
                            id: estimateId,
                            columns: ['recordtype', 'tranid']
                        });

                        const recordType = result.recordtype;
                        const tranid = result.tranid;
                recordToLoad = recordType
            }
            console.log('recordToLoad', recordToLoad)
            var estimateRecord = record.load({
                type: recordToLoad,
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
                        custrecord_amount_asf_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_amount_asf_pembobotan', line: i }),
                        custrecord_item_pembobotan: estimateRecord.getSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_item_pembobotan', line: i }),
                        custrecord_pembobotan_account_asf :estimateRecord.getSublistValue({ sublistId : 'recmachcustrecord_transaction_id', fieldId : 'custrecord_pembobotan_account_asf', line : i})
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
                // recalculateItem(rec)
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
                        }),
                        search.createColumn({
                            name: "custrecord_alva_accountratecard",
                            join: "CUSTRECORD_ABJ_RATECARD_ID",
                            label: "account"
                        })

                    ]
                    });
                    var allDataToset = [];
                    var searchResultCount = customrecord_abj_ratecardSearchObj.runPaged().count;
                    console.log("customrecord_abj_ratecardSearchObj result count",searchResultCount);
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
                        var accountAsf = result.getValue({
                            name: "custrecord_alva_accountratecard",
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
                            amountPembobotan : amountPembobotan,
                            accountAsf : accountAsf
                        })
                        return true;
                    });
                    console.log('allDataToset', allDataToset)
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
                             records.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_pembobotan_account_asf',
                                value: data.accountAsf
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
        var recordType = records.type;
        if(recordType !== 'invoice' && recordType !== 'creditmemo'){
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
                console.log('line', line)
                if (pembobotanChecked) {
                    prosentField.isDisabled = false;
                    deptField.isDisabled = false;
                } else {
                    prosentField.isDisabled = true;
                    deptField.isDisabled = true;
                }
            }
            if(sublistId == 'recmachcustrecord_transaction_id' && fieldId == 'custrecord_asf_prosent'){
                const lineCount = records.getLineCount({ sublistId: 'recmachcustrecord_transaction_id' });
                var prosent = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_asf_prosent'
                });
                var kategorySOW = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_category_sow'
                });
                var isPembobotan = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_asf_pembobotan'
                });
                var idLine = records.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_transaction_id',
                    fieldId : 'custrecord_id_line'
                })
                console.log('lineCount', lineCount);

                console.log('dataCount', {prosent : prosent,kategorySOW : kategorySOW})
                var totalAmountAsf = 0
                if(lineCount > 0){
                    for(var i = 0; i < lineCount; i ++){
                        const idLineIn = records.getSublistValue({
                            sublistId: 'recmachcustrecord_transaction_id',
                            fieldId: 'custrecord_id_line',
                            line: i
                        });
                        const kategorySOWIn = records.getSublistValue({
                            sublistId: 'recmachcustrecord_transaction_id',
                            fieldId: 'custrecord_category_sow',
                            line: i
                        });
                        const isPembobotan = records.getSublistValue({
                            sublistId: 'recmachcustrecord_transaction_id',
                            fieldId: 'custrecord_asf_pembobotan',
                            line: i
                        });

                        if (
                            idLineIn === idLine &&
                            kategorySOWIn === kategorySOW &&
                            isPembobotan === false
                        ) {
                            const amount = parseFloat(records.getSublistValue({
                                sublistId: 'recmachcustrecord_transaction_id',
                                fieldId: 'custrecord_amount_pembobotan',
                                line: i
                            })) || 0;
                            totalAmountAsf += amount;
                        }
                    }
                }
                console.log('totalAmountAsf', totalAmountAsf)
                if(totalAmountAsf && totalAmountAsf != 0){
                    totalAmountAsf = Number(totalAmountAsf) * prosent / 100
                    console.log('totalAmountAsf after count', totalAmountAsf)
                    records.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_transaction_id',
                        fieldId : 'custrecord_amount_asf_pembobotan',
                        value : totalAmountAsf
                    })
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
            if(sublistId === 'recmachcustrecord_transaction_id' && fieldId === 'custrecord_hour_pembobotan'){
                var hour = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_hour_pembobotan'
                });
                var ratePembobotan = records.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_rate_pembobotan'
                });
            
                var amountCount = Number(ratePembobotan) * Number(hour);
                console.log('amountCount', amountCount)
                records.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_transaction_id',
                    fieldId: 'custrecord_amount_pembobotan',
                    value : amountCount
                })
            }
        }else{
            if(sublistId == 'item' && fieldId == 'quantity'){
                console.log('tertrigeer')
                var qtyItem = records.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity'
                });
                // var lineItemId = records.getCurrentSublistIndex({
                //     sublistId: 'item',
                //     fieldId: 'custcol_item_id_pembobotan'
                // });
                var rec = records;
                var currentLine = rec.getCurrentSublistIndex({
                    sublistId: 'item'
                });

            console.log('➡️ Field quantity berubah di line:', currentLine);
            console.log('qtyItem', qtyItem)
            // recalculateSingleLine(rec, currentLine, qtyItem);
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
