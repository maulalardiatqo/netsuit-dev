/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
    function removeDecimalFormat(number) {
        return number.toString().substring(0, number.toString().length - 3);
    }
    function pembulatan(angka) {
    if (angka >= 0) {
        var bulat = Math.floor(angka);
        var desimal = angka - bulat;
        
        if (desimal >= 0.5) {
            return Math.ceil(angka);
        } else {
        return Math.floor(angka);
        }
    } else {
        return Math.ceil(angka);
    }
    }
    function onRequest(context) {
        try{
            var recid = context.request.parameters.id;
            log.debug('recid', recid);
            var ifRec = record.load({
                type: "itemfulfillment",
                id: recid,
                isDynamic: false,
            });
            var companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
            });
            var legalName = companyInfo.getValue("legalname");

            log.debug('legalName', legalName);
            var logo = companyInfo.getValue('formlogo');
                    var filelogo;
                    var urlLogo = '';
                    if (logo) {
                        filelogo = file.load({
                            id: logo
                        });
                        //get url
                        urlLogo = filelogo.url.replace(/&/g, "&amp;");
                    }
            var addres = companyInfo.getValue("mainaddress_text");
            log.debug('addres', addres);

            var tranId = ifRec.getValue('tranid');
            var tranDate = ifRec.getValue('trandate');
            log.debug('trandate', tranDate)
            var jatuhTempo = new Date(tranDate);
            jatuhTempo.setDate(jatuhTempo.getDate() + 30);
            
            log.debug('jatuhTempo', jatuhTempo.toISOString());
            if(tranDate){
                tranDate = format.format({
                    value: tranDate,
                    type: format.Type.DATE
                });
            }
            if(jatuhTempo){
                jatuhTempo = format.format({
                    value: jatuhTempo,
                    type: format.Type.DATE
                });
            }
            var idCust = ifRec.getValue('entity');
            if(idCust){
                var recCust = record.load({
                    type : 'customer',
                    id : idCust,
                    isDynamic : false,
                });
                var custName = '';
                var isPerson = recCust.getValue('isperson');
                if(isPerson === true){
                    custName = recCust.getValue('comments');
                }else{
                    custName = recCust.getValue('companyname');
                }
                var custAdders = recCust.getValue('defaultaddress');
            }

            var soId = ifRec.getValue('createdfrom');
          

            var employeeName = '';
            if(soId){
                var recSo = record.load({
                    type: "salesorder",
                    id: soId,
                    isDynamic: false,
                });
                var employeeId = recSo.getValue('custbody_fcn_sales_employee');
                if(employeeId){
                    var recEmp = record.load({
                        type: "employee",
                        id: employeeId,
                        isDynamic: false,
                    });
                    employeeName = recEmp.getValue('altname');
                }
            }
                
            var response = context.response;
            var xml = '<?xml version="1.0"?>';
            xml += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            xml += '<pdfset>';
            xml += '<pdf>';
            xml += '<head>';
            xml += '<style type="text/css">';
            xml += 'body {font-family: "Calibri Light", sans-serif; width: 210mm; height: 140mm; padding-top: 20; margin: 0; padding-bottom: 0;}';
            xml += 'table {border-collapse: collapse;}'; 
            xml += 'td {padding: 0; margin: 0; vertical-align: middle; font-size: 8;}'; 
            xml += '</style>';
            xml += '</head>';
            xml += '<body size="custom" width="210mm" height="140mm">';
            

            xml += '<table cellpadding="0" cellspacing="0" width="100%">'
            xml += '<tr>';
            xml += '<td style="font-size:10pt; font-weight:bold; align:center;"><u>FAKTUR PENJUALAN</u></td>'
            xml += '</tr>';

            xml += '<tr style="height:2px">';
            xml += '</tr>';
            xml += '</table>';

            xml += '<table cellpadding="0" cellspacing="0" width="100%" style="font-size:10">'
            xml += '<tr>';
            xml += '<td style="width:60%"></td>'
            xml += '<td style="width:15%"></td>'
            xml += '<td style="width:25%"></td>'
            xml += '</tr>';

            xml += '<tr>';
            xml += '<td style="font-size:10; font-weight:bold">'+legalName+'</td>'
            xml += '<td style="">No. Faktur </td>'
            xml += '<td style="">:'+tranId+'</td>'
            xml += '</tr>';

            xml += '<tr>';
            xml += '<td style="font-size:9;">'+addres+'</td>'
            xml += '<td style="">Tgl. Faktur </td>'
            xml += '<td style="">:'+tranDate+'</td>'
            xml += '</tr>';

            xml += '<tr>';
            xml += '<td style="font-size:9; font-weight:bold"></td>'
            xml += '<td style="">Tgl. Tempo</td>'
            xml += '<td style="">:'+jatuhTempo+'</td>'
            xml += '</tr>';

            xml += '<tr>';
            xml += '<td style="font-size:9; font-weight:bold"></td>'
            xml += '<td style="">Pelanggan</td>'
            xml += '<td style="">:'+custName+'</td>'
            xml += '</tr>';
            xml += '<tr style="height:2px">';
            xml += '</tr>';
            xml += '</table>';

            xml += '<table width="100%" style="font-size:10pt; table-layout:fixed; padding:1mm; border-collapse:collapse; border-spacing: 0;">'
            xml += '<tr>';
            xml += '<td style="width:5%"></td>'
            xml += '<td style="width:10%"></td>'
            xml += '<td style="width:35%"></td>'
            xml += '<td style="width:15%"></td>'
            xml += '<td style="width:5%"></td>'
            xml += '<td style="width:8%"></td>'
            xml += '<td style="width:10%"></td>'
            xml += '<td style="width:12%"></td>'
            xml += '</tr>';

            xml += '<tr>';
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black; border-right:none;">No</td>'
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black; border-right:none;">Kode</td>'
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black; border-right:none;">Nama Barang</td>'
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black; border-right:none;">Harga Satuan</td>'
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black; border-right:none;">QTY</td>'
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black; border-right:none;">Satuan</td>'
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black; border-right:none;">Disc[%]</td>'
            xml += '<td style="font-size:8pt; font-weight:bold; align:center; border:1px solid black;">Jumlah</td>'
            xml += '</tr>';

            xml += getPOItem(context, ifRec, soId, employeeName);

            xml += '</table>';

            xml += '</body>';
            xml += '</pdf>';
            xml += '</pdfset>';
    
            xml = xml.replace(/ & /g, " &amp; ");
            response.renderPdf({
                xmlString: xml,
            });

        }catch(e){
            log.debug('error', e)
        }
    }

    function getPOItem(context, ifRec, soId, employeeName){
        var itemCount = ifRec.getLineCount({
            sublistId: 'item'
        });
        // log.debug('itemCount', itemCount);
        
        if(itemCount > 0){
            var xml = "";
            var nomor = 1
            var subtotal = 0;
            for(var index = 0; index < itemCount; index++){
                var itemCode = ifRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: index
                });
                var itemName = ifRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemname',
                    line: index
                });
                var qty = ifRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: index
                });
                var unit = ifRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitsdisplay',
                    line: index
                });
                var rate = 0;
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters:
                    [
                        ["type","anyof","SalesOrd"], 
                        "AND", 
                        ["internalid","anyof",soId], 
                        "AND", 
                        ["mainline","is","F"], 
                        "AND", 
                        ["taxline","is","F"], 
                        "AND", 
                        ["item.internalid","anyof",itemCode]
                    ],
                    columns:
                    [
                        search.createColumn({name: "rate", label: "Item Rate"})
                    ]
                });
                var searchResultCount = salesorderSearchObj.runPaged().count;
                log.debug("salesorderSearchObj result count",searchResultCount);
                salesorderSearchObj.run().each(function(result){
                    rate = result.getValue({
                        name: "rate"
                    })
                    return true;
                });
                var jumlah = Number(rate) * Number(qty);
                subtotal = Number(subtotal) + Number(jumlah);
                log.debug('jumlah', jumlah);
                if(rate){
                    rate = pembulatan(rate)
                    rate = format.format({
                        value: rate,
                        type: format.Type.CURRENCY
                    });
                }
                
                
                if(jumlah){
                    jumlah = pembulatan(jumlah)
                    jumlah = format.format({
                        value: jumlah,
                        type: format.Type.CURRENCY
                    });
                }

                xml += "<tr>";
                xml += "<td style='align:center; border:1px solid black; border-right:none; border-bottom:none; border-top:none;'>"+nomor+"</td>";
                xml += "<td style='align:center; border:1px solid black; border-right:none; border-bottom:none; border-top:none;'>"+itemCode+"</td>";
                xml += "<td style='border:1px solid black; border-right:none; border-bottom:none; border-top:none; padding:1mm'>"+itemName+"</td>";
                xml += "<td  style='align:right; border:1px solid black; border-right:none; border-bottom:none; border-top:none; padding:1mm'>"+removeDecimalFormat(rate)+"</td>";
                xml += "<td style='align:center; border:1px solid black; border-right:none; border-bottom:none; border-top:none;'>"+qty+"</td>";
                xml += "<td style='align:center; border:1px solid black; border-right:none; border-bottom:none; border-top:none;'>"+unit+"</td>";
                xml += "<td style='align:center; border:1px solid black; border-right:none; border-bottom:none; border-top:none;' ></td>";
                xml += "<td  style='align:right; border:1px solid black; border-bottom:none; border-top:none; padding:1mm'>"+removeDecimalFormat(jumlah)+"</td>";
                xml += "</tr>";

                nomor ++;
            }
            xml += "<tr>";
            xml += "<td style='border-top:1px solid black;' colspan='8'></td>"
            xml += "</tr>";
            if(subtotal){
                subtotal = pembulatan(subtotal)
                subtotal = format.format({
                    value: subtotal,
                    type: format.Type.CURRENCY
                });
            }
            function padToTwoDigits(num) {
                return num.toString().padStart(2, '0');
              }
              
              const now = new Date();
              const wibOffset = 7 * 60; 
              const localTimeOffset = now.getTimezoneOffset();
              const wibTime = new Date(now.getTime() + (wibOffset + localTimeOffset) * 60 * 1000);
              
              const day = padToTwoDigits(wibTime.getDate());
              const month = padToTwoDigits(wibTime.getMonth() + 1); 
              const year = wibTime.getFullYear();
              const hours = padToTwoDigits(wibTime.getHours());
              const minutes = padToTwoDigits(wibTime.getMinutes());
              
              const formattedDateTime = `${day}/${month}/${year}/${hours}:${minutes}`;
              log.debug('formattedDateTime', formattedDateTime)
            xml += "<tr>"
            xml += "<td colspan='8'>"
                xml += "<table width='100%' style='font-size:10pt; table-layout:fixed; padding:1mm; border-collapse:collapse; border-spacing: 0;'>"
                xml += "<tr>"

                xml += "<td style='width:3%'></td>"
                xml += "<td style='width:17%'></td>"
                xml += "<td style='width:3%'></td>"
                xml += "<td style='width:17%'></td>"
                xml += "<td style='width:3%'></td>"
                xml += "<td style='width:20%'></td>"
                xml += "<td style='width:4%'></td>"
                xml += "<td style='width:20%'></td>"
                xml += "<td style='width:12%'></td>"
                xml += "</tr>"

                xml += "<tr>"
                xml += "<td style=''></td>"
                xml += "<td style='align:center; '>Fakturing,</td>"
                xml += "<td style=''></td>"
                xml += "<td style='align:center; '>Pelanggan,</td>"
                xml += "<td style=''></td>"
                xml += "<td style='align:center; '>Mengetahui,</td>"
                xml += "<td style=''></td>"
                xml += "<td style='align:right; padding:1mm; border-top:1px solid black; border-left:1px solid black;'>Subtotal</td>"
                xml += "<td style='align:right; padding:1mm; border-top:1px solid black; border-left:1px solid black; border-right:1px solid black;'>"+removeDecimalFormat(subtotal)+"</td>"
                xml += "</tr>"

                xml += "<tr>"
                xml += "<td></td>"
                xml += "<td style='align:center'></td>"
                xml += "<td></td>"
                xml += "<td style='align:center'></td>"
                xml += "<td></td>"
                xml += "<td style='align:center'></td>"
                xml += "<td></td>"
                xml += "<td style='align:right; padding:1mm; border-left:1px solid black;'>Biaya Kirim</td>"
                xml += "<td style='align:right; padding:1mm; border-left:1px solid black; border-right:1px solid black;'></td>"
                xml += "</tr>"

                xml += "<tr>"
                xml += "<td></td>"
                xml += "<td style='align:center'></td>"
                xml += "<td></td>"
                xml += "<td style='align:center'></td>"
                xml += "<td></td>"
                xml += "<td style='align:center;'></td>"
                xml += "<td></td>"
                xml += "<td style='align:right; padding:1mm; border-left:1px solid black;'>Potongan</td>"
                xml += "<td style='align:right; padding:1mm; border-left:1px solid black; border-right:1px solid black;'></td>"
                xml += "</tr>"

                xml += "<tr>"
                xml += "<td></td>"
                xml += "<td style='align:center; border-bottom:1px solid black;'></td>"
                xml += "<td></td>"
                xml += "<td style='align:center; border-bottom:1px solid black;'></td>"
                xml += "<td></td>"
                xml += "<td style='align:center; border-bottom:1px solid black;'></td>"
                xml += "<td></td>"
                xml += "<td style='align:right; padding:1mm; border-left:1px solid black; border-bottom:1px solid black;'>Total</td>"
                xml += "<td style='align:right; padding:1mm;  border-left:1px solid black; border-right:1px solid black; border-bottom:1px solid black; '>"+removeDecimalFormat(subtotal)+"</td>"
                xml += "</tr>"

                xml += '<tr style="height:5px">';
                xml += '</tr>';

                xml += "<tr>"
                xml += "<td></td>"
                xml += "<td style='align:center;'>"+employeeName+"</td>"
                xml += "<td></td>"
                xml += "<td style='align:center;'></td>"
                xml += "<td></td>"
                xml += "<td style='align:center;'></td>"
                xml += "<td></td>"
                xml += "<td colspan='2' style='font-size:8pt'>Printed:"+formattedDateTime+"/"+employeeName+"</td>"
                xml += "</tr>"

                xml += "</table>"

            xml += "</td>"
            xml += "</tr>"
            


            return xml;
        }
        
    }
    return{
        onRequest : onRequest
    }
});