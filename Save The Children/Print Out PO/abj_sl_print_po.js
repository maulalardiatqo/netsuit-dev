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
        function onRequest(context) {
            try{
                var recid = context.request.parameters.id;
                log.debug('recId', recid)
                if(recid){
                    recordLoad = record.load({
                        type : "purchaseorder",
                        id : recid
                    });
                    var trandate = recordLoad.getValue("trandate");
                    var trandId = recordLoad.getValue("tranid");
                    var vendorId = recordLoad.getValue("entity");

                    // Suplier Rec
                    var vendName = ""
                    var contactName = ""
                    var vendEmail = ""
                    var vendPhone = ""
                    var vendFax = ""
                    var vendAltPhone = ""
                    var vendAddr = ""
                    var delAddr = ""
                    if (vendorId) {
                        let recVend = record.load({
                            type: record.Type.VENDOR,
                            id: vendorId
                        });

                        vendName = recVend.getValue("companyname");
                        vendEmail = recVend.getValue("email");
                        vendPhone = recVend.getValue("phone");
                        vendFax = recVend.getValue("fax");
                        vendAltPhone = recVend.getValue("altphone")
                        vendAddr = recVend.getValue("defaultaddress")
                        
                        // hitung jumlah address line di vendor
                        let addressCount = recVend.getLineCount({ sublistId: "addressbook" });

                        let attentionList = [];
                        for (let i = 0; i < addressCount; i++) {
                            let subrecAddress = recVend.getSublistSubrecord({
                                sublistId: "addressbook",
                                fieldId: "addressbookaddress",
                                line: i
                            });

                            contactName = subrecAddress.getValue({ fieldId: "attention" });
                            delAddr = subrecAddress.getValue({ fieldId : "addr1"})
                            log.debug('delAddr', delAddr)
                        }

                    }
                    // Delivery Rec
                    var delContactName = recordLoad.getValue("custbody_stc_location");
                    var delPhone = recordLoad.getValue("custbody_stc_phone")

                    let companyInfo = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });

                    let shippingAddr = companyInfo.getValue('shippingaddress_text');
                    log.debug('Shipping Address Text', shippingAddr);
                    log.debug('companyInfo', companyInfo)
                    let attention = '';
                    if (shippingAddr) {
                        let lines = shippingAddr.split(/\r?\n/);
                        attention = lines[0] || '';
                    }
                    let addressSubrecord = companyInfo.getSubrecord({
                        fieldId: 'shippingaddress'
                    });

                    // Ambil nilai field addrphone
                    let shippingPhone = addressSubrecord.getValue({
                        fieldId: 'addrphone'
                    });
                    log.debug('shippingPhone', shippingPhone)
                    log.debug('Attention', attention);
                
                    var delivMethod = recordLoad.getText("incoterm");
                    var shippingRequirement = recordLoad.getValue("custbody_stc_shipping_requirement");
                    var terms = recordLoad.getText("terms")
                    var projectCode = recordLoad.getText("class")
                    var sofCode = recordLoad.getText("cseg_stc_sof")

                    // pdf render
                    var response = context.response;
                    var xml = "";
                    var header = "";
                    var body = "";
                    var headerHeight = '37%';
                    var style = "";
                    var footer = "";
                    var pdfFile = null;
                    
                    // css
                    style += "<style type='text/css'>";
                    style += "*{padding : 0; margin:0;}";
                    style += "body{padding-left : 5px; padding-right : 5px;}";
                    style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                    style += ".tg .tg-headerlogo {align:right; border:none;}";
                    style += ".tg .tg-img-logo {width:195px; height:90px; object-fit:cover;}";
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
                    header += "<td style='width:50%'></td>"
                    header += "<td style='width:50%'></td>"
                    header += "</tr>"
                    header += "<tr style='background-color:red;'>"
                    header += "<td style='align:left; color: white; font-weight:bold; font-size:20px;'>SAVE THE CHILDREN</td>"
                    header += "<td style='align:right; color: white; font-weight:bold; font-size:20px;'>PURCHASE ORDER</td>"
                    header += "</tr>"
                    
                    header += "<tr>"
                    header += "<td style='align:center; font-size:7; font-weight:bold;' colspan='2'><p style='text-align:center;'>This Purchase Order is issued subject to the terms and conditions and the policies contained in the contract or framework agreement governing the Goods and/or Services (as applicable), between the Customer and the Supplier. In the absence of such contract or framework agreement, this Purchase Order is issued subject to the terms and conditions overleaf and the policies contained at </p><p style='color:#1385B9FF; padding-top:0px; margin-top:0px;'>https://www.savethechildren.net/sites/www.savethechildren.net/files/Supplier Sustainability Policy.pdf</p></td>"
                    header += "</tr>"
                    
                    header += "</tbody>";
                    header += "</table>";

                    header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='width:32%'></td>"
                    header += "<td style='width:23%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:25%'></td>"
                    header += "</tr>"
                    log.debug('trandate', trandate)
                    let dateObj = new Date(trandate);

                    // Ambil tanggal, bulan, tahun
                    let day = dateObj.getDate().toString().padStart(2, '0');
                    let month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // bulan mulai dari 0
                    let year = dateObj.getFullYear();

                    // Format dd/mm/yyyy
                    let formattedDate = `${day}/${month}/${year}`;
                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black;'>Date:</td>"
                    header += "<td style='border:1px solid black; border-left:none; border-right:none;'>"+formattedDate+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; align:center; vertical-align:middle;' rowspan='2'>PO No:</td>"
                    header += "<td style='border:1px solid black; border-left:none; align:center; vertical-align:middle;' rowspan='2'>"+escapeXmlSymbols(trandId)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; border:1px solid black; border-top:none;'><p style='font-weight:bold;'>Reference to framework agreement/contract:</p><p style='font-size:7px; margin:0px;; padding:0px;'>(if relevant)</p></td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none; border-right:none;'></td>"
                    header += "</tr>"

                    header += "<tr style='height:10px;'>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black;' colspan='2'>SUPPLIER</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none;' colspan='2'>DELIVERY / COLLECTION ADDRESS</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none;'>Company name: </td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(vendName)+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>Contact Name:</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(delContactName)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none;'>Contact Name: </td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(contactName)+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>Mobile Phone:</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(delPhone)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none;'>E-mail: </td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(vendEmail)+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; border-top:none; vertical-align:middle;' rowspan='2'>Addres</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none; vertical-align:middle;' rowspan='2'>"+escapeXmlSymbols(delAddr)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none;'>Phone: </td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(vendPhone)+"</td>"
                    header += "</tr>"

                     header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none;'>Fax: </td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(vendFax)+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; border-top:none;' colspan='2'>SAVE THE CHILDREN INVOICING ADDRESS</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none;'>Mobile: </td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(vendAltPhone)+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>Contact Name:</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(attention)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none;' rowspan='2'>Addres: </td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;' rowspan='2'>"+escapeXmlSymbols(vendAddr)+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>Phone:</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(shippingPhone)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>Addres:</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(shippingAddr)+"</td>"
                    header += "</tr>"

                    header += "<tr style='height:6px;'>"
                    header += "</tr>"

                    header += "</tbody>";
                    header += "</table>";

                    header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "</tr>"

                    header += "<tr>";
                    header += "<td style='background-color:#D5D6D6FF;  border:1px solid black;'><p style='font-weight:bold; border-left:none;'>Delivery method / Incoterms:</p><p style='font-size:7px; padding:0px; margin:0px;'>(if applicable)</p></td>";
                    header += "<td style='border:1px solid black; border-left:none;'>"+escapeXmlSymbols(delivMethod)+"</td>";
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none;'><p>Shipping</p> <p style='padding:0px; margin:0px;'>requirements:</p></td>";
                    header += "<td style='border:1px solid black; border-left:none;'>"+escapeXmlSymbols(shippingRequirement)+"</td>";
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none;'><p>Required</p> <p style='padding:0px; margin:0px;'>delivery date:</p></td>";
                    header += "<td style='border:1px solid black; border-left:none;'></td>";
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none;'><p>Payment terms:</p></td>";
                    header += "<td style='border:1px solid black; border-left:none;'>"+escapeXmlSymbols(terms)+"</td>";
                    header += "</tr>";

                    header += "</tbody>";
                    header += "</table>";

                    // Body
                    body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body += "<tbody>";

                    body += "<tr>"
                    body += "<td style='width:6%;'></td>"
                    body += "<td style='width:6%;'></td>"
                    body += "<td style='width:6%;'></td>"
                    body += "<td style='width:8%;'></td>"
                    body += "<td style='width:10%;'></td>"
                    body += "<td style='width:22%;'></td>"
                    body += "<td style='width:8%;'></td>"
                    body += "<td style='width:7%;'></td>"
                    body += "<td style='width:7%;'></td>"
                    body += "<td style='width:10%;'></td>"
                    body += "<td style='width:10%;'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black;'>Project code</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>SOF code</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>PR no.</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Line Item No.</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Product Code</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Description of Goods/Services</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Unit/Form</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Quantity required</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Currency</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Unit Price</td>"
                    body += "<td style='background-color:#D5D6D6FF;  border:1px solid black; border-left:none;'>Total Price</td>"
                    body += "</tr>"

                    // line
                    var dataLineCount = recordLoad.getLineCount({
                        sublistId: "item",
                    });
                    if(dataLineCount > 0){
                        for (var i = 0; i < dataLineCount; i++) {
                        
                        }
                    }
                    

                    body += "</tbody>"
                    body += "</table>"

                    footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:8px'>";
                    footer += "<tbody>";
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
                    xml += "</macrolist>";
                    xml += "</head>";

                    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' margin-left='0.5cm' margin-right='0.5cm'>";
                    xml += body;
                    xml += footer;

                    xml += "\n</body>\n</pdf>";


                    xml = xml.replace(/ & /g, ' &amp; ');
                    response.renderPdf({
                        xmlString: xml
                    });
                }
            }catch(e){
                log.debug('error', e)
            }
        }
        return {
            onRequest: onRequest,
        };
    }
);