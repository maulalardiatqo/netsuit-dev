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

                var npwp1 = '00';
                var npwp2 = '000';
                var npwp3 = '000';
                var npwp4 = '0'
                var npwp5 = '000';
                var npwp6 = '000';
                var alamat1 = '';
                var alamat2 = '';

                var ptkpK;
                var ptkpTK;

                var searchRemu = search.create({
                    type : 'customrecord_remunasi',
                    filters : [["custrecord3","is",employeId]],
                    columns : ['custrecord_no_npwp', 'custrecord_abj_msa_noid', 'custrecord3', 'custrecord_abj_msa_alamat', 'custrecord_abj_msa_jenis_kelasmin', 'custrecord_status_wajib_pajak']
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
                    var ptkp = recRemu.getText({
                        name : 'custrecord_status_wajib_pajak'
                    });
                    log.debug('ptkp', ptkp);
                    var ptkpMatch = ptkp.match(/K\/(.+)|TK\/(.+)/);
                    log.debug('ptkpMatch', ptkpMatch)
                    var jumlahKarakter = alamat.length;
                    log.debug('jumlahKarakter', jumlahKarakter);
                    if (jumlahKarakter > 41) {
                        log.debug('masukifjumlah')
                        var indexPemisah = 41;
                        log.debug('indexPemisah', indexPemisah);
                        while (alamat.charAt(indexPemisah) !== ' ' && indexPemisah > 0) {
                            indexPemisah--;
                        }
                    
                        if (indexPemisah === 0) {
                            indexPemisah = 41;
                        }
                    
                        var bagianPertama = alamat.substring(0, indexPemisah);
                        var bagianKedua = alamat.substring(indexPemisah + 1);
                        alamat1 = bagianPertama;
                        alamat2 = bagianKedua;
                        log.debug('bagian1', bagianPertama);
                        log.debug('bagian2', bagianKedua);
                    }
                    if (ptkpMatch) {
                        ptkpK = ptkpMatch[1] || '';
                        ptkpTK = ptkpMatch[2] || '';
                    }
                    if(noNpWp){
                        log.debug('noNpwp', noNpWp);
                        npwp1 = noNpWp.substring(0, 2);
                        npwp2 = noNpWp.substring(2, 5);
                        npwp3 = noNpWp.substring(5, 8);
                        npwp4 = noNpWp.substring(8, 9);
                        npwp5 = noNpWp.substring(9, 12);
                        npwp6 = noNpWp.substring(12, 15);
                    }
                }
                log.debug('ptkpK', ptkpK);
                log.debug('ptkpTk', ptkpTK)
                var Gabung1 = npwp1 + "." + npwp2 + "." + npwp3 + "." + npwp4;
                log.debug('gabung1', Gabung1);
                var jobEmp = '';
                var searchEmp = search.create({
                    type: search.Type.EMPLOYEE,
                    filters : [{
                        name: 'internalid',
                        operator: 'anyof',
                        values: employeId
                    }],
                    columns : ['title']
                });
                var searchEmpSet = searchEmp.run();
                var searchEmpResult = searchEmpSet.getRange({
                    start: 0,
                    end: 1,
                });
                if(searchEmpResult.length > 0){
                    var empRec = searchEmpResult[0]
                    var jobTitle = empRec.getValue({
                        name : 'title'
                    });
                    if(jobTitle){
                        jobEmp = jobTitle
                    }
                }

                var customrecord_msa_remunerasiSearchObj = search.create({
                    type: "customrecord_msa_remunerasi",
                    filters:
                    [
                        ["custrecord_remunerasi_employee","anyof",employeId]
                    ],
                    columns:
                    [
                    search.createColumn({
                        name: "id",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({name: "custrecord_remunerasi_employee", label: "Employee"}),
                    search.createColumn({
                        name: "custrecord_id_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                        label: "Komponen Pendapatan"
                    }),
                    search.createColumn({
                        name: "custrecord_jumlah_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                        label: "Jumlah"
                    }),
                    search.createColumn({
                        name: "custrecord_msa_id_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                        label: "Komponen Potongan"
                    }),
                    search.createColumn({
                        name: "custrecord_msa_jumlah_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                        label: "Jumlah"
                    })
                    ]
                });
                var searchResultCount = customrecord_msa_remunerasiSearchObj.runPaged().count;
                log.debug("customrecord_msa_remunerasiSearchObj result count",searchResultCount);
                var pendapatan = [];
                var potongan = [];
                customrecord_msa_remunerasiSearchObj.run().each(function(result){
                    var komponenPendapatan = result.getValue({
                        name: "custrecord_id_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                    });
                    var jumlahPendapatan = result.getValue({
                        name: "custrecord_jumlah_pendapatan",
                        join: "CUSTRECORD_REMUNERASI",
                    });
                    var komponenPotongan = result.getValue({
                        name: "custrecord_msa_id_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    });
                    var jumlahPotongan = result.getValue({
                        name: "custrecord_msa_jumlah_potongan",
                        join: "CUSTRECORD_MSA_POTONGAN_REMUNERASI",
                    })
                    pendapatan.push([{
                        komponenPendapatan : komponenPendapatan,
                        jumlahPendapatan : jumlahPendapatan
                    }])
                    potongan.push([{
                        komponenPotongan : komponenPotongan,
                        jumlahPotongan : jumlahPotongan
                    }])
                    return true;
                });
                log.debug('pendapatan', pendapatan);
                log.debug('potongan', potongan);
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
                // body += "<div style='clear: both;'></div>"
                body += "</td>"
                body += "</tr>"
                
                body += "<tr>"
                // body += "<td></td>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>PENERIMA PENSIUN ATAU TUNJANGAN HARI</td>"
                body += "<td style='font-size:13px; font-weight: bold; align: right;' rowspan='2'>FORMULIR 1721-A1</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size: 10px; font-weight: bold; border: 1px solid black; border-bottom: none; border-top: none; align: center;'>TUA/JAMINAN HARI TUA BERKALA</td>"
                body += "<td></td>" 
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none;'></td>"
                body += "<td style='align: left; font-size:8px;'>Lembar ke-1 : untuk Penerima Penghasilan</td>" 
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none; border-top: none;'></td>"
                body += "<td style='align: left; font-size:8px;'>Lembar ke-2 : untuk Pemotong</td>"
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

                // identitas karyawan 21td
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
                body += "<td style='color: gray; border-top: 1px solid black; font-size: 7px;'>A.01</td>"
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black; align:center; font-size: 11px;'>"+Gabung1+"</td>"
                body += "<td style='border-top: 1px solid black;'>-</td>"
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black; align:center; font-size: 11px;'>"+npwp5+"</td>"
                body += "<td style='border-top: 1px solid black;'>.</td>"
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black; align:center; font-size: 11px;'>"+npwp6+"</td>"
                body += "<td style='border-top: 1px solid black;'></td>"
                body += "<td style='border-top: 1px solid black;'>6.</td>"
                body += "<td style='border-top: 1px solid black;' colspan='9'>'STATUS /JUMLAH TANGGUNGAN KELUARGA UNTUK PTKP</td>"
                body += "<td style='border-top: 1px solid black; border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>2.</td>"
                body += "<td>NIK/NO.</td>"
                body += "<td colspan='9'></td>"
                body += "<td style='font-size : 8px;'>K/</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='font-size : 8px;'>TK/</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='font-size : 8px;'>HB/</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'></td>"
                body += "<td>PASPOR</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.02</td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+nik+"</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td></td>"
                if(ptkpK){
                    body += "<td style='border-bottom:1px solid black; align: center; font-size: 11px;'>"+ptkpK+"</td>"
                }else{
                    body += "<td style='border-bottom:1px solid black;'></td>"
                }
                body += "<td style='color: gray; font-size: 7px;'>A.07</td>"
                body += "<td></td>"
                if(ptkpTK){
                    body += "<td style='border-bottom:1px solid black; align: center; font-size: 11px;'>"+ptkpTK+"</td>"
                }else{
                    body += "<td style='border-bottom:1px solid black;'></td>"
                }
                body += "<td style='color: gray; font-size: 7px;'>A.08</td>"
                body += "<td></td>"
                body += "<td style='border-bottom:1px solid black;'></td>"
                body += "<td style='color: gray; font-size: 7px;'>A.09</td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>3.</td>"
                body += "<td>NAMA</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.03</td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+empName+"</td>"
                body += "<td></td>"
                body += "<td>7.</td>"
                body += "<td colspan='3'>NAMA JABATAN :</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.10</td>"
                body += "<td style='border-bottom: 1px solid black; font-size: 11px; align: center;' colspan='5'>"+jobEmp+"</td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>4.</td>"
                body += "<td>ALAMAT</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.04</td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+alamat1+"</td>"
                body += "<td></td>"
                body += "<td>8.</td>"
                body += "<td colspan='4'>KARYAWAN ASING :</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.11</td>"
                body += "<td><div style='width: 20px; height: 20px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td>YA</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td colspan='4' style='border-left: 1px solid black;'></td>"
                body += "<td colspan='5' style='border-bottom: 1px solid black; font-size: 11px;'>"+alamat2+"</td>"
                body += "<td></td>"
                body += "<td>9.</td>"
                body += "<td colspan='4'>KODE NEGARA DOMISILI :</td>"
                body += "<td style='color: gray; font-size: 7px;'>A.12</td>"
                body += "<td style='border-bottom: 1px solid black;'></td>"
                body += "<td colspan='3'></td>"
                body += "<td style='border-right: 1px solid black;'></td>"
                body += "</tr>"
                
                body += "<tr>"
                body += "<td style='border-left: 1px solid black;'>4.</td>"
                body += "<td colspan='2'>JENIS KELAMIN</td>"
                log.debug('jenisKelasmin', jenisKelamin);
                body += "<td>: <span style='color: gray; font-size: 7px;'>A.05</span></td>"
                if(jenisKelamin == '1'){
                    body += "<td style='font-size: 11px;'><span style='margin-right:5px;'>X</span>LAKI-LAKI</td>"
                    body += "<td style='color: gray; font-size: 7px;'>A.06</td>"
                    body += "<td style='font-size: 11px;' colspan='3'>PEREMPUAN</td>"
                }else{
                    body += "<td style='font-size: 11px;'>LAKI-LAKI</td>"
                    body += "<td style='color: gray; font-size: 7px;'>A.06</td>"
                    body += "<td style='font-size: 11px;' colspan='3'><span style='margin-right:5px;'>X</span>PEREMPUAN</td>"
                }
                body += "<td style='border-right: 1px solid black;' colspan='12'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black' colspan='21'></td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>B. RINCIAN  PENGHASILAN DAN PENGHITUNGAN PPh PASAL 21</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                 // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0; font-size:9px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:8%'></td>"
                body += "<td style='width:28%'></td>"
                body += "<td style='width:28%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border: 1px solid black; border-bottom: none;' colspan='9'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-size:9px; font-weight:bold; border-left:1px solid black; align:center; ' colspan='8'>URAIAN</td>"
                body += "<td style='font-size:9px; font-weight:bold; border-right:1px solid black; align:center; border-left:1px solid black;' >JUMLAH (Rp)</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black; border-top:1px solid black;' colspan='2'>KODE OBJEK PAJAK</td>"
                body += "<td style='border-top:1px solid black;'>:</td>"
                body += "<td style='border-top:1px solid black;'><div style='width: 20px; height: 20px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td style='border-top:1px solid black;'>21-100-01</td>"
                body += "<td style='border-top:1px solid black;'><div style='width: 20px; height: 20px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td style='border-top:1px solid black;'>21-100-02</td>"
                body += "<td style='border-top:1px solid black;'></td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black;' colspan='8'>PENGHASILAN BRUTO :</td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>1.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> GAJI/PENSIUN ATAU THT/JHT</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>2.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> TUNJANGAN PPh</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>3.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> TUNJANGAN LAINNYA, UANG LEMBUR DAN SEBAGAINYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>4.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>  HONORARIUM DAN IMBALAN LAIN SEJENISNYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>5.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>  PREMI ASURANSI YANG DIBAYAR PEMBERI KERJA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>6.</td>"
                body += "<td style='border-top :1px solid black; font-size:7px;' colspan='7'> PENERIMAAN DALAM BENTUK NATURA DAN KENIKMATAN LAINNYA YANG DIKENAKAN PEMOTONGAN PPh PASAL 21</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>7.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>  TANTIEM, BONUS, GRATIFIKASI, JASA PRODUKSI DAN THR</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>8.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> JUMLAH PENGHASILAN BRUTO (1 S.D.7)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black;' colspan='8'>PENGURANGAN :</td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>9.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>BIAYA JABATAN/ BIAYA PENSIUN</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>10.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> IURAN PENSIUN ATAU IURAN THT/JHT</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>11.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> JUMLAH PENGURANGAN (9 S.D 10)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black;' colspan='8'>PENGHITUNGAN PPh PASAL 21 :</td>"
                body += "<td style='border-top:1px solid black; border-left:1px solid black; border-right:1px solid black; background-color: #babcbf;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>12.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>JUMLAH PENGHASILAN NETO (8-11)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>13.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>PENGHASILAN NETO MASA SEBELUMNYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>14.</td>"
                body += "<td style='border-top :1px solid black; font-size:7px' colspan='7'> JUMLAH PENGHASILAN NETO UNTUK PENGHITUNGAN PPh PASAL 21 (SETAHUN/DISETAHUNKAN)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>15.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>PENGHASILAN TIDAK KENA PAJAK (PTKP)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>16.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> PENGHASILAN KENA PAJAK SETAHUN/DISETAHUNKAN (14 - 15)</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>17.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> PPh PASAL 21 ATAS PENGHASILAN KENA PAJAK SETAHUN/DISETAHUNKAN</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>18.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'> PPh PASAL 21 YANG TELAH DIPOTONG MASA SEBELUMNYA</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;'>19.</td>"
                body += "<td style='border-top :1px solid black;' colspan='7'>PPh PASAL 21 TERUTANG</td>"
                body += "<td style='border:1px solid black; border-bottom:none; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black;'>20.</td>"
                body += "<td style='border-top :1px solid black; border-bottom: 1px solid black;' colspan='7'>PPh PASAL 21 DAN PPh PASAL 26 YANG TELAH DIPOTONG DAN DILUNASI</td>"
                body += "<td style='border:1px solid black; align:right; font-size:11px;'>0</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // five tables
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td>C. IDENTITAS PEMOTONG</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; margin: 0 10px 0 8px; padding: 0; font-size:10px; font-weight:bold;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:7%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:18%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:9%'></td>"
                body += "<td style='width:2%'></td>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:2%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-bottom:none;' colspan='19'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black;'>1.</td>"
                body += "<td>NPWP</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>C.01</td>"
                body += "<td style='border-bottom:1px solid black;'></td>"
                body += "<td>-</td>"
                body += "<td style='border-bottom:1px solid black;'></td>"
                body += "<td>.</td>"
                body += "<td style='border-bottom:1px solid black;'></td>"
                body += "<td></td>"
                body += "<td>3.</td>"
                body += "<td colspan='5'>TANGGAL & TANDA TANGAN</td>"
                body += "<td></td>"
                body += "<td rowspan='3'><div style='width: 110px; height: 60px; background-color: white; border: 1px solid black; float: left;'></div></td>"
                body += "<td style='border-right:1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border-left:1px solid black;'>2.</td>"
                body += "<td>NAMA</td>"
                body += "<td>:</td>"
                body += "<td style='color: gray; font-size: 7px;'>C.02</td>"
                body += "<td style='border-bottom:1px solid black;' colspan='5'></td>"
                body += "<td style='color: gray; font-size: 7px;'>C.03</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px;' colspan='2'>12</td>"
                body += "<td>-</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px;'>10</td>"
                body += "<td>-</td>"
                body += "<td style='border-bottom:1px solid black; font-size:11px;'>"+tahun+"</td>"
                body += "<td></td>"
                body += "<td style='border-right:1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td colspan='11' style='border-left:1px solid black;'></td>"
                body += "<td colspan='3'>[dd-mm-yyyy]</td>"
                body += "<td colspan='3'></td>"
                body += "<td style='border-right:1px solid black;'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='border:1px solid black; border-top:none;' colspan='19'></td>"
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