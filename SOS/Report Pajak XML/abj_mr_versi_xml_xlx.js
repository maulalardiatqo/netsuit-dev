/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/runtime', 'N/file', 'N/log', 'N/format'], function(search, runtime, file, log, format) {

    function getInputData() {
        const script = runtime.getCurrentScript();
        const subsidiary = script.getParameter({ name: 'custscript_subsidiary' });
        const dateFrom = script.getParameter({ name: 'custscript_date_from' });
        const dateTo = script.getParameter({ name: 'custscript_date_to' });

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

        const firstResults = searchLoad.run().getRange({ start: 0, end: 1000 });
        if (firstResults.length === 0) return [];

        const internalIds = firstResults.map(res => res.id);
        log.debug('internalIds', internalIds)
        const amountMap = {};
        const secondarySearch = search.load({ id: 'customsearch_sos_wht__2_2' });
        
        secondarySearch.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: internalIds
        }));
        log.debug('secondarySearch', secondarySearch)
       secondarySearch.run().each(res => {
        log.debug('res', res)
            let recordId = res.getValue(res.columns[0]); 
            let amountValue = res.getValue(res.columns[1]);
            log.debug('amountValue', amountValue)
            
            if (recordId) {
                amountMap[recordId] = amountValue;
            }
            return true;
        });

        return firstResults.map(res => {
            let data = JSON.parse(JSON.stringify(res));
            data.dpp_amount_custom = amountMap[res.id] || 0; 
            return data;
        });
    }

    function map(context) {
        const result = JSON.parse(context.value);
        const values = result.values;

        let dppValue = Number(result.dpp_amount_custom);
        log.debug('dppValue',dppValue) 
        if (!isNaN(dppValue)) {
            let decimalPart = dppValue % 1;
            dppValue = (decimalPart > 0.5) ? Math.ceil(dppValue) : Math.floor(dppValue);
        }

        let tanggalPemotongan = values["applyingTransaction.trandate"];
        if (tanggalPemotongan && typeof tanggalPemotongan === 'string') {
            let parts = tanggalPemotongan.split('/');
            if (parts.length === 3) {
                tanggalPemotongan = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
            }
        }

        let tanggalDok = values.custbody_sos_inv_date;
        if (tanggalDok && typeof tanggalDok === 'string') {
            let parts = tanggalDok.split('/');
            if (parts.length === 3) {
                tanggalDok = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
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
            tanggalDok: tanggalDok,
            idTkuPemotong: values.custbody_id_tku_pemotong,
            opsiPembayaran: values.custbody_sos_opsi_pembayaran,
            nomorSP2D: values.custbody_sos_no_sp2d,
            docNumber : values.tranid,
            tanggalPemotongan: tanggalPemotongan
        };

        context.write({ key: 'bpu_group', value: JSON.stringify(rowData) });
    }

    function reduce(context) {
        const script = runtime.getCurrentScript();
        const jobAction = script.getParameter({ name: 'custscript_job_action' });
        const idRecord = script.getParameter({ name: 'custscript_id_cust_rec' });
        const npwpPemotong = script.getParameter({ name: 'custscript_npwp' });

        if (jobAction === 'xml') {
            let xmlRows = '';
            context.values.forEach(function (row) {
                const data = JSON.parse(row);
                const safe = (val) => (val !== undefined && val !== null && val !== '' ? val : 'N/A');

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
                        <DocumentNumber>${safe(data?.docNumber)}</DocumentNumber>
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

            file.create({
                name: `BPPU_XML_PPh23_${idRecord}.xml`,
                fileType: file.Type.XMLDOC,
                contents: fullXML,
                encoding: file.Encoding.UTF8,
                folder: 546
            }).save();
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
                        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
                        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                    </Borders>
                </Style>
                <Style ss:ID="RowEven"><Interior ss:Color="#DDEEFF" ss:Pattern="Solid"/></Style>
                <Style ss:ID="RowOdd"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/></Style>
            </Styles>
            <Worksheet ss:Name="DATA"><Table>`;

            xmlStr += `<Row><Cell ss:MergeAcross="1"><Data ss:Type="String">NPWP Pemotong</Data></Cell><Cell><Data ss:Type="String">${npwpPemotong}</Data></Cell></Row><Row/>`;

            xmlStr += `<Row><Cell/><Cell ss:StyleID="Header"><Data ss:Type="String">Masa Pajak</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tahun Pajak</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">NPWP</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">ID TKU Penerima</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Fasilitas</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Kode Obj</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">DPP</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tarif</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Jenis Dok. Referensi</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nomor Dok. Referensi</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal Dok</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">ID TKU Pemotong</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Opsi Pembayaran (IP)</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nomor SP2D (IP)</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal Pemotongan</Data></Cell></Row>`;

            let rowIndex = 0;
            context.values.forEach(function (row) {
                const data = JSON.parse(row);
                const styleRow = (rowIndex % 2 === 0) ? 'RowEven' : 'RowOdd';
                xmlStr += `<Row><Cell/>`; 
                [
                    'masaPajak', 'tahunPajak', 'npwp', 'idTkuPenerima', 'fasilitas',
                    'kodeObj', 'dpp', 'tarif', 'jenisDokRef', 'docNumber',
                    'tanggalDok', 'idTkuPemotong', 'opsiPembayaran', 'nomorSP2D', 'tanggalPemotongan'
                ].forEach(key => {
                    let value = data[key];
                    if (Array.isArray(value) && value.length > 0 && value[0].text) value = value[0].text;
                    else if (Array.isArray(value) && value.length === 0) value = '-';
                    xmlStr += `<Cell ss:StyleID="${styleRow}"><Data ss:Type="String">${value || '-'}</Data></Cell>`;
                });
                xmlStr += `</Row>`;
                rowIndex++;
            });

            xmlStr += `</Table></Worksheet></Workbook>`;

            file.create({
                name: `BPPU_Excel_PPh23_${idRecord}.xls`,
                fileType: file.Type.PLAINTEXT,
                contents: xmlStr,
                encoding: file.Encoding.UTF8,
                folder: 546
            }).save();
        }
    }

    return { getInputData, map, reduce };
});