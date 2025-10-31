/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/https', 'N/url', 'N/redirect', 'N/file', 'N/encode', 'N/search', 'N/record', 'N/runtime', 'N/format', 'N/task', 'N/query'],
    function (ui, https, url, redirect, file, encode, search, record, runtime, format, task, query) {

        function onRequest(context) {
            var form = ui.createForm({
                title: 'Print SPKB',
                hideNavBar: false
            });

            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });

            var fieldStartDate = form.addField({
                id: 'filter_start_date',
                type: ui.FieldType.DATE,
                label: 'Start Date',
                container: "filteroption"
            });
            var fieldEndDate = form.addField({
                id: 'filter_end_date',
                type: ui.FieldType.DATE,
                label: 'End Date',
                container: "filteroption"
            });
            var fieldLocation = form.addField({
                id: 'filter_location',
                type: ui.FieldType.SELECT,
                label: 'Location',
                source: 'location',
                container: "filteroption"
            });

            form.addSubmitButton('Search');
            context.response.writePage({
                pageObject: form
            });

            if (context.request.method == 'POST') {

                fieldStartDate.defaultValue = context.request.parameters.filter_start_date;
                fieldEndDate.defaultValue = context.request.parameters.filter_end_date;
                fieldLocation.defaultValue = context.request.parameters.filter_location;

                var start_date = context.request.parameters.filter_start_date || null;
                var end_date = context.request.parameters.filter_end_date || null;
                var id_location = context.request.parameters.filter_location || null;

                log.debug('parameter', 'start_date : ' + start_date + ' | end_date : ' + end_date + ' | id_location : ' + id_location);

                try {

                    var filter = [
                        ["mainline", "is", 'T'],
                        'and', ["createdfrom.type","anyof","SalesOrd"]
                    ];
                    if ((start_date) && (end_date)) {
                        filter.push('and', ['trandate', 'ONORAFTER', start_date], 'and', ['trandate', 'ONORBEFORE', end_date]);
                    }
                    else if((start_date) && (end_date == null)){
                        filter.push('and',['trandate', 'ONORAFTER', start_date], 'and', ['trandate', 'ONORBEFORE', start_date]);
                    }
                    else if((start_date == null) && (end_date)){
                        filter.push('and',['trandate', 'ONORAFTER', end_date], 'and', ['trandate', 'ONORBEFORE', end_date]);
                    }
                    if (id_location) {
                        filter.push('and', ['location', 'is', id_location]);
                    }

                    log.debug('filter : ', filter);

                    var searchFulfill = search.create({
                        type: "itemfulfillment",
                        filters: filter,
                        columns:
                            [
                                'tranid',
                                'createdfrom',
                                'trandate',
                                'location',
                                'entity'
                            ]
                    }).run().getRange(0, 1000);
                    log.debug('searchFulfill : ', searchFulfill.length);

                    var sublist = form.addSublist({ id: 'custpage_trans_sublist', type: ui.SublistType.LIST, label: 'List Item Fulfillment : ' + searchFulfill.length, tab: "matchedtab" });
                    sublist.addField({ id: 'custpage_check_fulfill', type: ui.FieldType.CHECKBOX, label: 'No.' }).updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });
                    sublist.addField({ id: 'custpage_id_fulfill', type: ui.FieldType.TEXT, label: 'SO NUMBER' }).updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                    sublist.addField({ id: 'custpage_so_number', type: ui.FieldType.TEXT, label: 'SO NUMBER' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
                    sublist.addField({ id: 'custpage_entity', type: ui.FieldType.TEXT, label: 'CUSTOMER' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
                    sublist.addField({ id: 'custpage_doc_number', type: ui.FieldType.TEXT, label: 'DOCUMENT NUMBER' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
                    sublist.addField({ id: 'custpage_trandate', type: ui.FieldType.TEXT, label: 'DATE' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
                    sublist.addField({ id: 'custpage_location_name', type: ui.FieldType.TEXT, label: 'Location' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

                    var list_fulfill = [];
                    if (searchFulfill.length > 0) {
                        for (var a = 0; a < searchFulfill.length; a++) {
                            var id_fulfill = searchFulfill[a].id || 0;
                            var tranid = searchFulfill[a].getValue('tranid') || null;
                            var createdfrom_text = searchFulfill[a].getText('createdfrom') || null;
                            var trandate = searchFulfill[a].getValue('trandate') || null;
                            var location_name = searchFulfill[a].getText('location') || null;
                            var cust_name = searchFulfill[a].getText('entity') || null;

                            if (id_fulfill > 0) {
                                sublist.setSublistValue({ id: 'custpage_id_fulfill', line: a, value: id_fulfill });
                            }
                            if (createdfrom_text != null || createdfrom_text != '') {
                                sublist.setSublistValue({ id: 'custpage_so_number', line: a, value: createdfrom_text });
                            }
                            if (tranid != null || tranid != '') {
                                sublist.setSublistValue({ id: 'custpage_doc_number', line: a, value: tranid });
                            }
                            if (location_name != null || location_name != '') {
                                sublist.setSublistValue({ id: 'custpage_location_name', line: a, value: location_name });
                            }
                            if (trandate != null || trandate != '') {
                                sublist.setSublistValue({ id: 'custpage_trandate', line: a, value: trandate });
                            }
                            if (cust_name != null || cust_name != '') {
                                sublist.setSublistValue({ id: 'custpage_entity', line: a, value: cust_name });
                            }
                        }
                    }

                    form.addButton({
                        id: 'btn_print_pdf',
                        label: 'Print',
                        functionName: "PrintPDF()"
                    });
                }
                catch (e) {
                    if (e instanceof nlobjError) {
                        log.debug('error', e.getCode() + '\n' + e.getDetails());
                    } else {
                        log.debug('unexpected', e.toString());
                    }
                }

            }
            form.clientScriptModulePath = 'SuiteScripts/abj_cs_print_packing_slip.js';
            context.response.writePage(form);
        }

        return {
            onRequest: onRequest
        };
    });

function escapeCSV(val) {
    if (!val) return '';
    if (!(/[",\s]/).test(val)) return val;
    val = val.replace(/"/g, '""');
    return '"' + val + '"';
}

function addCommas(n) {
    var rx = /(\d+)(\d{3})/;
    return String(n).replace(/^\d+/, function (w) {
        while (rx.test(w)) {
            w = w.replace(rx, '$1,$2');
        }
        return w;
    });
}