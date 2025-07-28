/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/runtime', 'N/file', 'N/log', 'N/format'], function (search, runtime, file, log, format) {


    function getAllResults(s) {
    const results = s.run();
    let searchResults = [];
    let searchid = 0;
    let resultslice;

    do {
        resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
        resultslice.forEach(function (result) {
            // Ambil semua field dari search
            const values = {};
            const columns = result.columns;
            columns.forEach(function (col) {
                const fieldId = col.name;
                const value = result.getValue(col);
                const text = result.getText(col);
                if (text && text !== value) {
                    values[fieldId] = [{ value: value, text: text }];
                } else {
                    values[fieldId] = value;
                }
            });

            searchResults.push({
                recordType: result.recordType || 'unknown',
                id: result.id,
                values: values
            });

            searchid++;
        });
    } while (resultslice.length === 1000);

    return searchResults;
}


    function getInputData() {
        const script = runtime.getCurrentScript();
        const subsidiary = script.getParameter({ name: 'custscript_subs_id' });
        const dateFrom = script.getParameter({ name: 'custscript_date_from_pk' });
        const dateTo = script.getParameter({ name: 'custscript_date_to_pk' });

        const fakturSearch = search.load({ id: 'customsearch_sos_faktur' });
        const fakturDetailSearch = search.load({ id: 'customsearch_sos_faktur_detail' });

        const filters = [];
        if (subsidiary) {
            filters.push(search.createFilter({
                name: "subsidiary",
                operator: search.Operator.ANYOF,
                values: [subsidiary]
            }));
        }
        if (dateFrom && dateTo) {
            filters.push(search.createFilter({
                name: "trandate",
                operator: search.Operator.WITHIN,
                values: [dateFrom, dateTo]
            }));
        }

        filters.forEach(f => {
            fakturSearch.filters.push(f);
            fakturDetailSearch.filters.push(f);
        });

        const fakturResults = getAllResults(fakturSearch).map(result => ({
            type: 'faktur',
            id: result.id,
            values: result.values
        }));

        const fakturDetailResults = getAllResults(fakturDetailSearch).map(result => ({
            type: 'faktur_detail',
            id: result.id,
            values: result.values
        }));
        log.debug('fakturDetailResults', fakturDetailResults)
        return [...fakturResults, ...fakturDetailResults];
    }

    function map(context) {
        const row = JSON.parse(context.value);
        log.debug('row', row)
        context.write({
            key: row.id,
            value: JSON.stringify(row)
        });
    }

    function reduce(context) {
        const jobAction = runtime.getCurrentScript().getParameter({ name: 'custscript_job_action_pk' });
        log.debug('jobAction', jobAction)
        const grouped = {
            faktur: null,
            details: []
        };
        context.values.forEach(val => {
            const parsed = JSON.parse(val);
            if (parsed.type === 'faktur') grouped.faktur = parsed;
            else if (parsed.type === 'faktur_detail') grouped.details.push(parsed);
        });
        log.debug('grouped', grouped)
        if (jobAction === 'excel') {
                const fakturRow = grouped.faktur ? [
                grouped.faktur.id,
                grouped.faktur.values.trandate || '',
                getText(grouped.faktur.values.custbody_sos_jenis_fp),
                grouped.faktur.values.custbody_sos_kode_transaksi_trx || '',
                getText(grouped.faktur.values.custbody_sos_ket_tamb),
                grouped.faktur.values.custbody_sos_dok_pendukung || '',
                grouped.faktur.values.custbody_sos_period_dok_pendukung || '',
                grouped.faktur.values.invoicenum || '',
                getText(grouped.faktur.values.custbody_sos_cap_fasilitas) || '',
                grouped.faktur.values.custbody_sos_id_tku_sales || '',
                grouped.faktur.values.custbody_sos_npwp_nik_pembeli || '',
                getText(grouped.faktur.values.custbody_sos_jenis_id_buyer),
                getText(grouped.faktur.values.custbody_sos_negara_pembeli),
                grouped.faktur.values.custbody_sos_no_dok_pembeli || '',
                grouped.faktur.values.custbody_sos_nama_pembeli || '',
                grouped.faktur.values.custbody_sos_alamat_pembeli || '',
                grouped.faktur.values.custbody_sos_email_pembeli || '',
                grouped.faktur.values.custbody_sos_id_tku_pembeli_trx || '',
            ] : null;

            const detailRows = grouped.details.map(d => {
            const v = d.values;
            let itemName = getText(v.item);
            if (itemName && itemName.includes(':')) {
                itemName = itemName.split(':')[0].trim();
            }
            return [
                d.id,
                getText(v.custbody_sos_barang_jasa),
                getText(v.custbody_sos_kode_barang_jasa),
                itemName,
                getText(v.custbody_sos_nama_satuan_ukur),
                v.rate || '',
                v.quantity || '',
                v.discountamount || '',
                v.amount || '',
                v.custcol_sos_dpp_nilai_lain || '',
                (getText(v.taxcode)?.replace(/vat/gi, '').replace(/%/g, '').trim()) || '',
                v.taxamount || '',
                '0',
                '0.00',
            ];
        });


            context.write({
                key: context.key,
                value: JSON.stringify({
                    type: 'excel',
                    fakturRow: fakturRow,
                    detailRows: detailRows
                })
            });

        }

        if (jobAction === 'xml' && grouped.faktur) {
            const header = grouped.faktur.values;
            const xmlParts = [];

            xmlParts.push(`<TaxInvoice>`);
            xmlParts.push(`<TaxInvoiceDate>${formatDate(header.trandate)}</TaxInvoiceDate>`);
            xmlParts.push(`<TaxInvoiceOpt>${getText(header.custbody_sos_jenis_fp)}</TaxInvoiceOpt>`);
            xmlParts.push(`<TrxCode>${header.custbody_sos_kode_transaksi_trx}</TrxCode>`);
            xmlParts.push(`<AddInfo>${getText(header.custbody_sos_ket_tamb)}</AddInfo>`);
            xmlParts.push(`<CustomDoc>${header.custbody_sos_dok_pendukung || ''}</CustomDoc>`);
            xmlParts.push(`<CustomDocMonthYear>${header.custbody_sos_period_dok_pendukung || ''}</CustomDocMonthYear>`);
            xmlParts.push(`<RefDesc>${header.invoicenum|| ''}</RefDesc>`);
            xmlParts.push(`<FacilityStamp>${getText(header.custbody_sos_cap_fasilitas) || ''}</FacilityStamp>`);
            xmlParts.push(`<SellerIDTKU>${header.custbody_sos_id_tku_sales || ''}</SellerIDTKU>`);
            xmlParts.push(`<BuyerTin>${header.custbody_sos_npwp_nik_pembeli || ''}</BuyerTin>`);
            xmlParts.push(`<BuyerDocument>${getText(header.custbody_sos_jenis_id_buyer)}</BuyerDocument>`);
            xmlParts.push(`<BuyerCountry>${getText(header.custbody_sos_negara_pembeli)}</BuyerCountry>`);
            xmlParts.push(`<BuyerDocumentNumber>${header.custbody_sos_no_dok_pembeli || ''}</BuyerDocumentNumber>`);
            xmlParts.push(`<BuyerName>${header.custbody_sos_nama_pembeli || ''}</BuyerName>`);
            xmlParts.push(`<BuyerAdress>${header.custbody_sos_alamat_pembeli || ''}</BuyerAdress>`);
            xmlParts.push(`<BuyerEmail>${header.custbody_sos_email_pembeli || ''}</BuyerEmail>`);
            xmlParts.push(`<BuyerIDTKU>${header.custbody_sos_id_tku_pembeli_trx || ''}</BuyerIDTKU>`);

            xmlParts.push(`<ListOfGoodService>`);
            grouped.details.forEach(detail => {
                const v = detail.values;

                let itemName = getText(v.item);
                if (itemName && itemName.includes(':')) {
                    itemName = itemName.split(':')[0].trim();
                }

                xmlParts.push(`<GoodService>`);
                xmlParts.push(`<Opt>${getText(v.custbody_sos_barang_jasa)}</Opt>`);
                xmlParts.push(`<Code>${getText(v.custbody_sos_kode_barang_jasa)}</Code>`);
                xmlParts.push(`<Name>${itemName}</Name>`);
                xmlParts.push(`<Unit>${getText(v.custbody_sos_nama_satuan_ukur)}</Unit>`);
                xmlParts.push(`<Price>${v.rate || '0'}</Price>`);
                xmlParts.push(`<Qty>${v.quantity || '0'}</Qty>`);
                xmlParts.push(`<TotalDiscount>${v.discountamount || '0'}</TotalDiscount>`);
                xmlParts.push(`<TaxBase>${v.amount || '0'}</TaxBase>`);
                xmlParts.push(`<OtherTaxBase>${v.custcol_sos_dpp_nilai_lain || '0'}</OtherTaxBase>`);
                xmlParts.push(`<VATRate>${(getText(v.taxcode)?.replace(/vat/gi, '').replace(/%/g, '').trim()) || ''}</VATRate>`);
                xmlParts.push(`<VAT>${v.taxamount || '0'}</VAT>`);
                xmlParts.push(`<STLGRate>0</STLGRate>`);
                xmlParts.push(`<STLG>0.00</STLG>`);
                xmlParts.push(`</GoodService>`);
            });
            xmlParts.push(`</ListOfGoodService>`);
            xmlParts.push(`</TaxInvoice>`);

            context.write({
                key: context.key,
                value: xmlParts.join('')
            });
        }
    }

    function summarize(summary) {
        const jobAction = runtime.getCurrentScript().getParameter({ name: 'custscript_job_action_pk' });
        const npwp = runtime.getCurrentScript().getParameter({ name: 'custscript_npwp_pk' });
        const idCustRec = runtime.getCurrentScript().getParameter({ name: 'custscript_id_cust_rec_pk' });

        const allFakturRows = [];
        const allDetailRows = [];

        if (jobAction === 'excel') {
            summary.output.iterator().each(function (key, value) {
                const parsed = JSON.parse(value);
                if (parsed.type === 'excel') {
                    if (parsed.fakturRow) allFakturRows.push(parsed.fakturRow);
                    if (parsed.detailRows && parsed.detailRows.length) {
                        allDetailRows.push(...parsed.detailRows);
                    }
                }
                return true;
            });
            const fakturIdToRowNumber = {};
            let rowCounter = 1;

            allFakturRows.forEach(fakturRow => {
                const fakturId = fakturRow[0]; 
                fakturIdToRowNumber[fakturId] = rowCounter; 
                fakturRow[0] = rowCounter; 
                rowCounter++;
            });

            allDetailRows.forEach(detailRow => {
                const fakturId = detailRow[0]; 
                detailRow[0] = fakturIdToRowNumber[fakturId]; 
            });

            const content = createExcelXml(allFakturRows, allDetailRows, npwp);
            const excelFile = file.create({
                name: `Faktur PK_${idCustRec}.xls`,
                fileType: file.Type.PLAINTEXT,
                contents: content,
                folder: 549
            });
            const fileId = excelFile.save();
            log.audit('Excel File Saved', `File ID: ${fileId}`);
        }

        if (jobAction === 'xml') {
            let finalXml = [];
            finalXml.push(`<?xml version="1.0" encoding="UTF-8"?>`);
            finalXml.push(`<TaxInvoiceBulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="TaxInvoice.xsd">`);
            finalXml.push(`<TIN>${npwp || ''}</TIN>`);
            finalXml.push(`<ListOfTaxInvoice>`);

            summary.output.iterator().each(function (key, value) {
                finalXml.push(value);
                return true;
            });

            finalXml.push(`</ListOfTaxInvoice>`);
            finalXml.push(`</TaxInvoiceBulk>`);

            const xmlFile = file.create({
                name: `Faktur PK_${idCustRec}.xml`,
                fileType: file.Type.XMLDOC,
                contents: finalXml.join('\n'),
                folder: 549
            });

            const fileId = xmlFile.save();
            log.audit('XML File Saved', `File ID: ${fileId}`);
        }
    }

    function getText(field) {
        if (!field || !Array.isArray(field) || field.length === 0) return '';
        return field[0].text || '';
    }

    function formatDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return '';
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    function escapeXml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    function createExcelXml(fakturRows, detailRows, npwpValue) {
        let xml = [];

        xml.push(`<?xml version="1.0"?>`);
        xml.push(`<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`);

        xml.push(`<Styles>
            <Style ss:ID="HeaderBold">
                <Font ss:Bold="1"/>
            </Style>
            <Style ss:ID="HeaderBoldCenter">
                <Font ss:Bold="1"/>
                <Alignment ss:Horizontal="Center"/>
            </Style>
            <Style ss:ID="Bold">
                <Font ss:Bold="1"/>
            </Style>
        </Styles>`);

        xml.push(`<Worksheet ss:Name="Faktur"><Table>`);

        xml.push(`<Row>
            <Cell ss:MergeAcross="1" ss:StyleID="HeaderBoldCenter"><Data ss:Type="String">NPWP Penjual</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(npwpValue)}</Data></Cell>
        </Row>`);

        xml.push(`<Row></Row>`);

        xml.push(`<Row>` +
            [
                "Baris", "Tanggal Faktur", "Jenis Faktur", "Kode Transaksi", "Keterangan Tambahan",
                "Dokumen Pendukung", "Period Dok Pendukung", "Referensi", "Cap Fasilitas",
                "ID TKU Penjual", "NPWP/NIK Pembeli", "Jenis ID Pembeli", "Negara Pembeli",
                "Nomor Dokumen Pembeli", "Nama Pembeli", "Alamat Pembeli", "Email Pembeli", "ID TKU Pembeli"
            ]
            .map(text => `<Cell ss:StyleID="HeaderBold"><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`).join('') +
            `</Row>`);

        fakturRows.forEach(row => {
            xml.push(`<Row>` + row.map(val => `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`).join('') + `</Row>`);
        });

        xml.push(`<Row>
            <Cell ss:StyleID="Bold"><Data ss:Type="String">END</Data></Cell>
        </Row>`);

        xml.push(`</Table></Worksheet>`);

        xml.push(`<Worksheet ss:Name="Detail Faktur"><Table>`);

        xml.push(`<Row>` +
            [
                "Baris", "Barang/Jasa", "Kode Barang Jasa", "Nama Barang/Jasa", "Nama Satuan Ukuran",
                "Harga Satuan", "Jumlah Barang Jasa", "Total Diskon", "DPP",
                "DPP Nilai Lain", "Tarif PPN", "PPN", "Tarif PPnBM", "PPnBM"
            ]
            .map(text => `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`).join('') +
            `</Row>`);

        detailRows.forEach(row => {
            xml.push(`<Row>` + row.map(val => `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`).join('') + `</Row>`);
        });

        xml.push(`<Row>
            <Cell><Data ss:Type="String">END</Data></Cell>
        </Row>`);

        xml.push(`</Table></Worksheet>`);
        xml.push(`</Workbook>`);

        return xml.join('\n');
    }


    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});
