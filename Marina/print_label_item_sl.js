/***************************************************************************************
 ** Copyright (c) 2020 ABJ Cloud Solutions, Inc.
 ** A1-13-2 Arcoris Business Suite, 10, Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur, Malaysia
 ** All Rights Reserved.
 ** This software is the confidential and proprietary information of ABJ Cloud Solutions. ("Confidential Information").
 ** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement you entered into with ABJ Cloud Solutions.
 ***************************************************************************************/

/*******************************************************************************
 * **Copyright (c) 2023 ABJ Cloud Solutions, Inc.
 * @Client        :  AFC
 * @Script Name   :  print_label_item_sl.js
 * @script Record :  - ABJ SL | Print Label Item PDF
 * @Trigger Type  :  onRequest
 * @Release Date  :  20nd December, 2023
 * @Author        :  Abdul Hakim Hassan
 * @Description   :  This script will print pdf layout
 * @Enhancement   : <Enhancement description related to latest script version>
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 ******************************************************************************/
define(["N/render", "N/record", "N/config", "N/file", "N/search"], function (render, recordModule, config, file, search) {
  function onRequest(context) {
    try {
      var request = context.request;
      var response = context.response;

      var id = request.parameters.customid;
      if (!id) {
        response.write("customid parameter missing");
        return;
      }

      var itemRecord = recordModule.load({
        type: recordModule.Type.INVENTORY_ITEM,
        id: id,
      });

      if (!itemRecord) {
        response.write("Unable to load Inventory Item");
        return;
      }

      var customrecord_msa_group_price_qtySearchObj = search
        .create({
          type: "customrecord_msa_group_price_qty",
          filters: [["custrecord_msa_priceqty_item_id", "anyof", id], "AND", ["custrecord_msa_gpq_price_barcode", "is", "T"]],
          columns: ["custrecord_msa_gpq_volume", "custrecord_msa_gpq_harga", "custrecord_msa_gpq_profit_percent"],
        })
        .run();
      var results = customrecord_msa_group_price_qtySearchObj.getRange(0, 1);

      var renderer = render.create();
      renderer.addRecord("record", itemRecord);
      renderer.addSearchResults({
        templateName: "itemprice",
        searchResult: results,
      });
      renderer.setTemplateByScriptId("CUSTTMPL_110_9342705_368");

      var pdfFile = renderer.renderAsPdf();
      response.writeFile({
        file: pdfFile,
        isInline: true,
        name: "generated_label.pdf",
      });
    } catch (err) {
      response.write(err + " (line number: " + err.lineNumber + ")");
    }
  }

  return {
    onRequest: onRequest,
  };
});
