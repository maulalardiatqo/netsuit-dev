/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record'], function (serverWidget, search, record) {
    function onRequest(context) {
        var contextRequest = context.request;
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Proses Penggajian'
            });
            var TransferBank = form.addField({
                id: 'custpage_bank',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Bank Transfer'
            });
            TransferBank.addSelectOption({
                value: '',
                text: ''
            });
            TransferBank.addSelectOption({
                value: '1',
                text: 'Mandiri'
            });
            TransferBank.addSelectOption({
                value: '2',
                text: 'BCA'
            });
            var instant = form.addField({
                id: 'custpage_instant',
                type: serverWidget.FieldType.SELECT,
                label: 'Pembayaran Instant'
            });
            instant.addSelectOption({
                value: '',
                text: ''
            });
            instant.addSelectOption({
                value: 'Mandiri Cash Management',
                text: 'Mandiri Cash Management'
            });
            instant.addSelectOption({
                value: 'Flip',
                text: 'Flip'
            });
            form.addButton({
                id: "custpage_btn_download",
                label: "Download Rekap Bank Transfer",
                functionName: "download(" + TransferBank.id + ")",
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_download_rekap_gaji.js";
            form.addSubmitButton({
                label: 'Proses Gaji'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST'){
            var methodeTransfer1 = contextRequest.parameters.custpage_bank;
            var methodeTransfer2 = contextRequest.parameters.custpage_instant;

            var methodTransfer;
            if(methodeTransfer1){
                methodTransfer =  methodeTransfer1
            }else if(methodeTransfer2){
                methodTransfer =  methodeTransfer2
            }
            var customSearchId = 'customsearch_abj_siap_gaji';
            var allData = [];
            var mySearch = search.load({
                id: customSearchId
            });

            var searchResults = mySearch.runPaged().count;
            mySearch.run().each(function(row){
                var internalid = row.getValue({
                    name : 'id'
                })
                var employeeID = row.getValue({
                    name : 'custrecord_employee_gaji'
                });
                log.debug('employeeId', employeeID);
                allData.push({
                    internalid : internalid,
                    employeeID : employeeID
                })
                return true;
            })

            var successMessage = ''; 
            var failedMessage = ''; 
            var totalSuccessful = 0; 

            for (var i = 0; i < allData.length; i++) {
                var data = allData[i];
                log.debug('data', data);
                var internalid = data.internalid;
                var employeeID = data.employeeID;

                if(internalid){
                    log.debug('in internalId', internalid);
                    var recordGaji = record.load({
                        type : 'customrecord_gaji',
                        id : internalid,
                    });
                    log.debug('recordGaji', recordGaji);
                    recordGaji.setValue({
                        fieldId : 'custrecord_status_gaji',
                        value : 3,
                        ignoreFieldChange: true
                    });
                    recordGaji.setValue({
                        fieldId : 'custrecord_metode_transfer',
                        value : methodTransfer,
                        ignoreFieldChange: true
                    });
                    var saveRecord = recordGaji.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveRecord', saveRecord);

                    if (saveRecord) {
                        successMessage += 'Proses Gaji berhasil untuk karyawan dengan ID ' + employeeID + '<br>';
                        totalSuccessful++;
                    } else {
                        failedMessage += 'Proses Gaji gagal untuk karyawan dengan ID ' + employeeID + '<br>';
                    }
                }
            }
            var html = '<html><body><h2>Process Result</h2>';
            
            if (totalSuccessful > 0) {
                html += '<h3>Proses Gaji Berhasil untuk ' + totalSuccessful + ' karyawan:</h3>';
                html += '<h3>' + successMessage + '</h3>';
            }

            if (failedMessage) {
                html += '<h3>Failed Messages:</h3>';
                html += '<h3>Error Messages:<br/> ' + failedMessage + '</h3>';
            }
            
            html += '<input type="button" value="OK" onclick="history.back()">';
            html += '</body></html>';

            context.response.write(html);
        }
    }

    return {
        onRequest: onRequest
    };
});
