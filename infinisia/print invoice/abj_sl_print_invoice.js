/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        try{
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
            function convertDateFormat(inputDate) {
                var parts = inputDate.split('/');
                var day = parts[0];
                var month = parts[1];
                var year = parts[2];
                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
                var monthName = monthNames[parseInt(month, 10) - 1];
                var formattedDate = day + '-' + monthName + '-' + year;
                
                return formattedDate;
            }
            function onRequest(context) {
                var recid = context.request.parameters.id;
                var poSavedLoad = search.load({
                    id: "customsearch_invoice_body_printout",
                });
                if(recid){
                    poSavedLoad.filters.push(search.createFilter({name: "internalid", operator: search.Operator.IS, values: recid}));
                }
                var poSavedLoadSet = poSavedLoad.run();
                var result = poSavedLoadSet.getRange(0, 1);
                var invRec = result[0];
                
                var trandId = invRec.getValue({
                    name: "tranid"
                });
                var trandate = invRec.getValue({
                    name: "trandate"
                });
                var idIf = invRec.getValue({
                    name: "custbody3"
                });
                var isDPP = invRec.getValue({
                    name: "custbody_abj_nilai_dpp"
                });
                var doNo = ''
                if(idIf){
                    var itemfulfillmentSearchObj = search.create({
                        type: "itemfulfillment",
                        filters:
                        [
                            ["type","anyof","ItemShip"], 
                            "AND", 
                            ["internalid","anyof",idIf], 
                            "AND", 
                            ["mainline","is","T"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "tranid", label: "Document Number"})
                        ]
                    });
                    var ifSet = itemfulfillmentSearchObj.run();
                    var resultIF = ifSet.getRange(0, 1);
                    var ifRecc = resultIF[0];
                    var doNo = ifRecc.getValue({
                        name : "tranid"
                    })
                }
                var duedate = invRec.getValue({
                    name: "duedate"
                });
                var noPo = invRec.getValue({
                    name: "formulatext",
                    formula: "{otherRefNum}",
                });
                var salesRep = invRec.getValue({
                    name: "salesrep"
                });
                var salesName = ''
                if (salesRep){
                    var empRec = record.load({
                        type: "employee",
                        id: salesRep,
                        isDynamic: false,
                    })
                    nama = empRec.getValue('altname');
                    if(nama){
                        salesName = nama
                    }
                   
                }
                var idCust = invRec.getValue({
                    name: "internalid",
                    join: "customer",
                });
                var billTo = invRec.getValue({
                    name : 'billaddress'
                });
                if(billTo){
                    if(billTo.includes('\n')){
                        billTo = billTo.replace('\n', '<br/>');
                    }
                }
                var shipTo = invRec.getValue({
                    name : 'shipaddress'
                });
                if(shipTo){
                    if(shipTo.includes('\n')){
                        shipTo = shipTo.replace('\n', '<br/>');
                    }
                }
                var accName = invRec.getValue('custbody_iss_inv_account_name');
                var bankNumber = invRec.getValue('custbody_iss_inv_bank_number');
                var bankName = invRec.getValue('custbody_iss_inv_branch_name');
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
                var subTotal = invRec.getValue({
                    name: "formulanumeric",
                    formula: "{amount} - nvl({taxtotal},0) - nvl({shippingamount},0)",
                });
                var discount = invRec.getValue({
                    name: "discountamount"
                }) || 0;
                var taxTotal = invRec.getValue({
                    name: "taxtotal"
                }) || 0;
                if(taxTotal == ''){
                    taxTotal = 0
                }
                var total = invRec.getValue({
                    name: "total"
                });

                var discProsent = 0.00
                if(discount){
                    discount = Math.abs(discount);
                    var prosentaseDiscount = Math.abs(Number(discount) / Number(subTotal) * 100);
                    discProsent = prosentaseDiscount;
                }
                var companyInfo = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                var legalName = companyInfo.getValue("legalname");
    
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
                var taxPros = [];
                var uniqueTaxRates = {};
                var taxRateDPP
                var itemSearch = search.load({
                    id: "customsearch_invoice_line_printout",
                });
                if(recid){
                    itemSearch.filters.push(search.createFilter({name: "internalid", operator: search.Operator.IS, values: recid}));
                }
                var itemSearchSet = itemSearch.run();
                var itemCount = itemSearchSet.getRange(0, 100);
                var allDataItem = []
                if(itemCount.length > 0){
                    for(var index = 0; index < itemCount.length; index++){
                        var invRec = itemCount[index]
                        var taxRate = invRec.getValue({
                            name: "rate",
                            join: "taxItem",
                        })
                        if(taxRate){
                            taxRateDPP = taxRate;
                        }
                        var itemName = invRec.getValue({
                            name: "itemid",
                            join: "item",
                        })
                        if (!uniqueTaxRates.hasOwnProperty(taxRate)) {
                            uniqueTaxRates[taxRate] = true;
                            taxPros.push(taxRate);
                        }
                        var qty = invRec.getValue({
                            name: "quantity"
                        });
                        var namaBarang = invRec.getValue({
                            name: "custcol16",
                        });
                        log.debug('namaBarang', namaBarang)
                        var rate = invRec.getValue({
                            name: "rate"
                        });
                        var unit = invRec.getValue({
                            name: "unit"
                        });
                        
                        var amount = invRec.getValue({
                            name: "amount"
                        });
                        var totalOrder = invRec.getValue({
                            name: "custcol_pr_total_order"
                        });
                        var convRate = 0
                        if(unit){
                            var unitstypeSearchObj = search.create({
                                type: "unitstype",
                                filters: [
                                    ["unitname","is",unit]
                                ],
                                columns: [
                                    search.createColumn({ name: "conversionrate", label: "Rate" })
                                ]
                            });
                            
                            var searchResults = unitstypeSearchObj.run().getRange({ start: 0, end: 1 });
                            
                            if (searchResults.length > 0) {
                                convRate = searchResults[0].getValue("conversionrate");
                            }
                        }
                        var countTotalPacking = 0
                        if(convRate > 0){
                            countTotalPacking = Number(totalOrder) / Number(convRate)
                        }
                        allDataItem.push({
                            qty : qty,
                            namaBarang : namaBarang,
                            rate : rate,
                            unit : unit,
                            amount : amount,
                            itemName : itemName,
                            totalOrder : totalOrder,
                            countTotalPacking : countTotalPacking
                        })
                    }
                }
                if(trandate){
                    trandate = convertDateFormat(trandate)
                }
                if(duedate){
                    duedate = convertDateFormat(duedate)
                }
                var subtotalToCount = 0;
                if(subTotal){
                    subtotalToCount = subTotal
                    subTotal = pembulatan(subTotal)
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                }
                if(discount){
                    discount = pembulatan(discount)
                    discount = format.format({
                        value: discount,
                        type: format.Type.CURRENCY
                    });
                }
                if(total){
                    total = pembulatan(total)
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY
                    });
                }
                if(taxTotal){
                    taxTotal = pembulatan(taxTotal)
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
                // kedua
                var headerDua = "";
                var bodyDua = "";
                var footerDua = "";
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
                style += ".second-table { page-break-before: always; }";
                style += "</style>";

                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:17%'></td>"
                body += "<td style='width:50%'></td>"
                body += "<td style='width:20%'></td>"
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
                body += "</tr>";

                body+= "<tr>"
                body+= "<td style='font-size:18px; align:center; font-weight:bold;'>Invoice</td>"
                body+= "<td style='' colspan='2'></td>"
                body+= "</tr>"

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";

                body += "<tr>";
                body+= "<td style='width:17%'></td>"
                body+= "<td style='width:30%'></td>"
                body+= "<td style='width:20%'></td>"
                body+= "<td style='width:33%'></td>"
                body+= "</tr>"

                body += "<tr>";
                body+= "<td style='font-weight:bold;'>Faktur/Invoice #</td>"
                body+= "<td style='font-weight:bold;'>"+escapeXmlSymbols(trandId)+"</td>"
                body+= "<td style='font-weight:bold;'>Pesanan Pembelian/Po#</td>"
                body+= "<td style='font-weight:bold;'>"+escapeXmlSymbols(noPo)+"</td>"
                body+= "</tr>"

                body += "<tr>";
                body+= "<td style='font-weight:bold;'>Tanggal/Date</td>"
                body+= "<td style='font-weight:bold;'>"+trandate+"</td>"
                body+= "<td style='font-weight:bold;'>Delivery Order No</td>"
                body+= "<td style='font-weight:bold;'>"+escapeXmlSymbols(doNo)+"</td>"
                body+= "</tr>"

                body += "<tr>";
                body+= "<td style='font-weight:bold;'>Tempo/Due in</td>"
                body+= "<td style='font-weight:bold;'>"+duedate+"</td>" 
                body+= "<td style='font-weight:bold;'>Sales Person</td>"
                body+= "<td style='font-weight:bold;'>"+escapeXmlSymbols(salesName)+"</td>"
                body+= "</tr>"

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";

                body += "<tr style='height:20px;'>";
                body += "<td style='width: 45%;'></td>"
                body += "<td style='width: 2%'></td>"
                body += "<td style='width: 53%;'></td>"
                body += "</tr>"

                body+= "<tr>"
                body+= "<td style='font-weight:bold'>Kepada/Sold to:</td>"
                body+= "<td></td>"
                body+= "<td style='font-weight:bold; align:left'>Barang Telah dikirim ke/Goods Delivered to:</td>"
                body+= "</tr>"

                body+= "<tr>"
                body+= "<td style='align:left'>"+escapeXmlSymbols(billTo)+"</td>"
                body+= "<td></td>"
                body+= "<td style='align:left'>"+escapeXmlSymbols(shipTo)+"</td>"
                body+= "</tr>"

                // body+= "<tr>"
                // body+= "<td style='align:left'>"+custAdders+"</td>"
                // body+= "<td></td>"
                // body+= "<td style='align:left'>"+custAdders+"</td>"
                // body+= "</tr>"

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
                body += "<td class='tg-head_body' style='width:25%; align:left;'>Nama Barang / Goods Description</td>"
                body += "<td class='tg-head_body' style='width:10%; align:center;'>Pack Size</td>"
                body += "<td class='tg-head_body' style='width:14%; align:center;'>Jumlah Packing</td>"
                body += "<td class='tg-head_body' style='width:8%; align:center;'>Total Qty</td>"
                body += "<td class='tg-head_body' style='width:15%; align:right;'>Harga Satuan / Price</td>"
                body += "<td class='tg-head_body' style='width:13%; align:right;'>Total</td>"
                body += "</tr>"

                body += getPOItem(context, allDataItem)
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
                var nilaiDPP = 0
                if(isDPP){
                    var numericTaxRate = parseFloat(taxRate);
                    if(subtotalToCount){
                        nilaiDPP = Number(subtotalToCount) * numericTaxRate / Number(isDPP)
                    }
                }else{
                    log.debug('tidak ada DPP')
                }
                
                if(taxPros){
                    
                    taxPros = taxPros.map(function(tax) {
                        return tax.includes('%') ? tax : tax + '%';
                    });
                }
                
                
                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td>Subtotal</td>"
                body+= "<td></td>"
                body+= "<td>IDR</td>"
                body+= "<td style='align:right'>"+removeDecimalFormat(subTotal)+"</td>"
                body += "</tr>"
                if(discount){
                    body+= "<tr>"
                    body+= "<td></td>"
                    body+= "<td>Discount</td>"
                    body+= "<td>"+discProsent+"%</td>"
                    body+= "<td>IDR</td>"
                    body+= "<td style='align:right'>"+removeDecimalFormat(discount)+"</td>"
                    body += "</tr>"
                }else{
                    body+= "<tr>"
                    body+= "<td></td>"
                    body+= "<td>Discount</td>"
                    body+= "<td>0.00%</td>"
                    body+= "<td>IDR</td>"
                    body+= "<td style='align:right'>0.00</td>"
                    body += "</tr>"
                }
                
                if(nilaiDPP && nilaiDPP > 0){
                    nilaiDPP = pembulatan(nilaiDPP)
                    nilaiDPP = format.format({
                        value: nilaiDPP,
                        type: format.Type.CURRENCY
                    });
                    body+= "<tr>"
                    body+= "<td></td>"
                    body+= "<td colspan='2'>DPP Nilai Lain</td>"
                    body+= "<td>IDR</td>"
                    body+= "<td style='align:right'>"+removeDecimalFormat(nilaiDPP) +"</td>"
                    body += "</tr>"
                }
                
                
                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td style='border-bottom : 1px solid black'>PPN</td>"
                body+= "<td style='border-bottom : 1px solid black'></td>"
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

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td>1.Barang yang sudah dibeli tidak dapat ditukar ataupun dikembalikan tanpa perjanjian dimuka // Goods sold may not be returned or exchange without prior agreement</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td>2.Pembayaran CEK / GIRO / TRANSFER Bank dianggap lunas apabila dana telah efektif diterima di rekening kami // Payment through CHQEUE / GIRO / BANK Transfer shall be settled after the funds has been received in our account</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td>3. Harap melakukan pembayaran dalam jumlah penuh ke// Please pay in FULL AMOUNT to :</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:10%;'></td>"
                body += "<td style='width:85%;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style=''></td>"
                body += "<td style='font-weight:bold;'>A/N</td>"
                body += "<td style='font-weight:bold;'>PT. Infinisia Sumber Semesta</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style=''></td>"
                body += "<td style='font-weight:bold;'>BANK</td>"
                body += "<td style='font-weight:bold;'>BCA - Citra Garden</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style=''></td>"
                body += "<td style='font-weight:bold;'>ACCOUNT</td>"
                body += "<td style='font-weight:bold;'>3993349999</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";


                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>4.Mohon pembayaran dapat disesuaikan dengan jumlah nominal pada invoice, perbedaan nominal akan ditagihkan pada tagihan berikutnya.</td>"
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

                // page dua
    
                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });

            }
            
            function getPOItem(context, allDataItem){
                if(allDataItem.length > 0){
                    var body = "";
                    var No = 1;
                    for(var i = 0; i < allDataItem.length; i++){
                        var item = allDataItem[i];
                        var itemName = item.itemName
                        var qty = item.qty
                        var namaBarang = item.namaBarang
                        var rate = item.rate
                        var unit = item.unit
                        var totalOrder = item.totalOrder
                        log.debug('namaBarang', namaBarang)
                        var countTotalPacking = item.countTotalPacking
                        var amount = item.amount

                        if(rate){
                            rate = pembulatan(rate)
                            rate = format.format({
                                value: rate,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(amount){
                            amount = pembulatan(amount)
                            amount = format.format({
                                value: amount,
                                type: format.Type.CURRENCY
                            });
                        }
                        body += "<tr>";
                        body += "<td class='tg-b_body' style='align:center;'>"+No+"</td>";
                        body += "<td class='tg-b_body' style='align:left;'>"+(escapeXmlSymbols(namaBarang) || escapeXmlSymbols(itemName))+"</td>";
                        body += "<td class='tg-b_body' style='align:center;'>"+unit+"</td>";
                        body += "<td class='tg-b_body' style='align:center;'>"+escapeXmlSymbols(countTotalPacking)+"</td>";
                        body += "<td class='tg-b_body' style='align:center;'>"+escapeXmlSymbols(totalOrder)+"</td>";
                        body += "<td class='tg-b_body' style='align:right;'>"+removeDecimalFormat(rate)+"</td>";
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