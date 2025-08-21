/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/runtime', 'N/file', 'N/log', 'N/format'], function (search, runtime, file, log, format) {

    function getInputData() {
        const script = runtime.getCurrentScript();
        const subsidiary = script.getParameter({ name: 'custscript_subsidiary' });
        const dateFrom = script.getParameter({ name: 'custscript_date_from' });
        const dateTo = script.getParameter({ name: 'custscript_date_to' });
        const npwp = script.getParameter({ name: 'custscript_npwp' });
        const jobAction = script.getParameter({ name : 'custscript_job_action'})
        log.debug('PARAMETERS', { subsidiary, dateFrom, dateTo, npwp });

        const searchLoad = search.load({ id: 'customsearch_sos_wht_' });

        if (subsidiary) {
            searchLoad.filters.push(search.createFilter({
                name: "subsidiary",
                operator: search.Operator.ANYOF,
                values: subsidiary
            }));
        }

        if (dateFrom && dateTo) {
            searchLoad.filters.push(search.createFilter({
                name: "trandate",
                operator: search.Operator.WITHIN,
                values: [dateFrom, dateTo]
            }));
        }

        // Jika npwp diaktifkan
        // if (npwp) {
        //     searchLoad.filters.push(search.createFilter({
        //         name: "custbody_sos_npwp_vendor",
        //         operator: search.Operator.IS,
        //         values: npwp
        //     }));
        // }

        const resultSet = searchLoad.run().getRange({ start: 0, end: 1000 });
        log.debug('Jumlah hasil getRange', resultSet.length);

        return resultSet;
    }

    function map(context) {
        const result = JSON.parse(context.value);
        const values = result.values;

        let dppValue = Number(values.amount);
        if (Number.isInteger(dppValue)) {
            dppValue = dppValue.toString(); 
        } else {
            dppValue = dppValue.toFixed(2); 
        }
        let tanggalPemotongan = values["applyingTransaction.trandate"];
        log.debug('tanggalPemotongan', tanggalPemotongan)
        if (tanggalPemotongan) {
            let parts = tanggalPemotongan.split('/');
            if (parts.length === 3) {
                let day = parts[0].padStart(2, '0');
                let month = parts[1].padStart(2, '0');
                let year = parts[2];
                tanggalPemotongan = `${day}/${month}/${year}`;
            }
        }

        const rowData = {
            masaPajak: values.custbody_sos_masa_pajak,
            tahunPajak: values.custbody_sos_tahun_pajak,
            npwp: values.custbody_sos_npwp_vendor,
            idTkuPenerima: values.custbody_sos_id_tku_penerima_penghasil,
            fasilitas: values.custbody_sos_fasilitas,
            kodeObj: values.custbody_sos_kode_obj_pajak,
            dpp: dppValue,
            tarif: values.custbody_sos_tarif,
            jenisDokRef: values.custbody_sos_jenis_dok_ref,
            nomorDokRef: values.custbody_sos_no_sp2d,   
            tanggalDok: values.trandate,
            idTkuPemotong: values.custbody_id_tku_pemotong,
            opsiPembayaran: values.custbody_sos_opsi_pembayaran,
            nomorSP2D: values.custbody_sos_no_sp2d,
            tanggalPemotongan: tanggalPemotongan
        };

        context.write({ key: 'bpu_group', value: JSON.stringify(rowData) });
    }


    function reduce(context) {
        const jobAction = runtime.getCurrentScript().getParameter({ name: 'custscript_job_action' });
        const idRecord = runtime.getCurrentScript().getParameter({ name: 'custscript_id_cust_rec' });
        const npwpPemotong = runtime.getCurrentScript().getParameter({ name: 'custscript_npwp' });

        log.debug('reduce Stage - jobAction', jobAction);

        if (jobAction === 'xml') {
            let xmlRows = '';
            context.values.forEach(function (row) {
    const data = JSON.parse(row);
    log.debug('data', data);

    function safe(value) {
        return value !== undefined && value !== null && value !== '' ? value : 'N/A';
    }

             xmlRows += `
                    <Bpu>
                        <TaxPeriodMonth>${safe(data?.masaPajak?.[0]?.text)}</TaxPeriodMonth>
                        <TaxPeriodYear>${safe(data?.tahunPajak?.[0]?.text)}</TaxPeriodYear>
                        <CounterpartTin>${safe(data?.npwp)}</CounterpartTin>
                        <IDPlaceOfBusinessActivityOfIncomeRecipient>${safe(data?.idTkuPenerima)}</IDPlaceOfBusinessActivityOfIncomeRecipient>
                        <TaxCertificate>${safe(data?.fasilitas?.[0]?.text)}</TaxCertificate>
                        <TaxObjectCode>${safe(data?.kodeObj?.[0]?.value)}</TaxObjectCode>
                        <TaxBase>${safe(data?.dpp)}</TaxBase>
                        <Rate>${safe(data?.tarif)}</Rate>
                        <Document>${safe(data?.jenisDokRef?.[0]?.text)}</Document>
                        <DocumentNumber>${safe(data?.nomorDokRef)}</DocumentNumber>
                        <DocumentDate>${safe(data?.tanggalDok)}</DocumentDate>
                        <IDPlaceOfBusinessActivity>${safe(data?.idTkuPemotong)}</IDPlaceOfBusinessActivity>
                        <GovTreasurerOpt>${safe(data?.opsiPembayaran?.[0]?.text)}</GovTreasurerOpt>
                        <SP2DNumber>${safe(data?.nomorSP2D)}</SP2DNumber>
                        <WithholdingDate>${safe(data?.tanggalPemotongan)}</WithholdingDate>
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

            let xmlStr = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
            <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
            xmlns:html="http://www.w3.org/TR/REC-html40">
            <Styles>
                <Style ss:ID="Header">
                    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
                    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
                    <Interior ss:Color="#28ADFA" ss:Pattern="Solid"/>
                    <Borders>
                        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
                        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
                        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
                        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                    </Borders>
                </Style>
                <Style ss:ID="RowEven">
                    <Interior ss:Color="#DDEEFF" ss:Pattern="Solid"/>
                </Style>
                <Style ss:ID="RowOdd">
                    <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
                </Style>
            </Styles>
            <Worksheet ss:Name="DATA">
            <Table>`;

            // Baris 1: A1 & B1 merge, C1 isi NPWP
            xmlStr += `
            <Row>
                <Cell ss:MergeAcross="1"><Data ss:Type="String">NPWP Pemotong</Data></Cell>
                <Cell><Data ss:Type="String">${npwpPemotong}</Data></Cell>
            </Row>`;

            // Baris 2 kosong
            xmlStr += `<Row/>`;

            // Baris 3: Header mulai dari kolom B
            xmlStr += `
            <Row>
                <Cell/><Cell ss:StyleID="Header"><Data ss:Type="String">Masa Pajak</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Tahun Pajak</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">NPWP</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">ID TKU Penerima</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Fasilitas</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Kode Obj</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">DPP</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Tarif</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Jenis Dok. Referensi</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Nomor Dok. Referensi</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal Dok</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">ID TKU Pemotong</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Opsi Pembayaran (IP)</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Nomor SP2D (IP)</Data></Cell>
                <Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal Pemotongan</Data></Cell>
            </Row>`;

            // Data rows
            let rowIndex = 0;
            context.values.forEach(function (row) {
                const data = JSON.parse(row);
                log.debug('data', data)
                const styleRow = (rowIndex % 2 === 0) ? 'RowEven' : 'RowOdd';
                xmlStr += `<Row><Cell/>`; 
                [
                    'masaPajak', 'tahunPajak', 'npwp', 'idTkuPenerima', 'fasilitas',
                    'kodeObj', 'dpp', 'tarif', 'jenisDokRef', 'nomorDokRef',
                    'tanggalDok', 'idTkuPemotong', 'opsiPembayaran', 'nomorSP2D', 'tanggalPemotongan'
                ].forEach(key => {
                    let value = data[key];

                    if (Array.isArray(value) && value.length > 0 && value[0].text) {
                        value = value[0].text;
                    } else if (Array.isArray(value) && value.length === 0) {
                        value = '-';
                    } else if (value && typeof value === 'object') {
                        value = JSON.stringify(value);
                    }

                    xmlStr += `<Cell ss:StyleID="${styleRow}"><Data ss:Type="String">${value || '-'}</Data></Cell>`;
                });
                xmlStr += `</Row>`;
                rowIndex++;
            });

            xmlStr += `
            </Table>
            </Worksheet>
            </Workbook>`;

            const excelFile = file.create({
                name: `BPPU_Excel_PPh23_${idRecord}.xls`,
                fileType: file.Type.PLAINTEXT,
                contents: xmlStr,
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
