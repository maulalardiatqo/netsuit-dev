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
 * @Script Name   :  SSCC | RL | Account Contacts Integration
 * @script File   :  abj_rl_account_contacts.js
 * @Trigger Type  :  External Request
 * @Release Date  :  JAN 20, 2026
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  Restlet to handle creation (POST) and retrieval (GET) of Account Contacts custom records.
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/format', 'N/error'], (record, search, format, error) => {
    const CONFIG = {
        REC_TYPE: 'customrecord_abj_cont',
        FIELDS: {
            FIRST_NAME: 'custrecord_abj_cont_confirname',
            LAST_NAME: 'custrecord_abj_cont_contlasname',
            ROLE: 'custrecord_abj_cont_role',
            CONTACT_TYPE: 'custrecord_abj_cont_contacttype',
            CONTACT_NUM: 'custrecord_abj_cont_contnum',
            CUSTOMER_LINK: 'custrecord_abj_cont_leadcust',
            IS_INACTIVE: 'isinactive',
            LAST_MODIFIED: 'lastmodified', // Correct ID for Custom Record
            CONTACT_GROUP: 'custrecord_abj_cont_contactgrp'
        }
    };

    const sendResponse = (status, message, data = null) => {
        let response = {
            status: status,
            message: message
        };
        if (data) {
            response.data = data;
        }
        return response;
    };

    /**
     * GET method - Used to retrieve information about specific records.
     */
    function get(requestParams) {
        try {
            log.debug('GET Request', requestParams);

            let { start_date, end_date, account_id } = requestParams;
            
            // Inisialisasi Filter dengan Inactive = F
            let filterExpression = [
                [CONFIG.FIELDS.IS_INACTIVE, 'is', 'F']
            ];

            // 1. Filter Account ID
            if (account_id) {
                filterExpression.push('AND');
                filterExpression.push([CONFIG.FIELDS.CUSTOMER_LINK + '.entityid', 'is', account_id]);
            }

            // 2. Filter Date Logic
            if (start_date) {
                // Parse ke Object Date
                let sDate = format.parse({ value: start_date, type: format.Type.DATE });
                
                let eDate;
                if (end_date) {
                    eDate = format.parse({ value: end_date, type: format.Type.DATE });
                } else {
                    eDate = new Date();
                }

                if (eDate < sDate) {
                    return sendResponse('error', 'end_date cannot be earlier than start_date');
                }

                // SOLUSI: FORMAT TANGGAL SAJA, LALU GABUNG JAM SECARA MANUAL
                // Ini menghindari error format detik yang terjadi sebelumnya.
                
                // 1. Ambil String Tanggal (misal: "09/12/2025" atau "12/09/2025" sesuai sistem)
                let sDateString = format.format({ value: sDate, type: format.Type.DATE });
                let eDateString = format.format({ value: eDate, type: format.Type.DATE });

                // 2. Gabungkan dengan jam hardcode (Persis seperti yang berhasil Anda coba)
                // Start: Awal hari (12:00 am)
                // End: Akhir hari (11:59 pm)
                let finalStartString = sDateString + " 12:00 am";
                let finalEndString = eDateString + " 11:59 pm";

                filterExpression.push('AND');
                filterExpression.push([CONFIG.FIELDS.LAST_MODIFIED, 'within', finalStartString, finalEndString]);
            }

            log.debug('Final Filter Expression', JSON.stringify(filterExpression));

            let contactSearch = search.create({
                type: CONFIG.REC_TYPE,
                filters: filterExpression,
                columns: [
                    search.createColumn({ name: CONFIG.FIELDS.FIRST_NAME }),
                    search.createColumn({ name: CONFIG.FIELDS.LAST_NAME }),
                    search.createColumn({ name: CONFIG.FIELDS.ROLE }),
                    search.createColumn({ name: CONFIG.FIELDS.CONTACT_TYPE }),
                    search.createColumn({ name: CONFIG.FIELDS.CONTACT_NUM }),
                    search.createColumn({ name: CONFIG.FIELDS.IS_INACTIVE }),
                    search.createColumn({ name: CONFIG.FIELDS.CUSTOMER_LINK }),
                    search.createColumn({
                        name: 'entityid',
                        join: CONFIG.FIELDS.CUSTOMER_LINK
                    })
                ]
            });

            let resultData = [];
            contactSearch.run().each(function(result) {
                resultData.push({
                    first_name: result.getValue(CONFIG.FIELDS.FIRST_NAME),
                    last_name: result.getValue(CONFIG.FIELDS.LAST_NAME),
                    designation: result.getValue(CONFIG.FIELDS.ROLE),
                    type: result.getValue(CONFIG.FIELDS.CONTACT_TYPE),
                    contact: result.getValue(CONFIG.FIELDS.CONTACT_NUM),
                    account_id: result.getValue({ name: 'entityid', join: CONFIG.FIELDS.CUSTOMER_LINK }), 
                    status: result.getValue(CONFIG.FIELDS.IS_INACTIVE) ? 'Inactive' : 'Active'
                });
                return true;
            });

            return sendResponse('success', 'Data retrieved successfully', { data: resultData });

        } catch (ex) {
            log.error("get: " + ex.name, ex.message);
            return sendResponse('error', 'An unexpected error occurred: ' + ex.message);
        }
    };

    /**
     * POST method - Used to create a new record.
     * Creates a new Account Contact record based on and .
     *
     * @param {Object} requestBody
     * @returns {Object}
     */
    function post(requestBody) {
        try {
            log.debug('POST Request', requestBody);
            if (!requestBody.account_id || !requestBody.first_name || !requestBody.last_name) {
                return sendResponse('error', 'Missing mandatory fields: account_id, first_name, or last_name.');
            }
            let newRecord = record.create({
                type: CONFIG.REC_TYPE,
                isDynamic: true
            });
            newRecord.setValue({ fieldId: CONFIG.FIELDS.CUSTOMER_LINK, value: requestBody.account_id });
            newRecord.setValue({ fieldId: CONFIG.FIELDS.FIRST_NAME, value: requestBody.first_name });
            newRecord.setValue({ fieldId: CONFIG.FIELDS.LAST_NAME, value: requestBody.last_name });
            
            if (requestBody.designation) {
                newRecord.setValue({ fieldId: CONFIG.FIELDS.ROLE, value: requestBody.designation });
            }
            
            if (requestBody.type) {
                newRecord.setValue({ fieldId: CONFIG.FIELDS.CONTACT_TYPE, value: requestBody.type });
            }
            
            if (requestBody.contact) {
                newRecord.setValue({ fieldId: CONFIG.FIELDS.CONTACT_NUM, value: requestBody.contact });
            }
            if(requestBody.contact_group){
                
                 newRecord.setValue({ fieldId: CONFIG.FIELDS.CONTACT_GROUP, value: requestBody.contact_group });
            }
            let recordId = newRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit('Record Created', 'ID: ' + recordId);
            return sendResponse('success', 'Record created successfully');

        } catch (ex) {
            log.error("post: " + ex.name, ex.message);
            return sendResponse('error', 'Failed to create record: ' + ex.message);
        }
    };

    /**
     * PUT method - Placeholder
     */
    function put(requestBody) {
        try {
            return sendResponse('error', 'Method PUT not implemented.');
        } catch (ex) {
            log.error("put: " + ex.name, ex.message);
        }
    };

    /**
     * DELETE method - Placeholder
     */
    function deleteRecord(requestParams) {
        try {
            return sendResponse('error', 'Method DELETE not implemented.');
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