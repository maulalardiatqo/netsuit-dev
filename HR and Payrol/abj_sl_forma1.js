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
            var footer = "";
            var pdfFile = null;

            var style = "<style type='text/css'>";
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

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0;\">";
            body += "<tbody>";
            body += "<tr>"
            body += "<td style='font-size:12px; color:#808080'>a r e a  s t a p l e s</td>"
            body += "</tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0;\">";
            body += "<tbody>";
            body += "<tr>";
            body += "<td style='width:25%'></td>"
            body += "<td style='width:45%'></td>"
            body += "<td style='width:30%'></td>"
            body += "</tr>";
            body += "<tr>"
            body += "<td style='border: 1px solid black; border-bottom: none; align: left;'><div style='width: 20px; height: 10px; background-color: black; align: right;'></div></td>"
            body += "<td style='border: 1px solid black; border-bottom: none; align: center;'></td>"
            body += "<td style='align: right; border: 1px solid black; border-bottom: none;'><div style='width: 20px; height: 10px; background-color: black; align: right;'></div></td>"
            body += "</tr>"   
            body += "<tr>"
            body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; align: left;'></td>"
            body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; align: center;'>BUKTI PEMOTONGAN PAJAK PENGHASILAN</td>"
            body += "<td style='align: right; border: 1px solid black; border-bottom: none; border-top: none;'></td>"
            body += "</tr>"   
            body += "<tr>"
            body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; align: left;'></td>"
            body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; align: center;'>PASAL 21 BAGI PEGAWAI TETAP ATAU</td>"
            body += "<td style='align: right;'>"
            body += "<div style='width: 20px; height: 10px; background-color: black; float: left; margin-right:3px'></div>"
            body += "<div style='width: 20px; height: 10px; background-color: white; border: 1px solid black; float: left; margin-right:3px'></div>"
            body += "<div style='width: 20px; height: 10px; background-color: black; float: left; margin-right:3px'></div>"
            body += "<div style='width: 20px; height: 10px; background-color: white; border: 1px solid black; float: left;'></div>"
            body += "<div style='clear: both;'></div>"
            body += "</td>"
            body += "</tr>"   
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
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 33cm; width: 21cm; margin: 0; padding: 0;' header='nlheader' footer='nlfooter' footer-height='3%'>";
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