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

    function pageInit(context) {
      var currentEmployee = runtime.getCurrentUser();
      var dfltSubsidiary = currentEmployee.subsidiary;
      console.log("dfltSubsidiary", dfltSubsidiary);
      var rec = context.currentRecord;
      rec.setValue({
        fieldId: 'custpage_subsidiary',
        value: dfltSubsidiary
      });
    }

    function validate(context, detailID, itemVal, itemDesc) {
      var vrecord = context.currentRecord;
      // GET RFQ
      var Rfq_no = vrecord.getValue('custpage_rfq') || '' // AFC RFQ
      // GET AFC RFQ ITEM
      // CHECK IF ANY PO
      var ss_name = 'customsearchafc_rfq_to_po_item';

      // SEARCH
      var RfqData = search.load({
        id: ss_name,
      });

      if (Rfq_no) {
        console.log('Rfq_no', Rfq_no);
        //Rfq_no = parseInt(Rfq_no);
        //console.log('parse int Rfq_no',Rfq_no);
        RfqData.filters.push(
          search.createFilter({
            name: 'custrecord_abj_rfq_id',
            operator: search.Operator.IS,
            values: Rfq_no
          }, ));
      };
      var RfqDataSet = RfqData.run();
      RfqData = RfqDataSet.getRange({
        start: 0,
        end: 1000
      });
      // if(RfqData.length>0){
      // 	// window.alert(' RFQ Line has PO generated');
      // 	return false;
      // }
      if (RfqData.length > 0) {
        console.log('RfqData length', RfqData.length);
        console.log('RfqData', RfqData);
        var recordType = RfqData[0].recordType;
        console.log('recordType', recordType);
        var recordId = RfqData[0].id;
        console.log("recordId", recordId);
        var loadRecordRFQItem = record.load({
          type: recordType,
          id: recordId,
          isDynamic: true,
        });

        hasPOLink = 0;
        var lineCountRFQAFC = loadRecordRFQItem.getLineCount({
          sublistId: 'recmachcustrecord_abj_rfq_item_rfq'
        });
        console.log("lineCountRFQAFC", lineCountRFQAFC);
        for (var i = 0; i < lineCountRFQAFC; i++) {
          var RfqDataPOLink = loadRecordRFQItem.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
            fieldId: 'custrecord_abj_rfq_item_linkorder',
            line: i
          });
          var RfqDataID = loadRecordRFQItem.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
            fieldId: 'internalid',
            line: i
          });
          var RfqDataItemName = loadRecordRFQItem.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
            fieldId: 'custrecord_abj_rfq_item_name',
            line: i
          });
          var RfqDataItemDesc = loadRecordRFQItem.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
            fieldId: 'custrecord_abj_rfq_item_desc',
            line: i
          });
          console.log("RfqDataPOLink", {
            itemVal: itemVal,
            itemDesc: itemDesc,
            detailID: detailID,
            RfqDataID: RfqDataID,
            RfqDataItemName: RfqDataItemName,
            RfqDataItemDesc: RfqDataItemDesc
          });
          if ((itemVal == RfqDataItemName && itemDesc == RfqDataItemDesc) && RfqDataPOLink) {
            hasPOLink++;
          }
          console.log("run to", i);
          // if (RfqDataPOLink) {
          //   hasPOLink++;
          // }
        }
        console.log("hasPOLink", hasPOLink);
        if (hasPOLink > 0) {
          // window.alert('RFQ Line has PO generated');
          return false;
        } else {
          return true;
        }
      }

      // RFQ ITEM
      // custrecord_abj_rfq_item_linkorder ==> id link po


    }

    //   LOAD DATA
    // IF AFC RFQ HAS LINK PO THEN ITEM WIL NOT BE LOADED


    function saveRecord(context) {
      var rec = context.currentRecord;
      var total_line_count = rec.getValue('custpage_line_count');
      if (!total_line_count) {
        window.alert('Please Select RFQ');
        return false;
      }
      // var validateee = validate(context);
      // console.log("validateee", validateee);
      // if (!validateee) {
      //   window.alert('RFQ Line has PO generated');
      //   return false;
      // }
      var count = rec.getLineCount({
        sublistId: 'sublist'
      });
      for (var idx = 0; idx < count; idx++) {
        var selectVal = rec.getSublistValue({
          sublistId: 'sublist',
          fieldId: 'sublist_select',
          line: idx
        });
        var potype = rec.getSublistValue({
          sublistId: 'sublist',
          fieldId: 'sublist_potype',
          line: idx
        });
        if (selectVal) {
          var detailID = rec.getSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_line_internalid',
            line: idx
          });
          var itemVal = rec.getSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_item',
            line: idx
          });
          var itemDesc = rec.getSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_description',
            line: idx
          });
          var validateee = validate(context, detailID, itemVal, itemDesc);
          if (!validateee) {
            let alert_cant_empty = {
              title: 'PO Link Validation',
              message: "RFQ Line has PO generated"
            };
            dialog.alert(alert_cant_empty);
            return false;
          }
        }
        if (selectVal && (!potype)) {
          var alert_cant_empty = {
            title: 'PO Type Validation',
            message: "Please choose PO Type"
          };
          dialog.alert(alert_cant_empty);
          return false;
        }

      }

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
      console.log('vrecord1', vrecord);
      if ((context.fieldId == 'custpage_subsidiary') ||
        (context.fieldId == 'custpage_rfq') ||
        (context.fieldId == 'custpage_location') ||
        (context.fieldId == 'custpage_class') ||
        (context.fieldId == 'custpage_department') ||
        (context.fieldId == 'custpage_rfqtype') ||
        (context.fieldId == 'custpage_rfqdatefrom') ||
        (context.fieldId == 'custpage_rfqdateto')
      ) {

        //var sublist = vrecord.getSublist('sublist');
        var Rfq_no = vrecord.getValue('custpage_rfq') || '';
        /*pos_rfq_prefix = Rfq_no.search("RFQ-");
		  if (pos_rfq_prefix>-1) {
			  Rfq_no = Rfq_no.replace("RFQ-", "");
		  } else {
			  Rfq_no = '';
		  }*/

        console.log('Rfq_no1', Rfq_no);
        var subsidiary = vrecord.getValue('custpage_subsidiary');
        console.log('subsidiary1', subsidiary);
        var vlocation = vrecord.getValue('custpage_location') || '';
        console.log('vlocation1', vlocation);
        var vclass = vrecord.getValue('custpage_class') || '';
        console.log('vclass', vclass);
        var vdepartment = vrecord.getValue('custpage_department') || '';
        console.log('vdepartment', vdepartment);
        var Rfq_type = vrecord.getValue('custpage_rfqtype') || '';
        console.log('Rfq_type', Rfq_type);

        var Rfq_date_from = vrecord.getValue('custpage_rfqdatefrom');
        if (Rfq_date_from) {
          Rfq_date_from = format_date_for_save_search(Rfq_date_from);
        }

        var Rfq_date_to = vrecord.getValue('custpage_rfqdateto');
        if (Rfq_date_to) {
          Rfq_date_to = format_date_for_save_search(Rfq_date_to);
        }

        if (subsidiary == '') {
          return
        };

        refreshlist(Rfq_no, subsidiary, vlocation, vclass, vdepartment, Rfq_type,
          Rfq_date_from, Rfq_date_to, vrecord);

        var scriptObj = runtime.getCurrentScript();
        console.log({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });
      }

      if ((context.sublistId == 'sublist') && (context.fieldId == 'sublist_select')) {
        var totalcount = vrecord.getValue('custpage_line_count');
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
          fieldId: 'custpage_line_count',
          value: totalcount,
          ignoreFieldChange: true
        });
      }
    }

    function refreshlist(Rfq_no, vsubsidiary, vlocation, vclass, vdepartment, Rfq_type,
      Rfq_date_from, Rfq_date_to, vrecord) {
      try {
        console.log('refresh list', vrecord);
        var countsublist = vrecord.getLineCount({
          sublistId: 'sublist'
        });
        console.log('countsublist list', countsublist);
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
        vrecord.setValue({
          fieldId: 'custpage_line_count',
          value: 0,
          ignoreFieldChange: true
        });

        var data_rfq_to_Sort = [];
        for (var idxtype = 0; idxtype < 2; idxtype++) {

          var ss_name = 'customsearchafc_rfq_to_po_item';
          var loc_filter_field = 'custrecord_abj_rfq_item_location';
          var dept_filter_field = 'custrecord_abj_rfq_item_dept';
          var class_filter_field = 'custrecord_abj_rfq_item_class';
          var join_field = 'custrecord_abj_rfq_item_rfq';
          if (idxtype == 1) {
            ss_name = 'customsearchafc_rfq_to_po_exp';
            loc_filter_field = 'custrecord_abj_rfq_exp_location';
            dept_filter_field = 'custrecord_abj_rfq_exp_dept';
            class_filter_field = 'custrecord_abj_rfq_exp_class';
            join_field = 'custrecord_abj_rfq_exp_rfq';
          }

          var RfqData = search.load({
            id: ss_name,
          });
          console.log('RfqData', RfqData);

          if (vsubsidiary) {
            console.log('vsubsidiary', vsubsidiary);
            RfqData.filters.push(search.createFilter({
              name: 'custrecord_abj_rfq_subsidiary',
              operator: search.Operator.IS,
              values: vsubsidiary
            }, ));
          };

          if (Rfq_no) {
            console.log('Rfq_no', Rfq_no);
            //Rfq_no = parseInt(Rfq_no);
            //console.log('parse int Rfq_no',Rfq_no);
            RfqData.filters.push(search.createFilter({
              name: 'custrecord_abj_rfq_id',
              operator: search.Operator.IS,
              values: Rfq_no
            }, ));
          };

          if (vlocation) {
            console.log('vlocation', vlocation);
            RfqData.filters.push(search.createFilter({
              name: loc_filter_field,
              join: join_field,
              operator: search.Operator.IS,
              values: vlocation
            }, ));
          };

          if (vclass) {
            console.log('vclass', vclass);
            RfqData.filters.push(search.createFilter({
              name: class_filter_field,
              join: join_field,
              operator: search.Operator.IS,
              values: vclass
            }, ));
          };

          if (vdepartment) {
            console.log('vdepartment', vdepartment);
            RfqData.filters.push(search.createFilter({
              name: dept_filter_field,
              join: join_field,
              operator: search.Operator.IS,
              values: vdepartment
            }, ));
          };

          if (Rfq_type) {
            console.log('Rfq_type', Rfq_type);
            RfqData.filters.push(search.createFilter({
              name: 'custrecord_abj_rfq_type',
              operator: search.Operator.IS,
              values: Rfq_type
            }, ));
          };

          if (Rfq_date_from) {
            console.log('Rfq_date_from', Rfq_date_from);
            RfqData.filters.push(search.createFilter({
              name: 'custrecord_abj_rfq_date',
              operator: search.Operator.ONORAFTER,
              values: Rfq_date_from
            }, ));
          };

          if (Rfq_date_to) {
            console.log('Rfq_date_to', Rfq_date_to);
            RfqData.filters.push(search.createFilter({
              name: 'custrecord_abj_rfq_date',
              operator: search.Operator.ONORBEFORE,
              values: Rfq_date_to
            }, ));
          };

          var RfqDataSet = RfqData.run();
          RfqData = RfqDataSet.getRange({
            start: 0,
            end: 1000
          });
          console.log('RfqData length', RfqData.length);
          console.log('RfqData', RfqData);
          //console.log('vrecord',vrecord);
          //console.log('RfqDataSet',RfqDataSet);
          //if ((typeof(RfqData) !== 'undefined') && (typeof(vrecord) !== 'undefined')) {
          for (var i in RfqData) {

            var Rfq = RfqData[i];
            console.log('Rfq', Rfq);

            var RfqNo = Rfq.getValue(RfqDataSet.columns[0]);
            var RfqDate = Rfq.getValue(RfqDataSet.columns[1]);
            RfqDate = format.parse({
              value: RfqDate,
              type: format.Type.DATE
            });
            var line_type = idxtype == 0 ? 'Item' : 'Expense';
            var itemValue = Rfq.getValue(RfqDataSet.columns[2]);
            var itemText = Rfq.getText(RfqDataSet.columns[2]);
            var item_description = Rfq.getValue(RfqDataSet.columns[3]);
            var quantity = Rfq.getValue(RfqDataSet.columns[4]);
            var unit = Rfq.getValue(RfqDataSet.columns[5]);
            var unit_text = Rfq.getText(RfqDataSet.columns[5]);
            var item_quote_curr = Rfq.getValue(RfqDataSet.columns[6]);
            var item_quote_curr_text = Rfq.getText(RfqDataSet.columns[6]);
            var item_quote_price = Rfq.getValue(RfqDataSet.columns[7]);
            var item_quote_amount = Rfq.getValue(RfqDataSet.columns[8]);
            var item_department = Rfq.getText(RfqDataSet.columns[9]);
            var item_department_id = Rfq.getValue(RfqDataSet.columns[9]);
            var item_class = Rfq.getText(RfqDataSet.columns[10]);
            var item_class_id = Rfq.getValue(RfqDataSet.columns[10]);
            var item_location = Rfq.getText(RfqDataSet.columns[11]);
            var item_location_id = Rfq.getValue(RfqDataSet.columns[11]);
            var item_project = Rfq.getText(RfqDataSet.columns[12]);
            var item_project_id = Rfq.getValue(RfqDataSet.columns[12]);
            var item_actcode = Rfq.getText(RfqDataSet.columns[13]);
            var item_actcode_id = Rfq.getValue(RfqDataSet.columns[13]);
            var item_dlvr_Date = Rfq.getValue(RfqDataSet.columns[14]);
            if (item_dlvr_Date)
              item_dlvr_Date = format.parse({
                value: item_dlvr_Date,
                type: format.Type.DATE
              });
            var item_dlvr_address = Rfq.getValue(RfqDataSet.columns[15]);
            var subsidiary = Rfq.getValue(RfqDataSet.columns[16]);
            var budgetyear = Rfq.getValue(RfqDataSet.columns[17]);
            var budgetperiod = Rfq.getValue(RfqDataSet.columns[18]);
            var line_internal_id = Rfq.getValue(RfqDataSet.columns[19]);
            var rfq_internal_id = Rfq.getValue(RfqDataSet.columns[20]);
            var rfq_type = Rfq.getText(RfqDataSet.columns[21]);
            var awarded_vendor = Rfq.getValue(RfqDataSet.columns[22]);
            var requestor = Rfq.getValue(RfqDataSet.columns[23]);
            var item_account = Rfq.getValue(RfqDataSet.columns[24]);
            var project_name = Rfq.getValue(RfqDataSet.columns[25]);
            var pr_receive_date = Rfq.getValue(RfqDataSet.columns[26]);
            if (pr_receive_date)
              pr_receive_date = format.parse({
                value: pr_receive_date,
                type: format.Type.DATE
              });
            var header_dept = Rfq.getValue(RfqDataSet.columns[27]);
            var header_class = Rfq.getValue(RfqDataSet.columns[28]);
            var header_location = Rfq.getValue(RfqDataSet.columns[29]);

            data_rfq_to_Sort.push({
              RfqNo: RfqNo,
              RfqDate: RfqDate,
              line_type: line_type,
              itemValue: itemValue,
              itemText: itemText,
              item_description: item_description,
              quantity: quantity,
              unit: unit,
              unit_text: unit_text,
              item_quote_curr: item_quote_curr,
              item_quote_curr_text: item_quote_curr_text,
              item_quote_price: item_quote_price,
              item_quote_amount: item_quote_amount,
              item_department: item_department,
              item_department_id: item_department_id,
              item_class: item_class,
              item_class_id: item_class_id,
              item_location: item_location,
              item_location_id: item_location_id,
              item_project: item_project,
              item_project_id: item_project_id,
              item_actcode: item_actcode,
              item_actcode_id: item_actcode_id,
              item_dlvr_Date: item_dlvr_Date,
              item_dlvr_address: item_dlvr_address,
              subsidiary: subsidiary,
              budgetyear: budgetyear,
              budgetperiod: budgetperiod,
              line_internal_id: line_internal_id,
              rfq_internal_id: rfq_internal_id,
              rfq_type: rfq_type,
              awarded_vendor: awarded_vendor,
              requestor: requestor,
              item_account: item_account,
              project_name: project_name,
              pr_receive_date: pr_receive_date,
              header_dept: header_dept,
              header_class: header_class,
              header_location: header_location,
            });
          }
        }
        console.log('data_rfq_to_Sort', data_rfq_to_Sort);
        data_rfq_to_Sort = data_rfq_to_Sort.sort((a, b) => a.rfq_internal_id - b.rfq_internal_id);
        console.log('data_rfq_to_Sort', data_rfq_to_Sort);

        for (var i in data_rfq_to_Sort) {

          var Rfq = data_rfq_to_Sort[i];

          var RfqNo = Rfq.RfqNo;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_rfq',
            value: RfqNo,
          })
          console.log('RfqNo', RfqNo);

          var RfqDate = Rfq.RfqDate;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_rfq_date',
            value: RfqDate,
          })
          console.log('RfqDate', RfqDate);

          var rfq_type = Rfq.rfq_type;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_rfq_type',
            value: rfq_type,
          })
          console.log('rfq_type', rfq_type);

          var line_type = Rfq.line_type;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_line_type',
            value: line_type,
          })
          console.log('line_type', line_type);

          var itemValue = Rfq.itemValue;
          var itemText = Rfq.itemText;
          var field_item = 'sublist_item';
          var field_item_text = 'sublist_item_text';
          if (line_type == 'Expense') {
            field_item = 'sublist_exp_cat';
            field_item_text = 'sublist_exp_cat_text';
          }
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: field_item,
            value: itemValue,
          })
          console.log('itemValue', itemValue);

          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: field_item_text,
            value: itemText,
          });
          console.log('itemText', itemText);

          var item_description = Rfq.item_description;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_description',
            value: item_description,
          });
          console.log('item_description', item_description);

          if (line_type == 'Item') {
            var quantity = Rfq.quantity;
            vrecord.setCurrentSublistValue({
              sublistId: 'sublist',
              fieldId: 'sublist_quantity',
              value: quantity,
            });
            console.log('quantity', quantity);

            var unit = Rfq.unit;
            vrecord.setCurrentSublistValue({
              sublistId: 'sublist',
              fieldId: 'sublist_unit',
              value: unit,
            });
            console.log('unit', unit);

            var unit_text = Rfq.unit_text;
            vrecord.setCurrentSublistValue({
              sublistId: 'sublist',
              fieldId: 'sublist_unit_text',
              value: unit_text,
            });
            console.log('unit_text', unit_text);
          }

          var item_quote_curr = Rfq.item_quote_curr;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_currency_id',
            value: item_quote_curr,
          });
          console.log('item_quote_curr', item_quote_curr);

          var item_quote_curr_text = Rfq.item_quote_curr_text;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_currency',
            value: item_quote_curr_text,
          });
          console.log('item_quote_curr_text', item_quote_curr_text);

          if (line_type == 'Item') {
            var item_quote_price = Rfq.item_quote_price;
            vrecord.setCurrentSublistValue({
              sublistId: 'sublist',
              fieldId: 'sublist_quote_unit_price',
              value: item_quote_price,
            });
            console.log('item_quote_price', item_quote_price);
          };

          var item_quote_amount = Rfq.item_quote_amount;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_quote_amount',
            value: item_quote_amount,
          });
          console.log('item_quote_amount', item_quote_amount);

          var item_department = Rfq.item_department;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_department',
            value: item_department,
          });
          console.log('item_department', item_department);

          var item_department_id = Rfq.item_department_id;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_department_id',
            value: item_department_id,
          });
          console.log('item_department_id', item_department_id);

          var item_class = Rfq.item_class;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_class',
            value: item_class,
          });
          console.log('item_class', item_class);

          var item_class_id = Rfq.item_class_id;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_class_id',
            value: item_class_id,
          });
          console.log('item_class_id', item_class_id);

          var item_location = Rfq.item_location;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_location',
            value: item_location,
          });
          console.log('item_location', item_location);

          var item_location_id = Rfq.item_location_id;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_location_id',
            value: item_location_id,
          });
          console.log('item_location_id', item_location_id);

          var item_project = Rfq.item_project;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_project',
            value: item_project,
          });
          console.log('item_project', item_project);

          var item_project_id = Rfq.item_project_id;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_project_id',
            value: item_project_id,
          });
          console.log('item_project_id', item_project_id);

          var item_actcode = Rfq.item_actcode;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_activity_code',
            value: item_actcode,
          });
          console.log('item_actcode', item_actcode);

          var item_actcode_id = Rfq.item_actcode_id;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_activity_code_id',
            value: item_actcode_id,
          });
          console.log('item_actcode_id', item_actcode_id);

          var item_dlvr_Date = Rfq.item_dlvr_Date;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_delivery_date',
            value: item_dlvr_Date,
          });
          console.log('item_dlvr_Date', item_dlvr_Date);

          var item_dlvr_address = Rfq.item_dlvr_address;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_delivery_addrs',
            value: item_dlvr_address,
          });
          console.log('item_dlvr_address', item_dlvr_address);

          var subsidiary = Rfq.subsidiary;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_subsidiary',
            value: subsidiary,
          });
          console.log('subsidiary', subsidiary);

          var budgetyear = Rfq.budgetyear;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_budget_year',
            value: budgetyear,
          });
          console.log('budgetyear', budgetyear);

          var budgetperiod = Rfq.budgetperiod;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_budget_period',
            value: budgetperiod,
          });
          console.log('budgetperiod', budgetperiod);

          var line_internal_id = Rfq.line_internal_id;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_line_internalid',
            value: line_internal_id,
          });
          console.log('line_internal_id', line_internal_id);

          var rfq_internal_id = Rfq.rfq_internal_id;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_rfq_internalid',
            value: rfq_internal_id,
          });
          console.log('rfq_internal_id', rfq_internal_id);

          var awarded_vendor = Rfq.awarded_vendor;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_awarded_vendor',
            value: awarded_vendor,
          });
          console.log('awarded_vendor', awarded_vendor);

          var requestor = Rfq.requestor;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_requestor',
            value: requestor,
          });
          console.log('requestor', requestor);

          var item_account = Rfq.item_account;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_account',
            value: item_account,
          });
          console.log('item_account', item_account);

          var project_name = Rfq.project_name;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_project_name',
            value: project_name,
          });
          console.log('project_name', project_name);

          var pr_receive_date = Rfq.pr_receive_date;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_pr_receive_date',
            value: pr_receive_date,
          });
          console.log('pr_receive_date', pr_receive_date);

          var header_dept = Rfq.header_dept;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_header_department',
            value: header_dept,
          });
          console.log('header_dept', header_dept);

          var header_class = Rfq.header_class;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_header_class',
            value: header_class,
          });
          console.log('header_class', header_class);

          var header_location = Rfq.header_location;
          vrecord.setCurrentSublistValue({
            sublistId: 'sublist',
            fieldId: 'sublist_header_location',
            value: header_location,
          });
          console.log('header_location', header_location);

          vrecord.commitLine({
            sublistId: 'sublist',
            ignoreRecalc: true
          });
        }

      } catch (e) {
        console.log('Refresh List Function', e.name + ': ' + e.message);
      }

    }

    exports.fieldChanged = fieldChanged;
    exports.saveRecord = saveRecord;
    exports.pageInit = pageInit;
    exports.MarkAll = MarkAll;
    return exports;

  });