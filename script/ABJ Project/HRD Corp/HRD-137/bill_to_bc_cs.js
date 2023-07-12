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

  function pageInit(context) {}

  function bcPosting() {
    try {
      var id = currRecord.id;
      console.log("id", id);

      var vb = record.load({
        type: "vendorbill",
        id: id,
        isDynamic: true,
      });

      var bcRec = record.transform({
        fromType: record.Type.VENDOR_BILL,
        fromId: id,
        toType: record.Type.VENDOR_CREDIT,
        isDynamic: true,
      });

      var lineVB = vb.getLineCount("item");
      console.log("lineVB", lineVB);

      for (var i = 0; i < lineVB; i++) {
        var item = vb.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: i,
        });

        var estimatedamount = vb.getSublistValue({
          sublistId: "item",
          fieldId: "amount",
          line: i,
        });

        var department = vb.getSublistValue({
          sublistId: "item",
          fieldId: "department",
          line: i,
        });

        bcRec.selectLine({
          sublistId: 'item',
          line: i
        });

        bcRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: item,
        });

        bcRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "amount",
          value: estimatedamount,
        });

        bcRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "department",
          value: department,
        });

        bcRec.commitLine(
          "item"
        );
      }


      var bcId = bcRec.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });
      if (bcId) {
        var bcURL = url.resolveRecord({
          isEditMode: true,
          recordId: bcId,
          recordType: record.Type.VENDOR_CREDIT
        });
        console.log("bcURL", bcURL)
        window.location.replace(bcURL);
      }


      // var  = record.load({
      //   type: "purchaseorder",
      //   id: bcId,
      //   isDynamic: true,
      // });
      //
      // var tranid = po.getValue({
      //   fieldId: "tranid",
      // });
      // var strName = '';

      // strName += "<p style=\"color:black; font-size: larger\"><b> Sukses Create Invoice ID "+ idInv +"</b></p><br>";
      // var poURL = url.resolveRecord({
      //   isEditMode: true,
      //   recordId: poId,
      //   recordType: record.Type.PURCHASE_ORDER
      // });

      //strName += "<p style=\"font-size: large\"><b><a href=\"https://7222172.app.netsuite.com/app/accounting/transactions/purchord.nl?whence=&id="+poId+"\"  style=\"color:blue;\">"+ tranid +"</a></b></p><br>";
      // strName += "<p style=\"font-size: large\"><b><a href=\"" + poURL + "\"  style=\"color:blue;\">" + tranid + "</a></b></p><br>";
      // strName += "<p style=\"color:black; font-size: larger\"><b> Successfully created </b></p><br>";
      //
      // strName += "</style>";

      /*var alertObj = dialog.create({

         message: strName
      });

      throw alertObj.message;*/
      // var success_dialog = {
      //   title: 'Process Result',
      //   message: strName
      // }; //'Puchase Order <a href="'+poURL+'">#'+tranid+'</a> Successfully created'};
      // function success(result) {
      //   window.location.reload();
      // }
      //
      // function failure(reason) {
      //   console.log('Failure: ' + reason);
      // }
      //
      // dialog.alert(success_dialog).then(success).catch(failure);

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
    bcPosting: bcPosting
  };
});