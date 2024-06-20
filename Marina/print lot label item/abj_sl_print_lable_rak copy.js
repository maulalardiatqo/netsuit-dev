/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
    function onRequest(context) {
        var dataBarcodeString = context.request.parameters.custscript_list_item_to_print;
        var dataBarcode = JSON.parse(dataBarcodeString);
        log.debug("dataBarcode", dataBarcode);
    
        var xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
        xml += '<pdf>';
        xml += '<head>';
        xml += '<style type="text/css">';
    
        xml += 'body {font-family: sans-serif; margin: 0; padding: 0; width: 70mm; height: 30mm;}';
        xml += 'table {width: 100%; height: 100%; border-collapse: collapse;}'; 
        xml += 'td {padding: 0; vertical-align: middle;}'; 
        xml += '.green {/* green */ height: 28.57%; font-size: 5pt; text-align: center; font-weight:bold;}';
        xml += '.yellow { /* yellow */ height: 71.43%; font-size: 8pt; padding: 2mm; font-weight:bold;}';
        xml += '.itemName {font-size: 9pt; font-weight:bold;}';
    
        xml += '</style>';
        xml += '</head>';
        dataBarcode.forEach(function (item) {
            var countLine = item.countLabel;
            log.debug('countLine', countLine);
            for(var i = 0; i < countLine; i++){
                xml += '<body size="custom" width="75mm" height="35mm">';
    
                xml += '<table>';
                xml += '<tr style="height:25%">';
                xml += '<td class="green" style="align:center">';
            
                dataBarcode.forEach(function (item) {
                    xml += item.internalID + ' / ' + item.upcCode + ' / ' + formatDate(new Date()) + ' <br/>'; 
                    xml += '<span class="itemName">' + item.itemName + '</span>';
                });
            
                xml += '</td>';
                xml += '</tr>';
                xml += '<tr style="height:75%">';
                xml += '<td class="yellow">';
            
                dataBarcode.forEach(function (item) {
                    item.rangeHarga.forEach(function (hargaItem) {
                        log.debug('batasVolume bef', hargaItem.batasVolume);
                        var batasVolume = hargaItem.batasVolume == 0 ? 1 : hargaItem.batasVolume;
                        log.debug('batasVolume', batasVolume);
                        xml += '<table>';
                        xml += '<tr>';
                        xml += '<td style="width:20%"></td>';
                        xml += '<td style="width:40%">' + batasVolume + ' PCS</td>';
                        xml += '<td style="width:20%; align:right;">Rp.</td>';
                        xml += '<td style="background-color:black; color:white; width:20%; padding-left:1mm">' + hargaItem.harga + '</td>';
                        xml += '</tr>';
                        xml += '</table>';
                    });
                });
            
                xml += '</td>';
                xml += '</tr>';
                xml += '</table>';
            
                xml += '</body>';
            }
        });
       

        
        xml += '</pdf>';
    
        var renderer = render.create();
        renderer.templateContent = xml;
        var pdfFile = renderer.renderAsPdf();
    
        context.response.writeFile(pdfFile, true);
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
