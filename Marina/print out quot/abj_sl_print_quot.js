/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {

        function escapeXmlSymbols(input) {
            if (!input || typeof input !== "string") {
                return input;
            }
            return input.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&apos;");
        }
        function formatNumber(num) {
            if (isNaN(num)) return "0.00";
            return Number(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        function formatDateToDDMMYYYY(dateObj) {
            if (!dateObj) return '';

            // Pastikan input adalah Date object
            var date = new Date(dateObj);

            // Ambil komponen tanggal
            var day = String(date.getDate()).padStart(2, '0');
            var month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() dimulai dari 0
            var year = date.getFullYear();

            // Gabungkan ke format DD/MM/YYYY
            return `${day}/${month}/${year}`;
        }
        function onRequest(context) {
            try{
                var recid = context.request.parameters.id;
                log.debug('recId', recid)
                if(recid){
                    var recLoad = record.load({
                        type : 'estimate',
                        id : recid
                    });
                    var subsId = recLoad.getValue('subsidiary');
                    var subsidiariRec = record.load({
                        type: "subsidiary",
                        id: subsId,
                        isDynamic: false,
                    });
                    var subsidiariId = subsId.id
                    var legalName = subsidiariRec.getValue('legalname');
                    var name = subsidiariRec.getValue('name');
                    var addresSubsidiaries = subsidiariRec.getValue('mainaddress_text');
                    if(addresSubsidiaries.includes("<br>")){
                        addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
                    }
                    if(name){
                        addresSubsidiaries = addresSubsidiaries.replace(name, "");
                    }

                    var retEmailAddres = subsidiariRec.getValue('email');
                    var Npwp = subsidiariRec.getValue('federalidnumber');
                    var phoneNo = subsidiariRec.getValue('addrphone');
                    var logo = subsidiariRec.getValue('logo');
                    log.debug('logo', logo);
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
                    var customerId = recLoad.getValue('entity');
                    var custName = '';
                    if(customerId){
                        var fieldLookCust = search.lookupFields({
                            type: "customer",
                            id: customerId,
                            columns: ["altname",],
                        });
                        custName = fieldLookCust.altname;
                    }
                    log.debug('custName', custName);
                    var empName = ''
                    var empId = recLoad.getValue('custbody_fcn_sales_employee');
                    if(empId){
                        var fieldLookEMp = search.lookupFields({
                            type: "employee",
                            id: empId,
                            columns: ["entityid",],
                        });
                        empName = fieldLookEMp.entityid;
                    }
                    var trandId = recLoad.getValue('tranid');
                    var trandDate = recLoad.getValue('trandate');
                    var terms = recLoad.getValue('custbody_msa_terms');
                    var allItem = []
                    var cekLineItem = recLoad.getLineCount({
                        sublistId : 'item'
                    });
                    if(cekLineItem > 0){
                        for(var i = 0; i < cekLineItem; i++){
                            var itemId = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'item',
                                line : i
                            });
                            var itemName = ''
                            var upcCode = ''
                            var itemSearchObj = search.create({
                                type: "item",
                                filters:
                                [
                                    ["internalid","anyof",itemId]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "itemid", label: "Name"}),
                                    search.createColumn({name: "upccode", label: "UPC Code"})
                                ]
                                });
                                var searchResultCount = itemSearchObj.runPaged().count;
                                log.debug("itemSearchObj result count",searchResultCount);
                                itemSearchObj.run().each(function(result){
                                    itemName = result.getValue({
                                        name : "itemid"
                                    })
                                    upcCode = result.getValue({
                                        name : "upccode"
                                    })
                                return true;
                            });
                            var qty = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'quantity',
                                line : i
                            })
                            var unit = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'units_display',
                                line : i
                            })
                            var rate = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'rate',
                                line : i
                            })
                            var grossAmt = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'grossamt',
                                line : i
                            })
                            allItem.push({
                                itemName : itemName,
                                upcCode : upcCode,
                                qty : qty,
                                unit : unit,
                                rate : rate,
                                grossAmt : grossAmt
                            })
                        }
                    }
                    var response = context.response;
                    var xml = "";
                    var header = "";
                    var body = "";
                    var headerHeight = '10 %';
                    var style = "";
                    var footer = "";
                    var pdfFile = null;
                    
                    // css
                    style += "<style type='text/css'>";
                    style += "*{padding : 0; margin:0;}";
                    style += "body{padding-left : 5px; padding-right : 5px;}";
                    style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                    style += ".tg .tg-headerlogo {align:right; border:none;}";
                    style += ".tg .tg-img-logo {width:80px; height:80px; object-fit:cover;}";
                    style += ".tg .tg-headerrow, .tg .tg-headerrow_alva {align: right; font-size:12px;}";
                    style += ".tg .tg-headerrow_legalName, .tg .tg-headerrow_legalName_Alva {align: left; font-size:13px; font-weight: bold;}";
                    style += ".tg .tg-headerrow_Total {align: right; font-size:16px; font-weight: bold;}";
                    style += ".tg .tg-head_body {align: left; font-size:12px; font-weight: bold; border-top:3px solid black; border-bottom:3px solid black;}";
                    style += ".tg .tg-jkm {background-color:#eba134;}";
                    style += ".tg .tg-sisi {background-color:#F8F40F;}";
                    style += ".tg .tg-alva {background-color:#08B1FF;}";
                    style += ".tg .tg-froyo {background-color:#0A65EC; color:#F9FAFC;}";
                    style += ".tg .tg-b_body {align:left; font-size:12px; border-bottom:2px solid black;}";
                    style += ".tg .tg-f_body {align:right; font-size:14px; border-bottom:2px solid black;}";
                    style += ".tg .tg-foot {font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                    style += "</style>";
                    
                    // header
                    header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "<td style='width:2%'></td>"
                    header += "<td style='width:73%'></td>"
                    header += "</tr>"
                    
                    header += "<tr>"
                    if (urlLogo) {
                        header += "<td class='tg-headerlogo' style='width:50%;vertical-align: middle; margin-left:4px;' rowspan='4'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                    }
                    header += "<td style='font-weight:bold; font-size:18px;' colspan='4'>"+escapeXmlSymbols(legalName)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style=''><b>Kantor</b></td>"
                    header += "<td>:</td>"
                    header += "<td>"+escapeXmlSymbols(addresSubsidiaries)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style=' '><b>Telp</b></td>"
                    header += "<td style=' '>:</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style=' '><b>Email</b></td>"
                    header += "<td style=' '>:</td>"
                    header += "<td style=' '>"+escapeXmlSymbols(retEmailAddres)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='border-top:1px solid black;' colspan='4'></td>"
                    header += "</tr>"

                    header += "</tbody>";
                    header += "</table>";

                    body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                    body += "<tbody>";
                    body += "<tr>"
                    body += "<td style='color:#4144FAFF; font-weight:bold; font-size:12px;'>SURAT PENAWARAN HARGA</td>"
                    body += "</tr>"

                    body += "<tr style='height:7px;'>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='color:#4144FAFF; font-weight:bold;'>Nomor : "+trandId+"</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='color:#4144FAFF; font-weight:bold;'>Tanggal : "+formatDateToDDMMYYYY(trandDate)+"</td>"
                    body += "</tr>"
                    body += "<tr style='height:7px;'>"
                    body += "</tr>"
                    body += "<tr>"
                    body += "<td style=''>Kepada Yth</td>"
                    body += "</tr>"
                    body += "<tr>"
                    body += "<td style='font-weight:bold'>"+escapeXmlSymbols(custName)+"</td>"
                    body += "</tr>"
                     body += "<tr style='height:7px;'>"
                    body += "</tr>"
                    body += "<tr>"
                    body += "<td style=''>Dengan hormat,</td>"
                    body += "</tr>"

                     body += "<tr style='height:7px;'>"
                    body += "</tr>"
                    body += "<tr>"
                    body += "<td style=''>Bersama ini kami dari CV. Marina Sukses Abadi mengajukan penawaran harga atas produk di bawah ini.  <br/> Seluruh harga yang tertera sudah termasuk PPN</td>"
                    body += "</tr>"

                    body += "</tbody>"
                    body += "</table>"

                    body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                    body += "<tbody>";

                    body += "<tr>"
                    body += "<td style='width:30%'></td>"
                    body += "<td style='width:13%'></td>"
                    body += "<td style='width:7%'></td>"
                    body += "<td style='width:10%'></td>"
                    body += "<td style='width:15%'></td>"
                    body += "<td style='width:25%'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-weight:bold; align:center; border:1px solid black;'>Nama Product</td>"
                    body += "<td style='font-weight:bold; align:center; border:1px solid black; border-left:none;'>Barcode</td>"
                    body += "<td style='font-weight:bold; align:center; border:1px solid black; border-left:none;'>Qty</td>"
                    body += "<td style='font-weight:bold; align:center; border:1px solid black; border-left:none;'>Units</td>"
                    body += "<td style='font-weight:bold; align:center; border:1px solid black; border-left:none;'>Harga Satuan</td>"
                    body += "<td style='font-weight:bold; align:center; border:1px solid black; border-left:none;'>Total</td>"
                    body += "</tr>"

                    if(allItem.length > 0){
                        var totalAmt = 0
                        allItem.forEach((data)=>{
                            var itemName = data.itemName
                            var upcCode = data.upcCode
                            var qty = data.qty
                            var unit = data.unit
                            var rate = data.rate
                            var grossAmt = data.grossAmt
                            totalAmt = Number(totalAmt) + Number(grossAmt)
                            body += "<tr>"
                            body += "<td style=' border:1px solid black; border-top:none;'>"+escapeXmlSymbols(itemName)+"</td>"
                            body += "<td style=' border:1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(upcCode)+"</td>"
                            body += "<td style=' align:center; border:1px solid black; border-left:none;'>"
                            +escapeXmlSymbols(qty)+"</td>"
                            body += "<td style=' align:center; border:1px solid black; border-left:none;'>"+escapeXmlSymbols(unit)+"</td>"
                            body += "<td style=' align:center; border:1px solid black; border-left:none;'>"+formatNumber(rate)+"</td>"
                            body += "<td style=' align:center; border:1px solid black; border-left:none;'>"+formatNumber(grossAmt)+"</td>"
                            body += "</tr>"
                        })
                        body += "<tr>"
                        body += "<td style='font-weight:bold; border:1px solid black; border-top:none; align:right;' colspan='5'>Total</td>"
                        body += "<td style='align:center; border:1px solid black; border-left:none;'>"+formatNumber(totalAmt)+"</td>"
                        body += "</tr>"
                    }

                    body += "<tr style='height:7px;'>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td colspan='6'>*Seluruh harga di atas adalah harga nett (sudah termasuk PPN).*</td>"
                    body += "</tr>"

                    body += "<tr style='height:7px;'>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='color:#4144FAFF; font-weight:bold;' colspan='6'>Syarat & Ketentuan Penawaran</td>"
                    body += "</tr>"
                    body += "<tr style='height:7px;'>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='' colspan='6'>1. Masa berlaku penawaran: "+terms+" hari kalender sejak tanggal diterbitkan.</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='' colspan='6'>2. Pembayaran: Tempo pembayaran maksimal 30 hari (1 bulan) setelah penerimaan barang/invoice.</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='' colspan='6'>3. Barang yang sudah dibeli tidak dapat dikembalikan kecuali terdapat cacat produksi/pengiriman.</td>"
                    body += "</tr>"

                    body += "<tr style='height:7px;'>"
                    body += "</tr>"

                     body += "<tr>"
                    body += "<td style='' colspan='6'>Demikian penawaran harga ini kami sampaikan. Besar harapan kami dapat menjalin kerja sama <br/> yang baik dengan perusahaan Bapak/Ibu. Atas perhatian dan kepercayaannya, kami ucapkan terima kasih.</td>"
                    body += "</tr>"

                    
                    body += "<tr style='height:10px;'>"
                    body += "</tr>"

                    
                    body += "</tbody>"
                    body += "</table>"

                     // footer
                    footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:12px'>";
                    footer += "<tbody>";
                    footer += "<tr>"
                    footer += "</tr>"
                    footer += "<tr>"
                    footer += "<td style=''>Hormat Kami,</td>"
                    footer += "</tr>"
                    footer += "<tr>"
                    footer += "<td style=''>"+legalName+"</td>"
                    footer += "</tr>"

                    footer += "<tr style='height:40px;'>"
                    footer += "</tr>"
                    footer += "<tr>"
                    footer += "<td style=''>"+empName+"</td>"
                    footer += "</tr>"
                    footer += "</tbody>";
                    footer += "</table>";
                    var xml = '<?xml version="1.0"?>\n' +
                        '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';

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

                        xml += "<body font-size='10' style='font-family: Tahoma,sans-serif; height: 29.7cm; width: 21cm;' " +
                            "header='nlheader' header-height='" + headerHeight + "' " +
                            "footer='nlfooter' footer-height='10%' " + 
                            "margin-left='0.7cm' margin-right='0.7cm'>";

                        xml += body;

                        xml += "\n</body>\n</pdf>";

                        xml = xml.replace(/ & /g, ' &amp; ');

                        response.renderPdf({
                            xmlString: xml
                        });

                }
            }catch(e){
                log.debug('error', e);
            }
        }
        return {
            onRequest : onRequest
        }
    });