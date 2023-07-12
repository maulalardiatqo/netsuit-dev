/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/url', 'N/runtime', 'N/currency','N/error','N/config'], 
	function (serverWidget, search, record, url, runtime, currency, error, config) {
    
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
                title: 'Requisitions to RFQ/Tender'
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

            requisitionField.isMandatory = true;

            var subsidiaryField = form.addField({
                id: 'custpage_subsidiary',
                label: 'SUBSIDIARY',
                type: serverWidget.FieldType.SELECT,
                source: 'subsidiary'
            });
            subsidiaryField.isMandatory = true;

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
                label: 'SUGGESTED VENDOR',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'sublist_suggest_vndr_text',
                label: 'SUGGESTED TEXT VENDOR',
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
                id: 'sublist_pr_memo',
                label: 'PR MEMO',
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
			var requisition = '';
			var listprline = [];
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
					name: 'sublist_pr_internalid',
					line: i});
					log.debug("requisition", requisition);
								
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
				}
				catch(e) {
					var err_msg = 'failed to generate from Requisition #'+requisition+' '+e.name + ': ' + e.message+'<br/>'; 
					log.debug("Error messages",err_msg);
				}
            }
			log.debug("listprline",listprline);
			listprline_str = JSON.stringify(listprline);
			var customform = 83;
			if (!is_rfq) 
				customform = 84;
			var link_url = url.resolveRecord({
				recordType: "customrecord_abj_rfq",
				isEditMode: true,
				params: {
					'PR_id': requisition,
					'PR_lines': listprline_str,
					'is_rfq': is_rfq,
					'cf': customform,
				}
			});
			context.response.write('<html><head><script>window.location="' + link_url + '"</script></head><body></body></html>');
			
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