/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/encode","N/url","N/redirect","N/xml","N/file"
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    encode,
    url,
    redirect,
    xml,
    file
){
    
    function onRequest(context) {
        var form = serverWidget.createForm({
            title: "Form A1",
        });
        if (context.request.method === 'GET') {
            var yearName = form.addField({
                id: 'custpage_pph_select_year',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Tahun',
            });
            yearName.addSelectOption({
                value: '',
                text: ''
            });
            for (var year = 2020; year <= 2030; year++) {
                yearName.addSelectOption({
                    value: year.toString(),
                    text: year.toString()
                });
            }
            yearName.isMandatory = true;
            form.addSubmitButton({
                label: 'Search'
            });
            context.response.writePage(form);
        }else if (context.request.method === 'POST') {
            try{
                var tahun = context.request.parameters.custpage_pph_select_year;
                var currentRecord = createSublist("custpage_sublist_employe_list", form);
    
                var searchRemu = search.create({
                    type : 'customrecord_remunasi',
                    filters : ["custrecord_abj_msa_status_karyawan","anyof","2"],
                    columns : ['custrecord3', 'custrecord_abj_msa_noid']
                });
                var searchRemuSet = searchRemu.runPaged().count;
                var i = 0;
                var url = 'https://9342705.app.netsuite.com/app/site/hosting/scriptlet.nl?script=663&deploy=1'
                searchRemu.run().each(function(result){
                    var employId = result.getValue({
                        name : 'custrecord3'
                    });
                    var kode = result.getValue({
                        name : 'custrecord_abj_msa_noid'
                    }) || ' ';
                    var employee = result.getText({
                        name : 'custrecord3'
                    });
                    employId = employId.toString();
                    var urlSet = url + '&employId=' + employId + '&tahun=' + tahun;
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_employe_list",
                        id: "custpage_sublist_employeeid",
                        value: kode,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_employe_list",
                        id: "custpage_sublist_bulan",
                        value: 'Desember',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_employe_list",
                        id: "custpage_sublist_employee",
                        value: employee,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_employe_list",
                        id: "custpage_sublist_actiod",
                        value: "<a href='" + urlSet + "' target='_blank'>Download Form A1</a>",
                        line: i,
                    });
                    
                    i++;
                    return true;
                })
                context.response.writePage(form);
            }catch(e){
                log.debug('error', e)
            }
            
        }
        
    }
    function createSublist(sublistname, form) {
        var sublist = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Item List",
        });
        sublist.addField({
            id: "custpage_sublist_employeeid",
            label: "NIK / No Id",
            type: serverWidget.FieldType.TEXT,
        });
        sublist.addField({
            id: "custpage_sublist_bulan",
            label: "Bulan",
            type: serverWidget.FieldType.TEXT,
        });
        sublist.addField({
            id: "custpage_sublist_employee",
            label: "Nama Personalia",
            type: serverWidget.FieldType.TEXT,
        });
        sublist.addField({
            id: "custpage_sublist_actiod",
            label: "Action",
            type: serverWidget.FieldType.TEXT,
        });
        return sublist;
    }
    return {
        onRequest: onRequest
    };
});