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
                    var poCust = recSo.getValue('otherrefnum');
                }
                var shippingDate = ifRec.getValue('trandate');
                var dikirim = ifRec.getValue('shipcarrier');
                var docnumber = ifRec.getValue('tranid');
                log.debug('dikirim', dikirim)
                var ekspedisi = ifRec.getText('shipmethod');
                var shipTo = ifRec.getValue('shipaddress');
                var customers = ifRec.getText('entity');
                var nopolMobil = ifRec.getValue('custbody_abj_nopol_mobil')
                if(ekspedisi.includes('&')){
                    ekspedisi = ekspedisi.replace(/&/g, ' &amp; ');
                }
                var noResi = ifRec.getValue('custbodyiss_no_resi');

                var itemCount = ifRec.getLineCount({
                    sublistId: 'item'
                });
                var location
                if(itemCount > 0){
                    for(var index = 0; index < itemCount; index++){
                        var locationItem = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: index
                        });
                        if(locationItem){
                            var locationRec =  record.load({
                                type : 'location',
                                id : locationItem,
                                isDynamic : false
                            })
                            var locationName = locationRec.getValue('name');
                            location = locationName
                        }
                    }
                }
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
                style += ".page-break { page-break-before: always; }"; 
                style += "</style>";
                
    
                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body+= "<tbody>";
                body+= "<tr>"
                body+= "<td style='width:15%'></td>"
                body+= "<td style='width:33%'></td>"
                body+= "<td style='width:4%'></td>"
                body+= "<td style='width:18%'></td>"
                body+= "<td style='width:30%'></td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style='font-size:18px; font-weight:bold; align:left' colspan='2'>PT. Infinisia Sumber Semesta</td>"
                body+= "<td></td>"
                body+= "<td style='font-size:18px; font-weight:bold; align:right' colspan='2'>Surat Jalan / Delivery Order</td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>DO#</td>"
                body+= "<td>: "+docnumber+"</td>"
                body+= "<td></td>"
                body+= "<td style='font-weight:bold'>Dikirim Dengan :</td>"
                body+= "<td rowspan='2'>"+dikirim+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Tanggal</td>"
                body+= "<td>: "+shippingDate+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>SO#</td>"
                body+= "<td>: "+trandId+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Cust. PO</td>"
                body+= "<td>: "+poCust+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Kirim Ke</td>"
                body+= "<td rowspa='2'>: "+shipTo+"</td>"
                body+= "</tr>";
                body+= "<tr>"
                body+= "<td style='height:30px'></td>"
                body+= "</tr>"

                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body+= "<tbody>";

                body+= "<tr>"
                body+= "<td style='width:5%'></td>"
                body+= "<td style='width:20%'></td>"
                body+= "<td style='width:15%'></td>"
                body+= "<td style='width:15%'></td>"
                body+= "<td style='width:13%'></td>"
                body+= "<td style='width:12%'></td>"
                body+= "<td style='width:15%'></td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='border-top:1px solid black; border-bottom:2px solid black'>No</td>"
                body+= "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kode Barang</td>"
                body+= "<td style='border-top:1px solid black; border-bottom:2px solid black' colspan='2'>Keterangan</td>"
                body+= "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kemasan</td>"
                body+= "<td style='border-top:1px solid black; border-bottom:2px solid black'>Unit</td>"
                body+= "<td style='border-top:1px solid black; border-bottom:2px solid black'>Total QTY</td>"
                body+= "</tr>";  
                
                body += getLine(context, ifRec);

                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body+= "<tbody>";

                body+= "<tr>"
                body+= "<td style='width:20%'></td>"
                body+= "<td style='width:20%'></td>"
                body+= "<td style='width:20%'></td>"
                body+= "<td style='width:20%'></td>"
                body+= "<td style='width:20%'></td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black' >Diterima Oleh :</td>"
                body+= "<td style='border-top:1px solid black; border-right:1px solid black; align:center;'>Track Tag #</td>"
                body+= "<td style='border-top:1px solid black; border-right:1px solid black'>Supir,</td>"
                body+= "<td style='border-top:1px solid black; border-right:1px solid black' >Gudang</td>"
                body+= "<td style='border-top:1px solid black; border-right:1px solid black' >Admin</td>"
                body+= "</tr>"; 

                body+= "<tr style='height:40px'>"
                body+= "<td style='border-bottom:1px solid black; border-left:1px solid black; border-right:1px solid black' ></td>"
                body+= "<td style='border-bottom:1px solid black; border-right:1px solid black; font-size:9px; align:center;'>http://crm.infinisia.co.id/check</td>"
                body+= "<td style='border-bottom:1px solid black; border-right:1px solid black'></td>"
                body+= "<td style='border-bottom:1px solid black; border-right:1px solid black' ></td>"
                body+= "<td style='border-bottom:1px solid black; border-right:1px solid black' ></td>"
                body+= "</tr>"; 

                body+= "<tr style='height:40px'>"
                body+= "</tr>"; 
                body+= "<tr>"
                body+= "<td style='font-size:14px;font-weight:bold'>"+nopolMobil+"</td>"
                body+= "</tr>"; 

                body+= "<tr style='height:40px'>"
                body+= "</tr>"; 

                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body+= "<tbody>";
                body+= "<tr>"
                body+= "<td style='width:25%'></td>"
                body+= "<td style='width:25%'></td>"
                body+= "<td style='width:25%'></td>"
                body+= "<td style='width:25%'></td>"
                body+= "</tr>";
                
                body+= "<tr>"
                body+= "<td style='align:center'>"+docnumber+"</td>"
                body+= "<td style='align:center'>"+location+"</td>"
                body+= "<td style='align:center'>DWIANNUARAH</td>"
                body+= "<td style='align:center'>Page 1 of 1</td>"
                body+= "</tr>";


                body+= "<tr style='height:40px'>"
                body+= "</tr>"; 

                body+= "</tbody>";
                body+= "</table>";
                // hal 2
                body += "<div class='page-break'></div>";
                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body+= "<tbody>";
                body+= "<tr>"
                body+= "<td style='width:15%'></td>"
                body+= "<td style='width:33%'></td>"
                body+= "<td style='width:4%'></td>"
                body+= "<td style='width:18%'></td>"
                body+= "<td style='width:30%'></td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style='font-size:18px; font-weight:bold; align:left' colspan='2'>PT. Infinisia Sumber Semesta</td>"
                body+= "<td></td>"
                body+= "<td style='font-size:18px; font-weight:bold; align:right' colspan='2'>Surat Daftar Kemasan / Packing List</td>"
                body+="</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>DO#</td>"
                body+= "<td>: "+docnumber+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Tanggal</td>"
                body+= "<td>: "+shippingDate+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>SO#</td>"
                body+= "<td>: "+trandId+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Cust. PO</td>"
                body+= "<td>: "+poCust+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Kirim Ke</td>"
                body+= "<td rowspa='2'>: "+shipTo+"</td>"
                body+= "</tr>";
                body+= "<tr>"
                body+= "<td style='height:30px'></td>"
                body+= "</tr>"

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
                        var unitConvertion = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitconversion',
                            line: index
                        });

                        var konversi
                        if(unitConvertion){
                            konversi = Number(qty) * Number(unitConvertion)
                        }
                        nomor++;
                        body += "<tr>";
                        body += "<td style=''>"+nomor+"</td>";
                        body += "<td style=''>"+item+"</td>";
                        body += "<td style='' colspan='2'>"+description+"</td>";
                        body += "<td style=''>"+qty+"</td>";
                        body += "<td style=''>"+units+"</td>";
                        body += "<td style=''>"+konversi+"</td>";
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