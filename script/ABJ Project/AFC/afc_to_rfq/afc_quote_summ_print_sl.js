/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// PRINT RFQ to PDF
define([
  "N/render",
  "N/search",
  "N/record",
  "N/log",
  "N/file",
  "N/http",
  "N/config",
  "N/format",
  "N/url",
  "N/runtime",
  "N/email",
  "N/error",
  "N/currency",
], function(
  render,
  search,
  record,
  log,
  file,
  http,
  config,
  format,
  url,
  runtime,
  email,
  error,
  currency,
) {
  function onRequest(context) {
    var rfqId = context.request.parameters.id;

    var rfqRecord = record.load({
      type: "customrecord_abj_rfq",
      id: rfqId,
      isDynamic: true,
    });
    var rfqNo = rfqRecord.getValue("custrecord_abj_rfq_id") || rfqId;
    var Rptcurrency = rfqRecord.getText("custrecord_abj_rfq_currency");

    var todaydate = new Date();
    todaydate = format.format({
      value: todaydate,
      type: format.Type.DATE,
    });

    var class_activity_item = [];
    var class_activity = [];
    for (var counter = 0; counter < 2; counter++) {
      var vsublistid = "recmachcustrecord_abj_rfq_item_rfq";
      var fieldclass = "custrecord_abj_rfq_item_dept";
      var fielditem = "custrecord_abj_rfq_item_name";
      var fieldestAmnt = "custrecord_abj_rfq_item_est_amt";
      if (counter == 1) {
        vsublistid = "recmachcustrecord_abj_rfq_exp_rfq";
        fieldclass = "custrecord_abj_rfq_exp_class";
        fielditem = "custrecord_abj_rfq_exp_cat";
        fieldestAmnt = "custrecord_abj_rfq_exp_amt";
      }
      var lineTotal = rfqRecord.getLineCount({
        sublistId: vsublistid,
      });
      for (var i = 0; i < lineTotal; i++) {
        var classs = rfqRecord.getSublistValue({
          sublistId: vsublistid,
          fieldId: fieldclass,
          line: i,
        });
        var activity_code = rfqRecord.getSublistValue({
          sublistId: vsublistid,
          fieldId: "cseg_paactivitycode",
          line: i,
        });
        var classs_text = rfqRecord.getSublistText({
          sublistId: vsublistid,
          fieldId: fieldclass,
          line: i,
        });
        var activity_code_text = rfqRecord.getSublistText({
          sublistId: vsublistid,
          fieldId: "cseg_paactivitycode",
          line: i,
        });
        var item = rfqRecord.getSublistValue({
          sublistId: vsublistid,
          fieldId: fielditem,
          line: i,
        });
        log.debug("item", item);
        var item_text = rfqRecord.getSublistText({
          sublistId: vsublistid,
          fieldId: fielditem,
          line: i,
        });
        var estimatedAmnt = rfqRecord.getSublistValue({
          sublistId: vsublistid,
          fieldId: fieldestAmnt,
          line: i,
        });
        var itemLastPurchase = search
          .create({
            type: "item",
            columns: ["lastpurchaseprice"],
            filters: [{
              name: "internalid",
              operator: search.Operator.IS,
              values: item,
            }, ],
          })
          .run()
          .getRange({
            start: 0,
            end: 1
          });
        var lastPurchasePrice = 0;
        if (itemLastPurchase.length > 0)
          lastPurchasePrice = itemLastPurchase[0].getValue("lastpurchaseprice");
        class_activity_item.push({
          classs: classs,
          activity_code: activity_code,
          item: item,
          item_text: item_text,
          estimatedAmnt: estimatedAmnt,
          lastpurchaseprice: lastPurchasePrice,
        });

        class_activity.push({
          classs: classs,
          activity_code: activity_code,
          classs_text: classs_text,
          activity_code_text: activity_code_text,
        });
      }
    }
    var vendor_item_amount = [];
    var vendor_list = [];
    for (var counter = 0; counter < 2; counter++) {
      var vsublistid = "recmachcustrecord_abj_rfq_q_rfq";
      var fieldvendor = "custrecord_abj_rfq_q_vdr";
      var fielditem = "custrecord_abj_rfq_q_item";
      var fieldvalue = "custrecord_abj_rfq_q_amt";
      var fieldcurrency = "custrecord_abj_rfq_item_curr";
      if (counter == 1) {
        vsublistid = "recmachcustrecord_abj_rfq_qe_rfq";
        fieldvendor = "custrecord_abj_rfq_qe_vdr";
        fielditem = "custrecord_abj_rfq_qe_exp_cat";
        fieldvalue = "custrecord_abj_rfq_qe_amt";
        fieldcurrency = "custrecord_abj_rfq_exp_curr";
      }
      var lineTotal = rfqRecord.getLineCount({
        sublistId: vsublistid,
      });
      for (var i = 0; i < lineTotal; i++) {
        var vendor = rfqRecord.getSublistValue({
          sublistId: vsublistid,
          fieldId: fieldvendor,
          line: i,
        });
        var vendor_text = rfqRecord.getSublistText({
          sublistId: vsublistid,
          fieldId: fieldvendor,
          line: i,
        });
        var quoteamount = rfqRecord.getSublistValue({
          sublistId: vsublistid,
          fieldId: fieldvalue,
          line: i,
        });
        var quoteqty = 1;
        if (counter == 0) {
          quoteqty = rfqRecord.getSublistValue({
            sublistId: vsublistid,
            fieldId: "custrecord_abj_rfq_q_qty",
            line: i,
          });
        }
        var item = rfqRecord.getSublistValue({
          sublistId: vsublistid,
          fieldId: fielditem,
          line: i,
        });
        var item_text = rfqRecord.getSublistText({
          sublistId: vsublistid,
          fieldId: fielditem,
          line: i,
        });
        var quoteCurrency = rfqRecord.getSublistText({
          sublistId: vsublistid,
          fieldId: fieldcurrency,
          line: i,
        });
        Curr_exchage_Rate = Number(currency.exchangeRate({
          source: quoteCurrency,
          target: 'USD',
        }));
        quoteamount *= Curr_exchage_Rate;
        vendor_item_amount.push({
          vendor: vendor,
          item: item,
          item_text: item_text,
          quoteamount: quoteamount,
          quoteqty: quoteqty,
        });
        vendor_list.push({
          value: vendor,
          text: vendor_text,
        });
      }
    }
    var vsublistid = 'recmachcustrecord_abj_rfq_qa_rfq';
    var lineTotal = rfqRecord.getLineCount({
      sublistId: vsublistid,
    });

    var adtinfo = [];
    var vendor_adtinfo = [];
    for (var i = 0; i < lineTotal; i++) {
      var vendor = rfqRecord.getSublistValue({
        sublistId: vsublistid,
        fieldId: 'custrecord_abj_rfq_qa_vdr',
        line: i,
      });
      var AdtInfoName = rfqRecord.getSublistValue({
        sublistId: vsublistid,
        fieldId: 'custrecord_abj_rfq_qa_name',
        line: i,
      });
      var AdtInfoName_text = rfqRecord.getSublistText({
        sublistId: vsublistid,
        fieldId: 'custrecord_abj_rfq_qa_name',
        line: i,
      });
      var adtinfoDesc = rfqRecord.getSublistValue({
        sublistId: vsublistid,
        fieldId: 'custrecord_abj_rfq_qa_desc',
        line: i,
      }) || '';
      var adtinfoRemark = rfqRecord.getSublistValue({
        sublistId: vsublistid,
        fieldId: 'custrecord_abj_rfq_qa_remarks',
        line: i,
      }) || '';

      adtinfo.push({
        value: AdtInfoName,
        text: AdtInfoName_text,
      });

      vendor_adtinfo.push({
        adtinfo: AdtInfoName,
        vendor: vendor,
        adtinfoDesc: adtinfoDesc,
        adtinfoRemark: adtinfoRemark,
      });
    }

    function remove_duplicates_in_list(arr) {
      var uniques = [];
      var itemsFound = {};
      for (var i = 0, l = arr.length; i < l; i++) {
        var stringified = JSON.stringify(arr[i]);
        if (itemsFound[stringified]) {
          continue;
        }
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
      }
      return uniques;
    }

    class_activity_item = remove_duplicates_in_list(class_activity_item);
    class_activity = remove_duplicates_in_list(class_activity);
    vendor_list = remove_duplicates_in_list(vendor_list);
    adtinfo = remove_duplicates_in_list(adtinfo);

    log.debug("class_activity_item", class_activity_item);
    log.debug("class_activity", class_activity);
    log.debug("vendor_list", vendor_list);
    log.debug("vendor_item_amount", vendor_item_amount);

    var style = "<style type='text/css'>";
    style += ".tg  {border-collapse:collapse;border-spacing:10;width:100%;}";
    style += ".tgrow  {border-collapse:collapse;border-spacing:10;width:100%;}";
    style +=
      ".tg td{border-color:black;border-style:solid;border-width:0.5px;font-family:Arial, sans-serif;font-size:9px;overflow:hidden;word-break:normal;}";
    style +=
      ".tg .tg-headerlogo{border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    style +=
      ".tg .tg-headerrow_bold_big_font{align: center;font-size:18px;font-weight: bold;border-right: none;border-left: none;border-top: none;border-bottom: none;vertical-align:center;text-align:center;}";
    style +=
      ".tg .tg-headerrow{align: left;font-size:11px;word-break:break-all;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    style +=
      ".tg .tg-noborder_bigfont{font-size:17px;font-weight: bold;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    style +=
      ".tg .tg-noborder_12font{font-size:12px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    style +=
      ".tg .tg-12font{font-size:12px;}";
    style +=
      ".tg .tg-noborder{font-size:10px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    style +=
      ".tg .tg-noborder_right{align: right;font-size:10px;color:red;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    style +=
      ".tg .tg-kolomnomorpo{width:15%;font-size:12px;font-weight: bold;align: right;vertical-align:center;}";
    style +=
      ".tg .tg-headershipto{font-size:12px;font-weight: bold;align: center;}";
    style +=
      ".tg .tg-judultotal{font-size:11px;font-weight: bold;align: left;}";
    style +=
      ".tg .tg-kolomtotal{font-size:11px;font-weight: bold;align: right;}";
    style +=
      ".tg .tg-baris_right{font-size:10px;align: right;border-top: none;}";
    style += ".tg .tg-baris_left{font-size:10px;align: left;border-top: none;}";
    style += ".tg .tg-baris_left_border{font-size:11px;align: left;}";
    style += ".tg .tg-kolomdatapo{width:25%;align: left;font-size:10px;}";
    style += ".tg .tg-kolomshipto{align: center;font-size:10px;}";
    style +=
      ".tg .tg-bottomborder{border-right: none;border-left: none;border-top: none;}";
    style += ".div .d-word_rap{word-break:break-all;}";
    style += "</style>";

    var header =
      '<table class=\'tg\' width="100%"  style="table-layout:fixed;">';
    header += "<thead>";

    header += "<tr>";
    header +=
      "<th class='headerrow_bold_big_font' align='center' colspan='3'>Quotation Summary for RFQ-" +
      rfqNo +
      "</th>";
    header += "</tr>";
    header += "<tr>";
    header +=
      "<td class='tg-headerrow' style='width:30%'>Report Currency: " +
      Rptcurrency +
      "</td>";
    header += "<td class='tg-headerrow' style='width:40%'></td>";
    header +=
      "<td class='tg-headerrow' align='right' style='width:30%'>Date Generated: " +
      todaydate +
      "</td>";
    header += "</tr>";
    header += "</thead>";
    header += "</table>";

    var body =
      '<table class=\'tg\' width="100%" style="table-layout:fixed; margin-top:30px;">';
    body += "<tbody>";

    body += "<tr>";
    body += "<td>&nbsp;</td>";
    for (var idx in vendor_list) {
      var vendor_name = vendor_list[idx].text;
      body += "<td class='tg-12font'>" + vendor_name + "</td>";
    }
    body += "<td class='tg-12font'>Last Purchase Price Item</td>";
    body += "<td class='tg-12font'>Estimated Value</td>";
    body += "</tr>";
    var grandTotalAmount = [];
    var costSaving_arr = [];

    function formatCurrency(amount) {
      return format.format({
        value: amount,
        type: format.Type.CURRENCY
      });
    }
    for (var idx in class_activity) {
      var class_to_check = class_activity[idx].classs;
      var activity_to_check = class_activity[idx].activity_code;
      var class_text = class_activity[idx].classs_text;
      var activity_code_text = class_activity[idx].activity_code_text;
      body += "<tr>";
      body += "<td colspan='" + (vendor_list.length + 3) + "'>" + class_text + " - " + activity_code_text + "</td>";
      body += "</tr>";
      var SubTotal = [];
      for (var jdx in class_activity_item) {
        if (
          class_to_check == class_activity_item[jdx].classs &&
          activity_to_check == class_activity_item[jdx].activity_code
        ) {
          var item_to_check = class_activity_item[jdx].item;
          var item_text = class_activity_item[jdx].item_text;
          var lastPurchasePrice_text = parseFloat(class_activity_item[jdx].lastpurchaseprice || 0);
          //var lastPurchasePrice = parseFloat(lastPurchasePrice_text);
          var estimatedAmount_text = parseFloat(class_activity_item[jdx].estimatedAmnt);
          body += "<tr>";
          body += "<td><p style='margin-left: 10px;'>" + item_text + "</p></td>";
          for (var vdx in vendor_list) {
            body += "<td style=\"align: right;font-size:10px;\">";
            var vendor_to_check = vendor_list[vdx].value;
            for (var imdx in vendor_item_amount) {
              if (
                vendor_to_check == vendor_item_amount[imdx].vendor &&
                item_to_check == vendor_item_amount[imdx].item
              ) {
                var quoteAmount_text = vendor_item_amount[imdx].quoteamount;
                var quoteAmount = parseFloat(quoteAmount_text);
                var quoteqty = parseFloat(vendor_item_amount[imdx].quoteqty);
                lastPurchasePrice_text = lastPurchasePrice_text * quoteqty;
                body += formatCurrency(quoteAmount_text);

                var costSavingCalc = 0;
                if (lastPurchasePrice_text && (quoteAmount_text !== "")) {
                  var costSavingCalc = parseFloat(quoteAmount) - lastPurchasePrice_text;
                }
                var costAvoidedCalc = 0;
                if (estimatedAmount_text && (quoteAmount_text !== "")) {
                  var costAvoidedCalc = parseFloat(quoteAmount) - estimatedAmount_text;
                }

                var ceksubTotal = null;
                for (var index = 0; index < SubTotal.length; index++) {
                  if (SubTotal[index].vendor === vendor_to_check) {
                    ceksubTotal = index;
                  }
                }

                if (ceksubTotal !== null) {
                  SubTotal[ceksubTotal].amount = Number(SubTotal[ceksubTotal].amount) + quoteAmount;
                  SubTotal[ceksubTotal].costSaving = Number(SubTotal[ceksubTotal].costSaving) + costSavingCalc;
                  SubTotal[ceksubTotal].costAvoided = Number(SubTotal[ceksubTotal].costAvoided) + costAvoidedCalc;
                } else {
                  SubTotal.push({
                    vendor: vendor_to_check,
                    amount: quoteAmount,
                    costSaving: costSavingCalc,
                    costAvoided: costAvoidedCalc,
                  });
                }
              }
            }

            body += "</td>";
          }
          body += "<td style=\"align: right;font-size:10px;\">";
          body += formatCurrency(lastPurchasePrice_text);
          body += "</td>";
          body += "<td style=\"align: right;font-size:10px;\">";
          body += formatCurrency(estimatedAmount_text || 0);
          body += "</td>";
          body += "</tr>";
        }
      }
      body += "<tr>";
      body += "<td style='font-weight: bold;'>Subtotal</td>";
      log.debug("SubTotal arr", SubTotal);
      for (var vdx in vendor_list) {
        body += "<td style=\"font-weight: bold;align: right;font-size:10px;\">";
        var vendor_to_check = vendor_list[vdx].value;
        for (var imdx in SubTotal) {
          if (
            vendor_to_check == SubTotal[imdx].vendor
            /*&&
			item_to_check == vendor_item_amount[imdx].item*/
          ) {
            var subtotalAmount = parseFloat(SubTotal[imdx].amount);
            var costSaving = parseFloat(SubTotal[imdx].costSaving);
            var costAvoided = parseFloat(SubTotal[imdx].costAvoided);
            log.debug("subtotal1", subtotalAmount);
            log.debug("costSaving", costSaving);
            log.debug("costAvoided", costAvoided);
            grandTotalAmount.push({
              vendor: vendor_to_check,
              subtotal: subtotalAmount,
              costSaving: costSaving,
              costAvoided: costAvoided,
            });
          }
        }
        body += formatCurrency(subtotalAmount);
        body += "</td>";
      }
      body += "<td>&nbsp;</td>";
      body += "<td>&nbsp;</td>";
      body += "</tr>";
    }
    log.debug("GT", grandTotalAmount);
    log.debug("CS", costSaving_arr);
    body += "<tr>";
    body += "<td style='font-weight: bold;'>Total</td>"
    var grandTotalAmountResult = [];
    grandTotalAmount.reduce(function(res, value) {
      if (!res[value.vendor]) {
        res[value.vendor] = {
          vendor: value.vendor,
          subtotal: 0
        };
        grandTotalAmountResult.push(res[value.vendor])
      }
      res[value.vendor].subtotal += value.subtotal;
      return res;
    }, {});
    log.debug("AAA", grandTotalAmountResult);
    for (var idx in vendor_list) {
      var vendor_val = vendor_list[idx].value;
      for (var tdx in grandTotalAmountResult) {
        var vendor_to_check = grandTotalAmountResult[tdx].vendor;
        if (vendor_to_check == vendor_val) {
          body += "<td style=\"font-weight: bold;align: right;font-size:10px;\">" + formatCurrency(grandTotalAmountResult[tdx].subtotal) + "</td>";
        }
      }
    }
    body += "<td>&nbsp;</td>";
    body += "<td>&nbsp;</td>";
    body += "</tr>";

    body += "<tr>";
    body += "<td style='font-weight: bold;'>(Cost Saving) / Cost Up</td>"
    var grandTotalAmountResult = [];
    grandTotalAmount.reduce(function(res, value) {
      if (!res[value.vendor]) {
        res[value.vendor] = {
          vendor: value.vendor,
          costSaving: 0
        };
        grandTotalAmountResult.push(res[value.vendor])
      }
      res[value.vendor].costSaving += value.costSaving;
      return res;
    }, {});
    log.debug("AAA", grandTotalAmountResult);
    for (var idx in vendor_list) {
      var vendor_val = vendor_list[idx].value;
      for (var tdx in grandTotalAmountResult) {
        var vendor_to_check = grandTotalAmountResult[tdx].vendor;
        if (vendor_to_check == vendor_val) {
          body += "<td style=\"font-weight: bold;align: right;font-size:10px;\">" +
            formatCurrency(grandTotalAmountResult[tdx].costSaving || 0) + "</td>";
        }
      }
    }
    body += "</tr>";

    body += "<tr>";
    body += "<td style='font-weight: bold;'>(Cost Avoided)</td>"
    var grandTotalAmountResult = [];
    grandTotalAmount.reduce(function(res, value) {
      if (!res[value.vendor]) {
        res[value.vendor] = {
          vendor: value.vendor,
          costAvoided: 0
        };
        grandTotalAmountResult.push(res[value.vendor])
      }
      res[value.vendor].costAvoided += value.costAvoided;
      return res;
    }, {});
    log.debug("AAA", grandTotalAmountResult);
    for (var idx in vendor_list) {
      var vendor_val = vendor_list[idx].value;
      for (var tdx in grandTotalAmountResult) {
        var vendor_to_check = grandTotalAmountResult[tdx].vendor;
        if (vendor_to_check == vendor_val) {
          body += "<td style=\"font-weight: bold;align: right;font-size:10px;\">" +
            formatCurrency(grandTotalAmountResult[tdx].costAvoided || 0) + "</td>";
        }
      }
    }
    body += "</tr>";

    body += "<tr>";
    //body += "<td ><p style='margin-left: 10px;'></p></td>"
    body += "<td class='tg-noborder' >&nbsp;</td>";
    body += "</tr>";

    body += "<tr>";
    body += "<td style='font-weight: bold;'>Additional Information</td>"
    for (var tdx in vendor_list) {
      body += "<td ><p style='margin-left: 10px;'>" + vendor_list[tdx].text + "</p></td>";
    }
    body += "</tr>";
    log.debug("adtinfo", adtinfo);
    for (var idx in adtinfo) {
      body += "<tr>";
      body += "<td ><p style='margin-left: 10px;'>" + adtinfo[idx].text + "</p></td>";
      var adtinfo_to_check = adtinfo[idx].value;
      for (var tdx in vendor_list) {
        var vendor_to_check = vendor_list[tdx].value;
        for (var jdx in vendor_adtinfo) {
          if ((vendor_to_check == vendor_adtinfo[jdx].vendor) &&
            (adtinfo_to_check == vendor_adtinfo[jdx].adtinfo)) {
            var adtinfostr = vendor_adtinfo[jdx].adtinfoDesc;
            var adtinfoRemark = vendor_adtinfo[jdx].adtinfoRemark;
            if (adtinfoRemark)
              adtinfostr += '<br/>' + adtinfoRemark;
            body += "<td ><p style='margin-left: 10px;'>" + adtinfostr + "</p></td>";
          }
        }
      }
      body += "</tr>";
    }

    body += "</tbody>";
    body += "</table>";

    /*var xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n' +
      "<pdf>\n" +
      "<head>\n" +
      style +
      "</head>\n" +
      '<body size="A4-landscape" font-family="Tahoma,sans-serif" font-size="12"> ' +
      header +
      " \n " +
      body +
      "</body>\n" +
      "</pdf>";*/
    var footer = '';
    var headerHeight = '4%';
    var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
    xml += "<pdfset>";
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
    //
    xml += "<body font-size='12' size='A4-landscape' style='font-family: Tahoma,sans-serif; height: 29.7cm;width: 21cm;' " +
      "header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%' ";
    xml += ">";
    xml += body;
    xml += "\n</body>\n</pdf>";

    xml += "</pdfset>";

    xml = xml.replace(/ & /g, ' &amp; ');

    context.response.renderPdf({
      xmlString: xml,
    });
  }

  return {
    onRequest: onRequest,
  };
});