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
 * @Script Name   :  abj_ue_subsidiary_andlocation_send.js
 * @script Record :  - ABJ UE | Send Sub & Location Details
 * @Trigger Type  :  afterSubmit
 * @Release Date  :  12th Oct, 2021
 * @Author        :  Sayyad Tajuddin
 * @Description   :  This script will send the Subsidiary and location details to third party
 * @Enhancement   : <Enhancement description related to latest script version>
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 ******************************************************************************/
define(['N/https'], function(https) {

  function beforeLoad(context) {

  }

  function beforeSubmit(context) {

  }

  function afterSubmit(context) {
    try {
      if (context.type == "create") {
        var legalentity_name = context.newRecord.getValue('name');
        log.audit('type', context.newRecord.type);
        log.audit('name', legalentity_name);
        // let response = https.post({
        //     url:'',
        //     body:{
        //             'legal_entity_name': legalentity_name,
        //             'legal_entity_type': context.newRecord.type
        // },
        //     headers:{
        //         'Content-Type':'application/json'
        //     }
        // });
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