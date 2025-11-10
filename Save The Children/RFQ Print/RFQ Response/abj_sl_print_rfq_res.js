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
                log.debug('recid', recid)
                if(recid){
                    var recLoad = record.load({
                        type : "vendorrequestforquote",
                        id : recid
                    });
                    var trandId = recLoad.getValue('tranid');
                    log.debug('trandId', trandId)
                     // data Header
                    var rfqId = recLoad.getValue('parent');
                    log.debug('rfqId', rfqId)
                    var idPR
                    if(rfqId){
                        var rfqRec = record.load({
                            type : "requestforquote",
                            id : rfqId
                        });
                        idPR = rfqRec.getValue('custbody_stc_link_to_pr')
                    }
                    var cekLineItm = recLoad.getLineCount({
                        sublistId : 'item'
                    });
                    var allItmIdRec = [];
                    if (cekLineItm > 0) {
                        for (var j = 0; j < cekLineItm; j++) {
                            var itmId = recLoad.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: j
                            });
                            var leadTime = recLoad.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_stc_lead_time',
                                line: j
                            });
                            var rate = recLoad.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'rate',
                                line : j
                            })
                            allItmIdRec.push({
                                itmId: itmId,
                                leadTime: leadTime,
                                rate : rate
                            });
                        }
                    }

                    var prNo = '';
                    var allDataItemFix = [];

                    if (idPR) {
                        var recPr = record.load({
                            type: 'purchaserequisition',
                            id: idPR
                        });

                        prNo = recPr.getValue('tranid');
                        var currency = recPr.getValue('currencysymbol');

                        var linePr = recPr.getLineCount({
                            sublistId: 'item'
                        });

                        if (linePr > 0) {
                            for (var i = 0; i < linePr; i++) {
                                var itemId = recPr.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: i
                                });

                                // cari apakah itemId PR ada di array allItmIdRec
                                var match = allItmIdRec.find(function (itm) {
                                    return itm.itmId === itemId;
                                });

                                if (match) {
                                    var itemName = recPr.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item_display',
                                        line: i
                                    });
                                    var unit = recPr.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'units_display',
                                        line: i
                                    });
                                    var qty = recPr.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        line: i
                                    });
                                    var desc = recPr.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'description',
                                        line: i
                                    });
                                    var amt = Number(qty) * Number(rate);

                                    allDataItemFix.push({
                                        itemId: itemId,
                                        itemName: itemName,
                                        unit: unit,
                                        qty: qty,
                                        desc: desc,
                                        leadTime: match.leadTime || '',
                                        rate: match.rate || '',
                                        amount: amt,
                                        currency: currency,
                                        prNo: prNo
                                    });
                                }
                            }
                        }
                    }

                    log.debug('allDataItemFix', allDataItemFix);


                    
                    log.debug('prNo', prNo)
                    var sendDate = recLoad.getValue('startdate');
                    var bidCloseDate = recLoad.getValue('bidclosedate');
                    var submissionLocation = recLoad.getText('custbody_stc_submission_location');
                    var docRequired = recLoad.getValue('custbody_stc_document_rquired');
                    var dateGoods = recLoad.getValue('custbody_stc_date_required');
                    var delivAddres = recLoad.getValue('custbody_stc_delivery_address');
                    var reqIncoterm = recLoad.getValue('custbody_stc_requirement_incotrm');
                    var supplierName = '';
                    var contactName = '';
                    var emailVend = '';
                    var phoneVend = '';
                    var addressVend = '';
                    var vendorId = recLoad.getValue('entity');
                    if(vendorId){
                        var vendorRec = record.load({
                            type : "vendor",
                            id : vendorId
                        });
                        var name =  vendorRec.getValue("legalname");
                        log.debug('name', name);
                        var email = vendorRec.getValue('email');
                        var phone = vendorRec.getValue('phone');
                        var defAddr = vendorRec.getValue('defaultaddress');
                        var addLine = vendorRec.getLineCount({
                            sublistId : 'addressbook'
                        });
                        var att = ''
                        if(addLine > 0){
                            for(var k = 0; k < addLine; k++){
                                var lineAtt = vendorRec.getSublistValue({
                                    sublistId : 'addressbook',
                                    fieldId : 'attention',
                                    line : k
                                })
                                att = lineAtt
                            }
                        }
                        supplierName = name
                        contactName = att
                        emailVend = email
                        phoneVend = phone
                        addressVend = defAddr
                    }

                    var comment1 = recLoad.getValue('custbody_stc_rfq_tc_apply');
                    var comment2 = recLoad.getValue('custbody_stc_adhere_sci_policies');
                    var comment3 = recLoad.getValue('custbody_stc_pricing_vallid');
                    var comment4 = recLoad.getValue('custbody_stc_rfq_not_constt_ord');

                    // page print
                    var response = context.response;
                    var xml = "";
                    var header = "";
                    var body = "";
                    var headerHeight = '30%';
                    var style = "";
                    var footer = "";
                    var pdfFile = null;
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
                    header += "<td style='width:50%; align:left; font-weight:bold; font-size:14px; color:white; background-color: red;'>SAVE THE CHILDREN</td>"
                    header += "<td style='width:50%; align:right; font-weight:bold; font-size:14px; color:white; background-color: red;'>REQUEST FOR QUOTATION</td>"
                    header += "</tr>"
                    header += "</tbody>";
                    header += "</table>";

                    header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:7px; font-weight:bold;'>";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='width:12%; background-color: #9F9F9FFF; border:1px solid black; align:center;'>PR Number</td>"
                    header += "<td style='width:13%; border:1px solid black; border-left:none;'>"+prNo+"</td>"
                    header += "<td style='width:12%; background-color: #9F9F9FFF; border:1px solid black; border-left:none; align:center;'>Date RFQ Issued</td>"
                    header += "<td style='width:13%; border:1px solid black; border-left:none;'>"+formatDateToDDMMYYYY(sendDate)+"</td>"
                    header += "<td style='width:50%'></td>"
                    header += "</tr>"
                    header += "<tr>"
                    header += "<td style='font-weight:bold;' colspan='5'>PART 1 - INFORMATION FOR SUPPLIER : SUBMISSION DETAILS</td>"
                    header += "</tr>"
                    header += "<tr>"
                    header += "<td style='font-weight:bold;' colspan='5'><i>(SCI to Complete)</i></td>"
                    header += "</tr>"
                    header += "</tbody>";
                    header += "</table>";

                    header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:7px; font-weight:bold;'>";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='width:8%'></td>"
                    header += "<td style='width:12%'></td>"
                    header += "<td style='width:8%'></td>"
                    header += "<td style='width:12%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "<td style='width:20%'></td>"
                    header += "<td style='width:20%'></td>"
                    header += "<td style='width:10%'></td>"
                    header += "</tr>"
                    header += "<tr>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-right:none; align:center;' colspan='6'>SUBMISSION INFORMATION</td>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-left:none; align:center;' colspan='2'>REQUIREMENTS INFORMATION</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-top:none; align:center; vertical-align:middle;' rowspan='3'>Deadline for Submission</td>"
                    header += "<td style='border:1px solid black; border-top:none; align:center; border-left:none; vertical-align:middle;' rowspan='3'>"+formatDateToDDMMYYYY(bidCloseDate)+"</td>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-top:none; border-left:none; align:center;'>Submission Format ?</td>"
                    header += "<td style='border:1px solid black; border-top:none; align:center; border-left:none;'>By Netsuite/Email</td>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-top:none; border-left:none; align:center; vertical-align:middle;' rowspan='3'>Deadline for <br/> Submission</td>"
                    header += "<td style='border:1px solid black; border-top:none; align:center; border-left:none; vertical-align:middle;' rowspan='3'>"+escapeXmlSymbols(docRequired)+"</td>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-top:none; border-left:none; align:center;'>Date Goods / Services Required</td>"
                    header += "<td style='border:1px solid black; border-top:none; align:center; border-left:none;'>"+formatDateToDDMMYYYY(dateGoods)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-top:none; border-left:none; align:center; vertical-align:middle;' rowspan='2'>Submission Location (Email Address / Address)</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none; align:center; vertical-align:middle;' rowspan='2'>"+escapeXmlSymbols(submissionLocation)+"</td>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-top:none; border-left:none; align:center;'>Delivery Address for Goods / Services</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none; align:center;'>"+escapeXmlSymbols(delivAddres)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='background-color: #B6B3B3FF; border:1px solid black; border-top:none; border-left:none; align:center;'>Requirement Incoterms</td>"
                    header += "<td style='border:1px solid black; border-top:none; border-left:none; align:center;'>"+escapeXmlSymbols(reqIncoterm)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='font-weight:bold;' colspan='8'>PART 2 - BID SUBMISSION</td>"
                    header += "</tr>"
                    header += "<tr>"
                    header += "<td style='font-weight:bold;' colspan='8'><i>(Supplier to Complete)</i></td>"
                    header += "</tr>"

                    header += "</tbody>";
                    header += "</table>";

                    header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:7px; font-weight:bold;'>";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:5%'></td>"
                    header += "<td style='width:35%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "<td style='width:15%'></td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='font-weight:bold; color:white; background-color:red; align:center; border: 1px solid black;' colspan='2'>SUPPLIER INFORMATION</td>"
                    header += "<td></td>"
                    header += "<td style='font-weight:bold; color:white; background-color:red; align:center; border: 1px solid black;' colspan='3'>SUPPLIER DECLARATIONS</td>"
                    header += "</tr>"
                    header += "<tr>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none;'>Supplier Name	</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(supplierName)+"</td>"
                    header += "<td></td>"
                    header += "<td style='font-weight:bold; border: 1px solid black; border-top:none;'>The supplier agrees and acknowledges that…</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>Supplier Acceptance</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>Comments</td>"
                    header += "</tr>"
                    header += "<tr>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none;'>Contact Name</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(contactName)+"</td>"
                    header += "<td></td>"
                    header += "<td style='font-weight:bold; border: 1px solid black; border-top:none;'>for any future orders placed, the Terms & Conditions shared as part of this RFQ will apply. If no Terms & Conditions were shared, the attached Terms and Conditions will apply.</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>Yes</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(comment1)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none;'>E-mail</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(emailVend)+"</td>"
                    header += "<td></td>"
                    header += "<td style='font-weight:bold; border: 1px solid black; border-top:none;'>to adhere to all the below mandatory Save the Children policies.</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>Yes</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(comment2)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none;'>Phone / Mobile</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(phoneVend)+"</td>"
                    header += "<td></td>"
                    header += "<td style='font-weight:bold; border: 1px solid black; border-top:none;'>that all pricing included in the quote will be valid for a minimum of 60 days</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>Yes</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(comment3)+"</td>"
                    header += "</tr>"

                    header += "<tr>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none;'>Address</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(addressVend)+"</td>"
                    header += "<td></td>"
                    header += "<td style='font-weight:bold; border: 1px solid black; border-top:none;'>this Request for Quotation does not constitute an order.</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>Yes</td>"
                    header += "<td style='font-weight:bold; align:center; border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(comment4)+"</td>"
                    header += "</tr>"

                    header += "</tbody>";
                    header += "</table>";

                    body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:7px;\">";
                    body += "<tbody>";
                    body += "<tr>"
                    body += "<td style='width:5%;'></td>"
                    body += "<td style='width:25%;'></td>"
                    body += "<td style='width:13%;'></td>"
                    body += "<td style='width:10%;'></td>"
                    body += "<td style='width:7%;'></td>"
                    body += "<td style='width:7%;'></td>"
                    body += "<td style='width:13%;'></td>"
                    body += "<td style='width:10%;'></td>"
                    body += "<td style='width:10%;'></td>"
                    body += "</tr>"
                                                    
                    body += "<tr>"
                    body += "<td style='font-weight:bold;' colspan='9'>SAVE THE CHILDREN REQUIREMENTS</td>"
                    body += "</tr>"
                    body += "<tr>"
                    body += "<td style='font-weight:bold;' colspan='9'><i>(SCI & Supplier to Complete)</i></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='background-color:#DBD8D8FF; border:1px solid black; text-align:center; font-weight:bold'>Line <br/> item no.</td>"
                    body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; text-align:center; font-weight:bold'>Description of Goods / Services <br/> <span style='font-weight:normal'><i>(add attachment for technical specification if very detailed)</i></span></td>"
                    body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center; font-weight:bold'>Additional Information</td>"
                    body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center; font-weight:bold'>Unit</td>"
                    body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center; font-weight:bold'>Qty required</td>"
                    body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center; font-weight:bold'>Currency</td>"
                    body += "<td style='background-color:red; color:white; border:1px solid black; border-left:none; align:center; font-weight:bold'>Lead Time for Delivery</td>"
                    body += "<td style='background-color:red; color:white;border:1px solid black; border-left:none; align:center; font-weight:bold'>Unit Price</td>"
                    body += "<td style='background-color:red; color:white; border:1px solid black; border-left:none; align:center; font-weight:bold'>Total Price</td>"
                    body += "</tr>"
                    if(allDataItemFix.length > 0){
                        var noI = 1
                        var subTotal = 0;
                        var amtDelivCharge = 0;
                        var amtOtherCharge = 0;
                        allDataItemFix.forEach((data)=>{
                            var itemId = data.itemId;
                            var itemName = data.itemName;
                            var unit = data.unit;
                            var qty = data.qty;
                            var desc = data.desc;;
                            var leadTime = data.leadTime;
                            var rate = data.rate;
                            var amount = data.amount;
                            subTotal = Number(subTotal) + Number(amount)
                            var Currency = data.currency
                            if(itemId == '768'){
                                amtDelivCharge = Number(amtDelivCharge) + Number(amount);
                            }else if(itemId == '769'){
                                amtOtherCharge = Number(amtOtherCharge) + Number(amount)
                            }else{
                                body += "<tr>"
                                body += "<td style='border:1px solid black; borter-top:none;'>"+noI+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none;'>"+escapeXmlSymbols(itemName)+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none;'>"+escapeXmlSymbols(desc)+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none;'>"+escapeXmlSymbols(unit)+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none;'>"+escapeXmlSymbols(qty)+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none;'>"+escapeXmlSymbols(Currency)+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none;'>"+escapeXmlSymbols(leadTime)+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none; align:right;'>"+formatNumber(rate)+"</td>"
                                body += "<td style='border:1px solid black; borter-top:none; border-left:none; align:right;'>"+formatNumber(amount)+"</td>"
                                body += "</tr>"
                            }
                            
                        })
                        
                        var totalAmt = Number(subTotal) + Number(amtDelivCharge) + Number(amtOtherCharge)
                        body += "<tr>"
                        body += "<td colspan='6'></td>"
                        body += "<td style='background-color:red; color: white; align:center; border:1px solid black; border-top:none;' colspan='2'>Subtotal</td>"
                        body += "<td style='align:right; border:1px solid black; border-top:none; border-left:none;'>"+formatNumber(subTotal)+"</td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td colspan='6'></td>"
                        body += "<td style='background-color:red; color: white; align:center; border:1px solid black; border-top:none;' colspan='2'>Delivery Charge</td>"
                        body += "<td style='align:center; border:1px solid black; border-top:none; border-left:none; align:right;'>"+formatNumber(amtDelivCharge)+"</td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td colspan='6'></td>"
                        body += "<td style='background-color:red; color: white; align:center; border:1px solid black; border-top:none;' colspan='2'>Other charges<br/>(if applicable)</td>"
                        body += "<td style='align:center; border:1px solid black; border-top:none; border-left:none; align:right;'>"+formatNumber(amtOtherCharge)+"</td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td colspan='6'></td>"
                        body += "<td style='background-color:red; color: white; align:center; border:1px solid black; border-top:none;' colspan='2'>Total</td>"
                        body += "<td style='align:center; border:1px solid black; border-top:none; border-left:none; align:right;'>"+formatNumber(totalAmt)+"</td>"
                        body += "</tr>"
                    }
                    

                    body += "</tbody>";
                    body += "</table>";
                    // footer
                    footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:8px'>";
                    footer += "<tbody>";
                    footer += "<tr>"
                    footer += "</tr>"
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
                log.error("Error", e);
            }
            
        }
        return {
            onRequest: onRequest,
        };
    }
);