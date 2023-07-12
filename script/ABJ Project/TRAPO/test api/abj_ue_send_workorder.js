/***************************************************************************************
 ** Copyright (c) 2020 ABJ Cloud Solutions, Inc.
 ** A1-13-2 Arcoris Business Suite, 10, Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur, Malaysia
 ** All Rights Reserved.
 ** This software is the confidential and proprietary information of ABJ Cloud Solutions. ("Confidential Information").
 ** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement you entered into with ABJ Cloud Solutions.
 ***************************************************************************************/

/*******************************************************************************
 * **Copyright (c) 2020 ABJ Cloud Solutions, Inc.
 * @Client        :  Trapo
 * @Script Name   :  abj_ue_send_workorder.js
 * @script Record :  - ABJ UE | Send Work Order
 * @Trigger Type  :  afterSubmit
 * @Release Date  :  18th Sept, 2021
 * @Author        :  Prasad Adari
 * @Description   :  This script will send the Work Order details to third party
 * @Enhancement   : <Enhancement description related to latest script version>
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 ******************************************************************************/
define(['N/https', 'N/record', 'N/search'], function(https, record, search) {

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type
   * @param {Form} scriptContext.form - Current form
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {

  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function beforeSubmit(scriptContext) {

  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function afterSubmit(context) {
    try {
      if (context.type == "create" || context.type == "edit") {
        let woRecObj = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id
        })
        let isSend = woRecObj.getValue('custbody_abj_istran_sendto_3rdparty');
        if (isSend) return;

        var so_id = woRecObj.getValue('createdfrom');

        var customer_address = search.lookupFields({
          type: search.Type.SALES_ORDER,
          id: so_id,
          columns: ['billaddress']
        }).billaddress;

        let woDetails = {
          ns_woid: woRecObj.getValue('tranid'),
          document_no: woRecObj.getValue('tranid'),
          date: woRecObj.getText('trandate'),
          location: woRecObj.getText('location'),
          // location_id: woRecObj.getValue('location'),
          subsidiary: woRecObj.getText('subsidiary'),
          // subsidiary_id: woRecObj.getValue('subsidiary'),
          quantity: woRecObj.getValue('quantity'),
          sales_order: woRecObj.getText('createdfrom') ? woRecObj.getText('createdfrom').split('#')[1] : '',
          // adress: customer_address || "",
          titem_sku: woRecObj.getText('assemblyitem') ? woRecObj.getText('assemblyitem').split(':').reverse()[0].trim() : ''
        }

        log.debug('woDetails', woDetails);

        let responseLogin = https.post({
          url: "https://trapoapi.antz.app/api/v1/Authenticate/GetToken?username=netsuite&password=netsuite_123",
          headers: {
            "Content-Type": "application/json",
          },
        });

        log.debug("response login", responseLogin);
        if (responseLogin.code == 200) {
          let dataLogin = JSON.parse(responseLogin.body);
          log.debug("data login", dataLogin);
          log.debug("data token", dataLogin.token);
          let response = https.post({
            url: 'https://trapoapi.antz.app/api/Receiving/RegisterReceiving?doctype=WO',
            body: woDetails,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${dataLogin.token}`,
            }
          });

          log.debug("response data", response);

          if (response.code == 200) {
            record.submitFields({
              type: record.Type.TRANSFER_ORDER,
              id: woRecObj.id,
              values: {
                'custbody_abj_istran_sendto_3rdparty': true
              },
              options: {
                enableSourcing: true,
                ignoreMandatoryFields: true
              }
            });
          }
        }
      }
    } catch (ex) {
      log.error(ex.name, ex);
    }
  }

  return {
    // beforeLoad: beforeLoad,
    // beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
  }
});