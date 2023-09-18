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
            var periodGaji = gajiRec.getValue('custrecord_period_gaji');
            var GajiPokok = gajiRec.getValue('custrecord_gaji_gaji_pokok');
            var pph21Perusahaan = gajiRec.getValue('custrecord_pph21');
            if(pph21Perusahaan){
              pph21Perusahaan = format.format({
                value: pph21Perusahaan,
                type: format.Type.CURRENCY
                });
            }

            // pendapatan
            if(GajiPokok){
              GajiPokok = format.format({
                value: GajiPokok,
                type: format.Type.CURRENCY
                });
            }
            var mealAllowance = gajiRec.getValue('custrecord_meal_allowance_gaji');
            if(mealAllowance){
              mealAllowance = format.format({
                value: mealAllowance,
                type: format.Type.CURRENCY
                });
            }

            var transportAllowance = gajiRec.getValue('custrecord_transport_allowance_gaji');
            if(transportAllowance){
              transportAllowance = format.format({
                value: transportAllowance,
                type: format.Type.CURRENCY
                });
            }

            var uangLembur = gajiRec.getValue('custrecord_uang_lembur');
            if(uangLembur){
              uangLembur = format.format({
                value: uangLembur,
                type: format.Type.CURRENCY
                });
            }

            var JKS = gajiRec.getValue('custrecord_jks');
            if(JKS){
              JKS = format.format({
                value: JKS,
                type: format.Type.CURRENCY
                });
            }

            var jkk = gajiRec.getValue('custrecord_jkk');
            if(jkk){
              jkk = format.format({
                value: jkk,
                type: format.Type.CURRENCY
                });
            }
            
            var jkm = gajiRec.getValue('custrecord_jkm');
            if(jkm){
              jkm = format.format({
                value: jkm,
                type: format.Type.CURRENCY
                });
            }

            var jht = gajiRec.getValue('custrecord_jht');
            if(jht){
              jht = format.format({
                value: jht,
                type: format.Type.CURRENCY
                });
            }
            var jp = gajiRec.getValue('custrecord_jp');
            if(jp){
              jp = format.format({
                value: jp,
                type: format.Type.CURRENCY
                });
            }

            var tunjanganPPH = gajiRec.getValue('custrecord_tunjangan_pph');
            if(tunjanganPPH){
              tunjanganPPH = format.format({
                value: tunjanganPPH,
                type: format.Type.CURRENCY
                });
            }

            var totalIncome = gajiRec.getValue('custrecord_total_income_gaji');
            if(totalIncome){
              totalIncome = format.format({
                value: totalIncome,
                type: format.Type.CURRENCY
                });
            }

            // potongan

            var pph21Karyawan = gajiRec.getValue('custrecord8') || 0;
            var pph21KaryawantoConunt = pph21Karyawan
            if(pph21Karyawan){
              pph21Karyawan = format.format({
                value: pph21Karyawan,
                type: format.Type.CURRENCY
                });
            }
            var premiJKS = gajiRec.getValue('custrecord_premi_jks')|| 0;
            var premiJKStoCount = premiJKS
            if(premiJKS){
              premiJKS = format.format({
                value: premiJKS,
                type: format.Type.CURRENCY
                });
            }

            var premiJKM = gajiRec.getValue('custrecord_premi_jkm')|| 0;
            var premiJKMtoCount = premiJKM
            if(premiJKM){
              premiJKM = format.format({
                value: premiJKM,
                type: format.Type.CURRENCY
                });
            }

            var premiJKK = gajiRec.getValue('custrecord_premi_jkk')|| 0;
            var premiJKKtoCount = premiJKK
            if(premiJKK){
              premiJKK = format.format({
                value: premiJKK,
                type: format.Type.CURRENCY
                });
            }
            var premiJHT = gajiRec.getValue('custrecord_premi_jht')|| 0;
            var premiJHTtoCount = premiJHT
            if(premiJHT){
              premiJHT = format.format({
                value: premiJHT,
                type: format.Type.CURRENCY
                });
            }

            var premiJP = gajiRec.getValue(' custrecord_premi_jp')|| 0;
            var premiJPtoCount = premiJP
            if(premiJP){
              premiJP = format.format({
                value: premiJP,
                type: format.Type.CURRENCY
                });
            }

            var potongan = gajiRec.getValue('custrecord_potongan')|| 0;
            var potongantoCount = potongan
            if(potongan){
              potongan = format.format({
                value: potongan,
                type: format.Type.CURRENCY
                });
            }
            

            var totalPotongan = Number(pph21KaryawantoConunt) + Number(premiJKKtoCount) + Number(premiJHTtoCount) + Number(premiJKMtoCount) + Number(premiJKStoCount) + Number(premiJPtoCount) + Number(potongantoCount)
            log.debug('totalPotongan', totalPotongan);
            if(totalPotongan){
              totalPotongan = format.format({
                value: totalPotongan,
                type: format.Type.CURRENCY
                });
            }
            var thp = gajiRec.getValue('custrecord_take_home_pay')|| 0;
            if(thp){
              thp = format.format({
                value: thp,
                type: format.Type.CURRENCY
                });
            }
              var subsidiariRec = record.load({
                type: "subsidiary",
                id: 1,
                isDynamic: true,
              });
              var legalName = subsidiariRec.getValue('legalname');

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
              
            var idKaryawan = gajiRec.getValue('custrecord_employee_gaji');
            // rec karyawan
              if(idKaryawan){
                var recKayawan = record.load({
                  type : 'employee',
                  id : idKaryawan,
                  isDynamic : true
                });
                var employeeID = recKayawan.getValue('entityid');
                var statusEmployee = recKayawan.getText('employeestatus');
                var employeeType = recKayawan.getText('employeetype');
                var hireDate = recKayawan.getValue('hiredate');
                
                if(hireDate){
                  function sysDate() {
                    var date = hireDate;
                    var tdate = date.getUTCDate();
                    var month = date.getUTCMonth() + 1; // jan = 0
                    var year = date.getUTCFullYear();
                    return tdate + '/' + month + '/' + year;
                    }
                    hireDate = sysDate();
                }
                log.debug('hireDate', hireDate);
                var typePTKP = recKayawan.getText('custentity_tipe_ptkp');
                var Jobtitle = recKayawan.getValue('title')
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
            body += "<td style='width:20%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:20%'></td>"
            body += "<td style='width:18%'></td>"
            body += "<td style='width:20%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:20%'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>";
            body += "<tr>"
            body += "<td>Nama</td>"
            body += "<td>:</td>"
            body += "<td>"+ NamaKaryawan +"</td>"
            body += "<td></td>"
            body += "<td>Tipe Karyawan</td>"
            body += "<td>:</td>"
            body += "<td>" + employeeType +"</td>"
            body += "</tr>";
            body += "<tr>"
            body += "<td>Id Karyawan</td>"
            body += "<td>:</td>"
            body += "<td>"+ employeeID +"</td>"
            body += "<td></td>"
            body += "<td>Bagian</td>"
            body += "<td>:</td>"
            body += "<td>Staff</td>"
            body += "</tr>";
            body += "<tr>"
            body += "<td>Jobtitle</td>"
            body += "<td>:</td>"
            body += "<td>"+ Jobtitle +"</td>"
            body += "<td></td>"
            body += "<td>Status Karyawan</td>"
            body += "<td>:</td>"
            body += "<td>"+ statusEmployee +"</td>"
            body += "</tr>";
            body += "<tr>"
            body += "<td>Tanggal Bergabung</td>"
            body += "<td>:</td>"
            body += "<td>"+ hireDate +"</td>"
            body += "<td></td>"
            body += "<td>Status PTKP</td>"
            body += "<td>:</td>"
            body += "<td>"+ typePTKP +"</td>"
            body += "</tr>";
            body += "<tr style='height:20px'>";
            body += "</tr>";
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<thead>"
            body += "<tr>"
            body += "<td style='width:30%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-left: 1px; border-right:1px'>Komponen Pendapatan</td>"
            body += "<td style='width:18%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-right:1px'>Jumlah</td>"
            body += "<td style='width:4%;'></td>"
            body += "<td style='width:30%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-left: 1px; border-right:1px'>Komponen Potongan</td>"
            body += "<td style='width:18%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-right:1px'>Jumlah</td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr>"
            body += "<td>Gaji Pokok</td>"
            body += "<td> Rp."+ GajiPokok +"</td>"
            body += "<td></td>"
            body += "<td>PPh 21 Ditanggung Karyawan</td>"
            if(pph21Karyawan){
              body += "<td>Rp. "+pph21Karyawan+"</td>"
            }else{
              body += "<td>-</td>"
            }
            
            body += "<td></td>"
            body += "</tr>";

            body += "<tr>"
            body += "<td>Meal Allowance</td>"
            if(mealAllowance){
              body += "<td>Rp. "+ mealAllowance+ "</td>" 
            }else{
              body += "<td>-</td>"
            }
            body += "<td></td>"
            body += "<td>Premi JKS</td>"
            if(premiJKS){
              body += "<td>Rp. "+premiJKS+"</td>" 
            }else{
              body += "<td>-</td>"
            }
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>";

            body += "<tr>"
            body += "<td>Transport Allowance</td>"
            if(transportAllowance){
              body += "<td>Rp. "+ transportAllowance + "</td>" 
            }else{
              body += "<td>-</td>"
            }
              body += "<td></td>"
              body += "<td>Premi JKM</td>"
            if(premiJKM){
               body += "<td>Rp. "+premiJKM+"</td>"
            }else{
              body += "<td>-</td>"
            }
            body += "</tr>";

            body += "<tr>"
            body += "<td>Uang Lembur</td>"
            if(uangLembur){
              body += "<td>Rp. "+ uangLembur + "</td>" 
            }else{
              body += "<td>-</td>"
            }
            body += "<td></td>"
            body += "<td>Premi JKK</td>"
            if(premiJKK){
              body += "<td> Rp. "+premiJKK+"</td>"
            }else{
              body += "<td>-</td>"
            }
            body += "</tr>";

            body += "<tr>"
            body += "<td>Jaminan Kesehatan</td>"
            if(JKS){
              body += "<td>Rp. "+ JKS + "</td>" 
            }else{
              body += "<td>-</td>"
            }
            body += "<td></td>"
            body += "<td>Premi JHT</td>"
            if(premiJHT){
              body += "<td>Rp. "+premiJHT+"</td>"
            }else{
              body += "<td>-</td>"
            }
            body += "</tr>";

            body += "<tr>"
            body += "<td>Jaminan Kecelakaan Kerja</td>"
            if(jkk){
              body += "<td>Rp. "+ jkk + "</td>" 
            }else{
              body += "<td>-</td>"
            }
            body += "<td></td>"
            body += "<td>Premi Jaminan Pensiun</td>"
            if(premiJP){
              body += "<td>Rp. "+premiJP+"</td>"
            }else{
              body += "<td>-</td>"
            }
            body += "</tr>";

            body += "<tr>"
            if(jkm){
              body += "<td>Jaminan Kematian</td>"
              body += "<td>Rp. "+ jkm + "</td>" 
            }
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>";

            body += "<tr>"
            if(jht){
              body += "<td>Jaminan Hari Tua</td>"
              body += "<td>Rp. "+ jht + "</td>" 
            }
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>";

            body += "<tr>"
            if(jp){
              body += "<td>Jaminan Pensiun</td>"
              body += "<td>Rp. "+ jp + "</td>" 
            }
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>";

            body += "<tr>"
            if(tunjanganPPH){
              body += "<td>Tunjuangan PPh 21</td>"
              body += "<td>Rp. "+ tunjanganPPH + "</td>" 
            }
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "</tr>";

            body += "<tr style='height:10px'></tr>"

            body += "<tr>"
            if(totalIncome){
              body += "<td style='border-top: 1px; border-bottom: 1px; border-left: 1px; border-right:1px'>Total Income</td>"
              body += "<td style='border-top: 1px; border-bottom: 1px; border-right:1px'><b>Rp. "+ totalIncome + "</b></td>" 
            }
            body += "<td></td>"
            body += "<td style='border-top: 1px; border-bottom: 1px; border-left: 1px; border-right:1px'>Total Potongan</td>"
            if(totalPotongan){
              
              body += "<td style='border-top: 1px; border-bottom: 1px; border-right:1px'><b>Rp. "+ totalPotongan + "</b></td>" 
            }
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
            body += "<td style='width:25%;'></td>"
            body += "<td style='width:1%;'></td>"
            body += "<td style='width:22%;'></td>"
            body += "<td style='width:4%;'></td>"
            body += "<td style='width:25%;'></td>"
            body += "<td style='width:1%;'></td>"
            body += "<td style='width:22%;'></td>"
            body += "</tr>"
            body += "</thead>"
            body += "<tbody>"
            body += "<tr>"
            body += "<td>Nama Bank</td>"
            body += "<td>:</td>"
            body += "<td>BRI</td>"
            body += "<td></td>"
            body += "<td>PPh21 Ditanggung Perusahaan</td>"
            body += "<td>:</td>"
            if(pph21Perusahaan){
              body += "<td> Rp. "+pph21Perusahaan+"</td>"
            }else{
              body += "<td>-</td>"
            }
            
            body += "</tr>"

            body += "<tr>"
            body += "<td>Nomor Rekening</td>"
            body += "<td>:</td>"
            body += "<td></td>"
            body += "<td></td>"
            body += "<td>Take Home Pay</td>"
            body += "<td>:</td>"
            if(thp){
              body += "<td><b> Rp. "+thp+"</b></td>"
            }else{
              body += "<td>-</td>"
            }
            
            body += "</tr>"

            body += "</tbody>";
            body += "</table>";
            
            footer += "<table class='tg' style='table-layout: fixed;'>";
            footer += "<tbody>";
            footer += "<tr class='tg-foot'>";
            footer += "<td style='align:left'>"+ legalName +"</td>"
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
            xml += "<body font-size='8' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' footer='nlfooter' footer-height='3%'>";
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