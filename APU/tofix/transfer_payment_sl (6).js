/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
  "N/ui/serverWidget",
  "N/search",
  "N/record",
  "N/url",
  "N/runtime",
  "N/currency",
  "N/error",
  "N/config",
  "N/task",
], function(serverWidget, search, record, url, runtime, currency, error, config, task) {
  function onRequest(context) {
    var contextRequest = context.request;

    if (contextRequest.method == "GET") {
      var form = serverWidget.createForm({
        title: "Transfer Payment",
      });
      var optionfield = form.addFieldGroup({
        id: "optionfieldid",
        label: "STUDENT",
      });
      var filteroption = form.addFieldGroup({
        id: "filteroption",
        label: "FILTER DATE",
      });
      var filterItem = form.addFieldGroup({
        id: "filterItem",
        label: "FILTER ITEM NO"
      });
      var filterRecord = form.addFieldGroup({
        id: "filterrecord",
        label: "FILTER RECORD"
      })
      var transfield = form.addFieldGroup({
        id: "trans",
        label: "TOTAL",
      });
      var custfieldItem = form.addField({
        id: "custpage_item_no",
        label: "ITEM NO TRANSFER OUT",
        type: serverWidget.FieldType.TEXT,
        container: "filterItem"
      });
      var customItemNoin = form.addField({
        id: "custpage_item_no_in",
        label: "ITEM NO TRANSFER IN",
        type: serverWidget.FieldType.TEXT,
        container: "filterItem"
      })
      var customFilterRocord = form.addField({
        id: "custpage_item_record",
        label: "EXECUTION MAX RECORD",
        type: serverWidget.FieldType.TEXT,
        container: "filterrecord"
      })
      var customerField = form.addField({
        id: "custpage_customer",
        label: "STUDENT",
        type: serverWidget.FieldType.SELECT,
        source: "customer",
        container: "optionfieldid",
      });
      var transdatefrom = form.addField({
        id: "custpage_transdatefrom",
        label: "DATE FROM",
        type: serverWidget.FieldType.DATE,
        container: "filteroption",
      });
      transdatefrom.defaultValue = new Date();

      var transdateto = form.addField({
        id: "custpage_transdateto",
        label: "DATE TO",
        type: serverWidget.FieldType.DATE,
        container: "filteroption",
      });
      transdateto.defaultValue = new Date();

      var transtotalField_out = form.addField({
        id: "custpage_transtotal_out",
        label: "TRANSFER OUT",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      transtotalField_out.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE, /// disable
      });
      transtotalField_out.defaultValue = 0.0;

      var transtotalField_in = form.addField({
        id: "custpage_transtotal_in",
        label: "TRANSFER IN",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      transtotalField_in.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE, /// disable
      });
      transtotalField_in.defaultValue = 0.0;

      var lastAmount_out = form.addField({
        id: "custpage_last_amount_out",
        label: "LAST AMOUNT OUT",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      lastAmount_out.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN, /// disable
      });
      lastAmount_out.defaultValue = 0.0;

      var lastAmount_in = form.addField({
        id: "custpage_last_amount_in",
        label: "LAST AMOUNT IN",
        type: serverWidget.FieldType.CURRENCY,
        container: "trans",
      });
      lastAmount_in.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN, /// disable
      });
      lastAmount_in.defaultValue = 0.0;

      // TRANSFER OUT
      // Sublist Coloumn
      var sublist_out = form.addSublist({
        id: "custpage_sublist_out",
        type: serverWidget.SublistType.INLINEEDITOR,
        label: "Transfer Out",
      });

      // Ceckbox Sublist
      sublist_out
        .addField({
          id: "sublist_out_select",
          label: "Select",
          type: serverWidget.FieldType.CHECKBOX,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      sublist_out
        .addField({
          id: "sublist_out_trans_item_no",
          label: "ITEM NO",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_out
        .addField({
          id: "sublist_out_trans_invoice_desc",
          label: "INVOICE DESCRIPTION",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_out
        .addField({
          id: "sublist_out_transdate",
          label: "DATE",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });
        sublist_out
        .addField({
          id: "sublist_out_trans_collected",
          label: "PAYMENT",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });
        sublist_out
        .addField({
          id: "sublist_out_trans_payment_balance",
          label: "PAYMENT BALANCE",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });
      
        sublist_out
        .addField({
          id: "sublist_out_trans_total_collected",
          label: "TOTAL COLLECTED",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

        sublist_out
        .addField({
          id: "sublist_out_trans_payable",
          label: "PAYABLE",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_out
        .addField({
          id: "sublist_out_trans_invoice_no",
          label: "INVOICE NO / PROFORMA INVC NO",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_out
        .addField({
          id: "sublist_out_trans_transfer_amount",
          label: "AMOUNT TRANSFER OUT",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      sublist_out
        .addField({
          id: "sublist_out_payment_id",
          label: "payment id",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

      sublist_out
        .addField({
          id: "sublist_out_trans_type",
          label: "trans type",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

      sublist_out
        .addField({
          id: "sublist_out_subsidiary",
          label: "subsidiary",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

      sublist_out
        .addField({
          id: "sublist_out_invcsoid",
          label: "Invoice/SO id",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
      // END TRANSFER OUT

      // START TRANSFER IN
      var sublist_in = form.addSublist({
        id: 'custpage_sublist_in',
        type: serverWidget.SublistType.INLINEEDITOR,
        label: 'Transfer In',
        tab: 'matchedtab'
      });

      // Ceckbox Sublist
      sublist_in
        .addField({
          id: "custpage_sublist_in_select",
          label: "Select",
          type: serverWidget.FieldType.CHECKBOX,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      sublist_in
        .addField({
          id: "custpage_sublist_in_trans_item_no",
          label: "ITEM NO",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_in
        .addField({
          id: "custpage_sublist_in_trans_item_desc",
          label: "INVOICE DESCRIPTION",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_in
        .addField({
          id: "custpage_sublist_in_trans_date",
          label: "DATE",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_in
        .addField({
          id: "custpage_sublist_in_trans_payable",
          label: "PAYABLE",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_in
        .addField({
          id: "custpage_sublist_in_trans_collected",
          label: "TOTAL COLLECTED",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_in
        .addField({
          id: "custpage_sublist_in_trans_balance",
          label: "BALANCE",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist_in
        .addField({
          id: "custpage_sublist_trans_transfer_amount",
          label: "AMOUNT TRANSFER IN",
          type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      sublist_in
        .addField({
          id: "custpage_trans_internalid",
          label: "internal id",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

      sublist_in
        .addField({
          id: "custpage_trans_type",
          label: "internal id",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

      sublist_in
        .addField({
          id: "custpage_subsidiary",
          label: "subsidiary",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
      // END TRANSFER IN

      form.addSubmitButton({
        label: "Submit",
      });

      form.addResetButton({
        label: "Clear",
      });

      form.addButton({
        id: 'buttonload',
        label: "Load Data",
        functionName: 'loadData',
      });

      form.clientScriptModulePath = "SuiteScripts/transfer_payment_cs.js";
      context.response.writePage(form);
    } else {
      var count = contextRequest.getLineCount({
        group: 'custpage_sublist_out'
      });
      log.debug("count custpage_sublist_out", count);
      var text_for_revDoc_url = '';
      var text_for_RefundDoc_url = '';
      var success_create_count = 0;
      var success_refund_count = 0;
      var failed_count = 0;
      var failed_refund_count = 0;
      var err_messages = '';
      var refund_err_messages = '';
      var record_Text;
      var payment_list = [];
      for (var i = 0; i < count; i++) {
        var transType = contextRequest.getSublistValue({
          group: 'custpage_sublist_out',
          name: 'sublist_out_trans_type',
          line: i
        });

        log.debug('transType0', transType);
        if (transType == 'CustInvc') {
          var payment_id = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_payment_id',
            line: i
          });
          payment_list.push(payment_id);
        }
      }
      log.debug('payment_list', payment_list);

      if (payment_list.length > 0) {
        var gltrans_pmts = search.load({
          id: 'customsearch_abj_gl_custpmt_deposit',
        });

        gltrans_pmts.filters.push(search.createFilter({
          name: 'internalid',
          operator: search.Operator.ANYOF,
          values: payment_list
        }, ));

        var gltrans_pmtset = gltrans_pmts.run();
        gltrans_pmts = gltrans_pmtset.getRange(0, 1000);

        log.debug('gltrans_pmt', gltrans_pmts);
      }
      for (var i = 0; i < count; i++) {
        try {

          var transNumber = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_payment_id',
            line: i
          });
          var invDesc = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_trans_invoice_desc',
            line: i
          })
          log.debug("transNumber", transNumber);

          var transDocNumber = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_trans_item_no',
            line: i
          });
          log.debug("transDocNumber", transDocNumber);

          var transType = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_trans_type',
            line: i
          });
          log.debug("transTypeget", transType);

          var subsidiary = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_subsidiary',
            line: i
          });
          log.debug("subsidiary", subsidiary);

          var transferoutAmount = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_trans_transfer_amount',
            line: i
          });
          log.debug("transferoutAmount", transferoutAmount);
          var InvcSOid = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_invcsoid',
            line: i
          });
          var paymentBalance = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_trans_payment_balance',
            line: i
          })
          var totalCollected = contextRequest.getSublistValue({
            group: 'custpage_sublist_out',
            name: 'sublist_out_trans_total_collected',
            line: i
          })
          log.debug("InvcSOid", InvcSOid);
          if (transType == 'CustInvc') {
            var JournalDoc = record.create({
              type: record.Type.JOURNAL_ENTRY,
              isDynamic: true,
            });
            JournalDoc.setValue({
              fieldId: 'subsidiary',
              value: subsidiary,
              ignoreFieldChange: false
            });
            /*today = new Date();
            JournalDoc.setValue({
            	fieldId: 'trandate',
            	value: today,
            	ignoreFieldChange: false
            });
            log.debug("today", today);*/

            //var line_datas = gl_trans[transNumber];
            //log.debug("line_datas", line_datas);
            var vsublistid = 'line';
            var lineidx = 0;
            gltrans_pmts.forEach(function(gltrans_pmt) {
              var trans_id = gltrans_pmt.getValue({
                name: 'internalid'
              });
              log.debug("trans_id", trans_id);
              if (trans_id == transNumber) {
                JournalDoc.selectLine({
                  sublistId: vsublistid,
                  line: lineidx
                });

                var account = gltrans_pmt.getValue({
                  name: 'account'
                });
                log.debug("account", account);
                JournalDoc.setCurrentSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'account',
                  value: account
                });

                var entity = gltrans_pmt.getValue({
                  name: 'entity'
                });
                log.debug("entity", entity);
                JournalDoc.setCurrentSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'entity',
                  value: entity
                });

                var debit = gltrans_pmt.getValue({
                  name: 'debitAmount'
                });
                log.debug("debit", debit);
                if (debit) {
                  JournalDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'debit',
                    value: 0
                  });
                  JournalDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'credit',
                    value: transferoutAmount
                  });
                }
                var credit = gltrans_pmt.getValue({
                  name: 'creditAmount'
                });
                log.debug("credit", credit);
                if (credit) {
                  JournalDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'debit',
                    value: transferoutAmount
                  });
                  JournalDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'credit',
                    value: 0
                  });
                }

                JournalDoc.commitLine(vsublistid);
                lineidx++;
              };
            });
            var JournalDocId = JournalDoc.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });

            log.debug("save revDocId", JournalDocId);
            if (JournalDocId) {
              var PaymentDoc = record.load({
                type: record.Type.CUSTOMER_PAYMENT,
                id: transNumber,
                isDynamic: true,
              });

              var pymt_line_to_unapply = PaymentDoc.findSublistLineWithValue({
                sublistId: 'apply',
                fieldId: 'internalid',
                value: InvcSOid
              });
			  
              log.debug("get pymt_line_to_unapply", pymt_line_to_unapply);
              PaymentDoc.selectLine({
                sublistId: 'apply',
                line: pymt_line_to_unapply
              });
			  
			  var currentPmtValue = PaymentDoc.getCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'amount',
              });
			  
              log.debug("currentPmtValue", currentPmtValue);

			  if (transferoutAmount==currentPmtValue) 
				PaymentDoc.setCurrentSublistValue({
					sublistId: 'apply',
					fieldId: 'apply',
					value: false
				});
			  else 
				PaymentDoc.setCurrentSublistValue({
					sublistId: 'apply',
					fieldId: 'amount',
					value: currentPmtValue-transferoutAmount
				});
				  
              PaymentDoc.commitLine('apply');
              log.debug("commit line", 'apply0');

              var pymt_line_to_apply = PaymentDoc.findSublistLineWithValue({
                sublistId: 'apply',
                fieldId: 'internalid',
                value: JournalDocId
              });
              log.debug("get pymt_line_to_apply", pymt_line_to_apply);
              PaymentDoc.selectLine({
                sublistId: 'apply',
                line: pymt_line_to_apply
              });

              PaymentDoc.setCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'apply',
                value: true
              });

              PaymentDoc.setCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'amount',
                value: transferoutAmount
              });
              log.debug("transferoutAmount", transferoutAmount);

              PaymentDoc.commitLine('apply');
              log.debug("commit line", 'apply');
              PaymentDoc.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
              });
            }

            if (text_for_revDoc_url) {
              text_for_revDoc_url += '05';
            }
            success_create_count += 1;

            text_for_revDoc_url += JournalDocId + '%';
          } else {
            /*var CustDepositRecord = record.delete({
            	type: record.Type.CUSTOMER_DEPOSIT,
            	id: transNumber,
            });*/
            var CustRefundRecord = record.transform({
              fromType: record.Type.CUSTOMER_DEPOSIT,
              fromId: transNumber,
              toType: record.Type.CUSTOMER_REFUND,
              isDynamic: true,
            });
            /*today = new Date();
            CustRefundRecord.setValue({
            	fieldId: 'trandate',
            	value: today,
            	ignoreFieldChange: false
            });*/
			var pymt_line_to_apply = CustRefundRecord.findSublistLineWithValue({
                sublistId: 'apply',
                fieldId: 'internalid',
                value: transNumber
              });
			  
            log.debug("get pymt_line_to_apply", pymt_line_to_apply);
            CustRefundRecord.selectLine({
                sublistId: 'apply',
                line: pymt_line_to_apply
              });
			  
			CustRefundRecord.setCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'due',
                value: transferoutAmount
            });  
			
			CustRefundRecord.commitLine('apply');
            
			log.debug("commit line", 'apply');
  
            var CustRefundId = CustRefundRecord.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            if (text_for_RefundDoc_url) {
              text_for_RefundDoc_url += '05';
            }
            text_for_RefundDoc_url += CustRefundId + '%';

            success_refund_count += 1;
          }
        } catch (e) {
          var err_msg = 'failed to process transaction # ' + transDocNumber + ' ' + e.name + ': ' + e.message + '<br/>';
          log.debug("Error messages", err_msg);
          if (transType == 'CustInvc') {
            failed_count += 1;
            err_messages += '&nbsp;' + err_msg;
          } else {
            failed_refund_count += 1;
            refund_err_messages += '&nbsp;' + err_msg;
          }
        }
      }

      count = contextRequest.getLineCount({
        group: 'custpage_sublist_in'
      });
      log.debug("count custpage_sublist_in", count);
      var text_for_PaymentDoc_url = '';
      var text_for_DepositDoc_url = '';
      var success_payment_count = 0;
      var success_deposit_count = 0;
      var failed_payment_count = 0;
      var failed_deposit_count = 0;
      var payment_err_messages = '';
      var deposit_err_messages = '';
      var customer = contextRequest.parameters.custpage_customer;
      for (var i = 0; i < count; i++) {
        try {
          var transNumber = contextRequest.getSublistValue({
            group: 'custpage_sublist_in',
            name: 'custpage_trans_internalid',
            line: i
          });
          log.debug("transNumber", transNumber);

          var transDocNumber = contextRequest.getSublistValue({
            group: 'custpage_sublist_in',
            name: 'custpage_sublist_in_trans_item_no',
            line: i
          });
          log.debug("transDocNumber", transDocNumber);

          var transType = contextRequest.getSublistValue({
            group: 'custpage_sublist_in',
            name: 'custpage_trans_type',
            line: i
          });
          log.debug("transType", transType);

          var transferinAmount = contextRequest.getSublistValue({
            group: 'custpage_sublist_in',
            name: 'custpage_sublist_trans_transfer_amount',
            line: i
          });
          log.debug("transferinAmount", transferinAmount);

          var subsidiary = contextRequest.getSublistValue({
            group: 'custpage_sublist_in',
            name: 'custpage_subsidiary',
            line: i
          });
          log.debug("subsidiary", subsidiary);

          if (transType == 'CustInvc') {
            var CustPaymentRecord = record.transform({
              fromType: record.Type.INVOICE,
              fromId: transNumber,
              toType: record.Type.CUSTOMER_PAYMENT,
              isDynamic: true,
            });
            /*today = new Date();
            CustPaymentRecord.setValue({
            	fieldId: 'trandate',
            	value: today,
            	ignoreFieldChange: false
            });*/

            /*CustPaymentRecord.setValue({
            	fieldId: 'account',
            	value: today,
            	ignoreFieldChange: false
            });
			
			CustPaymentRecord.setValue({
            	fieldId: 'payment',
            	value: transferinAmount,
            	ignoreFieldChange: false
            });
			log.debug("transferinAmount", transferinAmount);*/
			
            var pymt_line_to_apply = CustPaymentRecord.findSublistLineWithValue({
              sublistId: 'apply',
              fieldId: 'internalid',
              value: transNumber
            });
			
            log.debug("get pymt_line_to_apply", pymt_line_to_apply);
            CustPaymentRecord.selectLine({
              sublistId: 'apply',
              line: pymt_line_to_apply
            });

            /*CustPaymentRecord.setCurrentSublistValue({
            	sublistId: 'apply',
            	fieldId: 'apply',
            	value: true});

            */CustPaymentRecord.setCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'amount',
              value: transferinAmount
            });

            CustPaymentRecord.commitLine('apply');

            var CustPaymentId = CustPaymentRecord.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
			
            if (text_for_PaymentDoc_url) {
              text_for_PaymentDoc_url += '05';
            }
            text_for_PaymentDoc_url += CustPaymentId + '%';

            success_payment_count++;
          } else {
            var CustDepositDoc = record.create({
              type: record.Type.CUSTOMER_DEPOSIT,
              isDynamic: true,
            });

            /*today = new Date();
            CustDepositDoc.setValue({
            	fieldId: 'trandate',
            	value: today,
            	ignoreFieldChange: false
            });
            log.debug("today", today);*/

            CustDepositDoc.setValue({
              fieldId: 'customer',
              value: customer,
              ignoreFieldChange: false
            });
            log.debug("customer", customer);

            CustDepositDoc.setValue({
              fieldId: 'subsidiary',
              value: subsidiary,
              ignoreFieldChange: false
            });
            log.debug("subsidiary", subsidiary);

            CustDepositDoc.setValue({
              fieldId: 'salesorder',
              value: transNumber,
              ignoreFieldChange: false
            });
            log.debug("transNumber", transNumber);

            CustDepositDoc.setValue({
              fieldId: 'payment',
              value: transferinAmount,
              ignoreFieldChange: false
            });
            log.debug("transNumber", transNumber);

            var CustDepositDocId = CustDepositDoc.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });

            if (text_for_DepositDoc_url) {
              text_for_DepositDoc_url += '05';
            }
            text_for_DepositDoc_url += CustDepositDocId + '%';

            success_deposit_count++;
          }
        } catch (e) {
          var err_msg = 'failed to process transaction # ' + transDocNumber + ' ' + e.name + ': ' + e.message + '<br/>';
          log.debug("Error messages", err_msg);
          if (transType == 'CustInvc') {
            failed_payment_count += 1;
            payment_err_messages += '&nbsp;' + err_msg;
          } else {
            failed_deposit_count += 1;
            deposit_err_messages += '&nbsp;' + err_msg;
          }
        }
      }

      var html = '<html><body><h2>Process Result</h2>';

      var companyInfo = config.load({
        type: config.Type.COMPANY_INFORMATION
      });
      var appurl = companyInfo.getValue('appurl');

      if (success_create_count) {
        record_Text = 'Reversal Journal';
        text_for_revDoc_url = text_for_revDoc_url.slice(0, -1) + '&';
        revDocUrl = appurl + '/app/common/search/searchresults.nl?' +
          'searchtype=Transaction&Transaction_INTERNALID=' +
          text_for_revDoc_url + 'style=NORMAL&report=&grid=&searchid=1754&' +
          'sortcol=Transction_INTALID10_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=' +
          '50&_csrf=fPD3w5eSuD30lX5gm6V-kR1f1XNtETsRyOZyLW5LRFE8jdbPDx-' +
          'bDV6BVRzxcNraxQ-yFUGMqzFIbmAjMKk6nIBvMoHu9w4kczcq_aOJIirBhsAapiDNr0MUF18-' +
          'e515snjv1sKHVOKyY5uLtaCCiqKK1spyc-asxQY-vp0nFGM%3D&twbx=F';
		  
		/*var SearchTask = task.create({
			taskType: task.TaskType.SEARCH,
			savedSearchId: 'customsearch_abj_gl_trans_cust_pmt',
			params: {
				Transaction_INTERNALID: text_for_revDoc_url,
			}
		});
		var searchTaskId = SearchTask.submit();
		
		var revDocUrl = url.resolveTaskLink({
			id: searchTaskId,
		});*/

        log.debug("revDocUrl", revDocUrl);

        html += '<h3>Succesfully created&nbsp;<a href="' + revDocUrl + '">' + success_create_count + '</a>&nbsp;' + record_Text + ' record</h3>';
      }
	  
      if (success_refund_count) {
        record_Text = 'Student Refund';

        text_for_RefundDoc_url = text_for_RefundDoc_url.slice(0, -1) + '&';
        revDocUrl = appurl + '/app/common/search/searchresults.nl?' +
          'searchtype=Transaction&Transaction_INTERNALID=' +
          text_for_RefundDoc_url + 'style=NORMAL&' +
          'report=&grid=&searchid=1755&dle=&sortcol=Transction_INTALID10_raw&sortdir=' +
          'ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=ZANQGOZnijZIoZLeu5IIQdPRXnjx0dU' +
          'YjTApPiJo7-giTfz6pTyQAXO6XqLbvFDsRUGY7Hr6FJF1hWHkKRTu4s8QmdUTqICj3dkjaCzt' +
          '9NPyJy0qwHP4nYyoSXXXaS58t2tMUSW9x2ZKOSwkYvib44uYoVpwQSTLKOBAbNd9jmE%3D&twbx=F';

        log.debug("revDocUrl", revDocUrl);
        html += '<h3>Succesfully created&nbsp;<a href="' + revDocUrl + '">' + success_refund_count + '</a>&nbsp;' + record_Text + ' record</h3>';
      }

      if (success_payment_count) {
        record_Text = 'Student Payment';
        text_for_PaymentDoc_url = text_for_PaymentDoc_url.slice(0, -1) + '&';
        revDocUrl = appurl + '/app/common/search/searchresults.nl?searchtype=' +
          'Transaction&Transaction_INTERNALID=' +
          text_for_PaymentDoc_url + 'Transaction_TYPE=CustPymt' +
          '&style=NORMAL&report=&grid=&searchid=1756&dle=&sortcol=Transction_INTALID10' +
          '_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=xtLuWMz6iKab0IwVCKjr' +
          '8VMjf7OUWO8IScMbkwtP8M4C_zfoCzMQktuXrEbc2EMQONGGgeoe2sAyyqFa0k3w3MdACCAoklZU2' +
          'OrWxYvH9dafq91njEa-T7Odc68rTAnnlXaFU-V8b3yxiFDOE_GYUFXyd3LYaNj_NsJ1bLEm9FU%3D&twbx=F';
        log.debug("revDocUrl", revDocUrl);
        html += '<h3>Succesfully created&nbsp;<a href="' + revDocUrl + '">' + success_payment_count + '</a>&nbsp;' + record_Text + ' record</h3>';
      }

      if (success_deposit_count) {
        record_Text = 'Over Payment';
        text_for_DepositDoc_url = text_for_DepositDoc_url.slice(0, -1) + '&';
        revDocUrl = appurl + '/app/common/search/searchresults.nl?searchtype=' +
          'Transaction&Transaction_INTERNALID=' +
          text_for_DepositDoc_url + 'Transaction_TYPE=CustDep' +
          '&style=NORMAL&report=&grid=&searchid=1756&dle=&sortcol=Transction_INTALID10' +
          '_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=xtLuWMz6iKab0IwVCKjr' +
          '8VMjf7OUWO8IScMbkwtP8M4C_zfoCzMQktuXrEbc2EMQONGGgeoe2sAyyqFa0k3w3MdACCAoklZU2' +
          'OrWxYvH9dafq91njEa-T7Odc68rTAnnlXaFU-V8b3yxiFDOE_GYUFXyd3LYaNj_NsJ1bLEm9FU%3D&twbx=F';
        log.debug("revDocUrl", revDocUrl);
        html += '<h3>Succesfully created&nbsp;<a href="' + revDocUrl + '">' + success_deposit_count + '</a>&nbsp;' + record_Text + ' record</h3>';
      }

      if (failed_count) {
        record_Text = 'Reversal Journal';
        html += '<h3>Failed created ' + failed_count + ' ' + record_Text + ' record</h3>';
        html += '<h3>Error Messages:<br/> ' + err_messages + '</h3>';
      }

      if (failed_refund_count) {
        record_Text = 'Student Refund';
        html += '<h3>Failed created ' + failed_refund_count + ' ' + record_Text + ' record</h3>';
        html += '<h3>Error Messages:<br/> ' + refund_err_messages + '</h3>';
      }

      if (failed_payment_count) {
        record_Text = 'Student Payment';
        html += '<h3>Failed created ' + failed_payment_count + ' ' + record_Text + ' record</h3>';
        html += '<h3>Error Messages:<br/> ' + payment_err_messages + '</h3>';
      }

      if (failed_deposit_count) {
        record_Text = 'Over Payment';
        html += '<h3>Failed created ' + failed_deposit_count + ' ' + record_Text + ' record</h3>';
        html += '<h3>Error Messages:<br/> ' + deposit_err_messages + '</h3>';
      }

      html += '<input type="button" value="OK" onclick="history.back()">';
      html += '</body></html>';

      context.response.write(html);
      var scriptObj = runtime.getCurrentScript();
      log.debug({
        title: "Remaining usage units: ",
        details: scriptObj.getRemainingUsage()
      });
    }
  }
  return {
    onRequest: onRequest,
  };
});