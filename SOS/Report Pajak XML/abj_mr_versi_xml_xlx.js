/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/runtime', 'N/file', 'N/log', 'N/format'], function (search, runtime, file, log, format) {

    function getInputData() {
        const searchLoad = search.load({ id: 'customsearch_sos_wht_' });
        const resultSet = searchLoad.run().getRange({ start: 0, end: 1000 });
        log.debug('Jumlah hasil getRange', resultSet.length);
        return resultSet;
    }

    function map(context) {
        const result = JSON.parse(context.value);
        const values = result.values;

        const rowData = {
            masaPajak: values.custbody_sos_masa_pajak,
            tahunPajak: values.custbody_sos_tahun_pajak,
            npwp: values.custbody_sos_npwp_vendor,
            idTkuPenerima: values.custbody_sos_id_tku_penerima_penghasil,
            fasilitas: values.custbody_sos_fasilitas || 'N/A',
            kodeObj: values.custbody_sos_kode_obj_pajak,
            dpp: values.amount,
            tarif: values.custbody_sos_tarif,
            jenisDokRef: values.custbody_sos_jenis_dok_ref,
            nomorDokRef: values.custbody_sos_no_sp2d || 'N/A',
            tanggalDok: values.trandate,
            idTkuPemotong: values.custbody_id_tku_pemotong,
            opsiPembayaran: 'N/A',
            nomorSP2D: values.custbody_sos_no_sp2d || 'N/A',
            tanggalPemotongan: values["applyingTransaction.trandate"]
        };

        context.write({ key: 'bpu_group', value: JSON.stringify(rowData) });
    }

    function reduce(context) {
        const jobAction = runtime.getCurrentScript().getParameter({ name: 'custscript_job_action' });
        const idRecord = runtime.getCurrentScript().getParameter({ name: 'custscript_id_cust_rec' });
        const npwpPemotong = '3172022408981234';

        log.debug('reduce Stage - jobAction', jobAction);

        if (jobAction === 'xml') {
            // Bangun XML
            let xmlRows = '';
            context.values.forEach(function (row) {
                const data = JSON.parse(row);
                xmlRows += `
                    <Bpu>
                        <TaxPeriodMonth>${data.masaPajak}</TaxPeriodMonth>
                        <TaxPeriodYear>${data.tahunPajak}</TaxPeriodYear>
                        <CounterpartTin>${data.npwp}</CounterpartTin>
                        <IDPlaceOfBusinessActivityOfIncomeRecipient>${data.idTkuPenerima}</IDPlaceOfBusinessActivityOfIncomeRecipient>
                        <TaxCertificate>N/A</TaxCertificate>
                        <TaxObjectCode>${data.kodeObj}</TaxObjectCode>
                        <TaxBase>${data.dpp}</TaxBase>
                        <Rate>${data.tarif}</Rate>
                        <Document>${data.jenisDokRef}</Document>
                        <DocumentNumber>${data.nomorDokRef}</DocumentNumber>
                        <DocumentDate>${data.tanggalDok}</DocumentDate>
                        <IDPlaceOfBusinessActivity>${data.idTkuPemotong}</IDPlaceOfBusinessActivity>
                        <GovTreasurerOpt>${data.opsiPembayaran}</GovTreasurerOpt>
                        <SP2DNumber>${data.nomorSP2D}</SP2DNumber>
                        <WithholdingDate>${data.tanggalPemotongan}</WithholdingDate>
                    </Bpu>`;
            });

            const fullXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <BpuBulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                    <TIN>${npwpPemotong}</TIN>
                    <ListOfBpu>${xmlRows}</ListOfBpu>
                </BpuBulk>`;

            const xmlFile = file.create({
                name: `BPPU_XML_PPh23_${idRecord}.xml`,
                fileType: file.Type.XMLDOC,
                contents: fullXML,
                encoding: file.Encoding.UTF8,
                folder: 546
            });

            const fileId = xmlFile.save();
            log.audit('XML File Saved', `File ID: ${fileId}`);
        }

        else if (jobAction === 'excel') {
            // Bangun HTML Table bergaya Excel
            const npwpPemotong = '3172022408981234';

            let htmlContent = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid black; padding: 5px; text-align: center; }
                    th { background-color: #D9E1F2; color: #000; }
                    tr.data-row:nth-child(even) { background-color: #F2F2F2; }
                </style>
            </head>
            <body>
            <table>
                <tr>
                    <td colspan="2" style="font-weight:bold;">NPWP Pemotong</td>
                    <td>${npwpPemotong}</td>
                </tr>
                <tr><td colspan="15"></td></tr>
                <tr>
                    <th>Masa Pajak</th>
                    <th>Tahun Pajak</th>
                    <th>NPWP</th>
                    <th>ID TKU Penerima Penghasilan</th>
                    <th>Fasilitas</th>
                    <th>Kode Obj</th>
                    <th>DPP</th>
                    <th>Tarif</th>
                    <th>Jenis Dok. Referensi</th>
                    <th>Nomor Dok. Referensi</th>
                    <th>Tanggal Dok</th>
                    <th>ID TKU Pemotong</th>
                    <th>Opsi Pembayaran (IP)</th>
                    <th>Nomor SP2D (IP)</th>
                    <th>Tanggal Pemotongan</th>
                </tr>`;

            context.values.forEach(function (row) {
                const data = JSON.parse(row);
                htmlContent += `
                <tr class="data-row">
                    <td>${data.masaPajak}</td>
                    <td>${data.tahunPajak}</td>
                    <td>${data.npwp}</td>
                    <td>${data.idTkuPenerima}</td>
                    <td>${data.fasilitas}</td>
                    <td>${data.kodeObj}</td>
                    <td>${data.dpp}</td>
                    <td>${data.tarif}</td>
                    <td>${data.jenisDokRef}</td>
                    <td>${data.nomorDokRef}</td>
                    <td>${data.tanggalDok}</td>
                    <td>${data.idTkuPemotong}</td>
                    <td>${data.opsiPembayaran}</td>
                    <td>${data.nomorSP2D}</td>
                    <td>${data.tanggalPemotongan}</td>
                </tr>`;
            });

            htmlContent += `</table></body></html>`;

            const excelFile = file.create({
                name: `BPPU_Excel_PPh23_${idRecord}.xls`,
                fileType: file.Type.PLAINTEXT,
                contents: htmlContent,
                encoding: file.Encoding.UTF8,
                folder: 546
            });

            const fileId = excelFile.save();
            log.audit('Excel File Saved', `File ID: ${fileId}`);
        }
    }

    return {
        getInputData,
        map,
        reduce
    };
});
