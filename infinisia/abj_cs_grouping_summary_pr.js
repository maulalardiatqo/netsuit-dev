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
    function getNumberFromString(input) {
        const match = input.match(/^\d+/);
        return match ? parseInt(match[0]) : 1;
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
                var packSizeOrderText = currentRecordObj.getSublistText({
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
                var ratePackSize = currentRecordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId : 'custcol_abj_ratepacksize',
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
                    totalPackaging : totalPackaging,
                    packSizeOrderText : packSizeOrderText,
                    ratePackSize : ratePackSize
                });
            }

            var groupedData = {};
            log.debug('allData length', allData.length)
            allData.forEach(function(data) {
                var groupKey = data.item + '-' + data.salesRep + '-' + data.customerId + '-' + data.packSizeOrder;
            
                if (!groupedData[groupKey]) {
                    groupedData[groupKey] = {
                        soNo : data.soNo,
                        item: data.item,
                        salesRep: data.salesRep,
                        customerId: data.customerId,
                        packSizeOrder: data.packSizeOrder,
                        packSizeOrderText : data.packSizeOrderText,
                        tanggalKirim: data.tanggalKirim,
                        ratePackSize: data.ratePackSize,
                        totalPackaging : 0,
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
            
                groupedData[groupKey].onHand += Number(data.onHand);
                groupedData[groupKey].incomingStock += Number(data.incomingStock);
                groupedData[groupKey].osPo += Number(data.osPo);
                groupedData[groupKey].foreCastBuffer += Number(data.foreCastBuffer);
                groupedData[groupKey].totalOrder += Number(data.totalOrder);
                groupedData[groupKey].totalPackaging += Number(data.totalPackaging);
                groupedData[groupKey].avgPengAcc += Number(data.avgPengAcc);
                groupedData[groupKey].avgPengBusdev += Number(data.avgPengBusdev);
                groupedData[groupKey].rumusPerhitungan += Number(data.rumusPerhitungan);
                
                if (data.poCustomer && data.poCustomer.trim() !== "") {
                    groupedData[groupKey].poCustomer.push(data.poCustomer);
                }
            });
            
            log.debug('groupedData', groupedData);
            
            var countLineInCustom = currentRecordObj.getLineCount({
                sublistId: "recmachcustrecord_iss_pr_parent"
            });
            if (countLineInCustom > 0) {
                var lineCount = currentRecordObj.getLineCount({ sublistId: 'recmachcustrecord_iss_pr_parent' });
                for (var i = lineCount - 1; i >= 0; i--) {
                    currentRecordObj.selectLine({ sublistId: 'recmachcustrecord_iss_pr_parent', line: i });
                    currentRecordObj.removeLine({ sublistId: 'recmachcustrecord_iss_pr_parent', line: i, ignoreRecalc: true });
                }
            }
            var result = Object.keys(groupedData).map(function(key) {
                var data = groupedData[key];
                data.poCustomer = data.poCustomer.join(', ');
                if (data.foreCastBuffer > 0) {
                    var calculationResult = data.onHand + data.incomingStock - data.osPo;
            
                    // Jika hasil perhitungan negatif
                    if (calculationResult < 0) {
                        var newRow = JSON.parse(JSON.stringify(data));
                        newRow.onHand = 0;
                        newRow.incomingStock = 0;
                        newRow.osPo = 0;
                        newRow.foreCastBuffer = data.foreCastBuffer;
                        newRow.totalOrder = -Math.abs(data.foreCastBuffer);
                        newRow.totalPackaging = data.totalPackaging;
                        newRow.ratePackSize = data.ratePackSize;
                        newRow.poCustomer = '';
                        newRow.soNo = '';
                        newRow.tanggalKirim = data.tanggalKirim
                        data.foreCastBuffer = 0;
                        data.totalOrder = calculationResult;
                        
            
                        return [data, newRow];
                    }else{
                        var newTotal = Number(calculationResult)  - Number(data.foreCastBuffer)
                        data.totalOrder = newTotal;
                        data.soNo = ''
                        return data;
                    }
                }
                return data;
            });
            result = result.flat(); 
           log.debug('resultLength', result.length)
            if (result.length > 0) {

                result.forEach(function(data) {
                    log.debug('data', data)
                    var soNo = data.soNo
                    var packSizeOrder = data.packSizeOrder
                    var packSizeOrderText = data.packSizeOrderText
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
                    var ratePackSize = data.ratePackSize
                    var keyItem = item + "-" + salesRep + "-" + customerId + "-" + packSizeOrder;
                   
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
                    // currentRecordObj.setCurrentSublistValue({
                    //     sublistId: 'recmachcustrecord_iss_pr_parent',
                    //     fieldId: 'custrecord_iss_total_order_formula',
                    //     value: totalPackaging
                    // });
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_iss_pr_parent',
                        fieldId: 'custrecord_iss_tgl_kirim',
                        value: tanggalKirim
                    });
                    var setRatePackSize
                    if(ratePackSize){
                        setRatePackSize = ratePackSize
                    }else{
                        setRatePackSize = getNumberFromString(packSizeOrderText)
                    }
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_iss_pr_parent',
                        fieldId: 'custrecord_abj_pr_ratepacksize',
                        value: setRatePackSize
                    });
                    log.debug('packSizeOrderText', packSizeOrderText)
                    log.debug('totalOrder', totalOrder);
                    log.debug('setRatePackSize', setRatePackSize)
                    var totalPackagingCount = Number(totalOrder) / Number(setRatePackSize);
                    log.debug('totalPackagingCount', totalPackagingCount)
                    currentRecordObj.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_iss_pr_parent',
                        fieldId: 'custrecord_iss_total_order_formula',
                        value: totalPackagingCount
                    });
                    currentRecordObj.commitLine({ sublistId: 'recmachcustrecord_iss_pr_parent' });
                    
                    
                });
            }
            
        }
        var scriptObj = runtime.getCurrentScript();
        log.debug({
            title: "Remaining usage units: ",
            details: scriptObj.getRemainingUsage(),
        });
    }
    return {
        pageInit: pageInit,
        calculate: calculate
    };
});
