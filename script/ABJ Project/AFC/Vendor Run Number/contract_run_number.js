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

        var rec = context.newRecord;

        let crRec = record.load({
          type: rec.type,
          id: rec.id,
        });
        let crType = crRec.getValue("custbody_abj_contract_type");
        if (crType) {
          var dataRunningNumbers = search.create({
            type: 'customrecord_contract_autogen_number',
            columns: ['internalid', 'name', 'custrecord_contract_increment', 'custrecord_contract_prefix', 'custrecord_contract_type', 'custrecord_ctrct_abj_number_digit'],
            filters: [{
              name: 'custrecord_contract_type',
              operator: 'is',
              values: crType
            }, ]
          });

          log.debug("After Create search", "after create search");

          var dataRunningNumbersSet = dataRunningNumbers.run();
          dataRunningNumbers = dataRunningNumbersSet.getRange({
            start: 0,
            end: 1
          });

          log.debug("dataRunningNumbers", dataRunningNumbers);

          dataRunningNumbers.forEach(function(dataRunningNumber) {
            var runNumberId = dataRunningNumber.getValue({
              name: 'internalid'
            });
            var prefixNumber = dataRunningNumber.getValue({
              name: 'custrecord_contract_prefix'
            });
            var lastNumber = parseInt(dataRunningNumber.getValue({
              name: 'custrecord_contract_increment'
            }) || 0) + 1;
            log.debug("lastNumber", lastNumber);
            var numberDigit = parseInt(dataRunningNumber.getValue({
              name: 'custrecord_ctrct_abj_number_digit'
            }));

            var digitPart = '0';
            digitPart = digitPart.repeat(numberDigit) + lastNumber.toString();

            function rightStr(str, chr) {
              return str.slice(str.length - chr, str.length);
            }
            log.debug("DigitPart0", digitPart);
            digitPart = rightStr(digitPart, numberDigit);
            var runNumber = prefixNumber + digitPart;
            log.debug("runNumber", runNumber);

            crRec.setValue({
              fieldId: 'tranid',
              value: runNumber,
              ignoreFieldChange: true
            });

            crRec.save({
              enableSourcing: false,
              ignoreMandatoryFields: true
            });

            var runNumber_Toupdate = record.load({
              type: 'customrecord_contract_autogen_number',
              id: runNumberId,
              isDynamic: true
            });

            runNumber_Toupdate.setValue({
              fieldId: 'custrecord_contract_increment',
              value: lastNumber,
              ignoreFieldChange: false
            });

            runNumber_Toupdate.save({
              enableSourcing: false,
              ignoreMandatoryFields: true
            });

          });
        }
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