/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect"], function(
  record,
  search,
  serverWidget,
  runtime, currency, redirect
) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        log.debug("Debug", 'after submit');
        var rec = context.newRecord;
        var rfqId = rec.id;
        var pr_internal_id = rec.getValue('custrecord_abj_rfq_createdfrom');
        log.debug("pr_internal_id", pr_internal_id);
        if (pr_internal_id) {
          pr_data_to_update = record.load({
            type: 'purchaserequisition',
            id: pr_internal_id,
            isDynamic: true
          });
          for (var counter = 0; counter < 2; counter++) {
            var vsublistid;
            var sublistid_pr;
            var fieldpr_line;
            if (counter == 0) {
              vsublistid = "recmachcustrecord_abj_rfq_item_rfq";
              fieldpr_line = 'custrecord_abj_rfq_item_pr_line';
              sublistid_pr = 'item';
            } else {
              vsublistid = "recmachcustrecord_abj_rfq_exp_rfq";
              fieldpr_line = 'custrecord_abj_rfq_exp_pr_line';
              sublistid_pr = 'expense';
            }
            log.debug("counter", counter);
            log.debug("vsublistid", vsublistid);

            var lineTotal = rec.getLineCount({
              sublistId: vsublistid
            });
            log.debug("lineTotal", lineTotal);
            for (var i = 0; i < lineTotal; i++) {
              var pr_line_id = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: fieldpr_line,
                line: i,
              });
              log.debug("pr_line_id", pr_line_id);

              pr_data_to_update.selectLine({
                sublistId: sublistid_pr,
                line: pr_line_id
              });
              pr_data_to_update.setCurrentSublistValue({
                sublistId: sublistid_pr,
                fieldId: 'custcolafc_pr_rfq_no',
                value: rfqId
              });
              log.debug("set value rfq", rfqId);
              pr_data_to_update.commitLine(sublistid_pr);
              log.debug("commit line", sublistid_pr);
            }
          }
          pr_data_to_update.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
          log.debug("update rfq id to pr", rfqId);

          var pr_cek_order_complete = search.create({
            type: 'purchaserequisition',
            columns: ['internalid'],
            filters: [{
                name: 'internalid',
                operator: 'is',
                values: pr_internal_id
              },
              {
                name: 'mainline',
                operator: 'is',
                values: false
              },
              {
                name: 'custcolafc_pr_rfq_no',
                operator: 'is',
                values: '@NONE@'
              },
            ]
          }).run().getRange({
            start: 0,
            end: 1
          });

          log.debug("pr_cek_order_complete", pr_cek_order_complete);
          var pr_status = 'Fully Sourced';
          if (pr_cek_order_complete.length > 0)
            pr_status = 'Partially Sourced';

          pr_data_to_update = record.load({
            type: 'purchaserequisition',
            id: pr_internal_id,
            isDynamic: true
          });
          log.debug("pr_status", pr_status);
          pr_data_to_update.setValue({
            fieldId: 'custbody_abj_afc_pr_status',
            value: pr_status,
            ignoreFieldChange: true
          });

          pr_data_to_update.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
          log.debug("update rfq id to pr", rfqId);

          redirect.toSuitelet({
            scriptId: 'customscriptafc_rfq_from_pr',
            deploymentId: 'customdeploycustomdeployafc_rfq_from_pr',
          });
        }
      }
    } catch (e) {
      err_messages = 'error in after submit ' + e.name + ': ' + e.message;
      log.debug(err_messages);
    }
  }

  function beforeLoad(context) {

    try {
      if (context.type == context.UserEventType.CREATE) {
        log.debug("Debug", 'Before Load');
        var rfq = context.newRecord;
        var PR_id;
        var PR_lines;
        var is_rfq;
        if (context.request) {
          if (context.request.parameters) {
            PR_id = context.request.parameters.PR_id;
            log.debug("PR_id", PR_id);
            var PR_lines_str = context.request.parameters.PR_lines;
            PR_lines = JSON.parse(PR_lines_str);
            log.debug("PR_lines", PR_lines);
            is_rfq = context.request.parameters.is_rfq;
            log.debug("is_rfq", is_rfq);
          }
        }
        if (PR_id) {
          var PRData = record.load({
            type: "purchaserequisition",
            id: PR_id,
            isDynamic: true
          });
          log.debug("PRData", PRData);

          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_createdfrom',
            value: PR_id,
            ignoreFieldChange: true
          });

          var currentEmployee = runtime.getCurrentUser();
          log.debug("currentEmployee", currentEmployee.id);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_buyer',
            value: currentEmployee.id,
            ignoreFieldChange: true
          });

          var today = new Date();
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_date',
            value: today,
            ignoreFieldChange: true
          });

          var pr_subsidiary = PRData.getValue("subsidiary");
          log.debug("pr_subsidiary", pr_subsidiary);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_subsidiary',
            value: pr_subsidiary,
            ignoreFieldChange: true
          });

          var pr_type = PRData.getValue("custbody_abj_req_type");
          log.debug("pr_type", pr_type);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_type',
            value: pr_type,
            ignoreFieldChange: true
          });

          var pr_Currency = PRData.getValue("currency");
          log.debug("pr_Currency", pr_Currency);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_currency',
            value: pr_Currency,
            ignoreFieldChange: true
          });

          var pr_Curr_exchage_Rate = currency.exchangeRate({
            source: 'USD',
            target: pr_Currency
          });
          log.debug("pr_Curr_exchage_Rate", pr_Curr_exchage_Rate);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_exchg_rate',
            value: pr_Curr_exchage_Rate,
            ignoreFieldChange: true
          });

          var rfq_status = 1; //rfq issued
          if (is_rfq == 'false') {
            rfq_status = 10; //pending rfp approval
          }
          log.debug("rfq_status", rfq_status);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_status',
            value: rfq_status,
            ignoreFieldChange: true
          });

          var pr_requestor = PRData.getValue("entity");
          log.debug("pr_requestor", pr_requestor);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_requestor',
            value: pr_requestor,
            ignoreFieldChange: true
          });

          var budget_year = PRData.getValue("custbody_abj_budyear_tran");
          log.debug("sublist_budget_year", budget_year);
          rfq.setValue({
            fieldId: 'custrecordabj_budyear_tran',
            value: budget_year,
            ignoreFieldChange: true
          });

          var budget_period = PRData.getValue("custbody_abj_budperiod_tran");
          log.debug("sublist_budget_period", budget_period);
          rfq.setValue({
            fieldId: 'custrecord_abj_budperiod_tran',
            value: budget_period,
            ignoreFieldChange: true
          });

          var line_idx = 0;
          var line_exp_idx = 0;
          var listvendor_prline = [];
          var rfq_total = 0;
          var pr_department;
          var pr_class;
          var pr_location;
          for (var i in PR_lines) {
            var PR_line = PR_lines[i];
            var pr_line_id = PR_line.pr_line_id;
            log.debug("get pr_line_id", pr_line_id);

            var pr_item = PR_line.pr_item;
            log.debug("get item", pr_item);
            var sublist_id = 'item';
            if (!pr_item) {
              sublist_id = 'expense';
            }

            var pr_line_idx = PRData.findSublistLineWithValue({
              sublistId: sublist_id,
              fieldId: 'line',
              value: pr_line_id
            });
            PRData.selectLine({
              sublistId: sublist_id,
              line: pr_line_idx
            });

            var vendor_id = PRData.getCurrentSublistValue({
              sublistId: sublist_id,
              fieldId: 'custcol_abj_vendorline'
            });
            log.debug("get vendor_id", vendor_id);

            if (vendor_id)
              if (listvendor_prline.length === 0) {
                listvendor_prline.push({
                  vendor_id: vendor_id,
                })
              } else {
                var ceklistvendor_prline = null;
                for (var index = 0; index < listvendor_prline.length; index++) {
                  if (listvendor_prline[index].vendor_id === vendor_id) {
                    ceklistvendor_prline = index;
                  }
                }
                if (ceklistvendor_prline == null) {
                  listvendor_prline.push({
                    vendor_id: vendor_id,
                  });
                }
              }

            pr_department = PRData.getCurrentSublistValue({
              sublistId: sublist_id,
              fieldId: 'department'
            });

            pr_location = PRData.getCurrentSublistValue({
              sublistId: sublist_id,
              fieldId: 'location'
            });

            pr_class = PRData.getCurrentSublistValue({
              sublistId: sublist_id,
              fieldId: 'class'
            });

            pr_project = PRData.getCurrentSublistValue({
              sublistId: sublist_id,
              fieldId: 'customer'
            });

            if (pr_item) {

              rfq.insertLine({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                line: line_idx,
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_name',
                line: line_idx,
                value: pr_item
              });

              var pr_item_desc = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'description'
              });
              log.debug("sublist_description", pr_item_desc);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_desc',
                line: line_idx,
                value: pr_item_desc
              });

              var pr_item_account = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'custcol_abj_item_expacct'
              });
              log.debug("pr_item_account", pr_item_account);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_account',
                line: line_idx,
                value: pr_item_account
              });

              var pr_activity_code = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'cseg_paactivitycode'
              });
              log.debug("pr_activity_code", pr_activity_code);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'cseg_paactivitycode',
                line: line_idx,
                value: pr_activity_code
              });

              var pr_item_qty = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'quantity'
              });
              log.debug("pr_item_qty", pr_item_qty);

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_qty',
                line: line_idx,
                value: pr_item_qty
              });

              var pr_item_unit = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'units'
              });
              log.debug("pr_item_unit", pr_item_unit);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_units',
                line: line_idx,
                value: pr_item_unit
              });

              var pr_item_estimated_rate = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'estimatedrate'
              });
              log.debug("pr_item_estimated_rate", pr_item_estimated_rate);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_est_unitprice',
                line: line_idx,
                value: pr_item_estimated_rate
              });

              var pr_item_estimated_amnt = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'estimatedamount'
              });
              log.debug("pr_item_estimated_amnt", pr_item_estimated_amnt);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_est_amt',
                line: line_idx,
                value: pr_item_estimated_amnt
              });
              rfq_total += Number(pr_item_estimated_amnt);

              var suggested_text_vendor = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'custcol_abj_pr_text_vdr'
              });
              log.debug("suggested_text_vendor", suggested_text_vendor);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_textvdr',
                line: line_idx,
                value: suggested_text_vendor
              });

              var pr_memo = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'custcol_abj_pr_memo'
              });
              log.debug("pr_memo", pr_memo);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_memo',
                line: line_idx,
                value: pr_memo
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_dept',
                line: line_idx,
                value: pr_department
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_class',
                line: line_idx,
                value: pr_class
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_location',
                line: line_idx,
                value: pr_location
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_proj',
                line: line_idx,
                value: pr_project
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_line',
                line: line_idx,
                value: line_idx + 1
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
                fieldId: 'custrecord_abj_rfq_item_pr_line',
                line: line_idx,
                value: pr_line_idx
              });

              line_idx++;
            }

            var exp_item = PRData.getCurrentSublistValue({
              sublistId: sublist_id,
              fieldId: 'category'
            });

            log.debug("sublist_expense_category", exp_item);

            if (exp_item || !pr_item) {

              rfq.insertLine({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                line: line_exp_idx,
              });

              log.debug("line_exp_idx", line_exp_idx);

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_cat',
                line: line_exp_idx,
                value: exp_item
              });

              var exp_item_desc = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'memo'
              });

              log.debug("exp_item_desc", exp_item_desc);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_desc',
                line: line_exp_idx,
                value: exp_item_desc
              });

              var exp_item_account = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'account'
              });
              log.debug("sublist_account", exp_item_account);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_acct',
                line: line_exp_idx,
                value: exp_item_account
              });

              var exp_activity_code = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'cseg_paactivitycode'
              });
              log.debug("exp_activity_code", exp_activity_code);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'cseg_paactivitycode',
                line: line_exp_idx,
                value: exp_activity_code
              });

              var exp_item_estimated_amnt = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'estimatedamount'
              });
              log.debug("exp_item_estimated_amnt", exp_item_estimated_amnt);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_est_amt',
                line: line_exp_idx,
                value: exp_item_estimated_amnt
              });

              rfq_total += Number(exp_item_estimated_amnt);

              var suggested_text_vendor = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'custcol_abj_pr_text_vdr'
              });
              log.debug("suggested_text_vendor", suggested_text_vendor);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_textvdr',
                line: line_exp_idx,
                value: suggested_text_vendor
              });

              var pr_memo = PRData.getCurrentSublistValue({
                sublistId: sublist_id,
                fieldId: 'custcol_abj_pr_memo'
              });
              log.debug("pr_memo", pr_memo);
              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_memo',
                line: line_exp_idx,
                value: pr_memo
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_dept',
                line: line_exp_idx,
                value: pr_department
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_class',
                line: line_exp_idx,
                value: pr_class
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_location',
                line: line_exp_idx,
                value: pr_location
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_proj',
                line: line_exp_idx,
                value: pr_project
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_line',
                line: line_exp_idx,
                value: line_exp_idx + 1
              });

              rfq.setSublistValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_pr_line',
                line: line_exp_idx,
                value: pr_line_idx
              });

              line_exp_idx++;
            }
          }

          log.debug("pr_department", pr_department);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_dept',
            value: pr_department,
            ignoreFieldChange: true
          });

          log.debug("pr_location", pr_location);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_location',
            value: pr_location,
            ignoreFieldChange: true
          });

          log.debug("pr_class", pr_class);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_class',
            value: pr_class,
            ignoreFieldChange: true
          });


          log.debug("listvendor_prline", listvendor_prline);
          for (var line_vndr_idx in listvendor_prline) {
            vendor_pr = listvendor_prline[line_vndr_idx];
            log.debug("vendor_pr", vendor_pr);
            rfq.insertLine({
              sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
              line: line_vndr_idx,
            });

            rfq.setSublistValue({
              sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
              fieldId: 'custrecord_abj_rfq_vdr',
              line: line_vndr_idx,
              value: vendor_pr.vendor_id,
            });
          }
          log.debug("rfq_total", rfq_total);
          rfq.setValue({
            fieldId: 'custrecord_abj_rfq_pr_total',
            value: rfq_total,
            ignoreFieldChange: true
          });
        }
      }
    } catch (e) {
      log.debug("Error in before load", e.name + ' : ' + e.message);
    }

  }


  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
  };
});