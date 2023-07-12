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
define(["N/https", "N/record"], function (https, record) {
    // function beforeLoad(context) {

    // }

    // function beforeSubmit(context) {

    // }

    function afterSubmit(context) {
        try {
            if (context.type == "create" || context.type == "edit") {
                let itemRec = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id,
                });
                let isSend = itemRec.getValue(
                    "custitem_abj_item_master_sendto3rdpart"
                );
                if (isSend) return;

                var itemDetails = {
                    ns_itemid: itemRec.id,
                    name: itemRec.getValue("itemid"),
                    unit: itemRec.getText("saleunit"),
                    description: itemRec.getValue("displayname"),
                    upc: itemRec.getValue("upccode"),
                };
                log.debug("itemDetails", itemDetails);

                // let response = https.post({
                //     url:'',
                //     body:itemDetails,
                //     headers:{
                //         'Content-Type':'application/json'
                //     }
                // });

                // if(response.code == 200){
                //     record.submitFields({
                //         type: context.newRecord.type,
                //         id: itemRec.id,
                //         values:{
                //             'custitem_abj_item_master_sendto3rdpart': true
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
        afterSubmit: afterSubmit,
    };
});
