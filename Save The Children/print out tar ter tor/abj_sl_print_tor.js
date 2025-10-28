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
         function getInitialNumber(costCenter) {
            var match = costCenter.match(/^\d+/);
            return match ? match[0] : '';
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
                        type : 'customrecord_tor',
                        id : recid
                    });
                    var nameActivity = recLoad.getValue('custrecord_tor_name_of_activity');
                    var background = recLoad.getValue('custrecord_tor_background');
                    var objective = recLoad.getValue('custrecord_tor_objectives');
                    var expectedOutput = recLoad.getValue('custrecord_tor_expected_output');
                    var attachment = recLoad.getValue('custrecord_tor_attachment');

                    var activityFrom = recLoad.getValue('custrecord_tor_timeline_p_from');
                    var activityTo = recLoad.getValue('custrecord_tor_timeline_period_to')
                    var dataActivity = [];
                    var lineActivity = recLoad.getLineCount({
                        sublistId : 'recmachcustrecord_ac_id_tor'
                    });
                    if(lineActivity>0){
                        for(var i = 0; i < lineActivity; i ++){
                            var actLine = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_ac_id_tor',
                                fieldId : 'custrecord_a_activity',
                                line : i
                            });
                            var indiCativeTimeLine = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_ac_id_tor',
                                fieldId : 'custrecord_a_indicaive_timeline',
                                line : i
                            });
                            dataActivity.push({
                                actLine : actLine,
                                indiCativeTimeLine : indiCativeTimeLine
                            })
                        }
                    }
                    var dataBudget = [];
                    var lineBudget = recLoad.getLineCount({
                        sublistId : 'recmachcustrecord_tori_id'
                    });
                    if(lineBudget > 0){
                        for(var k = 0; k <lineBudget; k++){
                            var costText = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tori_cost_center',
                                line : k
                            })
                            var costCenter = getInitialNumber(costText);
                            var projText = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tori_project_code',
                                line : k
                            })
                            var projectCode = getInitialNumber(projText);
                            var sof = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tori_source_of_funding',
                                line : k
                            })
                            var sofCode = getInitialNumber(sof)
                            var projetTaks = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tor_project_task',
                                line : k
                            })
                            var dea = getInitialNumber(projetTaks)
                            var item = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tori_item',
                                line : k
                            })
                            var cost = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tori_id',
                                fieldId : 'custrecord_tori_amount',
                                line : k
                            })
                            dataBudget.push({
                                costCenter : costCenter,
                                projectCode : projectCode,
                                sofCode : sofCode,
                                dea : dea,
                                item : item,
                                cost : cost
                            })
                        }
                        var companyInfo = config.load({
                            type: config.Type.COMPANY_INFORMATION
                        });
                        var legalName = companyInfo.getValue("legalname");

                        log.debug('legalName', legalName);
                        var logo = companyInfo.getValue('formlogo');
                        var filelogo;
                        var urlLogo = '';
                        if (logo) {
                            filelogo = file.load({
                                id: logo
                            });
                            //get url
                            urlLogo = filelogo.url.replace(/&/g, "&amp;");
                        }
                        log.debug('urlLogo', urlLogo);var response = context.response;
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
                        style += ".tg .tg-img-logo {width:150px; height:40px; object-fit:cover;}";
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
                        header += "<td style='width:30%'></td>"
                        header += "<td style='width:70%'></td>"
                        header += "</tr>"
                        
                        header += "<tr>"
                        if (urlLogo) {
                            header += "<td class='tg-headerlogo' style='width:50%;vertical-align:midle; align:center; margin-left:4px; border:1px solid black;' rowspan='3'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                        }
                        header += "<td style='width:100%; align:center; font-weight:bold; font-size:16px; border:1px solid black; border-left:none;'>"+legalName+"</td>"
                        header += "</tr>"

                        header += "<tr>"
                        header += "<td style='border:1px solid black; border-top:none; border-left:none; font-size:14px;'>Term Of References (ToR)</td>"
                        header += "</tr>"

                        header += "<tr>"
                        header += "<td style='border:1px solid black; border-top:none; border-left:none;'>"+nameActivity+"</td>"
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

                        body += "</tbody>"
                        body += "</table>"

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
                    
                }
            }catch(e){
                log.debug('error', e)
            }
        }
        return{
            onRequest : onRequest
        }
    });