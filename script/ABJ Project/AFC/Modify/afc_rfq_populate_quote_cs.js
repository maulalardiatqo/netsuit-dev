/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope SameAccount
 */

define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/currentRecord", "N/log", "N/search", "N/url", "N/currency"],
  function(error, dialog, url, record, currentRecord, log, search, url, currency) {
    function pageInit(context) {
      //
    }

    function sublistChanged(context) {
      //
      try {
        var rec = context.currentRecord;
        var sublistName = context.sublistId;
        if ((sublistName == 'recmachcustrecord_abj_rfq_item_rfq') ||
          (sublistName == 'recmachcustrecord_abj_rfq_exp_rfq')) {

          var rfq_total = 0;
          var est_total = 0;
          for (var counter = 0; counter < 2; counter++) {
            if (counter == 0)
              sublistName = 'recmachcustrecord_abj_rfq_item_rfq';
            else
              sublistName = 'recmachcustrecord_abj_rfq_exp_rfq';

            var item_cnt = rec.getLineCount({
              sublistId: sublistName
            });
            log.debug("item_cnt", item_cnt);
            for (var idx_item = 0; idx_item < item_cnt; idx_item++) {
              var fldamountid = 'custrecord_abj_rfq_item_amt';
              if (sublistName == 'recmachcustrecord_abj_rfq_exp_rfq')
                fldamountid = 'custrecord_abj_rfq_exp_amt';
              var f_itm_amount = Number(rec.getSublistValue({
                sublistId: sublistName,
                fieldId: fldamountid,
                line: idx_item,
              }) || 0);
              rfq_total += f_itm_amount;

              var fldest_amountid = 'custrecord_abj_rfq_item_est_amt';
              if (sublistName == 'recmachcustrecord_abj_rfq_exp_rfq')
                fldest_amountid = 'custrecord_abj_rfq_exp_est_amt';
              var f_est_amount = Number(rec.getSublistValue({
                sublistId: sublistName,
                fieldId: fldest_amountid,
                line: idx_item,
              }) || 0);
              est_total += f_est_amount;
            }
          }
          if (est_total)
            rec.setValue({
              fieldId: 'custrecord_abj_rfq_pr_total',
              value: est_total
            });
          if (rfq_total)
            rec.setValue({
              fieldId: 'custrecord_abj_rfq_total',
              value: rfq_total
            });
          return true;
        }
      } catch (e) {
        var errmsg = "Error in validate line event " + e.name + ' : ' + e.message;
        log.debug(errmsg);
        var failed_dialog = {
          title: 'Process Result',
          message: errmsg
        };
        dialog.alert(failed_dialog);
        return false;
      }
    }

    function fieldChanged(context) {
      //
      function roundToTwo(num) {
        return +(Math.round(num + "e+2") + "e-2");
      }

      try {
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        var rec = context.currentRecord;
        var sublist_From;
        if (sublistName == 'recmachcustrecord_abj_rfq_item_rfq') {
          if (sublistFieldName == 'custrecord_abj_rfq_item_award_vdr') {
            var vendor = rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: sublistFieldName
            });
            var item = rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_rfq_item_name'
            });
            sublist_From = 'recmachcustrecord_abj_rfq_q_rfq';
            var item_cnt = rec.getLineCount({
              sublistId: sublist_From
            });
            log.debug("item_cnt", 'item_cnt');
            for (var idx_item = 0; idx_item < item_cnt; idx_item++) {
              var vendor_to_check = rec.getSublistValue({
                sublistId: sublist_From,
                fieldId: 'custrecord_abj_rfq_q_vdr',
                line: idx_item,
              });
              var item_to_check = rec.getSublistValue({
                sublistId: sublist_From,
                fieldId: 'custrecord_abj_rfq_q_item',
                line: idx_item,
              });
              if ((vendor == vendor_to_check) && (item == item_to_check)) {
                log.debug("vendor_to_check", vendor_to_check);
                log.debug("item_to_check", item_to_check);
                var Quote_Rate = Number(rec.getSublistValue({
                  sublistId: sublist_From,
                  fieldId: 'custrecord_abj_rfq_q_rate',
                  line: idx_item,
                }) || 0);
                var Quote_Amount = Number(rec.getSublistValue({
                  sublistId: sublist_From,
                  fieldId: 'custrecord_abj_rfq_q_amt',
                  line: idx_item,
                }) || 0);
                var Quote_Curr = rec.getSublistValue({
                  sublistId: sublist_From,
                  fieldId: 'custrecord_abj_rfq_item_curr',
                  line: idx_item,
                });
                log.debug('Quote_Rate', Quote_Rate);
                log.debug('Quote_Amount', Quote_Amount);
                log.debug('Quote_Curr', Quote_Curr);
                var Curr_exchage_Rate = 1;
                if (Quote_Curr)
                  Curr_exchage_Rate = Number(currency.exchangeRate({
                    source: Quote_Curr,
                    target: 'USD',
                  }));

                var item_rate = roundToTwo(Quote_Rate * Curr_exchage_Rate);
                var item_qty = Number(rec.getCurrentSublistValue({
                  sublistId: sublistName,
                  fieldId: 'custrecord_abj_rfq_item_qty'
                }) || 0);
                var item_amount = item_rate * item_qty;

                log.debug('item_rate', item_rate);
                log.debug('item_qty', item_qty);
                log.debug('item_amount', item_amount);

                rec.setCurrentSublistValue({
                  sublistId: sublistName,
                  fieldId: 'custrecord_abj_rfq_item_unitprice',
                  value: item_rate
                });
                rec.setCurrentSublistValue({
                  sublistId: sublistName,
                  fieldId: 'custrecord_abj_rfq_item_amt',
                  value: item_amount
                });
                rec.setCurrentSublistValue({
                  sublistId: sublistName,
                  fieldId: 'custrecord_abj_item_qrate',
                  value: Quote_Rate
                });
                rec.setCurrentSublistValue({
                  sublistId: sublistName,
                  fieldId: 'custrecord_abj_rfq_item_qamt',
                  value: Quote_Amount
                });
                rec.setCurrentSublistValue({
                  sublistId: sublistName,
                  fieldId: 'custrecord_abj_rfq_item_qcurr',
                  value: Quote_Curr
                });
                rec.setCurrentSublistValue({
                  sublistId: sublistName,
                  fieldId: 'custrecord_abj_rfq_item_xchgrate',
                  value: Curr_exchage_Rate
                });
                break;
              }
            }
          }
          if ((sublistFieldName == 'custrecord_abj_rfq_item_qty') ||
            (sublistFieldName == 'custrecord_abj_rfq_item_unitprice') ||
            (sublistFieldName == 'custrecord_abj_rfq_item_est_unitprice') ||
            (sublistFieldName == '	custrecord_abj_item_qrate')) {
            var f_qty = Number(rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_rfq_item_qty'
            }) || 0);
            var f_unit_price = Number(rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_rfq_item_unitprice'
            }) || 0);
            var f_amount = f_qty * f_unit_price;
            rec.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_rfq_item_amt',
              value: f_amount
            });

            var f_est_unit_price = Number(rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_rfq_item_est_unitprice'
            }) || 0);
            var f_est_amount = f_qty * f_est_unit_price;
            rec.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_rfq_item_est_amt',
              value: f_est_amount
            });

            var f_quote_unit_price = Number(rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_item_qrate'
            }) || 0);
            var f_quote_amount = f_qty * f_quote_unit_price;
            rec.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'custrecord_abj_rfq_item_qamt',
              value: f_quote_amount
            });

          }
        }
        if ((sublistName == 'recmachcustrecord_abj_rfq_q_rfq') &&
          ((sublistFieldName == 'custrecord_abj_rfq_q_qty') ||
            (sublistFieldName == 'custrecord_abj_rfq_q_rate'))) {
          var f_qt_qty = Number(rec.getCurrentSublistValue({
            sublistId: sublistName,
            fieldId: 'custrecord_abj_rfq_q_qty'
          }) || 0);
          var f_qt_unit_price = Number(rec.getCurrentSublistValue({
            sublistId: sublistName,
            fieldId: 'custrecord_abj_rfq_q_rate'
          }) || 0);
          var f_qt_amount = f_qt_qty * f_qt_unit_price;

          rec.setCurrentSublistValue({
            sublistId: sublistName,
            fieldId: 'custrecord_abj_rfq_q_amt',
            value: f_qt_amount
          });
        }


        if ((sublistName == 'recmachcustrecord_abj_rfq_exp_rfq') && (sublistFieldName == 'custrecord_abj_rfq_exp_award_vdr')) {
          var vendor = rec.getCurrentSublistValue({
            sublistId: sublistName,
            fieldId: sublistFieldName
          });
          var item = rec.getCurrentSublistValue({
            sublistId: sublistName,
            fieldId: 'custrecord_abj_rfq_exp_cat'
          });
          sublist_From = 'recmachcustrecord_abj_rfq_qe_rfq';
          var item_cnt = rec.getLineCount({
            sublistId: sublist_From
          });
          log.debug("item_cnt", 'item_cnt');
          for (var idx_item = 0; idx_item < item_cnt; idx_item++) {
            var vendor_to_check = rec.getSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_qe_vdr',
              line: idx_item,
            });
            var item_to_check = rec.getSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_qe_exp_cat',
              line: idx_item,
            });
            if ((vendor == vendor_to_check) && (item == item_to_check)) {
              log.debug("vendor_to_check", vendor_to_check);
              log.debug("item_to_check", item_to_check);
              var Quote_Amount = Number(rec.getSublistValue({
                sublistId: sublist_From,
                fieldId: 'custrecord_abj_rfq_qe_amt',
                line: idx_item,
              }) || 0);
              var Quote_Curr = rec.getSublistValue({
                sublistId: sublist_From,
                fieldId: 'custrecord_abj_rfq_exp_curr',
                line: idx_item,
              });
              log.debug('Quote_Amount', Quote_Amount);
              log.debug('Quote_Curr', Quote_Curr);
              var Curr_exchage_Rate = 1;
              if (Quote_Curr)
                Curr_exchage_Rate = Number(currency.exchangeRate({
                  source: Quote_Curr,
                  target: 'USD',
                }));

              var item_amount = roundToTwo(Quote_Amount * Curr_exchage_Rate);

              log.debug('item_amount', item_amount);

              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'custrecord_abj_rfq_exp_amt',
                value: item_amount
              });
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'custrecord_abj_rfq_exp_qamt',
                value: Quote_Amount
              });
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'custrecord_abj_rfq_exp_qcurr',
                value: Quote_Curr
              });
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'custrecord_abj_rfq_exp_xchgrate',
                value: Curr_exchage_Rate
              });
              break;
            }
          }
        }

        if ((sublistName == 'recmachcustrecord_abj_rfq_vdr_rfq') &&
          (sublistFieldName == 'custrecord_abj_rfq_vdr')) {
          var vendorName = rec.getCurrentSublistText({
            sublistId: sublistName,
            fieldId: sublistFieldName
          });
          log.debug('vendorName', vendorName);
          rec.setCurrentSublistValue({
            sublistId: sublistName,
            fieldId: 'name',
            value: vendorName
          });
        }
      } catch (e) {
        var errmsg = "Error in field change event " + e.name + ' : ' + e.message;
        log.debug(errmsg);
        var failed_dialog = {
          title: 'Process Result',
          message: errmsg
        };
        dialog.alert(failed_dialog);
      }
    }

    function populateQuoteList(context) {
      try {
        // var dlgoptions = {
        // title: 'Request for Quotation',
        // message: 'Populate Quotation List...'
        // };

        // dialog.alert(dlgoptions);

        var currRec = currentRecord.get();
        var id = currRec.id;
        var rec = record.load({
          type: 'customrecord_abj_rfq',
          id: id,
          isDynamic: true
        });
        console.log("rec", rec);
        var vndr_cnt = rec.getLineCount({
          sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq'
        });
        console.log("vndr_cnt", vndr_cnt);
        if (!vndr_cnt) {
          var failed_dialog = {
            title: 'Request for Quotation',
            message: 'Please define vendor in vendor list ' +
              'before populate quotation list'
          };
          dialog.alert(failed_dialog);
          return false;
        };

        function remove_all_lines(sublist_to_remove) {
          var count_to_delete = rec.getLineCount({
            sublistId: sublist_to_remove
          });
          for (var idx = count_to_delete - 1; idx >= 0; idx--) {
            rec.removeLine({
              sublistId: sublist_to_remove,
              line: idx,
              ignoreRecalc: true
            });
            console.log("var idx", idx);
            console.log("var count", count_to_delete);
          }
        }
        remove_all_lines('recmachcustrecord_abj_rfq_q_rfq');
        remove_all_lines('recmachcustrecord_abj_rfq_qe_rfq');
        remove_all_lines('recmachcustrecord_abj_rfq_qa_rfq');

        for (var idx_vendor = 0; idx_vendor < vndr_cnt; idx_vendor++) {
          rec.selectLine({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            line: idx_vendor
          });
          var vendor = rec.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_vdr',
            line: idx_vendor,
          });
          var item_cnt = rec.getLineCount({
            sublistId: 'recmachcustrecord_abj_rfq_item_rfq'
          });
          //-- item list
          var sublist_From = 'recmachcustrecord_abj_rfq_item_rfq';
          var sublist_To = 'recmachcustrecord_abj_rfq_q_rfq';

          for (var idx_item = 0; idx_item < item_cnt; idx_item++) {
            console.log("sublist_From", sublist_From);
            console.log("sublist_To", sublist_To);
            rec.selectLine({
              sublistId: sublist_From,
              line: idx_item
            });
            var item = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_item_name'
            });
            var item_desc = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_item_desc'
            });
            var quantity = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_item_qty'
            });
            var item_unit = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_item_units'
            });
            rec.selectNewLine({
              sublistId: sublist_To
            });
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_q_vdr',
              value: vendor,
            });
            console.log("item", vendor);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_q_item',
              value: item,
            });
            console.log("item", item);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_q_desc',
              value: item_desc,
            });
            console.log("item_desc", item_desc);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_q_qty',
              value: quantity,
            });
            console.log("quantity", quantity);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_q_uom',
              value: item_unit,
            });
            console.log("item_unit", item_unit);
            rec.commitLine(sublist_To);
          }
          //-- expense list
          sublist_From = 'recmachcustrecord_abj_rfq_exp_rfq';
          sublist_To = 'recmachcustrecord_abj_rfq_qe_rfq';

          item_cnt = rec.getLineCount({
            sublistId: sublist_From
          });
          for (var idx_item = 0; idx_item < item_cnt; idx_item++) {
            console.log("sublist_From", sublist_From);
            console.log("sublist_To", sublist_To);
            rec.selectLine({
              sublistId: sublist_From,
              line: idx_item
            });
            var item = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_exp_cat'
            });
            var item_desc = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_exp_desc'
            });
            var account = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_exp_acct'
            });

            rec.selectNewLine({
              sublistId: sublist_To
            });
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_qe_vdr',
              value: vendor,
            });
            console.log("vendor", vendor);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_qe_exp_cat',
              value: item,
            });
            console.log("item", item);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_qe_desc',
              value: item_desc,
            });
            console.log("item_desc", item_desc);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_qe_acct',
              value: account,
            });
            console.log("account", account);
            rec.commitLine(sublist_To);
          }

          //-- adt info
          sublist_From = 'recmachcustrecord_abj_rfq_addinfo_rfq';
          sublist_To = 'recmachcustrecord_abj_rfq_qa_rfq';
          item_cnt = rec.getLineCount({
            sublistId: sublist_From
          });
          for (var idx_item = 0; idx_item < item_cnt; idx_item++) {
            console.log("sublist_From", sublist_From);
            console.log("sublist_To", sublist_To);
            rec.selectLine({
              sublistId: sublist_From,
              line: idx_item
            });
            var adt_info_name = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_addinfo_name'
            });
            var adt_info_desc = rec.getCurrentSublistValue({
              sublistId: sublist_From,
              fieldId: 'custrecord_abj_rfq_addinfo_desc'
            });
            rec.selectNewLine({
              sublistId: sublist_To
            });
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_qa_vdr',
              value: vendor,
            });
            console.log("vendor", vendor);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_qa_name',
              value: adt_info_name,
            });
            console.log("adt_info_name", adt_info_name);
            rec.setCurrentSublistValue({
              sublistId: sublist_To,
              fieldId: 'custrecord_abj_rfq_qa_desc',
              value: adt_info_desc,
            });
            console.log("adt_info_desc", adt_info_desc);
            rec.commitLine(sublist_To);
          }
        }
        rec.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });

        function success(result) {
          window.location.reload();
        }

        function failure(reason) {
          console.log('Failure: ' + reason);
        }

        var success_msg = "Success populate quotation list";
        console.log(success_msg);
        var success_dialog = {
          title: 'Process Result',
          message: success_msg
        };
        dialog.alert(success_dialog).then(success).catch(failure);
        return true;
      } catch (e) {
        var errmsg = "Error when populate quoate list " + e.name + ' : ' + e.message;
        console.log(errmsg);
        var failed_dialog = {
          title: 'Process Result',
          message: errmsg
        };
        dialog.alert(failed_dialog);
      }

    }

    return {
      pageInit: pageInit,
      populateQuoteList: populateQuoteList,
      fieldChanged: fieldChanged,
      sublistChanged: sublistChanged,
      // saveRecord: saveRecord
    };
  });