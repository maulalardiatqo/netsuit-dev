/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/url', 'N/runtime', 'N/format','N/error','N/config','N/currency'], 
	function (serverWidget, search, record, url, runtime, format, error, config, currency) {
    
	function onRequest(context) {
        var contextRequest = context.request;
		
		function update_rfq_with_PO_no(poId,listpolines,rfq_internal_id) {
			try 
			{	
				var err_messages = '';
				var count = contextRequest.getLineCount({group: 'sublist'});
				log.debug("get listpoline", listpolines);
				for (var i in listpolines) {
					var listpoline = listpolines[i];
					
					var rfq_line_id = listpoline.rfq_line_id;
					log.debug("get rfq_line_id", rfq_line_id);
					
					var rfq_line_type = listpoline.rfq_line_type;
					log.debug("rfq_line_type", rfq_line_type);
					var rfq_sublist_name = 'customrecord_abj_rfq_item';
					var fld_link_order = 'custrecord_abj_rfq_item_linkorder';
					if (rfq_line_type=='Expense') {
						rfq_sublist_name = 'customrecord_abj_rfq_expenses';
						fld_link_order = 'custrecord_abj_rfq_exp_linkorder';
					}

					rfqline_data_to_update = record.load({
									type : rfq_sublist_name,
									id : rfq_line_id,         
									isDynamic : true
					});

					// var sublist_id = 'item';
					// if (rfq_line_type=='Expense') {
						// sublist_id = 'expense';
					// }
					rfqline_data_to_update.setValue({
						fieldId: fld_link_order,
						value: poId});		
						
					log.debug("set value rfq", poId);
					rfqlineId = rfqline_data_to_update.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
						});
					log.debug("save rfq line", rfqlineId);
				}
				
				var rfq_item_cek_complete = search.load({
						id: 'customsearchafc_rfq_item_to_check',});
					  
				rfq_item_cek_complete.filters.push(search.createFilter({
							name: 'internalid', 
							join: 'custrecord_abj_rfq_item_rfq', 
							operator: search.Operator.IS,
							values: rfq_internal_id
				}));
				var rfq_item_cek_completeset = rfq_item_cek_complete.run();    
				rfq_item_cek_complete = rfq_item_cek_completeset.getRange(0, 1);

				  
				var rfq_exp_cek_complete = search.load({
					id: 'customsearchafc_rfq_exps_to_check',});

				rfq_exp_cek_complete.filters.push(search.createFilter({
							name: 'internalid', 
							join: 'custrecord_abj_rfq_exp_rfq', 
							operator: search.Operator.IS,
							values: rfq_internal_id
				}));
				var rfq_exp_cek_completeset = rfq_exp_cek_complete.run();    
				rfq_exp_cek_complete = rfq_exp_cek_completeset.getRange(0, 1);

				log.debug("rfq_item_cek_complete", rfq_item_cek_complete);
				log.debug("rfq_exp_cek_complete", rfq_exp_cek_complete);
				var rfq_status = 10;//'PO Created';
				if ((rfq_item_cek_complete.length>0)||(rfq_exp_cek_complete.length>0))
					rfq_status = 11;//'PO Partially Created';
				
				rfq_data_to_update = record.load({
										type : 'customrecord_abj_rfq',
										id : rfq_internal_id,         
										isDynamic : true
				});	
				log.debug("rfq_status", rfq_status);
				rfq_data_to_update.setValue({
					fieldId: 'custrecord_abj_rfq_status',
					value: rfq_status, 
					ignoreFieldChange: false});

				var rfqid = rfq_data_to_update.save({
							enableSourcing: true,
							ignoreMandatoryFields: true});
				log.debug("update po id to rfq", rfqid);

			}	
			catch(e) {
				err_messages = e.name + ': ' + e.message;
				log.debug(err_messages);
				return err_messages;
			}
			return err_messages;
		}
		
        if (contextRequest.method == 'GET') {

            var form = serverWidget.createForm({
                title: 'RFQ to Purchase Order'
            });
            var RfqField = form.addField({
                id: 'custpage_rfq',
                label: 'RFQ #',
                type: serverWidget.FieldType.TEXT,
            });

            RfqField.isMandatory = true;

            var RfqtypeField = form.addField({
                id: 'custpage_rfqtype',
                label: 'Rfq TYPE',
                type: serverWidget.FieldType.SELECT,
                source: 'customrecord_abj_rfq_type'
            });

            var subsidiaryField = form.addField({
                id: 'custpage_subsidiary',
                label: 'SUBSIDIARY',
                type: serverWidget.FieldType.SELECT,
                source: 'subsidiary'
            });
            subsidiaryField.isMandatory = true;

            var locationField = form.addField({
                id: 'custpage_location',
                label: 'LOCATION',
                type: serverWidget.FieldType.SELECT,
                source: 'location'
            });

            var classField = form.addField({
                id: 'custpage_class',
                label: 'CLASS',
                type: serverWidget.FieldType.SELECT,
                source: 'classification'
            });

            var departmentField = form.addField({
                id: 'custpage_department',
                label: 'DEPARTMENT',
                type: serverWidget.FieldType.SELECT,
                source: 'department'
            });

            var Rfqdatefrom = form.addField({
                id: 'custpage_rfqdatefrom',
                label: 'RFQ DATE FROM',
                type: serverWidget.FieldType.DATE,
            });

            var Rfqdatefrom = form.addField({
                id: 'custpage_rfqdateto',
                label: 'RFQ DATE TO',
                type: serverWidget.FieldType.DATE,
            });

            var lineCount = form.addField({
                id: 'custpage_line_count',
                label: 'NUMBER OF LINE SELECTED',
                type: serverWidget.FieldType.INTEGER
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE    /// disable
            });
			lineCount.defaultValue = 0;

            // Sublist Coloumn
            var sublist = form.addSublist({
                id: 'sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'RFQ List'
            });
			sublist.addButton({
				id : 'btnMarkAll',
				label : 'Mark All',
				functionName: 'MarkAll(true)'
			});
			sublist.addButton({
				id : 'btnUnMarkAll',
				label : 'Unmark All',
				functionName: 'MarkAll(false)'
			});
            // Ceckbox Sublist
            sublist.addField({
                id: 'sublist_select',
                label: 'Select',
                type: serverWidget.FieldType.CHECKBOX
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY	
            });
			
            var potypefield = sublist.addField({
                id: 'sublist_potype',
                label: 'PO TYPE',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist_abj_po_type'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
			//potypefield.isMandatory = true;

            sublist.addField({
                id: 'sublist_rfq',
                label: 'RFQ #',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_rfq_date',
                label: 'RFQ DATE',
                type: serverWidget.FieldType.DATE
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_rfq_type',
                label: 'RFQ TYPE',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_line_type',
                label: 'LINE TYPE',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_item_text',
                label: 'ITEM',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_item',
                label: 'ITEM',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_exp_cat_text',
                label: 'EXPENSE CATEGORY',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_exp_cat',
                label: 'EXPENSE CATEGORY',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_description',
                label: 'DESCRIPTION',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_delivery_date',
                label: 'DELIVERY DATE',
                type: serverWidget.FieldType.DATE
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_delivery_addrs',
                label: 'DELIVERY ADDRESS',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_quantity',
                label: 'QUANTITY',
                type: serverWidget.FieldType.FLOAT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_unit',
                label: 'UOM',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_unit_text',
                label: 'UOM',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });


            sublist.addField({
                id: 'sublist_currency',
                label: 'CURRENCY',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_currency_id',
                label: 'CURRENCY',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_quote_unit_price',
                label: 'QUOTATION UNIT PRICE',
                type: serverWidget.FieldType.CURRENCY,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_quote_amount',
                label: 'QUOTATION AMOUNT',
                type: serverWidget.FieldType.CURRENCY,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_project',
                label: 'PROJECT',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_project_id',
                label: 'PROJECT',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_activity_code',
                label: 'ACTIVITY CODE',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_activity_code_id',
                label: 'ACTIVITY CODE',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_department',
                label: 'DEPARTMENT',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_department_id',
                label: 'DEPARTMENT',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_class',
                label: 'CLASS',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_class_id',
                label: 'CLASS',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_location',
                label: 'LOCATION',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_location_id',
                label: 'LOCATION',
                type: serverWidget.FieldType.TEXT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_rfq_id',
                label: 'rfq id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_rfq_line_id',
                label: 'line id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_subsidiary',
                label: 'subsidiary',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_budget_year',
                label: 'budgetyear',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_budget_period',
                label: 'budgetperiod',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_rfq_internalid',
                label: 'rfq internal id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_line_internalid',
                label: 'line internal id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_requestor',
                label: 'requestor',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_awarded_vendor',
                label: 'Awarded Vendor',
                type: serverWidget.FieldType.SELECT,
				source: 'vendor'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_account',
                label: 'Account',
                type: serverWidget.FieldType.SELECT,
				source: 'account'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_project_name',
                label: 'project name',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_pr_receive_date',
                label: 'pr receive date',
                type: serverWidget.FieldType.DATE
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_header_department',
                label: 'header department',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_header_class',
                label: 'header class',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_header_location',
                label: 'header location',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            form.addSubmitButton({
                label: 'Submit',
            });
			
			form.addResetButton({
				label : 'Clear'
			});
			
            form.clientScriptModulePath = 'SuiteScripts/afc_rfq_to_po_cs.js';
            context.response.writePage(form);
        } else {

            var count = contextRequest.getLineCount({
                group: 'sublist'
            });
			log.debug("count", count);
			var PO = null;
			var text_for_PO_url = '';
			var success_create_count = 0;
			var failed_count = 0;
			var line_idx = 0;
			var line_exp_idx = 0;
			var err_messages = '';
			var prev_vendor = '';
			var prev_po_type = '';
			
			var rfq_internal_id = contextRequest.getSublistValue({
			group: 'sublist',
			name: 'sublist_rfq_internalid',
			line: 0});
			log.debug("rfq_internal_id", rfq_internal_id);
			
			var rfq_vendorlist = search.create({
			type: 'customrecord_abj_vendor_list',
			columns: ['custrecord_abj_rfq_vdr','custrecord_abj_rfq_vdr_qtno','custrecord_abj_rfq_qtdate'],
			filters: [{name: 'custrecord_abj_rfq_vdr_rfq', operator: 'is',values: rfq_internal_id},
					  ]}).run().getRange({start:0,end:100});
			log.debug("rfq_vendorlist", rfq_vendorlist);
            for (var i = 0; i < count; i++) {
				try {
				
					var vendor = contextRequest.getSublistValue({
					group: 'sublist',
					name: 'sublist_awarded_vendor',
					line: i});
					log.debug("vendor", vendor);

					var po_type = contextRequest.getSublistValue({
					group: 'sublist',
					name: 'sublist_potype',
					line: i});
					log.debug("po_type", po_type);
					//var RfqDate = contextRequest.parameters.sublist_Rfq_date;
					//var requestedReceiptDate = contextRequest.parameters.sublist_requested_receipt_date;
					
					if ((vendor !== prev_vendor)||(po_type !== prev_po_type)) {
						line_idx = 0;
						line_exp_idx = 0;
						var listpoline = [];
						var listvendor_prline = [];

						PO = record.create({
							type: 'purchaseorder',
							isDynamic: true
						});
				
						var currentEmployee = runtime.getCurrentUser();
						log.debug("currentEmployee", currentEmployee.id);
						PO.setValue({
							fieldId: 'custbody_abj_po_buyer',
							value: currentEmployee.id, 
							ignoreFieldChange: false
						});

						//let today = new Date();
						
						function sysDate() {
							var date = new Date();
							var tdate = date.getUTCDate();
							var month = date.getUTCMonth() + 1; // jan = 0
							var year = date.getUTCFullYear();
							log.debug("tdate month year", tdate + '/' + month + '/' + year);
							
							return tdate + '/' + month + '/' + year;
						}
						let today = sysDate();
						today = format.parse({value:today, type: format.Type.DATE});
						PO.setValue({
							fieldId: 'trandate',
							value: today, 
							ignoreFieldChange: true
						});
						
						var requestor = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_requestor',
						line: i});
						log.debug("sublist_requestor", requestor);

						PO.setValue({
							fieldId: 'custbody_abj_po_requestor',
							value: requestor, 
							ignoreFieldChange: false
						});
						log.debug("requestor", requestor);
				
						PO.setValue({
							fieldId: 'entity',
							value: vendor, 
							ignoreFieldChange: false
						});
						log.debug("vendor", vendor);

						var subsidiary = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_subsidiary',
						line: i});
						log.debug("subsidiary", subsidiary);
						PO.setValue({
							fieldId: 'subsidiary',
							value: subsidiary, 
							ignoreFieldChange: false
						});

						PO.setValue({
							fieldId: 'custbody_abj_po_type',
							value: po_type, 
							ignoreFieldChange: false
						});

						var rfq_Currency = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_currency_id',
						line: i});
						log.debug("rfq_Currency", rfq_Currency);
						PO.setValue({
							fieldId: 'currency',
							value: rfq_Currency, 
							ignoreFieldChange: false
						});

						Curr_exchage_Rate = Number(currency.exchangeRate({
						source: rfq_Currency,
						target: 'USD',}));
						log.debug("Curr_exchage_Rate", Curr_exchage_Rate);
						PO.setValue({
							fieldId: 'exchangerate',
							value: Curr_exchage_Rate, 
							ignoreFieldChange: false
						});

						//for (idx in rfq_vendorlist) {
						var quote_refno;	
						var quote_refdate;	
						rfq_vendorlist.forEach(function(vendorlist) {	
							var vendor_to_check = vendorlist.getValue('custrecord_abj_rfq_vdr');
							if (vendor_to_check==vendor) {
								quote_refno = vendorlist.getValue('custrecord_abj_rfq_vdr_qtno');
								log.debug("quote_refno", quote_refno);
								PO.setValue({
									fieldId: 'custbody_abj_quot_refno',
									value: quote_refno, 
									ignoreFieldChange: false
								});
								quote_refdate = vendorlist.getValue('custrecord_abj_rfq_qtdate');
								if (quote_refdate) 
									quote_refdate = format.parse({value:quote_refdate, type: format.Type.DATE});
								log.debug("quote_refdate", quote_refdate);
								PO.setValue({
									fieldId: 'custbody_abj_quot_ref_date',
									value: quote_refdate, 
									ignoreFieldChange: false
								});
							}
						});	

						var budget_year = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_budget_year',
						line: i});
						log.debug("budget_year", budget_year);
						PO.setValue({
							fieldId: 'custbody_abj_budyear_tran',
							value: budget_year, 
							ignoreFieldChange: false
						});

						var budget_period = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_budget_period',
						line: i});
						log.debug("budget_period", budget_period);
						PO.setValue({
							fieldId: 'custbody_abj_budperiod_tran',
							value: budget_period, 
							ignoreFieldChange: false
						});

						log.debug("rfq_internal_id", rfq_internal_id);
						PO.setValue({
							fieldId: 'custbody_abj_rfq_no',
							value: rfq_internal_id, 
							ignoreFieldChange: false
						});

						var rfq_date = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_rfq_date',
						line: i});
						log.debug("rfq_date", rfq_date);
						rfq_date = format.parse({value:rfq_date, type: format.Type.DATE});

						PO.setValue({
							fieldId: 'custbody_abj_rfq_date',
							value: rfq_date, 
							ignoreFieldChange: false
						});

						var project_name = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_project_name',
						line: i});
						log.debug("project_name", project_name);
						PO.setValue({
							fieldId: 'custbody_abj_po_proj_name',
							value: project_name, 
							ignoreFieldChange: false
						});

						var rfq_receive_Date = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_pr_receive_date',
						line: i});
						if (rfq_receive_Date) {
							rfq_receive_Date = format.parse({value:rfq_receive_Date, type: format.Type.DATE});
							log.debug("rfq_receive_Date", rfq_receive_Date);
							PO.setValue({
								fieldId: 'duedate',
								value: rfq_receive_Date, 
								ignoreFieldChange: false
							});
						}

						var header_dept = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_header_department',
						line: i});
						if (header_dept) {
							log.debug("header_dept", header_dept);
							PO.setValue({
								fieldId: 'department',
								value: header_dept, 
								ignoreFieldChange: true
							});
						}

						var header_class = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_header_class',
						line: i});
						if (header_class) {
							log.debug("header_class", header_class);
							PO.setValue({
								fieldId: 'class',
								value: header_class, 
								ignoreFieldChange: false
							});
						}

						var header_location = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_header_location',
						line: i});
						if (header_location) {
							log.debug("header_location", header_location);
							PO.setValue({
								fieldId: 'location',
								value: header_location, 
								ignoreFieldChange: false
							});
						}
					}
				
					var rfq_item = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_item',
						line: i});
					log.debug("rfq_item", rfq_item);
					
					var rfq_line_type = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_line_type',
						line: i});
					log.debug("rfq_line_type", rfq_line_type);

					var rfq_line_id = contextRequest.getSublistValue({
									group: 'sublist',
									name: 'sublist_line_internalid',
									line: i});
					log.debug("get rfq_line_id", rfq_line_id);
					
					listpoline.push({
								rfq_line_id : rfq_line_id,
								//rfq_item : rfq_item,
								rfq_line_type: rfq_line_type,
								});
								
					if (rfq_line_type=='Item') {
						var vsublistid = 'item';
						PO.selectNewLine({sublistId:vsublistid});
						
						log.debug("line_idx", line_idx);

						PO.setCurrentSublistValue({
						sublistId: vsublistid,
						fieldId: 'item',
						value: rfq_item
						});
						
						var rfq_item_desc = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_description',
							line: i});
						log.debug("rfq_item_desc", rfq_item_desc);
						PO.setCurrentSublistValue({
						sublistId: vsublistid,
						fieldId: 'description',
						value: rfq_item_desc
						});

						var rfq_item_account = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_account',
							line: i});
						log.debug("sublist_account", rfq_item_account);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'custrecord_abj_PO_item_account',
						value:rfq_item_account
						});

						var rfq_activity_code = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_activity_code_id',
							line: i});
						log.debug("rfq_activity_code", rfq_activity_code);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'cseg_paactivitycode',
						value:rfq_activity_code
						});

						var rfq_project = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_project_id',
							line: i});
						log.debug("rfq_project", rfq_project);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'customer',
						value:rfq_project
						});

						var rfq_item_qty = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_quantity',
							line: i});
						log.debug("sublist_quantity", rfq_item_qty);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'quantity',
						value:rfq_item_qty
						});

						var rfq_item_unit = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_unit',
							line: i});
						log.debug("rfq_item_unit", rfq_item_unit);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'units',
						value:rfq_item_unit
						});

						var rfq_quote_unit_price = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_quote_unit_price',
							line: i});
						log.debug("rfq_quote_unit_price", rfq_quote_unit_price);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'rate',
						value:rfq_quote_unit_price
						});

						var rfq_quote_amount = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_quote_amount',
							line: i});
						log.debug("rfq_quote_amount", rfq_quote_amount);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'amount',
						value:rfq_quote_amount
						});
						
						var rfq_department = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_department_id',
							line: i});
							
						log.debug("rfq_department", rfq_department);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'department',
						value:rfq_department
						});

						var rfq_class = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_class_id',
							line: i});
						log.debug("rfq_class", rfq_class);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'class',
						value:rfq_class
						});
						
						var rfq_location = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_location_id',
							line: i});
						log.debug("rfq_location", rfq_location);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'location',
						value:rfq_location
						});

						var rfq_project = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_project_id',
							line: i});
						log.debug("rfq_project", rfq_project);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'project',
						value:rfq_project
						});

						var item_delivery_date = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_delivery_date',
							line: i});
							
						if (item_delivery_date) {
							item_delivery_date = format.parse({value:item_delivery_date, type: format.Type.DATE});
							log.debug("item_delivery_date", item_delivery_date);
							PO.setCurrentSublistValue({
							sublistId:vsublistid,
							fieldId:'custcol_abj_del_date',
							value:item_delivery_date
							});
						}

						var delivery_addr = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_delivery_addrs',
							line: i});
						log.debug("delivery_addr", delivery_addr);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'custcol_abj_del_address',
						value:delivery_addr
						});

						PO.commitLine(vsublistid);

						line_idx++;
					}
					
					if (rfq_line_type=='Expense') {
						var vsublistid = 'expense';
						PO.selectNewLine({sublistId:vsublistid});
						
						log.debug("line_exp_idx", line_exp_idx);

						var exp_category = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_exp_cat',
							line: i});
						PO.setCurrentSublistValue({
						sublistId: vsublistid,
						fieldId: 'category',
						value: exp_category
						});
						
						var rfq_item_desc = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_description',
							line: i});
						log.debug("rfq_item_desc", rfq_item_desc);
						PO.setCurrentSublistValue({
						sublistId: vsublistid,
						fieldId: 'memo',
						value: rfq_item_desc
						});

						var rfq_item_account = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_account',
							line: i});
						log.debug("sublist_account", rfq_item_account);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'custrecord_abj_PO_item_account',
						value:rfq_item_account
						});

						var rfq_activity_code = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_activity_code_id',
							line: i});
						log.debug("rfq_activity_code", rfq_activity_code);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'cseg_paactivitycode',
						value:rfq_activity_code
						});

						var rfq_quote_amount = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_quote_amount',
							line: i});
						log.debug("rfq_quote_amount", rfq_quote_amount);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'amount',
						value:rfq_quote_amount
						});
						
						var rfq_department = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_department_id',
							line: i});
						log.debug("rfq_department", rfq_department);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'department',
						value:rfq_department
						});

						var rfq_class = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_class_id',
							line: i});
						log.debug("rfq_class", rfq_class);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'class',
						value:rfq_class
						});
						
						var rfq_location = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_location_id',
							line: i});
						log.debug("rfq_location", rfq_location);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'location',
						value:rfq_location
						});

						var rfq_project = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_project_id',
							line: i});
						log.debug("rfq_project", rfq_project);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'customer',
						value:rfq_project
						});

						var item_delivery_date = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_delivery_date',
							line: i});
						if (item_delivery_date) {	
							item_delivery_date = format.parse({value:item_delivery_date, type: format.Type.DATE});
							log.debug("item_delivery_date", item_delivery_date);
							PO.setCurrentSublistValue({
							sublistId:vsublistid,
							fieldId:'custcol_abj_del_date',
							value:item_delivery_date
							});
						}
						var delivery_addr = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_delivery_addrs',
							line: i});
						log.debug("delivery_addr", delivery_addr);
						PO.setCurrentSublistValue({
						sublistId:vsublistid,
						fieldId:'custcol_abj_del_address',
						value:delivery_addr
						});

						PO.commitLine(vsublistid);

						line_exp_idx++;
					}
					
					
					var next_Vendor = '';
					if (contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_awarded_vendor',
							line: i+1})) {
						next_Vendor = contextRequest.getSublistValue({
											group: 'sublist',
											name: 'sublist_awarded_vendor',
											line: i+1})
						log.debug("next_Vendor", next_Vendor);
					}

					var next_po_Type = '';
					if (contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_potype',
							line: i+1})) {
						next_po_Type = contextRequest.getSublistValue({
											group: 'sublist',
											name: 'sublist_potype',
											line: i+1})
						log.debug("next_po_Type", next_po_Type);
					}

					if ((vendor !== next_Vendor)||(po_type !== next_po_Type)) {
						
						var POId = PO.save({
							enableSourcing: true,
							ignoreMandatoryFields: true
						});
						
						log.debug("save POId", POId);
						
						var update_process_messages = update_rfq_with_PO_no(POId,listpoline,rfq_internal_id);
						if (update_process_messages) {
							var update_process_error = error.create({
								name: 'Update Rfq with PO no',
								message: update_process_messages,
								notifyOff: false
							});
							throw update_process_error;
						};
						if (text_for_PO_url) {
						  text_for_PO_url += '05';
						//} else {
						//  is_1st_row = true;	
						}
						success_create_count += 1;
						
						text_for_PO_url += POId +'%';
					}
					prev_vendor = vendor;
					prev_po_type = po_type;
				}
				catch(e) {
					var err_msg = 'failed to generate from Rfq #'+rfq_internal_id+' '+e.name + ': ' + e.message+'<br/>'; 
					log.debug("Error messages",err_msg);
					failed_count += 1;
					err_messages += '&nbsp;'+err_msg;
				}
            }
			text_for_PO_url = text_for_PO_url.slice(0, -1) + '&';
			var html = '<html><body><h2>Process Result</h2>';
			var record_Text = 'PO';
			var companyInfo  = config.load({
				type: config.Type.COMPANY_INFORMATION
			});
			var appurl = companyInfo.getValue('appurl');

			if (success_create_count) {
				
				var POUrl = appurl+'/app/common/search/searchresults.nl?';
				POUrl += 'searchtype=Transaction&Transaction_INTERNALID='+ text_for_PO_url +'style=';
				POUrl += 'NORMAL&report=&grid=&dle=F&sortcol=Transction_ORDTYPE9_raw&sortdir=';
				POUrl += 'ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=OZPSoypCWPWkmYr97eSeDtACI98eq';
				POUrl += '7V4MlpoitBjmRXXlbxSf9CgMHIj-UttyrsAj7PTes_SS4u9_U32P8X9sM4WHlU2fLKKp4ug';
				POUrl += 'ONOVtvdGMX71-DoNsOE0xGbwZkO2L1bvxidV9MHZAkfJjga2Md9WyAas0DClPsMbdLjprKU%';
				POUrl += '3D&twbx=F&scrollid=734&searchid=734&refresh=&whence=';
				
				log.debug("POUrl", POUrl);
				
				html += '<h3>Succesfully created&nbsp;<a href="'+POUrl+'">'+success_create_count+'</a>&nbsp;'+record_Text+' record</h3>';
			}
			if (failed_count) {
				html += '<h3>Failed created '+failed_count+' '+record_Text+' record</h3>';
				html += '<h3>Error Messages:<br/> '+err_messages+'</h3>';
			}
			html += '<input type="button" value="OK" onclick="history.back()">';
			html += '</body></html>';
			
			context.response.write(html);
			var scriptObj = runtime.getCurrentScript();
			log.debug({
			title: "Remaining usage units: ",
			details: scriptObj.getRemainingUsage()
			});
        }
    }
    return {
        onRequest: onRequest
    }

})