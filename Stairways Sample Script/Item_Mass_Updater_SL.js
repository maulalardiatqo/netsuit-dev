/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Apr 2015     mdeasis
 *
 */

{
	var CONFIG={
		//Misc
		title: 'Item Update Manager',
		//Custom Record
		rec_type: 'customrecord_csv_importer',
		rec_fld_id: 'custrecord_csv_import_fld_id',
		rec_fld_label: 'custrecord_csv_import_fld_label',
		//Script
		script_name: 'Item_Mass_Updater_SL.js',
		script_id: 'customscript_item_mass_updater_sl',
		script_deploy: 'customdeploy_item_mass_updater_sl',
		script_client_id: 'customscript_item_mass_updater_cl',
		//Fields
		fld_csv_mode: 'custfld_csv_mode',
		fld_mode_create_template: 'custfld_create_template',
		fld_mode_execute_template: 'custfld_execute_template',
		fld_item_type: 'custfld_item_type',
		fld_item_subtype: 'custfld_item_subtype',
		fld_item_list: 'custfld_item_list',
		fld_item_fields: 'custfld_item_fields',
		fld_csv_file: 'custfld_csv_file',
		fld_update_dashboard: 'custfld_update_dashboard',
		fld_update_ctr: 'custfld_update_ctr',
		fld_use_backup: 'custfld_use_backup',
		list_item_update: 'custlst_item_update',
		//AJAX
		ajax_script: 'customscript_item_mass_updater_ajax',
		ajax_deploy: 'customdeploy_item_mass_updater_ajax',
		//Matrix
		fld_matrix_count: 'custfld_matrix_count',
		//Backup
		fld_backup_flag: 'custfld_backup_flag',
		fld_backup_is_public: 'custfld_backup_is_public',
		fld_backup_title: 'custfld_backup_title',
		fld_backup_description: 'custfld_backup_description',
		//Custom Record
		backup_rec_type: 'customrecord_item_backup',
		backup_fld_user: 'custrecord_item_backup_user',
		backup_fld_name: 'custrecord_item_backup_title',
		backup_fld_desc: 'custrecord_item_backup_desc',
		backup_fld_date: 'custrecord_item_backup_date',
		backup_fld_public: 'custrecord_item_backup_is_public',
		//Backup Manager
		backup_manager_folder: 'backup_manager.mark',
		backup_file_id: 'backup_file_id',
		backup_script: 'customscript_backup_manager',
		backup_deploy: 'customdeploy_backup_manager',
		//Saved Search
		max_result: 1000,
		//Images
		cloud_download: 'cloud_download.png',
		cloud_loading: 'cloud_loading.png',
		cloud_process: 'cloud_process.png',
		cloud_arrow: 'cloud_arrow.png',
        cloud_blue_loader: 'blue-loading.gif',
		//Item Field Selector
		item_selector_script: 'customscript_item_mass_field_selector',
		item_selector_deploy: 'customdeploy_item_mass_field_selector',
		//Item Dynamic Selector
		item_dynamic_selector_script: 'customscript_item_mass_dynamic_selector',
		item_dynamic_selector_deploy: 'customdeploy_item_mass_dynamic_selector',
		//Options
		delimiter: '%lim%',
		lst_standard_item_fields: 'customlist_fmt_standard_item_fields',
		MAX_LIST_LIMIT: 800,
		MAX_FILE_SIZE: 4.6,
		elem_list_counter: 'custfld_list_counter',
	};
}

function itemMass_suitelet(request, response){
	//URL Params
	var param_mode=request.getParameter(CONFIG.fld_csv_mode);
	var param_item_type=request.getParameterValues(CONFIG.fld_item_type);
	var param_item_subtype=request.getParameterValues(CONFIG.fld_item_subtype);
	var param_item_fields=request.getParameter(CONFIG.fld_item_fields);
	var param_csv_file=request.getFile(CONFIG.fld_csv_file);
	//Backup Params
	var param_backup_flag=request.getParameter(CONFIG.fld_backup_flag);
	var param_backup_public=request.getParameter(CONFIG.fld_backup_is_public);
	var param_backup_title=request.getParameter(CONFIG.fld_backup_title);
	var param_backup_description=request.getParameter(CONFIG.fld_backup_description);
	var param_backup_use=request.getParameter(CONFIG.fld_use_backup);
	var param_backup_file=null;
	//Custom
	var param_pager=request.getParameter('custfld_pager');
	//Form
	var form=nlapiCreateForm(CONFIG.title);
	//Mode 1: Mode Selection
	if (isNullOrEmpty(param_mode)) {
		//Backup Manager link
		form.addPageLink('crosslink', 'Backup Manager', nlapiResolveURL('SUITELET', CONFIG.backup_script, CONFIG.backup_deploy));
		//Select action
		form.addFieldGroup('custgrp_select_action', 'Select action to perform').setSingleColumn(true);
		form.addField('custfld_csv_note', 'inlinehtml', '', null, 'custgrp_select_action').setDefaultValue('<p style="font-size: 12px; margin: 5px 0;">Note: It is recommended to run "Create CSV Template" first to get the actual list of items to update.</p>');
		form.addField(CONFIG.fld_mode_create_template, 'checkbox', 'Create CSV Template', null, 'custgrp_select_action');
		form.addField(CONFIG.fld_mode_execute_template, 'checkbox', 'Import CSV', null, 'custgrp_select_action');
		//Hidden field
		form.addField(CONFIG.fld_csv_mode, 'text').setDisplayType('hidden').setDefaultValue('100');
		//Buttons
		form.addSubmitButton('Submit');
		form.addResetButton('Reset');
		//Client Event
		form.setScript(CONFIG.script_client_id);
	}
	//Mode Create: 101
	else if (param_mode=='101') {
		//Backup Manager link
		form.addPageLink('crosslink', 'Backup Manager', nlapiResolveURL('SUITELET', CONFIG.backup_script, CONFIG.backup_deploy));
		//Filters
		form.addFieldGroup('custgrp_item_filter', 'Filters');
		//
		//ITEM FILTER
		//
		var item_type=form.addField(CONFIG.fld_item_type, 'multiselect', 'Item Type', null, 'custgrp_item_filter');
		//var item_type_id=['Description', 'Discount', 'InvtPart', 'Group', 'Kit', 'Markup', 'NonInvtPart', 'OthCharge', 'Payment', 'Service', 'Subtotal'];
		//var item_type_label=['Description', 'Discount', 'Inventory Item', 'Group', 'Kit', 'Markup', 'Non-inventory Item', 'Other Charge', 'Payment', 'Service', 'Subtotal'];
		var item_types=getAvailableItemTypes();
		for (var i=0;item_types && i<item_types.label.length;i++) {
			item_type.addSelectOption(item_types.id[i], item_types.label[i]);
		}
		var item_subtype=form.addField(CONFIG.fld_item_subtype, 'multiselect', 'Item Subtype', null, 'custgrp_item_filter');
		item_subtype.addSelectOption('Sale', 'Sale');
		item_subtype.addSelectOption('Resale', 'Resale');
		item_subtype.addSelectOption('Purchase', 'Purchase');
		//
		//ITEM FILTER
		//
		form.addFieldGroup('custgrp_item_field', 'Columns to be added to your CSV template');
		//form.addField('custlnk_item_updater', 'inlinehtml', '', null, 'custgrp_item_field').setLayoutType('startrow', 'startcol').setDefaultValue('<p style="font-size: 14px; margin: 5px 0;">If you wish to add more item fields, please click <a target="_blank" href="'+nlapiResolveURL('RECORD', CONFIG.rec_type)+'" style="color: #2d29b6"><b>here</b></a>.</p>');
		//form.addField('custfld_select_all', 'checkbox', 'Select all', null, 'custgrp_item_field');
		//var item_field=form.addField(CONFIG.fld_item_fields, 'multiselect', 'Item Fields', null, 'custgrp_item_field').setMandatory(true);
		//item_field.setDisplayType('disabled');
		//var lst_field=getItemFields();
		//var hidden_selector='';
		//for (var i=0;lst_field['id'] && i<lst_field['id'].length;i++) {
		//	item_field.addSelectOption(lst_field['label'][i], lst_field['label'][i]+' ('+lst_field['id'][i]+')');
		//	hidden_selector+=lst_field['label'][i]+',';
		//}
		//hidden_selector=hidden_selector.substring(0, hidden_selector.length-1);
		//<<
		//--
		//form.addField('custfld_hidden_selector', 'text', 'Item Fields', null, 'custgrp_item_field').setMaxLength(9999).setDisplayType('hidden').setDefaultValue('');
		form.addField(CONFIG.fld_item_fields, 'text', 'Item Fields', null, 'custgrp_item_field').setMaxLength(9999).setDisplayType('hidden').setDefaultValue('');
		form.addField('custfld_hidden_selector', 'text', 'Item Fields', null, 'custgrp_item_field').setMaxLength(9999).setDisplayType('hidden').setDefaultValue('');
		var dynamic_html=	'<div style="display: block; position: realtive; width: 425px;">'+
							'	<div style="display: block; position: relative; font-size: 12px; color: #777;">ITEM FIELDS</div>'+
							'	<table style="display: block; position: relative; width: 418px; height: 118px; border: solid 1px #ccc; white-space: nowrap; overflow-y: scroll;">'+
							'	<tr>'+
							'		<td width="100%" align="center" style="font-size: 12px; padding: 5px 3px;">No CSV Field Selected</td>'+
							'	</tr>'+
							'	</table>'+
							'</div>';
		form.addField('custfld_dynamic_field', 'inlinehtml', '', null, 'custgrp_item_field').setMaxLength(9999).setDefaultValue(dynamic_html);
		//form.addField('custfld_dynamic_field_iframe', 'inlinehtml', '', null, 'custgrp_item_field').setDefaultValue('<iframe id="iframe_dynamic_selector" src="'+nlapiResolveURL('SUITELET', CONFIG.item_dynamic_selector_script, CONFIG.item_dynamic_selector_deploy)+'" width="440px" height="180px" scrolling="none" style="padding: 0; margin: 0; border: 0;"></iframe>');
		var btn_html='<table>'+
					 '	<tr>'+
					 '		<td>'+
					 '			<input onclick="display_FieldSelector();" type="button" style="display: inline-block; position: relative; padding: 0 12px; border: 0 none; border-radius: 3px; color: #222222; font-size: 14px; margin: 0; font-weight: 600; height: 28px; background: background: transparent linear-gradient(to bottom, #FAFAFA 0%, #E5E5E5 100%) repeat scroll 0% 0% !important; border: solid 1px #B2B2B2; cursor: pointer;" value="Add CSV Fields">'+
		  			 '		</td>'+
		  			 '		<td style="padding: 0 10px;">'+
		  			 '			<div style="display: block; position: relative; height: 25px; width: 1px; background-color: #B2B2B2;"></div>'+
		  			 '		</td>'+
		  			 '		<td>'+
		  			 '			<input type="button" onclick="clearSelector();" style="display: inline-block; position: relative; padding: 0 12px; border: 0 none; border-radius: 3px; color: #222222; font-size: 14px; margin: 0; font-weight: 600; height: 28px; background: background: transparent linear-gradient(to bottom, #FAFAFA 0%, #E5E5E5 100%) repeat scroll 0% 0% !important; border: solid 1px #B2B2B2; cursor: pointer;" value="Clear CSV Fields">'+
		  			 '		</td>'+
		  			 '	</tr>'+
		  			 '</table>';
		form.addField('custbtn_item_field', 'inlinehtml', '', null, 'custgrp_item_field').setLayoutType('outsideabove', 'startcol').setDefaultValue(btn_html);
		var csv_html='<div id="csv_field_selector" style="display: none; position: absolute; width: 645px; padding-bottom: 10px; border-style: solid; border-width: 1px; border-color: #EEEEEE #CCCCCC #CCCCCC #EEEEEE; z-index: 100; background-color: #FAFAFA;">'+
					 '	<div style="margin-top: -40px; display: block; position: relative; height: 30px; line-height: 30px; padding-left: 10px; background-color: #607998; color: #FFF; font-weight: 600; font-size: 14px;">'+
					 '		<span>Choose CSV Fields</span>'+
					 '		<a href="#" onclick="dismiss_FieldSelector();">'+
					 '			<img border="0" style="display: block; position: absolute; right: 10px; top: 8px;" title="Close" alt="Close" src="/images/portlet-header-x.png">'+
					 '		</a>'+
					 '	</div>'+
					 '	<div style="display: block; position: relative; background-color: #DFE4EB; padding: 5px 10px; border-bottom: solid 1px #CCC;">'+
					 '		<input onkeydown="return (event.keyCode!=13);" type="text" id="csv_field_keyword" style="display: inline-block; position: relative; padding: 3px; min-width: 162px; min-height: 25px; width: 162px; height: 25px;"/>'+
					 '		<input onclick="refine_FieldSelector();" type="button" value="Search" style="display: inline-block; position: relative; padding: 0 12px; border: 0 none; border-radius: 3px; color: #222222; font-size: 14px; margin: 0; font-weight: 600; height: 28px; background: background: transparent linear-gradient(to bottom, #FAFAFA 0%, #E5E5E5 100%) repeat scroll 0% 0% !important; border: solid 1px #B2B2B2; cursor: pointer;"/>'+
					 '	</div>'+
					 '	<div style="display: block; position: relative;">'+
					 '		<div style="display: block; position: relative; width: 300px; margin: 10px 10px 0; float: left; color: #666666; font-size: 14px;">Click Selection to Add</div>'+
					 '		<div style="display: block; position: relative; width: 300px; margin: 10px 10px 0; float: right; color: #666666; font-size: 14px;">Current Selections</div>'+
					 '		<div style="clear: both;"></div>'+
					 '	</div>'+
					 '	<div style="display: block; position: relative; width: 300px; height: 350px; background-color: #FFF; float: left; margin: 5px 10px; border: solid 1px #CCC;">'+
					 '		<iframe id="iframe_field_selector" scrolling="none" style="padding: 0; margin: 0; border: 0; overflow: auto;" width="300px" height="350px" src="'+nlapiResolveURL('SUITELET', CONFIG.item_selector_script, CONFIG.item_selector_deploy)+'"></iframe>'+
					 '	</div>'+
					 '	<div style="display: block; position: relative; width: 300px; height: 350px; overflow: auto; background-color: #FFF; float: right; margin: 5px 10px; border: solid 1px #CCC;">'+
					 '		<table id="field_lister" width="100%" cellspacing="0" cellpadding="5px">'+
					 '			<tr>'+
					 '				<td align="center" id="no_item_flag" style="color: #333; font-size: 13px;">No Selections Made</td>'+
					 '			</tr>'+
					 '		</table>'+
					 '	</div>'+
					 '	<div style="clear: both;"></div>'+
					 '	<div style="display: block; position: relative; margin: 5px 10px; font-size: 14px; color: #666;">'+
					 '		<input type="checkbox" onclick="selector_all(this);" id="item_selector_check" name="item_selector_check"/><label for="item_selector_check" style="margin-left: 5px;">Select All</label>'+
					 '		<input type="checkbox" style="margin-left: 20px;" onclick="deselector_all(this);" id="item_deselector_check" name="item_deselector_check"/><label for="item_deselector_check" style="margin-left: 5px;">Deselect All</label>'+
					 '	</div>'+
					 '	<div>'+
					 '		<input type="button" value="Done" onclick="updateSelector();" style="display: inline-block; position: relative; margin: 0 10px; padding: 0 12px; border-radius: 3px; border: solid 1px #125ab2; background-color: #125ab2; font-weight: 600; font-size: 14px; color: #FFF; height: 28px; cursor: pointer;" />'+
					 '		<input type="button" value="Cancel" onclick="dismiss_FieldSelector(); cancelSelector();" style="display: inline-block; position: relative; padding: 0 12px; border: 0 none; border-radius: 3px; color: #222222; font-size: 14px; margin: 0; font-weight: 600; height: 28px; background: background: transparent linear-gradient(to bottom, #FAFAFA 0%, #E5E5E5 100%) repeat scroll 0% 0% !important; border: solid 1px #B2B2B2; cursor: pointer;" />'+
					 '	</div>'+
					 '</div>';
		form.addField('custbtn_csv_list', 'inlinehtml', '', null, 'custgrp_item_field').setLayoutType('outsideabove', 'startrow').setMaxLength(99999).setDefaultValue(csv_html);
		//--
		//>>
		//Hidden Field
		form.addField(CONFIG.fld_csv_mode, 'text').setDisplayType('hidden').setDefaultValue('102');
		//Button
		form.addSubmitButton('Submit');
		form.addButton('custbtn_back', 'Back', "window.history.back();");
		//Script
		form.setScript(CONFIG.script_client_id);
	}
	//Mode Create: 102
	else if (param_mode=='102') {
		//Backup Manager link
		form.addPageLink('crosslink', 'Backup Manager', nlapiResolveURL('SUITELET', CONFIG.backup_script, CONFIG.backup_deploy));
		//Selected Record List Counter
		var html_code=	'<div style="display: block; position: relative; width: 100%; background-color: #FEFDF1;">'+
						'	<div style="display: block; position: relative; float: left; margin: 10px; width: 32px; height: 32px; background-image: url(\'/uirefresh/img/alertbox_icons.png\'); background-position: 0 0;"></div>'+
						'	<div style="display: block; position: relative; float: left; margin: 5px 0;">'+
						'		<div style="font-size: 13px; font-weight: 700; color: #666; font-family: Open Sans, Helvetica, sans-serif; text-align: left;">* Can only generate the first 1000 item records for your CSV file.</div>'+
						'		<div style="font-size: 13px; font-weight: 700; color: #666; font-family: Open Sans, Helvetica, sans-serif;">* Can only update '+CONFIG.MAX_LIST_LIMIT+' item records in a single script run.</div>'+
						'	</div>'+
						'	<div style="clear: both;"></div>'+
						'	<div style="display: block; position: absolute; top: 5px; right: 5px;">'+
						'		<div style="display: block; position: relative; float: left; font-family: Open Sans, Helvetica, sans-serif; font-size: 14px; color: #666; margin: 8px 5px 0 0;">Selected record(s): </div>			<div id="custfld_list_counter" style="display: block; position: relative; float: left; font-family: Open Sans, Helvetica, sans-serif; font-size: 28px; font-weight: bold; color: #24385b; text-shadow: 3px 2px #eee;">0</div>'+
						'		<div style="clear: both;"></div>'+
						'	</div>'+
						'</div>';
		form.addField(CONFIG.elem_list_counter, 'inlinehtml').setDefaultValue(html_code);
		//List of items
		var item_list=form.addSubList(CONFIG.fld_item_list, 'list', 'Item Record(s)');
		item_list.addField('item_id', 'text', 'ID').setDisplayType('hidden');
		item_list.addField('item_select', 'checkbox', 'Select');
		item_list.addField('item_name', 'text', 'Item Name');
		//item_list.addField('item_display', 'text', 'Display Name');
		//item_list.addField('item_description', 'textarea', 'Description').setMaxLength(999);
		//item_list.addField('item_price', 'text', 'Price');
		//item_list.addField('item_fields', 'text').setMaxLength(9999).setDisplayType('hidden');
		item_list.addMarkAllButtons();
		//if (isNullOrEmpty(param_item_subtype)) {
		//	param_item_subtype=null;
		//}
		var reload_url=nlapiResolveURL('SUITELET', CONFIG.script_id, CONFIG.script_deploy)+'&'+CONFIG.fld_csv_mode+'=102&'+CONFIG.fld_item_fields+'='+param_item_fields;
		if (isNullOrEmpty(param_pager)) {			
			param_pager=0;
		}
		else {
			param_pager=parseInt(param_pager);
			//param_item_type=param_item_type.split(',');
			//param_item_subtype=param_item_subtype.split(',');
			var item_fields_arr=param_item_fields.split(',');
			param_item_fields=[];
			for (var i=0; item_fields_arr && i<item_fields_arr.length;i++) {
				var temp=item_fields_arr[i].split(CONFIG.delimiter);
				param_item_fields.push(temp[1]);
			}
		}
		if (!isNullOrEmpty(param_item_type)) {
			reload_url+='&'+CONFIG.fld_item_type+'='+param_item_type.join(',');
		}
		if (!isNullOrEmpty(param_item_subtype)) {
			reload_url+='&'+CONFIG.fld_item_subtype+'='+param_item_subtype.join(',');
		}
		nlapiLogExecution('DEBUG', 'Pager', reload_url);
		nlapiLogExecution('DEBUG', 'Param Item Fields', param_item_fields);
		var list_search=searchItem(param_item_type, param_item_subtype, param_item_fields, param_pager);
		//<<--
		//Pagination
		//if (list_search.count>1000) {
			//item_list.addButton('custbtn_list_first', '<< First', "window.location.href=\'"+reload_url+"\';");
			//item_list.addButton('custbtn_list_prev', '< Prev', "window.location.href=\'"+reload_url+"\';");
			//item_list.addButton('custbtn_list_next', 'Next >', "window.location.href=\'"+reload_url+"\';");
			//item_list.addButton('custbtn_list_last', 'Last >>', "window.location.href=\'"+reload_url+"\';");
		//}
		//Pagination
		//-->>
		//Sort result by item id
		list_search=sortItem(list_search.list);
		item_list.setLineItemValues(list_search);
		//Hidden Field
		form.addField(CONFIG.fld_csv_mode, 'text').setDisplayType('hidden').setDefaultValue('103');
		//form.addField(CONFIG.fld_item_fields, 'multiselect').setDisplayType('hidden').setDefaultValue(param_item_fields);
		form.addField(CONFIG.fld_item_fields, 'text').setMaxLength(9999).setDisplayType('hidden').setDefaultValue(param_item_fields);
		//Script
		form.setScript(CONFIG.script_client_id);
		var back_url=nlapiResolveURL('SUITELET', CONFIG.script_id, CONFIG.script_deploy)+'&'+CONFIG.fld_csv_mode+'=101';
		//Buttons
		form.addSubmitButton('Submit');
		form.addButton('custbtn_back', 'Back', "window.location.href='"+back_url+"';");
	}
	//Mode Create: 103
	else if (param_mode=='103') {
		//Backup Manager link
		form.addPageLink('crosslink', 'Backup Manager', nlapiResolveURL('SUITELET', CONFIG.backup_script, CONFIG.backup_deploy));
		//Reform
		var item_header=reformHeader(param_item_fields);
		var item_csv_file='Internal ID (internalid),Item Name/Number (itemid),';
		//Column
		for (var i=0;item_header.label && i<item_header.label.length;i++) {
			if (item_header.label[i].charAt(0)=='+') {
				item_header.label[i]=item_header.label[i].substring(1, item_header.label[i].length);
			}
			item_csv_file+=item_header.label[i]+' ('+item_header.name[i]+'),';
		}
		item_csv_file=item_csv_file.substring(0, item_csv_file.length-1);
		form.addField(CONFIG.fld_item_fields, 'text').setDisplayType('hidden').setMaxLength(9999).setDefaultValue('internalid,itemid'+(item_header.name.length>0?',':'')+item_header.name.join(','));
		var line_count=request.getLineItemCount(CONFIG.fld_item_list);
		var item_to_process='';
		for (var i=1;i<=line_count;i++) {
			if (request.getLineItemValue(CONFIG.fld_item_list, 'item_select', i)=='T') {
				item_to_process+=request.getLineItemValue(CONFIG.fld_item_list, 'item_id', i)+',';
			}
		}
		item_to_process=item_to_process.substring(0, item_to_process.length-1);
		form.addField('custfld_item_to_process', 'text').setDisplayType('hidden').setMaxLength(99999).setDefaultValue(item_to_process);
		//item_csv_file+='\n';
		//Row
		//var line_count=request.getLineItemCount(CONFIG.fld_item_list);
		//for (var i=1;i<=line_count;i++) {
		//	if (request.getLineItemValue(CONFIG.fld_item_list, 'item_select', i)=='T') {
		//		item_csv_file+=request.getLineItemValue(CONFIG.fld_item_list, 'item_id', i)+',';
		//		item_csv_file+=request.getLineItemValue(CONFIG.fld_item_list, 'item_name', i)+',';
		//		//for (var j=0;j<item_header.length-1;j++) {
		//			//item_csv_file+=',';
		//		//}
		//		item_csv_file+=request.getLineItemValue(CONFIG.fld_item_list, 'item_fields', i);
		//		item_csv_file+='\n';
		//	}
		//}
		var tmp_file=nlapiCreateFile(getTimestamp()+'.csv', 'CSV', item_csv_file);
		tmp_file.setFolder(itemMass_Folder());
		tmp_file.setEncoding('UTF-8');
		try {
			if (tmp_file=nlapiSubmitFile(tmp_file)) {
				var loader_html='<div style="display: block; position: relative; width: 240px; float: left;">'+
					  			'	<div class="csv_img" style="display: block; position: relative; width: 120px; margin: auto;">'+
					  			'		<img id="csv_loader_img" src="'+getFileURL(CONFIG.cloud_loading)+'">'+
					  			'		<div style="display: block; position: absolute; font-weight: bold; font-family: Arial; font-size: 20px; right: 7px; bottom: 20px;width: 40px; text-align: center;" id="csv_loader_progress">0%</div>'+
					  			'	</div>'+
					  			'	<div id="csv_loader_download" style="font-size: 12px;text-align: center;">Your csv is being processed. Please wait.</div>'+
					  			'</div>'+
					  			'<div id="csv_loader_arrow" style="display: none; position: relative; width: 100px; float: left; height: 108px; line-height: 108px; text-align: center;">'+
					  			'	<img width="45px" height="45px" style="vertical-align: middle;" src="'+getFileURL(CONFIG.cloud_arrow)+'" />'+
					  			'</div>'+
					  			'<div style="display: none; position: relative; width: 240px; float: left;" id="csv_loader_next">'+
					  			'	<div style="display: block; position: relative; width: 120px; margin: auto;">'+
					  			'		<img src="'+getFileURL(CONFIG.cloud_process)+'" />'+
					  			'	</div>'+
					  			'	<div style="font-size: 12px;text-align: center;">'+
					  			'		<a href="'+nlapiResolveURL('SUITELET', CONFIG.script_id, CONFIG.script_deploy)+'&'+CONFIG.fld_csv_mode+'=201'+'">Click here to process your csv file.</a>'+
					  			'	<div>'+
					  			'</div>'+
					  			'<div style="clear:both;"></div>';
				form.addField('custfld_csv_download', 'inlinehtml').setDefaultValue(loader_html);
				form.addField('custfld_csv_file_id', 'text').setDisplayType('hidden').setDefaultValue(tmp_file);
				form.addField(CONFIG.fld_csv_mode, 'text').setDisplayType('hidden').setDefaultValue('104');
				form.setScript(CONFIG.script_client_id);
			}
			//form.addField('custfld_process_csv', 'inlinehtml').setDefaultValue('<span style="margin: 10px;font-size: 14px;">>>> <a href="'+nlapiResolveURL('SUITELET', CONFIG.script_id, CONFIG.script_deploy)+'&'+CONFIG.fld_csv_mode+'=201">Click here to upload your csv file.</a></span>');
		}
		catch (err) {
			form.addField('custfld_csv_error', 'inlinehtml').setDefaultValue('<span style="margin: 10px;color: red; font-size: 14px;">Error: '+err.message+'</span>');
		}
	}
	//Mode Execute: 201
	else if (param_mode=='201') {
		form.addPageLink('crosslink', 'Backup Manager', nlapiResolveURL('SUITELET', CONFIG.backup_script, CONFIG.backup_deploy));
		//Form Fields		
		form.addField('custfld_use_file', 'checkbox', 'Import by uploading a CSV file').setLayoutType('outsideabove', 'startcol').setDefaultValue('T');
		form.addField('custfld_use_backup', 'checkbox', 'Import using a backup file').setLayoutType('outsideabove', 'startrow');
		//form.addField(CONFIG.fld_csv_file, 'file', 'Select CSV file');
		//<<--
		//View Backup
		//form.addFieldGroup('custgrp_backup_list', 'Use existing backup').setCollapsible(true, false);
		//form.addFieldGroup('custgrp_file', 'CSV File');
		form.addField('custfld_file_border', 'inlinehtml').setDefaultValue('<div id="csv_file_border" style="width: 100%; background-color: #dfe4eb; padding: 5px; margin: 5px 0; color: #607998; font-size: 13px; font-weight: 700;">Upload a CSV file</div>');
		form.addField(CONFIG.fld_csv_file, 'file').setLayoutType('outsidebelow', 'startrow');
		form.addField(CONFIG.fld_backup_flag, 'checkbox', 'Create backup of the item records').setLayoutType('outsidebelow', 'startrow').setDefaultValue('T');
		form.addField(CONFIG.fld_backup_is_public, 'checkbox', 'Share item backup within the account').setLayoutType('outsidebelow', 'startrow').setDefaultValue('T');
		form.addField(CONFIG.fld_backup_title, 'text', 'Backup Name').setDisplaySize(43, 1).setLayoutType('outsidebelow', 'startrow');
		form.addField(CONFIG.fld_backup_description, 'textarea', 'Backup Description').setLayoutType('outsidebelow', 'startrow');
		//form.addField('custfld_file_wrapper', 'inlinehtml').setDefaultValue('<iframe id="backup_csv_iframe" width="100%" height="320px" align="center" scrolling="no" style="margin: 0; padding: 0; border: 0;" src="'+nlapiResolveURL('SUITELET', CONFIG.backup_script, CONFIG.backup_deploy)+'&custfld_is_minified=CSV"></iframe>');
		form.addFieldGroup('custgrp_backup', 'Upload a backup file').setSingleColumn(true);
		form.addField('custfld_backup_personal', 'checkbox', 'Personal backup', null, 'custgrp_backup');
		var lst_personal=form.addField('custlist_backup_personal', 'select', 'Personal backup', null, 'custgrp_backup').setDisplayType('disabled');
		form.addField('custfld_backup_public', 'checkbox', 'Shared backup', null, 'custgrp_backup');
		var lst_public=form.addField('custlist_backup_public', 'select', 'Shared backup', null, 'custgrp_backup').setDisplayType('disabled');
		var backup=getPersonalBackup();
		for (var i=0; backup && i<backup.length;i++) {
			lst_personal.addSelectOption(backup[i]['id'], backup[i]['name']);
		}
		backup=getPublicBackup();
		for (var i=0; backup && i<backup.length;i++) {
			lst_public.addSelectOption(backup[i]['id'], backup[i]['name']);
		}
		form.addField('custfld_backup_hider', 'inlinehtml').setDefaultValue('<script>var elem=document.getElementById("fg_custgrp_backup").parentNode.parentNode.parentNode; if (elem) {elem.style.display="none";}</script>');
		//form.addField('custfld_backup_wrapper', 'inlinehtml');
		//View Backup
		//-->>
		//<<--
		//Backup Manager
		//form.addFieldGroup('custgrp_backup', 'Backup existing records');
		//form.addField(CONFIG.fld_backup_flag, 'checkbox', 'Enable back up', null, 'custgrp_backup');
		//form.addField(CONFIG.fld_backup_is_public, 'checkbox', 'Is Public', null, 'custgrp_backup').setDisplayType('disabled');
		//form.addField(CONFIG.fld_backup_title, 'text','Name', null, 'custgrp_backup').setDisplayType('disabled');
		//form.addField(CONFIG.fld_backup_description, 'textarea', 'Description', null, 'custgrp_backup').setDisplayType('disabled');
		//Backup Manager
		//-->>
		//Hidden fields
		form.addField(CONFIG.fld_csv_mode, 'text').setDisplayType('hidden').setDefaultValue('202');
		//form.addField(CONFIG.fld_csv_file, 'file', 'CSV File');
		//form.addField(CONFIG.fld_backup_title, 'text', 'Backup Name');
		//form.addField(CONFIG.fld_backup_description, 'textarea', 'Backup Description');
		//frm.addField(CONFIG.fld_backup_is_public, 'checkbox', 'Shared within account');
		//Buttons
		form.addSubmitButton('Submit');
		form.addButton('custbtn_back', 'Back', "window.location.href='"+nlapiResolveURL('SUITELET', CONFIG.script_id, CONFIG.script_deploy)+"'");
		//Script
		form.setScript(CONFIG.script_client_id);
	}
	//Mode Execute: 202
	else if (param_mode=='202') {
		if (!isNullOrEmpty(param_backup_use)) {
			param_csv_file=request.getParameter(CONFIG.fld_csv_file);
			nlapiLogExecution('DEBUG', 'Param File', param_csv_file);
			param_csv_file=nlapiLoadFile(parseInt(param_csv_file));
		}
		if (!isValidSize(param_csv_file.getSize())) {
			//throw "Allowed file size should not exceed "+CONFIG.MAX_FILE_SIZE+" MB.";
			throw " Allowed file size should not exceed 4.5 MB.";
		}
		var html_code=	'<div style="text-align: center; margin: 20px auto;">'+
						'	<img style="display: inline-block; position: relative; vertical-align: top;" src="'+getFileURL(CONFIG.cloud_blue_loader)+'"/>'+
						'	<span style="display: inline-block; position: relative; margin: 0 10px; height: 32px; line-height: 32px; font-weight: bold; font-size: 18px;">Processing</span>'+
						'	<p align="center" style="font-size: 16px;">Please wait while CSV field mapping is generated.</p>'+
						'</div>';
		form.addField('custfld_record_loader','inlinehtml').setDefaultValue(html_code);
		form.addField('custfld_bait_and_switch', 'inlinehtml').setMaxLength(99999999).setDisplayType('hidden').setDefaultValue(param_csv_file.getValue());
		form.addSubmitButton('Next');
		form.addButton('custbtn_back', 'Back', "window.history.back();");
        
        nlapiLogExecution('DEBUG', 'Content', param_csv_file.getValue());
		//<<--EDIT
		//form.addField(CONFIG.fld_backup_is_public, 'checkbox', 'Is Public');
		//form.addField(CONFIG.fld_backup_title, 'text','Name').setMandatory(true);
		//form.addField(CONFIG.fld_backup_description, 'textarea', 'Description');
		//form.addSubmitButton('Submit');
		//form.addButton('custbtn_back', 'Back', "window.history.back();");
		//Hidden fields
		form.addField(CONFIG.fld_csv_mode, 'text').setDisplayType('hidden').setDefaultValue('203');
		form.addField(CONFIG.fld_backup_flag, 'checkbox').setDisplayType('hidden').setDefaultValue(param_backup_flag);
		form.addField(CONFIG.fld_backup_is_public, 'checkbox').setDisplayType('hidden').setDefaultValue(param_backup_public);
		form.addField(CONFIG.fld_backup_title, 'text').setDisplayType('hidden').setDefaultValue(param_backup_title);
		form.addField(CONFIG.fld_backup_description, 'textarea').setDisplayType('hidden').setDefaultValue(param_backup_description);
		form.addField(CONFIG.fld_use_backup, 'text').setDisplayType('hidden').setDefaultValue(isNullOrEmpty(param_backup_use)?'F':'T');
		//Script
		form.setScript(CONFIG.script_client_id);
		//var tmp_file=nlapiCreateFile(getTimestamp()+'.csv', 'CSV', param_csv_file.getValue());
		//tmp_file.setFolder(itemMass_Folder());
		//tmp_file.setEncoding('UTF-8');
		//if (tmp_file=nlapiSubmitFile(tmp_file)) {
		//	form.addField(CONFIG.fld_csv_file, 'text').setDisplayType('hidden').setDefaultValue(tmp_file);
		//	form.addField(CONFIG.fld_use_backup, 'text').setDisplayType('hidden').setDefaultValue('T');
		//	form.addField(CONFIG.fld_backup_flag, 'text').setDisplayType('hidden').setDefaultValue('T');
		//}
		//EDIT-->>
	}
	//Mode Execute: 203
	else if (param_mode=='203') {
		//Backup Manager link
		form.addPageLink('crosslink', 'Backup Manager', nlapiResolveURL('SUITELET', CONFIG.backup_script, CONFIG.backup_deploy));
		//nlapiLogExecution('DEBUG', 'CONTENT', param_csv_file.getValue());
		//if (!isNullOrEmpty(param_backup_use)) {
		//	param_csv_file=request.getParameter(CONFIG.fld_csv_file);
		//	//nlapiLogExecution('DEBUG', 'Param File', param_csv_file);
		//	param_csv_file=nlapiLoadFile(parseInt(param_csv_file));
		//}
		//if (!isValidSize(param_csv_file.getSize())) {
		//	throw "The tool currently supports file of 1.5 MB only.";
		//}
		//var csv_content=param_csv_file.getValue();
		//if (isBase64Encoded(csv_content)) {
		//	csv_content=decodeBase64(param_csv_file.getValue());
		//}
		var csv_content=request.getParameter('custfld_bait_and_switch');
		//nlapiLogExecution('DEBUG', 'Param size', csv_content.length);
		if (isBase64Encoded(csv_content)) {
			csv_content=decodeBase64(csv_content);
		}
		var content_arr=textToArr(csv_content);
		//<<--
		//Backup Manager
		if (!isNullOrEmpty(param_backup_flag) && param_backup_flag=='T') {
			var backup_rec=nlapiCreateRecord(CONFIG.backup_rec_type);
			backup_rec.setFieldValue(CONFIG.backup_fld_user, nlapiGetUser());
			backup_rec.setFieldValue(CONFIG.backup_fld_name, param_backup_title);
			backup_rec.setFieldValue(CONFIG.backup_fld_desc, param_backup_description);
			backup_rec.setFieldValue(CONFIG.backup_fld_date, nlapiDateToString(new Date(), 'date'));
			backup_rec.setFieldValue(CONFIG.backup_fld_public, param_backup_public);
			if (backup_rec=nlapiSubmitRecord(backup_rec)) {
				var backup_data='';
				for (var i=0; content_arr['header'] && i<content_arr['header'].length;i++) {
					backup_data+=content_arr['header'][i]+',';
				}
				backup_data=backup_data.substring(0, backup_data.length-1);
				var backup_file=nlapiCreateFile(nlapiGetUser()+'_'+getTimestamp()+'.csv', 'CSV', backup_data);
				backup_file.setFolder(backupManager_Folder());
				backup_file.setEncoding('UTF-8');
				if (backup_file=nlapiSubmitFile(backup_file)) {
					nlapiAttachRecord('file', backup_file, CONFIG.backup_rec_type, backup_rec);
					param_backup_file=backup_file;
				}
			}
		}
		//Backup Manager
		//-->>
		var list_values=getUpdateList(content_arr, param_backup_file);
		//Dashboard
		form.addField(CONFIG.fld_update_dashboard, 'inlinehtml').setDefaultValue('<p style="margin-top: 15px; font-size: 14px; text-align: right;">Total records: '+list_values.content.length+'</p>');
		//List
		var list_item=form.addSubList(CONFIG.list_item_update, 'list', 'Item(s) to update');
		list_item.addField('item_status', 'text', 'Status').setMaxLength(99999);
		list_item.addField('item_link', 'text', 'Item');
		list_item.addField('item_param', 'text', 'Param').setMaxLength(99999).setDisplayType('hidden');
		for (var i=0; list_values.header && i<list_values.header.length;i++) {
			list_item.addField('item_fld_'+i, 'text', 'New '+list_values.header[i]).setMaxLength(99999);
		}
		list_item.setLineItemValues(list_values.content);
		//Hidden field
		form.addField(CONFIG.fld_update_ctr, 'text').setDisplayType('hidden').setDefaultValue('0');
		form.addField(CONFIG.fld_matrix_count, 'text').setDisplayType('hidden').setDefaultValue(list_values.matrix_count);
		form.addField(CONFIG.backup_file_id, 'text').setDisplayType('hidden').setDefaultValue(param_backup_file);
		form.addField(CONFIG.fld_csv_mode, 'text').setDisplayType('hidden').setDefaultValue('204');
		//<<--
		//
		if (list_values.matrix_count>1) {
			var html_code='<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; background-color: rgba(0, 0, 0, 0.4); font-family: Helvetica; display: none;" id="overlay_matrix">'+
			  '	<div style="display: block; position: relative; width: 480px; background-color: rgb(255, 255, 255); border-radius: 5px; margin: 100px auto; padding: 20px 0px; max-height: 500px; overflow-y: auto;" id="wrapper_matrix">'+
			  '		<div class="matrix_labeler" style="font-size: 20px; color: #4d5f79; font-weight: bold; margin: 5px 0 10px 25px;">Matrix Items</div>'+
			  '		<table width="90%" cellspacing="0" cellpadding="2" border="1" align="center" style="font-size: 13px; color: rgb(102, 102, 102);" rules="rows">'+
			  '			<tr>'+
			  '				<td colspan="4" style="background-color: #E5E5E5; padding: 5px 0;">'+
			  '					<div style="font-weight: bold; margin: 0 0 0 5px">Select matrix items to include its subitems to be updated as well.</div>'+
			  '					<input type="button" onclick="matrix_markAll();" value="Mark all" style="display: inline-block; position: relative; width: 85px; cursor: pointer; background-color: #e5e5e5; box-shadow: 1px 2px #CCC; margin: 5px 0  2px 5px;">'+
			  '  				<input type="button" onclick="matrix_unmarkAll();" value="Unmark all" style="display: inline-block; position: relative; width: 85px; margin-left: 5px; cursor: pointer; background-color: #e5e5e5; box-shadow: 1px 2px #CCC;">'+
			  '				</td>'+
			  '			</tr>'+
			  '			<tr style="background-color: #E5E5E5">'+
			  '				<td width="15%" align="center">Select</td>'+
	    	  '				<td width="15%">ID</td>'+
	    	  '				<td width="50%">Name</td>'+
	    	  //'				<td width="20%" align="center">Number of Subitems</td>'+
	    	  '			</tr>';
			for (var i=0; i<list_values.matrix_count;i++) {
				html_code+='			<tr '+(i%2==1?'style="background-color: #fafafa;"':'')+'>'+
				'				<td align="center">'+
				'    				<input type="checkbox" id="matrix_selector_'+i+'" controller="matrix_item_'+list_values.matrix_list[i]['item_index']+'">'+
				'				</td>'+
				'				<td>'+list_values.matrix_list[i]['item_id']+'</td>'+
				'				<td>'+list_values.matrix_list[i]['item_name']+'</td>'+
				//'				<td align="center">'+list_values.matrix_list[i]['child_count']+'</td>'+
				'			</tr>';
			}
	    	html_code+='		</table>'+
	    	  '		<input type="button" value="Submit" onclick="matrix_submit();" style="display: inline-block; position: relative; width: 80px; margin-left: 24px; cursor: pointer; margin-top: 10px; font-weight: 600; background-color: rgb(20, 103, 204); color: rgb(255, 255, 255); border: 1px solid rgb(0, 0, 0); border-radius: 1px; height: 30px; margin-bottom: 10px;">'+
	    	  '		<input type="button" value="Cancel" onclick="matrix_hidePopup();" style="display: inline-block; position: relative; padding: 0 12px; border: 0 none; border-radius: 3px; color: #222222; font-size: 14px; margin: 0; font-weight: 600; height: 28px; background: background: transparent linear-gradient(to bottom, #FAFAFA 0%, #E5E5E5 100%) repeat scroll 0% 0% !important; border: solid 1px #B2B2B2; cursor: pointer;">'+
	    	  '	</div>'+
	    	  '</div>';
			form.addField('custfld_popup', 'inlinehtml').setMaxLength(999999).setDefaultValue(html_code);
		}
		//Buttons
		form.addButton('custbtn_commit', 'Commit', "itemMass_commit();");
		form.addButton('custbtn_back', 'Back', "window.history.back();");
		//Script
		form.setScript(CONFIG.script_client_id);
	}
	response.writePage(form);
}

function itemMass_ajax(request, response) {
	var item_id=request.getParameter('item_id');
	var field_list=request.getParameter('field_list');
	var field_vals=request.getParameter('field_vals');
	
	var matrix_item_id=request.getParameter('matrix_item_id');
	var parent_id=request.getParameter('parent_item_id');
	var item_name=request.getParameter('item_name');
	var display_name=request.getParameter('display_name');
	
	var BACKUP_FILE=request.getParameter('backup_file');
	if (isNullOrEmpty(BACKUP_FILE)) {
		BACKUP_FILE='';
	}
	//<<
	//Standard Item Update
	//<<
	if (!isNullOrEmpty(item_id) && !isNullOrEmpty(field_list) && !isNullOrEmpty(field_vals)) {
		var UPDATE_STATUS=-1;
		var UPDATE_ERR_MESSAGE='';
		var UPDATE_ERR_CODE='';
		var UPDATE_ID=item_id;
		var UPDATE_IS_MATRIX=false;
		var UPDATE_ITEM_NAME='';
		var UPDATE_DISPLAY_NAME='';
		var UPDATE_CHILD_ITEM=null;
		var UPDATE_FIELD_LIST=field_list;
		var UPDATE_FIELD_VALS=field_vals;
		try {
			var item_rec=nlapiLoadRecord(nlapiLookupField('item', item_id, 'recordtype'), item_id, {recordmode: 'dynamic'});
			var backup_data=item_id+',';
			if (item_rec) {
				field_list=field_list.split(',');
				field_vals=field_vals.split(',');
				nlapiLogExecution('DEBUG', 'Fields', field_list.length);
				for (var i=0;i<field_list.length;i++) {
					//<<--
					//PARSE 2C%
					var value=null;
					if (field_vals[i]!=null) {
						value=field_vals[i].replace(/2C%/g, ",").replace(/%27/g, "'").replace(/%26/g, "&").replace(/%23/g, "#").replace(/%22/g, '"').replace(/""/g, '"').replace(/(\r\n|\n|\r)/gm,"");
						if (value.charAt(0)=='"' && value.charAt(value.length-1)=='"') {
							value=value.substring(1, value.length-1);
						}
					}
					//PARSE 2C%
					//-->>
					if (item_rec.getField(field_list[i]) && field_list[i]=='parent') {
						backup_data+=item_rec.getFieldValue(field_list[i])==null?'':(item_rec.getFieldValue(field_list[i]).replace(/,/g,"2C%").replace(/'/g, "%27").replace(/&/g, "%26").replace(/#/g, "%23").replace(/"/g, "%22").replace(/(\r\n|\n|\r)/gm,""));
						if (item_rec.getFieldValue(field_list[i])!=value) {
							item_rec.setFieldValue(field_list[i], value);
						}
					}
					//Select type
					else if (item_rec.getField(field_list[i]) && item_rec.getField(field_list[i]).getType()=='select') {
						backup_data+=item_rec.getFieldText(field_list[i])==null?'':(item_rec.getFieldText(field_list[i]).replace(/,/g,"2C%").replace(/'/g, "%27").replace(/&/g, "%26").replace(/#/g, "%23").replace(/"/g, "%22").replace(/(\r\n|\n|\r)/gm,""));
						//nlapiLogExecution('DEBUG', field_list[i]+':'+value, value.search(new RegExp(".jpg|.png|.gif", "gi")));
						//if (!isNullOrEmpty(value) && value.search(new RegExp(".jpg|.png|.gif", "gi"))>-1) {
						//	value=getFileID(value);
						//	item_rec.setFieldValue(field_list[i], value);
						//}
						//else 
						if (item_rec.getFieldText(field_list[i])!=value) {
							item_rec.setFieldText(field_list[i], value);
						}
					}
					//Multiselect type
					else if (item_rec.getField(field_list[i]) && item_rec.getField(field_list[i]).getType()=='multiselect') {
						backup_data+=item_rec.getFieldText(field_list[i])==null?'':(item_rec.getFieldText(field_list[i]).replace(/,/g,"2C%").replace(/'/g, "%27").replace(/&/g, "%26").replace(/#/g, "%23").replace(/"/g, "%22").replace(/(\r\n|\n|\r)/gm,""));
						if ((!isNullOrEmpty(value)) && (item_rec.getFieldText(field_list[i])!=value)) {
							//item_rec.setFieldText(field_list[i], value.split(','));
							value=value.split(String.fromCharCode(5));
							var ids=[];
							var opts=item_rec.getField(field_list[i]).getSelectOptions();
							for (var x=0; opts && x<opts.length; x++) {
								for (var y=0; value && y<value.length;y++) {
									if (opts[x].getText()==value[y]) {
										ids.push(opts[x].getId());
										break;
									}
								}
							}
							item_rec.setFieldValues(field_list[i], ids);
						}
						else {
							item_rec.setFieldText(field_list[i], value);
						}
					}
					//Default type
					else if (item_rec.getField(field_list[i])) {
						backup_data+=item_rec.getFieldValue(field_list[i])==null?'':(item_rec.getFieldValue(field_list[i]).replace(/,/g,"2C%").replace(/'/g, "%27").replace(/&/g, "%26").replace(/#/g, "%23").replace(/"/g, "%22").replace(/(\r\n|\n|\r)/gm,""));
						if (field_list[i]=='itemid') {
							UPDATE_ITEM_NAME=nlapiLookupField('item', item_id, 'itemid');
						}
						else if (field_list[i]=='displayname') {
							UPDATE_DISPLAY_NAME=nlapiLookupField('item', item_id, 'displayname');;
						}
						if (item_rec.getFieldValue(field_list[i])!=value) {
							item_rec.setFieldValue(field_list[i], value);
						}
					}
					backup_data+=',';
				}
				if (nlapiSubmitRecord(item_rec, true, true)) {
					//<<--
					//Backup Manager
					if (!isNullOrEmpty(BACKUP_FILE)) {
						backup_data=backup_data.substring(0, backup_data.length-1);
						//nlapiLogExecution('DEBUG', 'Backup', backup_data);
						//nlapiLogExecution('DEBUG', 'Backup', backup_data.split(',').length);
						var temp=nlapiLoadFile(BACKUP_FILE);
						var folder=temp.getFolder();
						temp=nlapiCreateFile(temp.getName(), 'CSV', temp.getValue()+'\n'+backup_data);
						temp.setEncoding('UTF-8');
						temp.setFolder(folder);
						nlapiSubmitFile(temp);
					}
					//Backup Manager
					//-->>
					UPDATE_STATUS=1;
					var rs=nlapiSearchRecord('item', null, [new nlobjSearchFilter('matrix', null, 'is', 'T'),
					                                        new nlobjSearchFilter('internalid', null, 'is', item_id)], []);
					if (!isNullOrEmpty(rs) && rs.length>0) {
						UPDATE_IS_MATRIX=true;
						//Children
						rs=nlapiSearchRecord('item', null, [new nlobjSearchFilter('parent', null, 'is', item_id)], []);
						if (!isNullOrEmpty(rs)) {
							UPDATE_CHILD_ITEM=[];	
							for (var i=0;rs && i<rs.length;i++) {
								UPDATE_CHILD_ITEM.push(rs[i].getId());
							}
						}
					}
				}
			}
		}
		catch (err) {
			nlapiLogExecution('DEBUG', 'Item Error Code: '+err.code, 'Details: '+err.message);
			UPDATE_ERR_MESSAGE=err.message;
			UPDATE_ERR_CODE=err.code;
		}
		response.setContentType('JAVASCRIPT', 'item_update.json');
		response.write(JSON.stringify({
			"status": nlapiEscapeXML(UPDATE_STATUS),
			"error": nlapiEscapeXML(UPDATE_ERR_MESSAGE),
			"error_code": nlapiEscapeXML(UPDATE_ERR_CODE),
			"id": nlapiEscapeXML(UPDATE_ID),
			"is_matrix": nlapiEscapeXML(UPDATE_IS_MATRIX),
			"item_name": nlapiEscapeXML(UPDATE_ITEM_NAME),
			"display_name": nlapiEscapeXML(UPDATE_DISPLAY_NAME),
			"child_item": nlapiEscapeXML(UPDATE_CHILD_ITEM),
			"field_list": nlapiEscapeXML(UPDATE_FIELD_LIST),
			"field_vals": nlapiEscapeXML(UPDATE_FIELD_VALS),
			"backup_file": nlapiEscapeXML(BACKUP_FILE),
		}));
	}
	//<<
	//Matrix Update
	//>>
	else if (!isNullOrEmpty(matrix_item_id)) {		
		var MATRIX_UPDATE_ID=matrix_item_id;
		var MATRIX_UPDATE_ERR='';
		var MATRIX_UPDATE_ERR_CODE='';
		var MATRIX_UPDATE_STATUS=-1;
		try {
			//var parent_name=nlapiLookupField('item', parent_id, 'itemid');
			var parent_rec=nlapiLoadRecord(nlapiLookupField('item', parent_id, 'recordtype'), parent_id);
			var parent_name=parent_rec.getFieldValue('itemid');
			//nlapiLogExecution('DEBUG', 'Parent Name', parent_name);
			field_list=field_list.split(',');
			var item_rec=nlapiLoadRecord(nlapiLookupField('item', matrix_item_id, 'recordtype'), matrix_item_id, {recordmode: 'dynamic'});
			//var backup_data=matrix_item_id+',';
			for (var i=0;i<field_list.length;i++) {
				//<<--
				//PARSE 2C%
				//PARSE 2C%
				//-->>
				if (field_list[i]=='itemid' || field_list[i]=='displayname') {
					var replacer=field_list[i]=='displayname'?display_name:item_name;
					var val=item_rec.getFieldValue(field_list[i]);
					val=replaceAll(val, replacer, parent_name);
					if (!isNullOrEmpty(val)) {
						//backup_data+=(item_rec.getFieldValue(field_list[i])==null?'':item_rec.getFieldValue(field_list[i]))+',';
						val=val.replace(/2C%/g, ",").replace(/%27/g, "'").replace(/%26/g, "&").replace(/%23/g, "#").replace(/%22/g, '"').replace(/""/g, '"');
						if (val.charAt(0)=='"' && val.charAt(val.length-1)=='"') {
							val=val.substring(1, val.length-1);
						}
					}
					//nlapiLogExecution('DEBUG', 'Item: '+matrix_item_id, field_list[i]+': '+val);
					item_rec.setFieldValue(field_list[i], val);
				}
				//Default type
				else if (field_list[i]!='parent' && item_rec.getField(field_list[i])) {
					//backup_data+=(item_rec.getFieldValue(field_list[i])==null?'':item_rec.getFieldValue(field_list[i]))+',';
					if (item_rec.getFieldValue(field_list[i])!=parent_rec.getFieldValue(field_list[i])) {
					//	value=field_vals[i].replace(/2C%/g, ",").replace(/%27/g, "'").replace(/%26/g, "&").replace(/%23/g, "#").replace(/%22/g, '"').replace(/""/g, '"');
					//	if (value.charAt(0)=='"' && value.charAt(value.length-1)=='"') {
					//		value=value.substring(1, value.length-1);
					//	}
					//}
					//if (item_rec.getFieldValue(field_list[i])!=value) {
					//	item_rec.setFieldValue(field_list[i], value);
					//}
						item_rec.setFieldValue(field_list[i], parent_rec.getFieldValue(field_list[i]));
					}
				}
				//else {
				//	backup_data+=',';
				//}
			}
			if (nlapiSubmitRecord(item_rec, true, true)) {
				MATRIX_UPDATE_STATUS=1;
				//<<--
				//Backup Manager
				//if (!isNullOrEmpty(backup_file)) {
					//backup_data=backup_data.substring(0, backup_data.length-1);
					//var temp=nlapiLoadFile(backup_file);
					//var folder=temp.getFolder();
					//temp=nlapiCreateFile(temp.getName(), 'CSV', temp.getValue()+'\n'+backup_data);
					//temp.setEncoding('UTF-8');
					//temp.setFolder(folder);
					//nlapiSubmitFile(temp);
				//}
				//Backup Manager
				//-->>
			}
		}
		catch (err) {
			nlapiLogExecution('DEBUG', 'Matrix Item Error Code: '+err.code, 'Details: '+err.message);
			MATRIX_UPDATE_ERR=err.message;
			MATRIX_UPDATE_ERR_CODE=err.code;
		}
		response.setContentType('JAVASCRIPT', 'matrix_item_update.json');
		response.write(JSON.stringify({
			"id": nlapiEscapeXML(MATRIX_UPDATE_ID),
			"status": nlapiEscapeXML(MATRIX_UPDATE_STATUS),
			"error": nlapiEscapeXML(MATRIX_UPDATE_ERR),
			"error_code": nlapiEscapeXML(MATRIX_UPDATE_ERR_CODE),
			"backup_file": nlapiEscapeXML(BACKUP_FILE),
		}));
	}
}

function itemMass_FieldSelector(request, response) {
	var keyword=request.getParameter('keyword');
	var html_code=	'<!DOCTYPE HTML>'+
					'<html>'+
					'	<head>'+
					'		<style>'+
					'			* {'+
					'				font-family: Arial,Helvetica,sans-serif; '+
					'				font-size: 13px;'+
					'			}'+
					'			body {'+
					'				margin: 0;'+
					'				padding: 0;'+
					'				border: 0;'+
					'			}'+
					'			.highlight_row {'+
					'				background-color: #607998 !important;'+
					'			}'+
					'			.highlight_row td a {'+
					'				color: #FFF !important;'+
					'				text-decoration: underline !important;'+
					'			}'+
					'			.highlight_row .item_arrow {'+
					'				background: rgba(0, 0, 0, 0) url("/images/sprite_machines.png") no-repeat scroll 0 -890px !important;'+
					'			}'+
					'		</style>'+
					'		<script type="text/javascript">'+
					'			function highlightRow(elem) {'+
					'				elem.parentNode.className="highlight_row";'+
					'			}'+
					'			function revert(elem) {'+
					'				elem.parentNode.className="";'+
					'			}'+
					'			function emitItemEvt(label, id) {'+
					'				window.parent.itemMass_SelectField(label, id);'+
					'			}'+
					'		</script>'+
					'	</head>'+
					'	<body>'+
					'		<table cellspacing="0" cellpadding="5px">';
	var all_fields=getAllItemFields(keyword);
	//Add to HTML CODE
	for (var i=0; all_fields && i<all_fields.id.length; i++) {
		html_code+= '<tr style="background: '+(i%2==1?'#FAFAFA':'#FFF')+';">'+
		'	<td width="14px" align="left" valign="middle" onmouseover="highlightRow(this);" onmouseleave="revert(this);">'+
		'		<a href="#" onclick="emitItemEvt(\''+all_fields.label[i]+'\', \''+all_fields.id[i]+'\'); return false;" class="item_arrow" style="display: inline-block; position: relative; width: 12px; height: 12px; background: rgba(0, 0, 0, 0) url(\'/images/sprite_machines.png\') no-repeat scroll 0 -878px; vertical-align: middle;"><img class="uir-popup-add-icon" width="13" border="0" height="13" src="/images/x.gif"></a>'+
	   	'	</td>'+
	   	'	<td align="left" onmouseover="highlightRow(this);" onmouseleave="revert(this);">'+
	    '		<a href="#" style="color: #000; font-size: 13px; text-decoration: none;" onclick="emitItemEvt(\''+all_fields.label[i]+'\', \''+all_fields.id[i]+'\'); return false;">'+all_fields.label[i]+' ('+all_fields.id[i]+')'+'</a>'+
	    '	</td>'+
	    '</tr>';
	}
	html_code+=	'</table>'+
				'<input type="hidden" name="all_fields_label" id="all_fields_label" value="'+all_fields.label.join(',')+'"/>'+
				'<input type="hidden" name="all_fields_id" id="all_fields_id" value="'+all_fields.id.join(',')+'"/>'+
				'</body>'+
				'</html>';
	response.write(html_code);
}

function itemMass_CSVGenerator(request, response) {
	//URL Parameters
	var csv_file=request.getParameter('csv_file');
	var item_id=request.getParameter('item_id');
	var field_list=request.getParameter('field_list');
	//Web Service Returns
	var GENERATOR_CSV_FILE=csv_file;
	var GENERATOR_CSV_URL='';
	var GENERATOR_STATUS=-1;
	var GENERATOR_ITEM_ID=item_id;
	var GENERATOR_FIELDS=field_list;
	var GENERATOR_ERROR='';
	if (!isNullOrEmpty(csv_file) && !isNullOrEmpty(item_id) && !isNullOrEmpty(field_list)) {
		try {
			var item_rec=nlapiLoadRecord(nlapiLookupField('item', item_id, 'recordtype'), item_id);
			if (isNullOrEmpty(item_rec)) {
				 throw 'Invalid Item ID. Please try again.';
			}
			var field_vals='';
			field_list=field_list.split(',');
			for (var i=0; field_list && i<field_list.length;i++) {
				//field_list[i]=getColumnID(field_list[i]);
				//nlapiLogExecution('DEBUG', field_list[i], item_rec.getField(field_list[i])==null);
				if (field_list[i]=='internalid') {
					field_vals+=item_rec.getId()+',';
				}
				else if (field_list[i]=='parent') {
					field_vals+=(item_rec.getFieldValue(field_list[i])!=null?item_rec.getFieldValue(field_list[i]):'')+',';
				}
				//else if (field_list[i]=='custitem_popup') {
				//	var item_img=item_rec.getFieldValue(field_list[i]);
				//	if (!isNullOrEmpty(item_img)) {
				//		item_img=nlapiLookupField('file', item_img, 'name');
				//		if (!isNullOrEmpty(item_img)) {
				//			field_vals+=item_img;
				//		}
				//	}
				//	field_vals+=',';
				//}
				//Item Field Exists
				else if (item_rec.getField(field_list[i])) {
					var temp_val;
					//Item Field Type
					switch (item_rec.getField(field_list[i]).getType()) {
						case 'select':
						case 'multiselect':
							temp_val=item_rec.getFieldText(field_list[i]);
							field_vals+=(temp_val==null?'':temp_val.replace(/,/g, "2C%").replace(/(\r\n|\n|\r)/gm,""))+',';
							//field_vals+=(temp_val==null?'':temp_val.replace(/%27/g, "'").replace(/%26/g, "&").replace(/%23/g, "#").replace(/%22/g, '"').replace(/""/g, '"').replace(/,/g, "2C%").replace(/(\r\n|\n|\r)/gm,""));
							break;
						default:
							temp_val=item_rec.getFieldValue(field_list[i]);
							field_vals+=(temp_val==null?'':temp_val.replace(/,/g, "2C%").replace(/(\r\n|\n|\r)/gm,""))+',';
							//field_vals+=(temp_val==null?'':temp_val.replace(/%27/g, "'").replace(/%26/g, "&").replace(/%23/g, "#").replace(/%22/g, '"').replace(/""/g, '"').replace(/,/g, "2C%").replace(/(\r\n|\n|\r)/gm,""));
							break;
					}
					//Item Field Type
				}
				else {
					field_vals+=',';
				}
				//Item Field Exists
			}
			field_vals=field_vals.substring(0, field_vals.length-1);
			var temp=nlapiLoadFile(csv_file);
			if (temp) {
				GENERATOR_CSV_URL=temp.getURL();
				var folder=temp.getFolder();
				temp=nlapiCreateFile(temp.getName(), 'CSV', temp.getValue()+'\n'+field_vals);
				temp.setEncoding('UTF-8');
				temp.setFolder(folder);
				if (nlapiSubmitFile(temp)) {
					GENERATOR_STATUS=1;
				}
			}
			else {
				throw "CSV File doesn't exist. Please try again.";
			}
		}
		catch (err) {
			GENERATOR_ERROR=err.message;
			nlapiLogExecution('DEBUG', 'CSV Generation Error', GENERATOR_ERROR);
		}
		response.setContentType('JAVASCRIPT', 'csv_generator.json');
		response.write(JSON.stringify({
			"item_id": nlapiEscapeXML(GENERATOR_ITEM_ID),
			"file_id": nlapiEscapeXML(GENERATOR_CSV_FILE),
			"file_url": nlapiEscapeXML(GENERATOR_CSV_URL),
			"status": nlapiEscapeXML(GENERATOR_STATUS),
			"error": nlapiEscapeXML(GENERATOR_ERROR),
			"field": nlapiEscapeXML(GENERATOR_FIELDS),
		}));
	}
}

function getAllItemFields(keyword) {
	if (!isNullOrEmpty(keyword)) {
		keyword=keyword.toUpperCase();
	}
	var item_type=getAvailableItemTypes().id;
	var all_fields={
		label: [],
		id: [],
	};
	var standard_fields=getStandardItemFields();
	//Acquisition
	for (var i=0; item_type && i<item_type.length;i++) {
		var rs=nlapiSearchRecord('item', null, [new nlobjSearchFilter('type', null, 'is', item_type[i]),
		                                        new nlobjSearchFilter('isinactive', null, 'is', 'F')], []);
		if (!isNullOrEmpty(rs) && rs.length>0) {
			try {
				var item_rec=nlapiLoadRecord(rs[0].getRecordType(), rs[0].getId());
				var custom_fields=getCustomItemFields(item_rec.getAllFields());
				var cloner=[];
				//Roll out on standard fields
				for (var j=0; standard_fields && j<standard_fields.length;j++) {
					var _this=item_rec.getField(standard_fields[j]);
					if (_this && _this.getLabel()!='' && _this.getType()!='help' && all_fields.id.indexOf(standard_fields[j])==-1) {
						if (((!isNullOrEmpty(keyword)) && (_this.getLabel().toUpperCase().indexOf(keyword)>-1)) ||
							(isNullOrEmpty(keyword))) {
							all_fields.id.push(standard_fields[j]);
							all_fields.label.push(_this.getLabel());
						}
					}
					else {
						cloner.push(standard_fields[j]);
					}				
				}
				standard_fields=cloner;
				//Roll out on custom field
				for (var j=0; custom_fields && j<custom_fields.length;j++) {
					var _this=item_rec.getField(custom_fields[j]);
					if (_this && _this.getLabel()!='' && _this.getType()!='help' && all_fields.id.indexOf(custom_fields[j])==-1) {
						if (((!isNullOrEmpty(keyword)) && (_this.getLabel().toUpperCase().indexOf(keyword)>-1)) ||
							(isNullOrEmpty(keyword))) {
							all_fields.id.push(custom_fields[j]);
							all_fields.label.push(_this.getLabel());
						}
					}
				}
			}
			catch (err) {
				nlapiLogExecution('DEBUG', 'Sample record doesn\'t exists', err.message+' '+err.message);
			}
		}
	}
	//Sort
	for (var i=0; i<all_fields.id.length; i++) {
		for (var j=i+1; j<all_fields.id.length; j++) {
			if (all_fields.label[i]>all_fields.label[j]) {
				var temp=all_fields.label[i];
				all_fields.label[i]=all_fields.label[j];
				all_fields.label[j]=temp;
				temp=all_fields.id[i];
				all_fields.id[i]=all_fields.id[j];
				all_fields.id[j]=temp;
			}
		}
	}
	return all_fields;
}

function replaceAll(source, find, replace) {
	//nlapiLogExecution('DEBUG', 'Source: '+source, 'Find: '+find+' Replace: '+replace);
	if (isNullOrEmpty(source) || (find.trim().toUpperCase()==replace.trim().toUpperCase())) {
		return source;
	}
	//var tmp=source.replace(find, replace);
	//while (tmp.indexOf(find)>-1) {
	//	tmp=tmp.replace(find, replace);
	//}
	//var tmp=source.split(new RegExp(find+'[AZaz0-9]*', 'g'));
	//var tmp=source.split(new RegExp('('+find+')+[^-]*', 'g'));
	//tmp=tmp.join(replace);
	//return tmp;
	if (isNullOrEmpty(source)) {
		return source;
	}
	find=findKeyword(source, find);
	var tmp=null;
	if (find=='') {
		find=new RegExp('[^-]*', 'g').exec(source);
		tmp=source.split(find);
	}
	else {
		tmp=source.split(new RegExp('('+find.replace(/\*/gi, '\\*')+')+[^-]*', 'g'));
	}
	//var tmp=source.split(new RegExp('('+find+')+[^-]*', 'g'));
	var new_name='';
	//Multilevel Matrix Items
	replace=replace.substring(replace.lastIndexOf(':')+1, replace.length).trim();
	//nlapiLogExecution('DEBUG', 'Final Replacer', replace);
	for (var i=0;tmp && i<tmp.length;i++) {
		if (tmp[i]!='' && tmp[i]!=find) {
			new_name+=replace+tmp[i];
		}
	}
	return new_name;
}

function findKeyword(source, key) {
	while (source.indexOf(key)==-1) {
		key=key.substring(0, key.length-1);
		if (key.length<3) {
			return '';
		}
	}
	return key;
}

function evalMatrix(item_id) {
	var is_matrix=false;
	var child_count=0;
	var rs=nlapiSearchRecord('item', null, [new nlobjSearchFilter('matrix', null, 'is', 'T'),
	                                        new nlobjSearchFilter('internalid', null, 'is', item_id)], []);
	if (!isNullOrEmpty(rs) && rs.length>0) {
		is_matrix=true;
		rs=nlapiSearchRecord('item', null, [new nlobjSearchFilter('parent', null, 'is', item_id)], []);
		if (!isNullOrEmpty(rs) && rs.length>0) {
			child_count=rs.length;
		}
	}
	return {
		is_matrix: is_matrix,
		child_count: child_count, 
	};
}

function getUpdateList(content, backup_file) {
	var id_index=findOnHeader(content['header'], 'Internal ID (internalid)');
	var item_id=[];
	var item_values=[];
	//Collect Item's ID and values
	if (id_index==-1) {
		throw "Item\'s Internal ID column not found.";
		return;
	}
	else {
		for (var i=0;content && i<content['content'].length;i++) {
			item_values[i]='';
			for (var j=0;content['content'] && j<content['header'].length;j++) {
				if (j==id_index) {
					var item=content['content'][i]['custfld_'+id_index];
					item_id.push(item);
				}
				else {
					var is_scientific=/-?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/;
					if (!isNullOrEmpty(content['content'][i]['custfld_'+j]) && (content['content'][i]['custfld_'+j].indexOf('E+')!=-1 || content['content'][i]['custfld_'+j].indexOf('e+')!=-1) && is_scientific.test(content['content'][i]['custfld_'+j])) {
						content['content'][i]['custfld_'+j]=Number(content['content'][i]['custfld_'+j]).toPrecision();
					}
					
					item_values[i]+=content['content'][i]['custfld_'+j]+',';
				}
			}
			item_values[i]=item_values[i].substring(0, item_values[i].length-1);
			//nlapiLogExecution('DEBUG', 'Content', item_values[i]);
		}
	}
	//Columns to update
	var cols_header=[];
	var cols_update='';
	var matrix_count=0;
	var matrix_list=[];
	for (var i=0;content && i<content['header'].length;i++) {
		if (i!=id_index) {
			//var col_id=getColumnID(content['header'][i]);
			var col_id=extractID(content['header'][i]);
			//nlapiLogExecution('DEBUG', content['header'][i], col_id);
			if (!isNullOrEmpty(col_id)) {
				cols_update+=col_id+',';
				cols_header.push(content['header'][i]);
			}
		}
	}
	cols_update=cols_update.substring(0, cols_update.length-1);
	//<<--Nov12 Bug FIx
	if (item_id.length==0) {
		throw "No item record to process from csv file.";
		return;
	}
	//Nov12 Bug Fix-->>
	//Columnize
	var rs=nlapiSearchRecord('item', null, [new nlobjSearchFilter('internalid', null, 'anyof', item_id)],
										   [new nlobjSearchColumn('itemid')]);
	nlapiLogExecution('DEBUG', 'Source item', item_id.length);
	nlapiLogExecution('DEBUG', 'Available item', rs.length);
	var ms=null;
	if (nlapiGetContext().getFeature('MATRIXITEMS')) {
		ms=nlapiSearchRecord('item', null, [new nlobjSearchFilter('internalid', null, 'anyof', item_id),
	                                        new nlobjSearchFilter('matrix', null, 'is', 'T')],
										   [new nlobjSearchColumn('itemid')]);
	}
	var columnize=[], counter=0;
	for (var i=0; item_values && i<item_values.length;i++) {
		var item_index=getResultIndex(rs, item_id[i]);
		if (item_index!=-1) {
		//var rec_type=nlapiLookupField('item', item_id[i], 'recordtype');
		//if (!isNullOrEmpty(rec_type)) {
			//<<---
			//SINGLE QUOTE BUG
			if (!isNullOrEmpty(item_values[item_index])) {
				item_values[i]=item_values[i].replace(/'/g, "%27").replace(/'/g, "%27").replace(/&/g, '%26').replace(new RegExp('#','g'), "%23").replace(/"/g, "%22");
			}
			//SINGLE QUOTE BUG
			//--->>
			//<<--
			//COLUMNIZE
			var col_item=[];
			//MATRIX EVAL
			//matrix_item=evalMatrix(item_id[i]);
			col_item['item_param']='item_id='+item_id[i]+'&field_list='+cols_update+'&field_vals='+item_values[i];
			//nlapiLogExecution('DEBUG', 'x', col_item['item_param']);
			if (!isNullOrEmpty(backup_file)) {
				col_item['item_param']+='&backup_file='+backup_file;
			}
			col_item['item_status']='<span id="item_status_'+counter+'" value="'+col_item['item_param']+'">Not Started.</span>';
			//col_item['item_link']='<a class="matrix_item" type="hidden" id="matrix_item_'+counter+'" is_matrix="'+matrix_item.is_matrix+'" child_size="'+matrix_item.child_count+'" include_child="false" target="_blank" href="https://system.netsuite.com/app/common/item/item.nl?id='+rs[item_index].getId()+'">'+rs[item_index].getValue('itemid')+'</a>';
			col_item['item_link']='<a class="matrix_item" type="hidden" id="matrix_item_'+counter+'" include_child="false" target="_blank" href="https://system.netsuite.com/app/common/item/item.nl?id='+rs[item_index].getId()+'">'+rs[item_index].getValue('itemid')+'</a>';
			var item_arr=item_values[i].split(',');
			for (var j=0;item_arr && j<item_arr.length;j++) {
				col_item['item_fld_'+j]=item_arr[j].replace(/2C%/g, ",").replace(/%27/g, "'").replace(/%26/g, "&").replace(/%23/g, "#").replace(/%22/g, '"').replace(/""/g, '"');
				if (col_item['item_fld_'+j].charAt(0)=='"' && col_item['item_fld_'+j].charAt(col_item['item_fld_'+j].length-1)=='"') {
					col_item['item_fld_'+j]=col_item['item_fld_'+j].substring(1, col_item['item_fld_'+j].length-1);
				}
			}
			columnize.push(col_item);
			//COLUMNIZE
			//-->>
			//if (matrix_item.is_matrix) {
			//	matrix_count++;
			//	var temp=[];
			//	temp['item_id']=item_id[i];
			//	temp['item_name']=col_item['item_link'].replace('id="matrix_item_'+i+'"', '');
			//	temp['child_count']=matrix_item.child_count;
			//	temp['item_index']=counter;
			//	matrix_list.push(temp);
			//}
			if (getResultIndex(ms, item_id[i])!=-1) {
				matrix_count++;
				var temp=[];
				temp['item_id']=item_id[i];
				temp['item_name']=col_item['item_link'].replace('id="matrix_item_'+i+'"', '');
				temp['item_index']=counter;
				matrix_list.push(temp);
			}
			counter++;
		//}
		//else {
			//throw "Problem with CSV file, check for item internalid.";
			//throw "Error: No such item record with internal id as "+item_id[i]+'.';
		//}
		}
	}
	return {
		content: columnize,
		header: cols_header,
		matrix_count: matrix_count,
		matrix_list: matrix_list,
	};
}

function extractID(field_name) {
	//var regex=/\(([^)]+)\)/gi;
	//nlapiLogExecution('DEBUG', field_name, regex.test(field_name)==true);
	//if (!regex.test(field_name)) {
	//	throw "Invalid column. Please try again.";
	//}
	var open_par=field_name.lastIndexOf('(');
	var close_par=field_name.lastIndexOf(')');
	return field_name.substring(open_par+1, close_par);
}

function getResultIndex(result_set, item_id) {
	for (var i=0;result_set && i<result_set.length;i++) {
		if (result_set[i].getId()==item_id) {
			return i;
			break;
		}
	}
	return -1;
}

function findOnHeader(header_arr, key) {
	for (var i=0; header_arr && i<header_arr.length;i++) {
		if (header_arr[i]==key) {
			return i;
			break;
		}
	}
	return -1;
}

function getColumnID(label) {
	var rs=nlapiSearchRecord(CONFIG.rec_type, null, [new nlobjSearchFilter(CONFIG.rec_fld_label, null, 'is', label.trim())], [new nlobjSearchColumn(CONFIG.rec_fld_id)]);
	//nlapiLogExecution('DEBUG', 'Search: '+label, isNullOrEmpty(rs)?0:rs.length);
	if (!isNullOrEmpty(rs) && rs.length>0) {
		return rs[0].getValue(CONFIG.rec_fld_id);
	}
	return null;
}

function getTimestamp() {
	return (new Date()).getTime();
}

function reformHeader(arr) {
	var arr_label=[], arr_name=[];
	//for (var i=0;arr && i<arr.length;i++) {
	//	if (arr[i]!='Internal ID' && arr[i]!='Item Name/Number') {
	//		arr_list.push(arr[i]);
	//	}
	//}
	if (!isNullOrEmpty(arr)) {
		arr=arr.split(',');
		for (var i=0; arr && i<arr.length;i++) {
			var arr_item=arr[i].split(CONFIG.delimiter);
			if (arr_item[0]!='Internal ID' && arr_item[0]!='Item Name/Number') {
				arr_label.push(arr_item[0]);
				arr_name.push(arr_item[1]);
			}
		}
	}
	return {
		label: arr_label,
		name: arr_name,
	};
}

function hasDuplicate(arr, key) {
	for (var i=0; arr && i<arr.length;i++) {
		if (arr[i]==key) {
			return true;
		}
	}
	return false;
}

function sortItem(item_arr) {
	for (var i=0;item_arr && i<item_arr.length;i++) {
		for (var j=i+1;j<item_arr.length;j++) {
			if (item_arr[i]['item_name']>item_arr[j]['item_name']) {
				var temp_item=item_arr[i];
				item_arr[i]=item_arr[j];
				item_arr[j]=temp_item;
			}
		}
	}
	return item_arr;
}

function searchItem(item_type, item_subtype, item_cols, pager) {
	var filter=[new nlobjSearchFilter('isinactive', null, 'is', 'F')];
	if (isNullOrEmpty(item_type) || item_type.length==0) {
		filter.push(new nlobjSearchFilter('type', null, 'anyof', getAvailableItemTypes().id));
	}
	var	item_id_col=new nlobjSearchColumn('itemid');
	item_id_col.setSort();
	//var column=[item_id_col,
    //            new nlobjSearchColumn('displayname'),
    //            new nlobjSearchColumn('baseprice'),
    //            new nlobjSearchColumn('salesdescription'),
    //            new nlobjSearchColumn('parent')];
	//var column_id=[];
	if (!isNullOrEmpty(item_type)) {
		filter.push(new nlobjSearchFilter('type', null, 'anyof', item_type));
	}
	if (!isNullOrEmpty(item_subtype)) {
		filter.push(new nlobjSearchFilter('subtype', null, 'anyof', item_subtype));
	}
	//var rs=nlapiSearchRecord('item', null, filter, [new nlobjSearchColumn('internalid', null, 'group'), new nlobjSearchColumn('itemid', null, 'group')]);
	var rs=nlapiCreateSearch('item', filter, [new nlobjSearchColumn('internalid', null, 'group'), new nlobjSearchColumn('itemid', null, 'group')]).runSearch();
	var count=0;
	//var distinct_rows=0;
	//if (!isNullOrEmpty(rs)) {
	//	distinct_rows=rs.length;
	//}
	//if (distinct_rows>CONFIG.max_result) {
	//	distinct_rows=CONFIG.max_result;
	//}
	//
	//if (!isNullOrEmpty(item_cols)) {
	//	item_cols=reformHeader(item_cols);
	//	for (var i=0;item_cols && i<item_cols.length;i++) {
	//		var col_item=getColumnID(item_cols[i]);
	//		column_id.push(col_item);
	//		column.push(new nlobjSearchColumn(col_item));
	//	}
	//}
	//var queued=[];
	var result_arr=[];
	//var last_filter_size=filter.length;
	
	//while (queued.length<distinct_rows) {
		//if (queued.length>0) {
		//	filter.push(new nlobjSearchFilter('internalid', null, 'noneof', queued));
		//}
		//rs=nlapiSearchRecord('item', null, filter, column);
		if (!isNullOrEmpty(rs)) {
			for (var index=0; true; index++) {
				var temp=rs.getResults(index*1000, (index+1)*1000);
				count+=temp.length;
				if (temp.length<1000) {
					break;
				}
			}
			nlapiLogExecution('DEBUG', 'Total Items', count);
			rs=rs.getResults(pager*1000, (pager+1)*1000);
			for (var i=0;i<rs.length;i++) {
				//if (queued.indexOf(rs[i].getId())==-1) {
					var result_item=[];
					result_item['item_id']=rs[i].getValue('internalid', null, 'group');
					result_item['item_name']=rs[i].getValue('itemid', null, 'group');
					//result_item['item_display']=rs[i].getValue('displayname');
					//result_item['item_price']=rs[i].getValue('baseprice');
					//result_item['item_description']=rs[i].getValue('salesdescription');
					//result_item['item_fields']='';
					//for (var j=0;column_id && j<column_id.length;j++) {
					//	var tmp=rs[i].getText(column_id[j]);
					//	if (isNullOrEmpty(tmp)) {
					//		tmp=rs[i].getValue(column_id[j]);
					//	}
					//	result_item['item_fields']+=tmp+',';
					//}
					//result_item['item_fields']=result_item['item_fields'].substring(0, result_item['item_fields'].length-1);
					//if (!isNullOrEmpty(rs[i].getValue('parent'))) {
					//	result_item['item_name']=result_item['item_name'].substring(result_item['item_name'].indexOf(':')+1, result_item['item_name'].length);
					//	result_item['item_name']=result_item['item_name'].trim();
					//}
					result_arr.push(result_item);
					//queued.push(rs[i].getId());
				//}
			}
		}
		//if (filter.length>last_filter_size) {
		//	filter.pop();
		//}
	//}
	return { 
		list: result_arr,
		count: count, 
	};
	//return null;
}

function generateFieldSelector(fields, index) {
	var selection='<select id="fld_selection_'+index+'">';
	for (var i=0;fields && i<fields['id'].length;i++) {
		selection+='<option value="'+fields['id'][i]+'">'+fields['label'][i]+'</option>';
	}
	selection+='</select>';
	return selection;
}

function getAvailableItemTypes() {
	var item_type_id=['Description', 'Discount', 'InvtPart', 'Group', 'Kit', 'Markup', 'NonInvtPart', 'OthCharge', 'Payment', 'Service', 'Subtotal'];
	var item_type_label=['Description', 'Discount', 'Inventory Item', 'Group', 'Kit', 'Markup', 'Non-inventory Item', 'Other Charge', 'Payment', 'Service', 'Subtotal'];
	//['Expense', 'GiftCert', 'DwnLdItem', 'Assembly']
	if (nlapiGetContext().getFeature('GIFTCERTIFICATES')) {
		item_type_id.push('GiftCert');
		item_type_label.push('Gift Certificate');
	}
	if (nlapiGetContext().getFeature('DOWNLOADITEMS')) {
		item_type_id.push('DwnLdItem');
		item_type_label.push('Download Items');
	}
	if (nlapiGetContext().getFeature('ASSEMBLIES')) {
		item_type_id.push('Assembly');
		item_type_label.push('Assembly');
	}
	return {
		id: item_type_id,
		label: item_type_label,
	};
}

function getItemFields() {
	var filter=[];
	if (!nlapiGetContext().getFeature('SUBSIDIARIES')) {
		filter.push(new nlobjSearchFilter(CONFIG.rec_fld_id, null, 'isnot', 'subsidiary'));
	}
	var item_fields=[];
	item_fields['id']=[];
	item_fields['label']=[];
	var rs=nlapiSearchRecord(CONFIG.rec_type, null, filter, [new nlobjSearchColumn(CONFIG.rec_fld_id), new nlobjSearchColumn(CONFIG.rec_fld_label).setSort(false)]);
	if (!isNullOrEmpty(rs)) {
		for (var i=0;i<rs.length;i++) {
			item_fields['id'].push(rs[i].getValue(CONFIG.rec_fld_id));
			item_fields['label'].push(rs[i].getValue(CONFIG.rec_fld_label));
		}
	}
	return item_fields;
}

function isNullOrEmpty(data) {
	return (data==null||data=='');
}

function decodeBase64(s) {
	var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
    var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(i=0;i<64;i++){e[A.charAt(i)]=i;}
    for(x=0;x<L;x++){
        c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
        while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
    }
    return r;
}

function textToArr(text) {
	nlapiLogExecution('DEBUG', 'Text Param', text);
	//Return holders
	var text_arr=[];
	var text_content=[];
	var text_header=[];
	//Lines from the text
	var lines=text.split(/\n|\n\r/);
	//Lie item and count
	var col_size=0, line_item=null;
	if (lines.length<=1) {
		nlapiLogExecution('DEBUG', 'Lines Param', lines.length);
		throw "No item record to process from csv file.";
	}
	else {
		var i=0;
		line_item=lines[0].split(',');
		col_size=line_item.length;
		for (i=0;i<col_size; i++) {
			text_header.push(line_item[i]);
		}
		text_arr['header']=text_header;
		for (i=1;i<lines.length && i<=CONFIG.MAX_LIST_LIMIT;i++) {
			line_item=lines[i].replace(/\n|\n\r/, '').split(',');
			col_size=line_item.length;
			//nlapiLogExecution('DEBUG', 'Content Count', line_item.length+' = '+text_arr['header'].length);
			var content_item=[];
			for (var j=0;j<col_size;j++) {
				content_item['custfld_'+j]=line_item[j];
			}
			if (col_size == text_header.length) {
				text_content.push(content_item);
			}
		}
		text_arr['content']=text_content;
		nlapiLogExecution('DEBUG', 'Content Size', text_arr['content'].length);
		return text_arr;
	}
	return null;
}

function findItemIndex(arr, key) {
	for (var i=0;arr && i<arr.length;i++) {
		var cmp1=arr[i].toLowerCase().replace('\n','');
		var cmp2=key.toLowerCase().replace('\n', '');
		if (cmp1==cmp2) {
			return i;
		}
	}
	return -1;
}

function itemMass_Folder() {
	var file=nlapiSearchGlobal('file:'+CONFIG.script_name);
	if (!isNullOrEmpty(file)) {
		return nlapiLoadFile(file[0].getId()).getFolder();
	}
	return null;
}

function backupManager_Folder() {
	var file=nlapiSearchGlobal('file:'+CONFIG.backup_manager_folder);
	if (!isNullOrEmpty(file)) {
		return nlapiLoadFile(file[0].getId()).getFolder();
	}
	return null;
}

function splitArray(arr_data) {
	if (!arr_data||((arr_data instanceof Array) && (arr_data.length==0)))
		return '';
	else if (arr_data.length==1) {
		return arr_data;
	}
	else {
		return arr_data.split(String.fromCharCode(5));
	}
}

function isBase64Encoded(content) {
	var base64Matcher = new RegExp("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})([=]{1,2})?$");
	if (base64Matcher.test(content)) {
		return true;
	}
	return false;
}

function getFileURL(filename) {
	var file=nlapiSearchGlobal('file:'+filename);
	if (file!=null && file!='' && filename.length>0) {
		return nlapiLookupField('file', file[0].getId(), 'url');
	}
	return '';
}

function getFileID(filename) {
	//var file=nlapiSearchGlobal('file:'+filename);
	//if (file!=null && file!='' && filename.length>0) {
	//	return file[0].getId();
	//}
	var rs=nlapiSearchRecord('file', null, [new nlobjSearchFilter('name', null, 'is', filename)], []);
	if (!isNullOrEmpty(rs) && rs.length>0) {
		return rs[0].getId();
	}
	return null;
}

function getPersonalBackup() {
	//<<--Nov12 Bug Fix
	var rs=nlapiSearchRecord(CONFIG.backup_rec_type, null, [new nlobjSearchFilter(CONFIG.backup_fld_user, null,'is', nlapiGetUser()),
	                                                        new nlobjSearchFilter('isinactive', null, 'is', 'F')],
    //Nov12 Bug Fix-->>
	
														   [new nlobjSearchColumn(CONFIG.backup_fld_name).setSort(), new nlobjSearchColumn(CONFIG.backup_fld_date),
															new nlobjSearchColumn(CONFIG.backup_fld_desc), new nlobjSearchColumn(CONFIG.backup_fld_public),
															new nlobjSearchColumn('internalid', 'file')]);
	if (!isNullOrEmpty(rs)) {
		var result_arr=[];
		for (var i=0;rs && i<rs.length;i++) {
			var result_item=[];
			result_item['file']=rs[i].getValue('internalid', 'file');
			if (!isNullOrEmpty(result_item['file'])) {
				result_item['file_link']=nlapiLookupField('file', result_item['file'], 'url');
				result_item['id']=rs[i].getId();
				result_item['date']=rs[i].getValue(CONFIG.backup_fld_date);
				result_item['desc']=rs[i].getValue(CONFIG.backup_fld_desc);
				result_item['name']=rs[i].getValue(CONFIG.backup_fld_name);
				result_item['is_public']=rs[i].getValue(CONFIG.backup_fld_public);
				result_arr.push(result_item);
			}
		}
		return result_arr;
	}
	return null;
}

function getPublicBackup() {
	//<<--Nov12 Bug Fix
	var rs=nlapiSearchRecord(CONFIG.backup_rec_type, null, [new nlobjSearchFilter(CONFIG.backup_fld_public, null, 'is', 'T'),
	                                                        new nlobjSearchFilter('isinactive', null, 'is', 'F')
	//Nov12 Bug Fix-->>
	                                                        //new nlobjSearchFilter(CONFIG.backup_fld_user, null, 'noneof', nlapiGetUser())],
	                                                        ],
			[new nlobjSearchColumn(CONFIG.backup_fld_name).setSort(), new nlobjSearchColumn(CONFIG.backup_fld_date),
			 new nlobjSearchColumn(CONFIG.backup_fld_desc), new nlobjSearchColumn(CONFIG.backup_fld_public),
			 new nlobjSearchColumn('internalid', 'file'), new nlobjSearchColumn(CONFIG.backup_fld_user)]);
	if (!isNullOrEmpty(rs)) {
		var result_arr=[];
		for (var i=0;rs && i<rs.length;i++) {
			var result_item=[];
			result_item['file']=rs[i].getValue('internalid', 'file');
			if (!isNullOrEmpty(result_item['file'])) {
				result_item['file_link']=nlapiLookupField('file', result_item['file'], 'url');
				result_item['id']=rs[i].getId();
				result_item['date']=rs[i].getValue(CONFIG.backup_fld_date);
				result_item['desc']=rs[i].getValue(CONFIG.backup_fld_desc);
				result_item['name']=rs[i].getValue(CONFIG.backup_fld_name);
				result_item['is_public']=rs[i].getValue(CONFIG.backup_fld_public);
				result_item['user']=nlapiLookupField('employee', rs[i].getValue(CONFIG.backup_fld_user), 'entityid');
				result_arr.push(result_item);
			}
		}	
		return result_arr;
	}
	return null;
}

function getStandardItemFields() {
	var rs=nlapiSearchRecord(CONFIG.lst_standard_item_fields, null, [], [new nlobjSearchColumn('name')]);
	var result_arr=[];
	if (!isNullOrEmpty(rs)) {
		for (var i=0; rs && i<rs.length;i++) {
			result_arr.push(rs[i].getValue('name'));
		}
	}
	return result_arr;
}

function isValidSize(size) {
	return ((size/1048576)<=CONFIG.MAX_FILE_SIZE);
}

function getCustomItemFields(arr) {
	arr=arr.sort(function(a, b) {
		return ((new RegExp('^cust', 'gi')).test(b));
	});
	var custom_field=[];
	for (var i=0; arr && i<arr.length;i++) {
		if ((new RegExp('^cust', 'gi')).test(arr[i])) {
			custom_field.push(arr[i]);
		}
	}
	return custom_field;
}

function getFileURL(filename) {
	var rs=nlapiSearchRecord('file', null, [new nlobjSearchFilter('name', null, 'is', filename)], [new nlobjSearchColumn('url')]);
    if (rs && rs.length>0) {
       return rs[0].getValue('url');
    }
    return null;
}