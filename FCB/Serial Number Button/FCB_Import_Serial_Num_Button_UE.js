/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/url'],

function (record, url)
{
	function beforeLoad(context)
	{
		var form			= context.form;
		var recObj			= context.newRecord;
		var recID			= context.newRecord.id;
		try {
			if(context.type == context.UserEventType.VIEW) {
				var orderStatus		= recObj.getValue('orderstatus');
				var locObj			= recObj.getValue('location');
				log.debug({title: "orderStatus", details: orderStatus});
				form.clientScriptModulePath = '/SuiteScripts/FCB_Open_SuiteLet_PopUp_CL.js';
				var suiteletUrl			= url.resolveScript({scriptId: 'customscript_fcb_transform_po_sl',
															deploymentId: 'customdeploy1', returnExternalUrl: true});
				var serialNoUrl_Import	= suiteletUrl + '&recordId=' +recID+ '&recordType=' +recObj.type+ '&Button_Type=Import&locObj=' +locObj;
				var serialNoUrl_Export	= suiteletUrl + '&recordId=' +recID+ '&recordType=' +recObj.type+ '&Button_Type=Export&locObj=' +locObj;
				//var resp = window.open(url,'_blank','width=300,height=300,titlebar=0,status=no,menubar=no,resizable=0,scrollbars=0');
				if(orderStatus == 'B' || orderStatus == 'D' || orderStatus == 'E') {
					var importSerialNo	= form.addButton({id : 'custpage_import_serial_no', label : 'Import Serial No', functionName : "importFunction('" + serialNoUrl_Import.toString() + "', '"+locObj+"');"});
					var exportTemplate	= form.addButton({id : 'custpage_export_template', label : 'Export Template', functionName : "exportFunction('" + serialNoUrl_Export.toString() + "', '"+locObj+"');"});
				}
			}
		}
		catch(e) {
			log.debug({title: "Exception Message", details:e.message});
		}
	}
	
	function _dataValidation(value) 
	{
		if(value!='null' && value != null && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) 
		{
			return true;
		}
		else 
		{ 
			return false;
		}
	}
	
	return {
		beforeLoad : beforeLoad
	}
});
