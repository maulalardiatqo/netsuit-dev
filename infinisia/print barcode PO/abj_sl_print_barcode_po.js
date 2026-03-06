/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/render", "N/search", "N/record", "N/log"],
    (render, search, record, log) => {

        const onRequest = (context) => {
            try {
                const recid = context.request.parameters.id;
                if (!recid) return;

                const loadSetUp = record.load({
                    type: 'customrecord_setup_barcode_print',
                    id: '1'
                });

                let paddingSymbol = loadSetUp.getText('custrecord_padding_barcode');
                if (!paddingSymbol || paddingSymbol.toLowerCase() === 'space') {
                    paddingSymbol = ' ';
                }
                
                const itemNameMax = parseInt(loadSetUp.getValue('custrecord_barcode_item_length')) || 25;
                const lotNumberMax = parseInt(loadSetUp.getValue('custrecord_barcode_lot_length')) || 20;

                // 2. Search Inventory Detail
                const dataBarcode = [];
                const inventorydetailSearchObj = search.create({
                    type: "inventorydetail",
                    filters: [
                        ["transaction.internalid", "anyof", recid],
                        "AND",
                        ["transaction.type", "anyof", "PurchOrd"]
                    ],
                    columns: [
                        "inventorynumber",
                        "binnumber",
                        "location",
                        "quantity", 
                        search.createColumn({ name: "displayname", join: "item" }),
                        search.createColumn({ name: "itemid", join: "item" }),
                        search.createColumn({  name: "unit",
                        join: "transaction",})
                    ]
                });

                inventorydetailSearchObj.run().each((result) => {
                    let rawLot = result.getValue({ name: 'inventorynumber' }) || "";
                    let rawItemCode = result.getValue({ name: 'itemid', join: 'item' }) || "";
                    let rawItemName = result.getValue({ name: 'displayname', join: 'item' }) || "";
                    let qty = Math.abs(parseInt(result.getValue({ name: 'quantity' }))) || 1;

                    // Logika Substring/Max Length untuk Barcode Value
                    let cleanItemForBarcode = rawItemCode.substring(0, itemNameMax).trim();
                    let cleanLotForBarcode = rawLot.substring(0, lotNumberMax).trim();
                    let finalBarcodeValue = `${cleanItemForBarcode}${paddingSymbol}${cleanLotForBarcode}`;

                    dataBarcode.push({
                        barcodeValue: escapeXml(finalBarcodeValue),
                        itemCode: escapeXml(rawItemCode),
                        itemName: escapeXml(rawItemName),
                        lotNumber: escapeXml(rawLot),
                        location: escapeXml(result.getText({ name: 'location' }) || ""),
                        binNumber: escapeXml(result.getText({ name: 'binnumber' }) || ""),
                        units: escapeXml(result.getText({ name: 'unit', join: 'transaction' }) || ""),
                        countLabel: qty
                    });
                    return true;
                });

                if (dataBarcode.length === 0) {
                    context.response.write("Data tidak ditemukan.");
                    return;
                }

                // 3. Render PDF Logic
                const style = `
                    <style type="text/css">
                        * { font-family: Arial, sans-serif; }
                        table { font-size: 9pt; table-layout: fixed; width: 100%; border: none; border-collapse: collapse; }
                        b { font-weight: bold; color: #333333; }
                    </style>
                `;

                let pdfPages = [];

                for (let i = 0; i < dataBarcode.length; i++) {
                    let item = dataBarcode[i];
                    let count = item.countLabel;

                    // Cetak label sebanyak jumlah Quantity
                    while (count > 0) {
                        let content = getItemDetails(item);
                        pdfPages.push(`
                            <pdf>
                                <head>${style}</head>
                                <body padding="1mm" size="custom" width="60mm" height="30mm">
                                    ${content}
                                </body>
                            </pdf>
                        `);
                        count--;
                    }
                }

                const xml = `<?xml version="1.0"?>
                    <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
                    <pdfset>
                        ${pdfPages.join("")}
                    </pdfset>`;

                context.response.renderPdf({
                    xmlString: xml
                });

            } catch (e) {
                log.error('Error', e);
                context.response.write("Error: " + e.message);
            }
        };

        // Fungsi Helper Struktur Label
        const getItemDetails = (item) => {
            return `
                <table style="width: 100%; height: 100%;">
                    <tr>
                        <td align="center" valign="middle">
                            <barcode style="padding-bottom: 0; margin-bottom:0;" bar-width="0.6" height="20" codetype="code128" showtext="false" value="${item.barcodeValue}" />
                            <span style="font-size: 4pt; text-transform: uppercase;">INV. ID : ${item.itemCode}</span><br/>
                            <span style="font-size: 4pt; text-transform: uppercase;">${item.itemName.substring(0, 25)} (${item.units})</span><br/>
                            <span style="font-size: 4pt; text-transform: uppercase;">${item.lotNumber}</span><br/>
                            <span style="font-size: 3pt; text-transform: uppercase;">${item.location} - ${item.binNumber}</span><br/>
                            <span style="font-size: 4pt; font-weight: bold; text-transform: uppercase;">PT. INFINISIA SUMBER SEMESTA</span>
                        </td>
                    </tr>
                </table>
            `;
        };

        const escapeXml = (str) => {
            if (!str) return "";
            return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        return { onRequest };
    });