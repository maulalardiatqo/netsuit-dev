function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
	try 
	{
		var rectype = transactionRecord.getRecordType();
		var recid = transactionRecord.getId();
		
		if(rectype == "invoice")	
		{
			var entity_id = transactionRecord.getFieldValue('entity');
			var lineTransaction = transactionRecord.getLineItemCount('item');
			for(var c = 1;c <= lineTransaction;c++)
			{
				var item_amount = transactionRecord.getLineItemValue('item','amount', c);
				nlapiLogExecution('DEBUG', 'item_amount', item_amount);
				
				if(parseFloat(item_amount) > 0){
					// DEBIT
					var newLineDebit = customLines.addNewLine();
					newLineDebit.setAccountId(147);
					newLineDebit.setDebitAmount(item_amount);
					newLineDebit.setMemo('Journal Balik');
					//newLineDebit.setEntityId(parseInt(entity_id));
					
					// CREDIT
					var newLineCredit = customLines.addNewLine();
					newLineCredit.setAccountId(123);
					newLineCredit.setCreditAmount(item_amount);
					newLineCredit.setMemo('Journal Balik');
					//newLineCredit.setEntityId(parseInt(entity_id));

					// Assign Custom GL
					// Administration Department
					// DEBIT
					var newLineDebit = customLines.addNewLine();
					newLineDebit.setAccountId(123);
					newLineDebit.setDebitAmount(25000);
					//newLineDebit.setEntityId(parseInt(entity_id));
					newLineDebit.setDepartmentId(3);
					// CREDIT
					var newLineCredit = customLines.addNewLine();
					newLineCredit.setAccountId(147);
					newLineCredit.setCreditAmount(25000);
					//newLineCredit.setEntityId(parseInt(entity_id));
					newLineCredit.setDepartmentId(3);

					// Marketing
					// DEBIT
					var newLineDebit = customLines.addNewLine();
					newLineDebit.setAccountId(123);
					newLineDebit.setDebitAmount(30000);
					//newLineDebit.setEntityId(parseInt(entity_id));
					newLineDebit.setDepartmentId(7);
					// CREDIT
					var newLineCredit = customLines.addNewLine();
					newLineCredit.setAccountId(147);
					newLineCredit.setCreditAmount(30000);
					//newLineCredit.setEntityId(parseInt(entity_id));
					newLineCredit.setDepartmentId(7);

					// Direct
					// DEBIT
					var newLineDebit = customLines.addNewLine();
					newLineDebit.setAccountId(123);
					newLineDebit.setDebitAmount(20000);
					//newLineDebit.setEntityId(parseInt(entity_id));
					newLineDebit.setDepartmentId(5);
					// CREDIT
					var newLineCredit = customLines.addNewLine();
					newLineCredit.setAccountId(147);
					newLineCredit.setCreditAmount(20000);
					//newLineCredit.setEntityId(parseInt(entity_id));
					newLineCredit.setDepartmentId(5);
				}
			}
		}

		} catch(e) {
			try {
				var err_title = 'Unexpected error';
				var err_description = '';
				if (e){
					if ( e instanceof nlobjError ){
						err_description = err_description + ' ' + e.getCode() + '|' + e.getDetails()+e;
					} else {
						err_description = err_description + ' ' + e.toString();
					}
				}
				nlapiLogExecution('ERROR', 'Log Error ' + err_title, err_description);
			} catch(ex) {
				nlapiLogExecution('ERROR', 'Error performing error logging');
			}
		}

}
