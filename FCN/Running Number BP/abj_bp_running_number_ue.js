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
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {

        var rec = context.newRecord;
        log.debug('rec', rec)
        log.debug('execute')
        var billpymrec = record.load({
          type: rec.type,
          id: rec.id,
        });
        var subsidiary = billpymrec.getValue('subsidiary');
        if(subsidiary){
          var subRecord = record.load({
              type: "subsidiary",
              id: subsidiary,
              isDynamic: false,
          });

          var textSub = subRecord.getValue('tranprefix')
          log.debug('tranPrefix', textSub);
        }
        log.debug('subsidiary', subsidiary);
        var dateBill = billpymrec.getValue('trandate');
        log.debug('dateBill', dateBill);
        var date = new Date(dateBill);

          var day = date.getDate();
          var month = date.getMonth() + 1;
          var year = date.getFullYear();

          var dayFormatted = day < 10 ? "0" + day : day;
          var monthFormatted = month < 10 ? "0" + month : month;

          var formattedDate = dayFormatted + "/" + monthFormatted + "/" + year;
          log.debug('formatdate',formattedDate)

          var lastTwoDigits = year.toString().slice(-2);
          log.debug('lastTwoDigit', lastTwoDigits);
        var formatRunning = textSub + ' ' +  'BP' + lastTwoDigits + monthFormatted
        log.debug('formatRunning', formatRunning);


        var searchBPNumber = search.create({
        type: "customrecord_bp_numbering",
        filters:
        [
            ["custrecord_fcn_bpn_subsidiary","anyof",subsidiary], 
            "AND", 
            ["custrecord_fcn_bpn_start_date","onorbefore",formattedDate], 
            "AND", 
            ["custrecord_fcn_bpn_end_date","onorafter",formattedDate]
        ],
        columns:
        [
            search.createColumn({name: "internalid", label: "Internal ID"}),
            search.createColumn({name: "custrecord_fcn_bpn_subsidiary", label: "Subsidiary"}),
            search.createColumn({name: "custrecord_fcn_bpn_last_run", label: "Last Running Number"}),
            search.createColumn({name: "custrecord_fcn_bpn_minimum_digit", label: "Minimum Digit"}),
            search.createColumn({name: "custrecord_fcn_bpn_start_date", label: "Start Date"}),
            search.createColumn({name: "custrecord_fcn_bpn_end_date", label: "End Date"}),
            search.createColumn({name: "custrecord_fcn_bpn_sample_format", label: "Sample Format"})
        ]
      });
      var searchBPNumberSet = searchBPNumber.run()
      searchBPNumber = searchBPNumberSet.getRange({
          start: 0,
          end: 1
      });
      log.debug('searchBPNumber', searchBPNumber);
      log.debug('month', month)
      var startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      log.debug('startDate', startDate);

      var endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);
      log.debug('endDate', endDate);
      
      if(searchBPNumber.length > 0){
          var bpNumberRecord = searchBPNumber[0];
          var minimumDigit = bpNumberRecord.getValue({
              name: 'custrecord_fcn_bpn_minimum_digit'
          });
          var startDateBP =bpNumberRecord.getValue({
            name : 'custrecord_fcn_bpn_start_date'
          });
          log.debug('startDateBp', startDateBP);
          var lastRun = bpNumberRecord.getValue({
              name: 'custrecord_fcn_bpn_last_run'
          }) || 0 
          var internalid = bpNumberRecord.getValue({
              name : 'internalid'
          });
          log.debug('internalidbp', internalid);
          log.debug('lastRun', lastRun);

          var runningNumber = ''
          if(lastRun === 0){
              var newLastRun = lastRun + 1;
              var newDigitPart = '0'.repeat(minimumDigit) + newLastRun.toString();

              runningNumber = formatRunning + newDigitPart
              log.debug('runningNumber', runningNumber);
          }else{
              var lastRunNumber = parseInt(lastRun.substring(formatRunning.length), 10);
              var newLastRun = lastRunNumber + 1;
              var newDigitPart = '0'.repeat(minimumDigit - newLastRun.toString().length) + newLastRun.toString();
      
              runningNumber = formatRunning + newDigitPart;
              
          }
          log.debug('runningNumber', runningNumber);
          var recordBP = record.load({
              type : 'customrecord_bp_numbering',
              id : internalid,
              isDynamic : true
          });
          recordBP.setValue({
              fieldId: 'custrecord_fcn_bpn_last_run',
              value: runningNumber,
              ignoreFieldChange: true
            });
          recordBP.save({
          enableSourcing: false,
          ignoreMandatoryFields: true
          });

          billpymrec.setValue({
            fieldId : 'tranid',
            value : runningNumber,
            ignoreFieldChange: true
          });
          billpymrec.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
            });

      }else{
          var createRecordBp = record.create({
              type: 'customrecord_bp_numbering',
              isDynamic: true
          });

          createRecordBp.setValue({
              fieldId: 'custrecord_fcn_bpn_last_run',
              value: formatRunning + '001', 
              ignoreFieldChange: true
          });
          createRecordBp.setValue({
              fieldId: 'custrecord_fcn_bpn_preffix',
              value: '${subsidiary} BP${YY}${MM}', 
              ignoreFieldChange: true
          });
          createRecordBp.setValue({
            fieldId: 'custrecord_fcn_bpn_minimum_digit',
            value: 3, 
            ignoreFieldChange: true
        });
        createRecordBp.setValue({
          fieldId: 'custrecord_fcn_bpn_subsidiary',
          value: subsidiary, 
          ignoreFieldChange: true
        });
        createRecordBp.setValue({
          fieldId: 'custrecord_fcn_bpn_start_date',
          value: startDate, 
          ignoreFieldChange: true
        });
        createRecordBp.setValue({
          fieldId: 'custrecord_fcn_bpn_end_date',
          value: endDate, 
          ignoreFieldChange: true
        });
        var saveBp = createRecordBp.save({
          enableSourcing: false,
          ignoreMandatoryFields: true
        });
        log.debug('saveBp', saveBp);
        if(saveBp){
          billpymrec.setValue({
            fieldId : 'tranid',
            value : formatRunning + '001',
            ignoreFieldChange: true
          });
          billpymrec.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
          });
        }

        
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