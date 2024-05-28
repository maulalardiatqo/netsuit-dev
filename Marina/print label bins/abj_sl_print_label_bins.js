/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
    function onRequest(context) {
        var allData = JSON.parse(context.request.parameters.allData);
        log.debug('allData', allData);
        
        var xmlStr = '<?xml version="1.0"?>';
        xmlStr += '<pdf>';
        xmlStr += '<body size="A4" margin="1in">';
        xmlStr += '<table width="100%">';

        for (var i = 0; i < allData.length; i += 4) {
            xmlStr += '<tr>';

            for (var j = 0; j < 3; j++) {
                if (i + j < allData.length) {
                    xmlStr += '<td align="center">';
                    xmlStr += '<p style="align:center; font-size:8px">' + allData[i + j].subsidiary + '</p>';
                    xmlStr += generateBarcode(allData[i + j].nomor);
                    xmlStr += '</td>';
                } else {
                    xmlStr += '<td></td>'; 
                }
            }

            xmlStr += '</tr>';
        }

        xmlStr += '</table>';
        xmlStr += '</body>';
        xmlStr += '</pdf>';

        var pdfFile = render.xmlToPdf({
            xmlString: xmlStr
        });

        context.response.writeFile(pdfFile, true);
    }

    function generateBarcode(data) {
        var barcodeImage = "<barcode codetype='code128' showtext='true' height='50' width='100' value='" + data + "' />";
        return barcodeImage;
    }

    return {
        onRequest: onRequest,
    };
});
