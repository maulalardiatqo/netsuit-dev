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
 * @Script Name   :  abj_ue_customerreturn_send.js
 * @script Record :  - ABJ UE | Send Customer Return
 * @Trigger Type  :  afterSubmit
 * @Release Date  :  14th Sept, 2021
 * @Author        :  Sayyad Tajuddin
 * @Description   :  This script will send the Customer Return details to third party
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
				let raRec = record.load({
					type: context.newRecord.type,
					id: context.newRecord.id,
				});
				let isSend = raRec.getValue(
					"custbody_abj_istran_sendto_3rdparty"
				);
				if (isSend) return;
				let items = [];
				let itemCount = raRec.getLineCount("item");
				for (let i = 0; i < itemCount; i++) {
					let item_sku = raRec.getSublistText({
						sublistId: "item",
						fieldId: "item",
						line: i,
					});
					item_sku = item_sku
						? item_sku.split(":").reverse()[0].trim()
						: "";
					items.push({
						// id: raRec.getSublistValue({
						//     sublistId:'item',
						//     fieldId:'item',
						//     line:i
						// }),
						lineno: raRec.getSubistValue({
							sublistId: "item",
							fieldId: "line",
							line: i,
						}),
						sku: item_sku,
						qty: raRec.getSublistText({
							sublistId: "item",
							fieldId: "quantity",
							line: i,
						}),
						amount: raRec.getSublistText({
							sublistId: "item",
							fieldId: "amount",
							line: i,
						}),
					});
				}

				let raDetails = {
					ns_raid: raRec.getValue("tranid"),
					customer: raRec.getText("entity"),
					// customer_id: raRec.getValue('entity'),
					document_no: raRec.getValue("tranid"),
					date: raRec.getText("trandate"),
					memo: raRec.getValue("memo"),
					location: raRec.getText("location"),
					// location_id: raRec.getValue('location'),
					subsidiary: raRec.getText("subsidiary"),
					// subsidiary_id: raRec.getValue('subsidiary'),
					status: raRec.getValue("status"),
					createdfrom: raRec.getText("createdfrom"),
					total: raRec.getValue("total"),
					items: items,
				};

				log.debug("raDetails", raDetails);

				// let response = https.post({
				//     url:'',
				//     body:raDetails,
				//     headers:{
				//         'Content-Type':'application/json'
				//     }
				// });

				// if(response.code == 200){
				//     record.submitFields({
				//         type: record.Type.RETURN_AUTHORIZATION,
				//         id: raRec.id,
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
		afterSubmit: afterSubmit,
	};
});
