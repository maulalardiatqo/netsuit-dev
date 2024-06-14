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
                var dikirim = ifRec.getValue('shipcarrier') || '';
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
                var body1 = "";
                var body2 = "";
                var headerHeight = '1%';
                var style = "";
                var footer1 = "";
                var footer2 = "";
                var pdfFile = null;
                
                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                style += ".tg .tg-img-logo{width:220px; height:90px; object-vit:cover;}";
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
                
                // Konten untuk halaman pertama
                body1 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body1 += "<tbody>";
                body1 += "<tr>";
                body1 += "<td style='width:15%'></td>";
                body1 += "<td style='width:33%'></td>";
                body1 += "<td style='width:4%'></td>";
                body1 += "<td style='width:18%'></td>";
                body1 += "<td style='width:30%'></td>";
                body1 += "</tr>";
                body1 += "<tr>";
                if (urlLogo) {
                    body1 += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;' colspan='2'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }
                body1 += "<td></td>";
                body1 += "<td style='font-size:18px; font-weight:bold; align:right' colspan='2'>Surat Jalan / Delivery Order</td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>DO#</td>";
                body1 += "<td>: " + docnumber + "</td>";
                body1 += "<td></td>";
                body1 += "<td style='font-weight:bold'>Dikirim Dengan :</td>";
                body1 += "<td rowspan='2'>" + dikirim + "</td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>Tanggal</td>";
                body1 += "<td>: " + shippingDate + "</td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>SO#</td>";
                body1 += "<td>: " + trandId + "</td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>Cust. PO</td>";
                body1 += "<td>: " + poCust + "</td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>Kirim Ke</td>";
                body1 += "<td rowspa='2'>: " + shipTo + "</td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='height:30px'></td>";
                body1 += "</tr>";
                body1 += "</tbody>";
                body1 += "</table>";
                body1 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body1 += "<tbody>";
                body1 += "<tr>";
                body1 += "<td style='width:5%'></td>";
                body1 += "<td style='width:20%'></td>";
                body1 += "<td style='width:15%'></td>";
                body1 += "<td style='width:15%'></td>";
                body1 += "<td style='width:13%'></td>";
                body1 += "<td style='width:12%'></td>";
                body1 += "<td style='width:15%'></td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>No</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kode Barang</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black' colspan='2'>Keterangan</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kemasan</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Unit</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Total QTY</td>";
                body1 += "</tr>";  
                body1 += getLine(context, ifRec);
                body1 += "</tbody>";
                body1 += "</table>";
                body1 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body1 += "<tbody>";
                body1 += "<tr>";
                body1 += "<td style='width:20%'></td>";
                body1 += "<td style='width:20%'></td>";
                body1 += "<td style='width:20%'></td>";
                body1 += "<td style='width:20%'></td>";
                body1 += "<td style='width:20%'></td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black' >Diterima Oleh :</td>";
                body1 += "<td style='border-top:1px solid black; border-right:1px solid black; align:center;'>Track Tag #</td>";
                body1 += "<td style='border-top:1px solid black; border-right:1px solid black'>Supir,</td>";
                body1 += "<td style='border-top:1px solid black; border-right:1px solid black' >Gudang</td>";
                body1 += "<td style='border-top:1px solid black; border-right:1px solid black' >Admin</td>";
                body1 += "</tr>"; 
                body1 += "<tr style='height:60px'>";
                body1 += "<td style='border-bottom:1px solid black; border-left:1px solid black; border-right:1px solid black' ></td>";
                body1 += "<td style='border-bottom:1px solid black; border-right:1px solid black; font-size:9px; align:center;'>http://crm.infinisia.co.id/check</td>";
                body1 += "<td style='border-bottom:1px solid black; border-right:1px solid black'></td>";
                body1 += "<td style='border-bottom:1px solid black; border-right:1px solid black' ></td>";
                body1 += "<td style='border-bottom:1px solid black; border-right:1px solid black' ></td>";
                body1 += "</tr>"; 
                body1 += "<tr style='height:40px'>";
                body1 += "</tr>"; 
                body1 += "<tr>";
                body1 += "<td style='font-size:14px;font-weight:bold'>" + nopolMobil + "</td>";
                body1 += "</tr>"; 
                body1 += "<tr style='height:40px'>";
                body1 += "</tr>"; 
                body1 += "</tbody>";
                body1 += "</table>";
                
                // Konten untuk halaman kedua
                body2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body2 += "<tbody>";
                body2 += "<tr>";
                body2 += "<td style='width:15%'></td>";
                body2 += "<td style='width:33%'></td>";
                body2 += "<td style='width:4%'></td>";
                body2 += "<td style='width:18%'></td>";
                body2 += "<td style='width:30%'></td>";
                body2 += "</tr>";
                body2 += "<tr>";
                if (urlLogo) {
                    body2 += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;' colspan='2'><div style='display: flex;' ><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }
                body2 += "<td></td>";
                body2 += "<td style='font-size:18px; font-weight:bold; align:right' colspan='2'>Surat Daftar Kemasan / Packing List</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>DO#</td>";
                body2 += "<td>: " + docnumber + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>Tanggal</td>";
                body2 += "<td>: " + shippingDate + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>SO#</td>";
                body2 += "<td>: " + trandId + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>Cust. PO</td>";
                body2 += "<td>: " + poCust + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>Kirim Ke</td>";
                body2 += "<td rowspa='2'>: " + shipTo + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='height:30px'></td>";
                body2 += "</tr>";
                body2 += "</tbody>";
                body2 += "</table>";

                body2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body2 += "<tbody>";
                body2 += "<tr>";
                body2 += "<td style='width:5%'></td>";
                body2 += "<td style='width:20%'></td>";
                body2 += "<td style='width:15%'></td>";
                body2 += "<td style='width:15%'></td>";
                body2 += "<td style='width:13%'></td>";
                body2 += "<td style='width:12%'></td>";
                body2 += "<td style='width:15%'></td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>No</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kode Barang</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black' colspan='2'>Lokasi</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Batch/Lot No.</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kemasan</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Unit Kemasan</td>";
                body2 += "</tr>";  
                body2 += getLine2(context, ifRec);

                body2 += "<tr>";
                body2 += "<td style='border-bottom:2px solid black; height:20px;' colspan='7'></td>"
                body2 += "</tr>"; 
                body2 += "</tbody>";
                body2 += "</table>";

                body2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body2 += "<tbody>";
                body2 += "<tr>";
                body2 += "<td style='width:20%'></td>";
                body2 += "<td style='width:30%'></td>";
                body2 += "<td style='width:25%'></td>";
                body2 += "<td style='width:25%'></td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='border-top:1px solid black; border-left:1px solid black'>Diterima oleh,</td>"
                body2 += "<td style='border-top:1px solid black; border-left:1px solid black'></td>"
                body2 += "<td style='border-top:1px solid black; border-left:1px solid black'>Disiapkan oleh,</td>"
                body2 += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black'>Diperiksa oleh,</td>"
                body2 += "</tr>"; 

                body2 += "<tr style='height:60px'>";
                body2 += "<td style='border-bottom:1px solid black; border-left:1px solid black'></td>"
                body2 += "<td style='border-bottom:1px solid black; border-left:1px solid black'></td>"
                body2 += "<td style='border-bottom:1px solid black; border-left:1px solid black'></td>"
                body2 += "<td style='border-bottom:1px solid black; border-left:1px solid black; border-right:1px solid black'></td>"
                body2 += "</tr>"; 

                body2 += "</tbody>";
                body2 += "</table>";
                
                footer1 += "<table class='tg' style='table-layout: fixed;'>";
                footer1 += "<tbody>";
                footer1 += "<tr>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "</tr>";
                footer1 += "<tr>";
                footer1 += "<td style='align:center'>" + docnumber + "</td>";
                footer1 += "<td style='align:center'>" + location + "</td>";
                footer1 += "<td style='align:center'>DWIANNUARAH</td>";
                footer1 += "<td style='align:center'>Page 1 of 1</td>";
                footer1 += "</tr>";
                footer1 += "</tbody>";
                footer1 += "</table>";
                
                footer2 += "<table class='tg' style='table-layout: fixed;'>";
                footer2 += "<tbody>";
                footer2 += "<tr>";
                footer2 += "<td style='width:23%'></td>";
                footer2 += "<td style='width:30%'></td>";
                footer2 += "<td style='width:25%'></td>";
                footer2 += "<td style='width:22%'></td>";
                footer2 += "</tr>";
                footer2 += "<tr>";
                footer2 += "<td style='align:center'>DWIANNUARAH</td>";
                footer2 += "<td style='align:center; font-size:10px;'>Surat Daftar Kemasan/Packing List</td>";
                footer2 += "<td style='align:center'>" + docnumber + "</td>";
                footer2 += "<td style='align:center'>Page 1 of 1</td>";
                footer2 += "</tr>";
                footer2 += "</tbody>";
                footer2 += "</table>";
                
                var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xml += "<pdf>";
                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id='nlheader'>";
                xml += header;
                xml += "</macro>";
                xml += "<macro id='nlfooter1'>";
                xml += footer1;
                xml += "</macro>";
                xml += "<macro id='nlfooter2'>";
                xml += footer2;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>";
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter1' footer-height='10%'>";
                xml += body1;
                xml += "</body>";
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter2' footer-height='10%'>";
                xml += body2;
                xml += "</body>";
                xml += "</pdf>";
                
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
            function getLine2(context, ifRec){
                var recid = ifRec.getValue('id');
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
                        var itemId = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
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
                        var locationItem = ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: index
                        });
                        var locationLine
                        if(locationItem){
                            var locationRec =  record.load({
                                type : 'location',
                                id : locationItem,
                                isDynamic : false
                            })
                            var locationName = locationRec.getValue('name');
                            locationLine = locationName
                        }
                        var lotNumberItem = ''
                        log.debug('recId', recid)
                        var itemfulfillmentSearchObj = search.create({
                            type: "itemfulfillment",
                            filters:
                            [
                                ["type","anyof","ItemShip"], 
                                "AND", 
                                ["internalid","anyof",recid], 
                                "AND", 
                                ["inventorydetail.inventorynumber","noneof","@NONE@"], 
                                "AND", 
                                ["item","anyof",itemId]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "inventorynumber",
                                    join: "inventoryDetail",
                                    label: " Number"
                                })
                            ]
                        });
                        var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
                        log.debug("itemfulfillmentSearchObj result count",searchResultCount);
                        itemfulfillmentSearchObj.run().each(function(result){
                            var lot = result.getText({
                                name: "inventorynumber",
                                join: "inventoryDetail",
                            })
                            log.debug('lot', lot);
                            if(lot){
                                lotNumberItem = lot
                            }
                        return true;
                        });
                        log.debug('lotNumberItem', lotNumberItem)
                        nomor++;
                        body += "<tr>";
                        body += "<td style=''>"+nomor+"</td>";
                        body += "<td style=''>"+item+"</td>";
                        body += "<td style='' colspan='2'>"+locationLine+"</td>";
                        body += "<td style=''>"+lotNumberItem+"</td>";
                        body += "<td style=''>"+qty+"</td>";
                        body += "<td style=''>"+units+"</td>";
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