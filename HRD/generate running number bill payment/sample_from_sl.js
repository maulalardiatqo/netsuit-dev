/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/lock'], function (record, lock) {
    function onRequest(context) {
      if (context.request.method === 'GET') {
        var recordType = context.request.parameters.recordType;
        var runningNumber = getRunningNumber(recordType);
        context.response.write(runningNumber);
      }
    }
  
    function getRunningNumber(recordType) {
      var myLock = lock.create({ type: lock.Type.NON_EXCLUSIVE, id: 'mylock' });
      var success = myLock.try();
      if (success) {
        var filter = [];
        var searchObj = search.create({
          type: recordType,
          filters: filter,
          columns: [search.createColumn({ name: 'internalid', sort: search.Sort.DESC })]
        });
        var lastRecord = searchObj.run().getRange({ start: 0, end: 1 })[0];
        var runningNumber = lastRecord ? parseInt(lastRecord.getValue('custbody_running_number')) + 1 : 1;
  
        myLock.release();
  
        return runningNumber;
      } else {
        throw new Error('Could not acquire lock');
      }
    }
  
    return {
      onRequest: onRequest
    };
  });