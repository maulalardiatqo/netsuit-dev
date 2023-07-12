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

      var bcRec = record.create({
        type: "vendorcredit",
        isDynamic: true,
      });

      var entity = vb.getValue("entity");
      var account = vb.getValue("account");
      var memo = vb.getValue("memo");
      var department = vb.getValue("department");
      var usertotal = vb.getValue("usertotal");

      var entityBc = bcRec.setValue({
        fieldId: 'entity',
        value: entity,
        ignoreFieldChange: true
      });
      var accountBc = bcRec.setValue({
        fieldId: 'account',
        value: account,
        ignoreFieldChange: true
      });
      var memoBc = bcRec.setValue({
        fieldId: 'memo',
        value: memo,
        ignoreFieldChange: true
      });
      var departmentBc = bcRec.setValue({
        fieldId: 'department',
        value: department,
        ignoreFieldChange: true
      });
      var usertotalBc = bcRec.setValue({
        fieldId: 'usertotal',
        value: usertotal,
        ignoreFieldChange: true
      });

      var lineVBI = vb.getLineCount("item");
      console.log(lineVBI);
      if (lineVBI > 0) {
        for (var i = 0; i < lineVBI; i++) {
          var item = vb.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });

          var estimatedamount = vb.getSublistValue({
            sublistId: "item",
            fieldId: "rate",
            line: i,
          });
          console.log("estimatedamount", estimatedamount);

          var department = vb.getSublistValue({
            sublistId: "item",
            fieldId: "department",
            line: i,
          });

          var description = vb.getSublistValue({
            sublistId: "item",
            fieldId: "description",
            line: i,
          });

          var quantity = vb.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
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
            fieldId: "rate",
            value: estimatedamount || 1,
          });

          bcRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "department",
            value: department,
          });

          bcRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "description",
            value: description,
          });

          bcRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: quantity || 1,
          });

          bcRec.commitLine(
            "item"
          );
        }
      }

      var lineVBE = vb.getLineCount("expense");
      console.log(lineVBE);
      if (lineVBE > 0) {
        for (var i = 0; i < lineVBE; i++) {
          var item = vb.getSublistValue({
            sublistId: "expense",
            fieldId: "account",
            line: i,
          });

          var estimatedamount = vb.getSublistValue({
            sublistId: "expense",
            fieldId: "amount",
            line: i,
          });

          var department = vb.getSublistValue({
            sublistId: "expense",
            fieldId: "department",
            line: i,
          });

          bcRec.selectLine({
            sublistId: 'expense',
            line: i
          });

          // bcRec.setCurrentSublistValue({
          //   sublistId: "expense",
          //   fieldId: "item",
          //   value: item,
          // });
          bcRec.setCurrentSublistValue({
            sublistId: "expense",
            fieldId: "account",
            value: item,
          });
          
          bcRec.setCurrentSublistValue({
            sublistId: "expense",
            fieldId: "amount",
            value: estimatedamount || 1,
          });

          bcRec.setCurrentSublistValue({
            sublistId: "expense",
            fieldId: "department",
            value: department,
          });

          // bcRec.setCurrentSublistValue({
          //   sublistId: "expense",
          //   fieldId: "description",
          //   value: description,
          // });

          // bcRec.setCurrentSublistValue({
          //   sublistId: "expense",
          //   fieldId: "quantity",
          //   value: quantity || 1,
          // });

          bcRec.commitLine(
            "expense"
          );
        }
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

    } catch (e) {
      console.log(e)
      console.log("Error when generating bill credit", e.name + ' : ' + e.message);
      var failed_dialog = {
        title: 'Process Result',
        message: "Error create bill credit, " + e.name + ' : ' + e.message
      };
      dialog.alert(failed_dialog);
    }
  }

  return {
    pageInit: pageInit,
    bcPosting: bcPosting
  };
});