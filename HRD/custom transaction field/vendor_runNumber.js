/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
  record,
  search,
) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        log.debug("user event script run number", true);
        var rec = context.newRecord;
        var recid = rec.id;
        // log.debug("Type", rec.type);
        // log.debug("ID", rec.id);
        var typeVendor = rec.type;

        let vendorRec = record.load({
          type: rec.type,
          id: rec.id,
        });
        var vendorPrefix = '';
        switch (typeVendor) {
          case 'vendorbill':
            vendorPrefix = 'SI_'
            break;
          case 'vendorprepayment':
            vendorPrefix = 'VPP'
            break;
          case 'vendorpayment':
            vendorPrefix = 'PV'
            break;
          case 'vendorcredit':
            vendorPrefix = 'VCN_'
            break;
          case 'custompurchase_sol_pc_recoup':
            vendorPrefix = 'RPC_'
            break;
          default:
        }

        log.debug("vendorPrefix", vendorPrefix);
        log.debug('typevendor', typeVendor);
        var vendorRunningNumbers = search.create({
          type: 'customrecord_sol_running_number',
          columns: ['internalid', 'custrecord_sol_rn_prefix', 'custrecord_sol_rn_digit', 'custrecord_sol_rn_record_type', 'custrecord_sol_rn_last_running_number'],
          filters: [{
            name: 'custrecord_sol_rn_prefix',
            operator: 'is',
            values: vendorPrefix
          }, ]
        });

        log.debug("After Create search", "after create search");
        

        var vendorRunningNumbersSet = vendorRunningNumbers.run();
        vendorRunningNumbers = vendorRunningNumbersSet.getRange({
          start: 0,
          end: 1
        });

        log.debug("vendorRunningNumbers", vendorRunningNumbers);

        vendorRunningNumbers.forEach(function(vendorRunningNumber) {
          var runNumberId = vendorRunningNumber.getValue({
            name: 'internalid'
          });
          var prefixNumber = vendorRunningNumber.getValue({
            name: 'custrecord_sol_rn_prefix'
          });
          var lastNumber = parseInt(vendorRunningNumber.getValue({
            name: 'custrecord_sol_rn_last_running_number'
          }) || 0) + 1;
          var numberDigit = parseInt(vendorRunningNumber.getValue({
            name: 'custrecord_sol_rn_digit'
          }));

          var digitPart = '0';
          digitPart = digitPart.repeat(numberDigit) + lastNumber.toString();

          function rightStr(str, chr) {
            return str.slice(str.length - chr, str.length);
          }
          log.debug("DigitPart0", digitPart);
          digitPart = rightStr(digitPart, numberDigit);
          var vendorNumber = prefixNumber + digitPart;
          log.debug("vendorNumber", vendorNumber);

          vendorRec.setValue({
            fieldId: 'tranid',
            value: vendorNumber,
            ignoreFieldChange: true
          });

          vendorRec.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
          });

          var runNumber_Toupdate = record.load({
            type: 'customrecord_sol_running_number',
            id: runNumberId,
            isDynamic: true
          });

          runNumber_Toupdate.setValue({
            fieldId: 'custrecord_sol_rn_last_running_number',
            value: lastNumber,
            ignoreFieldChange: false
          });

          runNumber_Toupdate.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
          });

        });
      }
    } catch (e) {
      err_messages = 'error in after submit ' + e.name + ': ' + e.message;
      log.debug(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});