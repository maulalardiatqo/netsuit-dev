/*******************************************************************************
 * @Client        :  HRDC
 * @Script Name   :  etris_rl_send_profile_registration.js
 * @script Record :  - ETRIS RL | Send Profile Registration
 * @Trigger Type  :  post
 * @Release Date  :  Jun 2nd 2022
 * @Author        :  Prasad Adari
 * @Description   :  
 * @Enhancement   : 
 * 
 * @NApiVersion 2.1
 * @NScriptType Restlet
 *
 ******************************************************************************/
 define(['N/record','N/runtime','N/format','N/search', 'N/file'], function(record, runtime, format, search, file) {

    function _get(context) {
        
    }

    function _post(context) {
        try{
            var scriptObj = runtime.getCurrentScript();
            let folderId = scriptObj.getParameter({name: 'custscript_etris_rl_folder_id'});
            let defaultAPAccount = scriptObj.getParameter({name: 'custscript_etris_rl_def_ap_account'});
            log.debug('defaultAPAccount', defaultAPAccount);
            log.debug('folderId', folderId);
            log.debug('Data', context);
            var _vendorId, _customerId;

            var etRisJsonRecObj = record.create({
                type: 'customrecord_sol_etris_json'
            });

            let _date = new Date();

            let fileId = file.create({
                name: "Profile_Registration_"+_date.getDate()+'-'+(_date.getMonth()+1)+'-'+_date.getFullYear()+'-'+_date.getTime(),
                fileType: file.Type.PLAINTEXT,
                contents: JSON.stringify(context),
                encoding: file.Encoding.UTF8,
                folder: folderId
            }).save();

            etRisJsonRecObj.setValue('custrecord_sol_etris_process', 1); //1. Profile Registration
            etRisJsonRecObj.setValue('custrecord_sol_etris_json', fileId);
            etRisJsonRecObj.setValue('custrecord_sol_etris_status', 'Request RECEIVED');
            var statusRecId = etRisJsonRecObj.save();

            var jsonData = {
                'custentity_sol_ertis_my_co_id'            : context.profile_service.profile.my_co_id,
                'custentity_sol_etris_ic_no'               : context.profile_service.profile.ic_number,
                'custentity_sol_etris_cus_address1'        : context.profile_service.profile.address1,
                'custentity_sol_etris_add_2'               : context.profile_service.profile.address2,
                'custentity_sol_etris_add_3'               : context.profile_service.profile.address3,
                'custentity_sol_etris_bank_account_number' : context.profile_service.profile.bank_account_number,
                //'custentity_sol_etris_bank_modified_date'  : context.profile_service.profile.bank_modified_on_date,
                'custentity_sol_etris_bank_name'           : context.profile_service.profile.bank_name,
                'custentity_sol_etris_cus_branch_swift_cd' : context.profile_service.profile.bank_swift_code,
                'custentity_sol_etris_cus_branch_'         : context.profile_service.profile.branch,
                'custentity_sol_cessation_date'            : context.profile_service.profile.cessation_date,
                'custentity_sol_etris_city'                : context.profile_service.profile.city,
                'custentity_sol_etris_con_per_desgn'       : context.profile_service.profile.contact_person_designation,
                'custentity_sol_etris_contact_per_email'   : context.profile_service.profile.contact_person_email,
                'custentity_sol_etris_contact_per_name'    : context.profile_service.profile.contact_person_name,
                'custentity_sol_etris_country'             : context.profile_service.profile.country,
                'custentity_sol_etris_cus_typ'             : context.profile_service.profile.customer_type,
                'custentity_sol_etris_cus_effective_date'  : context.profile_service.profile.effective_date,
                'custentity_sol_etris_email_add'           : context.profile_service.profile.email,
                'custentity_sol_etris_fax_no'              : context.profile_service.profile.fax_num,
                'custentity_sol_etris_liability_date'      : context.profile_service.profile.liability_date,
                'custentity_sol_etris_name'                : context.profile_service.profile.name,
                'custentity_sol_etris_cus_occupaction'     : context.profile_service.profile.occupation,
                'custentity_sol_etris_cus_payment_mode'    : context.profile_service.profile.payment_mode,
                'custentity_sol_etris_postal_code'         : context.profile_service.profile.postcode,
                'custentity_sol_etris_remarks'             : context.profile_service.profile.remarks,
                'custentity_sol_etris_cus_sector_'         : context.profile_service.profile.sector,
                'custentity_sol_etris_state'               : context.profile_service.profile.state,
                'custentity_sol_etris_status'              : context.profile_service.profile.status,
                'custentity_sol_etris_tel_no'              : context.profile_service.profile.tel_num,
                'custentity_sol_etris_sst_applicable'      : context.profile_service.profile['sst_registered'] == "YES",
                'custentity_sol_etris_sstnum'              : context.profile_service.profile['sst_reg_number']
            };
            log.debug("jsonData", JSON.stringify(jsonData));

            if(jsonData.custentity_sol_etris_cus_typ == 'EMPR' || jsonData.custentity_sol_etris_cus_typ == 'TP'){ //If customer type is EMPR or TP then we need to create both Customer and Vendor
                //Looking-up if the vendor or custom is exusted in the system with the same my_co_id
                var customerSearchObj = search.create({
                    type: search.Type.CUSTOMER,
                    filters: [
                        ['custentity_sol_ertis_my_co_id', 'is', jsonData.custentity_sol_ertis_my_co_id]
                    ],
                    columns: ['internalid']
                }).run().getRange(0,2);

                var vendorSearchObj = search.create({
                    type: search.Type.VENDOR,
                    filters: [
                        ['custentity_sol_ertis_my_co_id', 'is', jsonData.custentity_sol_ertis_my_co_id]
                    ],
                    columns: ['internalid']
                }).run().getRange(0,2);
                
                if(vendorSearchObj.length <= 0){
                    _vendorId = createVendorRecord(jsonData, defaultAPAccount);

                    if(_vendorId){
                        if(customerSearchObj.length <= 0){
                            _customerId = createCustomerRecord(jsonData, _vendorId);

                            if(_customerId){
                                record.submitFields({
                                    type: record.Type.VENDOR,
                                    id: _vendorId,
                                    values: {
                                        'custentity_sol_linked_customer' : _customerId
                                    }
                                });
                            }
                        }else{
                            updateCustomerRecord(jsonData, customerSearchObj[0].getValue('internalid'));
                        }
                    }
                }else{
                    updateVendorRecord(jsonData, vendorSearchObj[0].getValue('internalid'));
                }
            }else{ //customer type is Individual then we need to create Customer
                if(customerSearchObj.length <= 0){
                    _customerId = createCustomerRecord(jsonData);
                }else{
                    updateCustomerRecord(jsonData, customerSearchObj[0].getValue('internalid'));
                }
            }

            let _statusDetails = 'Vendor ID: '+(_vendorId ? _vendorId : "Error")+', Customer ID: '+(_customerId ? _customerId : "Error");

            record.submitFields({
                type: 'customrecord_sol_etris_json',
                id: statusRecId,
                values: {
                    'custrecord_sol_etris_vendor': (_vendorId ? _vendorId : ''),
                    'custrecord_sol_etris_customer': (_customerId ? _customerId : ''),
                    'custrecord_sol_etris_status' : 'SUCCESS',
                    'custrecord_sol_etris_status_details' : _statusDetails
                }
            });
            
            return JSON.stringify({
                "success": {
                    "message": "Data has been received by NetSuite"
                }
             });
             
        }catch(ex){
            log.error(ex.name,ex);

            let _statusDetails = 'Vendor ID: '+(_vendorId ? _vendorId : "Error")+', Customer ID: '+(_customerId ? _customerId : "Error");

            record.submitFields({
                type: 'customrecord_sol_etris_json',
                id: statusRecId,
                values: {
                    'custrecord_sol_etris_status' : 'FAIL',
                    'custrecord_sol_etris_status_details' : _statusDetails + "("+ ex.name +")"
                }
            });

            /*return JSON.stringify({
                "error": {
                    "code": ex.name,
                    "message": "There was some error while processing the data"
                }
             });*/
             return JSON.stringify({
                "success": {
                    "message": "Data has been received by NetSuite"
                }
             });
        }
    }

    function _put(context) {
        
    }

    function _delete(context) {
        
    }


    function createVendorRecord(jsonData, defaultAPAccount){
        let vendorRecObj = record.create({
            type: record.Type.VENDOR
        });

        vendorRecObj.setValue('companyname', jsonData.custentity_sol_etris_name);
        vendorRecObj.setValue('custentity_sol_ven_cmpny_reg_no', jsonData.custentity_sol_ertis_my_co_id);
        vendorRecObj.setValue('payablesaccount', defaultAPAccount);
        vendorRecObj.setValue('currency', 1); //Always MYR

        Object.keys(jsonData).forEach(key=>{
            let data = jsonData[key];
            if(data && data != null && data != ''){
                if(key == 'custentity_sol_etris_bank_modified_date' || key == 'custentity_sol_cessation_date' || key == 'custentity_sol_etris_cus_effective_date' || key == 'custentity_sol_etris_liability_date'){
                    let _date = data.split('-');
                    let parseDate = format.parse({
                        //value: data.replaceAll('-', '/'),
                        value: _date[2]+"/"+_date[1]+"/"+_date[0],
                        type: format.Type.DATE
                    });

                    vendorRecObj.setValue({
                        fieldId:key,
                        value:parseDate
                    });
                }else{
                    vendorRecObj.setValue({
                        fieldId:key,
                        value:data
                    });
                }  
            }
        });

        let recId = vendorRecObj.save({
            ignoreMandatoryFields: true,
            enableSourcing: false
        });
        log.debug("VENDOR recId", recId);

        return recId;
    }

    function createCustomerRecord(jsonData, linkedVendor){
        let customerRecObj = record.create({
            type: record.Type.CUSTOMER
        });

        customerRecObj.setValue('customform', 106);
        customerRecObj.setValue('companyname', jsonData.custentity_sol_etris_name);
        customerRecObj.setValue('custentity_sol_ven_cmpny_reg_no', jsonData.custentity_sol_ertis_my_co_id);
        customerRecObj.setValue('custentity_sol_linked_vendor', linkedVendor);

        Object.keys(jsonData).forEach(key=>{
            let data = jsonData[key];
            if(data){
                if(key == 'custentity_sol_etris_bank_modified_date' || key == 'custentity_sol_cessation_date' || key == 'custentity_sol_etris_cus_effective_date' || key == 'custentity_sol_etris_liability_date'){
                    let _date = data.split('-');
                    let parseDate = format.parse({
                        //value: data.replaceAll('-', '/'),
                        value: _date[2]+"/"+_date[1]+"/"+_date[0],
                        type: format.Type.DATE
                    });

                    customerRecObj.setValue({
                        fieldId:key,
                        value:parseDate
                    });
                }else{
                    customerRecObj.setValue({
                        fieldId:key,
                        value:data
                    });
                }
            }
        });

        let recId = customerRecObj.save({
            ignoreMandatoryFields: true,
            enableSourcing: false
        });
        log.debug("CUSTOMER recId", recId);

        return recId;
    }

    function updateVendorRecord(jsonData, vendId){
        let vendorRecObj = record.load({
            type: record.Type.VENDOR,
            id: vendId
        });

        Object.keys(jsonData).forEach(key=>{
            let data = jsonData[key];
            if(data && data != null && data != ''){
                if(key == 'custentity_sol_etris_bank_modified_date' || key == 'custentity_sol_cessation_date' || key == 'custentity_sol_etris_cus_effective_date' || key == 'custentity_sol_etris_liability_date'){
                    let _date = data.split('-');
                    let parseDate = format.parse({
                        //value: data.replaceAll('-', '/'),
                        value: _date[2]+"/"+_date[1]+"/"+_date[0],
                        type: format.Type.DATE
                    });

                    vendorRecObj.setValue({
                        fieldId:key,
                        value:parseDate
                    });
                }else{
                    vendorRecObj.setValue({
                        fieldId:key,
                        value:data
                    });
                }  
            }
        });

        let recId = vendorRecObj.save({
            ignoreMandatoryFields: true,
            enableSourcing: false
        });
        log.debug("VENDOR Updated Successfully", recId);
    }

    function updateCustomerRecord(jsonData, vendId){
        let customerRecObj = record.load({
            type: record.Type.CUSTOMER,
            id: vendId
        });

        Object.keys(jsonData).forEach(key=>{
            let data = jsonData[key];
            if(data){
                if(key == 'custentity_sol_etris_bank_modified_date' || key == 'custentity_sol_cessation_date' || key == 'custentity_sol_etris_cus_effective_date' || key == 'custentity_sol_etris_liability_date'){
                    let _date = data.split('-');
                    let parseDate = format.parse({
                        //value: data.replaceAll('-', '/'),
                        value: _date[2]+"/"+_date[1]+"/"+_date[0],
                        type: format.Type.DATE
                    });

                    customerRecObj.setValue({
                        fieldId:key,
                        value:parseDate
                    });
                }else{
                    customerRecObj.setValue({
                        fieldId:key,
                        value:data
                    });
                }
            }
        });

        let recId = customerRecObj.save({
            ignoreMandatoryFields: true,
            enableSourcing: false
        });
        log.debug("CUSTOMER has been updated successfully", recId);
    }

    return {
        // get: _get,
        post: _post,
        // put: _put,
        // delete: _delete
    }
});