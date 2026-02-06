/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(["N/record", "N/search", "N/runtime", "N/url", "N/format", "N/log"], function(record, search, runtime, url, format, log) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const processPOLines = async (poData, PO_lines, itemData, exchangerate) => {
        const totalData = PO_lines.length;
        console.log("Total data di array PO_lines:", totalData);

        for (let i = 0; i < totalData; i++) {
            const line = PO_lines[i];
            try {
                console.log(`>>> Memulai Proses Baris Index ${i} (Baris ke-${i + 1})`);
                poData.selectNewLine({ sublistId: 'item' });

                // 1. Set Item (Trigger Sourcing)
                poData.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: line.itemID,
                    ignoreFieldChange: false 
                });

                await delay(1500);
                let lastPurchase = itemData[line.itemID]?.lastPurchasePrice || 0;
                let ratePerKG = (parseFloat(lastPurchase) || 0) / (parseFloat(exchangerate) || 1);
                let ratePerPackSize = ratePerKG * (parseFloat(line.ratePackSIze) || 0);
                let positiveQty = Math.abs(parseFloat(line.totalPackaging)) || 0;
                let amount = ratePerPackSize * positiveQty;

                const fieldMap = {
                    'custcol_abj_pr_number': line.internalIDPR,
                    'custcol_abj_onhand': line.currentStock,
                    'custcol_msa_id_line_from_pr': line.lineId,
                    'custcol5': line.incomingStock,
                    'custcol9': line.forecastBusdev,
                    'custcol8': line.leadTimeKirim,
                    'custcol_pr_rumus_perhitungan': line.forecastPerhitungan,
                    'custcol10': line.avgBusdev,
                    'custcol6': line.osPO,
                    'custcol_abj_no_so': line.soNO,
                    'custcol_abj_sales_rep_line': line.salesRepID,
                    'custcol_abj_pack_size_order': line.packSize,
                    'custcol_abj_sales_order_number': line.soNumber,
                    'custcol_abj_po_customer': line.poCust,
                    'quantity': positiveQty,
                    'custcol_pr_total_order': line.totalOrder,
                    'custcol_abj_rate_units_decimal': line.ratePackSIze,
                    'rate': ratePerPackSize,
                    'custcol_abj_purchase_price_per_kg': ratePerKG,
                    'amount': amount,
                    'taxcode': '5'
                };

                for (let fId in fieldMap) {
                    poData.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: fId,
                        value: fieldMap[fId],
                        ignoreFieldChange: true 
                    });
                }

                if (line.soNO) {
                    poData.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'customer',
                        value: line.customerID,
                        ignoreFieldChange: true
                    });
                    poData.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_abj_customer_line',
                        value: line.customerID,
                        ignoreFieldChange: true
                    });
                }

                if (line.tanggalKirim) {
                    poData.setCurrentSublistValue({ 
                        sublistId: 'item', 
                        fieldId: 'custcol14', 
                        value: line.tanggalKirim,
                        ignoreFieldChange: true 
                    });
                }

                let commitResult = poData.commitLine({ sublistId: 'item' });
                console.log(`Baris ${i + 1} commitResult: ${commitResult}. Total baris di grid sekarang: ${poData.getLineCount({sublistId: 'item'})}`);

                await delay(1000);

            } catch (e) {
                console.error(`Error baris ${i + 1}:`, e.message);
            }
        }

        poData.setValue({ fieldId: 'memo', value: poData.getValue('memo'), ignoreFieldChange: false });
        console.log("--- Seluruh proses selesai ---");
    };
    function pageInit(context) {
        if (context.mode !== 'create') return;

        const poData = context.currentRecord;
        setTimeout(async () => {
            try {
                let allIdSummary = poData.getValue('custbody_all_id_summary');
                let isConvertFromPR = poData.getValue('custbody_convert_from_pr');
                log.debug('allIdSummary', allIdSummary)
                log.debug('isConvertFromPR', isConvertFromPR)
                if((allIdSummary.length > 0) && isConvertFromPR){
                    let PO_lines = [];
                    let itemIds = [];

                    let prToPO = search.load({ id: "customsearch1094" });
                    prToPO.filters.push(search.createFilter({
                        name: "internalid",
                        join: "custrecord_iss_pr_parent",
                        operator: search.Operator.ANYOF,
                        values: allIdSummary
                    }));

                    let prToPOSet = prToPO.run();
                    let results = prToPOSet.getRange(0, 300);
                    log.debug('results', results)
                    if (results.length > 0) {
                        results.forEach(res => {
                            let itemID = res.getValue(prToPOSet.columns[0]);
                            let qtyPO = res.getValue(prToPOSet.columns[26]) || 0;
                            let ratePackSIze = parseFloat(res.getValue(prToPOSet.columns[36])) || parseFloat(res.getValue(prToPOSet.columns[41])) || 0;
                            let cekTotalPackaging = res.getValue(prToPOSet.columns[34]) || 0;
                            let totalPackaging = Math.abs(parseFloat(cekTotalPackaging)) - parseFloat(qtyPO);

                            if (itemID) itemIds.push(itemID);

                            PO_lines.push({
                                itemID: itemID,
                                internalIDPR: res.getValue(prToPOSet.columns[10]),
                                currentStock: res.getValue(prToPOSet.columns[2]),
                                lineId: res.getValue(prToPOSet.columns[28]),
                                incomingStock: res.getValue(prToPOSet.columns[3]),
                                forecastBusdev: res.getValue(prToPOSet.columns[6]),
                                leadTimeKirim: res.getValue(prToPOSet.columns[15]),
                                forecastPerhitungan: res.getValue(res.columns[7]),
                                avgBusdev: res.getValue(res.columns[8]),
                                osPO: res.getValue(res.columns[11]),
                                customerID: res.getValue(res.columns[26]),
                                soNO: res.getValue(res.columns[18]),
                                tanggalKirim: res.getValue(res.columns[21]),
                                salesRepID: res.getValue(res.columns[4]),
                                packSize: res.getValue(res.columns[22]),
                                soNumber: res.getValue(res.columns[18]),
                                poCust: res.getValue(res.columns[33]),
                                units: res.getValue(res.columns[16]),
                                ratePackSIze: ratePackSIze,
                                totalOrder: (totalPackaging * ratePackSIze),
                                totalPackaging: totalPackaging
                            });
                        });
                    }
                    log.debug('PO_lines', PO_lines)
                    let itemData = {};
                    if (itemIds.length > 0) {
                        search.create({
                            type: "item",
                            filters: [["internalid", "anyof", [...new Set(itemIds)]]],
                            columns: ["lastpurchaseprice"]
                        }).run().each(res => {
                            itemData[res.id] = { lastPurchasePrice: res.getValue("lastpurchaseprice") };
                            return true;
                        });
                    }
                    let exchangerate = 1;
                    var currencySet = poData.getValue('currency')
                    log.debug('currencySet', currencySet)
                    if (currencySet) {
                        let currSearch = search.lookupFields({
                            type: "currency",
                            id: currencySet,
                            columns: ['exchangerate']
                        });
                        exchangerate = parseFloat(currSearch.exchangerate) || 1;
                    }
                    processPOLines(poData, PO_lines, itemData, exchangerate).then(() => {
                        console.log("Semua baris berhasil dicommit");
                    }).catch(err => {
                        console.error("Gagal memproses baris", err);
                    });
                    
                }
                

            } catch (e) {
                console.error("Error in pageInit", e);
            }
        }, 2000);
        
    }

    return {
        pageInit: pageInit
    };
});