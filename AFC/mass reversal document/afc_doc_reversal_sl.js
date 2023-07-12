/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/url', 'N/runtime', 'N/currency', 'N/error', 'N/config'],
  function(serverWidget, search, record, url, runtime, currency, error, config) {

    function onRequest(context) {
      var contextRequest = context.request;


      if (contextRequest.method == 'GET') {

        var form = serverWidget.createForm({
          title: 'Mass Reversal Document'
        });
        var DocOption = form.addField({
          id: 'doc_option',
          label: 'TRANSACTION TYPE',
          type: serverWidget.FieldType.SELECT
        });

        DocOption.addSelectOption({
          value: 'VendBill',
          text: 'Bill'
        });

        // DocOption.addSelectOption({
        // value: 'VendCred',
        // text: 'Bill Credit'
        // });

        DocOption.addSelectOption({
          value: 'CustInvc',
          text: 'Invoice'
        });

        // DocOption.addSelectOption({
        // value: 'CustCred',
        // text: 'Credit Memo'
        // });

        DocOption.addSelectOption({
          value: 'Journal',
          text: 'Journal Entry'
        });

        var subsidiaryField = form.addField({
          id: 'trans_subsidiary',
          label: 'SUBSIDIARY',
          type: serverWidget.FieldType.SELECT,
          source: 'subsidiary'
        });

        subsidiaryField.isMandatory = true;


        var transdatefrom = form.addField({
          id: 'trans_datefrom',
          label: 'TRANSACTION DATE FROM',
          type: serverWidget.FieldType.DATE,
        });

        var transdateto = form.addField({
          id: 'trans_dateto',
          label: 'TRANSACTION DATE TO',
          type: serverWidget.FieldType.DATE,
        });

        var recordsexcecution = form.addField({
          id: 'trans_records_execution',
          label: 'TRANSACTION RECORDS EXCECUTION',
          type: serverWidget.FieldType.INTEGER,
        });
        recordsexcecution.defaultValue = 100;
        var memoField = form.addField({
          id: 'trans_record_memo',
          label: 'MEMO',
          type: serverWidget.FieldType.TEXT,
        })
        var docCount = form.addField({
          id: 'trans_count_torvrs',
          label: 'NUMBER OF DOCUMENT TO REVERSE',
          type: serverWidget.FieldType.INTEGER
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE /// disable
        });

        
        docCount.defaultValue = 0;

        // Sublist Coloumn
        var sublist = form.addSublist({
          id: 'sublist',
          type: serverWidget.SublistType.INLINEEDITOR,
          label: 'Transaction List'
        });
        sublist.addButton({
          id: 'btnMarkAll',
          label: 'Mark All',
          functionName: 'MarkAll(true)'
        });
        sublist.addButton({
          id: 'btnUnMarkAll',
          label: 'Unmark All',
          functionName: 'MarkAll(false)'
        });
        // Ceckbox Sublist
        sublist.addField({
          id: 'sublist_select',
          label: 'Select',
          type: serverWidget.FieldType.CHECKBOX
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY
        });

        sublist.addField({
          id: 'sublist_transaction',
          label: 'TRANSACTION #',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'sublist_transaction_date',
          label: 'TRANSACTION DATE',
          type: serverWidget.FieldType.DATE
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'sublist_trans_type',
          label: 'TRANSACTION TYPE',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'sublist_trans_type_id',
          label: 'TRANSACTION TYPE',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        sublist.addField({
          id: 'sublist_name',
          label: 'NAME',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'sublist_memo',
          label: 'MEMO',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'sublist_currency',
          label: 'CURRENCY',
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'sublist_currency_id',
          label: 'CURRENCY',
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        sublist.addField({
          id: 'sublist_amount',
          label: 'TRANSACTION AMOUNT',
          type: serverWidget.FieldType.CURRENCY,
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        // sublist.addField({
        // id: 'sublist_department',
        // label: 'DEPARTMENT',
        // type: serverWidget.FieldType.TEXT,
        // }).updateDisplayType({
        // displayType: serverWidget.FieldDisplayType.DISABLED
        // });

        // sublist.addField({
        // id: 'sublist_class',
        // label: 'CLASS',
        // type: serverWidget.FieldType.TEXT,
        // }).updateDisplayType({
        // displayType: serverWidget.FieldDisplayType.DISABLED
        // });

        sublist.addField({
          id: 'sublist_trans_internalid',
          label: 'internal id',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        form.addSubmitButton({
          label: 'Submit',
        });

        form.addResetButton({
          label: 'Clear'
        });

        form.clientScriptModulePath = 'SuiteScripts/afc_doc_reversal_cs.js';
        context.response.writePage(form);
      } else {

        var count = contextRequest.getLineCount({
          group: 'sublist'
        });
        log.debug("count", count);
        var text_for_revDoc_url = '';
        var success_create_count = 0;
        var failed_count = 0;
        var err_messages = '';
        var record_Text;
        for (var i = 0; i < count; i++) {
          try {
            var selectVal = contextRequest.getSublistValue({
              group: 'sublist',
              name: 'sublist_select',
              line: i
            });

            log.debug({
              title: 'SELECT VAL',
              details: selectVal
            });

            var transNumber = contextRequest.getSublistValue({
              group: 'sublist',
              name: 'sublist_trans_internalid',
              line: i
            });
            log.debug("transNumber", transNumber);

            var transType = contextRequest.getSublistValue({
              group: 'sublist',
              name: 'sublist_trans_type_id',
              line: i
            });
            log.debug("transType", transType);

            //var transactionDate = contextRequest.parameters.sublist_transaction_date;
            //var requestedReceiptDate = contextRequest.parameters.sublist_requested_receipt_date;
            var TransToType;
            var TransFromType;
            var TransTypeURL;
            if (transType == 'VendBill') {
              TransToType = record.Type.VENDOR_CREDIT;
              TransFromType = record.Type.VENDOR_BILL;
              TransTypeURL = 'VendCred';
              record_Text = 'Bill Credit';
            } else if (transType == 'CustInvc') {
              TransToType = record.Type.CREDIT_MEMO;
              TransFromType = record.Type.INVOICE;
              TransTypeURL = 'CustCred';
              record_Text = 'Credit Memo';
            } else if (transType == 'Journal') {
              TransTypeURL = transType;
              record_Text = 'Journal Entry';
              TransFromType = record.Type.JOURNAL_ENTRY;
            }
            log.debug("transNumber", transNumber);
            log.debug("TransToType", TransToType);
            var ReverseDoc;
            if (transType == 'Journal') {
              ReverseDoc = record.copy({
                type: TransFromType,
                id: transNumber,
                isDynamic: true,
              });
              ReverseDoc.setValue({
                fieldId: 'custbody_abj_reverse_from_doc',
                value: transNumber,
                ignoreFieldChange: true
              });
              var vsublistid = 'line';
              var linecount = ReverseDoc.getLineCount({
                sublistId: vsublistid
              });
              for (var lineidx = 0; lineidx < linecount; lineidx++) {
                ReverseDoc.selectLine({
                  sublistId: vsublistid,
                  line: lineidx
                });
                var DebitAmnt = Number(ReverseDoc.getCurrentSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'debit'
                }) || 0);
                var CreditAmnt = Number(ReverseDoc.getCurrentSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'credit',
                }) || 0);
                if (DebitAmnt !== 0) {
                  ReverseDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'credit',
                    value: DebitAmnt
                  });
                  ReverseDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'debit',
                    value: 0
                  });
                } else if (CreditAmnt !== 0) {
                  ReverseDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'debit',
                    value: CreditAmnt
                  });
                  ReverseDoc.setCurrentSublistValue({
                    sublistId: vsublistid,
                    fieldId: 'credit',
                    value: 0
                  });
                }
                ReverseDoc.commitLine(vsublistid);
              }
            } else {
              ReverseDoc = record.transform({
                fromType: TransFromType,
                fromId: transNumber,
                toType: TransToType,
                isDynamic: true,
              });
            }

            var ReverseDocId = ReverseDoc.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });

            if (transType == 'Journal') {
              var ReverseSourceDoc = record.load({
                type: TransFromType,
                id: transNumber,
                isDynamic: true,
              });
              ReverseSourceDoc.setValue({
                fieldId: 'custbody_abj_reverse_from_doc',
                value: ReverseDocId,
                ignoreFieldChange: true
              });
              ReverseSourceDoc.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
              });
            }

            log.debug("save revDocId", ReverseDocId);

            if (text_for_revDoc_url) {
              text_for_revDoc_url += '05';
            }
            success_create_count += 1;

            text_for_revDoc_url += ReverseDocId + '%';
          } catch (e) {
            var err_msg = 'failed to generate from transaction #' + transNumber + ' ' + e.name + ': ' + e.message + '<br/>';
            log.debug("Error messages", err_msg);
            failed_count += 1;
            err_messages += '&nbsp;' + err_msg;
          }
        }
        text_for_revDoc_url = text_for_revDoc_url.slice(0, -1) + '&';
        var html = '<html><body><h2>Process Result</h2>';

        var companyInfo = config.load({
          type: config.Type.COMPANY_INFORMATION
        });
        var appurl = companyInfo.getValue('appurl');

        if (success_create_count) {
          revDocUrl = appurl + '/app/common/search/searchresults.nl?searchtype=' +
            'Transaction&Transaction_INTERNALID=' + text_for_revDoc_url + 'Transaction_TYPE=' + TransTypeURL + '&style=' +
            'NORMAL&report=&grid=&dle=F&sortcol=Transction_ORDTYPE9_raw&sortdir=' +
            'ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=7UX2OF93ffzysVJROm-n8agCYFL--' +
            'kJBhsm4LtOYVWG_XtTGBKQDaolcX0lMiFpFwy22UTdvUb-gNrr7Z4B7V1AA-StHd8P0DLD1bpHFAaatQi_' +
            'F4bNSab1hj6uDTCwKDlzSWiXMWc9RuuPDGkA_Kt2v94EPrUGMZuUh81-Xbpw%3D&twbx=F&scrollid=742' +
            '&searchid=742&refresh=&whence=';
          log.debug("revDocUrl", revDocUrl);

          html += '<h3>Succesfully created&nbsp;<a href="' + revDocUrl + '">' + success_create_count + '</a>&nbsp;' + record_Text + ' record</h3>';
        }
        if (failed_count) {
          html += '<h3>Failed created ' + failed_count + ' ' + record_Text + ' record</h3>';
          html += '<h3>Error Messages:<br/> ' + err_messages + '</h3>';
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
      onRequest: onRequest
    }

  })