/***************************************************************************************
 ** Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 ** A‑33‑01, Menara UOA Bangsar, 5 Jalan Bangsar Utama 1, Bangsar, 59000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia
 ** All Rights Reserved.
 ** This software is the confidential and proprietary information of ABJ Cloud Solutions. ("Confidential Information").
 ** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement you entered into with ABJ Cloud Solutions.                   
 ***************************************************************************************/

/*******************************************************************************
 * **Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 * @Client        :  Suy Sing
 * @Script Name   :  - SSCC | RL | Customer Integration
 * @script File   :  abj_rl_suy_sing_integration.js
 * @Trigger Type  :  HTTP Request
 * @Release Date  :  AUG 01, 2025
 * @Author        :  ABJ Developer
 * @Description   :  Restlet to Create and Retrieve Customer Data based on External Client Input.
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/format'], (record, search, format) => {

    /**
    * GET method - Used to retrieve information about a specific record.
    * Retrieves Customer data by reference_id (External ID).
    *
    * @param {Object} requestParams - An object containing the URL parameters.
    * e.g., /app/site/hosting/restlet.nl?script=xxx&deploy=xxx&reference_id=REF123
    * @returns {Object} - A JSON object representing the customer data.
    * @since 2015.2
    */
    function get(requestParams) {
        try {
            var response = {};
            
            // Validasi input
            if (!requestParams.reference_id && !requestParams.id) {
                throw { name: 'MISSING_REQ_PARAM', message: 'Please provide reference_id (External ID) or id (Internal ID)' };
            }

            // Setup Search
            var filters = [];
            if (requestParams.reference_id) {
                filters.push(['externalid', 'is', requestParams.reference_id]);
            } else if (requestParams.id) {
                filters.push(['internalid', 'is', requestParams.id]);
            }

            // Mapping output sesuai field yang diminta
            var customerSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: filters,
                columns: [
                    'internalid',
                    'externalid', // reference_id
                    'custentity_abj_entity_ow_fname', // first_name
                    'custentity_abj_entity_ow_lname', // last_name
                    'companyname', // store_name
                    'custentity_abj_format', // format
                    'leadsource', // lead_source
                    'defaultaddress', // address
                    'custentity_abj_datapriconsentdatemanual', // data_privacy_agreement_at
                    'custrecord_abj_cont_confirname' // contacts
                ]
            });

            var searchResult = customerSearch.run().getRange({ start: 0, end: 1 });

            if (searchResult.length > 0) {
                var res = searchResult[0];
                response = {
                    status: "success",
                    data: {
                        internal_id: res.getValue('internalid'),
                        reference_id: res.getValue('externalid'),
                        first_name: res.getValue('custentity_abj_entity_ow_fname'),
                        last_name: res.getValue('custentity_abj_entity_ow_lname'),
                        store_name: res.getValue('companyname'),
                        format: res.getText('custentity_abj_format'), // Mengambil Text karena ini List/Record
                        lead_source: res.getText('leadsource'),
                        address: res.getValue('defaultaddress'),
                        contacts: res.getValue('custrecord_abj_cont_confirname'),
                        data_privacy_agreement_at: res.getValue('custentity_abj_datapriconsentdatemanual')
                    }
                };
            } else {
                response = {
                    status: "error",
                    message: "Record not found"
                };
            }

            return response;

        } catch (ex) {
            log.error("get: " + ex.name, ex.message);
            return {
                status: "error",
                error_code: ex.name,
                message: ex.message
            };
        }
    };

    /**
     * POST method - Used to create a new record.
     * Creates a new Customer record based on field mapping.
     *
     * @param {Object} requestBody - A JSON object from the request body.
     * @returns {Object} - A JSON object with the new record's internal ID.
     * @since 2015.2
     */
    function post(requestBody) {
        try {
            log.debug('POST Request Body', requestBody);

            // Validasi Mandatory Fields (contoh sederhana)
            if (!requestBody.store_name || !requestBody.reference_id) {
                throw { name: 'MISSING_MANDATORY_FIELD', message: 'store_name and reference_id are required.' };
            }

            // Create Record: CUSTOMER
            var rec = record.create({
                type: record.Type.CUSTOMER,
                isDynamic: true
            });

            // --- 1. client_id (Customer Source) ---
            // Note: Gambar menyatakan "NOT PART OF CLIENT INPUT; SYSTEM TO INFER".
            // Logic: Anda harus menentukan logic infer di sini. Contoh hardcode atau lookup.
            // rec.setValue({ fieldId: 'custentity_customer_source', value: 'SOME_DEFAULT_VALUE' }); 
            
            // --- 2. reference_id -> externalid ---
            rec.setValue({
                fieldId: 'externalid',
                value: requestBody.reference_id
            });

            // --- 3. first_name -> custentity_abj_entity_ow_fname ---
            if (requestBody.first_name) {
                rec.setValue({
                    fieldId: 'custentity_abj_entity_ow_fname',
                    value: requestBody.first_name
                });
            }

            // --- 4. last_name -> custentity_abj_entity_ow_lname ---
            if (requestBody.last_name) {
                rec.setValue({
                    fieldId: 'custentity_abj_entity_ow_lname',
                    value: requestBody.last_name
                });
            }

            // --- 5. store_name -> companyname ---
            rec.setValue({
                fieldId: 'companyname',
                value: requestBody.store_name
            });

            // --- 6. format -> custentity_abj_format ---
            // Value: REF FORMATS MASTER (Asumsi input adalah Internal ID dari List Format)
            if (requestBody.format) {
                rec.setValue({
                    fieldId: 'custentity_abj_format',
                    value: requestBody.format
                });
            }

            // --- 7. lead_source -> leadsource ---
            // Value: REF LEAD SOURCE MASTER
            if (requestBody.lead_source) {
                rec.setValue({
                    fieldId: 'leadsource',
                    value: requestBody.lead_source
                });
            }

            // --- 8. contacts -> custrecord_abj_cont_confirname ---
            // Note: Field ID 'custrecord...' biasanya untuk Custom Record.
            // Pastikan field ini benar-benar ada di record Customer.
            if (requestBody.contacts) {
                rec.setValue({
                    fieldId: 'custrecord_abj_cont_confirname',
                    value: requestBody.contacts
                });
            }

            // --- 9. address -> defaultaddress ---
            // Note: 'defaultaddress' biasanya string block.
            // Jika ingin masuk ke sublist Address Book, logic-nya berbeda.
            if (requestBody.address) {
                rec.setValue({
                    fieldId: 'defaultaddress',
                    value: requestBody.address
                });
            }

            // --- 10. data_privacy_agreement_at -> custentity_abj_datapriconsentdatemanual ---
            if (requestBody.data_privacy_agreement_at) {
                // Parsing string date ke Object Date (Asumsi format YYYY-MM-DD atau ISO)
                var dateValue = new Date(requestBody.data_privacy_agreement_at);
                rec.setValue({
                    fieldId: 'custentity_abj_datapriconsentdatemanual',
                    value: dateValue
                });
            }

            // Save Record
            var newRecordId = rec.save();
            log.audit('Record Created', 'New Customer ID: ' + newRecordId);

            return {
                status: "success",
                internal_id: newRecordId,
                reference_id: requestBody.reference_id,
                message: "Customer created successfully"
            };

        } catch (ex) {
            log.error("post: " + ex.name, ex.message);
            return {
                status: "error",
                error_code: ex.name,
                message: ex.message
            };
        }
    };

    /**
     * PUT method - Used to update an existing record.
     */
    function put(requestBody) {
        try {
            // Logic Update bisa ditambahkan di sini jika diperlukan
            return { status: "success", message: "PUT method not implemented yet" };
        } catch (ex) {
            log.error("put: " + ex.name, ex.message);
        }
    };

    /**
     * DELETE method - Used to delete a record.
     */
    function deleteRecord(requestParams) {
        try {
             // Logic Delete bisa ditambahkan di sini jika diperlukan
             return { status: "success", message: "DELETE method not implemented yet" };
        } catch (ex) {
            log.error("deleteRecord: " + ex.name, ex.message);
        }
    };

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteRecord
    };
});