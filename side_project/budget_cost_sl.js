/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
        var classBc = bcRec.getValue('custrecord_bc_business_unit');
        var className
        if(classBc){
            var recClass = record.load({
                type : 'classification',
                id : classBc,
                isDynamic : false
            })
            className = recClass.getValue('name');
            log.debug('className', className);
        }
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
        style += ".tg .tg-head_body { text-align: left; font-size: 6px; font-weight: bold; border: 1px solid black; border-collapse: collapse; }";
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

        body += "<tr>";
        body += "<td style=''></td>";
        body += "<td style='align: center;'>"+className+" </td>";
        body += "</tr>";

        body += "<tr style='height:10px'>";
        body += "</tr>";
    
        body += "</tbody>";
        body += "</table>";

        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:9px; \">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td class='tg-head_body' style='width:2%; align:center; vertical-align: middle;' rowspan='2'> NO </td>";
        body += "<td class='tg-head_body' style='width:7%; align:center; vertical-align: middle;' rowspan='2'> Desc </td>"
        body += "<td class='tg-head_body' style='width:6%; align:center; vertical-align: middle;' colspan='2'> BUDGET "+periodBef+" </td>"
        body += "<td class='tg-head_body' style='width:82%; align:center; vertical-align: middle;' colspan='26'> BUDGET "+period+" </td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td class='tg-head_body' style='align:center; text-align:center; vertical-align: middle;'>Budget Cost </td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Cost </td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Jan</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Feb</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Mar</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Apr</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>May</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Jun</td>"
        body += "<td class='tg-head_body' style='align:center;vertical-align: middle;'>Jul</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Aug</td>"
        body += "<td class='tg-head_body' style='align:center;vertical-align: middle;'>Sep</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Oct</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Nov</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Dec</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>TOTAL BUDGET "+period+"</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Jan</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Feb</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Mar</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Apr</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual May</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Jun</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Jul</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Aug</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Sep</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Oct</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Nov</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>Actual Dec</td>"
        body += "<td class='tg-head_body' style='align:center; vertical-align: middle;'>TOTAL ACTUAL</td>"
        body += "</tr>";

        body += getLIne(context, bcRec);
        
        body += "</tbody>";
        body += "</table>";

        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:9px; \">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='font-size:6px; font-weight: bold;'>Note :</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='font-size:6px;'>"+notedBc+"</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='height:10px;'></td>"
        body += "</tr>";

        body += "</tbody>";
        body += "</table>";

        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:9px; \">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:10%;'></td>"
        body += "<td style='width:5%;'></td>"
        body += "<td style='width:85%;'></td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td></td>"
        body += "<td style='font-size:6px; align:left;'>Dibuat di </td>"
        body += "<td style='font-size:6px; align:left;'>: "+dibuatDi+"</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td></td>"
        body += "<td style='font-size:6px; align:left;'>Tanggal </td>"
        body += "<td style='font-size:6px; align:left;'>: "+dateBc+"</td>"
        body += "</tr>";

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
        xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 32cm; width: 48cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
        xml += body;
        xml += "\n</body>\n</pdf>";

        xml = xml.replace(/ & /g, ' &amp; ');
        response.renderPdf({
            xmlString: xml
        });
    }
    function getLIne(context, bcRec){
        var lineCount = bcRec.getLineCount({
            sublistId: 'recmachcustrecord_bcd_id'
        });
        if(lineCount > 0){
            var body = "";
            var No = 1
            var totalbudgetLy = 0;
            var totalactualLy = 0;
            var totalJan = 0;
            var totalFeb = 0;
            var totalMar = 0;
            var totalApr = 0;
            var totalMay = 0;
            var totalJun = 0;
            var totalJul = 0;
            var totalAug = 0;
            var totalSep = 0;
            var totalOct = 0;
            var totalNov = 0;
            var totalDec = 0;
            var totalTotalBc = 0;
            var totalActJan = 0;
            var totalActFeb = 0;
            var totalActMar = 0;
            var totalActApr = 0;
            var totalActMay = 0;
            var totalActJun = 0;
            var totalActJul = 0;
            var totalActAug = 0;
            var totalActSep = 0;
            var totalActOct = 0;
            var totalActNov = 0;
            var totalActDec = 0;
            var totalTotalAct = 0;

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
                totalbudgetLy+=Number(budgetLy)
                log.debug('budgetLy', budgetLy)
                var actualLy = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_cost_tahun_lalu',
                    line : index,
                });
                totalactualLy += Number(actualLy)
                var jan = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_jan',
                    line : index,
                });
                totalJan += Number(jan)
                var feb = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_feb',
                    line : index,
                });
                totalFeb += Number(feb)
                var mar = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_mar',
                    line : index,
                });
                totalMar += Number(mar)
                var apr = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_apr',
                    line : index,
                });
                totalApr += Number(apr)
                var may = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_may',
                    line : index,
                });
                totalMay += Number(may)
                var jun = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_jun',
                    line : index,
                });
                totalJun += Number(jun)
                var jul = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_jul',
                    line : index,
                });
                totalJul += Number(jul)
                var aug = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_aug',
                    line : index,
                });
                totalAug += Number(aug)
                var sep = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_sep',
                    line : index,
                });
                totalSep += Number(sep)
                var oct = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_oct',
                    line : index,
                });
                totalOct += Number(oct)
                var nov = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_nov',
                    line : index,
                });
                totalNov += Number(nov)
                var dec = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_budget_dec',
                    line : index,
                });
                totalDec += Number(dec)
                var bcTotal = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_total_budget',
                    line : index,
                });
                totalTotalBc += Number(bcTotal)
                var actJan = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_jan',
                    line : index,
                });
                totalActJan += Number(actJan)
                var actFeb = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_feb',
                    line : index,
                });
                totalActFeb += Number(actFeb)
                var actMar = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_mar',
                    line : index,
                });
                totalActMar += Number(actMar)
                var actApr = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_apr',
                    line : index,
                });
                totalActApr += Number(actApr)
                var actMay = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_may',
                    line : index,
                });
                totalActMay += Number(actMay)
                var actJun = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_jun',
                    line : index,
                });
                totalActJun += Number(actJun)
                var actJul = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_jul',
                    line : index,
                });
                totalActJul += Number(actJul)
                var actAug = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_aug',
                    line : index,
                });
                totalActAug += Number(actAug)
                var actSep = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_sep',
                    line : index,
                });
                totalActSep += Number(actSep)
                var actOct = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_oct',
                    line : index,
                });
                totalActOct += Number(actOct)
                var actNov = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_nov',
                    line : index,
                });
                totalActNov += Number(actNov)
                var actDec = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_actual_dec',
                    line : index,
                });
                totalActDec += Number(actDec)
                var totalAct = bcRec.getSublistValue({
                    sublistId : 'recmachcustrecord_bcd_id',
                    fieldId : 'custrecord_bcd_total_actual',
                    line : index,
                });
                totalTotalAct += Number(totalAct)

                body += "<tr>";
                body += "<td class='tg-headBody' style='align:center; font-size:5px;'>"+No+"</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>"+desc+"</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp."+formatNumber(budgetLy)+"</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp."+formatNumber(actualLy)+"</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(jan) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(feb) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(mar) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(apr) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(may) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(jun) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(jul) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(aug) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(sep) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(oct) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(nov) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(dec) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(bcTotal) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actJan) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actFeb) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actMar) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actApr) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actMay) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actJun) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actJul) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actAug) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actSep) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actOct) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actNov) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(actDec) + "</td>"
                body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalAct) + "</td>"

                body += "</tr>";
                No++
            }
            body += "<tr>";
            body += "<td class='tg-headBody' style='align:left; font-size:5px;' colspan='2'>TOTAL</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalbudgetLy) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalactualLy) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalJan) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalFeb) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalMar) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalApr) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalMay) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalJun) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalJul) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalAug) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalSep) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalOct) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalNov) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalDec) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalTotalBc) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActJan) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActFeb) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActMar) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActApr) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActMay) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActJun) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActJul) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActAug) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActSep) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActOct) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActNov) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalActDec) + "</td>"
            body += "<td class='tg-headBody' style='align:left; font-size:5px;'>Rp." + formatNumber(totalTotalAct) + "</td>"
            body += "</tr>";
            return body;
            
        }
    }
    return {
        onRequest: onRequest,
    };
});