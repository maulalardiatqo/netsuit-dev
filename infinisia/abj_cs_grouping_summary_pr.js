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
    
    function calculate(context) {
        var currentRecordObj = records;
        var countLine = currentRecordObj.getLineCount({
            sublistId: 'item'
        });
        if (countLine > 0) {
            var allData = [];
            for (var index = 0; index < countLine; index++) {
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
                var groupKey = data.item + '-' + data.salesRep + '-' + data.customerId;
            
                if (!groupedData[groupKey]) {
                    groupedData[groupKey] = {
                        item: data.item,
                        salesRep: data.salesRep,
                        customerId: data.customerId,
                        tanggalKirim: data.tanggalKirim,
                        totalPackaging: data.totalPackaging,
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
                    if (!groupedData[groupKey].poCustomer.includes(data.poCustomer)) {
                        groupedData[groupKey].poCustomer.push(data.poCustomer);
                    }
                }
            });
            
            
            log.debug('groupedData', groupedData);
            
            var countLineInCustom = currentRecordObj.getLineCount({
                sublistId: "recmachcustrecord_pr_id_parent"
            });
            log.debug('countLineInCustom', countLineInCustom)
            if (countLineInCustom > 0) {
                var lineCount = currentRecordObj.getLineCount({ sublistId: 'recmachcustrecord_pr_id_parent' });
                log.debug('deletedLineSUms')
                for (var i = lineCount - 1; i >= 0; i--) {
                    currentRecordObj.selectLine({ sublistId: 'recmachcustrecord_pr_id_parent', line: i });
                    currentRecordObj.removeLine({ sublistId: 'recmachcustrecord_pr_id_parent', line: i, ignoreRecalc: true });
                }
            }
            var result = Object.keys(groupedData).map(function(key) {
                var data = groupedData[key];
                data.poCustomer = data.poCustomer.join(', ');
                return data;
            });
            log.debug('resultLength', result.length)
            if (result.length > 0) {
                result.forEach(function(data) {
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
                    var keyItem = item + "-" + salesRep + "-" + customerId;
                   
                    currentRecordObj.selectNewLine({ sublistId: 'recmachcustrecord_pr_id_parent' });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_item',
                        value: item
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_sales_rep',
                        value: salesRep
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_customer',
                        value: customerId
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_currenctstock',
                        value: onHand
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_incomingstock',
                        value: incomingStock
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_ospo',
                        value: osPo
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_totalorder',
                        value: totalOrder
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_forecastbuffer',
                        value: foreCastBuffer
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_pocustomer',
                        value: poCustomer
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_leadtime',
                        value: leadTimeKirim
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_rumus_perhitungan',
                        value: rumusPerhitungan
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_avgdeliverybusdev',
                        value: avgPengBusdev
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_avgdeliveryacc',
                        value: avgPengAcc
                    });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pr_id_parent',
                        fieldId: 'custrecord_pr_sum_tglkirim',
                        value: tanggalKirim
                    });
                    currentRecordObj.commitLine({ sublistId: 'recmachcustrecord_pr_id_parent'});
                    
                    
                });
            }
            
        }
    }
    return {
        pageInit: pageInit,
        calculate: calculate
    };
});
