/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function (render, search, record, log, file, http, config, format, email, runtime) {
        try {
            function escapeXmlSymbols(input) {
                if (!input || typeof input !== "string") {
                    return input;
                }
                return input.replace(/&/g, "&amp;");
            }
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
                var searchRec = search.load({
                    id: "customsearch_if_printout_header"
                })
                if (recid) {
                    searchRec.filters.push(search.createFilter({ name: "internalid", operator: search.Operator.IS, values: recid }));
                }
                var ifSearch = searchRec.run();
                var result = ifSearch.getRange(0, 1);
                var ifRec = result[0];

                var soId = ifRec.getValue({ name: 'createdfrom' });
                log.debug('soId', soId);
                var orderDate
                var order
                if (soId) {
                    recSo = record.load({
                        type: 'salesorder',
                        id: soId,
                        isDynamic: false
                    })
                    var salesDate = recSo.getValue('saleseffectivedate');
                    orderDate = salesDate
                    var trandId = recSo.getValue('tranid');
                    order = trandId
                    var poCust = recSo.getValue('otherrefnum');
                }
                var shippingDate = ifRec.getValue({ name: 'trandate' });
                // var dikirim = ifRec.getValue('shipcarrier') || '';

                var docnumber = ifRec.getValue({ name: 'tranid' });
                // log.debug('dikirim', dikirim)
                var ekspedisi = ifRec.getText({ name: 'shipmethod' });
                // var shipTo = ifRec.getValue({
                //     name: "address",
                //     join: "customer",
                // });
                var shipTo = ifRec.getValue({name : 'shipaddress'})
                var nopolMobil = ifRec.getValue({ name: 'custbody_abj_nopol_mobil' })
                var driverName = ifRec.getValue({ name: 'custbody_abj_driver_name' }) //added by kurnia
                if (ekspedisi.includes('&')) {
                    ekspedisi = ekspedisi.replace(/&/g, ' &amp; ');
                }
                var noResi = ifRec.getValue({ name: 'custbodyiss_no_resi' });
                var alamatEks = ifRec.getValue({ name: 'custbody_abj_alamat_ekspedisi' })
                var custName = ifRec.getValue({
                    name: "altname",
                    join: "customer",
                })
                log.debug('custName', custName)
                //added by kurnia
                var busDevRep = ifRec.getText({ name: 'custbody_abj_sales_rep_fulfillment' })
                var nameArr = busDevRep.split(' ')
                var busDevRepName = []
                for (let i = 1; i < nameArr.length; i++) {
                    busDevRepName.push(nameArr[i])
                }
                busDevRepName = busDevRepName.join(' ')
                //


                //added by kurnia
                var dikirim
                if (ekspedisi == '') {
                    dikirim = 'Company Driver'
                } else {
                    dikirim = ekspedisi
                }
                //
                var itemSearch = search.load({
                    id: 'customsearch_if_print_out_line'
                })
                if (recid) {
                    itemSearch.filters.push(search.createFilter({ name: "internalid", operator: search.Operator.IS, values: recid }));
                }
                var itemSearchSet = itemSearch.run();
                var itemCount = itemSearchSet.getRange(0, 100);
                log.debug('itemCount', itemCount)
                var allDataItem = []
                var location
                log.debug('itemCount.length', itemCount.length)
                if (itemCount.length > 0) {
                    for (var index = 0; index < itemCount.length; index++) {
                        var ifItemRec = itemCount[index]
                        var locationItem = ifItemRec.getValue({
                            name: 'location',
                        });
                        if (locationItem) {
                            var locationRec = record.load({
                                type: 'location',
                                id: locationItem,
                                isDynamic: false
                            })
                            var locationName = locationRec.getValue('name');
                            location = locationName
                        }
                        var item = ifItemRec.getText({
                            name: 'item'
                        });
                        var description = ifItemRec.getValue({
                            name: 'custcol_custom_memo_barang'
                        });
                        var qty = ifItemRec.getValue({
                            name: 'quantityuom'
                        });
                        var units = ifItemRec.getValue({
                            name: 'unit'
                        });
                        var totalOrder = ifItemRec.getValue({
                            name: 'custcol_pr_total_order'
                        })
                        log.debug('units', units);
                        var unitConvertion = 1
                        var unitstypeSearchObj = search.create({
                            type: "unitstype",
                            filters: [
                                ["unitname", "is", units]
                            ],
                            columns: [
                                search.createColumn({ name: "conversionrate", label: "Rate" })
                            ]
                        });

                        // Mendapatkan hasil pencarian pertama saja
                        var searchResults = unitstypeSearchObj.run().getRange({ start: 0, end: 1 });

                        if (searchResults.length > 0) {
                            var conversionRate = searchResults[0].getValue("conversionrate");
                            unitConvertion = conversionRate
                            log.debug("Conversion Rate", conversionRate);
                        }

                        var idInvDetail = ifItemRec.getValue({
                            name: "internalid",
                            join: "inventoryDetail",
                        });
                        allDataItem.push({
                            item: item,
                            description: description,
                            qty: qty,
                            units: units,
                            idInvDetail: idInvDetail,
                            unitConvertion: unitConvertion,
                            locationItem: locationItem,
                            totalOrder: totalOrder,
                        })
                    }
                }
                log.debug('allDataItem', allDataItem)
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
                if (orderDate) {
                    function sysDate() {
                        var date = orderDate;
                        var tdate = date.getUTCDate();
                        var month = date.getUTCMonth() + 1; // jan = 0
                        var year = date.getUTCFullYear();
                        return tdate + '/' + month + '/' + year;
                    }
                    orderDate = sysDate();
                }
                // if(shippingDate){
                //     function sysDate() {
                //         var date = shippingDate;
                //         var tdate = date.getUTCDate();
                //         var month = date.getUTCMonth() + 1; // jan = 0
                //         var year = date.getUTCFullYear();
                //         return tdate + '/' + month + '/' + year;
                //     }
                //     shippingDate = sysDate();   
                // }
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
                style += "body {margin-left: 0px;}"
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                // style += ".tg .tg-img-logo{width:220px; height:90px; object-vit:cover;}";
                style += ".tg .tg-img-logo{width:250px; height:70px; object-vit:cover;}"; // added by Kurnia
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
                // body1 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:11px;\">";
                body1 += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:10px;\">";
                body1 += "<tbody>";
                body1 += "<tr style='height:20px;'>";
                body1 += "<td style='' colspan='5'></td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='width:11%'></td>";
                body1 += "<td style='width:37%'></td>";
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
                // body1 += "<td style='font-size:16px; font-weight:bold; align:right' colspan='2'>Surat Jalan / Delivery Order</td>";
                body1 += "</tr>";

                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>DO#</td>";
                body1 += "<td>: " + escapeXmlSymbols(docnumber) + "</td>";
                body1 += "<td></td>";
                body1 += "<td style='font-weight:bold'>Dikirim Dengan</td>";
                if (ekspedisi == '') {
                    body1 += "<td>: " + escapeXmlSymbols(dikirim) + "</td>";
                } else {
                    body1 += "<td>: " + escapeXmlSymbols(ekspedisi) + "</td>";
                }
                body1 += "</tr>";

                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>Tanggal</td>";
                body1 += "<td>: " + shippingDate + "</td>";
                body1 += "<td></td>";
                body1 += "<td style='font-weight:bold'>Sales</td>";
                body1 += "<td>: " + escapeXmlSymbols(busDevRepName) + "</td>";
                body1 += "</tr>";

                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>SO#</td>";
                body1 += "<td>: " + escapeXmlSymbols(trandId) + "</td>";
                if (ekspedisi == '') {
                    body1 += "<td></td>"
                    body1 += "<td style='font-weight:bold'>Nama Driver</td>"
                    body1 += "<td>: " + escapeXmlSymbols(driverName) + "</td>"
                } else {
                    body1 += "<td></td>"
                    body1 += "<td style='font-weight:bold'></td>"
                    body1 += "<td></td>"
                }
                body1 += "</tr>";

                body1 += "<tr>";
                body1 += "<td style='font-weight:bold'>Cust. PO</td>";
                body1 += "<td>: " + escapeXmlSymbols(poCust) + "</td>";
                if (ekspedisi == '') {
                    body1 += "<td></td>"
                    body1 += "<td style='font-weight:bold'>No. Pol Mobil</td>"
                    body1 += "<td rowspan='3'>: " + escapeXmlSymbols(nopolMobil) + "</td>"
                } else {
                    body1 += "<td></td>"
                    body1 += "<td style='font-weight:bold'></td>"
                    body1 += "<td rowspan='3'></td>"
                }
                body1 += "</tr>";
                log.debug('custName', custName);
                log.debug('shipto', shipTo)
                if (shipTo.includes("\n")) {
                    shipTo = shipTo.replace(/\r?\n/g, '<br/>');
                } else {
                    log.debug("shipTo tidak mengandung ENTER", false);
                }
                body1 += "<tr>";
                body1 += "<td style='font-weight:bold; vertical-align:top; width:100px;'>Customer</td>";
                body1 += "<td colspan='3' style='vertical-align:top; word-wrap:break-word; word-break:break-word; white-space:normal; max-width:400px;'>"
                    + ": " + escapeXmlSymbols(custName).trim()
                    + "</td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='font-weight:bold; vertical-align:top; width:100px;'>Kirim Ke</td>";
                body1 += "<td colspan='3' style='vertical-align:top; word-wrap:break-word; word-break:break-word; white-space:normal; max-width:400px;'>"
                    + ": " + escapeXmlSymbols(shipTo).trim()
                    + "</td>";
                body1 += "</tr>";



                body1 += "<tr>";
                body1 += "<td style='height:10px'></td>";
                body1 += "</tr>";
                body1 += "</tbody>";
                body1 += "</table>";
                body1 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body1 += "<tbody>";
                body1 += "<tr>";
                body1 += "<td style='width:5%'></td>";
                body1 += "<td style='width:20%'></td>";
                body1 += "<td style='width:15%'></td>";
                body1 += "<td style='width:15%'></td>";
                body1 += "<td style='width:10%'></td>";
                body1 += "<td style='width:15%'></td>";
                body1 += "<td style='width:15%'></td>";
                body1 += "</tr>";
                body1 += "<tr>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>No</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kode Barang</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black' colspan='2'>Keterangan</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Pack Size</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Jumlah Packaging</td>";
                body1 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Total QTY</td>";
                body1 += "</tr>";
                body1 += getLine(context, allDataItem);
                body1 += "</tbody>";
                body1 += "</table>";
               

                // Konten untuk halaman kedua
                body2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body2 += "<tbody>";
                body2 += "<tr>";
                body2 += "<td style='width:11%'></td>";
                body2 += "<td style='width:37%'></td>";
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
                body2 += "<td>: " + escapeXmlSymbols(docnumber) + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>Tanggal</td>";
                body2 += "<td>: " + escapeXmlSymbols(shippingDate) + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>SO#</td>";
                body2 += "<td>: " + escapeXmlSymbols(trandId) + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>Cust. PO</td>";
                body2 += "<td>: " + escapeXmlSymbols(poCust) + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='font-weight:bold'>Kirim Ke</td>";
                body2 += "<td rowspan='2' colspan='3'>: " + escapeXmlSymbols(shipTo) + "</td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='height:30px'></td>";
                body2 += "</tr>";
                body2 += "</tbody>";
                body2 += "</table>";

                // body2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:11px;\">";
                body2 += "<tbody>";
                body2 += "<tr>";
                body2 += "<td style='width:5%'></td>";
                body2 += "<td style='width:15%'></td>";
                body2 += "<td style='width:20%'></td>";
                body2 += "<td style='width:15%'></td>";
                body2 += "<td style='width:10%'></td>";
                body2 += "<td style='width:15%'></td>";
                body2 += "<td style='width:15%'></td>";
                body2 += "</tr>";
                body2 += "<tr>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>No</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Kode Barang</td>";
                // body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black' colspan='2'>Lokasi</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Lokasi</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Batch/Lot No.</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Pack Size</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Jumlah Packaging</td>";
                body2 += "<td style='border-top:1px solid black; border-bottom:2px solid black'>Total QTY</td>";
                body2 += "</tr>";
                body2 += getLine2(context, allDataItem);

                body2 += "<tr>";
                body2 += "<td style='border-bottom:2px solid black; height:20px;' colspan='7'></td>"
                body2 += "</tr>";
                body2 += "</tbody>";
                body2 += "</table>";

                footer1 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                footer1 += "<tbody>";
                footer1 += "<tr>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "</tr>";
                footer1 += "<tr>";
                footer1 += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black' >Diterima Oleh :</td>";
                footer1 += "<td style='border-top:1px solid black; border-right:1px solid black'>Driver,</td>";
                footer1 += "<td style='border-top:1px solid black; border-right:1px solid black' >Warehouse,</td>";
                footer1 += "<td style='border-top:1px solid black; border-right:1px solid black' >Administrasi,</td>";
                footer1 += "</tr>";
                footer1 += "<tr style='height:40px'>";
                footer1 += "<td style='border-bottom:1px solid black; border-left:1px solid black; border-right:1px solid black' ></td>";
                footer1 += "<td style='border-bottom:1px solid black; border-right:1px solid black'></td>";
                footer1 += "<td style='border-bottom:1px solid black; border-right:1px solid black' ></td>";
                footer1 += "<td style='border-bottom:1px solid black; border-right:1px solid black' ></td>";
                footer1 += "</tr>";
                footer1 += "<tr>";
                footer1 += "</tr>";
                footer1 += "</tbody>";
                footer1 += "</table>";

                footer1 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                footer1 += "<tbody>";
                footer1 += "<tr style=''>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "<td style='width:25%'></td>";
                footer1 += "</tr>";
                footer1 += "<tr>";
                footer1 += "<td style='align:center'></td>";
                footer1 += "<td style='align:center'></td>";
                footer1 += "<td style='align:center'></td>";
                footer1 += "<td style='align:center'>Page 1 of 1</td>";
                footer1 += "</tr>";
                footer1 += "<tr style='height:90px;'>";
                footer1 += "</tr>";
                footer1 += "</tbody>";
                footer1 += "</table>";

                footer2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:11px;\">";
                footer2 += "<tbody>";
                footer2 += "<tr>";
                footer2 += "<td style='width:20%'></td>";
                footer2 += "<td style='width:30%'></td>";
                footer2 += "<td style='width:25%'></td>";
                footer2 += "<td style='width:25%'></td>";
                footer2 += "</tr>";
                footer2 += "<tr>";
                footer2 += "<td style='border-top:1px solid black; border-left:1px solid black'>Diterima oleh,</td>"
                footer2 += "<td style='border-top:1px solid black; border-left:1px solid black'></td>"
                footer2 += "<td style='border-top:1px solid black; border-left:1px solid black'>Disiapkan oleh,</td>"
                footer2 += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black'>Diperiksa oleh,</td>"
                footer2 += "</tr>";

                // footer2 += "<tr style='height:60px'>";
                footer2 += "<tr style='height:40px'>";
                footer2 += "<td style='border-bottom:1px solid black; border-left:1px solid black'></td>"
                footer2 += "<td style='border-bottom:1px solid black; border-left:1px solid black'></td>"
                footer2 += "<td style='border-bottom:1px solid black; border-left:1px solid black'></td>"
                footer2 += "<td style='border-bottom:1px solid black; border-left:1px solid black; border-right:1px solid black'></td>"
                footer2 += "</tr>";

                footer2 += "</tbody>";
                footer2 += "</table>";

                footer2 += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:11px;\">";
                footer2 += "<tbody>";
                footer2 += "<tr style=''>";
                footer2 += "<td style='width:23%'></td>";
                footer2 += "<td style='width:30%'></td>";
                footer2 += "<td style='width:25%'></td>";
                footer2 += "<td style='width:22%'></td>";
                footer2 += "</tr>";
                footer2 += "<tr>";
                footer2 += "<td style='align:center'>" + escapeXmlSymbols(busDevRepName) + "</td>";
                footer2 += "<td style='align:center; font-size:10px;'>Surat Daftar Kemasan/Packing List</td>";
                footer2 += "<td style='align:center'>" + escapeXmlSymbols(docnumber) + "</td>";
                footer2 += "<td style='align:center'>Page 1 of 1</td>";
                footer2 += "</tr>";
                footer2 += "</tbody>";
                footer2 += "</table>";

                var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xml += "<pdf>";
                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id=\"nlheader\">";
                xml += header;
                xml += "</macro>";
                xml += "<macro id=\"nlfooter1\">";
                xml += footer1;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>"
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;padding:8px;height: 13cm; width: 21cm;' header='nlheader' header-height='0cm' footer='nlfooter1' footer-height='3cm'>";
                xml += body1;
                xml += "\n</body>";

                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id=\"nlheaderBarang\">";
                xml += header;
                xml += "</macro>";
                xml += "<macro id=\"nlfooter2\">";
                xml += footer2;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>"
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;padding:8px;height: 13cm; width: 21cm;' header='nlheaderBarang' header-height='0cm' footer='nlfooter2' footer-height='3cm'>";
                xml += body2;
                xml += "\n</body>\n</pdf>";

                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });


            }
            function getLine(context, allDataItem) {
                if (allDataItem.length > 0) {
                    var nomor = 0
                    var body = "";
                    for (var index = 0; index < allDataItem.length; index++) {
                        log.debug('allDataItem line', allDataItem)
                        var dataItem = allDataItem[index];
                        log.debug('dataItem', dataItem)
                        var item = dataItem.item.split(" ")[0];
                        var itemDesc = dataItem.item.split(' ').slice(1).join(' ');
                        var description = dataItem.description
                        var qty = dataItem.qty
                        var units = dataItem.units
                        var satuan = units.split(" ")
                        var unitConvertion = dataItem.unitConvertion
                        var totalOrder = dataItem.totalOrder

                        var konversi
                        if (unitConvertion) {
                            konversi = Number(qty) * Number(unitConvertion)
                        }
                        nomor++;
                        body += "<tr>";
                        body += "<td style=''>" + nomor + "</td>";
                        body += "<td style='white-space: nowrap; text-align: center;'>" +escapeXmlSymbols(item)+ "</td>";
                        body += "<td style='' colspan='2'>" + (escapeXmlSymbols(description) || escapeXmlSymbols(itemDesc)) + "</td>";
                        body += "<td style=''>" + units + "</td>";
                        body += "<td style=''>" + qty + "</td>";
                        body += "<td style=''>" + totalOrder + " " + satuan[satuan.length - 1] + "</td>";
                        body += "</tr>";

                    }
                    return body;
                }

            }
            function getLine2(context, allDataItem) {
                if (allDataItem.length > 0) {
                    var nomor = 0
                    var body = "";
                    for (var index = 0; index < allDataItem.length; index++) {
                        var dataItem = allDataItem[index];
                        var item = dataItem.item.split(" ")[0];
                        var itemId = dataItem.itemId
                        var itemDesc = dataItem.item.split(' ').slice(1).join(' ');

                        var idInvDetail = dataItem.idInvDetail
                        var description = dataItem.description
                        var qty = dataItem.qty
                        var units = dataItem.units
                        var satuan = units.split(" ")

                        //added by kurnia
                        var unitConvertion = dataItem.unitConvertion

                        var konversi
                        if (unitConvertion) {
                            konversi = Number(qty) * Number(unitConvertion)
                        }
                        //

                        var locationItem = dataItem.locationItem
                        var locationLine
                        if (locationItem) {
                            var locationRec = record.load({
                                type: 'location',
                                id: locationItem,
                                isDynamic: false
                            })
                            var locationName = locationRec.getValue('name');
                            locationLine = locationName
                        }
                        var allLot = []
                        if (idInvDetail) {
                            var inventorydetailSearchObj = search.create({
                                type: "inventorydetail",
                                filters:
                                    [
                                        ["internalid", "anyof", idInvDetail]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "inventorynumber", label: " Number" })
                                    ]
                            });
                            var searchResultCount = inventorydetailSearchObj.runPaged().count;
                            log.debug("inventorydetailSearchObj result count", searchResultCount);
                            inventorydetailSearchObj.run().each(function (result) {
                                var numberInv = result.getText({
                                    name: "inventorynumber"
                                })
                                allLot.push(numberInv)
                                return true;
                            });
                        }
                        log.debug('allLot', allLot)
                        const convLot = allLot.join(",<br/> ");
                        nomor++;
                        body += "<tr>";
                        body += "<td style=''>" + nomor + "</td>";
                        body += "<td style='white-space: nowrap; text-align: center;'>" + escapeXmlSymbols(item) + "</td>";
                        // body += "<td style='' colspan='2'>"+locationLine+"</td>";
                        body += "<td style=''>" + (escapeXmlSymbols(description) || escapeXmlSymbols(itemDesc)) + "<br/>" + escapeXmlSymbols(locationLine) + "</td>";//kurnia
                        body += "<td style=''>" + convLot + "</td>";
                        body += "<td style=''>" + units + "</td>";
                        body += "<td style=''>" + qty + "</td>";
                        body += "<td>" + konversi + " " + satuan[satuan.length - 1] + "</td>"; //kurnia
                        body += "</tr>";
                    }
                    return body;
                }



            }
        } catch (e) {
            log.debug('error', e)
        }

        return {
            onRequest: onRequest,
        };
    });