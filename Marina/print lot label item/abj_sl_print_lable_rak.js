/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
    function onRequest(context) {
        var dataBarcodeString = context.request.parameters.custscript_list_item_to_print;
        var dataBarcode = JSON.parse(dataBarcodeString);
        log.debug("dataBarcode", dataBarcode);
        function removeDecimalFormat(number) {
            return number.toString().substring(0, number.toString().length - 3);
        }
        var response = context.response;
        var xml = '<?xml version="1.0"?>';
        xml += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
        xml += '<pdfset>';
        
        dataBarcode.forEach(function (item) {
            var countLine = item.countLabel;
            log.debug('countLine', countLine);
            for (var i = 0; i < countLine; i++) {
                xml += '<pdf>';
                xml += '<head>';
                xml += '<style type="text/css">';
                xml += 'body {font-family: sans-serif; margin: 0; padding: 1mm 1mm 2mm 20mm; width: 91mm; height: 60mm;}';
                xml += 'table {border-collapse: collapse;}'; 
                xml += 'td {padding: 0; vertical-align: middle;}'; 
                xml += '.green {/* green */ height: 28.57%; font-size: 10pt; text-align: center; font-weight:bold;}';
                xml += '.yellow { /* yellow */ height: 71.43%; font-size: 14pt; padding: 0mm; font-weight:bold;}';
                xml += '.itemName {font-size: 10pt; font-weight:bold;}';
                xml += '</style>';
                xml += '</head>';
                xml += '<body padding="1mm 2mm 0mm 20mm" size="custom" width="91mm" height="60mm">';
                
                xml += '<table width="100%" height="28.57%;" cellpadding="0" cellspacing="0">';
                xml += '<tr style="">';
                xml += '<td class="green" style="align:center;">';
                xml += item.internalID + ' / ' + item.upcCode + ' / ' + formatDate(new Date()) + ' <br/>'; 
                xml += '<span class="itemName">' + item.itemName + '</span>';
                xml += '</td>';
                xml += '</tr>';
                xml += '<tr style="height:5%">';
                xml += '</tr>';
                xml += '<tr style="height:15%">';
                xml += '<td class="yellow">';
                item.rangeHarga.forEach(function (hargaItem) {
                    log.debug('batasVolume bef', hargaItem.batasVolume);
                    var batasVolume = hargaItem.batasVolume == 0 ? 1 : hargaItem.batasVolume;
                    log.debug('batasVolume', batasVolume);
                    xml += '<table width="100%" height="71.43%" cellpadding="0" cellspacing="0">';
                    xml += '<tr>';
                    xml += '<td style="width:5%; "></td>';
                    xml += '<td style="width:45%; align:right;"> Rp. ' + removeDecimalFormat(hargaItem.harga) + '</td>';
                    xml += '<td style="width:15%;"></td>';
                    xml += '<td style="width:30%; padding-left:3mm; font-size:14pt">' + batasVolume + ' PCS</td>';
                    xml += '<td style="width:5%;"></td>';
                    xml += '</tr>';
                    xml += '</table>';
                });
                xml += '</td>';
                xml += '</tr>';
                xml += '</table>';
                
                xml += '</body>';
                xml += '</pdf>';
            }
        });

        xml += '</pdfset>';
    
        xml = xml.replace(/ & /g, " &amp; ");
        response.renderPdf({
            xmlString: xml,
        });
    }
    
    function formatDate(date) {
        var day = date.getDate();
        var month = date.getMonth() + 1; 
        var year = date.getFullYear();
        
        if (day < 10) {
            day = '0' + day;
        }
        if (month < 10) {
            month = '0' + month;
        }
        
        return day + '-' + month + '-' + year;
    }

    return {
        onRequest: onRequest,
    };
});
