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
    function openEmployeeDetails(employeeId, year, empName, hireDate) {
        log.debug('employeeId', employeeId);
        // var url = urlSet + '?employeeId=' + encodeURIComponent(employeeId) + '&year=' + encodeURIComponent(year) + '&empName=' + encodeURIComponent(empName) + '&hiredate=' + encodeURIComponent(hireDate);
        // window.open(url, '_blank');
    }
    function onRequest(context) {
        var form = serverWidget.createForm({
            title: "PPh 21/26 Awal",
        });
        try{
            if (context.request.method === 'GET') {
                var sublist = form.addSublist({
                    id: "custpage_sublist_list_employee",
                    type: serverWidget.SublistType.LIST,
                    label: "List Employee",
                });
                sublist.addField({
                    id: "custpage_sublist_tahun",
                    label: "Tahun",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_id_employee",
                    label: "ID Employee",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_emp_name",
                    label: "Nama Karyawan",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_start",
                    label: "Tgl Mulai Kerja",
                    type: serverWidget.FieldType.TEXT,
                });
                sublist.addField({
                    id: "custpage_sublist_action",
                    label: "Aksi",
                    type: serverWidget.FieldType.TEXT,
                });
                var idsEmployee = [];
                var url = 'https://9342705.app.netsuite.com/app/site/hosting/scriptlet.nl?script=668&deploy=1'
                var searchRem = search.create({
                    type: "customrecord_remunasi",
                    filters:
                    [
                    ],
                    columns:
                    ["custrecord3"]
                });
                var searchRemset = searchRem.runPaged().count;
                if(searchRemset > 0){
                    searchRem.run().each(function(result){
                        var empId = result.getValue({
                            name : "custrecord3"
                        });
                        if(empId){
                            idsEmployee.push(empId);
                        }
                        return true
                    })
                }
                log.debug('idsEmp', idsEmployee);
                var searchEmploye = search.create({
                    type: "employee",
                    filters: [
                        ["internalid", "anyof", idsEmployee]
                    ],
                    columns:
                    ["internalid","hiredate", "entityid", "firstname", "lastname"]
                });
                var searchempset = searchEmploye.runPaged().count;
                if(searchempset > 0){
                    var i = 0
                    searchEmploye.run().each(function(result){
                        var internalId = result.getValue({
                            name : "internalid"
                        })
                        var fname = result.getValue({
                            name : "firstname"
                        });
                        var lName =  result.getValue({
                            name : "lastname"
                        }) || '';
                        var empName = fname + lName
                        var hireDate = result.getValue({
                            name : "hiredate"
                        });
                        var employeeID = result.getValue({
                            name : "entityid"
                        })
                        var thisDate = new Date();
                        var year = thisDate.getUTCFullYear();
                        var urlSet = url + '&employId=' + employeeID + '&tahun=' + year + '&empName=' + empName +  '&hireDate=' + hireDate + '&internalId=' + internalId ;
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_tahun",
                            value: year,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_id_employee",
                            value: employeeID,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_emp_name",
                            value: empName,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_start",
                            value: hireDate,
                            line: i,
                        });
                        sublist.setSublistValue({
                            sublistId: "custpage_sublist_list_employee",
                            id: "custpage_sublist_action",
                            value: "<a href='" + urlSet + "' target='_blank'>Lengapi/Edit Data</a>",
                            line: i,
                        });
    
                        i ++
                        return true
                    })
                }
                form.addSubmitButton({
                    label: 'Download PPh 21/26 Awal'
                });
                form.addButton({
                    id: "custpage_btn_download",
                    label: "Upload PPh 21/26 Awal",
                    functionName: "upload()",
                });
                form.clientScriptModulePath = 'SuiteScripts/abj_cs_pph21awal.js';
                context.response.writePage(form);
            }else{
    
            }
        }catch(e){
            log.debug('error', e);
        }
        
        
    }
    return {
        onRequest: onRequest
    };
});