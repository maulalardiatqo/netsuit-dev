/**
* Copyright (c) 1998-2016 NetSuite, Inc.
* 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
* All Rights Reserved.
*
* This software is the confidential and proprietary information of
* NetSuite, Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with NetSuite.
* 
* use for implementing CK Editor on the text area custrecord_nsts_tex_body and custrecord_nsts_tex_header
* 
* Version   Date            Author      Remarks
* 1.00                      rbanares    initial version
* 2.00      1 Feb 2016      dgeronimo
*/

function userEventBeforeLoad(type, form, request)
{
	// View or edit - display PDF button.
	var strButtonLabel = '';
	if (nlapiGetContext().getExecutionContext() == "userinterface" && (type == "view" || type == "edit"))
	{
		var intRecordTypeID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ue_applies_to_record_type');
		var intHTMLTemplateRecordID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ue_html_template_record');
		var strExistFileFieldID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ue_exist_file_id');
		var intTrxnForm = '';
		var intSubsidiaryID = '';
		var intReturnTypeID = '';
		var intTargetDirectory = '';
		
		var objConfig = getTexConfig(intHTMLTemplateRecordID);

		strButtonLabel = (!isNullOrEmpty(intHTMLTemplateRecordID)) ? objConfig[CUSTRECORD_NSTS_TEX_BUTTON_NAME]  : 'Print PDF';
		strButtonLabel = (isNullOrEmpty(strButtonLabel)) ? 'Print PDF' : strButtonLabel;

		intTrxnForm = (!isNullOrEmpty(intHTMLTemplateRecordID)) ? objConfig[CUSTRECORD_NSTS_TEX_TRXN_FORM]  : '';

		intRecordTypeID = (isNullOrEmpty(intRecordTypeID)) ? '' : intRecordTypeID;

		var intForm = '';

		if (type == 'view')
		{
			try
			{
			    var recObj = getRecord(nlapiGetRecordType(), nlapiGetRecordId());
				intForm = recObj.getValue("customform");
			} catch (ex)
			{
				var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' + ex.getStackTrace().join('\n') : ex.toString();
				nlapiLogExecution('debug', 'userEventAfterSubmit Exception error', errorStr);
			}
		}
		if (type == 'edit')
		{
			intForm = nlapiGetFieldValue('customform');
		}

		if ((isNullOrEmpty(intTrxnForm)) || (!isNullOrEmpty(intTrxnForm) && intForm == intTrxnForm))
		{
			var intExistFileID = '';
			intExistFileID = (!isNullOrEmpty(strExistFileFieldID)) ? nlapiGetFieldValue(strExistFileFieldID) : '';// 'custrecord_pvi_file');
			var jsStr = '';
			if (!isNullOrEmpty(intExistFileID))
			{
				var recFile = nlapiLoadFile(intExistFileID);

				var strFileURL = recFile.getURL();
				jsStr = "window.open('" + strFileURL + "',\'_blank\'); windown.focus();";

			} else
			{
				jsStr = "window.open('" + nlapiResolveURL("SUITELET", "customscript_template_generate_pdf", "customdeploy_template_generate_pdf") + "&param_transaction_record_type=" + nlapiGetRecordType() + "&param_transaction_id=" + nlapiGetRecordId() + "&param_subsidiary=" + nlapiGetFieldValue('subsidiary') + "&param_template_id=" + intHTMLTemplateRecordID + "&param_filename=" + intHTMLTemplateRecordID + "&param_subsidiary=" + intSubsidiaryID + "&param_return_type=" + intReturnTypeID + "&param_target_directory=" + intTargetDirectory + "&param_record_type_id=" + intRecordTypeID + "',\'_blank\'); windown.focus();";
			}
			form.addButton("custpage_ps_ue_print", strButtonLabel, jsStr);
            form.addButton("custpage_print_cuy", 'Test Print', 'window.alert("Yuhu")');

		}
	}
}

/**
 * Checkbox in all transaction type, tick in checkbox means email will be sent with PDF attached
 */
function userEventAfterSubmit(type)
{
	var processMessage = '';
	try
	{
		if (nlapiGetContext().getExecutionContext() == 'userinterface')
		{
			var scriptParamTransactionId = nlapiGetContext().getSetting('SCRIPT', 'custscript_ue_html_template_record');// Function.getDefaultHTMLTemplate(nlapiGetRecordType());

			var recObj = getRecord(nlapiGetRecordType(), nlapiGetRecordId());
			
			var toBeEmail = recObj.getValue(CUSTBODY_HT_TO_BE_EMAILED);
			var toAddress = recObj.getValue(CUSTBODY_HT_TO_ADDRESS);
			var ccAddress = recObj.getValue(CUSTBODY_HT_CC_ADDRESS);

			if (!Function.isUndefinedNullOrEmpty(toAddress) && !Function.isUndefinedNullOrEmpty(scriptParamTransactionId))
			{
				if (Function.isUndefinedNullOrEmpty(ccAddress))
				{
					ccAddress = null;
				} else
				{
					ccAddress = ccAddress.split(',');
				}

				if (toBeEmail == 'T')
				{
					var objConfig = getTexConfig(scriptParamTransactionId);
					
					
					var emailBody = objConfig[CUSTRECORD_NSTS_TEX_EMAIL_TEMPLATE];
					var emailSubject = objConfig[CUSTRECORD_NSTS_TEX_EMAIL_SUBJECT];
					var attachment = new Library.XMLToPDF();

					var intHTMLTemplateRecordID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ue_html_template_record');
					var objTemplate = attachment.getTemplatingDetails(intHTMLTemplateRecordID); // should be always be pdf
					var intRecordTypeID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ue_applies_to_record_type');

					var arParams = [];
					arParams['param_transaction_record_type'] = nlapiGetRecordType();
					arParams['param_transaction_id'] = nlapiGetRecordId();
					arParams['param_subsidiary'] = nlapiGetFieldValue('subsidiary');
					arParams['param_record_type_id'] = intRecordTypeID;

					var strTemplate = attachment.getOutput(objTemplate, nlapiGetRecordId(), arParams, nlapiGetFieldValue('subsidiary'));
					var objAtt = attachment.getObject(strTemplate, 'F', objTemplate.outputtype, nlapiGetFieldValue('subsidiary'));

					var records = new Object();
					records['transaction'] = nlapiGetRecordId();
					records['recordtype'] = nlapiGetRecordType();
					records['record'] = nlapiGetRecordId();

					nlapiSendEmail(nlapiGetContext().getUser(), toAddress, emailSubject, emailBody, ccAddress, null, records, objAtt);
					var arrFields = new Array();
					var arrValues = new Array();
					arrFields[0] = 'custbody_ht_to_be_emailed';
					arrFields[1] = 'custbody_ht_receipt';
					arrValues[0] = 'F';
					arrValues[1] = 'T';
					nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), arrFields, arrValues);
				}
			}
			if (Function.isUndefinedNullOrEmpty(toAddress))
			{
				if (toBeEmail == 'T')
				{
					nlapiSendEmail(nlapiGetContext().getUser(), nlapiGetUser(), 'Order# ' + nlapiGetRecordId() + ': No details in to address, email cant be sent', 'Please fill in to address field.');
					nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), 'custbody_ht_to_be_emailed', 'F');
				}
			}
		}
	} catch (ex)
	{
		var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' + ex.getStackTrace().join('\n') : ex.toString();
		nlapiLogExecution('debug', 'userEventAfterSubmit Exception error', errorStr + ' - ' + processMessage);
	}

}
