/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(["N/record", "N/runtime", "N/url", "N/https", "N/log"], 
function(record, runtime, url, https, log) {

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const processPOLines = async (poData, PO_lines, itemData, exchangerate) => {
        const totalData = PO_lines.length;
        console.log("Total data di array PO_lines:", totalData);
        log.debug('PO_lines', PO_lines)
        for (let i = 0; i < totalData; i++) {
            const line = PO_lines[i];
            try {
                console.log(`>>> Memulai Proses Baris Index ${i} (Baris ke-${i + 1})`);
                poData.selectNewLine({ sublistId: 'item' });

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
                    // 'custcol_abj_no_so': line.soNO,
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

                // if (line.soNO) {
                //     poData.setCurrentSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'customer',
                //         value: line.customerID,
                //         ignoreFieldChange: true
                //     });
                //     poData.setCurrentSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'custcol_abj_customer_line',
                //         value: line.customerID,
                //         ignoreFieldChange: true
                //     });
                // }

                if (line.tanggalKirim) {
                    var parts = line.tanggalKirim.split('/'); 
                    if(parts.length === 3) {
                        var tanggalObj = new Date(parts[2], parts[1] - 1, parts[0]);
                        poData.setCurrentSublistValue({ 
                            sublistId: 'item', 
                            fieldId: 'custcol14', 
                            value: tanggalObj,
                            ignoreFieldChange: true 
                        });
                    }
                }

                let commitResult = poData.commitLine({ sublistId: 'item' });
                console.log(`Baris ${i + 1} Committed. Grid count: ${poData.getLineCount({sublistId: 'item'})}`);

                await delay(1000);

            } catch (e) {
                log.debug('error processing line', e);
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
                let currencyId = poData.getValue('currency');

                log.debug('allIdSummary', allIdSummary);
                log.debug('isConvertFromPR', isConvertFromPR);

                if ((allIdSummary.length > 0) && isConvertFromPR) {
                    
                    let suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_abj_sl_get_po_data', 
                        deploymentId: 'customdeploy_abj_sl_get_po_data' 
                    });

                    console.log('Mengambil data dari server...');
                    
                    // Menggunakan https.post.promise agar async
                    let response = await https.post.promise({
                        url: suiteletUrl,
                        body: JSON.stringify({
                            allIdSummary: allIdSummary,
                            currencyId: currencyId
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    let responseBody = JSON.parse(response.body);

                    if (responseBody.status === 'success') {
                        console.log('Data diterima, memulai proses baris...', responseBody);
                        
                        // Panggil fungsi proses dengan data dari Suitelet
                        await processPOLines(
                            poData, 
                            responseBody.PO_lines, 
                            responseBody.itemData, 
                            responseBody.exchangeRate
                        );
                    } else {
                        console.error('Error dari Suitelet:', responseBody.message);
                        log.error('Suitelet Error', responseBody.message);
                    }
                }
            } catch (e) {
                console.error("Error in pageInit", e);
                log.error("Error in pageInit", e);
            }
        }, 2000);
    }

    return {
        pageInit: pageInit
    };
});