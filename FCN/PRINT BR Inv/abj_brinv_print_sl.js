/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
  function(render, search, record, log, file, http, config, format, email, runtime) {
        function onRequest(context) {
            var recid = context.request.parameters.id;
            log.debug('recid', recid);
            log.debug('masuk');

            var vendPayment = record.load({
                type: "customerpayment",
                id: recid,
                isDynamic: false,
              });
              var subsidiari = vendPayment.getValue('subsidiary');
            log.debug('subsidiary', subsidiari);
            if (subsidiari) {
                var subsidiariRec = record.load({
                  type: "subsidiary",
                  id: subsidiari,
                  isDynamic: false,
                });
                var legalName = subsidiariRec.getValue('legalname');
                var addresSubsidiaries = subsidiariRec.getValue('mainaddress_text');
                var retEmailAddres = subsidiariRec.getValue('email');

                var logo = subsidiariRec.getValue('logo');
                var filelogo;
                var urlLogo = '';
                if (logo) {
                    filelogo = file.load({
                        id: logo
                    });
                    urlLogo = filelogo.url.replace(/&/g, "&amp;");
                }
            }

            var noPayment = vendPayment.getValue('tranid');
            var paidTOid = vendPayment.getValue("customer");
            if(paidTOid){
                var paidTO
                var venRec = record.load({
                    type: "customer",
                    id: paidTOid,
                    isDynamic: false,
                  });
                  var isPerson = venRec.getValue("isperson");
                  log.debug('isperson', isPerson)
                  if(isPerson == 'T'){
                    var firstName = venRec.getValue("firstname");
                    var lastName = venRec.getValue("lastname");
                    paidTO = firstName + ' ' + lastName
                  }else{
                    paidTO = venRec.getValue('companyname');
                  }
                  
                  log.debug('paidTO', paidTO);
            }
            var dateNet = vendPayment.getValue('trandate');
            
            function sysDate() {
                var date = dateNet;
                var tdate = date.getUTCDate();
                var month = date.getUTCMonth() + 1; // jan = 0
                var year = date.getUTCFullYear();
                return tdate + '/' + month + '/' + year;
              }
              dateNet = sysDate();
              log.debug('date', dateNet);
              function ubahFormatTanggal(tanggal) {
                const tanggalArr = tanggal.split('/');
                const hari = tanggalArr[0];
                const bulan = tanggalArr[1];
                const tahun = tanggalArr[2];
              
                // Daftar nama bulan dalam Bahasa Indonesia
                const daftarBulan = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December'
                ];
              
                const namaBulan = daftarBulan[parseInt(bulan) - 1];
              
                const tanggalFormatted = (hari < 10 ? '0' : '') + hari;
              
                const tanggalFinal = tanggalFormatted + ' ' + namaBulan + ' ' + tahun;
              
                return tanggalFinal;
              }
              
              const tanggalAwal = dateNet;
              const tanggalAkhir = ubahFormatTanggal(tanggalAwal);
              log.debug('dateFormat', tanggalAkhir)
              

            var amount = vendPayment.getValue("applied");

            log.debug('amount', amount);

            function convertToEnglish(amount) {
                var numberNames = {
                  0: 'ZERO',
                  1: 'ONE',
                  2: 'TWO',
                  3: 'THREE',
                  4: 'FOUR',
                  5: 'FIVE',
                  6: 'SIX',
                  7: 'SEVEN',
                  8: 'EIGHT',
                  9: 'NINE',
                  10: 'TEN',
                  11: 'ELEVEN',
                  12: 'TWELVE',
                  13: 'THIRTEEN',
                  14: 'FOURTEEN',
                  15: 'FIFTEEN',
                  16: 'SIXTEEN',
                  17: 'SEVENTEEN',
                  18: 'EIGHTEEN',
                  19: 'NINETEEN',
                  20: 'TWENTY',
                  30: 'THIRTY',
                  40: 'FORTY',
                  50: 'FIFTY',
                  60: 'SIXTY',
                  70: 'SEVENTY',
                  80: 'EIGHTY',
                  90: 'NINETY',
                  100: 'HUNDRED',
                  1000: 'THOUSAND',
                  1000000: 'MILLION',
                  1000000000: 'BILLION'
                };
              
                function convertThreeDigit(num) {
                  var result = '';
                  if (num >= 100) {
                    result += numberNames[Math.floor(num / 100)] + ' HUNDRED ';
                    num %= 100;
                  }
                  if (num >= 20) {
                    result += numberNames[Math.floor(num / 10) * 10] + ' ';
                    num %= 10;
                  }
                  if (num > 0) {
                    result += numberNames[num] + ' ';
                  }
                  return result.trim();
                }
              
                function convertDecimal(num) {
                  var result = '';
                  if (num >= 20) {
                    result += numberNames[Math.floor(num / 10) * 10] + ' ';
                    num %= 10;
                  }
                  if (num > 0) {
                    result += numberNames[num];
                  }
                  return result.trim();
                }
              
                var result = '';
                var hasDecimal = false;
              
                if (amount === 0) {
                  result = numberNames[0];
                } else {
                  var billions = Math.floor(amount / 1000000000);
                  var millions = Math.floor((amount % 1000000000) / 1000000);
                  var thousands = Math.floor((amount % 1000000) / 1000);
                  var remaining = Math.floor(amount % 1000);
              
                  if (billions > 0) {
                    result += convertThreeDigit(billions) + ' BILLION ';
                  }
                  if (millions > 0) {
                    result += convertThreeDigit(millions) + ' MILLION ';
                  }
                  if (thousands > 0) {
                    result += convertThreeDigit(thousands) + ' THOUSAND ';
                  }
                  if (remaining > 0) {
                    result += convertThreeDigit(remaining);
                  }
              
                  // Handling decimal part
                  var decimalPart = Math.round((amount % 1) * 100);
                  if (decimalPart > 0) {
                    result += 'POINT ' + convertDecimal(decimalPart);
                    hasDecimal = true;
                  }
                }
              
                if (!hasDecimal) {
                  result += ' RUPIAH';
                }
                return result.trim();
              }
              
              var cashAmount = convertToEnglish(amount);
              log.debug('cashAmount', cashAmount);

              if(amount){
                amount = format.format({
                    value: amount,
                    type: format.Type.CURRENCY
                })
              }
              log.debug('amount CUrr', amount);
              
            var response = context.response;
            var xml = "";
            var header = "";
            var body = "";
            var headerHeight = '27%';
            var style = "";
            var footer = "";
            var pdfFile = null;

            style += "<style type='text/css'>";
            style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
            style += ".tg .tg-headerlogo{align:left; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            if(subsidiari == 1){
              style += ".tg .tg-img-logo{width:150px; height:111px; object-vit:cover;}";
            }else{
                style += ".tg .tg-img-logo{width:195px; height:90px; object-vit:cover;}";
            }
            style += ".tg .tg-headerrow{align:left;font-size:12px;}";
            style += ".tg .tg-headerrow_legalName{align:left;font-size:15px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
            style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
            style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
            style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
            style += "</style>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:50%'></td>"
            body += "<td style='width:50%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>";
            body += "<tr>";
            body += "<td>";
            body += "<p class='tg-headerrow_legalName' style='margin-top: 10px; margin-bottom: 10px;'>" + legalName + "</p>";
            body += "<p class='tg-headerrow' style='margin-top: 1px; margin-bottom: 1px; font-size:14px'>" + addresSubsidiaries + "<br/>";
            body += "e-mail : " + retEmailAddres + "</p>"
            body += "</td>";
            if (urlLogo) {
                body += "<td class='tg-headerlogo' style='width:50%; vertical-align:center; align:right;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img> </td>";
            }
            body += "</tr>";
            
            body += "<tr style='height:30px'>"
            body += "<td style='align: center; font-size: 14px; border-top: solid black 2px; border-bottom: solid black 2px; font-weight: bold; vertical-align: middle;' colspan='2'>CASH RECEIPT</td>"
            body += "</tr>"
            body += "<tr style='height:10px'></tr>"
            body += "<tr>"
            body += "<td style='align:center; font-size:14px;' colspan='2'>No. : "+ noPayment +"</td>"
            body += "</tr>"
            body += "<tr style='height:10px'></tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:4%'></td>"
            body += "<td style='width:26%'></td>"
            body += "<td style='width:3%'></td>"
            body += "<td style='width:50%'></td>"
            body += "<td style='width:18%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td>Received From</td>"
            body += "<td>:</td>"
            body += "<td>"+ paidTO +"</td>"
            body += "<td></td>"
            body += "</tr>";
            body += "<tr style='height:10px'></tr>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td>Cash Amount</td>"
            body += "<td>:</td>"
            body += "<td>"+ cashAmount +"</td>"
            body += "<td></td>"
            body += "</tr>";
            body += "<tr style='height:10px'></tr>"
            body += getApply(context, vendPayment);
            body += "<tr style='height:10px;'>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:15%'></td>"
            body += "<td style='width:25%'></td>"
            body += "<td style='width:20%'></td>"
            body += "<td style='width:40%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td style='align:center'>"+tanggalAkhir+"</td>"
            body += "</tr>"
            body += "<tr style='height: 45px'>"
            body += "<td style='align: center; font-size:14px; font-weight: bold; border-top-width: 1px; border-bottom-width: 1px; vertical-align: middle;'>Amount</td>"
            body += "<td style='align:center; font-size:14px; font-weight:bold; background-color:#d69506; border-top-width: 1px; border-bottom-width: 1px; vertical-align: middle;'>Rp. " + amount + "</td>";
            body += "<td></td>"
            body += "<td style='align:center;'>"+legalName+"</td>"
            body += "</tr>"
            body += "<tr style='height:20px'></tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:60%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:38%'></td>"
            body += "<td style='width:1%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr style='height:20px'></tr>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td>(</td>"
            body += "<td>Name :</td>"
            body += "<td>)</td>"
            body += "</tr>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td>(</td>"
            body += "<td>Position :</td>"
            body += "<td>)</td>"
            body += "</tr>"
            body += "</tbody>";
            body += "</table>";
            
            footer += "<table class='tg' style='table-layout: fixed;'>";
            footer += "<tbody>";
            footer += "<tr class='tg-foot'>";
            footer += "<td style='align:left'>Receive Payment #"+ noPayment +"</td>"
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
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' footer='nlfooter' footer-height='3%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });
        }
        function getApply(context, vendPayment){
            var body = "";
            var applyCount = vendPayment.getLineCount({
                sublistId: 'apply'
              });

            log.debug('applycount', applyCount);
            if(applyCount > 0){
                
                var refnums = [];
                for (var index = 0; index < applyCount; index++) {
                    var isApply = vendPayment.getSublistValue({
                        sublistId : 'apply',
                        fieldId : 'apply',
                        line : index
                    });
                    log.debug('isApply', isApply);
                    if(isApply === true){
                        var refnum = vendPayment.getSublistValue({
                            sublistId: 'apply',
                            fieldId: 'refnum',
                            line: index
                        });
                        refnums.push("Sales Invoice #" + refnum);
                    }
                    
                }

                var body = "<tr>";
                body += "<td></td>"
                body += "<td>Payment For</td>";
                body += "<td>:</td>";
                body += "<td>" + refnums.join(", ") + "</td>";
                body += "<td></td>";
                body += "</tr>";

                return body;
            }
            
        }
    return {
        onRequest: onRequest,
    };
});