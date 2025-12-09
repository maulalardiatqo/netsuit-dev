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
                    var recLoad = record.load({
                        type : "itemreceipt",
                        id : recid
                    });
                    var grn = recLoad.getText("custbody_stc_grn_or_scn");
                    var grnNumber = recLoad.getValue("tranid");
                    var irDate = recLoad.getValue("trandate");
                    let dateObj = new Date(irDate);
                    let day = dateObj.getDate().toString().padStart(2, '0');
                    let month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // bulan mulai dari 0
                    let year = dateObj.getFullYear();
                    let formattedDate = `${day}/${month}/${year}`;
                    var vendorId = recLoad.getValue("entity");

                    var vendName = ""
                    if (vendorId) {
                        let recVend = record.load({
                            type: record.Type.VENDOR,
                            id: vendorId
                        });

                        vendName = recVend.getValue("companyname");
                    }
                    var location = recLoad.getText("location");
                    var memo = recLoad.getValue("memo")
                    var poNo = recLoad.getValue("createdfrom");
                    var poTranId = ""
                    if(poNo){
                        var lookup = search.lookupFields({
                            type: search.Type.PURCHASE_ORDER,
                            id: poNo,
                            columns: ['tranid']
                        });

                        poTranId = lookup.tranid;
                    }
                    var createdById = recLoad.getValue('custbody_stc_create_by')
                    var createdBy = recLoad.getText('custbody_stc_create_by')
                    var allGood = recLoad.getText('custbody_stc_proceed_payment');
                    var jobTitle = ""
                    if(createdById){
                        var lookup = search.lookupFields({
                            type: "employee",
                            id: createdById,
                            columns: ['title']
                        });

                        jobTitle = lookup.title;
                    }
                    var response = context.response;
                    var xml = "";
                    var header = "";
                    var body = "";
                    var headerHeight = '9%';
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
                    header += "<thead>";
                    header += "<tr>"
                    header += "<td style='width:30%'></td>"
                    header += "<td style='width:70%'></td>"
                    header += "</tr>"
                    header += "<tr style='background-color:red;'>"
                    header += "<td style='align:left; color: white; font-weight:bold; font-size:15px;'>SAVE THE CHILDREN</td>"
                    header += "<td style='align:right; color: white; font-weight:bold; font-size:15px;'>GOODS RECEIVED / SERVICE COMPLETE NOTE</td>"
                    header += "</tr>"
                    header += "</thead>";
                    header += "</table>";

                    header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                    header += "<thead>";
                    header += "<tr>"
                    header += "<td style='width:13%'></td>"
                    header += "<td style='width:5%'></td>"
                    header += "<td style='width:30%'></td>"
                    header += "<td style='width:7%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "<td style='width:20%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; align:center; vertical-align:middle;' rowspan='2'>GRN / SCN </td>"
                    header += "<td style='font-weight:bold; border:1px solid black; border-left:none; align:center; vertical-align:middle;' rowspan='2'>"+escapeXmlSymbols(grn)+"</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>GRN / SCN Number </td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;' colspan='2'>Date goods received / services completed </td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>Supplier / Donor Name</td>"
                    header += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>Receiving office / location</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(grnNumber)+"</td>"
                    header += "<td style='font-weight:bold; border:1px solid black; border-left:none; border-top:none;' colspan='2'>"+escapeXmlSymbols(formattedDate)+"</td>"
                    header += "<td style='font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(vendName)+"</td>"
                    header += "<td style='font-weight:bold; border:1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(location)+"</td>"
                    header += "</tr>"

                    header += "</thead>";
                    header += "</table>";

                    body += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                    body += "<tbody>";
                    body += "<tr>"
                    body += "<td style='width:13%'></td>"
                    body += "<td style='width:5%'></td>"
                    body += "<td style='width:30%'></td>"
                    body += "<td style='width:7%'></td>"
                    body += "<td style='width:10%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:15%'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; align:center;'>PO no.</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'></td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>Description of Goods / Services</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>Unit of Measure</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>Quantity Received</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>Goods / Services Delivered as per Requirement</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-left:none; align:center;'>Comments</td>"
                    body += "</tr>"

                    var dataLineItem = recLoad.getLineCount({
                        sublistId : "item"
                    });
                    if(dataLineItem > 0){
                        var allItem = [];
                        for(var i = 0; i < dataLineItem; i++){
                            var descItem = recLoad.getSublistText({
                                sublistId : "item",
                                fieldId: "description",
                                line : i
                            });
                            var units = recLoad.getSublistValue({
                                sublistId : "item",
                                fieldId: "unitsdisplay",
                                line : i
                            });
                            log.debug('units', units)
                            var qty = recLoad.getSublistText({
                                sublistId : "item",
                                fieldId: "quantity",
                                line : i
                            });
                            var goodServices = recLoad.getSublistText({
                                sublistId : "item",
                                fieldId: "custcol_stc_goodsservices_delivered",
                                line : i
                            });
                            var comments = recLoad.getSublistText({
                                sublistId : "item",
                                fieldId: "custcol_stc_comments",
                                line : i
                            });

                            body += "<tr>"
                            body += "<td style='border:1px solid black; align:center;'>"+poTranId+"</td>"
                            body += "<td style='border:1px solid black; border-left:none; align:center;'></td>"
                            body += "<td style='border:1px solid black; border-left:none; align:center;'>"+escapeXmlSymbols(descItem)+"</td>"
                            body += "<td style='border:1px solid black; border-left:none; align:center;'>"+units+"</td>"
                            body += "<td style='border:1px solid black; border-left:none; align:center;'>"+qty+"</td>"
                            body += "<td style='border:1px solid black; border-left:none; align:center;'>"+escapeXmlSymbols(goodServices)+"</td>"
                            body += "<td style='border:1px solid black; border-left:none; align:center;'>"+escapeXmlSymbols(comments)+"</td>"
                            body += "</tr>"
                        }
                    }
                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none; font-weight:bold;' colspan='7'>Remarks</td>"
                    body += "</tr>"
                    body += "<tr style='height:25px;'>"
                    body += "<td style='font-weight:bold; border:1px solid black; border-top:none; font-weight:bold;' colspan='7'>"+memo+"</td>"
                    body += "</tr>"
                    body += "<tr style='height:5px;'>"
                    body += "</tr>"
                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; font-weight:bold; align:center' colspan='6'>All goods received / services completed to acceptable standard so can proceed with payment?</td>"
                    body += "<td style='font-weight:bold; border:1px solid black;border-left:none;'>"+allGood+"</td>"
                    body += "</tr>"
                    body += "</tbody>";
                    body += "</table>";

                    body += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                    body += "<tbody>";
                    body += "<tr>"
                    body += "<td style='width:15%'></td>"
                    body += "<td style='width:35%'></td>"
                    body += "<td style='width:15%'></td>"
                    body += "<td style='width:35%'></td>"
                    body += "</tr>"

                    body += "<tr style='background-color:red; height:30px;'>"
                    body += "<td style='align:center; color: white; font-weight:bold; border: 1px solid black; vertical-align:midle;' colspan='2'>Supply Chain</td>"
                    body += "<td style='align:center; color: white; font-weight:bold; border: 1px solid black; border-left:none; vertical-align:midle;' colspan='2'>Program / Requester</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none; align:center'>Responsibility</td>"
                    body += "<td style='background-color:#D5D6D6FF; border:1px solid black; border-left:none; border-top:none; align:center;'>Confirm receipt  of goods / services</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; black; border-left:none;  border-top:none;align:center'>Responsibility</td>"
                    body += "<td style='background-color:#D5D6D6FF; border:1px solid black; black; border-left:none; border-top:none; align:center'>Verification of Quality</td>"
                    body += "</tr>"

                     body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none; align:center'>Name</td>"
                    body += "<td style='border:1px solid black; border-left:none; border-top:none; align:center;'>"+createdBy+"</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; black; border-left:none;  border-top:none;align:center'>Name</td>"
                    body += "<td style=' border:1px solid black; black; border-left:none; border-top:none; align:center'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none; align:center'>Position</td>"
                    body += "<td style='border:1px solid black; border-left:none; border-top:none; align:center;'>"+jobTitle+"</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; black; border-left:none;  border-top:none;align:center'>Position</td>"
                    body += "<td style=' border:1px solid black; black; border-left:none; border-top:none; align:center'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none; align:center'>Signature</td>"
                    body += "<td style='border:1px solid black; border-left:none; border-top:none; align:center;'></td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; black; border-left:none;  border-top:none;align:center'>Signature</td>"
                    body += "<td style=' border:1px solid black; black; border-left:none; border-top:none; align:center'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; border-top:none; align:center'>Date</td>"
                    body += "<td style='border:1px solid black; border-left:none; border-top:none; align:center;'>"+formattedDate+"</td>"
                    body += "<td style='background-color:#D5D6D6FF; font-weight:bold; border:1px solid black; black; border-left:none;  border-top:none;align:center'>Date</td>"
                    body += "<td style=' border:1px solid black; black; border-left:none; border-top:none; align:center'></td>"
                    body += "</tr>"

                    body += "</tbody>";
                    body += "</table>";

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