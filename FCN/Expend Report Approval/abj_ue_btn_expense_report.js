/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/search', 'N/record'], function (serverWidget, runtime, search, record) {
   
    function beforeLoad(context) {
      if (context.type === context.UserEventType.VIEW) {
          
          try {
              var rec = context.newRecord;
              var recid = rec.id;
              var form = context.form;
              var currentEmployee = runtime.getCurrentUser();
              var employeeid = currentEmployee.id;
              var reimbAmount = rec.getValue('reimbursableamount');
              var recordEmploye = record.load({
                  type: 'employee',
                  id: employeeid,
                  isDynamic: false,
              });
              var groupEmploye = recordEmploye.getValue('custentity_fcn_emp_groups');
                
                
              if (groupEmploye || groupEmploye !== '') {
                    var searchApp = search.create({
                        type: 'customrecord_fcn_approval_limit',
                    columns: ['internalid', 'custrecord_fcn_al_approval_group', 'custrecord_fcn_al_amount'],
                    });
                    var searchResult = searchApp.run().getRange({
                        start: 0,
                        end: 1000 
                      });
                    
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
                            var amount = result.getValue('custrecord_fcn_al_amount');
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
                        
                        var appFD = rec.getValue('custbody_fcn_approve_by_fd');
                        var appFM = rec.getValue('custbody_fcn_approved_by_fm');
                        var appCoo = rec.getValue('custbody_fcn_approved_by_coo');
                        var rejectFM = rec.getValue('custbody_fcn_reject_by_fm');
                        var rejectFD = rec.getValue('custbody_fcn_reject_by_fd');
                        var rejectCoo = rec.getValue('custbody_fcn_reject_by_coo')
                        var aprovalStatus = rec.getValue('approvalstatus')
    
                        var showButton = false;
                        var showButtonReject = false;
                        log.debug('appFM', appFM);
                        if(aprovalStatus != 2){
                            if (reimbAmount < amount1) {
                                if (groupEmploye === empG1) {
                                    if(aprovalStatus != 3){
                                        showButtonReject = true;
                                     }  
                                    if(appFM === false){
                                        showButton = true;
                                    }  
                                }   
                            } else if (reimbAmount < amount2 && reimbAmount > amount1) {
                                if (groupEmploye == empG1) {
                                    if(appFM === false){
                                        showButton = true;
                                    }
                                     if(aprovalStatus != 3){
                                        showButtonReject = true;
                                     }  
                                    
                                } else if (groupEmploye == empG2) {
                                    if(appFM === true && appFD === false){
                                        showButton = true;
                                    }
                                         if(aprovalStatus != 3){
                                        showButtonReject = true;
                                     }  
                                }
                            } else if (reimbAmount >= amount3) {
                                if (groupEmploye == empG1) {
                                    if(appFM === false){
                                        showButton = true;
                                    }
                                    if(aprovalStatus != 3){
                                        showButtonReject = true;
                                    }  
                                    
                                } else if (groupEmploye == empG2) {
                                    if(appFM === true){
                                        showButton = true;
                                    }
                                     if(aprovalStatus != 3){
                                        showButtonReject = true;
                                     }  
                                } else if (groupEmploye == empG3) {
                                    if(appFD === true && appFM === true && appCoo === false){
                                        showButton = true;
                                    }
                                    
                                         if(aprovalStatus != 3){
                                        showButtonReject = true;
                                     }  
                                    
                                }
                            }
                        }
                        
        
                        if (showButton) {
                            form.addButton({
                                id: 'custpage_approve_button',
                                label: 'Approve',
                                functionName: 'onApproveButtonClick(' + recid + ', ' + groupEmploye + ', ' + reimbAmount + ')'
                            });
                        }
                        if (showButtonReject) {
                            form.addButton({
                                id: 'custpage_reject_button',
                                label: 'Reject',
                                functionName: 'onRejectButtonClick(' + recid + ', ' + groupEmploye + ', ' + reimbAmount + ')'
                            });
                        }
                    } 
                  
              }
              context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_app_expense_report.js';
          } catch (error) {
              log.debug('error', error);
          }
      } 
    }
  
    return {
      beforeLoad: beforeLoad
    };
  });
  