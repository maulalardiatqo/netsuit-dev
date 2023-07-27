/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
  "N/ui/serverWidget",
  "N/search",
  "N/record",
  "N/ui/message",
  "N/url",
  "N/redirect",
  "N/xml",
  "N/file",
  "N/encode",
  'N/runtime'
], function(
  serverWidget,
  search,
  record,
  message,
  url,
  redirect,
  xml,
  file,
  encode,
  runtime
) {

  function getAllResults(s) {
    var results = s.run();
    var searchResults = [];
    var searchid = 0;
    do {
      var resultslice = results.getRange({
        start: searchid,
        end: searchid + 1000
      });
      resultslice.forEach(function(slice) {
        searchResults.push(slice);
        searchid++;
      });
    } while (resultslice.length >= 1000);
    return searchResults;
  }

  function onRequest(context) {
    var contextRequest = context.request;
    if (contextRequest.method === "GET") {
      var form = serverWidget.createForm({
        title: "E Faktur Pajak Template",
      });

      var filterOption = form.addFieldGroup({
        id: "filteroption",
        label: "FILTER",
      });

      var startDate = form.addField({
        id: 'rpt_start_date',
        type: serverWidget.FieldType.DATE,
        label: 'START DATE',
        container: 'filteroption',
      });
      // startDate.isMandatory = true;

      var endDate = form.addField({
        id: 'rpt_end_date',
        type: serverWidget.FieldType.DATE,
        label: 'END DATE',
        container: 'filteroption',
      });
      // startDate.isMandatory = true;

      form.addSubmitButton({
        label: "Generate CSV",
      });

      context.response.writePage(form);
    } else {
      try {
        var startDateFilter = contextRequest.parameters.rpt_start_date;
        var endDateFilter = contextRequest.parameters.rpt_end_date;
        // Define the file contents
        var csvContents = `FK;KD_JENIS_TRANSAKSI;FG_PENGGANTI;NOMOR_FAKTUR;MASA_PAJAK;TAHUN_PAJAK;TANGGAL_FAKTUR;NPWP;NAMA;ALAMAT_LENGKAP;JUMLAH_DPP;JUMLAH_PPN;JUMLAH_PPNBM;ID_KETERANGAN_TAMBAHAN;FG_UANG_MUKA;UANG_MUKA_DPP;UANG_MUKA_PPN;UANG_MUKA_PPNBM;REFERENSI;KODE_DOKUMEN_PENDUKUNG
LT;NPWP;NAMA;JALAN;BLOK;NOMOR;RT;RW;KECAMATAN;KELURAHAN;KABUPATEN;PROPINSI;KODE_POS;NOMOR_TELEPON;;;;;;
OF;KODE_OBJEK;NAMA;HARGA_SATUAN;JUMLAH_BARANG;HARGA_TOTAL;DISKON;DPP;PPN;TARIF_PPNBM;PPNBM;;;;;;;;;\n`;

        var headInvoiceData = [];
        var itemInvoiceData = [];

        // new process

        var headInvoice = search.load({
          id: "customsearch_abj_e_faktur_pajak"
        });
        if (startDateFilter && endDateFilter) {
          headInvoice.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORAFTER,
              values: startDateFilter,
            })
          );
          headInvoice.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORBEFORE,
              values: endDateFilter,
            })
          );
        }
        var headInvoice_set = headInvoice.run();
        headInvoice = headInvoice_set.getRange(0, 1000);

        if (headInvoice.length <= 0) {
          var html = `<html>
          <h3>No Data for this selection!.</h3>
          <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
          <body></body></html>`;

          var form_result = serverWidget.createForm({
            title: "Result of Budget Report",
          });
          form_result.addPageInitMessage({
            type: message.Type.ERROR,
            title: "No Data!",
            message: html,
          });
          context.response.writePage(form_result);
        } else {
          if (headInvoice.length > 0) {
            for (var j = 0; j < headInvoice.length; j++) {
              var py = headInvoice[j];
              var taxTotal = py.getValue(headInvoice_set.columns[16]);
              if (taxTotal > 0) {
                var fakturPajak = py.getValue(headInvoice_set.columns[11]);
                var monthPostingPeriod = py.getText(headInvoice_set.columns[3]).substr(0, 3);;
                var yearPostingPeriod = py.getText(headInvoice_set.columns[3]).substr(-4);
                var dateFaktur = py.getValue(headInvoice_set.columns[1]);
                var npwp = py.getValue(headInvoice_set.columns[13]);
                var companyName = py.getValue(headInvoice_set.columns[14]);
                var companyAddress = py.getValue(headInvoice_set.columns[15]).replace(/\n/g, '');;
                var subTotal = py.getValue(headInvoice_set.columns[17]);
                var documentNumber = py.getValue(headInvoice_set.columns[6]);
                var kdJenisTrans = py.getValue(headInvoice_set.columns[18]);
                var monthPostingPeriod = new Date(`${monthPostingPeriod} 1, 2023`).getMonth() + 1;
                headInvoiceData.push({
                  fakturPajak: fakturPajak,
                  monthPostingPeriod: monthPostingPeriod,
                  yearPostingPeriod: yearPostingPeriod,
                  dateFaktur: dateFaktur,
                  npwp: npwp,
                  companyName: companyName,
                  companyAddress: companyAddress,
                  subTotal: subTotal,
                  taxTotal: taxTotal,
                  documentNumber: documentNumber,
                  kdJenisTrans: kdJenisTrans
                });
              }
            }
          }

          var itemInvoice = search.load({
            id: "customsearch_faktur_pajak_item"
          });
          if (startDateFilter && endDateFilter) {
            itemInvoice.filters.push(
              search.createFilter({
                name: "trandate",
                operator: search.Operator.ONORAFTER,
                values: startDateFilter,
              })
            );
            itemInvoice.filters.push(
              search.createFilter({
                name: "trandate",
                operator: search.Operator.ONORBEFORE,
                values: endDateFilter,
              })
            );
          }
          var itemInvoice_set = itemInvoice.run();
          itemInvoice = itemInvoice_set.getRange(0, 1000);
          if (itemInvoice.length > 0) {
            for (var j = 0; j < itemInvoice.length; j++) {
              var py = itemInvoice[j];
              var taxTotal = py.getValue(itemInvoice_set.columns[6]);
              if (taxTotal > 0) {
                var documentNumber = py.getValue(itemInvoice_set.columns[2]);
                var itemName = py.getText(itemInvoice_set.columns[3]);
                var itemRate = py.getValue(itemInvoice_set.columns[4]);
                var itemQty = py.getValue(itemInvoice_set.columns[5]);
                var itemAmount = py.getValue(itemInvoice_set.columns[7]);
                var itemTax = py.getValue(itemInvoice_set.columns[6]);
                itemInvoiceData.push({
                  documentNumber: documentNumber,
                  itemName: itemName,
                  itemRate: itemRate,
                  itemQty: itemQty,
                  itemAmount: itemAmount,
                  itemTax: itemTax
                });
              }
            }
          }

          headInvoiceData.forEach(function(row0) {
            let documentNumber = row0.documentNumber;
            let fakturPajak = row0.fakturPajak;
            let monthPostingPeriod = row0.monthPostingPeriod;
            let yearPostingPeriod = row0.yearPostingPeriod;
            let dateFaktur = row0.dateFaktur;
            let npwp = row0.npwp;
            let companyName = row0.companyName;
            let companyAddress = row0.companyAddress;
            let subTotal = row0.subTotal;
            let taxTotal = row0.taxTotal;
            let kdJenisTrans = row0.kdJenisTrans;
            csvContents += `FK;${kdJenisTrans};0;${fakturPajak};${monthPostingPeriod};${yearPostingPeriod};${dateFaktur};${npwp};${companyName};${companyAddress};${subTotal};${taxTotal};0;0;0;0;0;0;${documentNumber};0\n`;
            var filterData = itemInvoiceData.filter(function(result) {
              return result.documentNumber == documentNumber;
            });
            filterData.forEach(function(row1) {
              let documentNumberItem = row1.documentNumber;
              let itemName = row1.itemName;
              let itemRate = row1.itemRate;
              let itemQty = row1.itemQty;
              let itemAmount = row1.itemAmount;
              let itemTax = row1.itemTax;
              csvContents += `OF;${documentNumberItem};${itemName};${itemRate};${itemQty};${itemAmount};0;${itemAmount};${itemTax};0;0\n`;
            });
          });

          var objXlsFile = file.create({
            name: "Template_Import_Sales_FP.csv",
            fileType: file.Type.CSV,
            contents: csvContents,
          });

          context.response.writeFile({
            file: objXlsFile,
          });
        }
      } catch (e) {
        log.debug("error in get report", e.name + ": " + e.message);
      }
    }
  }

  return {
    onRequest: onRequest,
  };
});