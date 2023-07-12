/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/record", "N/search", "N/url", "N/redirect", "N/error", "N/ui/dialog", "N/currency"], (runtime, log, record, search, url, redirect, error, dialog, currency) => {
  function beforeSubmit(context) {
    var rec = context.newRecord;
    log.debug("beforeSubmit", "beforeSubmit");
    if (context.type == "edit") {
      if (rec.id) {
        var ir_data_to_validate = record.load({
          type: "itemreceipt",
          id: rec.id,
        });
        var ibID = rec.getValue("inboundshipment");
        var exchangeRate = rec.getValue("exchangerate");
        var currencyGR = rec.getText("currency");
        log.debug("currencyGR", currencyGR);
        var currencyGRVal = rec.getValue("currency");
        var currencyGRRec = record.load({
          type: "currency",
          id: currencyGRVal,
          isDynamic: true,
        });
        var currencyGRText = currencyGRRec.getText("name");
        var dateGR = rec.getValue("trandate");
        log.debug("dateGR", dateGR);
        log.debug("ibID", ibID);
        log.debug("exchangeRate", exchangeRate);

        var lineTotal = rec.getLineCount({
          sublistId: "item"
        });
        log.debug("lineTotal", lineTotal);
        var errorcount = 0;
        var messageError = '';
        for (var i = 0; i < lineTotal; i++) {
          var itemName = ir_data_to_validate.getSublistValue({
            sublistId: "item",
            fieldId: "itemname",
            line: i,
          });
          var subrec = rec.getSublistSubrecord({
            sublistId: "item",
            fieldId: "landedcost",
            line: i,
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
            var categorygrRec = record.load({
              type: "costcategory",
              id: categorygr,
              isDynamic: true,
            });
            var categorygrText = categorygrRec.getText("name");
            log.debug("categorygrText", categorygrText)
            // var categorygrText = subrec.getSublistText({
            //   sublistId: "landedcostdata",
            //   fieldId: "costcategory",
            //   line: j,
            // });
            // var categorygrText = subrec.getSublistText({
            //   sublistId: "landedcostdata",
            //   fieldId: "costcategory",
            //   line: j,
            // });

            log.debug("dataget", {
              amountgr: amountgr,
              categorygr: categorygr
            })

            var ibData = search.create({
              type: 'customrecordabj_ib_cost_allocation',
              columns: ['internalid', 'custrecord_ca_ib_cost_category', 'custrecord_ca_ib_cost_exchange_rate', 'custrecord_abj_ca_ib_number', 'custrecord_ca_ib_cost_amount', 'custrecord_ca_ib_cost_alloc_method', 'custrecord_ca_ib_cost_currency'],
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
                var costAmount = row.getValue({
                  name: 'custrecord_ca_ib_cost_amount'
                });
                log.debug("bbb", {
                  costCategory: costCategory,
                  categorygr: categorygr,
                  costAmount: costAmount
                });
                var exRate = row.getValue({
                  name: 'custrecord_ca_ib_cost_exchange_rate'
                });
                // var exRateText = row.getText({
                //   name: 'custrecord_ca_ib_cost_currency'
                // });
                var exCurrencyVal = row.getValue({
                  name: 'custrecord_ca_ib_cost_currency'
                });
                var currencyRec = record.load({
                  type: "currency",
                  id: exCurrencyVal,
                  isDynamic: true,
                });
                var currencyIBText = currencyRec.getText("name");
                // var rateGr = parseFloat(costAmount) / parseFloat(exchangeRate);
                if (costCategory == categorygr) {
                  if (currencyGRVal == exCurrencyVal) {
                    var amountInput = parseFloat(amountgr);
                    var amountIB = parseFloat(costAmount);
                  } else {
                    log.debug("currExchageRate", {
                      source: exCurrencyVal,
                      target: currencyGR,
                      date: dateGR
                    })
                    // currExchageRate = Number(currency.exchangeRate({
                    //   source: exCurrencyVal,
                    //   target: currencyGR,
                    //   date: dateGR,
                    // }));
                    // log.debug("currExchageRate", currExchageRate);
                    var amountInput = parseFloat(amountgr);
                    if (currencyGR == 'MYR') {
                      var amountIB = parseFloat(costAmount) * parseFloat(exRate);
                    } else {
                      var amountIB = parseFloat(costAmount) / parseFloat(exRate);
                    }
                  }

                  log.debug("amountInput", amountInput.toFixed(1));
                  log.debug("amountIB", amountIB.toFixed(1));
                  if (amountIB.toFixed(1) != amountInput.toFixed(1)) {
                    errorcount++;
                    messageError += `Item ${itemName} Cost Category ${categorygrText} should be ${amountIB.toFixed(2)} ${currencyGRText} OR  ${costAmount} ${currencyIBText} ; \n `
                    // if (exCurrencyVal == currencyGRVal) {
                    //   messageError += `Item ${itemName} Cost Category ${categorygrText} should be ${amountIB} ${exRateText}; \n `
                    // } else {
                    //   messageError += `Item ${itemName} Cost Category ${categorygrText} should be ${amountIB} ${exRateText} or ${rateGr.toFixed(2)} ${currencyGR} ; \n `
                    // }
                  }
                }
              });
            }
          }
        }
        log.debug("error", errorcount);
        if (errorcount > 0) {
          var err = error.create({
            name: 'Input Error',
            message: messageError,
            notifyOff: true
          })
          throw err.name + '\n\n' + err.message + "\n";
        }
      }
    }
  }
  return {
    beforeSubmit: beforeSubmit
  };
});