/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
  function onRequest(context) {
    var dataBarcodeString = context.request.parameters.custscript_list_item_to_print;
    var dataBarcode = JSON.parse(dataBarcodeString);
    log.debug("dataBarcode", dataBarcode);
    function numberWithCommas(x) {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
      return x;
    }

    // function getItemDetails(internalID, itemPrice, itemName, lotNumber) {
    //   var formattedPrice = isNaN(itemPrice) ? "0" : numberWithCommas(itemPrice);
    //   return `
    //     <table height="15mm" width="33mm">
    //         <tr>
    //             <td colspan="2"><span style="font-size: 7pt; text-transform: uppercase; font-weight: bold;">${itemName}</span></td>
    //         </tr>
    //         <tr>
    //             <td colspan="2">
    //                 <barcode bar-width="1" height="15" codetype="code128" showtext="false" value="${internalID}" />
    //             </td>
    //         </tr>
    //         <tr>
    //             <td style="font-size: 6pt; text-align: left; font-weight: bold;">${internalID}</td>
    //             <td style="font-size: 6pt; text-align: right; font-weight: bold;">Rp. ${formattedPrice}</td>
    //         </tr>
    //     </table>
    // `;
    // }
    function getItemDetails(internalID, itemPrice, itemName, lotNumber) {
      var formattedPrice = isNaN(itemPrice) ? "0" : numberWithCommas(itemPrice);
      var displayID = internalID
      var barcodeValue = internalID
      return `
          <table height="15mm" width="33mm">
              <tr>
                  <td colspan="2"><span style="font-size: 7pt; text-transform: uppercase; font-weight: bold;">${itemName}</span></td>
              </tr>
              <tr>
                  <td colspan="2">
                      <barcode bar-width="1" height="15" codetype="code128" showtext="false" value="${barcodeValue}" />
                  </td>
              </tr>
              <tr>
                  <td style="font-size: 6pt; text-align: left; font-weight: bold;">${displayID}</td>
                  <td style="font-size: 6pt; text-align: right; font-weight: bold;">Rp. ${formattedPrice}</td>
              </tr>
          </table>
      `;
  }

    var response = context.response;
    var xml = "";
    var style = "";
    style += `
    <style type="text/css">
        * { font-family: Arial, sans-serif; }
        table { font-size: 9pt; table-layout: fixed; width: 100%; border: none; border-collapse: collapse; }
        b { font-weight: bold; color: #333333; }
    </style>
`;

    var pages = [];
    var currentPage = [];

    for (var i = 0; i < dataBarcode.length; i++) {
      var item = dataBarcode[i];
      var count = parseInt(item.countLabel);

      while (count > 0) {
        if (currentPage.length < 2) {
          currentPage.push(getItemDetails(item.internalID, item.itemPrice, item.itemName, item.lotNumber));
        } else {
          pages.push(currentPage);
          currentPage = [getItemDetails(item.internalID, item.itemPrice, item.itemName, item.lotNumber)];
        }
        count--;
      }
    }

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    var pageContent = pages
      .map((page) => {
        var pageRow1 = page[0] || "";
        var pageRow2 = page[1] || "";

        return `
        <pdf>
            <head>
                ${style}
            </head>
            <body padding="0mm 0mm 0mm 4mm" size="custom" width="72mm" height="15mm">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 0; margin: 0;">${pageRow1}</td>
                        <td style="padding: 0; margin: 0;">${pageRow2}</td>
                    </tr>
                </table>
            </body>
        </pdf>
    `;
      })
      .join("");

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
