/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
    function removeDecimalFormat(number) {
        return number.toString().substring(0, number.toString().length - 3);
    }
    function onRequest(context) {
        var recid = context.request.parameters.id;
        log.debug('recid', recid);
        var bcRec = record.load({
            type: 'customrecord_budget_cost',
            id: recid,
            isDynamic: false,
        });
        var noMer = bcRec.getValue('name');
        var period = bcRec.getValue('custrecord_bc_periode');
        log.debug('period', period);
        var periodBef = Number(period - 1);
        log.debug('periodBef', periodBef)
        var notedBc = bcRec.getValue('custrecord_bc_note');
        var dateBc = bcRec.getValue('custrecord_bc_date');
        if(dateBc){
            dateBc = format.format({
                value: dateBc,
                type: format.Type.DATE
            });
        }
        var dibuatDi = bcRec.getValue('custrecord_bc_dibuat_di');
        var subsidiari = bcRec.getValue('custrecord_bc_subsidiary');
        if(subsidiari){
            var subRec = record.load({
                type: 'subsidiary',
                id : subsidiari,
                isDynamic : false,
            });
            var legalName = subRec.getValue('legalname');
            var logo = subRec.getValue('logo');
            var filelogo;
            var urlLogo = '';
            if (logo) {
                filelogo = file.load({
                    id: logo
                });
                //get url
                urlLogo = filelogo.url.replace(/&/g, "&amp;");
            }

            var response = context.response;
            var xml = "";
            var header = "";
            var body = "";
            var headerHeight = '1%';
            var style = "";
            var footer = "";
            var pdfFile = null;

            
            style += "<style type='text/css'>";
            style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
            style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-img-logo{width:85px; height:70px; object-vit:cover;}";

            style += ".tg .tg-headerrow{align: right;font-size:12px;}";
            style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
            style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border: 1px solid black;}";
            style += ".tg .tg-headBody{align: left;font-size:12px; border: 1px solid black;}";
            style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
            style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
            style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
            style += "</style>";

            header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            header += "<tbody>";
            header += "</tbody>";
            header += "</table>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:14px;font-weight: bold; \">";
            body += "<tbody>";

            body += "<tr>";
            body += "<td style='width:10%'></td>";
            body += "<td style='width:80%'></td>";
            body += "<td style='width:10%'></td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td></td>";
            body += "<td style='align: center;'>"+legalName.toUpperCase()+"</td>";
            if (urlLogo) {
                body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left;' rowspan='4'><div style='display: flex; height:100px; width:150px;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
            }
            body += "</tr>";

            body += "<tr>";
            body += "<td style=''></td>";
            body += "<td style='align: center;'>BUDGET COST</td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td style=''></td>";
            body += "<td style='align: center;'>PERIODE "+period+" </td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td style=''></td>";
            body += "<td style='align: center;'>"+noMer+" </td>";
            body += "</tr>";

            body += "<tr style='height:10px'>";
            body += "</tr>";
        
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:12px; \">";
            body += "<tbody>";

            body += "<tr>";
            body += "<td class='tg-head_body' style='width:1%; text-align:center;' rowspan='2'> NO </td>"
            body += "<td class='tg-head_body' style='width:7%; align:center;' rowspan='2'> Desc </td>"
            body += "<td class='tg-head_body' style='width:6%; align:center;' colspan='2'> BUDGET "+periodBef+" </td>"
            body += "<td class='tg-head_body' style='width:82%; align:center;' colspan='26'> BUDGET "+period+" </td>"
            body += "</tr>";

            body += "<tr>";
            body += "<td class='tg-head_body' style='align:center; text-align:center;'>Budget Cost </td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Cost </td>"
            body += "<td class='tg-head_body' style='align:center;'>Jan</td>"
            body += "<td class='tg-head_body' style='align:center;'>Feb</td>"
            body += "<td class='tg-head_body' style='align:center;'>Mar</td>"
            body += "<td class='tg-head_body' style='align:center;'>Apr</td>"
            body += "<td class='tg-head_body' style='align:center;'>May</td>"
            body += "<td class='tg-head_body' style='align:center;'>Jun</td>"
            body += "<td class='tg-head_body' style='align:center;'>Jul</td>"
            body += "<td class='tg-head_body' style='align:center;'>Aug</td>"
            body += "<td class='tg-head_body' style='align:center;'>Sep</td>"
            body += "<td class='tg-head_body' style='align:center;'>Oct</td>"
            body += "<td class='tg-head_body' style='align:center;'>Nov</td>"
            body += "<td class='tg-head_body' style='align:center;'>Dec</td>"
            body += "<td class='tg-head_body' style='align:center;'>TOTAL BUDGET "+period+"</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Jan</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Feb</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Mar</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Apr</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual May</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Jun</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Jul</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Aug</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Sep</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Oct</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Nov</td>"
            body += "<td class='tg-head_body' style='align:center;'>Actual Dec</td>"
            body += "<td class='tg-head_body' style='align:center;'>TOTAL ACTUAL</td>"
            body += "</tr>";

            body += getLIne(context, bcRec);
            
            body += "</tbody>";
            body += "</table>";


            footer += "<table class='tg' style='table-layout: fixed;'>";
            footer += "<tbody>";
            footer += "<tr class='tg-foot'>";
            footer += "<td style='align:left'></td>"
            footer += "<td style='align:right'></td>"
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
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 70cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });
        }
    }
    function getLIne(context, bcRec){
        var lineCount = bcRec.getLineCount({
            sublistId: 'recmachcustrecord_bcd_id'
        });
        if(lineCount > 0){
            var body = "";
            var No = 1
            for(var index = 0; index < lineCount; index++){
                var desc = bcRec.getSublistText({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_description',
                    line : index,
                });
                log.debug('desc', desc)
                var budgetLy = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_cost_tahun_lalu',
                    line : index,
                });
                log.debug('budgetLy', budgetLy)
                var actualLy = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_cost_tahun_lalu',
                    line : index,
                });
                var jan = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_jan',
                    line : index,
                });
                var feb = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_feb',
                    line : index,
                });
                var mar = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_mar',
                    line : index,
                });
                var apr = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_apr',
                    line : index,
                });
                var may = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_may',
                    line : index,
                });
                var jun = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_jun',
                    line : index,
                });
                var jul = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_jul',
                    line : index,
                });
                var aug = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_aug',
                    line : index,
                });
                var sep = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_sep',
                    line : index,
                });
                var oct = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_oct',
                    line : index,
                });
                var nov = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_nov',
                    line : index,
                });
                var dec = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_dec',
                    line : index,
                });
                var bcTotal = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_total_budget',
                    line : index,
                });
                var actJan = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_jan',
                    line : index,
                });
                var actFeb = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_feb',
                    line : index,
                });
                var actMar = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_mar',
                    line : index,
                });
                var actApr = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_apr',
                    line : index,
                });
                var actMay = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_may',
                    line : index,
                });
                var actJun = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_jun',
                    line : index,
                });
                var actJul = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_jul',
                    line : index,
                });
                var actAug = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_aug',
                    line : index,
                });
                var actSep = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_sep',
                    line : index,
                });
                var actOct = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_oct',
                    line : index,
                });
                var actNov = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_nov',
                    line : index,
                });
                var actDec = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_dec',
                    line : index,
                });
                var totalAct = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_total_actual',
                    line : index,
                });

                body += "<tr>";
                body += "<td class='tg-headBody' style='align:left;'>"+No+"</td>"
                body += "<td class='tg-headBody' style='align:left;'>"+desc+"</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp."+budgetLy+"</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp."+actualLy+"</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + jan + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + feb + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + mar + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + apr + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + may + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + jun + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + jul + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + aug + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + sep + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + oct + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + nov + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + dec + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + bcTotal + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actJan + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actFeb + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actMar + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actApr + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actMay + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actJun + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actJul + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actAug + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actSep + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actOct + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actNov + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + actDec + "</td>"
                body += "<td class='tg-headBody' style='align:left;'>Rp." + totalAct + "</td>"


                body += "</tr>";


                No++
            }
            return body;
            
        }
    }
    return {
        onRequest: onRequest,
    };
});