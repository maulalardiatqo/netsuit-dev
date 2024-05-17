function workflowAction() {
	var subtotal = nlapiGetField('subtotal');
	subtotal.setDisplayType('hidden')
	var total = nlapiGetField('total');
	total.setDisplayType('hidden')
	var taxtotal = nlapiGetField('taxtotal');
	taxtotal.setDisplayType('hidden')
	var amount = nlapiGetLineItemField('item', 'amount', '1');
	amount.setDisplayType('hidden'); 
	var rate = nlapiGetLineItemField('item', 'rate', '1');
	rate.setDisplayType('hidden'); 
	var grossamt = nlapiGetLineItemField('item', 'grossamt', '1');
	grossamt.setDisplayType('hidden'); 
	var tax1amt = nlapiGetLineItemField('item', 'tax1amt', '1');
	tax1amt.setDisplayType('hidden'); 
	var taxcode = nlapiGetLineItemField('item', 'taxcode', '1');
	taxcode.setDisplayType('hidden');
	var taxrate1 = nlapiGetLineItemField('item', 'taxrate1', '1');
	taxrate1.setDisplayType('hidden');
	}