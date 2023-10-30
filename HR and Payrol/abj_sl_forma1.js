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
                var month = 12;
                var tahun2Digit = tahun.substring(tahun.length - 2);
                var noUrut = '0000003';
                var logo = 7062
                var filelogo;
                var urlLogo = '';
                if (logo) {
                    filelogo = file.load({
                        id: logo
                    });
                    urlLogo = filelogo.url.replace(/&/g, "&amp;");
                }

                var recSubsidiary = record.load({
                    type: "subsidiary",
                    id: 1,
                    isDynamic: false,
                });

                var legalName = recSubsidiary.getValue('legalname');
                log.debug('legalName', legalName);
                log.debug('tahun', tahun);
                log.debug('employeId', employeId);
                log.debug('urlLogo', urlLogo);


                var searchRemu = search.create({
                    type : 'customrecord_remunasi',
                    filters : [["custrecord3","is",employeId]],
                    columns : ['custrecord_no_npwp', 'custrecord_abj_msa_noid', 'custrecord3', 'custrecord_abj_msa_alamat', 'custrecord_abj_msa_jenis_kelasmin']
                });
                var searchRemuSet = searchRemu.run();
                var searchRemuResult = searchRemuSet.getRange({
                    start: 0,
                    end: 1,
                });
                if(searchRemuResult.length > 0){
                    var recRemu = searchRemuResult[0];
                    var noNpWp = recRemu.getValue({
                        name : 'custrecord_no_npwp'
                    });
                    var nik = recRemu.getValue({
                        name : 'custrecord_abj_msa_noid'
                    });
                    var empName = recRemu.getText({
                        name : 'custrecord3'
                    });
                    var alamat = recRemu.getValue({
                        name : 'custrecord_abj_msa_alamat'
                    });
                    var jenisKelamin = recRemu.getValue({
                        name : 'custrecord_abj_msa_jenis_kelasmin'
                    });
                }
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
                body += "<td style='font-size:11px; color:#808080'>a r e a  s t a p l e s</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:25%'></td>"
                body += "<td style='width:40%'></td>"
                body += "<td style='width:35%'></td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td style='align: left;'><div style='width: 30px; height: 10px; background-color: black; align: right;margin-left: 10px;'></div></td>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; align: center;'></td>"
                body += "<td style='align: right;'><div style='width: 30px; height: 10px; background-color: black; align: right; margin-right: 10px;'></div></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top: none; align:center;'></td>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>BUKTI PEMOTONGAN PAJAK PENGHASILAN</td>"
                body += "<td style='align: right;'></td>"
                body += "</tr>" 

                body += "<tr>"
                body += "<td style=' border-top: none; align:center;' rowspan='6'><div><img class='tg-img-logo' src= '" + urlLogo + "' style='width: 30%; height: 30%; object-fit: contain;'></img></div></td>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>PASAL 21 BAGI PEGAWAI TETAP ATAU</td>"
                body += "<td style='align: right;'>"
                body += "<div style='width: 20px; height: 10px; background-color: black; float: left; margin-right:3px'></div>"
                body += "<div style='width: 20px; height: 10px; background-color: white; border: 1px solid black; float: left; margin-right:3px'></div>"
                body += "<div style='width: 20px; height: 10px; background-color: black; float: left; margin-right:3px'></div>"
                body += "<div style='width: 20px; height: 10px; background-color: white; border: 1px solid black; float: left;'></div>"
                body += "<div style='clear: both;'></div>"
                body += "</td>"
                body += "</tr>"
                
                body += "<tr>"
                // body += "<td></td>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>PENERIMA PENSIUN ATAU TUNJANGAN HARI</td>"
                body += "<td style='font-size:13px; font-weight: bold; align: right;'>FORMULIR 1721-A1</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>TUA/JAMINAN HARI TUA BERKALA</td>"
                body += "<td style='align: left; font-size:8px;'>Lembar ke-1 : untuk Penerima Penghasilan</td>" 
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none;'></td>"
                body += "<td style='align: left; font-size:8px;'>Lembar ke-2 : untuk Pemotong</td>" 
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none;'></td>"
                body += "<td style='align: left; font-size:9px;'></td>" 
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none; font-weight: bold;'></td>"
                body += "<td style='font-size:9px; font-weight: bold; align:right; margin-right:40px;'>MASA PEROLEHAN</td>" 
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // third tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0;\">";
                body += "<tbody>";
                
                body += "<tr>"
                body += "<td style='width:25%'></td>"
                // body += "<td style='width:50%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:4%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:2%'></td>"
                // body += "<td style='width:25%'></td>"
                body += "<td style='width:7%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:1%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size:10px; font-weight: bold; align:center; border-right: 1px solid black;'>KEMENTRIAN KEUANGAN RI</td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black; border-right: 1px solid black;'></td>"
                body += "<td style='font-size:9px; font-weight: bold; align:center' colspan='5'>PENGHASILAN [mm-mm]</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size:10px; font-weight: bold; align:center; border-right: 1px solid black;'>DIREKTORAT JENDRAL PAJAK</td>"
                // body += "<td style='border-right: 1px solid black;'>NOMOR : <span style='font-size:9px; color: gray;'>H.01</span> 1 . 1  - <u>12</u> . <u>23</u> - <u>000003</u> </td>"
                body += "<td style='font-size: 10px; font-weight:bold;'>NOMOR : </td>"
                body += "<td><span style='font-size:7px; color: gray;'>H.01</span></td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>1</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>.</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>1</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>-</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; border-bottom: 1px solid black;'>"+month+"</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; '>.</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; border-bottom: 1px solid black;'>"+tahun2Digit+"</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center;'>-</td>"
                body += "<td style='font-size: 10px; font-weight:bold; align:center; border-bottom: 1px solid black;'>"+noUrut+"</td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "<td style='align:center;'><span style='font-size:7px; color: gray;'>H.02</span></td>"
                body += "<td style='align:center;'>1</td>"
                body += "<td style='align:center;'>-</td>"
                body += "<td style='align:center;'>"+month+"</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // four table
                // third tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0; font-size:11px;\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:20%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:31%'></td>"
                body += "<td style='width:2%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size: 9px; border-left: 1px solid black; border-top: 1px solid black; '>NPWP</td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; '></td>"
                body += "<td style='  border-top: 1px solid black; border-right: 1px solid black; '></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size: 9px; border-left: 1px solid black'>PEMOTONG</td>"
                body += "<td style='vertical-align: top;'>:</td>"
                body += "<td style='align:center; vertical-align: top;'><span style='font-size:7px; color: gray;'>H.03</span></td>"
                body += "<td style='border-bottom: 1px solid black; align:center'>60.922.677.4</td>"
                body += "<td style='align:center '>-</td>"
                body += "<td style='align:center; border-bottom: 1px solid black;'>022</td>"
                body += "<td style='align:center'>-</td>"
                body += "<td style='align:center; border-bottom: 1px solid black;'>000</td>"
                body += "<td></td>"
                body += "<td style='border-right: 1px solid black'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black; font-size: 9px;'>NAMA</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='border-right:1px solid black'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='vertical-align: top; border-left: 1px solid black; font-size: 9px;'>PEMOTONG</td>"
                body += "<td style='vertical-align: top;'>:</td>"
                body += "<td style='align:center; vertical-align: top;'><span style='font-size:7px; color: gray;'>H.04</span></td>"

                body += "<td colspan='6' style='border-bottom: 1px solid black;'>"+legalName+"</td>"
                body += "<td style='border-right:1px solid black'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td colspan='10' style='border-bottom: 1px solid black; border-right: 1px solid black; border-left: 1px solid black;'></td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>A. IDENTITAS PENERIMA PENGHASILAN YANG DIPOTONG</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                // identitas karyawan
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0; font-size:8px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:4%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:2%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black; border-top: 1px solid black; '>1.</td>"
                body += "<td style='border-top: 1px solid black;'>NPWP</td>"
                body += "<td style='border-top: 1px solid black;'>:</td>"
                body += "<td style='color: gray; border-top: 1px solid black;'>A.01</td>"
                body += "<td style='border-top: 1px solid black;'></td>"
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