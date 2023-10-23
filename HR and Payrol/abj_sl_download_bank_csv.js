/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget", "N/config", "N/search", "N/record", "N/ui/message", "N/url", "N/redirect", "N/xml", "N/file", "N/encode", "N/currency", "N/runtime", "N/format"], function(serverWidget, config, search, record, message, url, redirect, xml, file, encode, currency, runtime, format) {
    function onRequest(context){
        try{
            var allIdSlip = JSON.parse(context.request.parameters.allIdSlip);
            var bankId = context.request.parameters.bankId
            log.debug('bankid', bankId);
            log.debug('allIdSlip', allIdSlip);
            if(typeof bankId === 'undefined' || bankId === null || bankId === ''){
                var html = `<html>
                    <h3>Please Select Bank!.</h3>
                    <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                    <body></body></html>`;
                    var form_result = serverWidget.createForm({
                        title: "Result Download Rekap Bank",
                    });
                    form_result.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: "No Bank Selected!",
                        message: html,
                    });
                    context.response.writePage(form_result);
            }else{
                if(allIdSlip.length<=0){
                    var html = `<html>
                    <h3>No Data for this selection!.</h3>
                    <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                    <body></body></html>`;
                    var form_result = serverWidget.createForm({
                        title: "Result Download Rekap Bank",
                    });
                    form_result.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: "No Data!",
                        message: html,
                    });
                    context.response.writePage(form_result);
                }else{
                    
                    var currentDate = new Date();
                    log.debug('currdate',currentDate);
        
                    var formattedDate = convertToYYYYMMDD(currentDate);
                    log.debug('format date', formattedDate);
        
                    var jumlahSlip = allIdSlip.length
                    log.debug('jumlahSlip', jumlahSlip);

                    var csvStr = "P,"+formattedDate+",1180012978465,"+jumlahSlip+",5745300\n";
        
                    allIdSlip.forEach((data)=>{
                        var idSlip = data.internlId
                        log.debug('idSlip', idSlip)
                        var searchSlip = search.create({
                            type: "customrecord_msa_slip_gaji",
                            columns : ['internalid', 'custrecord_abj_msa_employee_slip', 'custrecord_abj_msa_thp'],
                            filters: [{
                                name: 'internalid',
                                operator: 'is',
                                values: idSlip
                            }]
                        });
                        var searchSlipSet = searchSlip.run();
                        searchSlip = searchSlipSet.getRange({
                            start: 0,
                            end: 1
                        });
                        if(searchSlip.length>0){
                            var searchSlipRecord = searchSlip[0];
                            var employeeId = searchSlipRecord.getValue({
                                name : 'custrecord_abj_msa_employee_slip'
                            });
                            var thp = searchSlipRecord.getValue({
                                name : 'custrecord_abj_msa_thp'
                            })
                            log.debug('employeeId', employeeId);
                            var searchRemu = search.create({
                                type: "customrecord_remunasi",
                                columns : ['internalid', 'custrecord3', 'custrecord_bank_name', 'custrecord_employee_bank_name', 'custrecord_norek', 'custrecord_kacab'],
                                filters: [{
                                    name: 'custrecord3',
                                    operator: 'is',
                                    values: employeeId
                                }]
                            });
                            var searchRemuSet = searchRemu.run();
                            searchRemu = searchRemuSet.getRange({
                                start: 0,
                                end: 1
                            });
                            if(searchRemu.length>0){
                                var recRemu = searchRemu[0];
                                var bankName = recRemu.getText({
                                    name : 'custrecord_bank_name'
                                })
                                var noRek = recRemu.getValue({
                                    name : 'custrecord_norek'
                                })
                                var kanCab = recRemu.getValue({
                                    name : 'custrecord_kacab'
                                })
                            }
                            var searchListEmp = search.create({
                                type: "employee",
                                columns : ['internalid','email', 'entityid', 'firstname', 'lastname'],
                                filters: [{
                                    name: 'internalid',
                                    operator: 'is',
                                    values: employeeId
                                }]
                            })
                            var searchListEmpSet = searchListEmp.run();
                            searchListEmp = searchListEmpSet.getRange({
                                start: 0,
                                end: 1
                            });
                            if (searchListEmp.length > 0) {
                                var empRec = searchListEmp[0];
                                var email = empRec.getValue({
                                    name : 'email'
                                });
                                var empID = empRec.getValue({
                                    name : 'entityid'
                                });
                                var firstName = empRec.getValue({
                                    name : 'firstname'
                                });
                                var lastName = empRec.getValue({
                                    name : 'lastname'
                                })
                                var nameEmploye = firstName + ' ' +lastName 
                            }
                            csvStr += '"' + noRek + '",';
                            csvStr += '"' + nameEmploye + '",';
                            csvStr += ',';
                            csvStr += ',';
                            csvStr += ',';
                            csvStr += 'IDR,';
                            csvStr += '"' + thp + '",';
                            csvStr += 'Pembayaran Gaji,';
                            csvStr += '"' + empID + '",';
                            csvStr += 'IBU,';
                            csvStr += ',';
                            csvStr += '"' + bankName + '",';
                            csvStr += '"' + kanCab + '",';
                            csvStr += ',';
                            csvStr += ',';
                            csvStr += ',';
                            csvStr += 'Y,';
                            csvStr += '"' + email + '",';
                            csvStr += 'OUR,';
                            csvStr += '1,';
                            csvStr += 'E\n';
                            
                        }
                    })
                    
                    var bank;
                    if(bankId == '1'){
                        bank = 'Mandiri'
                    }else{
                        bank = 'BCA'
                    }
                    var objCsvFile = file.create({
                        name: "Rekap Bank Transfer"+ " " + bank + ".csv",
                        fileType: file.Type.CSV,
                        contents: csvStr,
                    });
    
                    context.response.writeFile({
                        file: objCsvFile,
                    });
                }
            }
            
           
        }catch(e){
            log.debug('error', e)
        }
        
    }
    function convertToYYYYMMDD(nsFormattedDate) {
        var year = nsFormattedDate.getFullYear().toString();
        var month = (nsFormattedDate.getMonth() + 1).toString().padStart(2, '0');
        var day = nsFormattedDate.getDate().toString().padStart(2, '0');
    
        var formattedDate = year + month + day;
    
        return formattedDate;
    }
    return {
        onRequest: onRequest
    };
});