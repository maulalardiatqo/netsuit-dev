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
 * @Script Name   :  - SSCC | RL | Account POST
 * @script File   :  abj_rl_get_account_format.js
 * @Trigger Type  :  Integration  POST
 * @Release Date  :  Jan 8, 2025
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  <same as script description>
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
    * GET method - Used to retrieve information about a specific record.
    * For this example, it retrieves a sales order by its internal ID.
    *
    * @param {Object} requestParams - An object containing the URL parameters.
    * e.g., /app/site/hosting/restlet.nl?script=xxx&deploy=xxx&id=123
    * @returns {Object} - A JSON object representing the sales order data.
    * @since 2015.2
    */
    function get(requestParams) {
        try{
           
        }catch(ex){
            log.error("get: "+ex.name, ex.message);
        }            
    };

    /**
     * POST method - Used to create a new record.
     * For this example, it creates a new sales order.
     *
     * @param {Object} requestBody - A JSON object from the request body.
     * e.g., { "entity": "123", "items": [{"item": "456", "quantity": 10}]}
     * @returns {Object} - A JSON object with the new record's internal ID.
     * @since 2015.2
     */
    const getCustomerByExternalId = (externalId) => {
        let customerId = null;
        search.create({
            type: record.Type.CUSTOMER,
            filters: [['externalid', 'is', externalId]],
            columns: ['internalid']
        }).run().each(function(result) {
            customerId = result.id;
            return false; 
        });
        return customerId;
    };

    const parseDate = (dateString) => {
        if (!dateString) return null;
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return null; 
            return d; 
        } catch (e) {
            log.error('Date Parse Error', e.message);
            return null;
        }
    };
    function post(requestBody) {
        try{
            log.debug({ title: 'Incoming Payload', details: requestBody });

            // 2. Validation: Check Mandatory Fields
            if (!requestBody) {
                throw error.create({ name: 'MISSING_PAYLOAD', message: 'No JSON body provided.' });
            }
            if (!requestBody.reference_id) {
                throw error.create({ name: 'MISSING_REF_ID', message: 'reference_id (External ID) is required.' });
            }
            if (!requestBody.store_name) {
                throw error.create({ name: 'MISSING_STORE_NAME', message: 'store_name is required for Company Name.' });
            }
            let rec;
            const existingCustomerId = getCustomerByExternalId(requestBody.reference_id);

            if (existingCustomerId) {
                log.audit('Action', `Updating existing Customer ID: ${existingCustomerId}`);
                rec = record.load({
                    type: record.Type.CUSTOMER,
                    id: existingCustomerId,
                    isDynamic: true
                });
            } else {
                log.audit('Action', 'Creating new Customer');
                rec = record.create({
                    type: record.Type.CUSTOMER,
                    isDynamic: true
                });
                rec.setValue({ fieldId: 'externalid', value: requestBody.reference_id });
            }
            rec.setValue({ fieldId: 'companyname', value: requestBody.store_name });
            if (requestBody.first_name) {
                rec.setValue({ fieldId: 'custentity_abj_entity_ow_fname', value: requestBody.first_name });
            }
            if (requestBody.last_name) {
                rec.setValue({ fieldId: 'custentity_abj_entity_ow_lname', value: requestBody.last_name });
            }
            if (requestBody.format) {
                rec.setValue({ fieldId: 'custentity_abj_format', value: requestBody.format });
            }
            if (requestBody.lead_source) {
                rec.setValue({ fieldId: 'leadsource', value: requestBody.lead_source });
            }
            if (requestBody.address) {
                try {
                    rec.setValue({ fieldId: 'defaultaddress', value: requestBody.address });
                } catch (addrErr) {
                    rec.selectLine({ sublistId: 'addressbook', line: 0 });
                    rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
                    rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
                    let subRecord = rec.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
                    subRecord.setValue({ fieldId: 'addr1', value: requestBody.address });
                    
                    rec.commitLine({ sublistId: 'addressbook' });
                }
            }
            if (requestBody.contacts) {
                rec.setValue({ fieldId: 'custrecord_abj_cont_confirname', value: requestBody.contacts });
            }

            // MAPPING: client_id -> Customer Source
            // Di gambar kolom Field ID tertulis "Customer Source". Ini tidak valid (ada spasi).
            // Kemungkinan besar field ID-nya adalah 'custentity_customer_source' atau similar.
            // *ACTION REQUIRED*: Ganti 'custentity_customer_source' di bawah dengan ID asli di NetSuite Anda.
            if (requestBody.client_id) {
                // Cek apakah field ini ada di record sebelum set value untuk menghindari crash
                // rec.setValue({ fieldId: 'custentity_customer_source', value: requestBody.client_id }); 
                
                // Opsi alternatif: Simpan di memo jika ID belum diketahui
                // rec.setValue({ fieldId: 'comments', value: "Client ID: " + requestBody.client_id });
            }

            // MAPPING: data_privacy_agreement_at -> custentity_abj_datapriconsentdatemanual
            if (requestBody.data_privacy_agreement_at) {
                // Parsing tanggal. Asumsi format input "YYYY-MM-DD" atau ISO string
                let parsedDate = parseDate(requestBody.data_privacy_agreement_at);
                if (parsedDate) {
                    rec.setValue({ fieldId: 'custentity_abj_datapriconsentdatemanual', value: parsedDate });
                }
            }

            // 5. Save Record
            const recordId = rec.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit({ title: 'Success', details: `Customer ID ${recordId} processed.` });

            // Success Response
            return {
                status: 'SUCCESS',
                message: existingCustomerId ? 'Record Updated' : 'Record Created',
                internal_id: recordId,
                external_id: requestBody.reference_id
            };
        }catch(ex){
            log.error("post: "+ex.name, ex.message);
             return {
                status: 'FAILED',
                name: ex.name,
                message: ex.message,
                stack: ex.stack
            };
        }
    };

    /**
     * PUT method - Used to update an existing record.
     * For this example, it updates a sales order's memo field and adds a new item.
     *
     * @param {Object} requestBody - A JSON object from the request body.
     * e.g., { "id": "123", "memo": "Updated memo", "item": {"item": "789", "quantity": 5}}
     * @returns {Object} - A JSON object with the updated record's internal ID.
     * @since 2015.2
     */
    function put(requestBody) {
        try{

        }catch(ex){
            log.error("put: "+ex.name, ex.message);
        }
    };

    /**
     * DELETE method - Used to delete a record.
     * For this example, it deletes a sales order by its internal ID.
     *
     * @param {Object} requestParams - An object containing the URL parameters.
     * e.g., /app/site/hosting/restlet.nl?script=xxx&deploy=xxx&id=123
     * @returns {Object} - A success message.
     * @since 2015.2
     */
    function deleteRecord(requestParams) {
        try{

        }catch(ex){
            log.error("deleteRecord: "+ex.name, ex.message);
        }
    };

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteRecord
    };
});