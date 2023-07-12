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
 * @Script Name   :  abj_ue_vendorreturn_send.js
 * @script Record :  - ABJ UE | Send Vendor Return
 * @Trigger Type  :  afterSubmit
 * @Release Date  :  14th Sept, 2021
 * @Author        :  Sayyad Tajuddin
 * @Description   :  This script will send the Vendor Return details to third party
 * @Enhancement   : <Enhancement description related to latest script version>
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 ******************************************************************************/
define(['N/https', 'N/record'], function(https, record) {

  // function beforeLoad(context) {

  // }

  // function beforeSubmit(context) {

  // }

  function afterSubmit(context) {
    try {
      if (context.type == "create" || context.type == "edit") {
        let vraRec = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id
        });
        let isSend = vraRec.getValue('custbody_abj_istran_sendto_3rdparty');
        if (isSend) return;

        let items = [];
        let itemCount = vraRec.getLineCount('item');
        for (let i = 0; i < itemCount; i++) {
          let item_sku = vraRec.getSublistText({
            sublistId: 'item',
            fieldId: 'item',
            line: i
          });
          item_sku = item_sku ? item_sku.split(':').reverse()[0].trim() : '';
          items.push({
            // id: vraRec.getSublistValue({
            //     sublistId:'item',
            //     fieldId:'item',
            //     line:i
            // }),
            lineno: vraRec.getSubistValue({
              sublistId: 'item',
              fieldId: 'line',
              line: i
            }),
            sku: item_sku,
            qty: vraRec.getSublistText({
              sublistId: 'item',
              fieldId: 'quantity',
              line: i
            }),
            amount: vraRec.getSublistText({
              sublistId: 'item',
              fieldId: 'amount',
              line: i
            })
          })
        }

        let vraDetails = {
          ns_vraid: vraRec.getValue('tranid'),
          vendor: vraRec.getText('entity'),
          // vendor_id: vraRec.getValue('entity'),
          document_no: vraRec.getValue('tranid'),
          date: vraRec.getText('trandate'),
          memo: vraRec.getValue('memo'),
          location: vraRec.getText('location'),
          // location_id: vraRec.getValue('location'),
          subsidiary: vraRec.getText('subsidiary'),
          // subsidiary_id: vraRec.getValue('subsidiary'),
          status: vraRec.getValue('status'),
          createdfrom: vraRec.getValue('createdfrom'),
          total: vraRec.getValue('total'),
          items: items
        }

        log.debug('vraDetails', vraDetails);

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
            url: 'https://trapoapi.antz.app/api/Receiving/RegisterReceiving?doctype=RV',
            body: vraDetails,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${dataLogin.token}`,
            }
          });

          log.debug("response data", response);

          if (response.code == 200) {
            record.submitFields({
              type: record.Type.VENDOR_RETURN_AUTHORIZATION,
              id: vraRec.id,
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