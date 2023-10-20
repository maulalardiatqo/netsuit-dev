
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
              type: "customrecord_msa_slip_gaji",
              id: recid,
              isDynamic: true,
            });
          var NamaKaryawan = gajiRec.getText('custrecord_abj_msa_employee_slip');
          var periodGaji = gajiRec.getValue('custrecord_abj_msa_period_gaji');
          var pph21Perusahaan = gajiRec.getValue('custrecord_abj_msa_pph21perusahaan');
          var pph21Karyawan = gajiRec.getValue('custrecord_abj_msa_pph21karyawan');
          var thp = gajiRec.getValue('custrecord_abj_msa_thp');
          var employeeId = gajiRec.getValue('custrecord_abj_msa_employee_slip');


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
              filelogo = file.load({
                  id: logo
              });
              urlLogo = filelogo.url.replace(/&/g, "&amp;");
          }

          var searchNonRem = search.create({
              type : 'customrecord_remunasi',
              filters : [{
                name: 'custrecord3',
                operator: 'is',
                values: employeeId
              }],
              columns : ['custrecord_abj_msa_status_karyawan', 'custrecord_bank_name', 'custrecord_employee_bank_name', 'custrecord_norek', 'custrecord_kacab', 'custrecord_status_wajib_pajak']
          });
          var searchNonRemSet = searchNonRem.run();
          searchNonRem = searchNonRemSet.getRange({
              start: 0,
              end: 1
          });
          if(searchNonRem.length > 0){
            var nonRemRow = searchNonRem[0];
            var statusKaryawan = nonRemRow.getText({
              name : 'custrecord_abj_msa_status_karyawan'
            });
            var namaBank = nonRemRow.getText({
              name : 'custrecord_bank_name'
            });
            var noRekening = nonRemRow.getValue({
              name : 'custrecord_norek'
            });
            var employeeBank = nonRemRow.getValue({
              name : 'custrecord_employee_bank_name'
            });
            var statusPajak = nonRemRow.getText({
              name : 'custrecord_status_wajib_pajak'
            });
          }
          if(employeeId){
            var recKayawan = record.load({
              type : 'employee',
              id : employeeId,
              isDynamic : true
            });
            var employeeIDEm = recKayawan.getValue('entityid');
            var employeeType = recKayawan.getText('employeetype');
            var hireDate = recKayawan.getValue('hiredate');
            log.debug('hireDate', hireDate);
            var currentDate = new Date();

            var timeDiff = currentDate - hireDate;
            var daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            var lamaKerja;
            if (daysDiff < 30) {
                lamaKerja = daysDiff + ' Hari'
                log.debug('Lama Kerja', daysDiff + ' Hari');
            } else if (daysDiff < 365) {i
                var months = Math.floor(daysDiff / 30);
                var remainingDays = daysDiff % 30;
                log.debug('Lama Kerja', months + ' Bulan ' + remainingDays + ' Hari');
                lamaKerja = months + ' Bulan ' + remainingDays + ' Hari'
            } else {
                var years = Math.floor(daysDiff / 365);
                var remainingMonths = Math.floor((daysDiff % 365) / 30);
                var remainingDays = (daysDiff % 365) % 30;
                log.debug('Lama Kerja', years + ' Tahun ' + remainingMonths + ' Bulan ' + remainingDays + ' Hari');
                lamaKerja = years + ' Tahun ' + remainingMonths + ' Bulan ' + remainingDays + ' Hari'
            }
            
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
            var Jobtitle = recKayawan.getValue('title')
          }
          var PendapatanCount = gajiRec.getLineCount({
            sublistId: 'recmachcustrecord_abj_msa_slip_slip_gaji'
          });
          if(PendapatanCount > 0){
            var sumJumlahPendapatan = 0;
            for (var i=0 ; i < PendapatanCount ; i++) {
              var jumlahPendapatan = gajiRec.getSublistValue({
                sublistId : 'recmachcustrecord_abj_msa_slip_slip_gaji',
                fieldId : 'custrecord_abj_msa_slip_pendapatan',
                line : i,
              });
              sumJumlahPendapatan += Number(jumlahPendapatan)
            }
          }
          var PotonganCount = gajiRec.getLineCount({
            sublistId: 'recmachcustrecord_abj_msa_slip_potongan'
          });
          if(PotonganCount > 0){
            var sumJumlahPotongan = 0;
            for(var j=0; j < PotonganCount ; j++){
              var jumlahPotongan = gajiRec.getSublistValue({
                sublistId : 'recmachcustrecord_abj_msa_slip_potongan',
                fieldId : 'custrecord_abj_msa_slip_slip_jumlah',
                line : j,
              });
              sumJumlahPotongan += Number(jumlahPotongan)
            }
          }
          if(sumJumlahPendapatan){
            sumJumlahPendapatan = format.format({
              value : sumJumlahPendapatan,
              type: format.Type.CURRENCY
            });
          }
          if(thp){
            thp = format.format({
              value : thp,
              type: format.Type.CURRENCY
            });
          }
          if(sumJumlahPotongan){
            sumJumlahPotongan = format.format({
              value : sumJumlahPotongan,
              type: format.Type.CURRENCY
            });
          }
          if(pph21Perusahaan){
            pph21Perusahaan = format.format({
              value : pph21Perusahaan,
              type: format.Type.CURRENCY
            });
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
          body += "<td style='font-size:12px'><b>Period : "+ periodGaji +"</b></td>"
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
          body += "<td style='width:13%'></td>"
          body += "<td style='width:20%'></td>"
          body += "<td style='width:1%'></td>"
          body += "<td style='width:25%'></td>"
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
          body += "<td>"+ employeeIDEm +"</td>"
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
          body += "<td>"+ statusKaryawan +"</td>"
          body += "</tr>";
          body += "<tr>"
          body += "<td>Tanggal Bergabung</td>"
          body += "<td>:</td>"
          body += "<td>"+ hireDate +"</td>"
          body += "<td></td>"
          body += "<td>Status PTKP</td>"
          body += "<td>:</td>"
          body += "<td>"+ statusPajak +"</td>"
          body += "</tr>";
          body += "<tr>"
          body += "<td>Lama Kerja</td>"
          body += "<td>:</td>"
          body += "<td>"+ lamaKerja +"</td>"
          body += "<td></td>"
          body += "</tr>";

          body += "<tr style='height:20px'>";
          body += "</tr>";
          body += "</tbody>";
          body += "</table>";

          body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
          body += "<thead>"
          body += "<tr>"
          body += "<td style='width:33%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-left: 1px; border-right:1px; font-size:10px'>Komponen Pendapatan</td>"
          body += "<td style='width:15%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-right:1px; text-align: left; padding-left: 5px;'>Jumlah</td>";
          body += "<td style='width:4%;'></td>"
          body += "<td style='width:33%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-left: 1px; border-right:1px; font-size:10px'>Komponen Potongan</td>"
          body += "<td style='width:15%; background-color: #D1CCCC; border-top: 1px; border-bottom: 1px; border-right:1px; text-align: right; padding-right: 5px;'>Jumlah</td>"
          body += "</tr>"
          body += "</thead>"
          body += "<tbody>"

          var pendapatanData = pendapatan(context, gajiRec);
          var potonganData = potongan(context, gajiRec);
          var maxRows = Math.max(pendapatanData.length, potonganData.length);
          for (var k = 0; k < maxRows; k++) {
            body += "<tr>";
            if (k < pendapatanData.length) {
                body += "<td style='border-left: 1px solid black; border-right: 1px solid black;'>" + pendapatanData[k].komponenPendapatan + "</td>";
                body += "<td style='text-align: left; padding-left: 15px; border-right: 1px solid black;'>Rp. " + pendapatanData[k].jumlahPendapatan + "</td>";
            } else {
                body += "<td style='border-left: 1px solid black; border-right: 1px solid black;'></style=>";
                body += "<td style='border-right: 1px solid black;'></td>";
            }
        
            body += "<td></td>"; 
            if (k < potonganData.length) {
                body += "<td style='border-left: 1px solid black; border-right: 1px solid black;'>" + potonganData[k].komponenPotongan + "</td>";
                body += "<td style='text-align: left; padding-left: 15px; border-right: 1px solid black;'>Rp. " + potonganData[k].jumlahPotongan + "</td>";
            } else {
              body += "<td style='border-left: 1px solid black; border-right: 1px solid black;'></td>";
              body += "<td style='border-right: 1px solid black;'></td>";
            }
        
            body += "</tr>";
          }

          body += "<tr>"
          body += "<td style='border: 1px solid black;'><b>Total Pendapatan </b></td>"
          body += "<td style='border : 1px solid black; text-align: left; padding-left: 15px;'><b>Rp. "+sumJumlahPendapatan+"</b></td>"
          body += "<td></td>"
          body += "<td style='border: 1px solid black;'><b> Total Potongan </b></td>"
          body += "<td style='border: 1px solid black; text-align: left; padding-left: 15px;'><b>Rp. "+sumJumlahPotongan+"</b></td>"
          body += "</tr>"

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
          body += "<td>"+namaBank+"</td>"
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
          body += "<td>"+noRekening+"</td>"
          body += "<td></td>"
          body += "<td style='font-size: 12px;'> <b>Take Home Pay</b></td>"
          body += "<td>:</td>"
          if(thp){
            body += "<td style='font-size: 12px;'><b> Rp. "+thp+"</b></td>"
          }else{
            body += "<td>-</td>"
          }
          
          body += "</tr>"

          body += "<tr>"
          body += "<td>Nama Pemilik Rekening</td>"
          body += "<td>:</td>"
          body += "<td>"+ employeeBank +"</td>"
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
      function pendapatan(context, gajiRec){
        var PendapatanCount = gajiRec.getLineCount({
          sublistId: 'recmachcustrecord_abj_msa_slip_slip_gaji'
        });
        if(PendapatanCount > 0){
          var pendapatanData = []
          for (var i=0 ; i < PendapatanCount ; i++) {
            var komponenPendapatan = gajiRec.getSublistValue({
              sublistId : 'recmachcustrecord_abj_msa_slip_slip_gaji',
              fieldId : 'custrecord_abj_msa_slip_rem_pendapatan',
              line : i,
            });
            var jumlahPendapatan = gajiRec.getSublistValue({
              sublistId : 'recmachcustrecord_abj_msa_slip_slip_gaji',
              fieldId : 'custrecord_abj_msa_slip_pendapatan',
              line : i,
            });
            if(jumlahPendapatan){
              jumlahPendapatan =  format.format({
                value : jumlahPendapatan,
                type: format.Type.CURRENCY
            });
            }
            pendapatanData.push({
              komponenPendapatan : komponenPendapatan,
              jumlahPendapatan : jumlahPendapatan
            })
          }
          return pendapatanData;
        }
      }
      function potongan(context, gajiRec){
        var PotonganCount = gajiRec.getLineCount({
          sublistId: 'recmachcustrecord_abj_msa_slip_potongan'
        });
        if(PotonganCount > 0){
          var potonganData = [];
          for(var j=0; j < PotonganCount ; j++){
            var komponenPotongan = gajiRec.getSublistValue({
              sublistId : 'recmachcustrecord_abj_msa_slip_potongan',
              fieldId : 'custrecord_abj_msa_slip_slip_potongan',
              line : j,
            })
            var jumlahPotongan = gajiRec.getSublistValue({
              sublistId : 'recmachcustrecord_abj_msa_slip_potongan',
              fieldId : 'custrecord_abj_msa_slip_slip_jumlah',
              line : j,
            });
            if(jumlahPotongan){
                jumlahPotongan =  format.format({
                  value : jumlahPotongan,
                  type: format.Type.CURRENCY
              });
            }
            potonganData.push({
              komponenPotongan : komponenPotongan,
              jumlahPotongan : jumlahPotongan
            })
            
          }
          return potonganData
        }
      }

  return {
      onRequest: onRequest,
  };
});
            
 