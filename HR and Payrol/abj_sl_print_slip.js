/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
  function(render, search, record, log, file, http, config, format, email, runtime) {
        function onRequest(context) {
            var recid = context.request.parameters.id;

            var gajiRec = record.load({
                type: "customrecord_gaji",
                id: recid,
                isDynamic: true,
              });
            var NamaKaryawan = gajiRec.getText('custrecord_employee_gaji');
            var GajiPokok = gajiRec.getValue('custrecord_gaji_gaji_pokok');
            log.debug('namaKaryawan', NamaKaryawan);
              var subsidiariRec = record.load({
                type: "subsidiary",
                id: 1,
                isDynamic: true,
              });
              var legalName = subsidiariRec.getValue('legalname');
              log.debug('legalName', legalName);
              var addresSubsidiaries = subsidiariRec.getValue('mainaddress_text');
              var retEmailAddres = subsidiariRec.getValue('email');

              var logo = subsidiariRec.getValue('logo');
              var filelogo;
              var urlLogo = '';
              if (logo) {
                log.debug('masukLogo', logo);
                  filelogo = file.load({
                      id: logo
                  });
                  urlLogo = filelogo.url.replace(/&/g, "&amp;");
              }
              
            var response = context.response;
            var xml = "";
            var header = "";
            var body = "";
            var headerHeight = '27%';
            var style = "";
            var footer = "";
            var pdfFile = null;

            style += "<style type='text/css'>";
            style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
            style += ".tg .tg-headerlogo{align:left; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-img-logo{width:118px; height:120px; object-vit:cover;}";

            style += ".tg .tg-headerrow{align:left;font-size:12px;}";
            style += ".tg .tg-headerrow_legalName{align:left;font-size:15px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
            style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
            style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
            style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
            style += "</style>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:50%'></td>"
            body += "<td style='width:50%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>";
            body += "<tr>";
            body += "<td>";
            body += "<p class='tg-headerrow_legalName' style='margin-top: 50px; margin-bottom: 5px;'>" + legalName + "</p>";
            body += "</td>";
            if (urlLogo) {
                body += "<td class='tg-headerlogo' style='width:50%; vertical-align:center; align:right;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img> </td>";
            }
            body += "</tr>";
            
            body += "<tr style='height:30px'>"
            body += "<td style='font-size:14px'><b>Slip Gaji</b></td>"
            body += "</tr>"
            body += "<tr>"
            body += "<td style='font-size:12px'><b>Period :</b></td>"
            body += "</tr>"
            body += "<tr style='height:10px'></tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:15%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:15%'></td>"
            body += "<td style='width:38%'></td>"
            body += "<td style='width:15%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:15%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>";
            body += "<tr>"
            body += "<td>Nama</td>"
            body += "<td>:</td>"
            body += "<td>"+ NamaKaryawan +"</td>"
            body += "<td></td>"
            body += "<td>Jabatan</td>"
            body += "<td>:</td>"
            body += "<td>Staff</td>"
            body += "</tr>";
            body += "<tr>"
            body += "<td>Nama</td>"
            body += "<td>:</td>"
            body += "<td>"+ NamaKaryawan +"</td>"
            body += "<td></td>"
            body += "<td>Jabatan</td>"
            body += "<td>:</td>"
            body += "<td>Staff</td>"
            body += "</tr>";
            body += "<tr>"
            body += "<td>Nama</td>"
            body += "<td>:</td>"
            body += "<td>"+ NamaKaryawan +"</td>"
            body += "<td></td>"
            body += "<td>Jabatan</td>"
            body += "<td>:</td>"
            body += "<td>Staff</td>"
            body += "</tr>";
            body += "<tr style='height:20px'>";
            body += "</tr>";
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr style='background-color: #A9A9A9'>"
            body += "<td style='width:30%; background-color: #A9A9A9;'>PENDAPATAN</td>"
            body += "<td style='width:18%; background-color: #A9A9A9'></td>"
            body += "<td style='width:4%; background-color: #A9A9A9'></td>"
            body += "<td style='width:30%; background-color: #A9A9A9'>POTONGAN</td>"
            body += "<td style='width:18%; background-color: #A9A9A9'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr>"
            body += "<td>Gaji Pokok</td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>";
            body += "<tr style='height:10px'></tr>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>";
            body += "<tr style='height:10px'></tr>"
           
            body += "<tr style='height:10px;'>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:15%'></td>"
            body += "<td style='width:25%'></td>"
            body += "<td style='width:20%'></td>"
            body += "<td style='width:40%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td style='align:center'>"+ legalName +"</td>"
            body += "</tr>"
            body += "<tr style='height: 45px'>"
            body += "<td style='align: center; font-size:12px; font-weight: bold; border-top: solid black 0,5px; border-bottom: solid black 0,5px; vertical-align: middle;'>Amount</td>"
            body += "<td style='align:center; font-size:12px; font-weight:bold; background-color:#ffbf00; border-top: solid black 0,5px; border-bottom: solid black 0,5px; vertical-align: middle;'>Rp. " + legalName + "</td>";
            body += "<td></td>"
            body += "<td style='align:center; font-weight: bold;'>"+ legalName +"</td>"
            body += "</tr>"
            body += "<tr style='height:20px'></tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:60%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:38%'></td>"
            body += "<td style='width:1%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td>(</td>"
            body += "<td>Name :</td>"
            body += "<td>)</td>"
            body += "</tr>"
            body += "<tr>"
            body += "<td></td>"
            body += "<td>(</td>"
            body += "<td>Position :</td>"
            body += "<td>)</td>"
            body += "</tr>"
            body += "</tbody>";
            body += "</table>";
            
            footer += "<table class='tg' style='table-layout: fixed;'>";
            footer += "<tbody>";
            footer += "<tr class='tg-foot'>";
            footer += "<td style='align:left'>Purchase Payment #"+ legalName +"</td>"
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
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' footer='nlfooter' footer-height='3%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });
        }

    return {
        onRequest: onRequest,
    };
});