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
                var ifRec = record.load({
                    type: "itemfulfillment",
                    id: recid,
                    isDynamic: false,
                });
                
                var soId = ifRec.getValue('createdfrom');
                log.debug('soId', soId);
                var orderDate
                var order 
                if(soId){
                    recSo = record.load({
                        type : 'salesorder',
                        id : soId,
                        isDynamic : false
                    })
                    var salesDate = recSo.getValue('saleseffectivedate');
                    orderDate = salesDate
                    var trandId = recSo.getValue('tranid');
                    order = trandId
                }
                var shippingDate = ifRec.getValue('trandate');
                var ekspedisi = ifRec.getText('shipmethod');
                var shipTo = ifRec.getValue('shipaddress');
                var customers = ifRec.getText('entity')
                if(ekspedisi.includes('&')){
                    ekspedisi = ekspedisi.replace(/&/g, ' &amp; ');
                }
                var noResi = ifRec.getValue('custbodyiss_no_resi');
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
                        log.debug('urlLogo', urlLogo);
                var addres = companyInfo.getValue("mainaddress_text");
                var returnAdress = companyInfo.getValue('returnaddress_text');
                var taxId = companyInfo.getValue('employerid')
                if(orderDate){
                    function sysDate() {
                        var date = orderDate;
                        var tdate = date.getUTCDate();
                        var month = date.getUTCMonth() + 1; // jan = 0
                        var year = date.getUTCFullYear();
                        return tdate + '/' + month + '/' + year;
                    }
                    orderDate = sysDate();   
                }
                if(shippingDate){
                    function sysDate() {
                        var date = shippingDate;
                        var tdate = date.getUTCDate();
                        var month = date.getUTCMonth() + 1; // jan = 0
                        var year = date.getUTCFullYear();
                        return tdate + '/' + month + '/' + year;
                    }
                    shippingDate = sysDate();   
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
                style += ".tg .tg-img-logo{width:200px; height:70px; object-vit:cover;}";
                style += ".tg .tg-img-logo-a{width:150px; height:70px; object-vit:cover;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: center;font-size:9px;font-weight: bold; background-color: #B6BFC2;}";
                style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";
                
    
                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body+= "<tbody>";
                body+= "<tr>"
                body+= "<td style='width:56%'></td>"
                body+= "<td style='width:4%'></td>"
                body+= "<td style='width:20%'></td>"
                body+= "<td style='width:20%'></td>"
                body+="</tr>";

                body+= "<tr>";
                if (urlLogo) {
                    body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }
                body+= "<td style='align:left; font-size:23px; font-weight:bold;' colspan='2'>Packing Slip</td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style=''></td>"
                body+= "<td style=''></td>"
                body+= "<td style='font-weight:bold;'>Order Date</td>"
                body+= "<td style=''>"+orderDate+"</td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style=''></td>"
                body+= "<td style=''></td>"
                body+= "<td style='font-weight:bold;'>Order#</td>"
                body+= "<td style=''>"+order+"</td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style=''>"+addres+"</td>"
                body+= "<td style=''></td>"
                body+= "<td style='font-weight:bold;'>Ship Date</td>"
                body+= "<td style=''>"+shippingDate+"</td>"
                body+="</tr>";

                body+= "<tr>"
                // body+= "<td style=''>Tax ID# "+taxId+"</td>"
                body+= "<td style=''></td>"
                body+= "<td style=''></td>"
                body+= "<td style='font-weight:bold;'>Ekspedisi</td>"
                body+= "<td style=''>"+ekspedisi+"</td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style=''></td>"
                body+= "<td style=''></td>"
                body+= "<td style='font-weight:bold;'>No Resi</td>"
                body+= "<td style=''>"+noResi+"</td>"
                body+="</tr>";

                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body+= "<tbody>";
                body+= "<tr style='height:30px;'>";
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body+= "<tbody>";
                body+= "<tr style=''>";
                body+= "<td style='width:50px'></td>"
                body+= "<td style='width:50px'></td>"
                body+= "</tr>";

                body+= "<tr>";
                body+= "<td style='font-weight:bold;'>Ship To</td>"
                body+= "</tr>";
                body+= "<tr>";
                body+= "<td style='font-weight:bold;'>"+shipTo+"</td>"
                body+= "</tr>";

                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body+= "<tbody>";
                body+= "<tr style='height:30px;'>";
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body+= "<td class='tg-head_body' style='width:5%; border: 1px solid black; border-right:none;'>No</td>"
                body+= "<td class='tg-head_body' style='width:30%; border: 1px solid black; border-right:none;'>Item</td>"
                body+= "<td class='tg-head_body' style='width:30%; border: 1px solid black; border-right:none;'> Description</td>"
                body+= "<td class='tg-head_body' style='width:15%; border: 1px solid black; border-right:none;'> Qty </td>"
                body+= "<td class='tg-head_body' style='width:20%; border: 1px solid black;'> Unit </td>"
                body+= "</tr>";
                body += getLine(context, ifRec);
                body+= "</tbody>";
                body+= "</table>";

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer+= "<tr>"
                footer+= "<td style='width:56%'></td>"
                footer+= "<td style='width:4%'></td>"
                footer+= "<td style='width:20%'></td>"
                footer+= "<td style='width:20%'></td>"
                footer+="</tr>";

                // footer+= "<tr>"
                // footer+= "<td style='font-size:10; font-weight:bold;'>"+legalName+"</td>"
                // footer+= "<td></td>"
                // footer+= "<td style='font-size:10; font-weight:bold;' colspan='2'>Customer Return Form</td>"
                // footer+= "</tr>";

                // footer+= "<tr style='height:10px'>"
                // footer+= "<td></td>"
                // footer+= "<td></td>"
                // footer+= "<td></td>"
                // footer+= "<td></td>"
                // footer+= "</tr>";

                // footer+= "<tr>"
                // footer+= "<td style='font-size:10; font-weight:bold;'>Ship Retuns To</td>"
                // footer+= "<td></td>"
                // footer+= "<td style='font-size:10; font-weight:bold;'>Customer</td>"
                // footer+= "<td>"+customers+"</td>"
                // footer+= "</tr>";

                // footer+= "<tr>"
                // footer+= "<td style='font-size:10;'>"+returnAdress+"</td>"
                // footer+= "<td></td>"
                // footer+= "<td style='font-size:10; font-weight:bold;'>Order#</td>"
                // footer+= "<td>"+order+"</td>"
                // footer+= "</tr>";

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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='25%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";
    
                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }
            function getLine(context, ifRec){
                var itemCount = ifRec.getLineCount({
                    sublistId: 'item'
                });
                var nomor = 0
                if(itemCount > 0){
                    var body = "";
                    for(var index = 0; index < itemCount; index++){
                        var item = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemname',
                            line: index
                        });
                        var description = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: index
                        });
                        var qty = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: index
                        });
                        var units = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitsdisplay',
                            line: index
                        });
                        nomor++;
                        body += "<tr>";
                        body += "<td style='align:center; font-size: 10px; border: 1px solid black; border-right:none;'>"+nomor+"</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+item+"</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+description+"</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+qty+"</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black;'>"+units+"</td>";
                        body += "</tr>";
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