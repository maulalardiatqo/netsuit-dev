/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        try{
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
                var recid = context.request.parameters.id;
                log.debug('recid', recid);
                var invRec = record.load({
                    type: "invoice",
                    id: recid,
                    isDynamic: false,
                });
                var trandId = invRec.getValue('tranid');
                var trandate = invRec.getValue('trandate');
                var duedate = invRec.getValue('duedate');
                var noPo = invRec.getValue('otherrefnum');
                var salesRep = invRec.getValue('salesrep');
                var idCust = invRec.getValue('entity');
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
                var subTotal = invRec.getValue('subtotal');
                var discount = invRec.getValue('discounttotal') || 0;
                var taxTotal = invRec.getValue('taxtotal') || 0;
                if(taxTotal == ''){
                    taxTotal = 0
                }
                var total = invRec.getValue('total');

                var discProsent = 0.00
                if(discount){
                    discount = Math.abs(discount);
                    var prosentaseDiscount = Math.abs(Number(discount) / Number(subTotal) * 100);
                    discProsent = prosentaseDiscount;
                }
                
                log.debug('discount', discount);
                log.debug('prosentaseDiscount', prosentaseDiscount);
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
                // log.debug('statusSo', statusSo);

                var itemCount = invRec.getLineCount({
                    sublistId: 'item'
                });
                log.debug('itemCount', itemCount);
                var taxPros = [];
                var uniqueTaxRates = {};
                if(itemCount > 0){
                    for(var index = 0; index < itemCount; index++){
                        var taxRate = invRec.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'taxrate1',
                            line : index
                        })
                        if (!uniqueTaxRates.hasOwnProperty(taxRate)) {
                            uniqueTaxRates[taxRate] = true;
                            taxPros.push(taxRate);
                        }
                    }
                }
                if(trandate){
                    trandate = format.format({
                        value: trandate,
                        type: format.Type.DATE
                    });
                }
                if(duedate){
                    duedate = format.format({
                        value: duedate,
                        type: format.Type.DATE
                    });
                }
                if(subTotal){
                    subTotal = pembulatan(subTotal)
                    log.debug('subTotal', subTotal);
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                }
                if(discount){
                    discount = pembulatan(discount)
                    log.debug('discount', discount);
                    discount = format.format({
                        value: discount,
                        type: format.Type.CURRENCY
                    });
                }
                if(total){
                    total = pembulatan(total)
                    log.debug('total', total);
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY
                    });
                }
                if(taxTotal){
                    taxTotal = pembulatan(taxTotal)
                    log.debug('taxTotal', taxTotal);
                    taxTotal = format.format({
                        value: taxTotal,
                        type: format.Type.CURRENCY
                    });
                }
                
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
                style += ".tg .tg-img-logo{width:180px; height:50px; object-vit:cover;}";
                style += ".tg .tg-img-logo-a{width:150px; height:70px; object-vit:cover;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: left;font-size:10px; border-top: 3px solid black; border-bottom: 3px solid black;}";
                style += ".tg .tg-b_body{align: left;font-size:10px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";

                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:20%'></td>"
                body += "<td style='width:35%'></td>"
                body += "<td style='width:12%'></td>"
                body += "<td style='width:13%'></td>"
                body += "</tr>";
                
                body += "<tr>";
                if (urlLogo) {
                    body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;' rowspan='3'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }else{
                    body += "<td></td>"
                }
                body += "</tr>";

                body+= "<tr>"
                body += "<td style='font-size:18px; align:center; font-weight:bold;'>Faktur Penjualan</td>"
                body += "<td>Tracking Code :</td>";
                body += "<td style='align:right; font-weight:bold'>ATRY</td>"
                body += "</tr>";

                body+= "<tr>"
                body+= "<td style='font-size:18px; align:center; font-weight:bold;'>Invoice</td>"
                body+= "<td colspan='2'>http://crm.infinisia.co.id/check</td>"
                body+= "</tr>"

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";

                body += "<tr>";
                body+= "<td style='width:17%'></td>"
                body+= "<td style='width:33%'></td>"
                body+= "<td style='width:23%'></td>"
                body+= "<td style='width:27%'></td>"
                body+= "</tr>"

                body += "<tr>";
                body+= "<td style='font-weight:bold;'>Faktur/Invoice #</td>"
                body+= "<td style='font-weight:bold;'>"+trandId+"</td>"
                body+= "<td style='font-weight:bold;'>Pesanan Pembelian/Po#</td>"
                body+= "<td style='font-weight:bold;'>"+noPo+"</td>"
                body+= "</tr>"

                body += "<tr>";
                body+= "<td style='font-weight:bold;'>Tanggal/Date</td>"
                body+= "<td style='font-weight:bold;'>"+trandate+"</td>"
                body+= "<td style='font-weight:bold;'>Sales Person</td>"
                body+= "<td style='font-weight:bold;'>"+salesRep+"</td>"
                body+= "</tr>"

                body += "<tr>";
                body+= "<td style='font-weight:bold;'>Tempo/Due in</td>"
                body+= "<td style='font-weight:bold;'>"+duedate+"</td>"
                body+= "<td></td>"
                body+= "<td></td>"
                body+= "</tr>"

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";

                body += "<tr style='height:20px;'>";
                body += "<td style='weight : 48%; align:left'></td>"
                body += "<td style='weight : 2%'></td>"
                body += "<td style='weight : 50%; align:left'></td>"
                body += "</tr>"

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Kepada/Sold to:</td>"
                body+= "<td></td>"
                body+= "<td style='font-weight:bold; align:left'>Barang Telah dikirim ke/Goods Delivered to:</td>"
                body+= "</tr>"

                body+= "<tr>"
                body+= "<td style='align:left'>"+custName+"</td>"
                body+= "<td></td>"
                body+= "<td style='align:left'>"+custName+"</td>"
                body+= "</tr>"

                body+= "<tr>"
                body+= "<td style='align:left'>"+custAdders+"</td>"
                body+= "<td></td>"
                body+= "<td style='align:left'>"+custAdders+"</td>"
                body+= "</tr>"

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                body += "<tbody>";
                body += "<tr style='height:25px;'>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td class='tg-head_body' style='width:5%; align:center;'> No. </td>"
                body += "<td class='tg-head_body' style='width:27%; align:center;'>Nama Barang / Goods Description</td>"
                body += "<td class='tg-head_body' style='width:10%; align:center;'>QTY</td>"
                body += "<td class='tg-head_body' style='width:10%; align:center;'>Unit</td>"
                body += "<td class='tg-head_body' style='width:23%; align:center;'>Harga Satuan / Price</td>"
                body += "<td class='tg-head_body' style='width:25%; align:center;'>Total</td>"
                body += "</tr>"

                body += getPOItem(context, invRec)
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:40%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:30%'></td>"
                body += "</tr>"

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td>Subtotal</td>"
                body+= "<td></td>"
                body+= "<td>IDR</td>"
                body+= "<td style='align:right'>"+removeDecimalFormat(subTotal)+"</td>"
                body += "</tr>"

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td>Discount</td>"
                body+= "<td>"+discProsent+"%</td>"
                body+= "<td>IDR</td>"
                body+= "<td style='align:right'>"+removeDecimalFormat(discount)+"</td>"
                body += "</tr>"

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td style='border-bottom : 1px solid black'>PPN</td>"
                body+= "<td style='border-bottom : 1px solid black'>"+taxPros+"%</td>"
                body+= "<td style='border-bottom : 1px solid black'>IDR</td>"
                body+= "<td style='align:right; border-bottom : 1px solid black'>"+removeDecimalFormat(taxTotal)+"</td>"
                body += "</tr>"

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td style='font-weight:bold'>Grand Total</td>"
                body+= "<td></td>"
                body+= "<td style='font-weight:bold'>IDR</td>"
                body+= "<td style='align:right; font-weight:bold'>"+removeDecimalFormat(total)+"</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:8px\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td>1.Barang yang sudah dibeli tidak dapat ditukar ataupun dikembalikan tanpa perjanjian dimuka // Goods sold may not be returned or exchange without prior agreement</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td>2.Pembayaran CEK/GIRO/TRANSFER Bank dianggap lunas apabila dana telah efektif diterima di rekening kami // Payment through CHQEUE/GIRO/BANK Transfer shall be settled after the funds has been received in our account</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td>3. Harap melakukan pembayaran dalam jumlah penuh ke// Please pay in FULL AMOUNT to :</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:8px\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:10%;'></td>"
                body += "<td style='width:85%;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style=''></td>"
                body += "<td style='font-weight:bold;'>A/N</td>"
                body += "<td style='font-weight:bold;'>"+legalName+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style=''></td>"
                body += "<td style='font-weight:bold;'>BANK</td>"
                body += "<td style='font-weight:bold;'>BCA-Citra Garden</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style=''></td>"
                body += "<td style='font-weight:bold;'>ACCOUNT</td>"
                body += "<td style='font-weight:bold;'>399-334-9999</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:8px\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>4. Harap kirim bukti pembayaran via web ke: http://crm.infinisia.co.id/check // Please upload your payment via web http://crm.infinisia.co.id/check</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr style='height:40px;'>";
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm; margin-top:5px; padding-top:5px;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";
    
                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });

            }
            function getPOItem(context, invRec){
                var itemCount = invRec.getLineCount({
                    sublistId: 'item'
                });
                log.debug('itemCount', itemCount);
                
                if(itemCount > 0){
                    var body = "";
                    var No = 1;
                    for(var index = 0; index < itemCount; index++){
                        var qty = invRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: index
                        });
                        var namaBarang = invRec.getSublistText({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : index
                        })
                        var rate = invRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: index
                        });
                        var unit = invRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'units_display',
                            line: index
                        });
                        log.debug('unit', unit)
                        
                        var amount = invRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: index
                        });

                        if(rate){
                            rate = pembulatan(rate)
                            rate = format.format({
                                value: rate,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(amount){
                            amount = pembulatan(amount)
                            log.debug('amount', amount);
                            amount = format.format({
                                value: amount,
                                type: format.Type.CURRENCY
                            });
                        }
                        body += "<tr>";
                        body += "<td class='tg-b_body' style='align:center;'>"+No+"</td>";
                        body += "<td class='tg-b_body' style='align:center;'>"+namaBarang+"</td>";
                        body += "<td class='tg-b_body' style='align:center;'>"+qty+"</td>";
                        body += "<td class='tg-b_body' style='align:center;'>"+unit+"</td>";
                        body += "<td class='tg-b_body' style='align:center;'>"+removeDecimalFormat(rate)+"</td>";
                        body += "<td class='tg-b_body' style='align:right;'>"+removeDecimalFormat(amount)+"</td>";
                        body += "</tr>";
                        No++
                    }
                    return body;
                }
            }
        }catch(e){
            log.debug('error',e)
        }
       
        return {
            onRequest: onRequest,
        };
    });