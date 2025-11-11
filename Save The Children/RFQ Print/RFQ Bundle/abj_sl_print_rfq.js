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
                        type : "requestforquote",
                        id : recid
                    });
                    var trandId = recLoad.getValue('tranid');
                    log.debug('trandId', trandId)
                }
                // data Header
                var cekStatus = recLoad.getValue('status');
                log.debug('status', cekStatus)
                var fieldPR = recLoad.getValue('custbody_stc_link_to_pr');
                var prNo = ""
                var itemPR = []
                if(fieldPR){
                    var recPr = record.load({
                        type: "purchaserequisition",
                        id: fieldPR,
                    });
                    prNo = recPr.getValue('tranid')
                    var linePrcount = recPr.getLineCount({
                        sublistId : 'item'
                    });
                    if(linePrcount > 0){
                        for(var i = 0; i < linePrcount; i++){
                            var idItemPr = recPr.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'item',
                                line : i
                            })
                            var qtyPr = recPr.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'quantity',
                                line : i
                            })
                            itemPR.push({
                                idItemPr : idItemPr,
                                qtyPr : qtyPr
                            })
                        }
                    }
                }
                
                log.debug('prNo', prNo)
                var preparedDate = recLoad.getValue('trandate');
                var lineVendor = recLoad.getLineCount({
                    sublistId : 'vendor'
                });
                log.debug('lineVendor', lineVendor);
                var allDataVendor = []
                var allVendorName = [];
                if(lineVendor > 0){
                    var maxLoop = Math.min(lineVendor, 3);
                    for(var i = 0; i < maxLoop; i ++){
                        var vendId = recLoad.getSublistValue({
                            sublistId : 'vendor',
                            fieldId : 'vendor',
                            line : i
                        })
                        var recVend = record.load({
                            type : 'vendor',
                            id : vendId
                        });
                        var vendName = recVend.getValue('altname')
                        allVendorName.push(vendName)
                        var vendAddr = recVend.getValue('defaultaddress')
                        var responsId = recLoad.getSublistValue({
                            sublistId : 'vendor',
                            fieldId : 'responsedoc',
                            line : i
                        });
                        // record load response
                        var recResponse = record.load({
                            type: "vendorrequestforquote",
                            id: responsId,
                        })
                        var resCurrency = recResponse.getText('currency')
                        var resNumber = recResponse.getValue('tranid')
                        var resQTyGood = recResponse.getValue('custbody_stc_quality_of_goods')
                        var otherCriteria = recResponse.getValue('custbody_stc_other_criteria')
                        var bidderPassed = recResponse.getValue('custbody_stc_bidder_pass_criteria')
                        var bidderScore = recResponse.getValue('custbody_stc_bidder_score')
                        var responseLine = recResponse.getLineCount({
                            sublistId : 'item'
                        });
                        var itemResponse = []
                        if(responseLine > 0){
                            for(var k = 0; k < responseLine; k++){
                                var idItemResponse = recResponse.getSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'item',
                                    line : k
                                })
                                var rate = recResponse.getSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'rate',
                                    line : k
                                })
                                var leadTime = recResponse.getSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'custcol_stc_lead_time',
                                    line : k
                                })
                                itemResponse.push({
                                    idItemResponse : idItemResponse,
                                    rate : rate,
                                    leadTime : leadTime
                                })
                            }
                        }
                        allDataVendor.push({
                            vendName : vendName,
                            vendAddr : vendAddr,
                            resNumber : resNumber,
                            resCurrency : resCurrency,
                            resQTyGood : resQTyGood,
                            otherCriteria : otherCriteria,
                            bidderPassed : bidderPassed,
                            bidderScore : bidderScore,
                            itemResponse : itemResponse
                        })
                        
                    }
                    
                }
                
                // load item req rfq
                var allLineItem = []
                var cekLineItem = recLoad.getLineCount({
                    sublistId : 'item'
                });
                if(cekLineItem > 0){
                    for(var i = 0; i < cekLineItem; i ++){
                        var itemId = recLoad.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : i
                        })
                        var itemText = recLoad.getSublistText({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : i
                        })
                        var unitText = recLoad.getSublistText({
                            sublistId : 'item',
                            fieldId : 'units',
                            line : i
                        })
                        allLineItem.push({
                            itemId : itemId,
                            itemText : itemText,
                            unitText : unitText
                        })
                    }
                    
                }
                log.debug('allDataVendor', allDataVendor)
                log.debug('itemPR', itemPR)
                log.debug('allLineItem', allLineItem)
                 // page print
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '3%';
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
                header += "</tr>"
                header += "</tbody>";
                header += "</table>";

                body += "<table class='tg' width='100%' style='table-layout:fixed; font-size:8px;'>";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:19%;'></td>"
                body += "<td style='width:6%;'></td>"
                body += "<td style='width:10%;'></td>"
                body += "<td style='width:8%;'></td>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:8%;'></td>"
                body += "<td style='width:8%;'></td>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:8%;'></td>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:8%;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; background-color:#DBD8D8FF;' colspan='2'>PR Reference No.</td>"
                body += "<td colspan='8'></td>"
                body += "<td style='border:1px solid black; background-color:#DBD8D8FF;' colspan='2'>Date prepared</td>"
                body += "<td style='border:1px solid black; border-left:none;' >"+formatDateToDDMMYYYY(preparedDate)+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black;' colspan='2' rowspan='3'>"+prNo+"</td>"
                body += "<td colspan='11'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td colspan='2'></td>"
                body += "<td style='border:1px solid black; background-color:#DBD8D8FF;' colspan='3'>Bidder 1</td>"
                body += "<td style='border:1px solid black; border-left:none; background-color:#DBD8D8FF;' colspan='3'>Bidder 2</td>"
                body += "<td style='border:1px solid black; border-left:none; background-color:#DBD8D8FF;' colspan='3'>Bidder 3</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td></td>"
                body += "<td style='border:1px solid black; background-color:#DBD8D8FF;'>Name</td>";
                for (var i = 0; i < 3; i++) {
                    var name = allDataVendor[i] ? allDataVendor[i].vendName : '';
                    body += "<td colspan='3' style='border:1px solid black; border-left:none;'>" + (escapeXmlSymbols(name) || '') + "</td>";
                }
                body += "</tr>"

                body += "<tr>";
                body += "<td colspan='3'></td>"
                body += "<td style='border:1px solid black; background-color:#DBD8D8FF;'>Location</td>";
                for (var i = 0; i < 3; i++) {
                    var addr = allDataVendor[i] ? allDataVendor[i].vendAddr : '';
                    addr = addr ? addr.replace(/\n/g, '<br/>') : '';
                    body += "<td colspan='3' style='border:1px solid black; border-left:none; vertical-align:top;'>" + escapeXmlSymbols(addr) + "</td>";
                }
                body += "</tr>";

                body += "<tr>";
                body += "<td colspan='3'></td>"
                body += "<td style='border:1px solid black; background-color:#DBD8D8FF;'>Bidder Currency</td>";
                for (var i = 0; i < 3; i++) {
                    var curr = allDataVendor[i] ? allDataVendor[i].resCurrency : '';
                    body += "<td colspan='3' style='border:1px solid black; border-left:none;'>" + escapeXmlSymbols(curr) + "</td>";
                }
                body += "</tr>";
                body += "<tr>";
                body += "<td colspan='3'></td>"
                body += "<td style='border:1px solid black; background-color:#DBD8D8FF;'>Quote No</td>";
                for (var i = 0; i < 3; i++) {
                    var resNum = allDataVendor[i] ? allDataVendor[i].resNumber : '';
                    body += "<td colspan='3' style='border:1px solid black; border-left:none;'>" + escapeXmlSymbols(resNum) + "</td>";
                }
                body += "</tr>";

                // header line
                body += "<tr>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; align:center;'>Line Item</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Description of Goods/Services</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Unit</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Quantity</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Unit Cost</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Total Cost</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Availability date / lead time</td>"
                 body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Unit Cost</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Total Cost</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Availability date / lead time</td>"
                 body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Unit Cost</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Total Cost</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center;'>Availability date / lead time</td>"
                body += "</tr>"
                var vendorTotalsGoods = [0, 0, 0];
                var vendorTotalsTransport = [0, 0, 0];
                var vendorTotalsOther = [0, 0, 0];

                for (var i = 0; i < allLineItem.length; i++) {
                    var item = allLineItem[i];
                    var itemId = item.itemId;
                    var itemDesc = item.itemText || '';
                    var unitText = item.unitText || '';

                    // skip item 768 dan 769 dari loop utama
                    if (itemId == 768 || itemId == 769) continue;

                    var qtyObj = itemPR.find(function (pr) {
                        return pr.idItemPr == itemId;
                    });
                    var qty = qtyObj ? qtyObj.qtyPr : 0;

                    body += "<tr>";
                    body += "<td style='border:1px solid black; align:center; border-top:none;'>" + (i + 1) + "</td>";
                    body += "<td style='border:1px solid black; border-top:none; border-left:none;'>" + escapeXmlSymbols(itemDesc) + "</td>";
                    body += "<td style='border:1px solid black; align:center; border-top:none; border-left:none;'>" + unitText + "</td>";
                    body += "<td style='border:1px solid black; align:center; border-top:none; border-left:none;'>" + qty + "</td>";

                    for (var v = 0; v < 3; v++) {
                        var vendor = allDataVendor[v];

                        if (vendor) {
                            var itemResp = vendor.itemResponse.find(function (resp) {
                                return resp.idItemResponse == itemId;
                            });

                            if (itemResp) {
                                var unitCost = itemResp.rate || 0;
                                var totalCost = unitCost * qty;
                                var leadTime = itemResp.leadTime || '-';
                                vendorTotalsGoods[v] += totalCost;

                                body += "<td style='border:1px solid black; align:right; border-top:none; border-left:none;'>" + unitCost.toLocaleString() + "</td>";
                                body += "<td style='border:1px solid black; align:right; border-top:none; border-left:none;'>" + totalCost.toLocaleString() + "</td>";
                                body += "<td style='border:1px solid black; align:center; border-top:none; border-left:none;'>" + escapeXmlSymbols(leadTime) + "</td>";
                            } else {
                                body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                                body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                                body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                            }
                        } else {
                            body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                            body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                            body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                        }
                    }

                    body += "</tr>";
                }

                // =====================
                // Hitung Transport dan Other Cost
                // =====================
                [768, 769].forEach(function (specialId) {
                    for (var v = 0; v < 3; v++) {
                        var vendor = allDataVendor[v];
                        if (vendor) {
                            var itemResp = vendor.itemResponse.find(function (resp) {
                                return resp.idItemResponse == specialId;
                            });
                            if (itemResp) {
                                var qtyObj = itemPR.find(function (pr) {
                                    return pr.idItemPr == specialId;
                                });
                                var qty = qtyObj ? qtyObj.qtyPr : 0;
                                var unitCost = itemResp.rate || 0;
                                var totalCost = unitCost * qty;

                                if (specialId == 768) vendorTotalsTransport[v] += totalCost;
                                if (specialId == 769) vendorTotalsOther[v] += totalCost;
                            }
                        }
                    }
                });

                // =====================
                // Fungsi Tambah Summary Row
                // =====================
                function addSummaryRow(label, totalsArr, isBold = true) {
                    body += "<tr>";
                    body += "<td colspan='4' style='font-weight:" + (isBold ? "bold" : "normal") + "; align:right; border-top:none;'>" + escapeXmlSymbols(label) + "</td>";

                    for (var v = 0; v < 3; v++) {
                        var vendor = allDataVendor[v];
                        var totalVal = totalsArr[v] || 0;
                        if (vendor) {
                            body += "<td style='border:1px solid black; border-top:none;'></td>"; 
                            body += "<td style='border:1px solid black; font-weight:" + (isBold ? "bold" : "normal") + "; align:right; border-top:none; border-left:none;'>" + totalVal.toLocaleString() + "</td>"; 
                            body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"; 
                        } else {
                            body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                            body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                            body += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>";
                        }
                    }

                    body += "</tr>";
                }

                // =====================
                // Summary Section
                // =====================
                addSummaryRow("Total Cost Of Goods", vendorTotalsGoods);
                addSummaryRow("Transport Cost", vendorTotalsTransport);
                addSummaryRow("Any Other Cost", vendorTotalsOther);

                // =====================
                // Total Keseluruhan
                // =====================
                var vendorTotalsOverall = [0, 0, 0];
                for (var v = 0; v < 3; v++) {
                    vendorTotalsOverall[v] = (vendorTotalsGoods[v] || 0) + (vendorTotalsTransport[v] || 0) + (vendorTotalsOther[v] || 0);
                }
                addSummaryRow("Total Cost in Bidder Currency", vendorTotalsOverall);
                // =====================
                // Tambahan Info per Vendor di bawah summary
                // =====================

                function addVendorExtraRow(label, key, isBoolean = false) {
                    body += "<tr>";
                    if(key != 'bgbronze'){
                        body += "<td colspan='4' style='border-top:none; font-weight:bold; align:right;'>" + escapeXmlSymbols(label) + "</td>";
                    }else{
                        body += "<td colspan='4' style='border-top:none; font-weight:bold; align:right; background-color:#DBD8D8FF;'>" + label + "</td>";
                    }
                    

                    for (var v = 0; v < 3; v++) {
                        var vendor = allDataVendor[v];
                        if (vendor) {
                            if(key != 'bgbronze'){
                                var value = vendor[key];
                                if (isBoolean) {
                                    value = value ? 'Yes' : 'No';
                                }
                                value = (value !== undefined && value !== null) ? value : '';

                                body += "<td colspan='3' style='border:1px solid black; border-top:none; align:center;'>" + escapeXmlSymbols(value) + "</td>";
                            }else{
                                body += "<td colspan='3' style='border:1px solid black; border-top:none; align:center; background-color:#DBD8D8FF;'></td>";
                            }
                            
                        } else {
                            // vendor kosong
                            if(key == 'bgbronze'){
                                body += "<td colspan='3' style='border:1px solid black; border-top:none; background-color:#DBD8D8FF;'></td>";
                            }else{
                                body += "<td colspan='3' style='border:1px solid black; border-top:none;'></td>";
                            }
                            
                        }
                    }

                    body += "</tr>";
                }

                // Panggil urutannya sesuai kebutuhan
                addVendorExtraRow("RFQ: Other criteria considered", "bgbronze")
                addVendorExtraRow("Quality of Goods / Service", "resQTyGood");
                addVendorExtraRow("Other Criteria (to add as applicable as stated in the RFQ)", "otherCriteria");
                addVendorExtraRow("Tender: Score from Tender Evaluation Form", "bgbronze")
                addVendorExtraRow("Bidder passed Essential criteria", "bidderPassed", true);
                addVendorExtraRow("Bidder score for Preferred & Desirable criteria", "bidderScore");
                
                var reason = recLoad.getValue('custbody_stc_reason_recommen')
                body += "<tr>"
                body += "<td style='background-color:#DBD8D8FF; font-weight:bold; border:1px solid black;' colspan='2'>Recommend to award to:</td>"
                if(cekStatus == 'Fully Awarded'){
                    body += "<td style='border:1px solid black; border-left:none;' colspan='11'>"+allVendorName+"</td>"
                }else{
                    body += "<td style='border:1px solid black; border-left:none;' colspan='11'></td>"
                }
                
                body += "</tr>"
                body += "<tr>"
                body += "<td colspan='11'><b>Reasons for recommendation:</b></td>"
                body += "</tr>"
                body += "<tr>"
                body += "<td colspan='11'>"+reason+"</td>"
                body += "</tr>"
                body += "<tr style='height:5px'></tr>"
                body += "</tbody>";
                body += "</table>";

                 // footer
                log.debug('allvendName', allVendorName)
                footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:8px'>";
                footer += "<tbody>";
                footer += "<tr>"
                footer += "<td style='width:5%'></td>"
                footer += "<td style='width:20%'></td>"
                footer += "<td style='width:5%'></td>"
                footer += "<td style='width:20%'></td>"
                footer += "<td style='width:5%'></td>"
                footer += "<td style='width:20%'></td>"
                footer += "<td style='width:5%'></td>"
                footer += "<td style='width:20%'></td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td style='background-color:#DBD8D8FF; color:#0283DFFF; font-weight:bold; border:1px solid black;' colspan='2'>Committee member (if required for procurement procedure) ?</td>"
                footer += "<td style='background-color:#DBD8D8FF; color:#0283DFFF;font-weight:bold; border:1px solid black; border-left:none;' colspan='2'>Committee member (if required for procurement procedure) ?</td>"
                footer += "<td style='background-color:#DBD8D8FF; color:#0283DFFF;font-weight:bold; border:1px solid black; border-left:none;' colspan='2'>Committee member (if required for procurement procedure) ?</td>"
                footer += "<td style='background-color:#DBD8D8FF; color:#0283DFFF;font-weight:bold; border:1px solid black; border-left:none;' colspan='2'>Programme Manager approval ?</td>"
                footer += "</tr>"
                footer += "<tr style='height:20px;'>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;'>Name</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none; border-left:none;'>Name</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Name</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Name</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "</tr>"

                footer += "<tr style='height:20px;'>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;'>Position</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none; border-left:none;'>Position</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Position</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Position</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "</tr>"

                footer += "<tr style='height:20px;'>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;'>Date</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none; border-left:none;'>Date</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Date</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Date</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "</tr>"

                footer += "<tr style='height:40px;'>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;'>Signature</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none; border-left:none;'>Signature</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Signature</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
                footer += "<td style='color:#0283DFFF; border:1px solid black; border-top:none; border-right:none;  border-left:none;'>Signature</td>"
                footer += "<td style='border:1px solid black; border-top:none; border-left:none;'></td>"
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

                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif; height: 21cm; width: 29.7cm;' " +
                    "header='nlheader' header-height='" + headerHeight + "' " +
                    "footer='nlfooter' footer-height='13%' " + 
                    "margin-left='0.7cm' margin-right='0.7cm'>";

                xml += body;

                xml += "\n</body>\n</pdf>";

                xml = xml.replace(/ & /g, ' &amp; ');

                response.renderPdf({
                    xmlString: xml
                });

            }catch(e){
                log.error("Error", e);
            }
            
        }
        return {
            onRequest: onRequest,
        };
    }
);