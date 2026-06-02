/***************************************************************************************
 ** Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 ** A‑33‑01, Menara UOA Bangsar, 5 Jalan Bangsar Utama 1, Bangsar, 59000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia
 ** All Rights Reserved.
 ** This software is the confidential and proprietary information of ABJ Cloud Solutions. ("Confidential Information").
 ** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement you entered into with ABJ Cloud Solutions.                   
 ***************************************************************************************/

/*******************************************************************************
 * **Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 * @Client        :  Suy Sing
 * @Script Name   :  - SSCC | SU | Printout ATD
 * @script File   :  abj_su_printout_atd.js
 * @Trigger Type  :  onRequest
 * @Release Date  :  APR 28, 2026
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  Generate PDF Print out ATD
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/

define(['N/ui/serverWidget', 'N/log', 'N/search', 'N/record'], (serverWidget, log, search, record) => {

    /**
     * The `onRequest` event is the main entry point of a Suitelet script.
     * It handles HTTP GET and POST requests to render forms or process submitted data.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Incoming request object
     * @param {ServerResponse} context.response - Suitelet response object
     *
     * @since 2015.2
     */
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
        try {
            var recid = context.request.parameters.id;
            log.debug('recId', recid)
            if(recid){
                var vendName = "";
                var createdDate 
                var modeSattlement = "";
                const customrecord_abj_atd_formSearchObj = search.create({
                type: "customrecord_abj_atd_form",
                filters:
                [
                    ["internalid","anyof",recid]
                ],
                columns:
                [
                    search.createColumn({name: "created", label: "Date Created"}),
                    search.createColumn({
                        name: "legalname",
                        join: "CUSTRECORD_ABJ_ATD_VENDOR",
                        label: "Legal Name"
                    }),
                    search.createColumn({name: "custrecord_abj_atd_modeofsettlement", label: "Mode of Settlement"})
                ]
                });
                const searchResultCount = customrecord_abj_atd_formSearchObj.runPaged().count;
                log.debug("customrecord_abj_atd_formSearchObj result count",searchResultCount);
                customrecord_abj_atd_formSearchObj.run().each(function(result){
                    vendName = result.getValue({
                        name: "legalname",
                        join: "CUSTRECORD_ABJ_ATD_VENDOR",
                    });
                    createdDate = result.getValue({
                        name : "created"
                    });
                    modeSattlement = result.getText({
                        name : "custrecord_abj_atd_modeofsettlement"
                    })
                return true;
                });
                if(createdDate){
                    var parts = createdDate.split(' ')[0].split('/'); 
                    createdDate = parts[1] + '/' + parts[0] + '/' + parts[2].substring(2);
                }
                log.debug('headerData', {
                    vendName : vendName, createdDate : createdDate, modeSattlement : modeSattlement
                })

                // line search
                var totalAmount = 0
                var allItem = []
                var allDataLine = []
                const customrecord_abj_atd_form_lineSearchObj = search.create({
                type: "customrecord_abj_atd_form_line",
                filters:
                [
                    ["custrecord__abj_atd_line_vendor","anyof",recid]
                ],
                columns:
                [
                    search.createColumn({name: "custrecord_abj_atd_line_quantity", label: "Quantity"}),
                    search.createColumn({name: "custrecord_abj_atd_line_items", label: "Items "}),
                    search.createColumn({name: "custrecord_abj_atd_amount", label: "Amount"}),
                    search.createColumn({name: "custrecord_abj_atd_line_totalamt", label: "Total "})
                ]
                });
                const searchCount = customrecord_abj_atd_form_lineSearchObj.runPaged().count;
                log.debug("customrecord_abj_atd_form_lineSearchObj result count",searchCount);
                customrecord_abj_atd_form_lineSearchObj.run().each(function(resData){
                    allItem.push(resData.getText({name: "custrecord_abj_atd_line_items"}));
                    var total = resData.getValue({name: "custrecord_abj_atd_line_totalamt"});
                    totalAmount = Number(totalAmount) + Number(total)

                    allDataLine.push({
                        qty : resData.getValue({name: "custrecord_abj_atd_line_quantity"}),
                        item : resData.getText({name: "custrecord_abj_atd_line_items"}),
                        cost : resData.getValue({name: "custrecord_abj_atd_amount"}),
                        total : resData.getValue({name: "custrecord_abj_atd_line_totalamt"})
                    })
                return true;
                });
                log.debug('allDataLine', allDataLine)

                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '10%';
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
                header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:12px;'>";
                header += "<tbody>";
                header += "<tr>"
                header += "<td style='width:100%'></td>"
                header += "</tr>"
                header += "<tr>"
                header += "<td style='align:center; font-size:14px;'>Authorization to Deduct Form (ATD)</td>"
                header += "</tr>"
                header += "<tr>"
                header += "<td style='align:left'>Date : <u>"+createdDate+"</u></td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td style='align:left'>PLEASE SIGN AND SEND BACK SIGNED COPY. THANK YOU</td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td style='align:left'>This is to authorize Suy Sing Commercial Corporation to deduct the amount of P "+formatNumber(totalAmount)+" from their payment to our company for <u>"+escapeXmlSymbols(allItem)+"</u></td>"
                header += "</tr>"
                
                header += "</tbody>";
                header += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:10%;'></td>"
                body += "<td style='width:35%;'></td>"
                body += "<td style='width:25%;'></td>"
                body += "<td style='width:30%;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-weight:bold; align:center; border: 1px solid black;'>Quantity</td>"
                body += "<td style='font-weight:bold; align:center; border: 1px solid black; border-left:none'>Item</td>"
                body += "<td style='font-weight:bold; align:center; border: 1px solid black; border-left:none'>Cost</td>"
                body += "<td style='font-weight:bold; align:center; border: 1px solid black; border-left:none'>Total</td>"
                body += "</tr>"

             
                if(allDataLine.length > 0){
                    allDataLine.forEach(function(line){
                        var qty = line.qty
                        var item = line.item
                        var cost = line.cost
                        var total = line.total
                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none;'>"+qty+"</td>"
                        body += "<td style='border: 1px solid black; border-top:none; border-left:none;'>"+escapeXmlSymbols(item)+"</td>"
                        body += "<td style='align:right; border: 1px solid black; border-top:none; border-left:none'>"+formatNumber(cost)+"</td>"
                        body += "<td style='align:right; border: 1px solid black; border-top:none; border-left:none'>"+formatNumber(total)+"</td>"
                        body += "</tr>"
                    });
                }

                body += "<tr style='height:10px;'>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:12px'>";
                footer += "<tbody>";
                footer += "<tr>"
                footer += "<td style='width:25%;'></td>"
                footer += "<td style='width:25%;'></td>"
                footer += "<td style='width:5%;'></td>"
                footer += "<td style='width:45%;'></td>"
                footer += "</tr>"
                footer += "<tr>"
                footer += "<td>Mode of settlement:</td>"
                footer += "<td><u>"+modeSattlement+"</u></td>"
                footer += "<td></td>"
                footer += "</tr>"

                footer += "<tr style='height:10px;'>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td colspan='2' style='border-bottom:1px solid black'></td>"
                footer += "<td></td>"
                footer += "<td style='border-bottom:1px solid black'>"+vendName+"</td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td colspan='2'>Printed Name &amp; Signature of Authorized Signatory</td>"
                footer += "<td></td>"
                footer += "<td>Company</td>"
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

                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' margin-left='2cm' margin-right='2cm'>";
                xml += body;
                xml += footer;

                xml += "\n</body>\n</pdf>";


                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }
        } catch (ex) {
            log.error('onRequest: ' + ex.name, ex.message);
            context.response.write('Error: ' + ex.message);
        }
    }

    return {
        onRequest: onRequest
    };
});
