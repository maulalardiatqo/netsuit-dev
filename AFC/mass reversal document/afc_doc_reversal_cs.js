/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/currentRecord', 'N/query', 'N/record', 'N/format', 'N/ui/dialog', 'N/runtime'],
  function(search, currentRecord, query, record, format, dialog, runtime) {
    var exports = {};

    function MarkAll(flag) {
      var rec = currentRecord.get();
      var count = rec.getLineCount({
        sublistId: 'sublist'
      });
      console.log("count", count);
      for (var idx = 0; idx < count; idx++) {
        try {
          rec.selectLine({
            sublistId: 'sublist',
            line: idx
          });
          rec.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_select',
            value: flag,
          });
          rec.commitLine({
            sublistId: 'sublist'
          });
        } catch (e) {
          console.log("error in MarkAll", e.name + ': ' + e.message);
        }
        console.log("var idx", idx);
        console.log("var count", count);
      }
    }

    function saveRecord(context) {
      var rec = context.currentRecord;
      var doccount = rec.getValue('trans_count_torvrs');
      if (!doccount) {
        window.alert('Please Select Transaction');
        return false;
      }

      var count = rec.getLineCount({
        sublistId: 'sublist'
      });
      for (var idx = count - 1; idx >= 0; idx--) {
        var selectVal = false;
        try {
          var selectVal = rec.getSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_select',
            line: idx
          });
          console.log("selectVal", selectVal);
          if (!selectVal) {
            console.log("remove line!!", selectVal);
            rec.removeLine({
              sublistId: 'sublist',
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

      return true;
    }

    function fieldChanged(context) {
      function format_date_for_save_search(vDate) {
        var vDate = new Date(vDate);
        var hari = vDate.getDate();
        var bulan = vDate.getMonth() + 1;
        var tahun = vDate.getFullYear();
        var vDate = hari + '/' + bulan + '/' + tahun;
        return vDate;
      }

      var vrecord = context.currentRecord;
      if ((context.fieldId == 'trans_subsidiary') ||
        (context.fieldId == 'doc_option') ||
        (context.fieldId == 'trans_datefrom') ||
        (context.fieldId == 'trans_dateto') ||
        (context.fieldId == 'trans_records_execution') ||
        (context.fieldId == 'trans_record_memo')
      ) {
   
        //var sublist = vrecord.getSublist('sublist');
        var transType = vrecord.getValue('doc_option');
        var subsidiary = vrecord.getValue('trans_subsidiary');
        var recordExecution = vrecord.getValue('trans_records_execution');
        var memo = vrecord.getValue('trans_record_memo');
        console.log("recordExecution", recordExecution);
        console.log('memo', memo);

        console.log('transType', transType);

        var transaction_date_from = vrecord.getValue('trans_datefrom');
        if (transaction_date_from) {
          transaction_date_from = format_date_for_save_search(transaction_date_from);
        }
        console.log('transaction_date_from', transaction_date_from);

        var transaction_date_to = vrecord.getValue('trans_dateto');
        if (transaction_date_to) {
          transaction_date_to = format_date_for_save_search(transaction_date_to);
        }
        console.log('transaction_date_to', transaction_date_to);

        if (subsidiary == '') {
          return
        };

        refreshlist(transType, transaction_date_from, transaction_date_to, subsidiary, recordExecution, vrecord, memo);


        var scriptObj = runtime.getCurrentScript();
        console.log({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });
      }
      if ((context.sublistId == 'sublist') && (context.fieldId == 'sublist_select')) {
        var totalcount = vrecord.getValue('trans_count_torvrs');
        var selectVal = vrecord.getCurrentSublistValue({
          sublistId: 'sublist',
          fieldId: 'sublist_select'
        });
        if (selectVal) {
          totalcount++;
        } else {
          if (totalcount > 0) totalcount--;
        }
        console.log('totalcount', totalcount);
        vrecord.setValue({
          fieldId: 'trans_count_torvrs',
          value: totalcount,
          ignoreFieldChange: true
        });
      }
    }

    function refreshlist(transType, transaction_date_from, transaction_date_to, subsidiary, recordExecution, vrecord, memo) {
      try {
        var countsublist = vrecord.getLineCount({
          sublistId: 'sublist'
        });

        while (countsublist > 0) {
          vrecord.removeLine({
            sublistId: 'sublist',
            line: countsublist - 1,
            ignoreRecalc: true
          });
          countsublist = vrecord.getLineCount({
            sublistId: 'sublist'
          });
        }

        var docToRvrsData = search.load({
          id: 'customsearchafc_trans_to_reverse',
        });

        console.log('transType1', transType);
        if (transType) {
          docToRvrsData.filters.push(search.createFilter({
            name: 'type',
            operator: search.Operator.IS,
            values: transType
          }, ));
        };
        console.log('memo function', memo)
        if(memo){
          docToRvrsData.filters.push(search.createFilter({
            name: 'memomain',
            operator: search.Operator.CONTAINS,
            values: memo
          }, ));
        }
        // if(memo){
        //   docToRvrsData.filters.push(search.createFilter({
        //     name: 'memo',
        //     operator: search.Operator.CONTAINS,
        //     values: memo
        //   }, ));
        // }
        console.log('subsidiary', subsidiary);
        if (subsidiary) {
          docToRvrsData.filters.push(search.createFilter({
            name: 'subsidiary',
            operator: search.Operator.IS,
            values: subsidiary
          }, ));
        };

        console.log('transaction_date_from', transaction_date_from);
        if (transaction_date_from) {
          docToRvrsData.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.ONORAFTER,
            values: transaction_date_from
          }, ));
        };

        console.log('transaction_date_to', transaction_date_to);
        if (transaction_date_to) {
          docToRvrsData.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.ONORBEFORE,
            values: transaction_date_to
          }, ));
        };

        var docToRvrsDataSet = docToRvrsData.run();
        var docToRvrsData = docToRvrsDataSet.getRange({
          start: 0,
          end: recordExecution
        });
        // console.log('docToRvrsData', docToRvrsData);
        // console.log('vrecord', vrecord);
        // console.log('docToRvrsDataSet', docToRvrsDataSet);
        console.log('docToRvrsData.length', docToRvrsData.length);
        //if (typeof(docToRvrsData) !== 'undefined') {
        for (var i in docToRvrsData) {

          var docToRvrs = docToRvrsData[i];
          // console.log('docToRvrs', docToRvrs);

          var trans_internalid = docToRvrs.getValue(docToRvrsDataSet.columns[7]);
          var transaction = docToRvrs.getValue(docToRvrsDataSet.columns[0]);
          if (transaction == '- None -') transaction = trans_internalid;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_transaction',
            value: transaction,
            ignoreFieldChange: true
          });
          // console.log('transaction', transaction);

          var transactionDate = docToRvrs.getValue(docToRvrsDataSet.columns[1]);
          transactionDate = format.parse({
            value: transactionDate,
            type: format.Type.DATE
          });
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_transaction_date',
            value: transactionDate,
            ignoreFieldChange: true
          });
          // console.log('transactionDate', transactionDate);

          var trans_type = docToRvrs.getText(docToRvrsDataSet.columns[2]);
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_trans_type',
            value: trans_type,
            ignoreFieldChange: true
          });
          // console.log('trans_type', trans_type);

          var trans_type_id = docToRvrs.getValue(docToRvrsDataSet.columns[2]);
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_trans_type_id',
            value: trans_type_id,
            ignoreFieldChange: true
          });
          // console.log('trans_type_id', trans_type_id);

          var trans_name = docToRvrs.getText(docToRvrsDataSet.columns[3]);
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_name',
            value: trans_name,
            ignoreFieldChange: true
          });
          // console.log('trans_name', trans_name);

          var trans_memo = docToRvrs.getValue(docToRvrsDataSet.columns[4]);
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_memo',
            value: trans_memo,
            ignoreFieldChange: true
          });
          // console.log('trans_memo', trans_memo);

          var trans_currency = docToRvrs.getText(docToRvrsDataSet.columns[5]);
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_currency',
            value: trans_currency,
            ignoreFieldChange: true
          });
          // console.log('trans_currency', trans_currency);

          var trans_amount = docToRvrs.getValue(docToRvrsDataSet.columns[6]);
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_amount',
            value: trans_amount,
            ignoreFieldChange: true
          });
          // console.log('trans_amount', trans_amount);

          // var department = docToRvrs.getText(docToRvrsDataSet.columns[7]);
          // vrecord.setCurrentSublistValue({
          // sublistId: 'sublist',
          // fieldId: 'sublist_department',
          // value: department,
          // ignoreFieldChange: true
          // });
          // console.log('department', department);

          // var classs = docToRvrs.getText(docToRvrsDataSet.columns[8]);
          // vrecord.setCurrentSublistValue({
          // sublistId: 'sublist',
          // fieldId: 'sublist_class',
          // value: classs,
          // ignoreFieldChange: true
          // });
          // console.log('classs', classs);

          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_trans_internalid',
            value: trans_internalid,
            ignoreFieldChange: true
          });
          // console.log('trans_internalid', trans_internalid);
          vrecord.commitLine({
            sublistId: 'sublist',
            ignoreRecalc: true
          });
        }
        //}
      } catch (e) {
        console.log('Refresh List Function', e.name + ': ' + e.message);
      }

    }

    exports.fieldChanged = fieldChanged;
    exports.saveRecord = saveRecord;
    exports.MarkAll = MarkAll;
    return exports;

  });