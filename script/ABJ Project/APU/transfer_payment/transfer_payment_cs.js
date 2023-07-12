/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/search",
  "N/currentRecord",
  "N/query",
  "N/record",
  "N/format",
  "N/ui/dialog",
  "N/runtime",
  "N/ui/message",
], function(search, currentRecord, query, record, format, dialog, runtime, message) {
  var exports = {};

  function pageInit(scriptContext) {
    //
  }

  function format_date_for_save_search(vDate) {
    var vDate = new Date(vDate);
    var hari = vDate.getDate();
    var bulan = vDate.getMonth() + 1;
    var tahun = vDate.getFullYear();
    var vDate = hari + "/" + bulan + "/" + tahun;
    return vDate;
  }

  function loadData() {
    var vrecord = currentRecord.get();
    if (vrecord.getValue("custpage_customer") == '') {
      alert("Please select cutsomer first!");
    } else {
      let MsgProcess = message.create({
        title: 'Process',
        message: 'Please wait, data will loaded..',
        type: message.Type.INFORMATION
      });
      MsgProcess.show({
        duration: 5000 // will disappear after 5s
      });
      //alert("Please wait, data will loaded..");

      //setTimeout(MsgProcess.hide, 5000);

      // console.log("on refresh", records);
      var custpage_customer = vrecord.getValue("custpage_customer");
      var trans_date_from = vrecord.getValue("custpage_transdatefrom");
      if (trans_date_from) {
        trans_date_from = format_date_for_save_search(
          trans_date_from
        );
      }

      var trans_date_to = vrecord.getValue("custpage_transdateto");
      if (trans_date_to) {
        trans_date_to = format_date_for_save_search(trans_date_to);
      }

      refreshlist(
        custpage_customer,
        trans_date_from,
        trans_date_to,
        vrecord
      );
      //MsgProcess.hide();

      var scriptObj = runtime.getCurrentScript();
      console.log({
        title: "Remaining usage units: ",
        details: scriptObj.getRemainingUsage(),
      });
    }
  }

  function fieldChanged(context) {
    var vrecord = context.currentRecord;

    if (context.sublistId == "custpage_sublist_out" && context.fieldId == "sublist_out_select") {
      var transtotalfield_out = vrecord.getValue("custpage_transtotal_out");
      var selectVal_out = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_select",
      });

      var lastAmountInput = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_transfer_amount",
      });
      vrecord.setValue({
        fieldId: "custpage_last_amount_out",
        value: lastAmountInput,
        ignoreFieldChange: true,
      });

      if (selectVal_out) {
        var collectedRow = vrecord.getCurrentSublistValue({
          sublistId: "custpage_sublist_out",
          fieldId: "sublist_out_trans_collected",
        });
      } else {
        var collectedRow = '';
      }

      vrecord.setCurrentSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_transfer_amount",
        value: collectedRow,
        ignoreFieldChange: true,
      });

      if (selectVal_out) {
        transtotalfield_out += Number(
          vrecord.getCurrentSublistValue({
            sublistId: "custpage_sublist_out",
            fieldId: "sublist_out_trans_transfer_amount",
          })
        );
      } else {
        transtotalfield_out -= Number(lastAmountInput);
      }

      console.log("transtotalfield_out", transtotalfield_out);
      vrecord.setValue({
        fieldId: "custpage_transtotal_out",
        value: transtotalfield_out.toFixed(2),
        ignoreFieldChange: true,
      });
    }

    if (context.sublistId == "custpage_sublist_out" && context.fieldId == "sublist_out_trans_transfer_amount") {
      var transtotalfield_out = vrecord.getValue("custpage_transtotal_out");
      var changeVal_out = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_transfer_amount",
      });
      var collectedNow = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_out",
        fieldId: "sublist_out_trans_collected",
      });
      if (changeVal_out) {
        if (parseFloat(changeVal_out) > parseFloat(collectedNow)) {
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_out",
            fieldId: "sublist_out_trans_transfer_amount",
            value: collectedNow,
            ignoreFieldChange: true,
          });
        }
        // transtotalfield_out -= Number(
        //   vrecord.getCurrentSublistValue({
        //     sublistId: "custpage_sublist_out",
        //     fieldId: "sublist_out_trans_collected",
        //   })
        // );
        //
        // transtotalfield_out += Number(
        //   vrecord.getCurrentSublistValue({
        //     sublistId: "custpage_sublist_out",
        //     fieldId: "sublist_out_trans_transfer_amount",
        //   })
        // );
      }
      // vrecord.setValue({
      //   fieldId: "custpage_transtotal_out",
      //   value: transtotalfield_out.toFixed(2),
      //   ignoreFieldChange: true,
      // });

    }

    if (context.sublistId == "custpage_sublist_in" && context.fieldId == "custpage_sublist_in_select") {
      var transtotalfield_in = vrecord.getValue("custpage_transtotal_in") || 0;
      var transtotalfield_out = vrecord.getValue("custpage_transtotal_out") || 0;
      var selectVal_in = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_in_select",
      });

      var lastAmountInput = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_trans_transfer_amount",
      });
      vrecord.setValue({
        fieldId: "custpage_last_amount_in",
        value: lastAmountInput,
        ignoreFieldChange: true,
      });

      if (selectVal_in) {
        var payableRow = vrecord.getCurrentSublistValue({
          sublistId: "custpage_sublist_in",
          fieldId: "custpage_sublist_in_trans_payable",
        });
        var amountLeft = parseFloat(transtotalfield_out) - parseFloat(transtotalfield_in);
      } else {
        var payableRow = '';
        var amountLeft = '';
      }

      vrecord.setCurrentSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_trans_transfer_amount",
        value: amountLeft,
        ignoreFieldChange: true,
      });

      if (selectVal_in) {
        transtotalfield_in += Number(
          vrecord.getCurrentSublistValue({
            sublistId: "custpage_sublist_in",
            fieldId: "custpage_sublist_trans_transfer_amount",
          })
        );
      } else {
        transtotalfield_in -= Number(lastAmountInput);
      }

      console.log("transtotalfield_in", transtotalfield_in);
      vrecord.setValue({
        fieldId: "custpage_transtotal_in",
        value: transtotalfield_in.toFixed(2),
        ignoreFieldChange: true,
      });
    }

    if (context.sublistId == "custpage_sublist_in" && context.fieldId == "custpage_sublist_trans_transfer_amount") {
      var transtotalfield_in = parseFloat(vrecord.getValue("custpage_transtotal_in") || 0);
      var changeVal_in = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_trans_transfer_amount",
      });
      var payableNow = vrecord.getCurrentSublistValue({
        sublistId: "custpage_sublist_in",
        fieldId: "custpage_sublist_in_trans_payable",
      });
      if (changeVal_in) {
        if (parseFloat(changeVal_in) > parseFloat(payableNow)) {
          vrecord.setCurrentSublistValue({
            sublistId: "custpage_sublist_in",
            fieldId: "custpage_sublist_trans_transfer_amount",
            value: payableNow,
            ignoreFieldChange: true,
          });
        }

        // transtotalfield_in -= Number(
        //   vrecord.getCurrentSublistValue({
        //     sublistId: "custpage_sublist_in",
        //     fieldId: "custpage_sublist_in_trans_payable",
        //   })
        // );
        //
        // transtotalfield_in += Number(
        //   vrecord.getCurrentSublistValue({
        //     sublistId: "custpage_sublist_in",
        //     fieldId: "custpage_sublist_trans_transfer_amount",
        //   })
        // );
        //
        // vrecord.setValue({
        //   fieldId: "custpage_transtotal_in",
        //   value: transtotalfield_in.toFixed(2),
        //   ignoreFieldChange: true,
        // });
      }

    }
  }

  function sublistChanged(context) {
    var vrecord = context.currentRecord;
    // console.log("context.sublistId", context.sublistId);
    var lineTotal = vrecord.getLineCount({
      sublistId: context.sublistId,
    });
    // console.log("lineTotal", lineTotal);
    if (context.sublistId == "custpage_sublist_out") {
      var fieldId = "sublist_out_trans_transfer_amount";
      var fieldIdTotal = "custpage_transtotal_out";
    } else {
      var fieldId = "custpage_sublist_trans_transfer_amount";
      var fieldIdTotal = "custpage_transtotal_in";
    }
    var totalIN = 0;
    for (var i = 0; i < lineTotal; i++) {
      var amountTrans = vrecord.getSublistValue({
        sublistId: context.sublistId,
        fieldId: fieldId,
        line: i,
      }) || 0;
      console.log("amountTrans", amountTrans);
      totalIN += parseFloat(amountTrans);
    }
    console.log("totalIN", totalIN);
    vrecord.setValue({
      fieldId: fieldIdTotal,
      value: totalIN.toFixed(2),
      ignoreFieldChange: true,
    });
  }

  function refreshlist(custpage_customer, trans_date_from, trans_date_to, vrecord) {
    try {
      for (var counter = 0; counter < 2; counter++) {
        var vsublistid = 'custpage_sublist_out';
        if (counter == 1)
          vsublistid = 'custpage_sublist_in';
        var countsublist = vrecord.getLineCount({
          sublistId: vsublistid
        });
        while (countsublist > 0) {
          vrecord.removeLine({
            sublistId: vsublistid,
            line: countsublist - 1,
            ignoreRecalc: true
          });
          countsublist = vrecord.getLineCount({
            sublistId: vsublistid
          });
        }
      }

      console.log("custpage_customer", {
        custpage_customer: custpage_customer,
        trans_date_from: trans_date_from,
        trans_date_to: trans_date_to
      });

      var allPaymentData = search.load({
        id: "customsearch1748",
      });

      var allUnpaidData = search.load({
        id: "customsearchtransactiondefaultview_10",
      });

      if (custpage_customer) {
        allPaymentData.filters.push(
          search.createFilter({
            name: "entity",
            operator: search.Operator.IS,
            values: custpage_customer,
          })
        );
        allUnpaidData.filters.push(
          search.createFilter({
            name: "entity",
            operator: search.Operator.IS,
            values: custpage_customer,
          })
        );
      }

      const formula_trandate = "case when {salesorder}=' ' then {applyingtransaction.trandate} else {trandate} end";
      if (trans_date_from) {
        allPaymentData.filters.push(
          search.createFilter({
            name: "FORMULADATE",
            formula: formula_trandate,
            operator: search.Operator.ONORAFTER,
            values: trans_date_from,
          })
        );
        allUnpaidData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORAFTER,
            values: trans_date_from,
          })
        );
      }

      if (trans_date_to) {
        allPaymentData.filters.push(
          search.createFilter({
            name: "FORMULADATE",
            formula: formula_trandate,
            operator: search.Operator.ONORBEFORE,
            values: trans_date_to,
          })
        );
        allUnpaidData.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.ONORBEFORE,
            values: trans_date_to,
          })
        );
      }

      var allPaymentDataSet = allPaymentData.run();
      allPaymentData = allPaymentDataSet.getRange({
        start: 0,
        end: 100
      });
      var allUnpaidDataSet = allUnpaidData.run();
      allUnpaidData = allUnpaidDataSet.getRange({
        start: 0,
        end: 100
      });
      console.log("allPaymentData", allPaymentData);
      console.log("allUnpaidData", allUnpaidData);
      if (typeof allPaymentData !== "undefined" && typeof vrecord !== "undefined") {
        for (var i in allPaymentData) {
          var py = allPaymentData[i];
          var item_no_payment = py.getValue(allPaymentDataSet.columns[0]);
          var item_desc_payment = py.getValue(allPaymentDataSet.columns[1]);
          var payable_payment = py.getValue(allPaymentDataSet.columns[2]);
          var collacted_payment = py.getValue(allPaymentDataSet.columns[3]);
          var no_invoice = py.getValue(allPaymentDataSet.columns[4]);
          var trans_internal_id = py.getValue(allPaymentDataSet.columns[5]);
          var trans_type = py.getValue(allPaymentDataSet.columns[6]);
          var subsidiary = py.getValue(allPaymentDataSet.columns[7]);
          var InvcSOid = py.getValue(allPaymentDataSet.columns[8]);
          var transDate = py.getValue(allPaymentDataSet.columns[9]);
          transDate = format.format({
            value: transDate,
            type: format.Type.DATE,
          });
          // console.log("item_no_list", {
          //   item_no_payment: item_no_payment,
          //   item_desc_payment: item_desc_payment,
          //   payable_payment: payable_payment,
          //   collacted_payment: collacted_payment,
          //   no_invoice: no_invoice
          // });

          if (item_no_payment) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_trans_item_no",
              value: item_no_payment,
              ignoreFieldChange: true,
            });
          }

          if (item_desc_payment) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_trans_item_desc",
              value: item_desc_payment,
              ignoreFieldChange: true,
            });
          }

          if (payable_payment) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_trans_payable",
              value: payable_payment,
              ignoreFieldChange: true,
            });
          }

          if (collacted_payment) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_trans_collected",
              value: collacted_payment,
              ignoreFieldChange: true,
            });
          }

          if (no_invoice) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_trans_invoice_no",
              value: no_invoice,
              ignoreFieldChange: true,
            });
          }

          if (trans_internal_id) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_payment_id",
              value: trans_internal_id,
              ignoreFieldChange: true,
            });
          }

          if (trans_type) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_trans_type",
              value: trans_type,
              ignoreFieldChange: true,
            });
          }

          if (subsidiary) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_subsidiary",
              value: subsidiary,
              ignoreFieldChange: true,
            });
          }

          if (InvcSOid) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_invcsoid",
              value: InvcSOid,
              ignoreFieldChange: true,
            });
          }

          if (transDate) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_out",
              fieldId: "sublist_out_transdate",
              value: transDate,
              ignoreFieldChange: true,
            });
          }

          vrecord.commitLine({
            sublistId: "custpage_sublist_out",
            ignoreRecalc: true
          });
        }
      }

      if (typeof allUnpaidData !== "undefined" && typeof vrecord !== "undefined") {
        for (var i in allUnpaidData) {
          var up = allUnpaidData[i];
          var item_no_unpaid = up.getValue(allUnpaidDataSet.columns[0]);
          var item_desc_unpaid = up.getValue(allUnpaidDataSet.columns[1]);
          var payable_unpaid = up.getValue(allUnpaidDataSet.columns[2]);
          var collacted_unpaid = up.getValue(allUnpaidDataSet.columns[3]);
          var balance_unpaid = up.getValue(allUnpaidDataSet.columns[4]);
          var trans_internalid = up.getValue(allUnpaidDataSet.columns[5]);
          var trans_type = up.getValue(allUnpaidDataSet.columns[6]);
          var subsidiary = up.getValue(allUnpaidDataSet.columns[7]);
          var transDate = up.getValue(allPaymentDataSet.columns[8]);
          transDate = format.format({
            value: transDate,
            type: format.Type.DATE,
          });

          if (item_no_unpaid) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_sublist_in_trans_item_no",
              value: item_no_unpaid,
              ignoreFieldChange: true,
            });
          }

          if (item_desc_unpaid) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_sublist_in_trans_item_desc",
              value: item_desc_unpaid,
              ignoreFieldChange: true,
            });
          }

          if (payable_unpaid) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_sublist_in_trans_payable",
              value: payable_unpaid,
              ignoreFieldChange: true,
            });
          }

          if (collacted_unpaid) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_sublist_in_trans_collected",
              value: collacted_unpaid,
              ignoreFieldChange: true,
            });
          }

          if (balance_unpaid) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_sublist_in_trans_balance",
              value: balance_unpaid,
              ignoreFieldChange: true,
            });
          }

          if (trans_internalid) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_trans_internalid",
              value: trans_internalid,
              ignoreFieldChange: true,
            });
          }

          if (trans_type) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_trans_type",
              value: trans_type,
              ignoreFieldChange: true,
            });
          }

          if (subsidiary) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_subsidiary",
              value: subsidiary,
              ignoreFieldChange: true,
            });
          }

          if (transDate) {
            vrecord.setCurrentSublistValue({
              sublistId: "custpage_sublist_in",
              fieldId: "custpage_sublist_in_trans_date",
              value: transDate,
              ignoreFieldChange: true,
            });
          }

          vrecord.commitLine({
            sublistId: "custpage_sublist_in",
            ignoreRecalc: true
          });
        }
      }

    } catch (e) {
      console.log("Refresh List Function", e.name + ": " + e.message);
    }
  }

  function saveRecord(context) {
    var rec = context.currentRecord;
    var totaltransferout = rec.getValue('custpage_transtotal_out');
    var totaltransferin = rec.getValue('custpage_transtotal_in');
    if (!totaltransferout && !totaltransferin) {
      // window.alert('Please Select Transfer Out or/and Transfer in');
      let failed_dialog = {
        title: 'Error',
        message: "Please Select Transfer Out or/and Transfer in"
      };
      dialog.alert(failed_dialog);
      return false;
    }

    if (totaltransferout != totaltransferin) {
      // window.alert('Transfer Out and Transfer in must same');
      let failed_dialog = {
        title: 'Error',
        message: `Transfer Out and Transfer in must be equal. Now, Transfer Out : ${totaltransferout} and Transfer In : ${totaltransferin} `
      };
      dialog.alert(failed_dialog);
      return false;
    }

    for (var counter = 0; counter < 2; counter++) {

      var vsublistid = 'custpage_sublist_out';
      var fieldselect = 'sublist_out_select';
      if (counter == 1) {
        vsublistid = 'custpage_sublist_in';
        fieldselect = 'custpage_sublist_in_select';
      }
      var count = rec.getLineCount({
        sublistId: vsublistid
      });
      for (var idx = count - 1; idx >= 0; idx--) {
        var selectVal = false;
        try {
          var selectVal = rec.getSublistValue({
            sublistId: vsublistid,
            fieldId: fieldselect,
            line: idx
          });
          console.log("selectVal", selectVal);
          if (!selectVal) {
            console.log("remove line!!", selectVal);
            rec.removeLine({
              sublistId: vsublistid,
              line: idx,
              ignoreRecalc: true
            });
          }
        } catch (e) {
          console.log("error", e.name + ': ' + e.message);
        }
        console.log("var idx", idx);
        console.log("var count", count);
      }
    }

    return true;
  }

  exports.refreshlist = refreshlist;
  exports.fieldChanged = fieldChanged;
  exports.pageInit = pageInit;
  exports.loadData = loadData;
  exports.saveRecord = saveRecord;
  exports.sublistChanged = sublistChanged;

  return exports;
});