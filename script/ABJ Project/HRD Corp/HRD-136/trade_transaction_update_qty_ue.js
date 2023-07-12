/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/record", "N/search", "N/error"], (runtime, log, record, search, error) => {

  function beforeSubmit(context) {
    if (context.type === context.UserEventType.CREATE) {
      let dataRec = context.newRecord;
      let typeTrade = dataRec.getValue('custrecord_sol_invst_tt_typ_trade');
      let stockName = dataRec.getValue('custrecord_sol_invst_tt_stock_name');
      let bond = dataRec.getValue('custrecord_sol_invst_tt_bond');
      if (typeTrade == 2) {
        if (stockName) {
          let equity = record.load({
            type: 'customrecord_sol_invst_equity',
            id: stockName,
          });
          log.debug("equity", equity);
          let unitShares = dataRec.getValue("custrecord_sol_invst_tt_units_of_shares") || 0;
          let equityQty = equity.getValue("custrecord_sol_invst_ef_quantity") || 0;
          // let tradeTransRec = search.create({
          //   type: 'customrecord_sol_invst_trade_trn',
          //   columns: ['internalid', 'custrecord_sol_invst_tt_units_of_shares'],
          //   filters: [{
          //     name: 'internalid',
          //     operator: 'is',
          //     values: dataRec.id
          //   }, ]
          // });
          // let tradeTransRecSet = tradeTransRec.run();
          // tradeTransRec = tradeTransRecSet.getRange({
          //   start: 0,
          //   end: 10
          // });
          // log.debug("tradeTransRec", tradeTransRec);
          // for (var i = 0; i < tradeTransRec.length; i++) {
          //   let row = tradeTransRec[i];
          //   unitShares = row.getValue({
          //     name: 'custrecord_sol_invst_tt_units_of_shares'
          //   });
          // }
          log.debug("equityQty", equityQty);
          log.debug("unitShares", unitShares);
          let qtyEquityNow = parseFloat(equityQty) - parseFloat(unitShares);
          log.debug("qtyEquityNow", qtyEquityNow);
          if (qtyEquityNow < 0) {
            log.debug("error", "data error");
            let update_process_error = error.create({
              name: 'Trade Transaction Process',
              message: `UNIT OF SHARES maximum is ${equityQty}`,
              notifyOff: true
            });
            throw update_process_error.name + '\n\n' + update_process_error.message + "\n";
          } else {
            equity.setValue({
              fieldId: "custrecord_sol_invst_ef_quantity",
              value: qtyEquityNow,
            });
            equity.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            // log.debug("OK SET VALUE", true);
          }
        }
        if (bond) {
          let fixIncomeBond = record.load({
            type: 'customrecord_sol_invst_fixed_income_bond',
            id: bond,
          });
          log.debug("fixIncomeBond", fixIncomeBond);
          let unitShares = dataRec.getValue("custrecord_sol_invst_tt_units_of_shares") || 0;
          let nomAmount = fixIncomeBond.getValue("custrecord_sol_invtr_fi_nominal_amount") || 0;
          // let tradeTransRec = search.create({
          //   type: 'customrecord_sol_invst_trade_trn',
          //   columns: ['internalid', 'custrecord_sol_invst_tt_units_of_shares'],
          //   filters: [{
          //     name: 'internalid',
          //     operator: 'is',
          //     values: dataRec.id
          //   }, ]
          // });
          // let tradeTransRecSet = tradeTransRec.run();
          // tradeTransRec = tradeTransRecSet.getRange({
          //   start: 0,
          //   end: 10
          // });
          // log.debug("tradeTransRec", tradeTransRec);
          // for (var i = 0; i < tradeTransRec.length; i++) {
          //   let row = tradeTransRec[i];
          //   unitShares = row.getValue({
          //     name: 'custrecord_sol_invst_tt_units_of_shares'
          //   });
          // }
          log.debug("nomAmount", nomAmount);
          log.debug("unitShares", unitShares);
          let nomAmountNow = parseInt(nomAmount) - parseInt(unitShares);
          log.debug("nomAmountNow", nomAmountNow);
          if (nomAmountNow < 0) {
            let update_process_error = error.create({
              name: 'Trade Transaction Process',
              message: `UNIT OF SHARES maximum is ${nomAmount}`,
              notifyOff: true
            });
            throw update_process_error.name + '\n\n' + update_process_error.message + "\n";
          } else {
            fixIncomeBond.setValue({
              fieldId: "custrecord_sol_invtr_fi_nominal_amount",
              value: nomAmountNow,
            });
            fixIncomeBond.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            // log.debug("OK SET VALUE", true);
          }
        }
      }
    }
  }

  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        // let dataRec = context.newRecord;
        let dataRec = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id,
          isDynamic: true,
        })
        let typeTrade = dataRec.getValue('custrecord_sol_invst_tt_typ_trade');
        let stockName = dataRec.getValue('custrecord_sol_invst_tt_stock_name');
        let bond = dataRec.getValue('custrecord_sol_invst_tt_bond');
        if (typeTrade == 2) {
          if (stockName) {
            let equity = record.load({
              type: 'customrecord_sol_invst_equity',
              id: stockName,
            });
            log.debug("equity", equity);
            let unitShares;
            let equityQty = equity.getValue("custrecord_sol_invst_ef_quantity") || 0;
            let tradeTransRec = search.create({
              type: 'customrecord_sol_invst_trade_trn',
              columns: ['internalid', 'custrecord_sol_invst_tt_units_of_shares'],
              filters: [{
                name: 'internalid',
                operator: 'is',
                values: dataRec.id
              }, ]
            });
            let tradeTransRecSet = tradeTransRec.run();
            tradeTransRec = tradeTransRecSet.getRange({
              start: 0,
              end: 10
            });
            log.debug("tradeTransRec", tradeTransRec);
            for (var i = 0; i < tradeTransRec.length; i++) {
              let row = tradeTransRec[i];
              unitShares = row.getValue({
                name: 'custrecord_sol_invst_tt_units_of_shares'
              });
            }
            log.debug("equityQty", equityQty);
            log.debug("unitShares", unitShares);
            let qtyEquityNow = parseFloat(equityQty) - parseFloat(unitShares);
            log.debug("qtyEquityNow", qtyEquityNow);
            equity.setValue({
              fieldId: "custrecord_sol_invst_ef_quantity",
              value: qtyEquityNow,
            });
            equity.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
          } else {
            let fixIncomeBond = record.load({
              type: 'customrecord_sol_invst_fixed_income_bond',
              id: bond,
            });
            log.debug("fixIncomeBond", fixIncomeBond);
            let unitShares;
            let nomAmount = fixIncomeBond.getValue("custrecord_sol_invtr_fi_nominal_amount") || 0;
            let tradeTransRec = search.create({
              type: 'customrecord_sol_invst_trade_trn',
              columns: ['internalid', 'custrecord_sol_invst_tt_units_of_shares'],
              filters: [{
                name: 'internalid',
                operator: 'is',
                values: dataRec.id
              }, ]
            });
            let tradeTransRecSet = tradeTransRec.run();
            tradeTransRec = tradeTransRecSet.getRange({
              start: 0,
              end: 10
            });
            log.debug("tradeTransRec", tradeTransRec);
            for (var i = 0; i < tradeTransRec.length; i++) {
              let row = tradeTransRec[i];
              unitShares = row.getValue({
                name: 'custrecord_sol_invst_tt_units_of_shares'
              });
            }
            log.debug("nomAmount", nomAmount);
            log.debug("unitShares", unitShares);
            let nomAmountNow = parseFloat(nomAmount) - parseFloat(unitShares);
            log.debug("nomAmountNow", nomAmountNow);
            fixIncomeBond.setValue({
              fieldId: "custrecord_sol_invtr_fi_nominal_amount",
              value: nomAmountNow,
            });
            fixIncomeBond.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
          }
        }

      }
    } catch (error) {
      log.debug("Error in after submit", error.name + ' : ' + error.message);
    }
  }
  return {
    beforeSubmit: beforeSubmit,
    // afterSubmit: afterSubmit
  };
});