/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget","N/search","N/record","N/ui/message","N/url","N/redirect","N/xml","N/file","N/encode",], function(serverWidget,search,record,message,url,redirect, xml,file, encode){
    function onRequest(context){
        try{
            var allId = JSON.parse(context.request.parameters.allIdIr);
            log.debug('allid', allId);
            var customrecord_remunasiSearchObj = search.create({
                type: "customrecord_remunasi",
                filters:
                [
                    ["custrecord_no_bpjs_ket","isnotempty",""], 
                    "AND",
                    ["custrecord3","anyof",allId]
                ],
                columns:
                [
                    search.createColumn({
                        name: "id",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({name: "internalid"}),
                    search.createColumn({name: "custrecord3", label: "Emplyee"}),
                    search.createColumn({name: "custrecord_abj_msa_status_karyawan", label: "Status Karyawan"}),
                    search.createColumn({name: "custrecord_abj_msa_noid", label: "NIK / No.id Personalia"}),
                    search.createColumn({name: "custrecord_abj_msa_alamat", label: "Alamat"}),
                    search.createColumn({name: "custrecord_abj_msa_jenis_kelasmin", label: "Jenis Kelamin"}),
                    search.createColumn({name: "custrecord_bank_name", label: "Nama Bank"}),
                    search.createColumn({name: "custrecord_employee_bank_name", label: "Nama Pemegang Rekening"}),
                    search.createColumn({name: "custrecord_norek", label: "No. Rekening"}),
                    search.createColumn({name: "custrecord_kacab", label: "Kantor Cabang"}),
                    search.createColumn({name: "custrecord_no_npwp", label: "No. NPWP"}),
                    search.createColumn({name: "custrecord_status_wajib_pajak", label: "Status Wajib Pajak"}),
                    search.createColumn({name: "custrecord_no_bpjs_ket", label: "No. KPJ BPJS Ketenaga Kerjaan"}),
                    search.createColumn({name: "custrecord_no_bpjs_kes", label: "No. JKN KIS BPJS Kesehatan"}),
                    search.createColumn({name: "custrecord_abj_msa_tgl_efektif", label: "Tanggal Efektif"}),
                    search.createColumn({name: "custrecord_abj_msa_tgl_akhir", label: "Tanggal Masa Akhir Kerja"}),
                    search.createColumn({name: "custrecord_abj_msa_period_akhir", label: "Pilih Period Masa Akhir"}),
                    search.createColumn({name: "custrecord_identitas_diri"}),
                    search.createColumn({name: "custrecord_no_npwp"})
                ]
            });
            var searchResultCount = customrecord_remunasiSearchObj.runPaged().count;
            log.debug("customrecord_remunasiSearchObj result count",searchResultCount);
            var allData = [];
            var allIdEmp = [];
            customrecord_remunasiSearchObj.run().each(function(result){
                var idKarir = result.getValue({
                    name : "internalid"
                })
                var empId = result.getValue({
                    name : "custrecord3"
                });
                
                var statusKaryawan = result.getValue({
                    name :"custrecord_abj_msa_status_karyawan"
                });
                var noIdPersonalia = result.getValue({
                    name : "custrecord_abj_msa_noid"
                });
                var alamat = result.getValue({
                    name : "custrecord_abj_msa_alamat"
                });
                var jenisKel = result.getValue({
                    name : "custrecord_abj_msa_jenis_kelasmin"
                });
                var bankName = result.getText({
                    name : "custrecord_bank_name"
                });
                var empBank = result.getValue({
                    name : "custrecord_employee_bank_name"
                });
                var norek = result.getValue({
                    name : "custrecord_norek"
                });
                var kancab = result.getValue({
                    name : "custrecord_kacab"
                });
                var tglEfektif = result.getValue({
                    name : "custrecord_abj_msa_tgl_efektif"
                });
                var noBpjsket = result.getValue({
                    name : "custrecord_no_bpjs_ket"
                });
                var jenisIdentitas = result.getValue({
                    name : "custrecord_identitas_diri"
                })
                var noNPWP = result.getValue({
                    name : "custrecord_no_npwp"
                })
                allData.push({
                    empId : empId,
                    statusKaryawan : statusKaryawan,
                    noIdPersonalia : noIdPersonalia,
                    alamat : alamat,
                    jenisKel : jenisKel,
                    bankName : bankName,
                    empBank : empBank,
                    norek : norek,
                    kancab : kancab,
                    noBpjsket : noBpjsket,
                    jenisIdentitas : jenisIdentitas,
                    noNPWP : noNPWP
                });
                allIdEmp.push(idKarir)
                return true;
            });

            log.debug('alldata', allData)
            var xmlStr =
                    '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                xmlStr +=
                    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

                // Styles
                xmlStr += "<Styles>";
                xmlStr += "<Style ss:ID='BC'>";
                xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                xmlStr += "<Borders>";
                xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr += "</Borders>";
                xmlStr +=
                    "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='HD'>";
                xmlStr += "<Alignment ss:Horizontal='Left' ss:Vertical='Center' />";
                xmlStr += "<Font ss:Bold='0' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='HDbg'>";
                xmlStr += "<Alignment ss:Horizontal='Left' ss:Vertical='Center' />";
                xmlStr += "<Font ss:Bold='0' ss:Color='#000000' ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "<Interior ss:Color='#63E9E2' ss:Pattern='Solid' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='HDbold'>";
                xmlStr += "<Alignment ss:Horizontal='Left' ss:Vertical='Center' />";
                xmlStr += "<Font ss:Bold='1' ss:Color='#000000' ss:FontName='Calibri' ss:Size='14' />";
                xmlStr += "<Interior ss:Color='#639DE9' ss:Pattern='Solid' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='Subtotal'>";
                xmlStr += "<Alignment />";
                xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "<Interior ss:Color='#FDFDFB' ss:Pattern='Solid' />";
                xmlStr += "<NumberFormat ss:Format='Standard' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='ColAB'>";
                xmlStr += "<Alignment />";
                xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "<Interior ss:Color='#f79925' ss:Pattern='Solid' />";
                xmlStr += "<NumberFormat ss:Format='Standard' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='BNC'>";
                xmlStr += "<Alignment />";
                xmlStr += "<Borders>";
                xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr += "</Borders>";
                xmlStr +=
                    "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='BNCN'>";
                xmlStr += "<NumberFormat ss:Format='Standard' />";
                xmlStr += "<Alignment />";
                xmlStr += "<Borders>";
                xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr += "</Borders>";
                xmlStr +=
                    "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='NB'>";
                xmlStr += "<Alignment />";
                xmlStr += "<Borders>";
                xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr += "</Borders>";
                xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "</Style>";
                xmlStr += "<Style ss:ID='NBN'>";
                xmlStr += "<NumberFormat ss:Format='Standard' />";
                xmlStr += "<Alignment />";
                xmlStr += "<Borders>";
                xmlStr +=
                    "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr +=
                    "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                xmlStr += "</Borders>";
                xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                xmlStr += "</Style>";
                xmlStr += "</Styles>";
                //   End Styles

                // Sheet Name
                xmlStr += '<Worksheet ss:Name="Petunjuk Pengisian">';
                // End Sheet Name
                // Kolom Excel Header
                xmlStr +=
                "<Table>" +
                "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='130' />" +
                "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='500' />" +
                "<Row>" +
                '<Cell ss:StyleID="HD"><Data ss:Type="String"></Data></Cell>' +
                '<Cell ss:StyleID="HDbold"><Data ss:Type="String">Langkah Penggunaan Sheet "Data TK Baru"</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Pengisian Column</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Petunjuk</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">NIK</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi nomor identitas dari tenaga kerja. Wajib diisi. Sistem akan melakukan pengecekan dengan data Adminduk jika jenis identitas adalah KTP.</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">NAMA</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi nama depan/nama lengkap dari tenaga kerja. Wajib diisi.</Data></Cell>' +
                "</Row>";
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">TGL_LAHIR</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi tgl_lahir dari tenaga kerja, diisi dengan format dd-mm-yyyy contoh : 31-12-1992. Wajib diisi.</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">JENIS_IDENTITAS</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi jenis identitas dari tenaga kerja. pilihan ada 2 yaitu PASSPORT atau KTP. contoh : PASSPORT</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">MASA_LAKU_IDENTITAS</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi masa berlaku identitas tenaga kerja, diisi dengan format dd-mm-yyyy contoh : 31-12-1992.  Wajib diisi</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">JENIS_KELAMIN</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi jenis kelamin tenaga kerja, diisi dengan inisial L atau P.</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">SURAT_MENYURAT_KE</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi surat menyurat dikirim ke, diisi dengan initial S atau E. Keterangan : S (Alamat) , E (Email) </Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">STATUS_KAWIN</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi status kawin dari tenaga kerja, diisi dengan initial Y atau T. Keterangan : Y (KAWIN) , T (BELUM KAWIN) </Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">GOLONGAN_DARAH</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi golongan darah dari tenaga kerja, diisi dengan golongan A, B, AB, O.</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HDbg"><Data ss:Type="String">KODE_NEGARA</Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Berisi kode negara dari tenaga kerja, diisi dengan kode negara contoh : ID , keterangan : ID (INDONESIA).</Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HD"><Data ss:Type="String"></Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String"></Data></Cell>' +
                "</Row>";
                xmlStr += "<Row>" +
                '<Cell ss:StyleID="HD"><Data ss:Type="String"></Data></Cell>' +
                '<Cell ss:StyleID="HD"><Data ss:Type="String">Untuk pengisian data tenaga kerja terdapat di sheet data_tk_baru </Data></Cell>' +
                "</Row>";
                xmlStr += "</Table></Worksheet>"
                // endsheet 1

                // Sheet 2
                xmlStr += '<Worksheet ss:Name="data_tk_baru">';
                // End Sheet Name
                // Kolom Excel Header
                xmlStr +=
                    "<Table>" +
                    "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='180' />" +
                    "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                    "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                    "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='17' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='18' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='19' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='20' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='21' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='22' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='23' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='24' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='25' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='26' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='27' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='28' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='29' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='30' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='31' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='32' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='33' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='34' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='35' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='36' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='37' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='38' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='39' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='40' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='41' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='42' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='43' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='44' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='45' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='46' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='47' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='48' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='49' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Column ss:Index='50' ss:AutoFitWidth='0' ss:Width='100' />" +
                    "<Row ss:Index='1' ss:Height='20'>" +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NO_PEGAWAI</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_DEPAN</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_TENGAH</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_BELAKANG</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">GELAR</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TELEPON_AREA_RUMAH</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TELEPON_RUMAH</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TELEPON_AREA_KANTOR</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TELEPON_KANTOR</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TELEPON_EXT_KANTOR</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">HP</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">EMAIL</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TEMPAT_LAHIR</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TANGGAL_LAHIR</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_IBU_KANDUNG</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">JENIS_IDENTITAS</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NOMOR_IDENTITAS</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">MASA_LAKU_IDENTITAS</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">JENIS_KELAMIN</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">SURAT_MENYURAT_KE</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TANGGAL_KEPESERTAAN</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">STATUS_KAWIN</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">GOLONGAN_DARAH</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_BANK</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">CABANG_BANK</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NO_REKENING</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_REKENING</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NPWP</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">KODE_PAKET</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">KODE_NEGARA</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">PESERTA_JPK</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">UPAH</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">ALAMAT</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">KODE_POS</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">SUAMI_ISTRI</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TGL_LAHIR_SUAMI_ISTRI</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">JENIS_KELAMIN_SUAMI_ISTRI</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">GOLONGAN_DARAH_SUAMI_ISTRI</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_ANAK_1</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TGL_LAHIR_ANAK_1</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">JENIS_KELAMIN_ANAK_1</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">GOLONGAN_DARAH_ANAK_1</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_ANAK_2</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TGL_LAHIR_ANAK_2</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">JENIS_KELAMIN_ANAK_2</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">GOLONGAN_DARAH_ANAK_2</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">NAMA_ANAK_3</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">TGL_LAHIR_ANAK_3</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">JENIS_KELAMIN_ANAK_3</Data></Cell>' +
                    '<Cell ss:StyleID="HD"><Data ss:Type="String">GOLONGAN_DARAH_ANAK_3</Data></Cell>' +
                    "</Row>";
                    allData.forEach((data)=>{
                        var empId = data.empId
                        var firstName = '';
                        var middleName = '';
                        var lastName = '';
                        var email = '';
                        var phonNumb = '';
                        var mobilePhone = '';
                        var officialPhone = '';
                        var statusKaryawan = data.statusKaryawan
                        var noIdPersonalia = data.noIdPersonalia
                        var alamat = data.alamat
                        var jenisKel = data.jenisKel
                        var bankName = data.bankName
                        var empBank = data.empBank
                        var norek = data.norek
                        var kancab = data.kancab
                        var noBpjsket = data.noBpjsket
                        var jenisIdentitas = data.jenisIdentitas
                        var noNPWP = data.noNPWP
                        if(jenisKel == 1){
                            jenisKel = 'L'
                        }else{
                            jenisKel = 'P'
                        }
                        if(empId){
                            log.debug('masukemp');
                            var employeeSearchObj = search.create({
                                type: "employee",
                                filters:
                                [
                                    ["internalid","anyof",empId]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "firstname", label: "First Name"}),
                                    search.createColumn({name: "middlename", label: "Middle Name"}),
                                    search.createColumn({name: "lastname", label: "Last Name"}),
                                    search.createColumn({name: "email", label: "Email"}),
                                    search.createColumn({name: "phone", label: "Phone"}),
                                    search.createColumn({name: "mobilephone", label: "Mobile Phone"}),
                                    search.createColumn({name: "altphone", label: "Office Phone"}),
                                    
                                ]
                            });
                            var searchResultEmp = employeeSearchObj.runPaged().count;
                            log.debug("employeeSearchObj result count",searchResultEmp);
                            employeeSearchObj.run().each(function(data){
                                firstName = data.getValue({
                                    name: "firstname"
                                })
                                log.debug('firstName', firstName);
                                middleName = data.getValue({
                                    name: "middlename"
                                })
                                lastName = data.getValue({
                                    name: "lastname"
                                })
                                email = data.getValue({
                                    name: "email"
                                })
                                phonNumb = data.getValue({
                                    name: "phone"
                                })
                                mobilePhone = data.getValue({
                                    name: "mobilephone"
                                })
                                officialPhone = data.getValue({
                                    name: "altphone"
                                })
                            });
                        }
                        xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noIdPersonalia + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + firstName + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + middleName + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + lastName + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + phonNumb + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + officialPhone + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + mobilePhone + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + email + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + jenisIdentitas + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noIdPersonalia + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + jenisKel + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + bankName + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + kancab + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + norek + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + empBank + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noNPWP + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String">' + alamat + '</Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            "</Row>";
                    })
                xmlStr += "</Table></Worksheet>"
                xmlStr += "</Workbook>";
                var strXmlEncoded = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64,
                });
        
                var objXlsFile = file.create({
                    name: "template_tk.xls",
                    fileType: file.Type.EXCEL,
                    contents: strXmlEncoded,
                });
        
                context.response.writeFile({
                    file: objXlsFile,
                });

        }catch(e){

        }
    }
    return{
        onRequest:onRequest
    }
});