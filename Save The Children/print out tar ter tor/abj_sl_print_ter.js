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
        function formatTimeOnly(dateString) {
            var date = new Date(dateString);
            if (isNaN(date)) return ''; 

            let hours = date.getHours();
            let minutes = date.getMinutes();

            let ampm = hours >= 12 ? 'pm' : 'am';

            hours = hours % 12;
            hours = hours ? hours : 12; 

            minutes = minutes < 10 ? '0' + minutes : minutes;

            return hours + ':' + minutes + ' ' + ampm;
        }

        function onRequest(context) {
            try{
                var recid = context.request.parameters.recid;
                log.debug('recid', recid)
                if(recid){
                    var recLoad = record.load({
                        type : 'customrecord_ter',
                        id : recid
                    });
                    var nomor = recLoad.getValue('name');
                    var date = recLoad.getValue('custrecord_ter_date');
                    var staffName = recLoad.getText('custrecord_ter_staf_name');
                    var purpouse = recLoad.getValue('custrecord_ter_purpose_of_travel');
                    var travelTo = recLoad.getValue('custrecord_ter_travel_to');
                    var travelDateFrom = recLoad.getValue('custrecord_ter_travel_date_from');
                    var travelDateTo = recLoad.getValue('custrecord_ter_travel_date_to');
                    var createdby = recLoad.getText('custrecord_ter_created_by');
                    var approvBudgetHolderBy = recLoad.getText('custrecord_ter_approval_by_budget_holder');
                    var approvBudgetHolderat = recLoad.getValue('custrecord_ter_last_approve_budget')
                    var dataPerdiem = [];
                    var countPerdiem = recLoad.getLineCount({
                        sublistId : "recmachcustrecord_terd_id"
                    });
                    if(countPerdiem > 0){
                        for(var i = 0; i<countPerdiem; i++){
                            var datePerDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_date',
                                line : i
                            })
                            var timePartDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_time_depart',
                                line : i
                            })
                            var timeArrivalDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_time_arrival',
                                line : i
                            })
                            var fromDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_from',
                                line : i
                            })
                            var toDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_to',
                                line : i
                            })
                            var rateDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_rate',
                                line : i
                            })
                            var bDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_breakfast',
                                line : i
                            })
                            var lDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_lunch',
                                line : i
                            })
                            var dDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_diner',
                                line : i
                            })
                            var iDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_incidental',
                                line : i
                            })
                            var totalDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_deduction_totall',
                                line : i
                            })
                            var amountDiem = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_terd_id',
                                fieldId : 'custrecord_terd_amount',
                                line : i
                            })
                            dataPerdiem.push({
                                datePerDiem : formatDateToDDMMYYYY(datePerDiem),
                                timePartDiem : timePartDiem,
                                timeArrivalDiem : timeArrivalDiem,
                                fromDiem : fromDiem,
                                toDiem : toDiem,
                                rateDiem : rateDiem,
                                bDiem : bDiem,
                                lDiem : lDiem,
                                dDiem : dDiem,
                                iDiem : iDiem,
                                totalDiem : totalDiem,
                                amountDiem : amountDiem
                            })
                        }
                    }
                    var dataTransport = [];
                    var countLineTransport = recLoad.getLineCount({
                        sublistId : 'recmachcustrecord_tar_id_ter'
                    })
                    if(countLineTransport > 0){
                        for(var k = 0; k < countLineTransport; k++){
                            var expDate = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tar_id_ter',
                                fieldId : 'custrecord_tar_expense_date',
                                line : k
                            })
                            var expReceiptNo = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tar_id_ter',
                                fieldId : 'custrecord_tar_expense_receipt_no',
                                line : k
                            })
                            var expDesc = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tar_id_ter',
                                fieldId : 'custrecord_tare_memo',
                                line : k
                            })
                            var expAmt = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tar_id_ter',
                                fieldId : 'custrecord_tare_amount',
                                line : k
                            })
                            dataTransport.push({
                                expDate : formatDateToDDMMYYYY(expDate),
                                expReceiptNo : expReceiptNo,
                                expDesc : expDesc,
                                expAmt : expAmt
                            })
                        }
                    }
                    var response = context.response;
                        var xml = "";
                        var header = "";
                        var body = "";
                        var headerHeight = '3%';
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
                        header += "<td style='width:100%; align:center; font-weight:bold; font-size:16px;'>Travel Expense Report</td>"
                        header += "</tr>"
                        header += "</tbody>";
                        header += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                        body += "<tbody>";

                        body += "<tr>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:1%;'></td>"
                        body += "<td style='width:84%;'></td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td>No</td>"
                        body += "<td>:</td>"
                        body += "<td>#"+escapeXmlSymbols(nomor)+"</td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td>Date</td>"
                        body += "<td>:</td>"
                        body += "<td>"+formatDateToDDMMYYYY(date)+"</td>"
                        body += "</tr>"

                        body += "</tbody>";
                        body += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                        body += "<tbody>";
                        body += "<tr>"
                        body += "<td style='width:20%;'></td>"
                        body += "<td style='width:20%;'></td>"
                        body += "<td style='width:20%;'></td>"
                        body += "<td style='width:20%;'></td>"
                        body += "<td style='width:20%;'></td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td style='border: 1px solid black;'>Staff Name:</td>"
                        body += "<td style='border: 1px solid black; border-left:none;'>"+escapeXmlSymbols(staffName)+"</td>"
                        body += "<td style='border: 1px solid black; border-left:none;'>Travel To:</td>"
                        body += "<td style='border: 1px solid black; border-left:none;'>"+escapeXmlSymbols(travelTo)+"</td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none;'>Purpose of Travel:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(purpouse)+"</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>Travel Date:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>"+formatDateToDDMMYYYY(travelDateFrom)+" - "+formatDateToDDMMYYYY(travelDateTo)+"</td>"
                        body += "</tr>"

                        body += "</tbody>";
                        body += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:8px;\">";
                        body += "<tbody>";
                        var totalAmtDiem = 0
                        if(dataPerdiem.length > 0){
                            
                            body += "<tr>"
                            body += "<td style='width:4%;'></td>"
                            body += "<td style='width:7%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:6%;'></td>"
                            body += "<td style='width:6%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:6%;'></td>"
                            body += "<td style='width:4%;'></td>"
                            body += "<td style='width:4%;'></td>"
                            body += "<td style='width:4%;'></td>"
                            body += "<td style='width:4%;'></td>"
                            body += "<td style='width:8%;'></td>"
                            body += "<td style='width:7%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "</tr>"
                            body += "<tr>"
                            body += "<td colspan='8'>Per Diem</td>"
                            body += "</tr>"
                            body += "<tr>"
                            body += "<td style='border: 1px solid black; align:center; font-weight:bold;'>Day</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Date</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Time Depar</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Time Arrival</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>From</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>To</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>PerDiem Rate</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Currency</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;' colspan ='5'>Deduction</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Exchange</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Total Amount</td>"
                            body += "</tr>"

                            body += "<tr>"
                            body += "<td style='border: 1px solid black; border-top:none; align:center;' colspan='8'></td>"
                            body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center; font-weight:bold;'>B</td>"
                            body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center; font-weight:bold;'>L</td>"
                            body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center; font-weight:bold;'>D</td>"
                            body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center; font-weight:bold;'>I</td>"
                            body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center; font-weight:bold;'>Total</td>"
                            body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center; font-weight:bold;' colspan='2'></td>"
                            body += "</tr>"
                            
                            var day = 1
                            dataPerdiem.forEach((data)=>{
                                var datePerDiem = data.datePerDiem
                                var timePartDiem = data.timePartDiem
                                var timeArrivalDiem = data.timeArrivalDiem
                                var fromDiem = data.fromDiem
                                var toDiem = data.toDiem
                                var rateDiem = data.rateDiem
                                var bDiem = data.bDiem
                                var lDiem = data.lDiem
                                var dDiem = data.dDiem
                                var iDiem = data.iDiem
                                var totalDiem = data.totalDiem
                                var amountDiem = data.amountDiem
                                totalAmtDiem = Number(totalAmtDiem) + Number(amountDiem)

                                    body += "<tr>"
                                    body += "<td style='border: 1px solid black; border-top:none; align:center;'>"+day+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+datePerDiem+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatTimeOnly(timePartDiem)+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatTimeOnly(timeArrivalDiem)+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(fromDiem)+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(toDiem)+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(rateDiem)+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>IDR</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>" 
                                    + (bDiem ? 'x' : '') 
                                    + "</td>";
                                     body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>" 
                                    + (lDiem ? 'x' : '') 
                                    + "</td>";
                                     body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>" 
                                    + (dDiem ? 'x' : '') 
                                    + "</td>";
                                     body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>" 
                                    + (iDiem ? 'x' : '') 
                                    + "</td>";
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(totalDiem)+"</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>1</td>"
                                    body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(amountDiem)+"</td>"
                                    body += "</tr>"
                                    day = Number(day) + 1
                            })
                            body += "<tr>"
                            body += "<td style='border: 1px solid black; border-top:none; align:center;' colspan='14'>Total</td>"
                            body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(amountDiem)+"</td>"
                            body += "</tr>"
                        }
                        body += "</tbody>";
                        body += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:8px;\">";
                        body += "<tbody>";
                        var totalAmtExp = 0
                        if(dataTransport.length>0){
                            body += "<tr>"
                            body += "<td style='width:5%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:35%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "<td style='width:10%;'></td>"
                            body += "</tr>"
                            body += "<tr>"
                            body += "<td colspan='8'>Transport & Other Expense</td>"
                            body += "</tr>"

                            body += "<tr>"
                            body += "<td style='border: 1px solid black; align:center; font-weight:bold;'>Day</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Date</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Receipt No</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Description</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Currency</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Amount</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Exchange Rate</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center; font-weight:bold;'>Total</td>"
                            body += "</tr>"
                            
                            var dayExp = 1
                            dataTransport.forEach((data)=>{
                                var expDate = data.expDate
                                var expReceiptNo = data.expReceiptNo
                                var expDesc = data.expDesc
                                var expAmt = data.expAmt
                                totalAmtExp = Number(totalAmtExp) + Number(expAmt)
                                body += "<tr>"
                                body += "<td style='border: 1px solid black; border-top:none; align:center;'>"+dayExp+"</td>"
                                body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center;'>"+expDate+"</td>"
                                body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center;'>"+escapeXmlSymbols(expReceiptNo)+"</td>"
                                body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center;'>"+escapeXmlSymbols(expDesc)+"</td>"
                                body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center;'>IDR</td>"
                                body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center;'>"+formatNumber(expAmt)+"</td>"
                                body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center;'>1</td>"
                                body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:center;'>"+formatNumber(expAmt)+"</td>"
                                body += "</tr>"

                                dayExp = Number(dayExp) + 1
                            })
                            body += "<tr>"
                            body += "<td style='border: 1px solid black; border-top:none; align:center;' colspan='7'>Total</td>"
                            body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(totalAmtExp)+"</td>"
                            body += "</tr>"
                            
                        }
                        var totalTer = Number(totalAmtDiem) + Number(totalAmtExp)
                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none; align:center;' colspan='7'>Total TER</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(totalTer)+"</td>"
                        body += "</tr>"

                        body += "</tbody>";
                        body += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                        body += "<tbody>";
                        body += "<tr>"
                        body += "<td><i>Created By :</i><b>"+createdby+"</b></td>";
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td><i>Approved Supervisor By :</i><b></b></td>";
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td><i>Approved Budget Holder By :</i><b>"+approvBudgetHolderBy+" at "+approvBudgetHolderat+"</b></td>";
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td>Disclaimer:</td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td>All processes are done by the system.</td>"
                        body += "</tr>"
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

                        xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' margin-left='0.7cm' margin-right='0.7cm'>";
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