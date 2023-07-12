	/**
	 * @NApiVersion 2.1
	 * @NScriptType UserEventScript
	 */

	define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect"], function(
	  record,
	  search,
	  serverWidget,
	  runtime, currency, redirect
	) {
	  function afterSubmit(context) {
		try {
		  if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
			log.debug("Debug", 'after submit');
			var rec = context.newRecord;
			var id = rec.id;
			var dataTrans = record.load({
			  type: "customrecord1276",
			  id: id,
			  isDynamic: true
			});
			log.debug("dataTrans 1", dataTrans);

			var lineTotal = dataTrans.getLineCount({
			  sublistId: "recmachcustrecord_adg_id",
			});
			log.debug("lineTotal", lineTotal);
			// var approvalNow = [];
			// var delegateApprovalNow = [];
			for (var i = 0; i < lineTotal; i++) {
			  var employee = dataTrans.getSublistValue({
				sublistId: "recmachcustrecord_adg_id",
				fieldId: "custrecord_adg_emplouee",
				line: i,
			  });
			  var delegateTo = dataTrans.getSublistValue({
				sublistId: "recmachcustrecord_adg_id",
				fieldId: "custrecord_adg_delegate_to",
				line: i,
			  });
			  
			  if (employee) {
				  var dataEmployee = record.load({
					type: "employee",
					id: employee,
					isDynamic: true
				  });

				  log.debug("dataEmployee", dataEmployee);
				  var approvalNow = dataEmployee.getValue("custentity_emp_approval");
				  log.debug("approvalNow", approvalNow);

				  // set new value to approval field
				  approvalNow.push("" + id + "");
				  approvalNow = [...new Set(approvalNow)];
				  log.debug("approvalUpd", approvalNow);
				  dataEmployee.setValue({
					fieldId: 'custentity_emp_approval',
					value: approvalNow,
				  });

				  var apvId = dataEmployee.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				  });
			  }
			  
			  if (delegateTo) {		
				  log.debug("dataGet", {
					employee: employee,
					delegateTo: delegateTo,
				  });

				  var dataDelegateTo = record.load({
					type: "employee",
					id: delegateTo,
					isDynamic: true
				  });

				  log.debug("dataDelegateTo", dataDelegateTo);
				  var delegateApprovalNow = dataDelegateTo.getValue("custentity_emp_delegation");
				  log.debug("delegateApprovalNow before push", delegateApprovalNow);

				  // set new value to approval field
				  delegateApprovalNow.push("" + id + "");
				  log.debug("delegateApprovalNow after push", delegateApprovalNow);
				  delegateApprovalNow = [...new Set(delegateApprovalNow)];
				  log.debug("delegateApprovalUpd", delegateApprovalNow);
				  dataDelegateTo.setValue({
					fieldId: 'custentity_emp_delegation',
					value: delegateApprovalNow,
				  });

				  var delApvId = dataDelegateTo.save({
					enableSourcing: true,
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