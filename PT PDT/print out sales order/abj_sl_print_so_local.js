/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/record',
    'N/render',
    'N/file',
    'N/log'
], function (record, render, file, log) {

    // =========================================================
    // HELPER FUNCTIONS 
    // =========================================================
    function escapeXmlSymbols(input) {
        if (input === null || input === undefined || input === '') return '';
        var strValue = String(input);
        
        if(strValue.indexOf('<b>') > -1 || strValue.indexOf('<br') > -1 || strValue.indexOf('&nbsp;') > -1) {
            strValue = strValue.replace(/&(?!amp;|lt;|gt;|quot;|apos;|nbsp;|#\d+;)/g, '&amp;');
            return strValue; 
        }

        return strValue
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function formatTextBreak(text) {
        if (!text) return '';
        return escapeXmlSymbols(text).replace(/\r?\n/g, '<br/>');
    }

    function formatNumber(num) {
        if (!num) return '0.00';
        var parsed = parseFloat(num);
        if (isNaN(parsed)) return num;
        return parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function convertToWords(n) {
        var string = n.toString();
        var parts = string.split('.');
        var intPart = parseInt(parts[0], 10) || 0;
        var decPart = parseInt(parts[1], 10) || 0;

        var units = [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen' ];
        var tens = [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ];
        var scales = [ '', 'Thousand', 'Million', 'Billion', 'Trillion' ];
        
        if (intPart === 0) return 'Zero';

        var str = intPart.toString();
        var start = str.length;
        var chunks = [];
        while (start > 0) {
            var end = start;
            chunks.push(str.slice((start = Math.max(0, start - 3)), end));
        }
        
        var wordsList = [];
        for (var i = 0; i < chunks.length; i++) {
            var chunk = parseInt(chunks[i]);
            if (chunk) {
                var ints = chunks[i].split('').reverse().map(parseFloat);
                if (ints[1] === 1) { ints[0] += 10; }
                if (scales[i]) { wordsList.push(scales[i]); }
                if (units[ints[0]]) { wordsList.push(units[ints[0]]); }
                if (tens[ints[1]]) { wordsList.push(tens[ints[1]]); }
                if (units[ints[2]]) { wordsList.push(units[ints[2]] + ' Hundred'); }
            }
        }
        var finalWords = wordsList.reverse().join(' ').replace(/\s+/g, ' ').trim();
        
        if (decPart > 0) {
            var paddedDec = parts[1].length === 1 ? parts[1] + '0' : parts[1].substring(0,2);
            finalWords += ' And ' + paddedDec + '/100';
        }
        return finalWords;
    }

    // =========================================================
    // MAIN REQUEST
    // =========================================================
    function onRequest(context) {
        var response = context.response;
        var request = context.request;

        try {
            var recId = request.parameters.recId || request.parameters.sys_id || request.parameters.id;
            if (!recId) {
                response.write('Error: Record ID is missing.');
                return;
            }

            var soRec = record.load({
                type: record.Type.SALES_ORDER,
                id: recId
            });

            // =========================================================
            // EXTRACT DATA FROM RECORD
            // =========================================================
            var subsId = soRec.getValue({ fieldId: 'subsidiary' });
            var companyName = '';
            var companyAddress = '';
            var logoHtml = '';

            if (subsId) {
                var subsRec = record.load({ type: record.Type.SUBSIDIARY, id: subsId });
                companyName = subsRec.getValue({ fieldId: 'name' }) || subsRec.getValue({ fieldId: 'legalname' }) || '';
                
                var addressRec = subsRec.getSubrecord({ fieldId: 'mainaddress' });
                if (addressRec) {
                    companyAddress = addressRec.getValue({ fieldId: 'addrtext' }) || '';
                } else {
                    companyAddress = subsRec.getValue({ fieldId: 'mainaddress_text' }) || '';
                }

                var logoId = subsRec.getValue({ fieldId: 'logo' });
                if (logoId) {
                    log.debug('logoId', logoId)
                    var fileObj = file.load({ id: logoId });
                    var safeLogoUrl = fileObj.url.replace(/&/g, '&amp;').replace(/&amp;amp;/g, '&amp;');
                    logoHtml = "<img src='" + safeLogoUrl + "' style='width: 90px; height: 40px; object-fit:contain;' />";
                } else {
                    logoHtml = "<div style='font-size:12px;font-weight:bold;'><span style='color:#1F4E79'>&#9679;</span><span style='color:#1F4E79'>&#9670;</span><span style='color:#1F4E79'> " + escapeXmlSymbols(companyName) + "</span></div>";
                }
            }

            var invoiceDate = soRec.getText({ fieldId: 'trandate' }) || soRec.getValue({ fieldId: 'trandate' }) || '';
            var poScNo = soRec.getValue({ fieldId: 'otherrefnum' }) || '';
            var invoiceNo = soRec.getValue({ fieldId: 'tranid' }) || '';
            var incoterms = soRec.getValue({ fieldId: 'custbody_pdt_incoterms' }) || '';
            var paymentTerms = soRec.getText({ fieldId: 'terms' }) || '';
            var shipmentSchedule = soRec.getValue({ fieldId: 'custbody_pdt_shipment_schedule' }) || '';
            var currency = soRec.getText({ fieldId: 'currency' }) || '';
            var shipVia = soRec.getText({ fieldId: 'custbody_pdt_ship_via' }) || '';
            var shipDate = soRec.getText({ fieldId: 'shipdate' }) || '';
            
            // UPDATE: Menggunakan getValue agar formatNumber berjalan baik
            var subTotal = soRec.getValue({ fieldId: 'subtotal' }) || 0;
            var taxTotal = soRec.getValue({ fieldId: 'taxtotal' }) || 0;

            var billToAddress = soRec.getValue({ fieldId: 'billaddress' }) || '';
            var shipToAddress = soRec.getValue({ fieldId: 'shipaddress' }) || '';

            var total = soRec.getValue({ fieldId: 'total' }) || 0;
            var words = convertToWords(total);

            // EXTRACT CATATAN DAN INFO BANK BARU
            var descriptionNotes = soRec.getValue({ fieldId: 'custbody_pdt_notes' }) || '';
            var bankAccNo = soRec.getValue({ fieldId: 'custbody_pdt_trx_bank_account_number' }) || '';
            var bankName = soRec.getValue({ fieldId: 'custbody_pdt_trx_bank_account_name' }) || '';
            var bankAddress = soRec.getValue({ fieldId: 'custbody_pdt_trx_bank_account_address' }) || '';
            var bankSwift = soRec.getValue({ fieldId: 'custbody_pdt_trx_bank_account_swift_co' }) || '';

            var authBy = soRec.getValue({ fieldId: 'custbody_pdt_authorized_by' }) || '';
            var empName = '';
            
            if (authBy) {
                var loadEmp = record.load({
                    type: "employee",
                    id: authBy
                });
                var nameOrig = loadEmp.getValue('nameorig');
                if (nameOrig) {
                    empName = nameOrig;
                }
            }

            // =========================================================
            // BUILD HTML VARIABLES
            // =========================================================
            var xml = "";
            var header = "";
            var body = "";
            var footer = "";
            var style = "";
            var headerHeight = "63mm";
            var footerHeight = "50mm";

            // CSS 
            style += "<style type='text/css'>";
            style += "*{padding : 0; margin:0;}";
            style += "body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #000000; padding-left:5px; padding-right:5px;}";
            style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
            style += "</style>";

            // ---------------------------------------------------------
            // HEADER MACRO
            // ---------------------------------------------------------
            header += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:10px;\">";
            header += "<tbody>";
            
            header += "<tr>";
            header += "<td style='width:15%;'></td>"; 
            header += "<td style='width:45%;'></td>"; 
            header += "<td style='width:40%;'></td>"; 
            header += "</tr>";

            header += "<tr>";
            header += "<td valign='middle'>" + logoHtml + "</td>";
            header += "<td valign='top' style='border: 1px solid #000000; padding: 0;'>";

            header += "<table width='100%' cellpadding='3' cellspacing='0' style='width: 100%; border: none;'>";

            header += "<tr>";
            header += "<td style='font-size: 12px; font-weight: bold; border-bottom: 1px solid #000000;'>" + escapeXmlSymbols(companyName) + "</td>";
            header += "</tr>";

            // Baris 2 untuk Company Address
            header += "<tr>";
            header += "<td style='font-size: 10px;'>" + formatTextBreak(companyAddress) + "</td>";
            header += "</tr>";

            // Menutup tabel bersarang
            header += "</table>";

            header += "</td>";
            header += "<td valign='bottom' align='left' style='font-size: 22px; font-weight: bold; padding-bottom: 2px; padding-left: 15px;'>PROFORMA INVOICE</td>";
            header += "</tr>";
            header += "</tbody>";
            header += "</table>";

            header += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:10px; margin-top:6px;\">";
            header += "<tbody>";
            
            header += "<tr>";
            header += "<td style='width:10%;'></td>"; 
            header += "<td style='width:2%;'></td>";  
            header += "<td style='width:38%;'></td>"; 
            header += "<td style='width:4%;'></td>";  
            header += "<td style='width:23%;'></td>"; 
            header += "<td style='width:23%;'></td>"; 
            header += "</tr>";

            header += "<tr>";
            header += "<td valign='top' style='padding-top:4px;'>Bill To</td>";
            header += "<td valign='top' style='padding-top:4px;'>:</td>";
            header += "<td valign='top' style='border: 1px solid #000000; padding: 4px;' rowspan='2'>" + formatTextBreak(billToAddress) + "</td>";
            header += "<td></td>";
            header += "<td style='border: 1px solid #000000; padding: 3px;'><b>Invoice Date</b><br/>" + escapeXmlSymbols(invoiceDate) + "</td>";
            header += "<td style='border: 1px solid #000000; padding: 3px; border-left:none;'><b>Invoice No.</b><br/>" + escapeXmlSymbols(invoiceNo) + "</td>";
            header += "</tr>";

            header += "<tr>";
            header += "<td></td><td></td>"; 
            header += "<td></td>";
            header += "<td style='border: 1px solid #000000; padding: 3px; border-top:none;'><b>Terms FOB</b><br/>" + escapeXmlSymbols(invoiceNo) + "</td>";
            header += "<td style='border: 1px solid #000000; padding: 3px; border-top:none; border-left:none;'><b></b><br/></td>";
            header += "</tr>";

            header += "<tr><td colspan='6' style='height:4px;'></td></tr>";

            header += "<tr>";
            header += "<td valign='top' style='padding-top:4px;'>Ship To</td>";
            header += "<td valign='top' style='padding-top:4px;'>:</td>";
            header += "<td valign='top' style='border: 1px solid #000000; padding: 4px;' rowspan='2'>" + formatTextBreak(shipToAddress) + "</td>";
            header += "<td></td>";
            header += "<td style='border: 1px solid #000000; padding: 3px;'><b>Ship Via</b><br/>" + escapeXmlSymbols(shipVia) + "</td>";
            header += "<td style='border: 1px solid #000000; padding: 3px; border-left:none;'><b>Ship Date</b><br/>" + escapeXmlSymbols(shipDate) + "</td>";
            header += "</tr>";

            header += "<tr>";
            header += "<td></td><td></td>";
            header += "<td></td>";
            header += "<td style='border: 1px solid #000000; padding: 3px; border-top:none;'><b>PO No.</b><br/>" + escapeXmlSymbols(poScNo) + "</td>";
            header += "<td style='border: 1px solid #000000; padding: 3px; border-top:none; border-left:none;'><b>Currency</b><br/>" + escapeXmlSymbols(currency) + "</td>";
            header += "</tr>";
            
            header += "</tbody>";
            header += "</table>";


            // ---------------------------------------------------------
            // BODY MACRO (Item Lines & Totals)
            // ---------------------------------------------------------
            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:10px; margin-top:8px;\">";
            body += "<tbody>";
            
            body += "<tr>";
            body += "<td style='width:8%;'></td>";
            body += "<td style='width:37%;'></td>";
            body += "<td style='width:12%;'></td>";
            body += "<td style='width:11%;'></td>";
            body += "<td style='width:15%;'></td>";
            body += "<td style='width:17%;'></td>";
            body += "</tr>";

            body += "<tr style='height: 25px;'>";
            body += "<td style='border: 1px solid #000000; font-weight:bold; align:center; padding: 6px 2px;'>Item</td>";
            body += "<td style='border: 1px solid #000000; border-left:none; font-weight:bold; align:center; padding: 6px 2px;'>Item Description</td>";
            body += "<td style='border: 1px solid #000000; border-left:none; font-weight:bold; align:center; padding: 6px 2px;'>Qty</td>";
            body += "<td style='border: 1px solid #000000; border-left:none; font-weight:bold; align:center; padding: 6px 2px;'>Unit</td>";
            body += "<td style='border: 1px solid #000000; border-left:none; font-weight:bold; align:center; padding: 6px 2px;'>Unit Price</td>";
            body += "<td style='border: 1px solid #000000; border-left:none; font-weight:bold; align:center; padding: 6px 2px;'>Amount</td>";
            body += "</tr>";

            var lineCount = soRec.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < lineCount; i++) {
                var itemName = soRec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) || '';
                var itemDesc = soRec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }) || '';
                
                var descriptionBlock = '';
                if (itemName) descriptionBlock += '<b>' + escapeXmlSymbols(itemName) + '</b>';
                if (itemDesc) descriptionBlock += (descriptionBlock ? '<br/>' : '') + escapeXmlSymbols(itemDesc).replace(/\r?\n/g, '<br/>');

                var qty = soRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) || 0;
                var unit = soRec.getSublistText({ sublistId: 'item', fieldId: 'units', line: i }) || '';
                var rate = soRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }) || 0;
                var amount = soRec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }) || 0;

                body += "<tr style='height: 20px;'>";
                body += "<td valign='top' style='border: 1px solid #000000; border-top:none; border-bottom:none; align:center; padding: 4px;'>" + (i + 1) + "</td>";
                body += "<td valign='top' style='border: 1px solid #000000; border-top:none; border-bottom:none; border-left:none; padding: 4px;'>" + descriptionBlock + "</td>";
                body += "<td valign='top' style='border: 1px solid #000000; border-top:none; border-bottom:none; border-left:none; align:center; padding: 4px;'>" + formatNumber(qty) + "</td>";
                body += "<td valign='top' style='border: 1px solid #000000; border-top:none; border-bottom:none; border-left:none; align:center; padding: 4px;'>" + escapeXmlSymbols(unit) + "</td>";
                body += "<td valign='top' style='border: 1px solid #000000; border-top:none; border-bottom:none; border-left:none; align:center; padding: 4px;'>" + formatNumber(rate) + "</td>";
                body += "<td valign='top' style='border: 1px solid #000000; border-top:none; border-bottom:none; border-left:none; align:center; padding: 4px;'>" + formatNumber(amount) + "</td>";
                body += "</tr>";
            }
            
            var baseFillerHeight = 110; 
            var estimatedRowHeightInMm = 10; 
            var dynamicFillerHeight = baseFillerHeight - (lineCount * estimatedRowHeightInMm);

            if (dynamicFillerHeight < 0) {
                dynamicFillerHeight = 0;
            }

            if (dynamicFillerHeight > 0) {
                body += "<tr class='item-filler' style='height: " + dynamicFillerHeight + "mm;'>";
                body += "<td style='border: 1px solid #000000; border-top:none;'></td>";
                body += "<td style='border: 1px solid #000000; border-top:none; border-left:none;'></td>";
                body += "<td style='border: 1px solid #000000; border-top:none; border-left:none;'></td>";
                body += "<td style='border: 1px solid #000000; border-top:none; border-left:none;'></td>";
                body += "<td style='border: 1px solid #000000; border-top:none; border-left:none;'></td>";
                body += "<td style='border: 1px solid #000000; border-top:none; border-left:none;'></td>";
                body += "</tr>";
            }

            body += "</tbody>";
            body += "</table>";

           // ---------------------------------------------------------
            // UPDATE: STRUKTUR TABLE TOTALS BARU
            // ---------------------------------------------------------
            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:10px; margin-top:4px;\">";
            body += "<tbody>";
            body += "<tr>";
            body += "<td style='width:8%;'></td>"; 
            body += "<td style='width:57%;'></td>"; 
            body += "<td style='width:5%;'></td>"; 
            body += "<td style='width:15%;'></td>"; 
            body += "<td style='width:15%;'></td>"; 
            body += "</tr>";

            body += "<tr>";
            body += "<td valign='top' style='padding-top: 5px;'>Say :</td>";
            body += "<td valign='top' rowspan='2' style='border: 1px solid #000000; font-weight:bold; padding: 7px 10px;'>" + escapeXmlSymbols(words) + " " + escapeXmlSymbols(currency) + "</td>";
            body += "<td></td>"; 
            body += "<td valign='middle' style='border: 1px solid #000000; padding: 5px;'>Subtotal</td>";
            body += "<td valign='middle' align='right' style='border: 1px solid #000000; border-left:none; padding: 5px;'>" + formatNumber(subTotal) + "</td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td></td>";
            body += "<td></td>";
            body += "<td valign='middle' style='border: 1px solid #000000; border-top:none; padding: 5px;'>PPN</td>";
            body += "<td valign='middle' align='right' style='border: 1px solid #000000; border-left:none; border-top:none; padding: 5px;'>" + formatNumber(taxTotal) + "</td>";
            body += "</tr>";

            // Baris 3: Delivery
            body += "<tr>";
            body += "<td></td>";
            body += "<td rowspan='2'></td>"; 
            body += "<td></td>"; 
            body += "<td valign='middle' style='border: 1px solid #000000; border-top:none; padding: 5px;'>Delivery</td>";
            body += "<td valign='middle' align='right' style='border: 1px solid #000000; border-left:none; border-top:none; padding: 5px;'>0.00</td>";
            body += "</tr>";
            
            body += "<tr>";
            body += "<td></td>";
            body += "<td></td>";
            body += "<td valign='middle' style='border: 1px solid #000000; border-top:none; font-weight:bold; padding: 5px;'>Total Invoice</td>";
            body += "<td valign='middle' align='center' style='border: 1px solid #000000; border-left:none; border-top:none; font-weight:bold; padding: 5px;'>" + formatNumber(total) + "</td>";
            body += "</tr>";
            
            body += "</tbody>";
            body += "</table>"; 


            // ---------------------------------------------------------
            // FOOTER MACRO
            // ---------------------------------------------------------
            var finalNotes = formatTextBreak(descriptionNotes);
            
            // BUILD BANK INFO TABLE 
            if (bankAccNo || bankName || bankAddress || bankSwift) {
                finalNotes += '<br/><br/><b>Payment shall be remitted to below designated bank account:</b>';
                // Membuat struktur tabel khusus agar perataan baris ke-2 alamat rapi persis seperti sample gambar
                finalNotes += '<table cellpadding="0" cellspacing="0" style="width:100%; font-size:8px; margin-top:3px; line-height: 11px;">';
                if (bankAccNo) {
                    finalNotes += "<tr><td style='width:100px;'>Bank account number:</td><td>" + escapeXmlSymbols(bankAccNo) + "</td></tr>";
                }
                if (bankName) {
                    finalNotes += "<tr><td>Bank name:</td><td>" + escapeXmlSymbols(bankName) + "</td></tr>";
                }
                if (bankAddress) {
                    finalNotes += "<tr><td valign='top'>Bank address:</td><td>" + formatTextBreak(bankAddress) + "</td></tr>";
                }
                if (bankSwift) {
                    finalNotes += "<tr><td>Swift code:</td><td>" + escapeXmlSymbols(bankSwift) + "</td></tr>";
                }
                finalNotes += "</table>";
            }

          footer += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:8px;\">";
            footer += "<tbody>";
            footer += "<tr>";
            footer += "<td style='width:60%;'></td>";
            footer += "<td style='width:5%;'></td>";
            footer += "<td style='width:35%;'></td>";
            footer += "</tr>";

            footer += "<tr>";
            footer += "<td valign='top' style='padding-top: 10px;'>"; 
            footer += "    <div style='border: 1px solid #000000; border-radius: 6px; padding: 5px 8px 8px 8px; width: 100%; min-height: 80px;'>";

            // 1. KEMBALIKAN LABEL SEPERTI ASLINYA AGAR MEMOTONG GARIS BORDER
            footer += "        <p style='margin-top: -13px; margin-left: 5px; margin-bottom: 0;'>";
            footer += "            <span style='background-color: #ffffff; padding: 0 5px; font-size: 10px;'>Description:</span>";
            footer += "        </p>";

            // 2. BUNGKUS NOTES DENGAN TABLE DAN BERI MARGIN TOP SEBAGAI "BUMPER"
            // Margin-top ini berfungsi menahan daya tarik margin negatif dari tag <p> di atasnya
            footer += "        <table width='100%' cellpadding='0' cellspacing='0' style='margin-top: 10px;'>";
            footer += "            <tr><td style='line-height: 11px; font-size: 8px;'>" + finalNotes + "</td></tr>";
            footer += "        </table>";

            footer += "    </div>";
            footer += "</td>";

            footer += "<td></td>";

            footer += "<td valign='top' align='center'>";
            footer += "    <table width='100%' cellpadding='0'>";
            footer += "        <tr><td align='center' style='font-size:10px; font-weight:bold; padding-top:4px;'>Authorized By,</td></tr>";
            footer += "        <tr><td align='center' style='height:70px;'></td></tr>";
            footer += "        <tr><td align='center' style='font-size:10px; font-weight:bold;'>" + escapeXmlSymbols(empName) + "</td></tr>";
            footer += "    </table>";
            footer += "</td>";
            footer += "</tr>";
            footer += "</tbody>";
            footer += "</table>";
            
            footer += "<div style=\"align:right; font-size:8px; margin-top:5px; font-family: Helvetica;\">Page <pagenumber/> of <totalpages/></div>";


            // =========================================================
            // ASSEMBLE XML & PDF
            // =========================================================
            xml += '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
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
            xml += "</head>";

            xml += "<body font-size='10' size='A4' style='font-family: Helvetica,sans-serif;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='" + footerHeight + "' padding='10mm 10mm 10mm 10mm'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');

            response.renderPdf({
                xmlString: xml
            });

        } catch (e) {
            log.error('Error generating PDF', e);
            response.write('Error generating PDF: ' + e.message);
        }
    }

    return {
        onRequest: onRequest
    };
});