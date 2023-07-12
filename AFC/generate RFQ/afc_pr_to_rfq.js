/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/url', 'N/runtime', 'N/currency','N/error'], 
	function (serverWidget, search, record, url, runtime, currency, error) {
    
	function onRequest(context) {
        var contextRequest = context.request;
		
		function update_pr_with_rfq_no(rfqId,pr_internal_id,listprlines) {
			try 
			{	
				var err_messages = '';
				var count = contextRequest.getLineCount({group: 'sublist'});
				pr_data_to_update = record.load({
								type : 'purchaserequisition',
								id : pr_internal_id,         
								isDynamic : true
				});
				log.debug("get listprline", listprline);
				for (var i in listprlines) {
					var listprline = listprlines[i];
					
					var pr_line_id = listprline.pr_line_id;
					log.debug("get pr_line_id", pr_line_id);
					
					var pr_item = listprline.pr_item;
					log.debug("get item", pr_item);

					var sublist_id = 'item';
					if (!pr_item) {
						sublist_id = 'expense';
					}
					var pr_line_to_update = pr_data_to_update.findSublistLineWithValue({
											sublistId: sublist_id,
											fieldId: 'line',
											value:pr_line_id
												});	
					log.debug("get pr_line_to_update", pr_line_to_update);
					pr_data_to_update.selectLine({
										sublistId: sublist_id,
										line: pr_line_to_update});
					pr_data_to_update.setCurrentSublistValue({
						sublistId: sublist_id,
						fieldId: 'custcolafc_pr_rfq_no',
						value: rfqId});				
					log.debug("set value rfq", rfqId);
					pr_data_to_update.commitLine(sublist_id);
					log.debug("commit line", sublist_id);
				}
				pr_data_to_update.save();
				log.debug("save rfq", rfqId);
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
                title: 'Generate RFQ/Tender From Requisitions'
            });
             var RfqTenderOptionfield = form.addField({
                id: 'custpage_rfq_tender',
                label: 'GENERATE',
                type: serverWidget.FieldType.SELECT
            });
			
			 RfqTenderOptionfield.addSelectOption({
                value: '1',
                text: 'RFQ'
            });

			RfqTenderOptionfield.addSelectOption({
                value: '0',
                text: 'TENDER'
            });

            var requisitionField = form.addField({
                id: 'custpage_requisition',
                label: 'REQUISITION #',
                type: serverWidget.FieldType.TEXT,
            });

            var subsidiaryField = form.addField({
                id: 'custpage_subsidiary',
                label: 'SUBSIDIARY',
                type: serverWidget.FieldType.SELECT,
                source: 'subsidiary'
            });

            subsidiaryField.isMandatory = true;

            // var vendorField = form.addField({
                // id: 'custpage_vendor',
                // label: 'VENDOR',
                // type: serverWidget.FieldType.SELECT,
                // source: 'vendor'
            // });

            var itemField = form.addField({
                id: 'custpage_item',
                label: 'ITEM',
                type: serverWidget.FieldType.SELECT,
                source: 'item'
            });

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

           var reqtypeField = form.addField({
                id: 'custpage_reqtype',
                label: 'REQUISITION TYPE',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist_abj_req_type'
            });

            var reqdatefrom = form.addField({
                id: 'custpage_reqdatefrom',
                label: 'REQUISITION DATE FROM',
                type: serverWidget.FieldType.DATE,
            });

            var reqdatefrom = form.addField({
                id: 'custpage_reqdateto',
                label: 'REQUISITION DATE TO',
                type: serverWidget.FieldType.DATE,
            });

            var estimatedtotalField = form.addField({
                id: 'custpage_estimatedtotal',
                label: 'ESTIMATED TOTAL',
                type: serverWidget.FieldType.CURRENCY
            });
            estimatedtotalField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE    /// disable
            });
            estimatedtotalField.defaultValue = 0.00;

            // Sublist Coloumn
            var sublist = form.addSublist({
                id: 'sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Requisition List'
            });
			
            // Ceckbox Sublist
            sublist.addField({
                id: 'sublist_select',
                label: 'Select',
                type: serverWidget.FieldType.CHECKBOX
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY	
            });

            sublist.addField({
                id: 'sublist_requisition',
                label: 'REQUISITION #',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_requisition_date',
                label: 'REQUISITION DATE',
                type: serverWidget.FieldType.DATE
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_requested_receipt_date',
                label: 'REQUESTED RECEIPT DATE',
                type: serverWidget.FieldType.DATE
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_type',
                label: 'REQUISITION TYPE',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_type_text',
                label: 'REQUISITION TYPE',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_item',
                label: 'ITEM',
                type: serverWidget.FieldType.SELECT,
                source: 'item'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_item_text',
                label: 'ITEM',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_expense_category',
                label: 'EXPENSE CATEGORY',
                type: serverWidget.FieldType.SELECT,
                source: 'expensecategory'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_expense_category_text',
                label: 'EXPENSE CATEGORY',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_unit',
                label: 'UOM',
                type: serverWidget.FieldType.SELECT,
				source: 'unitstype'
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
                id: 'sublist_quantity',
                label: 'QUANTITY',
                type: serverWidget.FieldType.FLOAT,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_description',
                label: 'DESCRIPTION',
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
                id: 'sublist_estimated_rate',
                label: 'ESTIMATED RATE',
                type: serverWidget.FieldType.CURRENCY,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_estimated_amount',
                label: 'ESTIMATED AMOUNT',
                type: serverWidget.FieldType.CURRENCY,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
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
                id: 'sublist_account',
                label: 'ACCOUNT',
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
                id: 'sublist_budget_year',
                label: 'BUDGET YEAR',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_budget_period',
                label: 'BUDGET PERIOD',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_budget_year_text',
                label: 'BUDGET YEAR',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_vendor_text',
                label: 'VENDOR',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_vendor',
                label: 'VENDOR',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_memo_line',
                label: 'MEMO (LINE)',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_pr_internalid',
                label: 'internal id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_pr_subsidiary',
                label: 'pr subsidiary',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_pr_requestor',
                label: 'pr requestor',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            sublist.addField({
                id: 'sublist_pr_line_id',
                label: 'pr line id',
                type: serverWidget.FieldType.INTEGER
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            form.addSubmitButton({
                label: 'Submit',
            });
			
			form.addResetButton({
				label : 'Clear'
			});
			
            form.clientScriptModulePath = 'SuiteScripts/afc_pr_to_rfq_cs.js';
            context.response.writePage(form);
        } else {

            var count = contextRequest.getLineCount({
                group: 'sublist'
            });
			log.debug("count", count);
			var rfq = null;
			var prev_requisition = '';
			var is_rfq = contextRequest.parameters.custpage_rfq_tender=='1';
			log.debug("is_rfq", is_rfq);
			var text_for_rfq_url = '';
			var success_create_count = 0;
			var failed_count = 0;
			var line_idx = 0;
			var line_exp_idx = 0;
			var err_messages = '';
			var requisition = '';
			var rfq_total = 0;
            for (var i = 0; i < count; i++) {
				try {
					var selectVal = contextRequest.getSublistValue({
                    group: 'sublist',
                    name: 'sublist_select',
                    line: i
					});
						
					log.debug({title: 'SELECT VAL',details: selectVal});
					
					requisition = contextRequest.getSublistValue({
					group: 'sublist',
					name: 'sublist_requisition',
					line: i});
					log.debug("requisition", requisition);
					
					//var requisitionDate = contextRequest.parameters.sublist_requisition_date;
					//var requestedReceiptDate = contextRequest.parameters.sublist_requested_receipt_date;
					
					if (requisition !== prev_requisition) {
						line_idx = 0;
						line_exp_idx = 0;
						var listprline = [];
						var listvendor_prline = [];
						rfq = record.create({
							type: 'customrecord_abj_rfq',
							isDynamic: true
						});
				
						var currentEmployee = runtime.getCurrentUser();
						log.debug("currentEmployee", currentEmployee.id);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_buyer',
							value: currentEmployee.id, 
							ignoreFieldChange: true
						});

						today = new Date();
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_date',
							value: today, 
							ignoreFieldChange: true
						});
					
						var pr_subsidiary = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_pr_subsidiary',
						line: i});
						log.debug("sublist_pr_subsidiary", pr_subsidiary);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_subsidiary',
							value: pr_subsidiary, 
							ignoreFieldChange: true
						});

						var pr_department = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_department_id',
						line: i});
						log.debug("sublist_department", pr_department);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_dept',
							value: pr_department, 
							ignoreFieldChange: true
						});
						
						var pr_location = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_location_id',
						line: i});
						log.debug("sublist_location", pr_location);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_location',
							value: pr_location, 
							ignoreFieldChange: true
						});

						var pr_class = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_class_id',
						line: i});
						log.debug("sublist_class", pr_class);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_class',
							value: pr_class, 
							ignoreFieldChange: true
						});

						var pr_type = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_type',
						line: i});
						log.debug("sublist_type", pr_type);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_type',
							value: pr_type, 
							ignoreFieldChange: true
						});

						var pr_Currency = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_currency_id',
						line: i});
						log.debug("sublist_currency", pr_Currency);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_currency',
							value: pr_Currency, 
							ignoreFieldChange: true
						});

						var pr_Curr_exchage_Rate = currency.exchangeRate({
						source: 'USD',
						target: pr_Currency});
						log.debug("pr_Curr_exchage_Rate", pr_Curr_exchage_Rate);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_exchg_rate',
							value: pr_Curr_exchage_Rate, 
							ignoreFieldChange: true
						});

						var rfq_status = 1; //rfq issued
						if (!is_rfq) {
							rfq_status = 10; //pending rfp approval
						}
						log.debug("rfq_status", rfq_status);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_status',
							value: rfq_status, 
							ignoreFieldChange: true
						});
						
						var pr_requestor = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_pr_requestor',
						line: i});
						log.debug("pr_requestor", pr_requestor);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_requestor',
							value: pr_requestor, 
							ignoreFieldChange: true
						});

						var budget_year = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_budget_year',
						line: i});
						log.debug("sublist_budget_year", budget_year);
						rfq.setValue({
							fieldId: 'custrecordabj_budyear_tran',
							value: budget_year, 
							ignoreFieldChange: true
						});

						var budget_period = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_budget_period',
						line: i});
						log.debug("sublist_budget_period", budget_period);
						rfq.setValue({
							fieldId: 'custrecord_abj_budperiod_tran',
							value: budget_period, 
							ignoreFieldChange: true
						});

						var rfq_customform = 83;//'custform_abj_std_rfq';
						if (!is_rfq) {
							rfq_customform = 84;//custform_abj_rfq_tender';
						}
						log.debug("rfq_customform", rfq_customform);
						rfq.setValue({
							fieldId: 'customform',
							value: rfq_customform, 
							ignoreFieldChange: true
						});
						
					}
				
					var pr_item = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_item',
						line: i});
					log.debug("sublist_item", pr_item);
					
					var pr_line_id = contextRequest.getSublistValue({
									group: 'sublist',
									name: 'sublist_pr_line_id',
									line: i});
					log.debug("get pr_line_id", pr_line_id);
					listprline.push({
								pr_line_id : pr_line_id,
								pr_item : pr_item,
								});
								
					var vendor_id = contextRequest.getSublistValue({
									group: 'sublist',
									name: 'sublist_vendor',
									line: i});
					log.debug("get vendor_id", vendor_id);

					if(listvendor_prline.length === 0){
						listvendor_prline.push({
								vendor_id : vendor_id,
						})
					}else{
						var ceklistvendor_prline=null;
						for (var index = 0; index < listvendor_prline.length; index++) {
							if (listvendor_prline[index].vendor_id === vendor_id) {
								ceklistvendor_prline = index;   
							}
						}
						if(ceklistvendor_prline == null){
							listvendor_prline.push({
								vendor_id : vendor_id,
							});
						}
					}

					if (pr_item) {
						rfq.selectNewLine({sublistId:'recmachcustrecord_abj_rfq_item_rfq'});
						log.debug("line_idx", line_idx);

						rfq.setCurrentSublistValue({
							
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_name',
						value:pr_item
						});
						
						var pr_item_desc = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_description',
							line: i});
						log.debug("sublist_description", pr_item_desc);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_desc',
						value:pr_item_desc
						});

						var pr_item_account = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_account',
							line: i});
						log.debug("sublist_account", pr_item_account);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_account',
						value:pr_item_account
						});

						var pr_activity_code = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_activity_code',
							line: i});
						log.debug("sublist_activity_code", pr_activity_code);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'cseg_paactivitycode',
						value:pr_activity_code
						});

						var pr_item_qty = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_quantity',
							line: i});
						log.debug("sublist_quantity", pr_item_qty);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_qty',
						value:pr_item_qty
						});

						var pr_item_unit = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_unit',
							line: i});
						log.debug("sublist_unit", pr_item_unit);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_units',
						value:pr_item_unit
						});

						var pr_item_estimated_rate = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_estimated_rate',
							line: i});
						log.debug("sublist_estimated_rate", pr_item_estimated_rate);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_est_unitprice',
						value:pr_item_estimated_rate
						});

						var pr_item_estimated_amnt = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_estimated_amount',
							line: i});
						log.debug("sublist_estimated_amount", pr_item_estimated_rate);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_est_amt',
						value:pr_item_estimated_amnt
						});
						rfq_total += Number(pr_item_estimated_amnt);
						
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_item_rfq',
						fieldId:'custrecord_abj_rfq_item_line',
						value:line_idx+1
						});

						rfq.commitLine('recmachcustrecord_abj_rfq_item_rfq');

						line_idx += 1;
					}
					
					
					var exp_item = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_expense_category',
						line: i});
					log.debug("sublist_expense_category", exp_item);
					
					if (exp_item||!pr_item) {
						rfq.selectNewLine({sublistId:'recmachcustrecord_abj_rfq_exp_rfq'});
						log.debug("line_exp_idx", line_exp_idx);

						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_exp_rfq',
						fieldId:'custrecord_abj_rfq_exp_cat',
						value:exp_item
						});
						
						var exp_item_desc = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_description',
							line: i});
						log.debug("sublist_description", exp_item_desc);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_exp_rfq',
						fieldId:'custrecord_abj_rfq_exp_desc',
						value:exp_item_desc
						});

						var exp_item_account = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_account',
							line: i});
						log.debug("sublist_account", exp_item_account);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_exp_rfq',
						fieldId:'custrecord_abj_rfq_exp_acct',
						value:exp_item_account
						});

						var exp_activity_code = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_activity_code',
							line: i});
						log.debug("sublist_activity_code", exp_activity_code);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_exp_rfq',
						fieldId:'cseg_paactivitycode',
						value:exp_activity_code
						});

						var exp_item_estimated_amnt = contextRequest.getSublistValue({
							group: 'sublist',
							name: 'sublist_estimated_amount',
							line: i});
						log.debug("sublist_estimated_amount", exp_item_estimated_amnt);
						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_exp_rfq',
						fieldId:'custrecord_abj_rfq_exp_est_amt',
						value:exp_item_estimated_amnt
						});

						rfq_total += Number(exp_item_estimated_amnt);

						rfq.setCurrentSublistValue({
						sublistId:'recmachcustrecord_abj_rfq_exp_rfq',
						fieldId:'custrecord_abj_rfq_exp_line',
						value:line_exp_idx+1
						});

						rfq.commitLine('recmachcustrecord_abj_rfq_exp_rfq');

						line_exp_idx += 1;
					}
					
					var next_requisition = '';
					if (contextRequest.getSublistValue({
					group: 'sublist',
					name: 'sublist_requisition',
					line: i+1})) {
						next_requisition = contextRequest.getSublistValue({
											group: 'sublist',
											name: 'sublist_requisition',
											line: i+1})
						log.debug("next_requisition", next_requisition);
					}

					if (requisition !== next_requisition) {
						log.debug("rfq_total", rfq_total);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_pr_total',
							value: rfq_total, 
							ignoreFieldChange: true
						});

						log.debug("listvendor_prline", listvendor_prline);
						for (var line_vndr_idx in listvendor_prline) {
							vendor_pr = listvendor_prline[line_vndr_idx];
							log.debug("vendor_pr", vendor_pr);
							rfq.selectNewLine({sublistId:'recmachcustrecord_abj_rfq_vdr_rfq'});
							
							rfq.setCurrentSublistValue({
							sublistId:'recmachcustrecord_abj_rfq_vdr_rfq',
							fieldId:'custrecord_abj_rfq_vdr',
							value:vendor_pr.vendor_id,
							});
							rfq.commitLine('recmachcustrecord_abj_rfq_vdr_rfq');
						}
						
						var pr_internal_id = contextRequest.getSublistValue({
						group: 'sublist',
						name: 'sublist_pr_internalid',
						line: i});
						log.debug("sublist_pr_internalid", pr_internal_id);
						rfq.setValue({
							fieldId: 'custrecord_abj_rfq_createdfrom',
							value: pr_internal_id, 
							ignoreFieldChange: true
						});

						var rfqId = rfq.save({
						 enableSourcing: true,
						ignoreMandatoryFields: true
						});
						
						log.debug("save rfqId", rfqId);
						
						var update_process_messages = update_pr_with_rfq_no(rfqId,pr_internal_id,listprline);
						if (update_process_messages) {
							var update_process_error = error.create({
								name: 'Update PR with RFQ/Tender no',
								message: update_process_messages,
								notifyOff: false
							});
							throw update_process_error;
						};
						if (text_for_rfq_url) {
						  text_for_rfq_url += '05';
						//} else {
						//  is_1st_row = true;	
						}
						success_create_count += 1;
						
						text_for_rfq_url += rfqId +'%';
					}
					prev_requisition = requisition;
				}
				catch(e) {
					var err_msg = 'failed to generate from Requisition #'+requisition+' '+e.name + ': ' + e.message+'<br/>'; 
					log.debug("Error messages",err_msg);
					failed_count += 1;
					err_messages += '&nbsp;'+err_msg;
				}
            }
			text_for_rfq_url = text_for_rfq_url.slice(0, -1) + '&';
			var html = '<html><body><h2>Process Result</h2>';
			var record_Text = 'RFQ';
			if (!is_rfq) {
				record_Text = 'TENDER';
			}
			if (success_create_count) {
				rfqUrl = 'https://5252893-sb1.app.netsuite.com/app/common/search/searchresults.nl?rectype=484&searchtype=';
				rfqUrl += 'Custom&Custom_INTERNALID='+ text_for_rfq_url +'style=NORMAL&report=&grid=&sortcol=';
				rfqUrl += 'Custom_INTERNALID_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=50';
				rfqUrl += '&_csrf=8SaBYdpUcmgVLGpIklAQMAJrgGCg_Fgld_cloCrkTQ4xUtzEydckvcJsemXNFvxKQE6UZPsSaMxEn5g0rQxPE12Z9y1RDjyEgsmvryF4';
				rfqUrl += 'aMJvveF0hnu1wkR4e7UtrEEgqNGPhaT8Dqyrob11_IFQoMbGJE_64aqJGxDu7c5UOlE%3D&twbx=F&scrollid=701&searchid=701&refresh=&whence=';
				log.debug("rfqUrl", rfqUrl);
				
				html += '<h3>Succesfully created&nbsp;<a href="'+rfqUrl+'">'+success_create_count+'</a>&nbsp;'+record_Text+' record</h3>';
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