/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope SameAccount
 */
 define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/currentRecord", "N/search", "N/format", "N/ui/message"],
 function(error, dialog, url, record, currentRecord, search, format, message) {
   var currRecord = currentRecord.get();

    function pageInit(context) {
        //console.log("test in");
    }
    function onRejectButtonClick(recid, groupEmploye, reimbAmount) {
      var loadingMessage = message.create({
        title: 'Please wait...',
        message: 'Processing your request...',
        type: message.Type.CONFIRMATION
      });
      loadingMessage.show();

      setTimeout(function() {
        onRejectButtonClickProcess(recid, groupEmploye, reimbAmount).then(function() {
          loadingMessage.hide();
        });
      }, 1000); // Change the delay time as needed
    }
    function onRejectButtonClickProcess(recid, groupEmploye, reimbAmount){
      return new Promise(function(resolve, reject) {
        try{
          console.log('recid', recid);
            if(recid){
                var expenseRecord = record.load({
                    type: "expensereport",
                    id: recid,
                    isDynamic: true
                });
              }
              var searchApp = search.create({
                type: 'customrecord_fcn_approval_limit',
            columns: ['internalid', 'custrecord_fcn_al_approval_group', 'custrecord_fcn_al_amount'],
            });
            var searchResult = searchApp.run().getRange({
                start: 0,
                end: 1000 
              });
            log.debug('lengtResult', searchResult.length);
            
            if(searchResult.length > 0){
                var empG1;
                var empG2;
                var empG3;
                var amount1;
                var amount2;
                var amount3;
                var index = 0;
                searchResult.forEach(function(result){
                    var groupId = result.getValue('custrecord_fcn_al_approval_group');
                    log.debug('groupId', groupId);
                    var amount = result.getValue('custrecord_fcn_al_amount');
                    log.debug('amount', amount);
                    if (index === 0) {
                        amount1 = amount;
                        empG1 = groupId
                      } else if (index === 1) {
                        amount2 = amount;
                        empG2 = groupId
                      } else if (index === 2) {
                        amount3 = amount;
                        empG3 = groupId
                      }
                    
                      index++;
                });
              }
              if(groupEmploye == empG1){
                expenseRecord.setValue({fieldId: 'custbody_fcn_reject_by_fm', value: true})
                expenseRecord.setValue({ fieldId: 'approvalstatus', value: 3 });
              }
              if(groupEmploye == empG2){
                expenseRecord.setValue({fieldId: 'custbody_fcn_reject_by_fd'});
                expenseRecord.setValue({ fieldId: 'approvalstatus', value: 3 });
              }
              if(groupEmploye == empG2){
                expenseRecord.setValue({fieldId: 'custbody_fcn_reject_by_coo'});
                expenseRecord.setValue({ fieldId: 'approvalstatus', value: 3 });
              }
              
              var saveExpense = expenseRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });
                console.log('save', saveExpense);
                if(saveExpense){
                    location.reload();
                }
          resolve()
        }catch(error){
          console.log('error', error)
          reject()
        }
      });
    }
    function onApproveButtonClick(recid, groupEmploye, reimbAmount) {
      var loadingMessage = message.create({
        title: 'Please wait...',
        message: 'Processing your request...',
        type: message.Type.CONFIRMATION
      });
      loadingMessage.show();

      setTimeout(function() {
        onApproveButtonClickProcess(recid, groupEmploye, reimbAmount).then(function() {
          loadingMessage.hide();
        });
      }, 1000); // Change the delay time as needed
    }
    function onApproveButtonClickProcess(recid, groupEmploye, reimbAmount){
      return new Promise(function(resolve, reject) {
        try{
            console.log('recid', recid);
            if(recid){
                var expenseRecord = record.load({
                    type: "expensereport",
                    id: recid,
                    isDynamic: true
                });
                var AppFD = expenseRecord.getValue('custbody_fcn_approve_by_fd');
                console.log('appFD', AppFD)
                var appFM = expenseRecord.getValue('custbody_fcn_approved_by_fm');
                console.log('appFM', appFM)
                var appCoo = expenseRecord.getValue('custbody_fcn_approved_by_coo');
                var setTrue = false;
                console.log('groupEMploye', groupEmploye);
                var searchApp = search.create({
                        type: 'customrecord_fcn_approval_limit',
                    columns: ['internalid', 'custrecord_fcn_al_approval_group', 'custrecord_fcn_al_amount'],
                    });
                    var searchResult = searchApp.run().getRange({
                        start: 0,
                        end: 1000 
                      });
                    log.debug('lengtResult', searchResult.length);
                    
                    if(searchResult.length > 0){
                        var empG1;
                        var empG2;
                        var empG3;
                        var amount1;
                        var amount2;
                        var amount3;
                        var index = 0;
                        searchResult.forEach(function(result){
                            var groupId = result.getValue('custrecord_fcn_al_approval_group');
                            log.debug('groupId', groupId);
                            var amount = result.getValue('custrecord_fcn_al_amount');
                            log.debug('amount', amount);
                            if (index === 0) {
                                amount1 = amount;
                                empG1 = groupId
                              } else if (index === 1) {
                                amount2 = amount;
                                empG2 = groupId
                              } else if (index === 2) {
                                amount3 = amount;
                                empG3 = groupId
                              }
                            
                              index++;
                        });
                      }
            if (reimbAmount < amount1) {
                if (groupEmploye == empG1) {
                    expenseRecord.setValue({ fieldId: 'custbody_fcn_approved_by_fm', value: true });
                    expenseRecord.setValue({ fieldId: 'approvalstatus', value: 2 });
                    setTrue = true;
                }
            } else if (reimbAmount < amount2) {
                if (groupEmploye == empG1 && appFM == false) {
                  console.log('in', groupEmploye)
                    expenseRecord.setValue({ fieldId: 'custbody_fcn_approved_by_fm', value: true });
                    setTrue = true;
                } else if (groupEmploye == empG2 && appFM === true) {
                  console.log('disini')
                    expenseRecord.setValue({ fieldId: 'custbody_fcn_approve_by_fd', value: true });
                    expenseRecord.setValue({ fieldId: 'approvalstatus', value: 2 });
                    setTrue = true;
                }
            } else if (reimbAmount >= amount3) {
                if (groupEmploye == empG1 && appFM == false) {
                    expenseRecord.setValue({ fieldId: 'custbody_fcn_approved_by_fm', value: true });
                    setTrue = true;
                } else if (groupEmploye == empG2 && appFM === true) {
                    expenseRecord.setValue({ fieldId: 'custbody_fcn_approve_by_fd', value: true });
                    setTrue = true;
                } else if (groupEmploye == empG3 && appFM === true && AppFD === true) {
                    expenseRecord.setValue({ fieldId: 'custbody_fcn_approved_by_coo', value: true });
                    expenseRecord.setValue({ fieldId: 'approvalstatus', value: 2 });
                    setTrue = true;
                }
            }
            if (setTrue) {
              console.log('isSettru',setTrue)
                var saveExpense = expenseRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });
                console.log('save', saveExpense);
                if(saveExpense){
                    location.reload();
                }
            }
            
        }

          resolve()
        }catch(error){
          console.log('error', error);
          reject()
        }

      });
        
    }
   return {
    pageInit: pageInit,
    onRejectButtonClick: onRejectButtonClick,
    onApproveButtonClick: onApproveButtonClick
  };
});