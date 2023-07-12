/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
  "N/currentRecord",
  "N/ui/dialog",
  "N/record",
  "N/search"
], function(currentRecord, dialog, record, search) {
  var exports = {};

  function pageInit(context) {}

  function saveRecord(context) {
    let rec = context.currentRecord;
    log.debug("ID", context.currentRecord.id);
    ir_data_to_validate = record.load({
      type: "itemreceipt",
      id: context.currentRecord.id,
    });
    var ibID = rec.getValue("inboundshipment");
    var exchangeRate = rec.getValue("exchangerate");
    log.debug("ibID", ibID);
    log.debug("exchangeRate", exchangeRate);

    var lineTotal = rec.getLineCount({
      sublistId: "item"
    });
    log.debug("lineTotal", lineTotal);
    var error = 0;
    var messageError = '';
    for (var i = 0; i < lineTotal; i++) {
      var itemName = rec.getSublistValue({
        sublistId: "item",
        fieldId: "itemname",
        line: i,
      });
      var recordLine = rec.selectLine({
        sublistId: 'item',
        line: i
      });
      var subrec = recordLine.getCurrentSublistSubrecord({
        sublistId: "item",
        fieldId: "landedcost"
      });
      var idx_subrec = subrec.getLineCount({
        sublistId: "landedcostdata",
      }) || 0;
      log.debug("idx_subrec", idx_subrec);
      for (var j = 0; j < idx_subrec; j++) {
        var amountgr = subrec.getSublistValue({
          sublistId: "landedcostdata",
          fieldId: "amount",
          line: j,
        });
        var categorygr = subrec.getSublistValue({
          sublistId: "landedcostdata",
          fieldId: "costcategory",
          line: j,
        });
        var categorygrText = subrec.getSublistText({
          sublistId: "landedcostdata",
          fieldId: "costcategory",
          line: j,
        });
        var categorygrText = subrec.getSublistText({
          sublistId: "landedcostdata",
          fieldId: "costcategory",
          line: j,
        });

        log.debug("dataget", {
          amountgr: amountgr,
          categorygrText: categorygrText
        })

        var ibData = search.create({
          type: 'customrecordabj_ib_cost_allocation',
          columns: ['internalid', 'custrecord_ca_ib_cost_category', 'custrecord_ca_ib_cost_exchange_rate', 'custrecord_abj_ca_ib_number', 'custrecord_ca_ib_cost_amount', 'custrecord_ca_ib_cost_alloc_method'],
          filters: [{
            name: 'custrecord_abj_ca_ib_number',
            operator: 'is',
            values: ibID
          }, {
            name: 'custrecord_ca_ib_cost_alloc_method',
            operator: 'is',
            values: 4
          }, ]
        }).run().getRange(0, 100);
        log.debug("ibData", ibData.length);
        if (ibData.length > 0) {
          ibData.forEach(function(row) {
            var ibNumber = row.getValue({
              name: 'custrecord_abj_ca_ib_number'
            });
            var allocMethod = row.getValue({
              name: 'custrecord_ca_ib_cost_alloc_method'
            });
            var costCategory = row.getValue({
              name: 'custrecord_ca_ib_cost_category'
            });
            var costCategoryText = row.getText({
              name: 'custrecord_ca_ib_cost_category'
            });
            log.debug("bbb", {
              costCategoryText: costCategoryText,
              categorygrText: categorygrText
            });
            var costAmount = row.getValue({
              name: 'custrecord_ca_ib_cost_amount'
            });
            var exRate = row.getValue({
              name: 'custrecord_ca_ib_cost_exchange_rate'
            });
            if (costCategoryText == categorygrText) {
              var amountInput = parseFloat(amountgr) * parseFloat(exchangeRate);
              var amountIB = parseFloat(costAmount) * parseFloat(exRate);
              if (amountIB != amountInput) {
                error++;
                messageError += `Error for item ${itemName} Cost Category ${categorygrText} should be ${amountIB} \n`
              }
            }
          });
        }
      }
    }
    if (error > 0) {
      alert(messageError);
      return false;
    }
    return true;
  }

  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;

  return exports;
});