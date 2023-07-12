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

  function createPO(type) {
    try {
      console.log("type", type)
      var id = currRecord.id;
      console.log("id", id);

      var pr = record.load({
        type: "purchaserequisition",
        id: id,
        isDynamic: true,
      });

      console.log("steo_1");

      var poRec = record.transform({
        fromType: record.Type.PURCHASE_REQUISITION,
        fromId: id,
        toType: record.Type.PURCHASE_ORDER,
        isDynamic: true,
      });

      console.log("steo_2");

      poRec.setValue({
        fieldId: "approvalstatus",
        value: 1,
      });

      poRec.setValue({
        fieldId: "custbody_sol_pr",
        value: id,
      });

      var linePR = pr.getLineCount("item");
      console.log("linePR", linePR);

      for (var i = 0; i < linePR; i++) {
        var item = pr.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: i,
        });

        var estimatedamount = pr.getSublistValue({
          sublistId: "item",
          fieldId: "estimatedamount",
          line: i,
        });

        var estimatedarate = pr.getSublistValue({
          sublistId: "item",
          fieldId: "estimatedrate",
          line: i,
        });

        var department = pr.getSublistValue({
          sublistId: "item",
          fieldId: "department",
          line: i,
        });

        poRec.selectLine({
          sublistId: 'item',
          line: i
        });

        poRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: item,
        });

        poRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: estimatedarate,
        });

        poRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "amount",
          value: estimatedamount,
        });

        poRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "department",
          value: department,
        });

        poRec.commitLine(
          "item"
        );
      }


      var poId = poRec.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });


      var po = record.load({
        type: "purchaseorder",
        id: poId,
        isDynamic: true,
      });

      var tranid = po.getValue({
        fieldId: "tranid",
      });
      var strName = '';

      // strName += "<p style=\"color:black; font-size: larger\"><b> Sukses Create Invoice ID "+ idInv +"</b></p><br>";
      var poURL = url.resolveRecord({
        isEditMode: true,
        recordId: poId,
        recordType: record.Type.PURCHASE_ORDER
      });

      //strName += "<p style=\"font-size: large\"><b><a href=\"https://7222172.app.netsuite.com/app/accounting/transactions/purchord.nl?whence=&id="+poId+"\"  style=\"color:blue;\">"+ tranid +"</a></b></p><br>";
      strName += "<p style=\"font-size: large\"><b><a href=\"" + poURL + "\"  style=\"color:blue;\">" + tranid + "</a></b></p><br>";
      strName += "<p style=\"color:black; font-size: larger\"><b> Successfully created </b></p><br>";

      strName += "</style>";

      /*var alertObj = dialog.create({

         message: strName
      });

      throw alertObj.message;*/
      var success_dialog = {
        title: 'Process Result',
        message: strName
      }; //'Puchase Order <a href="'+poURL+'">#'+tranid+'</a> Successfully created'};
      function success(result) {
        window.location.reload();
      }

      function failure(reason) {
        console.log('Failure: ' + reason);
      }

      dialog.alert(success_dialog).then(success).catch(failure);

    } catch (e) {
      console.log("Error when generating po", e.name + ' : ' + e.message);
      var failed_dialog = {
        title: 'Process Result',
        message: "Error create purchase Order, " + e.name + ' : ' + e.message
      };
      dialog.alert(failed_dialog);
    }
  }

  return {
    pageInit: pageInit,
    createPO: createPO
  };
});