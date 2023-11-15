/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
      function onRequest(context) {
        var allidBin = JSON.parse(context.request.parameters.allidBin);
        log.debug('allIdBins', allidBin)
        var idBins = [];
        var copyBins = [];
        if (allidBin && Array.isArray(allidBin)) {
            for (var i = 0; i < allidBin.length; i++) {
                var binNumb = allidBin[i].binNumb;
                var copy = allidBin[i].copy;
                idBins.push(binNumb)
                copyBins.push({
                    binNumb : binNumb,
                    copy : copy
                })
                log.debug('Bin Numb', binNumb);
                log.debug('Copy', copy);
            }
        }
        log.debug('copybins', copyBins);
        var dataToProcess = [];
        var binSearchObj = search.create({
            type: "bin",
            filters:
            [
                ["internalid","anyof",idBins]
            ],
            columns:
            [
                search.createColumn({
                    name: "binnumber",
                    sort: search.Sort.ASC,
                    label: "Bin Number"
                }),
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "location", label: "Location"}),
                search.createColumn({name: "memo", label: "Memo"}),
                search.createColumn({name: "sequencenumber", label: "Sequence Number"}),
                search.createColumn({name: "type", label: "Type"}),
                search.createColumn({name: "zone", label: "Zone"})
            ]
        });
        var searchResultCount = binSearchObj.runPaged().count;
        log.debug("binSearchObj result count",searchResultCount);
        binSearchObj.run().each(function(result){
            var idBin = result.getValue({
                name: "internalid"
            })
            var binNumber = result.getValue({
                name: "binnumber"
            })
            var location = result.getText({
                name: "location"
            })
            log.debug('binNumb', binNumber);
            dataToProcess.push({
                idBin : idBin,
                binNumber : binNumber,
                location : location
            })
        return true;
        });
        var dataToPrint = [];

            dataToProcess.forEach((data) => {
                var binNumberToMatch = data.idBin; 
                var matchingCopy = copyBins.find((copy) => copy.binNumb === binNumberToMatch);

                if (matchingCopy) {
                    var numberOfCopies = matchingCopy.copy;

                    for (var i = 0; i < numberOfCopies; i++) {
                        dataToPrint.push({
                            idBin: data.idBin,
                            binNumber: data.binNumber,
                            location: data.location
                        });
                    }
                } else {
                    log.debug('No matching entry found for binNumber: ', binNumberToMatch);
                }
            });
            log.debug('Duplicated Data', dataToPrint);

            var response = context.response;
            var xml = "";
            var header = "";
            var body = "";
            var headerHeight = '1%';
            var style = "";
            var footer = "";
            var pdfFile = null;

            style += "<style type='text/css'>";
            style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
            style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-headerrow{align: right;font-size:12px;}";
            style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
            style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
            style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
            style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
            style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
            style += "</style>";

            header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            header += "<tbody>";
            header += "</tbody>";
            header += "</table>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            body += "<tbody>";

            if (dataToPrint.length > 0) {
                var itemsPerRow = 4; // Tentukan berapa banyak barcodeImage per baris
                var rowCount = Math.ceil(dataToPrint.length / itemsPerRow);

                for (var i = 0; i < rowCount; i++) {
                    body += "<tr>";

                    for (var j = 0; j < itemsPerRow; j++) {
                        var dataIndex = i * itemsPerRow + j;
                        if (dataIndex < dataToPrint.length) {
                            var data = dataToPrint[dataIndex];
                            var binNumb = data.binNumber;
                            var location = data.location;
                            var dataForBin = location + "-" + binNumb;
                            log.debug('binNumb', binNumb);
                            var barcodeImage = generateBarcode(dataForBin);

                            body += "<td>" + barcodeImage + "</td>";
                        }
                    }

                    body += "</tr>";
                }
            }

            body += "</tbody>";
            body += "</table>";

            footer += "<table class='tg' style='table-layout: fixed;'>";
            footer += "<tbody>";
            footer += "<tr class='tg-foot'>";
            footer += "<td style='align:right'></td>"
            footer += "</tr>";
            footer += "</tbody>";
            footer += "</table>";

            var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            xml += "<pdf>";
            xml += "<head>";
            xml += style;
            xml += "<macrolist>";
            xml += "<macro id=\"nlheader\">";
            xml += header;
            xml += "</macro>";
            xml += "<macro id=\"nlfooter\">";
            xml += footer;
            xml += "</macro>";
            xml += "</macrolist>";
            xml += "</head>"
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });
        
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