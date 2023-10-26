/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        function onRequest(context) {
            try{
                var tahun = context.request.parameters.tahun;
            var employeId = context.request.parameters.employId
            log.debug('tahun', tahun);
            log.debug('employeId', employeId);
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

            style += ".tg .tg-headerrow{align: right;font-size:12px;}";
            style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
            style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
            style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
            style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
            style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
            style += "</style>";

            header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            header += "<tbody>";
            header += "</tbody>";
            header += "</table>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            body += "<tbody>";
            body += "</tbody>";
            body += "</table>";

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
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });

            }catch(e){
                log.debug('error', e)
            }
            
        }
        return {
            onRequest: onRequest,
        };
    }
);