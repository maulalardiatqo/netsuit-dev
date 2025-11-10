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

                var fieldPR = recLoad.getValue('custbody_stc_link_to_pr');
                var serchTrans = search.lookupFields({
                    type: "purchaserequisition",
                    id: fieldPR,
                    columns: ["tranid"],
                });
                var prNo = serchTrans.tranid
                log.debug('prNo', prNo)
                var sendDate = recLoad.getValue('startdate');
                var bidCloseDate = recLoad.getValue('bidclosedate');
                var submissionLocation = recLoad.getValue('custbody_stc_submission_location');
                var docRequired = recLoad.getValue('custbody_stc_document_rquired');
                var dateGoods = recLoad.getValue('custbody_stc_date_required');
                var delivAddres = recLoad.getValue('custbody_stc_delivery_address');
                var reqIncoterm = recLoad.getValue('custbody_stc_requirement_incotrm');

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
                header += "</tr>"
                header += "</tbody>";
                header += "</table>";

                header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:8px;'>";
                header += "<tbody>";
                header += "<tr>"
                header += "<td style='width:3%;'></td>"
                header += "<td style='width:19%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "<td style='width:10%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "<td style='width:5%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "<td style='width:5%;'></td>"
                header += "<td style='width:5%;'></td>"
                header += "<td style='width:5%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td colspan='2'>PR Reference No.</td>"
                header += "<td colspan='8'></td>"
                header += "<td colspan='2'>PR Reference No.</td>"
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
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center; font-weight:bold'>Quantity required</td>"
                body += "<td style='background-color:#DBD8D8FF; border:1px solid black; border-left:none; align:center; font-weight:bold'>Currency</td>"
                body += "<td style='background-color:red; color:white; border:1px solid black; border-left:none; align:center; font-weight:bold'>Lead Time for Delivery</td>"
                body += "<td style='background-color:red; color:white;border:1px solid black; border-left:none; align:center; font-weight:bold'>Unit Price</td>"
                body += "<td style='background-color:red; color:white; border:1px solid black; border-left:none; align:center; font-weight:bold'>Total Price</td>"
                body += "</tr>"
                body += "<tr>"
                body += "<td></td>"
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

                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 21cm; width: 29.7cm;' header='nlheader' header-height='" + headerHeight + "' margin-left='0.5cm' margin-right='0.5cm'>";
                xml += body;
                xml += footer;

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