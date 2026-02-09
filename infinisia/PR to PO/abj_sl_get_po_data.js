/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/log', 'N/record'], function(search, log, record) {

    function onRequest(context) {
        if (context.request.method === 'POST') {
            try {
                // 1. Ambil data yang dikirim dari Client Script
                const requestBody = JSON.parse(context.request.body);
                const allIdSummary = requestBody.allIdSummary;
                const currencyId = requestBody.currencyId;
                
                log.debug('Request Received', requestBody);

                let PO_lines = [];
                let itemIds = [];
                let itemData = {};
                let exchangeRate = 1;

                // 2. Jalankan Search Utama (PR to PO)
                if (allIdSummary && allIdSummary.length > 0) {
                    let prToPO = search.load({ id: "customsearch1094" });
                    
                    // Menambahkan filter dynamic
                    prToPO.filters.push(search.createFilter({
                        name: "internalid",
                        join: "custrecord_iss_pr_parent",
                        operator: search.Operator.ANYOF,
                        values: allIdSummary
                    }));

                    let prToPOSet = prToPO.run();
                    // Mengambil kolom untuk referensi index (sesuai logic lama)
                    let columns = prToPOSet.columns; 
                    let results = prToPOSet.getRange({ start: 0, end: 300 });

                    if (results.length > 0) {
                        results.forEach(res => {
                            // Logic mapping persis seperti Client Script lama
                            let itemID = res.getValue(columns[0]);
                            let qtyPO = res.getValue(columns[26]) || 0;
                            // Kolom 36 atau 41
                            let ratePackSIze = parseFloat(res.getValue(columns[36])) || parseFloat(res.getValue(columns[41])) || 0;
                            let cekTotalPackaging = res.getValue(columns[34]) || 0;
                            let totalPackaging = Math.abs(parseFloat(cekTotalPackaging)) - parseFloat(qtyPO);

                            if (itemID) itemIds.push(itemID);

                            PO_lines.push({
                                itemID: itemID,
                                internalIDPR: res.getValue(columns[10]),
                                currentStock: res.getValue(columns[2]),
                                lineId: res.getValue(columns[28]),
                                incomingStock: res.getValue(columns[3]),
                                forecastBusdev: res.getValue(columns[6]),
                                leadTimeKirim: res.getValue(columns[15]),
                                forecastPerhitungan: res.getValue(columns[7]),
                                avgBusdev: res.getValue(columns[8]),
                                osPO: res.getValue(columns[11]),
                                customerID: res.getValue(columns[26]), // Hati-hati, di script asli index 26 dipakai utk qtyPO & customerID? Cek kembali indexnya jika error.
                                soNO: res.getValue(columns[18]),
                                tanggalKirim: res.getValue(columns[21]),
                                salesRepID: res.getValue(columns[4]),
                                packSize: res.getValue(columns[22]),
                                soNumber: res.getValue(columns[18]),
                                poCust: res.getValue(columns[33]),
                                units: res.getValue(columns[16]),
                                ratePackSIze: ratePackSIze,
                                totalOrder: (totalPackaging * ratePackSIze),
                                totalPackaging: totalPackaging
                            });
                        });
                    }
                }

                // 3. Jalankan Search Item (Last Purchase Price)
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

                // 4. Cari Exchange Rate
                if (currencyId) {
                    let currSearch = search.lookupFields({
                        type: "currency",
                        id: currencyId,
                        columns: ['exchangerate']
                    });
                    exchangeRate = parseFloat(currSearch.exchangerate) || 1;
                }

                // 5. Kembalikan data ke Client Script
                context.response.write(JSON.stringify({
                    status: 'success',
                    PO_lines: PO_lines,
                    itemData: itemData,
                    exchangeRate: exchangeRate
                }));

            } catch (e) {
                log.error('Error in Suitelet', e);
                context.response.write(JSON.stringify({
                    status: 'error',
                    message: e.message
                }));
            }
        }
    }

    return {
        onRequest: onRequest
    };
});