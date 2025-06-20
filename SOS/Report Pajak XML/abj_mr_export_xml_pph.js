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

        const formatDate = (val) => {
            try {
                return format.format({ value: val, type: format.Type.DATE });
            } catch (e) {
                return '';
            }
        };

        const xmlRow = `
        <Bpu>
            <TaxPeriodMonth>${values.custbody_sos_masa_pajak}</TaxPeriodMonth>
            <TaxPeriodYear>${values.custbody_sos_tahun_pajak}</TaxPeriodYear>
            <CounterpartTin>${values.custbody_sos_npwp_vendor}</CounterpartTin>
            <IDPlaceOfBusinessActivityOfIncomeRecipient>${values.custbody_sos_id_tku_penerima_penghasil}</IDPlaceOfBusinessActivityOfIncomeRecipient>
            <TaxCertificate>N/A</TaxCertificate>
            <TaxObjectCode>${values.custbody_sos_kode_obj_pajak}</TaxObjectCode>
            <TaxBase>${values.amount}</TaxBase>
            <Rate>${values.custbody_sos_tarif}</Rate>
            <Document>${values.custbody_sos_jenis_dok_ref}</Document>
            <DocumentNumber>${values.custbody_sos_no_sp2d || 'N/A'}</DocumentNumber>
            <DocumentDate>${values.trandate}</DocumentDate>
            <IDPlaceOfBusinessActivity>${values.custbody_id_tku_pemotong}</IDPlaceOfBusinessActivity>
            <GovTreasurerOpt>N/A</GovTreasurerOpt>
            ${values.custbody_sos_no_sp2d ? `<SP2DNumber>${values.custbody_sos_no_sp2d}</SP2DNumber>` : `<SP2DNumber xsi:nil="true"/>`}
            <WithholdingDate>${values["applyingTransaction.trandate"]}</WithholdingDate>
        </Bpu>`;

        // Gunakan key statik agar masuk ke satu group reduce
        context.write({ key: 'bpu_group', value: xmlRow });
    }

    function reduce(context) {
        log.debug('reduce Stage - key', context.key);
        let rows = '';
        context.values.forEach(row => {
            rows += row;
        });

        const npwpPemotong = '3172022408981234'; // Ganti dengan NPWP pemotong yang sesuai

        const fullXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<BpuBulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <TIN>${npwpPemotong}</TIN>
    <ListOfBpu>
        ${rows}
    </ListOfBpu>
</BpuBulk>`;

        const xmlFile = file.create({
            name: `BPPU_Excel_To_XML_PPh23.xml`,
            fileType: file.Type.XMLDOC,
            contents: fullXML,
            folder: 546 // Ganti dengan folder ID tujuan di File Cabinet
        });

        const fileId = xmlFile.save();
        log.audit('XML File Saved', `File ID: ${fileId}`);
    }

    return {
        getInputData,
        map,
        reduce
    };
});
