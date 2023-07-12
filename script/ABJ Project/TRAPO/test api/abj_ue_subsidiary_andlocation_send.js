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
      if (context.type == "create" || context.type == "edit") {
        // log.debug("TYPE", context.newRecord.type);
        var legalentity_type = context.newRecord.type;
        // log.audit('type', context.newRecord.type);
        // log.audit('name', legalentity_name);
        let code = context.newRecord.id;
        let desc = context.newRecord.getValue('name');
        let subsidiary = context.newRecord.getValue('subsidiary');
        // log.debug("DATA", {
        //   code: code,
        //   desc: desc,
        //   subsidiary: subsidiary
        // });
        if (legalentity_type == 'subsidiary') {
          var url = 'https://trapoapi.antz.app/api/Master/RegisterEntity';
          var bodyDetails = {
            subsidiary_code: code,
            subsidiary_desc: desc,
          };
        } else {
          var url = 'https://trapoapi.antz.app/api/Master/RegisterWarehouse';
          var bodyDetails = {
            warehouse_code: code,
            warehouse_desc: desc,
            subsidiary_code: subsidiary_code
          };
        }

        log.debug("bodyDetailsss", bodyDetails);

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
            url: url,
            body: bodyDetails,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${dataLogin.token}`,
            }
          });

          log.debug("response data", response);
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