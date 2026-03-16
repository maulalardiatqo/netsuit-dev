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
                join: "applyingTransaction", 
                operator: search.Operator.WITHIN,
                values: [dateFrom, dateTo]
            }));
        }

        return searchLoad;
    }

    function map(context) {
        const result = JSON.parse(context.value);
        const values = result.values;
        
        const getText = (val) => {
            if (Array.isArray(val) && val.length > 0) return val[0].text || val[0].value || "";
            if (typeof val === 'object' && val !== null) return val.text || val.value || "";
            return val || "";
        };

        let rawTanggalPemotongan = values["trandate.applyingTransaction"] || values["applyingTransaction.trandate"];
        
        const rowData = {
            internalId: result.id,
            masaPajak: getText(values.custbody_sos_masa_pajak),
            tahunPajak: getText(values.custbody_sos_tahun_pajak),
            npwp: values.custbody_sos_npwp_vendor,
            idTkuPenerima: values.custbody_sos_id_tku_penerima_penghasil,
            fasilitas: getText(values.custbody_sos_fasilitas),
            kodeObj: getText(values.custbody_sos_kode_obj_pajak),
            tarif: values.custbody_sos_tarif,
            jenisDokRef: getText(values.custbody_sos_jenis_dok_ref),
            nomorDokRef: values.custbody_sos_no_sp2d,   
            tanggalDok: values.custbody_sos_inv_date,
            idTkuPemotong: values.custbody_id_tku_pemotong,
            opsiPembayaran: getText(values.custbody_sos_opsi_pembayaran),
            nomorSP2D: values.custbody_sos_no_sp2d,
            docNumber : values.tranid,
            rawDate: rawTanggalPemotongan
        };

        context.write({ key: result.id, value: JSON.stringify(rowData) });
    }

    function reduce(context) {
        let latestData = null;
        let latestDateObj = null;

        context.values.forEach(function (val) {
            const currentData = JSON.parse(val);
            if (currentData.rawDate) {
                const currentDateObj = format.parse({ value: currentData.rawDate, type: format.Type.DATE });
                if (!latestDateObj || currentDateObj > latestDateObj) {
                    latestDateObj = currentDateObj;
                    latestData = currentData;
                }
            }
        });

        if (latestData) {
            context.write({ key: context.key, value: latestData });
        }
    }

    function summarize(summary) {
        const script = runtime.getCurrentScript();
        const jobAction = script.getParameter({ name: 'custscript_job_action' });
        const idRecord = script.getParameter({ name: 'custscript_id_cust_rec' });
        const npwpPemotong = script.getParameter({ name: 'custscript_npwp' });

        let finalRows = [];
        let internalIds = [];

        summary.output.iterator().each(function (key, value) {
            let data = JSON.parse(value);
            finalRows.push(data);
            internalIds.push(key);
            return true;
        });

        if (finalRows.length === 0) return;

        const dppMap = {};
        if (internalIds.length > 0) {
            const dppSearch = search.load({ id: 'customsearch_sos_wht__2_2' });
            
            let filters = dppSearch.filters;
            filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: internalIds
            }));
            dppSearch.filters = filters;

            dppSearch.run().each(function(res) {
                // Sesuai export: Index 0 adalah Internal ID (GROUP), Index 3 adalah Formula Currency (SUM)
                const id = res.getValue(res.columns[0]);
                const amt = res.getValue(res.columns[3]); 
                
                if (id) {
                    dppMap[id] = amt;
                }
                return true;
            });
        }

        log.debug('dppMap Final', dppMap);

        finalRows = finalRows.map(row => {
            let dppValue = Number(dppMap[row.internalId]) || 0;
            
            let dppAbs = Math.abs(dppValue);
            let decimalPart = dppAbs % 1;
            row.dpp = (decimalPart > 0.5) ? Math.ceil(dppAbs) : Math.floor(dppAbs);

            if (row.rawDate) {
                let parts = row.rawDate.split('/');
                if (parts.length === 3) {
                    row.tanggalPemotongan = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
                }
            }
            if (row.tanggalDok && typeof row.tanggalDok === 'string' && row.tanggalDok.indexOf('/') > -1) {
                let parts = row.tanggalDok.split('/');
                row.tanggalDok = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
            }
            return row;
        });

        if (jobAction === 'xml') {
            let xmlRows = '';
            const safe = (val) => (val !== undefined && val !== null && val !== '' ? val : 'N/A');

            finalRows.forEach(data => {
                xmlRows += `
                    <Bpu>
                        <TaxPeriodMonth>${safe(data.masaPajak)}</TaxPeriodMonth>
                        <TaxPeriodYear>${safe(data.tahunPajak)}</TaxPeriodYear>
                        <CounterpartTin>${safe(data.npwp)}</CounterpartTin>
                        <IDPlaceOfBusinessActivityOfIncomeRecipient>${safe(data.idTkuPenerima)}</IDPlaceOfBusinessActivityOfIncomeRecipient>
                        <TaxCertificate>${safe(data.fasilitas)}</TaxCertificate>
                        <TaxObjectCode>${safe(data.kodeObj)}</TaxObjectCode>
                        <TaxBase>${safe(data.dpp)}</TaxBase>
                        <Rate>${safe(data.tarif)}</Rate>
                        <Document>${safe(data.jenisDokRef)}</Document>
                        <DocumentNumber>${safe(data.docNumber)}</DocumentNumber>
                        <DocumentDate>${safe(data.tanggalDok)}</DocumentDate>
                        <IDPlaceOfBusinessActivity>${safe(data.idTkuPemotong)}</IDPlaceOfBusinessActivity>
                        <GovTreasurerOpt>${safe(data.opsiPembayaran)}</GovTreasurerOpt>
                        <SP2DNumber>${safe(data.nomorSP2D)}</SP2DNumber>
                        <WithholdingDate>${safe(data.tanggalPemotongan)}</WithholdingDate>
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
                <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#28ADFA" ss:Pattern="Solid"/></Style>
            </Styles>
            <Worksheet ss:Name="DATA"><Table>`;

            xmlStr += `<Row><Cell ss:MergeAcross="1"><Data ss:Type="String">NPWP Pemotong</Data></Cell><Cell><Data ss:Type="String">${npwpPemotong}</Data></Cell></Row><Row/>`;
            xmlStr += `<Row><Cell/><Cell ss:StyleID="Header"><Data ss:Type="String">Masa Pajak</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tahun Pajak</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">NPWP</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">ID TKU Penerima</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Fasilitas</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Kode Obj</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">DPP</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tarif</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Jenis Dok. Referensi</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nomor Dok. Referensi</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal Dok</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">ID TKU Pemotong</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Opsi Pembayaran (IP)</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nomor SP2D (IP)</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal Pemotongan</Data></Cell></Row>`;

            finalRows.forEach(data => {
                xmlStr += `<Row><Cell/>`;
                [
                    'masaPajak', 'tahunPajak', 'npwp', 'idTkuPenerima', 'fasilitas',
                    'kodeObj', 'dpp', 'tarif', 'jenisDokRef', 'docNumber',
                    'tanggalDok', 'idTkuPemotong', 'opsiPembayaran', 'nomorSP2D', 'tanggalPemotongan'
                ].forEach(key => {
                    xmlStr += `<Cell><Data ss:Type="String">${data[key] || '-'}</Data></Cell>`;
                });
                xmlStr += `</Row>`;
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

    return { getInputData, map, reduce, summarize };
});