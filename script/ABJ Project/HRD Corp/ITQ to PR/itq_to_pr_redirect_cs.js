/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/record", "N/ui/dialog"], function(
  runtime,
  log,
  url,
  currentRecord,
  record,
  dialog
) {
  var currRecord = currentRecord.get();

  function pageInit(context) {
    //
  }

  function itqPosting(context) {
    try {
      var itqid = currRecord.id;
      console.log("itqid", itqid);

      var dataTrans = record.load({
        type: "customrecord_sol_itq",
        id: itqid,
        isDynamic: true
      });
      var entity = dataTrans.getValue("custrecord_sol_itq_awarded");
      var entity_name = dataTrans.getText("custrecord_sol_itq_awarded");
      var memo = dataTrans.getValue("altname");
      var department = dataTrans.getValue("custrecord_sol_itq_department");
      var currency = dataTrans.getValue("custrecord_sol_itq_currency");
      var requestor = dataTrans.getValue("custrecord_sol_itq_requestor");
      var currentEmployee = runtime.getCurrentUser();
      console.log("dataTrans 2", {
        entity: entity,
        memo: memo,
        department: department,
        currency: currency
      });
      // console.log("currentEmployee", currentEmployee.id);
      // console.log("requestor", Number(requestor));
      if (currentEmployee.id != requestor) {
        var failed_dialog = {
          title: 'Error',
          message: `Requestor is not equal with current account login.`
        };
        dialog.alert(failed_dialog);
        return;
      }

      var rec_PR = record.create({
        type: record.Type.PURCHASE_REQUISITION,
        isDynamic: true,
      });

      console.log("after create PR");
      console.log("entity", entity);
      rec_PR.setValue({
        fieldId: 'custbody_sol_itq_awardedvendor',
        value: entity,
      });

      rec_PR.setValue({
        fieldId: 'memo',
        value: memo,
      });

      rec_PR.setValue({
        fieldId: 'custbody_sol_pr_itq',
        value: itqid,
      });

      rec_PR.setValue({
        fieldId: 'department',
        value: department,
      });

      rec_PR.setValue({
        fieldId: 'currency',
        value: currency,
      });

      console.log("after set value PR");

      var lineTotal = dataTrans.getLineCount({
        sublistId: "recmachcustrecord_sol_itq_link",
      });
      console.log("lineTotal", lineTotal);
      var totalItem = 0;
      for (var i = 0; i < lineTotal; i++) {
        var bidder = dataTrans.getSublistValue({
          sublistId: "recmachcustrecord_sol_itq_link",
          fieldId: "custrecord_sol_itq_item_bidder",
          line: i,
        });

        if (bidder == entity) {
          totalItem++;
          var item = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_itq_link",
            fieldId: "custrecord_sol_itq_item",
            line: i,
          });

          var quantity = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_itq_link",
            fieldId: "custrecord_sol_itq_quantity_range",
            line: i,
          });

          var description = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_itq_link",
            fieldId: "custrecord_sol_itq_description",
            line: i,
          });

          var rate = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_itq_link",
            fieldId: "custrecord_sol_itq_price",
            line: i,
          });

          var amount = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_itq_link",
            fieldId: "custrecord_sol_itq_line_total",
            line: i,
          });

          console.log("dataGet", {
            item: item,
            quantity: quantity,
            description: description,
            rate: rate,
            amount: amount
          });

          // Set sublist values
          rec_PR.selectNewLine({
            sublistId: 'item',
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: item,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: quantity,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: description,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'department',
            value: department,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: rate || 0,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: amount || 0,
          });

          rec_PR.commitLine({
            sublistId: 'item'
          });
          // End Set sublist values
        }
      }

      console.log("total item", totalItem);
      if (totalItem <= 0) {
        var failed_dialog = {
          title: 'Error',
          message: `There is no bidder on items for Recommended Bidders ${entity_name}`
        };
        dialog.alert(failed_dialog);
        return;
      }

      var prId = rec_PR.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });

      if (prId) {
        console.log("prId", prId);
        dataTrans.setValue({
          fieldId: "custrecord_sol_itq_requisition",
          value: prId,
        });
        dataTrans.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });
        var prUrl = url.resolveRecord({
          isEditMode: true,
          recordId: prId,
          recordType: record.Type.PURCHASE_REQUISITION
        });

        console.log("prUrl", prUrl);
        var success_dialog = {
          title: 'Process Result',
          message: 'Purchase Requisition <a href="' + prUrl + '">#' + prId + '</a> Successfully created'
        };

        function success(result) {
          window.location.reload();
        }

        function failure(reason) {
          console.log('Failure: ' + reason);
        }
        dialog.alert(success_dialog).then(success).catch(failure);

      }
    } catch (e) {
      console.log("Error when generating PR", e.name + ' : ' + e.message);
      var failed_dialog = {
        title: 'Process Result',
        message: "Error create purchase requisition, " + e.name + ' : ' + e.message
      };
      dialog.alert(failed_dialog);
    }
  }

  return {
    pageInit: pageInit,
    itqPosting: itqPosting
  };
});