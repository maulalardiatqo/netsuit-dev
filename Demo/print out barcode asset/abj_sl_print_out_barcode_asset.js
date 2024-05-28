/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var allData = JSON.parse(context.request.parameters.allData);
            log.debug('allData', allData);

            function getItemDetails(nomor, subsidiary) {
                return `
                    <table height="28mm" width="33mm">
                        <tr>
                            <td style="padding-top: 2mm; align:center;">
                                <span style="font-size: 6pt; font-weight:bold; text-align:center;">${subsidiary}</span><br/>
                                <barcode style="padding-bottom: 0; margin-bottom:0;" bar-width="1" height="20" width="60" codetype="code128" showtext="false" value="${nomor}" /><br />
                                <span style="font-size: 5pt; font-weight:bold;">${nomor}</span><br/>
                            </td>
            
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
                table { font-size: 4pt; table-layout: fixed; width: 100%; border: none; border-collapse: collapse; }
                b { font-weight: bold; color: #333333; }
            </style>
        `;

        var pages = [];
        var currentPage = [];

        for (var i = 0; i < allData.length; i++) {
            var data = allData[i];
            var nomor = data.nomor
            var subsidiary = data.subsidiary
            if(currentPage.length < 2){
                currentPage.push(getItemDetails(nomor, subsidiary));
            }else{
                pages.push(currentPage);
                currentPage = [getItemDetails(nomor, subsidiary)];
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
            <body padding="4mm 0mm 0mm 4mm" size="custom" width="90mm" height="28mm">
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
    }

    function generateBarcode(data) {
        log.debug('data', data);
        var barcodeImage = "<barcode codetype='code128' showtext='true' height='50' width='100' value='" + data + "' />";
        log.debug('barcodeImage', barcodeImage);
        return barcodeImage;
    }

    return {
        onRequest: onRequest,
    };
});
