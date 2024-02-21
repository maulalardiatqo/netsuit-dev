/*
 * Function: customizeGlImpact
 * Purpose:  Reclass Item Fulfillment GL Postings from COGS to an expense account based on a "billable" flag on Sales Order
 * Developer: SG - Prolecto Senior Consultant
 * Manager: MZ - Principal;
 * Client: Anonymous
 * Note: MZ repurposed for NetSuite community education
*/

function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
	try {
		//get basic variables for context
		var rectype = transactionRecord.getRecordType();
		var recid   = transactionRecord.getId();
		//noempty is custom function to return a value we expect if null is returned
		var createdfrom = noempty(transactionRecord.getFieldValue('createdfrom'),'');
		nlapiLogExecution('AUDIT', 'customizeGlImpact starting', rectype + ':' + recid + ' createdfrom:'+createdfrom);

		//we expect to be in an item fulfillment from a Sales Order
		if (createdfrom.length == 0) return;

		//learn about the transaction
		var linecount = standardLines.getCount();
		if (linecount == 0) return;  // no work to complete

		nlapiLogExecution('DEBUG', 'standardLines linecount', linecount);

		//assumption is that the deployment was only against the item fulfillment record type
		var sorecord = nlapiLoadRecord('salesorder', createdfrom);

		//only act if the flag is marked as "F"
		var billable = noempty(sorecord.getFieldValue('custbody_billable_nonbillable'),'T');
		nlapiLogExecution('DEBUG', 'billable', billable);
		if (billable == 'T') return;

		//we will create a simple map of the GL accounts (internal IDs) we are looking for and the
		//target account it should move to; ideally this be a global constant or in a lookup table.
		var map = {"1059" : "261"}

		// map_list effectively is a custom collection (not provided) that allows us to summarize
		// the value of the relevant GL accounts as the same account may be used on multiple lines;
		// the map allows us to key on only the GL accounts that need to be reclassed.  The rest are ignored
		var reclass_summary = new map_list(map);

		// loop through the posted lines and add them to the map

		for (var i=0; i<linecount; i++) {

			//get the value of NetSuite's GL posting
			var line =  standardLines.getLine(i);
			if ( !line.isPosting() ) continue; // not a posting item
			if ( line.getId() == 0 ) continue; // summary lines; ignore

			//build a unique key that spans the account, class, dept, and location
			var acc = noempty(line.getAccountId(),'').toString();
			var cls = noempty(line.getClassId(),'').toString();
			var loc = noempty(line.getLocationId(),'').toString();
			var dep = noempty(line.getDepartmentId(),'').toString();

			var key = acc + '|' + cls + '|' + loc + '|' + dep;

			//determine the amount.  debits will be positive.   Add it to the summary map
			var amt = parseFloat(noempty(line.getDebitAmount(),0)) + (parseFloat(noempty(line.getCreditAmount(),0)) * parseFloat(-1));

			reclass_summary.add(key, amt);
		};

		// now the reclass array should have the amounts we want to adjust.  Spin through it as it
		// will have unique combinations of account, class, dept and location
		var arr_reclass = reclass_summary.list;
		var keys = Object.keys(arr_reclass);
		var klen = keys.length;
		for (var k=0; k<klen; k++){
			var key = keys[k];
			nlapiLogExecution('DEBUG', key, arr_reclass[key]);
			var akey = key.split('|');
			var amt = arr_reclass[keys[k]];
			var from_acc = akey[0];
			var cls = noempty(akey[1],'').toString();
			var loc = noempty(akey[2],'').toString();
			var dep = noempty(akey[3],'').toString();
			var to_acc = noempty(akey[4],'').toString();
			nlapiLogExecution('DEBUG', 'to_acc', to_acc);

			// reverse the amounts
			amt = parseFloat(amt) * parseFloat(-1);
			if ( amt==0 ) continue;

			// remove the original amount
			var newLine = customLines.addNewLine();
			newLine.setAccountId(parseInt(from_acc));
			if ( cls.length > 0 ) {
				newLine.setClassId(parseInt(cls));
			};
			if ( loc.length > 0 ) {
				newLine.setLocationId(parseInt(loc));
			};
			if ( dep.length > 0 ) {
				newLine.setDepartmentId(parseInt(dep));
			};
			if ( parseFloat(amt) >= 0 ) {
				newLine.setDebitAmount(RoundNumber(amt,2));
			} else {
				newLine.setCreditAmount(RoundNumber(parseFloat(amt) * parseFloat(-1),2));
			};
			newLine.setMemo("Reclass non-billable expenses");

			var newLine = customLines.addNewLine();
			newLine.setAccountId(parseInt(to_acc));
			if ( cls.length > 0 ) {
				newLine.setClassId(parseInt(cls));
			}
			if ( loc.length > 0 ) {
				newLine.setLocationId(parseInt(loc));
			}
			if ( dep.length > 0 ) {
				newLine.setDepartmentId(parseInt(dep));
			}
            if ( parseFloat(amt) < 0 ) {
				newLine.setDebitAmount(RoundNumber(amt,2) * parseFloat(-1));
			} else {
				newLine.setCreditAmount(RoundNumber(parseFloat(amt),2));
			}
			newLine.setMemo("Reclass non-billable expenses");
		}
	} catch(e) {
		try {
			var err_title = 'Unexpected error';
			var err_description = '';
			if (e){
				if ( e instanceof nlobjError ){
					err_description = err_description + ' ' + e.getCode() + '|' + e.getDetails();
				} else {
					err_description = err_description + ' ' + e.toString();
				};
			};
			nlapiLogExecution('ERROR', 'Log Error ' + err_title, err_description);
		} catch(ex) {
			nlapiLogExecution('ERROR', 'Error performing error logging');
		};
	};
};