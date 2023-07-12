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
 * @Script Name   :  abj_ue_salesorder_send.js
 * @script Record :  - ABJ UE | Send Sales Order
 * @Trigger Type  :  afterSubmit
 * @Release Date  :  14th Sept, 2021
 * @Author        :  Sayyad Tajuddin
 * @Description   :  This script will send the SO details to third party
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
        let soRec = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id
        });
        let isSend = soRec.getValue('custbody_abj_istran_sendto_3rdparty');
        if (isSend) return;
        let items = [];
        let itemCount = soRec.getLineCount('item');
        for (let i = 0; i < itemCount; i++) {
          let item_sku = soRec.getSublistText({
            sublistId: 'item',
            fieldId: 'item',
            line: i
          });
          item_sku = item_sku ? item_sku.split(':').reverse()[0].trim() : '';
          items.push({
            // id: soRec.getSublistValue({
            //     sublistId:'item',
            //     fieldId:'item',
            //     line:i
            // }),
            lineno: soRec.getSubistValue({
              sublistId: 'item',
              fieldId: 'line',
              line: i
            }),
            sku: item_sku,
            // type: soRec.getSublistValue({
            //     sublistId:'item',
            //     fieldId:'itemtype',
            //     line:i
            // }),
            qty: soRec.getSublistText({
              sublistId: 'item',
              fieldId: 'quantity',
              line: i
            }),
            amount: soRec.getSublistText({
              sublistId: 'item',
              fieldId: 'amount',
              line: i
            })
          })
        }

        let soDetails = {
          ns_soid: soRec.getValue('tranid'),
          customer: soRec.getText('entity'),
          // customer_id: soRec.getValue('entity'),
          document_no: soRec.getValue('otherrefnum'),
          date: soRec.getText('trandate'),
          memo: soRec.getValue('memo'),
          location: soRec.getText('location'),
          // location_id: soRec.getValue('location'),
          subsidiary: soRec.getText('subsidiary'),
          // subsidiary_id: soRec.getValue('subsidiary'),
          status: soRec.getValue('status'),
          total: soRec.getValue('total'),
          items: items
        }

        log.debug('soDetails', soDetails);

        // let response = https.post({
        //     url:'',
        //     body:soDetails,
        //     headers:{
        //         'Content-Type':'application/json'
        //     }
        // });

        // if(response.code == 200){
        //     record.submitFields({
        //         type: record.Type.SALES_ORDER,
        //         id: soRec.id,
        //         values:{
        //             'custbody_abj_istran_sendto_3rdparty': true
        //         },
        //         options:{
        //             enableSourcing: true,
        //             ignoreMandatoryFields: true
        //         }
        //     });
        // }
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