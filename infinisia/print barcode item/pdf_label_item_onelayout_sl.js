/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
  function onRequest(context) {
    var dataBarcodeString = context.request.parameters.custscript_list_item_to_print;
    var dataBarcode = JSON.parse(dataBarcodeString);
    
    // Fungsi pembantu untuk detail item (Hanya mengembalikan isi tabel)
    function getItemDetails(itemCode, itemName, lotNumber, location) {
      return `
        <table width="100%" height="100%">
            <tr>
                <td align="center" valign="middle" style="padding: 0; margin: 0;">
                    <barcode style="padding-top: 2mm; margin-bottom:0;" bar-width="1.3" height="20" codetype="code128" showtext="false" value="${lotNumber}" />
                    <span style="font-size: 8pt; text-transform: uppercase;">INV. ID : ${itemCode}</span><br/>
                    <span style="font-size: 8pt; text-transform: uppercase;">${itemName.substring(0, 35)}</span><br/>
                    <span style="font-size: 8pt; text-transform: uppercase;">${lotNumber}</span><br/>
                    <span style="font-size: 4pt; text-transform: uppercase;">${location}</span><br/>
                    <span style="font-size: 8pt; font-weight: bold; text-transform: uppercase;">PT. INFINISIA SUMBER SEMESTA</span>
                </td>
            </tr>
        </table>`;
    }

    var style = `
    <style type="text/css">
        * { font-family: Arial, sans-serif; }
        table { border: none; border-collapse: collapse; margin: 0; padding: 0; }
    </style>`;

    var allPagesXml = "";

    // Loop data stiker
    for (var i = 0; i < dataBarcode.length; i++) {
      var item = dataBarcode[i];
      var count = parseInt(item.countLabel) || 0;

      // Loop sebanyak jumlah print (countLabel)
      for (var j = 0; j < count; j++) {
        var content = getItemDetails(item.itemCode, item.itemName, item.lotNumber, item.location);
        
        // Bungkus setiap satu item dalam tag <pdf> tersendiri
        allPagesXml += `
        <pdf>
            <head>
                ${style}
            </head>
            <body padding="0mm 2mm 0mm 2mm" size="custom" width="60mm" height="30mm">
                ${content}
            </body>
        </pdf>`;
      }
    }

    var xml = `<?xml version="1.0"?>
    <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
    <pdfset>
        ${allPagesXml}
    </pdfset>`;

    // Bersihkan karakter khusus agar tidak error XML
    xml = xml.replace(/ & /g, " &amp; ");

    context.response.renderPdf({
      xmlString: xml,
    });
  }

  return {
    onRequest: onRequest,
  };
});