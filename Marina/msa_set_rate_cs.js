/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Created By: Susini
 * Date 03/10/2023
 */

define(["N/error", "N/log", "N/search", "N/record", "N/currentRecord"],
    function (error, log, search, record, currentRecord) {
        function pageInit(context) {


        }

        function roundToDecimal(number, decimalPlaces) {
            var factor = Math.pow(10, decimalPlaces);
            return Math.round(number * factor) / factor;
        }

        function fieldChanged(context) {



            var newRec = context.currentRecord;
            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;
            var recType = newRec.type;

            if ((sublistName == 'item' && sublistFieldName == 'item') || (sublistName == 'item' && sublistFieldName == 'rate')) {
                try {
                    var cust_id = newRec.getValue('entity');
                    var lineNum = context.line;
                    var id_item = newRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: lineNum
                    });
                    var quantity = newRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: lineNum
                    });
                    var taxRate = newRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        line: lineNum
                    });
                    var objGrosir;
                    log.debug('cust_id', cust_id);

                    if (cust_id) {
                        var lookupCust = search.lookupFields({
                            type: 'customer',
                            id: cust_id,
                            columns: ['custentity_ajb_grosir_list']
                        });

                        if (lookupCust && lookupCust.custentity_ajb_grosir_list) {
                            objGrosir = lookupCust.custentity_ajb_grosir_list;
                        }
                    }

                    log.debug('objGrosir', objGrosir);
                    console.log('objGrosir', objGrosir);

                    var cust_grosir_list = 0;
                    if (objGrosir.length > 0) {
                        cust_grosir_list = objGrosir[0].value;
                    }
                    log.debug('cust_grosir_list', cust_grosir_list);
                    // var rate = 0;
                    var rate = newRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: lineNum
                    });

                    if (parseInt(cust_grosir_list) > 0) {
                        log.debug('price by grosir', 'price by grosir');
                        var SearchObj = search.create({
                            type: "customrecord_msa_group_price_qty",
                            filters:
                                [
                                    ["custrecord_msa_priceqty_item_id", "is", id_item],
                                    "AND",
                                    ["custrecord_msa_gpq_grosir", "is", cust_grosir_list]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "custrecord_msa_gpq_harga", label: "Harga" }),
                                    search.createColumn({ name: "custrecord_msa_gpq_grosir", label: "Grosir" })
                                ]
                        }).run().getRange(0, 1);
                        log.debug('SearchObj', SearchObj);

                        if (SearchObj.length == 1) {
                            rate = SearchObj[0].getValue({ name: "custrecord_msa_gpq_harga", label: "Harga" }) || 0;
                        }

                    } else {
                        log.debug('price by qty', 'price by qty');
                        var searchPriceGroup = search.create({
                            type: "customrecord_msa_group_price_qty",
                            filters:
                                [
                                    [["custrecord_msa_gpq_volume", "lessthanorequalto", quantity]],
                                    "AND",
                                    ["custrecord_msa_priceqty_item_id", "is", id_item]
                                ],
                            columns:
                                [
                                    search.createColumn({
                                        name: "custrecord_msa_gpq_volume",
                                        sort: search.Sort.DESC,
                                        label: "Batas Volume &gt;="
                                    }),
                                    search.createColumn({ name: "custrecord_msa_gpq_harga", label: "Harga" }),
                                    search.createColumn({ name: "custrecord_msa_gpq_profit_percent", label: "Profit %" })
                                ]
                        }).run().getRange(0, 1);
                        log.debug('searchPriceGroup', searchPriceGroup);

                        if (searchPriceGroup.length == 1) {
                            rate = searchPriceGroup[0].getValue({ name: "custrecord_msa_gpq_harga", label: "Harga" }) || 0;
                        }
                    }
                    log.debug('rate', rate);
                    newRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: rate,
                        ignoreFieldChange: true
                    });
                    
                    var amount = (quantity) * (rate);
                    newRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: parseFloat(amount),
                        ignoreFieldChange: true
                    });


                }
                catch (e) {
                    if (e instanceof nlobjError) {
                        log.debug('error, function fieldChanged', e.getCode() + '\n' + e.getDetails());
                    }
                    else {
                        log.debug('unexpected, function fieldChanged', e.toString());
                    }
                }
            }
        }

        function buttonFunctionUpdateRate() { //just for button Update Rate
            console.log('masuk')
            var records = currentRecord.get();
            var custId = records.getValue('entity');

            //get grosir customer
            var lookupCust = search.lookupFields({
                type: 'customer',
                id: custId,
                columns: ['custentity_ajb_grosir_list']
            });
            var objGrosir = lookupCust.custentity_ajb_grosir_list;
            var custGrosir;
            if (objGrosir.length > 0) {
                custGrosir = objGrosir[0].value;
            }


            var lineCount = records.getLineCount({ sublistId: 'item' });
            if (lineCount > 0) {
                for (var i = 0; i < lineCount; i++) {
                    var itemId = records.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    var rateItem = records.getSublistValue({ //baseprice
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    });
                    var quantityItem = records.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });

                    var rateSet = rateItem;
                    if (parseInt(custGrosir) > 0) {
                        var SearchObj = search.create({
                            type: "customrecord_msa_group_price_qty",
                            filters:
                                [
                                    ["custrecord_msa_priceqty_item_id", "is", itemId],
                                    "AND",
                                    ["custrecord_msa_gpq_grosir", "is", custGrosir]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "custrecord_msa_gpq_harga", label: "Harga" }),
                                    search.createColumn({ name: "custrecord_msa_gpq_grosir", label: "Grosir" })
                                ]
                        }).run().getRange(0, 1);
                        // console.log('SearchObj', SearchObj);

                        if (SearchObj.length == 1) {
                            rateSet = SearchObj[0].getValue({ name: "custrecord_msa_gpq_harga", label: "Harga" }) || 0;
                        }

                    } else {
                        var searchPriceGroup = search.create({
                            type: "customrecord_msa_group_price_qty",
                            filters:
                                [
                                    [["custrecord_msa_gpq_volume", "lessthanorequalto", quantityItem]],
                                    "AND",
                                    ["custrecord_msa_priceqty_item_id", "is", itemId]
                                ],
                            columns:
                                [
                                    search.createColumn({
                                        name: "custrecord_msa_gpq_volume",
                                        sort: search.Sort.DESC,
                                        label: "Batas Volume &gt;="
                                    }),
                                    search.createColumn({ name: "custrecord_msa_gpq_harga", label: "Harga" }),
                                    search.createColumn({ name: "custrecord_msa_gpq_profit_percent", label: "Profit %" })
                                ]
                        }).run().getRange(0, 1);
                        // console.log('searchPriceGroup', searchPriceGroup);

                        if (searchPriceGroup.length == 1) {
                            rateSet = searchPriceGroup[0].getValue({ name: "custrecord_msa_gpq_harga", label: "Harga" }) || 0;
                        }
                    }
                    // var amountItem = (quantityItem) * (rateItem);

                    if (rateItem == rateSet) {
                        //
                        console.log('rate item line '+i+' tidak diset')
                    } else {
                        console.log('rate untuk line ' + i + ' diset')
                        records.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: rateSet,
                        });
                        records.commitLine({
                            sublistId: 'item'
                        });
                    }







                }
            }

        }



        return {
            // pageInit: pageInit,
            fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            // saveRecord: saveRecord
            buttonFunctionUpdateRate: buttonFunctionUpdateRate
        };
    });