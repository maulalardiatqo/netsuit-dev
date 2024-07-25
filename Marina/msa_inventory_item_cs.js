/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Created By: Susini
 * Date 11/10/2023
 */

define(["N/error", "N/log", "N/search", "N/record"],
    function (error, log, search, record) {
        function pageInit(context) {
            try {
                var newRec = context.currentRecord;

                var id_item = newRec.id;
                var last_purchase = searchLastPurchaseprice(item_id) || 0;
                alert('last_purchase : '+last_purchase);

                newRec.setValue({
                    fieldId: 'custitem_msa_last_purch_price_update',
                    value: last_purchase,
                    ignoreFieldChange: true
                });

            } catch (e) {
                if (e instanceof nlobjError) {
                    log.debug('error, function pageInit', e.getCode() + '\n' + e.getDetails());
                }
                else {
                    log.debug('unexpected, function pageInit', e.toString());
                }
            }
        }
        function saveRecord(context) {

            try {

            }
            catch (e) {
                if (e instanceof nlobjError) {
                    log.debug('error, function saveRecord', e.getCode() + '\n' + e.getDetails());
                }
                else {
                    log.debug('unexpected, function saveRecord', e.toString());
                }
            }
        }
        function validateField(context) {

            return true;
        }

        function setLineItem(newRec, id_pemesanan) {
            try {


            }
            catch (e) {
                if (e instanceof nlobjError) {
                    log.debug('error, function setLineItem', e.getCode() + '\n' + e.getDetails());
                }
                else {
                    log.debug('unexpected, function setLineItem', e.toString());
                }
            }
        }

        function roundToDecimal(number, decimalPlaces) {
            var factor = Math.pow(10, decimalPlaces);
            return Math.round(number * factor) / factor;
        }

        function searchLastPurchaseprice(item_id) {
            var itemreceiptSearchObj = search.create({
                type: "itemreceipt",
                filters:
                    [
                        ["type", "anyof", "ItemRcpt"],
                        "AND",
                        ["item.internalidnumber", "equalto", item_id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "trandate",
                            sort: search.Sort.DESC,
                            label: "Date"
                        }),
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "amount", label: "Amount" }),
                        search.createColumn({ name: "quantity", label: "Quantity" }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "{amount}/{quantity}",
                            label: "Formula (Currency)"
                        })
                    ]
            }).run().getRange(0, 1);
            var last_purchase = 0;
            if (itemreceiptSearchObj.length == 1) {
                last_purchase = itemreceiptSearchObj[0].getValue({
                    name: "formulacurrency",
                    formula: "{amount}/{quantity}",
                    label: "Formula (Currency)"
                });
            }
            return last_purchase;
        }

        function fieldChanged(context) {
            try {
                var newRec = context.currentRecord;
                var sublistName = context.sublistId;
                var sublistFieldName = context.fieldId;
                if(sublistFieldName == 'custitem_msa_last_purch_price_update'){
                    console.log('change');
                    var cekLineCount = newRec.getLineCount({
                        sublistId : "recmachcustrecord_msa_priceqty_item_id"
                    });
                    console.log('cekLineCount', cekLineCount)
                    if(cekLineCount > 0){
                        var hpp = newRec.getValue('custitem_msa_last_purch_price_update');
                        if(hpp){
                            for(var i = 0; i < cekLineCount; i ++){
                                var profitProcent = newRec.getSublistValue({
                                    sublistId : "recmachcustrecord_msa_priceqty_item_id",
                                    fieldId : "custrecord_msa_gpq_profit_percent",
                                    line : i
                                })
                                console.log('profitProcent', profitProcent)
                                if(profitProcent){
                                    var newHarga = Number(hpp) + ((Number(profitProcent) / 100 ) * Number(hpp))
                                    console.log('newHarga', newHarga);
                                    newRec.setSublistValue({
                                        sublistId : "recmachcustrecord_msa_priceqty_item_id",
                                        fieldId : "custrecord_msa_gpq_harga",
                                        value : newHarga,
                                        line : i
                                    })
                                }
                            }
                        }
                    }

                }

                if (sublistFieldName == 'custrecord_msa_gpd_harga') {
                    var hpp = null;
                    if (newRec.getValue('lastpurchaseprice')) {
                        hpp = parseFloat(newRec.getValue('lastpurchaseprice'));
                    } else {
                        hpp = parseFloat(newRec.getValue('cost'));
                    }
                    if (hpp != null) {
                        var harga_jual = newRec.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_msa_price_item_id',
                            fieldId: 'custrecord_msa_gpd_harga'
                        });
                        var percent = ((harga_jual - hpp) / hpp) * 100;
                        var percent_rounding = roundToDecimal(percent, 2);
                        newRec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_msa_price_item_id',
                            fieldId: 'custrecord_msa_gpd_percent',
                            value: percent_rounding,
                            ignoreFieldChange: true
                        });

                    } else {
                        alert('isi terlebih dahulu purchase price');
                    }
                }

                if (sublistFieldName == 'custrecord_msa_gpd_percent') {
                    console.log('pr1')
                    var hpp = null;
                    if (newRec.getValue('lastpurchaseprice')) {
                        hpp = parseFloat(newRec.getValue('lastpurchaseprice'));
                    } else {
                        hpp = parseFloat(newRec.getValue('cost'));
                    }
                    if (hpp != null) {
                        var percent = newRec.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_msa_price_item_id',
                            fieldId: 'custrecord_msa_gpd_percent'
                        });
                        var percent_ = parseFloat(percent) / 100;
                        var harga_jual = hpp + (hpp * percent_);
                        var harga_jual_rounding = roundToDecimal(harga_jual, 2);
                        log.debug('harga_jual', harga_jual);
                        newRec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_msa_price_item_id',
                            fieldId: 'custrecord_msa_gpd_harga',
                            value: harga_jual_rounding,
                            ignoreFieldChange: true
                        });

                    } else {
                        alert('isi terlebih dahulu purchase price');
                    }
                }
                if (sublistFieldName == 'custrecord_msa_gpq_harga') {
                    var id_item = newRec.id;
                    var hpp = parseFloat(newRec.getValue('custitem_msa_last_purch_price_update')) || 0;
                    if (parseFloat(hpp) == 0) {
                        hpp = parseFloat(newRec.getValue('cost'));
                    }
                    if (hpp != null || hpp != 0) {
                        var harga_jual = newRec.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_msa_priceqty_item_id',
                            fieldId: 'custrecord_msa_gpq_harga'
                        });
                        var profit = parseFloat(harga_jual) - hpp;
                        var profit_percent = (profit / hpp) * 100;

                        var profit_rounding = roundToDecimal(profit_percent, 2);
                        newRec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_msa_priceqty_item_id',
                            fieldId: 'custrecord_msa_gpq_profit_percent',
                            value: profit_rounding,
                            ignoreFieldChange: true
                        });

                    } else {
                        alert('isi terlebih dahulu purchase price');
                    }
                }
                // if (sublistFieldName == 'custrecord_msa_gpq_volume') {
                //     var line_current = context.line;
                //     var line_harga_jual = newRec.getLineCount('recmachcustrecord_msa_price_item_id');
                //     log.debug('line_harga_jual', line_harga_jual);
                //     var harga_jual = 0;
                //     if (line_harga_jual > 0) {
                //         harga_jual = newRec.getSublistValue({
                //             sublistId: 'recmachcustrecord_msa_price_item_id',
                //             fieldId: 'custrecord_msa_gpd_harga',
                //             line: line_current
                //         });
                //     }
                //     newRec.setCurrentSublistValue({
                //         sublistId: 'recmachcustrecord_msa_priceqty_item_id',
                //         fieldId: 'custrecord_msa_gpq_harga',
                //         value: harga_jual,
                //         ignoreFieldChange: true
                //     });
                //     var hpp = null;
                //     if (newRec.getValue('lastpurchaseprice')) {
                //         hpp = parseFloat(newRec.getValue('lastpurchaseprice'));
                //     } else {
                //         hpp = parseFloat(newRec.getValue('cost'));
                //     }
                //     if (hpp != null) {
                //         var profit_percent = ((harga_jual - hpp) / hpp) * 100;
                //         var profit_rounding = roundToDecimal(profit_percent, 2);
                //         newRec.setCurrentSublistValue({
                //             sublistId: 'recmachcustrecord_msa_priceqty_item_id',
                //             fieldId: 'custrecord_msa_gpq_profit_percent',
                //             value: profit_rounding,
                //             ignoreFieldChange: true
                //         });

                //     } else {
                //         alert('isi terlebih dahulu purchase price');
                //     }
                // }
                if (sublistFieldName == 'custrecord_msa_gpq_profit_percent') {
                    var profit_percent = newRec.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_msa_priceqty_item_id',
                        fieldId: 'custrecord_msa_gpq_profit_percent'
                    });
                    console.log('pr change')
                    var profit = profit_percent / 100; var id_item = newRec.id;
                    var lpc = newRec.getValue('lastpurchaseprice')
                    console.log('lpc', lpc)
                    var hpp = parseFloat(newRec.getValue('custitem_msa_last_purch_price_update')) || 0;
                    if (parseFloat(hpp) == 0) {
                        hpp = parseFloat(newRec.getValue('cost'));
                    }
                    console.log('hpp', hpp)
                    if (hpp != null || hpp != 0) {
                        var harga_jual = hpp + (hpp * profit);
                        var harga_rounding = Math.round(harga_jual / 100) * 100;
                        newRec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_msa_priceqty_item_id',
                            fieldId: 'custrecord_msa_gpq_harga',
                            value: harga_rounding,
                            ignoreFieldChange: true
                        });

                    } else {
                        alert('isi terlebih dahulu purchase price');
                    }
                }
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

        function postSourcing(context) {

        }
        function lineInit(context) {

        }
        function validateDelete(context) {

            return true;
        }
        function validateInsert(context) {

            return true;
        }
        function validateLine(context) {



            return true;
        }

        function sublistChanged(context) {

        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
            // postSourcing: postSourcing,
            //sublistChanged: sublistChanged
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            // saveRecord: saveRecord
        };
    });