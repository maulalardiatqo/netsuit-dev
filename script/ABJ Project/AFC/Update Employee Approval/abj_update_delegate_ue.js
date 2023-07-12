/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/email', 'N/format'], (record, search, email, format) => {
  function afterSubmit(scriptContext) {
    try {
      var rec = scriptContext.newRecord;
      var oldrec = scriptContext.oldRecord;
      var delegateTo = rec.getValue('custentity_sas_delegation_delegateto');
      var olddelegateTo = oldrec.getValue('custentity_sas_delegation_delegateto');
      var emplName = rec.getValue('entityid');
      var IsDelegated = rec.getValue('custentity_sas_delegation_isdelegated');
      var StartDate = rec.getValue('custentity_sas_delegation_startdate');
      //StartDate = format.parse({value:StartDate, type: format.Type.DATE});
      var EndDate = rec.getValue('custentity_sas_delegation_enddate');
      //EndDate = format.parse({value:EndDate, type: format.Type.DATE});
      var OriginApproval = rec.id;

      if (olddelegateTo || delegateTo) {
        log.debug('delegateTo', delegateTo);
        log.debug('olddelegateTo', olddelegateTo);
        log.debug('IsDelegated', IsDelegated);
        log.debug('StartDate', StartDate);
        log.debug('EndDate', EndDate);
        var idEmp = delegateTo ? delegateTo : olddelegateTo;
        var empRecord = record.load({
          type: 'employee',
          id: idEmp,
          isDynamic: true,
        });
        var delegateTo_email = empRecord.getValue('email');
        var delegateTo_name = empRecord.getValue('entityid');
        //var delegateApprovalNow = empRecord.getValue("custentity_emp_delegation");

        if ((delegateTo !== olddelegateTo) && olddelegateTo) {
          var empRecordtoclear = record.load({
            type: 'employee',
            id: olddelegateTo,
            isDynamic: true,
          });

          empRecordtoclear.setValue({
            fieldId: 'custentity_emp_delegation',
            value: []
          });

          var emprec_id = empRecordtoclear.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        }

        var EmployeeApprovals = search.create({
          type: 'customrecord1275',
          columns: [{
            name: 'internalid'
          }],
          filters: [{
            name: 'custrecord_adg_emplouee',
            operator: 'is',
            values: OriginApproval
          }, ]
        }).run().getRange(0, 999);
        log.debug("EmployeeApprovals", EmployeeApprovals);

        function SaveEmpApproval(empApproval) {
          var empH = empApproval.setValue({
            fieldId: "custrecord_adg_emplouee",
            value: OriginApproval,
          });
          log.debug("empH", OriginApproval);
          var delgTo = empApproval.setValue({
            fieldId: "custrecord_adg_delegate_to",
            value: delegateTo,
          });
          log.debug("delgTo", delegateTo);
          var sDate = empApproval.setValue({
            fieldId: "custrecord_adg_start_date",
            value: StartDate,
          });
          log.debug("sDate", StartDate);
          var eDate = empApproval.setValue({
            fieldId: "custrecord_adg_end_date",
            value: EndDate,
          });
          log.debug("eDate", EndDate);
          return empApproval.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        }
        // var list_empApproval_id = []; custentity_emp_delegation
        var list_empApproval_id = empRecord.getValue("custentity_emp_delegation");
        log.debug("list_empApproval_id", list_empApproval_id);

        if (EmployeeApprovals.length > 0) {
          EmployeeApprovals.forEach(function(EmployeeApproval) {
            var empApproval_id = EmployeeApproval.getValue({
              name: 'internalid'
            });
            log.debug("empApproval_id", empApproval_id);
            var empApproval = record.load({
              type: 'customrecord1275',
              id: empApproval_id
            });
            // log.debug("empApproval Data", empApproval);
            if (IsDelegated) {
              log.debug("update delegate", true);
              var GrpApprovlId = empApproval.getValue('custrecord_adg_id');
              log.debug('GrpApprovlId', GrpApprovlId);
              var empApproval_id_updated = SaveEmpApproval(empApproval);
              log.debug('empApproval_id_1', empApproval_id_updated);
              if (GrpApprovlId) {
                list_empApproval_id.push(GrpApprovlId);
              }
            } else {
              log.debug("undelegate", true);
              empApproval.setValue({
                fieldId: "custrecord_adg_delegate_to",
                value: null,
              });

              empApproval.setValue({
                fieldId: "custrecord_adg_start_date",
                value: null,
              });

              empApproval.setValue({
                fieldId: "custrecord_adg_end_date",
                value: null,
              });

              // empApproval.setValue({
              //   fieldId: "custrecord_adg_id",
              //   value: null,
              // });

              empApproval.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
              });
            }
          });
        } else {
          if (IsDelegated) {
            log.debug("create new delegate", true);
            var empApproval = record.create({
              type: 'customrecord1275',
            });
            var empApproval_id = SaveEmpApproval(empApproval);
            log.debug('empApproval_id_2', empApproval_id);
          }
        }
        log.debug("list_empApproval_id", list_empApproval_id);
        var delegateApprovalNow = [...new Set(list_empApproval_id)];
        log.debug('delegateApprovalNow', delegateApprovalNow);

        empRecord.setValue({
          fieldId: 'custentity_emp_delegation',
          value: delegateApprovalNow,
        });
        var emprec_id = empRecord.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });

        if (StartDate) {
          StartDate = format.format({
            value: StartDate,
            type: format.Type.DATE
          });
        } else {
          StartDate = null;
        }

        if (EndDate) {
          EndDate = format.format({
            value: EndDate,
            type: format.Type.DATE
          });
        } else {
          EndDate = null;
        }
        var Email_content = 'Hi, ' + delegateTo_name + ', you have delegate approval from ' +
          emplName + '. this approval delegation will valid from ' + StartDate + ' to ' + EndDate;
        emailSend = email.send({
          author: OriginApproval,
          recipients: delegateTo_email,
          subject: 'Approval Delegation from ' + emplName,
          body: Email_content
        });
      }
    } catch (error) {
      log.error({
        title: 'afterSubmit update delegate',
        details: error.message
      });
    }
  }
  return {
    afterSubmit: afterSubmit
  };
});