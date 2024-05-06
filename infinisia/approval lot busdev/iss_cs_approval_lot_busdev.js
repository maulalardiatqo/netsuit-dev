/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/record', 'N/search', 'N/ui/message', 'N/runtime'], function (url, record, search, message, runtime) {
    function pageInit(context) {
    }

    function reloadpage() {
        location.reload();
    }

    function createBusdevPinjam(rec_id, user_id, sales_rep) {
        try {
            log.debug('function createBusdevPinjam', 'rec_id : '+rec_id+' | user_id : '+user_id+' | sales_rep : '+sales_rep);
            
            var invDetSearch = search.create({
                type: "inventorydetail",
                filters:
                    [
                        ["transaction.internalidnumber", "equalto", rec_id],
                        "AND",
                        ["inventorynumber.custitemnumber1", "anyof", user_id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "item",
                            sort: search.Sort.ASC,
                            label: "Item"
                        }),
                        search.createColumn({
                            name: "inventorynumber",
                            sort: search.Sort.ASC,
                            label: " Number"
                        }),
                        search.createColumn({ name: "binnumber", label: "Bin Number" }),
                        search.createColumn({ name: "status", label: "Status" }),
                        search.createColumn({ name: "quantity", label: "Quantity" }),
                        search.createColumn({
                            name: "quantityavailable",
                            join: "inventoryNumber",
                            label: "Available"
                        }),
                        search.createColumn({ name: "expirationdate", label: "Expiration Date" }),
                        search.createColumn({
                            name: "custitemnumber1",
                            join: "inventoryNumber",
                            label: "Sales Rep"
                        })
                    ]
            }).run().getRange(0, 1000);
            log.debug('invDetSearch : ' + invDetSearch.length, invDetSearch);
            if (invDetSearch.length > 0) {
                for (var a = 0; a < invDetSearch.length; a++) {
                    var qty_fulfill = invDetSearch[a].getValue({ name: "quantity", label: "Quantity" }) || 0;
                    var qty_sisa = invDetSearch[a].getValue({
                        name: "quantityavailable",
                        join: "inventoryNumber",
                        label: "Available"
                    }) || 0;
                    var id_lot = invDetSearch[a].getValue({
                        name: "inventorynumber",
                        sort: search.Sort.ASC,
                        label: " Number"
                    });
                    var id_item = invDetSearch[a].getValue({
                        name: "item",
                        sort: search.Sort.ASC,
                        label: "Item"
                    });
                    var quantity = invDetSearch[a].getValue({ name: "quantity", label: "Quantity" }) || 0;

                    var recPinjam = record.create({
                        type: 'customrecord_abj_busdev_pinjam',
                        isDynamic: true
                    });

                    recPinjam.setValue({
                        fieldId: 'custrecord_abj_busdevpinjam_lot',
                        value: id_lot,
                        ignoreFieldChange: true
                    });
                    recPinjam.setValue({
                        fieldId: 'custrecord_abj_busdevpinjam_if_no',
                        value: rec_id,
                        ignoreFieldChange: true
                    });
                    recPinjam.setValue({
                        fieldId: 'custrecord_abj_busdevpinjam_sales',
                        value: sales_rep,
                        ignoreFieldChange: true
                    });
                    recPinjam.setValue({
                        fieldId: 'custrecord_abj_busdevpinjam_salespinjam',
                        value: user_id,
                        ignoreFieldChange: true
                    });
                    recPinjam.setValue({
                        fieldId: 'custrecord_abj_busdevpinjam_qty',
                        value: quantity,
                        ignoreFieldChange: true
                    });
                    recPinjam.setValue({
                        fieldId: 'custrecord_abj_busdevpinjam_item',
                        value: id_item,
                        ignoreFieldChange: true
                    });

                    recPinjam.save();
                    log.debug('berhasil save', 'berhasil save');
                }
            }
        } catch (error) {
            log.error({
                title: 'custpage_cs_approval_lot_busdev, function createBusdevPinjam',
                details: error.message
            });
        }
    }

    function approve(idRec) {
        log.debug('client script', 'idRec : ' + idRec);

        var currentUser = runtime.getCurrentUser().id;
        log.debug('currentUser', currentUser);
        var user_id = parseInt(currentUser);
        log.debug('user_id', user_id);

        var fieldLookUp = search.lookupFields({
            type: search.Type.ITEM_FULFILLMENT,
            id: idRec,
            columns: [
                'custbody_abj_sales_approval',
                'custbody_abj_ada_error_line',
                'custbody_abj_pendingapprovalsales',
                'createdfrom',
                'custbody_abj_sales_rep_fulfillment'
            ]
        });
        log.debug('fieldLookUp', fieldLookUp);
        var so_id = fieldLookUp.createdfrom[0].value || 0;
        log.debug('so_id', so_id);
        var list_busdev_approve = fieldLookUp.custbody_abj_sales_approval || [];
        log.debug('list_busdev_approve : ' + list_busdev_approve.length, list_busdev_approve);
        var sales_rep_field = fieldLookUp.custbody_abj_sales_rep_fulfillment || [];
        var sales_rep = null;
        if(sales_rep_field.length > 0){
            sales_rep = sales_rep_field[0].value || null;
        }

        var busdev_approve = [];
        if (list_busdev_approve.length > 0) {
            for (var a = 0; a < list_busdev_approve.length; a++) {
                var id_busdev_pending = list_busdev_approve[a].value || 0;
                log.debug('id_busdev_pending', id_busdev_pending);
                var par_id_busdev_pending = parseInt(id_busdev_pending);
                log.debug('par_id_busdev_pending', par_id_busdev_pending);
                if (par_id_busdev_pending > 0) {
                    busdev_approve.push(par_id_busdev_pending);
                }
            }
            log.debug('busdev_approve lebih dari satu', busdev_approve);
            busdev_approve.push(user_id);
        } else if (list_busdev_approve.length == 0) {
            busdev_approve.push(user_id);
        }

        var list_busdev_pending = fieldLookUp.custbody_abj_pendingapprovalsales || [];
        log.debug('list_busdev_pending', list_busdev_pending.length);

        log.debug('busdev_approve', busdev_approve);
        if (busdev_approve.length > 0 && busdev_approve.length < list_busdev_pending.length) {
            log.debug('set busdev approval saja', 'set busdev approval saja');
            var submitField = record.submitFields({
                type: 'itemfulfillment',
                id: idRec,
                values: {
                    'custbody_abj_sales_approval': busdev_approve
                }
            });
            createBusdevPinjam(idRec, user_id, sales_rep);
            reloadpage();
        } else if (busdev_approve.length > 0 && busdev_approve.length == list_busdev_pending.length) {
            log.debug('approve terakhir', 'approve terakhir : '+busdev_approve.length);
            // var format_busdev_approved = format.format({
            //     value: busdev_approve,
            //     type: format.Type.MULTISELECT
            // });
            // log.debug('format_busdev_approved', format_busdev_approved);
            var submitField = record.submitFields({
                type: 'itemfulfillment',
                id: idRec,
                values: {
                    'custbody_abj_sales_approval': busdev_approve,
                    'custbody_abj_approved': true
                }
            });
            createBusdevPinjam(idRec, user_id, sales_rep);
            reloadpage();
        }
    }

    return {
        pageInit: pageInit,
        approve: approve
    };
});