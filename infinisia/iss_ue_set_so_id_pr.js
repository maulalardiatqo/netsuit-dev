/**
    * @NApiVersion 2.1
    * @NScriptType UserEventScript
    * @NModuleScope SameAccount
    */
define(['N/ui/serverWidget', 'N/record', 'N/error', 'N/ui/message', 'N/search', 'N/format', 'N/runtime'],
    function (ui, record, error, message, search, format, runtime) {

        function beforeLoad(context) {
            
        }

        function beforeSubmit(context) {

        }

        function afterSubmit(context) {
            try {
                if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                    var rec = context.newRecord;
                    var recType = rec.type;
                    var rec_id = rec.getValue('id') || null;
                    log.debug('rec_id', rec_id);
                    log.debug('recType', recType);

                    var customForm = rec.getValue('customform')
                    if(customForm == 138){
                        var employee_id = rec.getValue('employee') || null;
                        log.debug('employee_id', employee_id);

                        var is_saleprep = false;

                        if (employee_id == null) {
                            var user_id = runtime.getCurrentUser().id || null;
                            log.debug('user_id', user_id);
                            var fieldLookUp = search.lookupFields({
                                type: search.Type.EMPLOYEE,
                                id: user_id,
                                columns: ['issalesrep']
                            });
                            log.debug('fieldLookUp', fieldLookUp);
                            is_saleprep = fieldLookUp.issalesrep;
                        } else {
                            var fieldLookUp = search.lookupFields({
                                type: search.Type.EMPLOYEE,
                                id: employee_id,
                                columns: ['issalesrep']
                            });
                            log.debug('fieldLookUp', fieldLookUp);
                            is_saleprep = fieldLookUp.issalesrep;
                        }

                        if (is_saleprep == true) {
                            var recNew = record.load({
                                type: recType,
                                id: rec_id,
                                isDynamic: true
                            });

                            var ada_error = false;
                            var line_count = rec.getLineCount('item');
                            for (var a = 0; a < line_count; a++) {
                                var so_number_text = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_abj_sales_order_number',
                                    line: a
                                }) || null;
                                var so_number = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_abj_no_so',
                                    line: a
                                }) || null;
                                var pesan_error = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_error_message',
                                    line: a
                                }) || null;
                                var tranid_so = null;
                                if (so_number != null) {
                                    var fieldLookUp = search.lookupFields({
                                        type: search.Type.SALES_ORDER,
                                        id: so_number,
                                        columns: ['tranid']
                                    });
                                    log.debug('fieldLookUp SO', fieldLookUp);
                                    tranid_so = fieldLookUp.tranid;
                                }
                                log.debug('tranid_so', tranid_so);
                                log.debug('so_number_text', so_number_text)
                                if (so_number_text != null && (so_number == null || so_number_text != tranid_so)) {
                                    var search_so_number = search.create({
                                        type: "salesorder",
                                        filters:
                                            [
                                                ["formulatext: {tranid}", "is", so_number_text],
                                                "AND",
                                                ["mainline", "is", "T"]
                                            ],
                                        columns:
                                            [
                                                search.createColumn({ name: "tranid", label: "Document Number" }),
                                                search.createColumn({ name: "entity", label: "Name" }),
                                                search.createColumn({ name: "trandate", label: "Date" }),
                                                search.createColumn({ name: "custbody_abj_sales_rep_fulfillment", label: "Sales Rep" })
                                            ]
                                    }).run().getRange(0, 1);
                                    log.debug('search_so_number', search_so_number);
                                    var id_so = null;
                                    var sales_rep = null;
                                    if (search_so_number.length > 0) {
                                        id_so = search_so_number[0].id || null;
                                        sales_rep = search_so_number[0].getValue({ name: "custbody_abj_sales_rep_fulfillment", label: "Sales Rep" }) || null;
                                    }
                                    log.debug('sales_rep', sales_rep);

                                    if (id_so != null) {
                                        recNew.selectLine({
                                            sublistId: 'item',
                                            line: a
                                        });
                                        recNew.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_abj_no_so',
                                            value: id_so,
                                            ignoreFieldChange: true
                                        });
                                        recNew.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_abj_sales_rep_line',
                                            value: sales_rep,
                                            ignoreFieldChange: true
                                        });
                                        recNew.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_error_message',
                                            value: '',
                                            ignoreFieldChange: true
                                        });
                                        recNew.commitLine({
                                            sublistId: 'item'
                                        });
                                    } else {

                                        recNew.selectLine({
                                            sublistId: 'item',
                                            line: a
                                        });
                                        recNew.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_error_message',
                                            value: 'Silahkan cek kembali apakah nomor SO yang dimasukkan sudah benar ?',
                                            ignoreFieldChange: true
                                        });
                                        recNew.commitLine({
                                            sublistId: 'item'
                                        });
                                        ada_error = true;
                                    }
                                } else {
                                    recNew.selectLine({
                                        sublistId: 'item',
                                        line: a
                                    });
                                    recNew.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_error_message',
                                        value: 'Sales Order Number Harus diisi ?',
                                        ignoreFieldChange: true
                                    });
                                    recNew.commitLine({
                                        sublistId: 'item'
                                    });
                                    ada_error = true;
                                }
                            }
                            if (ada_error == true) {

                                recNew.setValue({
                                    fieldId: 'custbody_abj_ada_error_line',
                                    value: true,
                                    ignoreFieldChange: true
                                });
                            } else {
                                recNew.setValue({
                                    fieldId: 'custbody_abj_ada_error_line',
                                    value: false,
                                    ignoreFieldChange: true
                                });
                            }
                            recNew.save();
                        }
                    } 
                    
                }
            } catch (error) {
                log.error({
                    title: 'custpage_so_set_sonumber',
                    details: error.message
                });
            }
        }

        return {
            //beforeLoad: beforeLoad,
            //beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    });
