/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/https", "N/record"], function(https, record) {
  // function beforeLoad(context) {

  // }

  // function beforeSubmit(context) {

  // }

  function afterSubmit(context) {
    try {
      if (context.type == "edit" || context.type == "create") {
        var itemRec = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id,
        });
        var initialInvest = itemRec.getValue('custrecord_sol_invst_ut_initial_invst');
        var unitsHeld = itemRec.getValue('custrecord_num_units_held');
        var navUnitLast = itemRec.getValue('custrecord_nav_unit_on_last_fy');
        var navUnitCurrent = itemRec.getValue('custrecord_nav_unit_on_current_fy');
        var dividend = itemRec.getValue('custrecord_sol_invst_ut_dividend');
        log.debug("DATA MANUAL", {
          D10: initialInvest,
          C10: unitsHeld,
          H10: navUnitLast,
          I10: navUnitCurrent,
          P10: dividend
        });
        var purchasePriceUnit = parseFloat(initialInvest) / parseFloat(unitsHeld);
        var navOnLast = parseFloat(unitsHeld) * parseFloat(navUnitLast);
        var disposableValue = parseFloat(unitsHeld) * parseFloat(navUnitCurrent);
        var changesOnFair = disposableValue - navOnLast;
        var capitalGain = disposableValue - parseFloat(initialInvest);
        log.debug("DATA CALC", {
          E10: purchasePriceUnit.toFixed(2),
          L10: navOnLast.toFixed(2),
          M10: disposableValue.toFixed(2),
          N10: changesOnFair.toFixed(2),
          O10: capitalGain.toFixed(2)
        });

        itemRec.setValue({
          fieldId: 'custrecord_purchase_per_unit',
          value: purchasePriceUnit.toFixed(2),
          ignoreFieldChange: false
        });

        itemRec.setValue({
          fieldId: 'custrecord_nav_on_last_fy',
          value: navOnLast.toFixed(2),
          ignoreFieldChange: false
        });

        itemRec.setValue({
          fieldId: 'custrecord_changes_bsd_on_fair_valuation',
          value: changesOnFair.toFixed(2),
          ignoreFieldChange: false
        });

        itemRec.setValue({
          fieldId: 'custrecord_sol_invst_ut_unrealised_gain',
          value: capitalGain.toFixed(2),
          ignoreFieldChange: false
        });

        itemRec.setValue({
          fieldId: 'custrecord_sol_invst_ut_market_value',
          value: disposableValue.toFixed(2),
          ignoreFieldChange: false
        });

        itemRec.save({
          enableSourcing: false,
          ignoreMandatoryFields: true
        });

      }
    } catch (ex) {
      log.error(ex.name, ex);
    }
  }

  return {
    // beforeLoad: beforeLoad,
    // beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});