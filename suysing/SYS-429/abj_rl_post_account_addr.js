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
 * @Script Name   :  SSCC | RL | Account Address Integration
 * @script File   :  abj_rl_account_address_int.js
 * @Trigger Type  :  External Request
 * @Release Date  :  JAN 21, 2026
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  Handles creation/retrieval of Customer Address Book entries.
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/format', 'N/error'], (record, search, format, error) => {
    const CONFIG = {
        FIELDS: {
            IS_MAIN: 'defaultbilling',        
            IS_DELIVERY: 'defaultshipping',
            ADDR1: 'addr1',                   
            ADDR2: 'addr2',                   
            COUNTRY: 'country',             
            IS_DEFAULT_DC: 'custrecord_abj_defaultdc', 
            PSGC: 'custrecord_abj_psgc',               
            ZIP_CODE: 'custrecord_abj_zipcode',  
            BARANGAY: 'custrecord_abj_brgy',           
            CITY: 'custrecord_abj_add_city_mun_submun', 
            LONGITUDE: 'custrecord_abj_logitude',      
            LATITUDE: 'custrecord_abj_latitude'        
        }
    };

    /**
     * Helper to format standard API response
     */
    const formatResponse = (status, message, data = null) => {
        const response = {
            status: status,
            message: message
        };
        if (data) response.data = data;
        return response;
    };

    /**
     * Helper to find Customer Internal ID from Entity ID (account_id)
     */
    const getCustomerInternalId = (entityId) => {
        if (!entityId) return null;
        const customerSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: [['internalid', 'is', entityId]],
            columns: ['internalid']
        });
        const result = customerSearch.run().getRange({ start: 0, end: 1 });
        return (result && result.length > 0) ? result[0].getValue('internalid') : null;
    };

    /**
     * GET method - Used to retrieve address information from Customer records.
     * Retrieves address lines from Customers based on filters.
     *
     * @param {Object} requestParams - { start_date, end_date, account_id }
     * @returns {Object} - JSON object representing address data.
     */
    function get(requestParams) {
        try {
            log.debug('GET Request', requestParams);
            const { start_date, end_date, account_id } = requestParams;
            const filters = [];
            if (account_id) {
                const customerId = getCustomerInternalId(account_id);
                if (customerId) {
                    filters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: customerId
                    }));
                } else {
                    return formatResponse('success', 'Customer not found.', []);
                }
            }
            if (start_date) {
                let startDateParsed = format.parse({ value: start_date, type: format.Type.DATE });
                let endDateParsed = end_date ? format.parse({ value: end_date, type: format.Type.DATE }) : new Date();

                const startStr = format.format({ value: startDateParsed, type: format.Type.DATETIME });
                const endStr = format.format({ value: endDateParsed, type: format.Type.DATETIME });

                filters.push(search.createFilter({
                    name: 'lastmodifieddate',
                    operator: search.Operator.WITHIN,
                    values: [startStr, endStr]
                }));
            } else {
                filters.push(search.createFilter({
                    name: 'isinactive',
                    operator: search.Operator.IS,
                    values: false
                }));
            }
            const searchObj = search.create({
                type: search.Type.CUSTOMER,
                filters: filters,
                columns: [
                    search.createColumn({ name: 'addressinternalid', join: 'Address' }),
                    search.createColumn({ name: 'isdefaultbilling', join: 'Address' }),
                    search.createColumn({ name: 'isdefaultshipping', join: 'Address' }),
                    search.createColumn({ name: CONFIG.FIELDS.IS_DEFAULT_DC, join: 'Address' }),
                    search.createColumn({ name: CONFIG.FIELDS.BARANGAY, join: 'Address' }),
                    search.createColumn({ name: CONFIG.FIELDS.CITY, join: 'Address' }),
                    search.createColumn({ name: CONFIG.FIELDS.ZIP_CODE, join: 'Address' }),
                    search.createColumn({ name: CONFIG.FIELDS.LONGITUDE, join: 'Address' }),
                    search.createColumn({ name: CONFIG.FIELDS.LATITUDE, join: 'Address' })
                ]
            });

            const data = [];
            searchObj.run().each(result => {
                const brgy = result.getValue({ name: CONFIG.FIELDS.BARANGAY, join: 'Address' }) || '';
                const city = result.getValue({ name: CONFIG.FIELDS.CITY, join: 'Address' }) || '';
                const prov = result.getValue({ name: CONFIG.FIELDS.ZIP_CODE, join: 'Address' }) || '';
                const fullAddress = `${brgy} ${city} ${prov}`.trim();

                data.push({
                    id: result.getValue({ name: 'addressinternalid', join: 'Address' }),
                    main: result.getValue({ name: 'isdefaultbilling', join: 'Address' }),
                    delivery: result.getValue({ name: 'isdefaultshipping', join: 'Address' }),
                    default: result.getValue({ name: CONFIG.FIELDS.IS_DEFAULT_DC, join: 'Address' }),
                    address: fullAddress,
                    longitude: result.getValue({ name: CONFIG.FIELDS.LONGITUDE, join: 'Address' }),
                    latitude: result.getValue({ name: CONFIG.FIELDS.LATITUDE, join: 'Address' }),
                    status: true 
                });
                return true;
            });

            return formatResponse('success', 'Data retrieved successfully', data);

        } catch (ex) {
            log.error("get: " + ex.name, ex.message);
            return formatResponse('error', ex.message);
        }
    };

    /**
     * POST method - Used to ADD a new address to the Customer's Address Book.
     * * @param {Object} requestBody - JSON object from the request body.
     * @returns {Object} - A JSON object with status.
     */
    function post(requestBody) {
        try {
            log.debug('POST Request', requestBody);

            if (!requestBody.account_id) {
                throw error.create({ name: 'MISSING_REQ_PARAM', message: 'account_id is required' });
            }

            const customerId = getCustomerInternalId(requestBody.account_id);
            if (!customerId) {
                return formatResponse('error', `Customer with ID ${requestBody.account_id} not found.`);
            }
            const custRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customerId,
                isDynamic: true
            });
            custRecord.selectNewLine({ sublistId: 'addressbook' });

            if (requestBody.main === true) {
                custRecord.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
            }
            if (requestBody.delivery === true) {
                custRecord.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
            }
            const addrSubrecord = custRecord.getCurrentSublistSubrecord({
                sublistId: 'addressbook',
                fieldId: 'addressbookaddress'
            });

            addrSubrecord.setValue({ fieldId: 'country', value: 'PH' }); 
            
            addrSubrecord.setValue({ fieldId: CONFIG.FIELDS.ADDR1, value: requestBody.street_name });
            addrSubrecord.setValue({ fieldId: CONFIG.FIELDS.ADDR2, value: requestBody.building_name });

            const setIfPresent = (fieldId, val) => {
                if (val !== undefined && val !== null && val !== "") {
                    addrSubrecord.setValue({ fieldId: fieldId, value: val });
                }
            };

            setIfPresent(CONFIG.FIELDS.IS_DEFAULT_DC, requestBody.default);
            setIfPresent(CONFIG.FIELDS.PSGC, requestBody.psgc_code);
            setIfPresent(CONFIG.FIELDS.ZIP_CODE, requestBody.zip_code);
            custRecord.commitLine({ sublistId: 'addressbook' });

            const id = custRecord.save();

            return formatResponse('success', 'Record created successfully. Customer updated.', { customer_id: id });

        } catch (ex) {
            log.error("post: " + ex.name, ex.message);
            return formatResponse('error', ex.message);
        }
    };

    /**
     * PUT method - Placeholder
     */
    function put(requestBody) {
        try {
            return formatResponse('error', 'PUT method not implemented yet.');
        } catch (ex) {
            log.error("put: " + ex.name, ex.message);
            return formatResponse('error', ex.message);
        }
    };

    /**
     * DELETE method - Placeholder
     */
    function deleteRecord(requestParams) {
        try {
            return formatResponse('error', 'DELETE method not implemented yet.');
        } catch (ex) {
            log.error("deleteRecord: " + ex.name, ex.message);
            return formatResponse('error', ex.message);
        }
    };

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteRecord
    };
});