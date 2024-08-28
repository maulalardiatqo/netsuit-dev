/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    
    function pageInit(context) {
        console.log('init masuk');
    }
    
    function calculate(context) {
        var currentRecordObj = records;
        var countLine = currentRecordObj.getLineCount({
            sublistId: 'item'
        });
        if (countLine > 0) {
            var allData = [];
            for (var index = 0; index < countLine; index++) {
                var soNo = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_no_so',
                    line: index
                });
                var item = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: index
                });
                var salesRep = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_sales_rep_line',
                    line: index
                });
                var customerId = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_customer_line',
                    line: index
                });
                var onHand = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_onhand',
                    line: index
                });
                var incomingStock = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol5',
                    line: index
                });
                var osPo = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol6',
                    line: index
                });
                var foreCastBuffer = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol9',
                    line: index
                });
                var totalOrder = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_pr_total_order',
                    line: index
                });
                var packSizeOrder = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_pack_size_order',
                    line: index
                })
                var poCustomer = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_abj_po_customer',
                    line: index
                });
                var tanggalKirim = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId : 'custcol14',
                    line: index
                })
                var rumusPerhitungan = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId : 'custcol_pr_rumus_perhitungan',
                    line: index
                })
                var avgPengBusdev = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId : 'custcol10',
                    line: index
                })
                var avgPengAcc = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId : 'custcol11',
                    line: index
                })
                var leadTimeKirim = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId : 'custcol8',
                    line: index
                })
                var totalPackaging = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId : 'custcol_abj_total_packaging',
                    line : index
                })
                allData.push({
                    soNo : soNo,
                    packSizeOrder : packSizeOrder,
                    item: item,
                    salesRep: salesRep,
                    customerId: customerId,
                    onHand: onHand,
                    incomingStock: incomingStock,
                    osPo: osPo,
                    foreCastBuffer: foreCastBuffer,
                    totalOrder: totalOrder,
                    poCustomer: poCustomer,
                    tanggalKirim : tanggalKirim,
                    rumusPerhitungan : rumusPerhitungan,
                    avgPengBusdev : avgPengBusdev,
                    avgPengAcc : avgPengAcc,
                    leadTimeKirim : leadTimeKirim,
                    totalPackaging : totalPackaging
                });
            }

            var groupedData = {};

            allData.forEach(function(data) {
                var groupKey = data.item + '-' + data.salesRep + '-' + data.customerId + '-' + data.packSizeOrder + '-' +data.soNo;
                
                if (!groupedData[groupKey]) {
                    groupedData[groupKey] = {
                        soNo : data.soNo,
                        item: data.item,
                        salesRep: data.salesRep,
                        customerId: data.customerId,
                        packSizeOrder: data.packSizeOrder,
                        tanggalKirim: data.tanggalKirim,
                        totalPackaging : data.totalPackaging,
                        rumusPerhitungan: 0,
                        avgPengBusdev: 0,
                        avgPengAcc: 0,
                        leadTimeKirim: data.leadTimeKirim,
                        onHand: 0,
                        incomingStock: 0,
                        osPo: 0,
                        foreCastBuffer: 0,
                        totalOrder: 0,
                        poCustomer: []
                    };
                }
            
                groupedData[groupKey].onHand += data.onHand;
                groupedData[groupKey].incomingStock += data.incomingStock;
                groupedData[groupKey].osPo += data.osPo;
                groupedData[groupKey].foreCastBuffer += Number(data.foreCastBuffer);
                groupedData[groupKey].totalOrder += data.totalOrder;
                groupedData[groupKey].avgPengAcc += data.avgPengAcc;
                groupedData[groupKey].avgPengBusdev += data.avgPengBusdev;
                groupedData[groupKey].rumusPerhitungan += data.rumusPerhitungan;
                if (data.poCustomer && data.poCustomer.trim() !== "") {
                    groupedData[groupKey].poCustomer.push(data.poCustomer);
                }
            });

            console.log('groupedData', groupedData);
            
            var result = Object.keys(groupedData).map(function(key) {
                var data = groupedData[key];
                data.poCustomer = data.poCustomer.join(', ');
                return data;
            });
            
            if (result.length > 0) {
                result.forEach(function(data) {
                    var soNo = data.soNo
                    var packSizeOrder = data.packSizeOrder
                    var item = data.item;
                    var salesRep = data.salesRep;
                    var customerId = data.customerId;
                    var onHand = data.onHand;
                    var incomingStock = data.incomingStock;
                    var osPo = data.osPo;
                    var foreCastBuffer = data.foreCastBuffer;
                    var totalOrder = data.totalOrder;
                    var poCustomer = data.poCustomer;
                    var leadTimeKirim = data.leadTimeKirim
                    var rumusPerhitungan = data.rumusPerhitungan
                    var avgPengBusdev = data.avgPengBusdev
                    var avgPengAcc = data.avgPengAcc
                    var tanggalKirim = data.tanggalKirim
                    var totalPackaging = data.totalPackaging
                    var keyItem = item + "-" + salesRep + "-" + customerId + "-" + packSizeOrder  + '-' + soNo;
                    var countLineInCustom = currentRecordObj.getLineCount({
                        sublistId: "recmachcustrecord_iss_pr_parent"
                    });
                    
                    var found = false;

                    if (countLineInCustom > 0) {
                        for (var i = 0; i < countLineInCustom; i++) {
                            var itemPr = currentRecordObj.getSublistValue({
                                sublistId: 'recmachcustrecord_iss_pr_parent',
                                fieldId: 'custrecord_iss_pr_item',
                                line: i
                            });
                            var salesRepPr = currentRecordObj.getSublistValue({
                                sublistId: 'recmachcustrecord_iss_pr_parent',
                                fieldId: 'custrecord_prsum_salesrep',
                                line: i
                            });
                            var customerPr = currentRecordObj.getSublistValue({
                                sublistId: 'recmachcustrecord_iss_pr_parent',
                                fieldId: 'custrecord_prsum_customer',
                                line: i
                            });
                            var packSizeOrderPr = currentRecordObj.getSublistValue({
                                sublistId: 'recmachcustrecord_iss_pr_parent',
                                fieldId: 'custrecord_iss_pack_size',
                                line: i
                            });
                            var salesOrderNumber = currentRecordObj.getSublistValue({
                                sublistId: 'recmachcustrecord_iss_pr_parent',
                                fieldId: 'custrecord_iss_no_po',
                                line: i
                            });
            
                            var keyCustom = itemPr + "-" + salesRepPr + "-" + customerPr + '-' + packSizeOrderPr; 
            
                            if (keyItem === keyCustom) {
                                currentRecordObj.selectLine({
                                    sublistId: "recmachcustrecord_iss_pr_parent",
                                    line: i
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_pr_stock',
                                    value: onHand
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_pack_size',
                                    value: packSizeOrder
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_no_po',
                                    value: soNo
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_pr_incoming_stock',
                                    value: incomingStock
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_os_po',
                                    value: osPo
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_total_order',
                                    value: totalOrder
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_forecast_buffer',
                                    value: foreCastBuffer
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_prsum_po_customer',
                                    value: poCustomer
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_lead_time',
                                    value: leadTimeKirim
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_rumus_perhitungan',
                                    value: rumusPerhitungan
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_avg_busdev',
                                    value: avgPengBusdev
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_avg_accounting',
                                    value: avgPengAcc
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_tgl_kirim',
                                    value: tanggalKirim
                                });
                                currentRecordObj.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_iss_pr_parent',
                                    fieldId: 'custrecord_iss_total_order_formula',
                                    value: totalPackaging
                                });
                                currentRecordObj.commitLine({ sublistId: 'recmachcustrecord_iss_pr_parent' });
                                found = true;
                                break;
                            }
                        }
                    }

                    if (!found) {
                        currentRecordObj.selectNewLine({ sublistId: 'recmachcustrecord_iss_pr_parent' });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_pr_item',
                            value: item
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_pack_size',
                            value: packSizeOrder
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_no_po',
                            value: soNo
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_prsum_salesrep',
                            value: salesRep
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_prsum_customer',
                            value: customerId
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_pr_stock',
                            value: onHand
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_pr_incoming_stock',
                            value: incomingStock
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_os_po',
                            value: osPo
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_total_order',
                            value: totalOrder
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_forecast_buffer',
                            value: foreCastBuffer
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_prsum_po_customer',
                            value: poCustomer
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_lead_time',
                            value: leadTimeKirim
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_rumus_perhitungan',
                            value: rumusPerhitungan
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_avg_busdev',
                            value: avgPengBusdev
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_avg_accounting',
                            value: avgPengAcc
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_tgl_kirim',
                            value: tanggalKirim
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_iss_pr_parent',
                            fieldId: 'custrecord_iss_total_order_formula',
                            value: totalPackaging
                        });
                        currentRecordObj.commitLine({ sublistId: 'recmachcustrecord_iss_pr_parent' });
                    }
                });
            }
            
        }
    }
    return {
        pageInit: pageInit,
        calculate: calculate
    };
});
