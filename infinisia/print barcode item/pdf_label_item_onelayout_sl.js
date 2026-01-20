/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
  function onRequest(context) {
    var irID = context.request.parameters.id;
    var dataBarcode = [];
    
    // Search Inventory Detail
    var inventorydetailSearchObj = search.create({
      type: "inventorydetail",
      filters: [["transaction.internalid", "anyof", irID]],
      columns: [
        "inventorynumber",
        "binnumber",
        "status",
        "quantity",
        "itemcount",
        "expirationdate",
        search.createColumn({ name: "displayname", join: "item" }),
        "location",
        search.createColumn({ name: "itemid", join: "item" }),
        search.createColumn({ name: "internalid", join: "item" }),
        search.createColumn({
         name: "unit",
         join: "transaction",
         label: "Units"
      })
      ],
    });

    inventorydetailSearchObj.run().each(function (result) {
      let itemCode = result.getValue({ name: "displayname", join: "item" }) || "-";
      let itemName = result.getValue({ name: "itemid", join: "item" }) || "-";
      let itemInternalID = result.getValue({ name: "internalid", join: "item" }) || "-";
      let lotNumber = result.getText("inventorynumber") || "-";
      let location = result.getText("location") || "-";
      let binNumber = result.getText("binnumber") || "";
      let units = result.getValue({name: "unit", join: "transaction"}) || "";
      
      dataBarcode.push({
        itemCode: itemCode,
        itemName: itemName,
        lotNumber: lotNumber,
        location: location,
        binNumber: binNumber,
        itemInternalID: itemInternalID,
        countLabel: 1,
        units: units
      });
      return true;
    });

    // Fungsi HTML untuk Single Label
    function getItemDetails(itemCode, itemName, lotNumber, location, binNumber, units) {
      return `
        <table style="width: 100%; height: 100%;">
            <tr>
                <td align="center" valign="middle">
                    <barcode style="padding-bottom: 0; margin-bottom:0;" bar-width="1" height="20" codetype="code128" showtext="false" value="${lotNumber}" />
                    <span style="font-size: 4pt; text-transform: uppercase;">INV. ID : ${itemCode}</span><br/>
                    <span style="font-size: 4pt; text-transform: uppercase;">${itemName.substring(0, 25)} (${units})</span><br/>
                    <span style="font-size: 4pt; text-transform: uppercase;">${lotNumber}</span><br/>
                    <span style="font-size: 3pt; text-transform: uppercase;">${location}</span><br/>
                    <span style="font-size: 4pt; font-weight: bold; text-transform: uppercase;">PT. INFINISIA SUMBER SEMESTA</span>
                </td>
            </tr>
        </table>
      `;
    }

    var response = context.response;
    var style = `
    <style type="text/css">
        * { font-family: Arial, sans-serif; }
        table { font-size: 9pt; table-layout: fixed; width: 100%; border: none; border-collapse: collapse; }
        b { font-weight: bold; color: #333333; }
    </style>
    `;

    // Generate Array of Pages (Setiap item = 1 halaman)
    var pdfPages = [];

    for (var i = 0; i < dataBarcode.length; i++) {
      var item = dataBarcode[i];
      var count = parseInt(item.countLabel);

      // Jika quantity lebih dari 1, loop untuk membuat halaman sejumlah quantity
      while (count > 0) {
        var content = getItemDetails(item.itemCode, item.itemName, item.lotNumber, item.location, item.binNumber, item.units);
        
        // Push setiap label sebagai PDF block tersendiri
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

    // Gabungkan semua halaman
    var pageContent = pdfPages.join("");

    var xml = `<?xml version="1.0"?>
    <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
    <pdfset>
        ${pageContent}
    </pdfset>`;

    xml = xml.replace(/ & /g, " &amp; ");
    
    response.renderPdf({
      xmlString: xml,
    });
  }

  return {
    onRequest: onRequest,
  };
});