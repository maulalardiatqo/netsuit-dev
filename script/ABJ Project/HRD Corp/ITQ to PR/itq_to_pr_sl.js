/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record',
    'N/runtime',
    'N/ui/serverWidget',
    'N/ui/message',
    'N/search',
    'N/url',
    'N/format',
    'N/redirect'
  ],
  function(record, runtime, serverWidget, message, search, url, format, redirect) {

    function onRequest(context) {
      var params = context.request;
      var type = params.parameters.type;
      var postid = params.parameters.postid;
      log.debug("postid", postid);

      var dataTrans = record.load({
        type: "customrecord_sol_" + type + "",
        id: postid,
        isDynamic: true
      });
      if (type == 'rfp') {
        var entity = dataTrans.getValue("custrecord_sol_" + type + "_buyers");
        var entity_name = dataTrans.getText("custrecord_sol_" + type + "_buyers");
      } else {
        var entity = dataTrans.getValue("custrecord_sol_" + type + "_buyer");
        var entity_name = dataTrans.getText("custrecord_sol_" + type + "_buyer");
      }
      var memo = dataTrans.getValue("altname");
      var department = dataTrans.getValue("custrecord_sol_" + type + "_department");
      var currency = dataTrans.getValue("custrecord_sol_" + type + "_currency");
      var povendor = dataTrans.getValue("custrecord_sol_" + type + "_awarded");
      var requestor = dataTrans.getValue("custrecord_sol_" + type + "_requestor");
      log.debug("dataTrans", {
        entity: entity,
        memo: memo,
        department: department,
        currency: currency
      });

      var rec_PR = record.create({
        type: record.Type.PURCHASE_REQUISITION,
        isDynamic: true,
      });
      log.debug("after create PR", true);
      log.debug("entity", entity);

      rec_PR.setValue({
        fieldId: "custbody_sol_" + type + "_awardedvendor",
        value: entity,
      });

      rec_PR.setValue({
        fieldId: 'memo',
        value: memo || '',
      });

      rec_PR.setValue({
        fieldId: "custbody_sol_pr_" + type + "",
        value: postid,
      });

      rec_PR.setValue({
        fieldId: 'department',
        value: department,
      });

      rec_PR.setValue({
        fieldId: 'currency',
        value: currency,
      });

      rec_PR.setValue({
        fieldId: 'entity',
        value: entity,
      });
      log.debug("after set value PR", true);

      var lineTotal = dataTrans.getLineCount({
        sublistId: "recmachcustrecord_sol_" + type + "_link",
      });
      log.debug("lineTotal", lineTotal);
      var totalItem = 0;
      for (var i = 0; i < lineTotal; i++) {
        var bidder = dataTrans.getSublistValue({
          sublistId: "recmachcustrecord_sol_" + type + "_link",
          fieldId: "custrecord_sol_" + type + "_item_bidder",
          line: i,
        });

        if (bidder == povendor) {
          totalItem++;
          var item = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_" + type + "_link",
            fieldId: "custrecord_sol_" + type + "_item",
            line: i,
          });

          var quantity = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_" + type + "_link",
            fieldId: "custrecord_sol_" + type + "_quantity_range",
            line: i,
          });

          var description = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_" + type + "_link",
            fieldId: "custrecord_sol_" + type + "_description",
            line: i,
          });

          var rate = dataTrans.getSublistValue({
            sublistId: "recmachcustrecord_sol_" + type + "_link",
            fieldId: "custrecord_sol_" + type + "_price",
            line: i,
          });

          var amount = parseFloat(quantity) * parseFloat(rate);

          log.debug("dataGet", {
            item: item,
            quantity: quantity,
            description: description,
            rate: rate,
            amount: amount
          });

          // Set sublist values
          rec_PR.selectNewLine({
            sublistId: 'item',
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: item,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: quantity,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: description,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'department',
            value: department,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'povendor',
            value: povendor,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: rate || 0,
          });

          rec_PR.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'estimatedamount',
            value: amount || 0,
          });

          rec_PR.commitLine({
            sublistId: 'item'
          });
          // End Set sublist values
        }
      }

      log.debug("total item", totalItem);
      if (totalItem <= 0) {
        var mType = message.Type.ERROR;
        var mTitle = "Error";
        var mMessage = `<html>
          <h3>There is no bidder on items for Recommended Bidders ${entity_name}</h3>
          <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
        <body></html>`;
      } else {
        var prId = rec_PR.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });

        if (prId) {
          log.debug("prId", prId);
          dataTrans.setValue({
            fieldId: "custrecord_sol_" + type + "_requisition",
            value: prId,
          });
          dataTrans.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
          var prUrl = url.resolveRecord({
            isEditMode: true,
            recordId: prId,
            recordType: record.Type.PURCHASE_REQUISITION
          });

          log.debug("prUrl", prUrl);

          var mType = message.Type.CONFIRMATION;
          var mTitle = "Success";
          var mMessage = `<html>
            <h3>Purchase Requisition <a href=${prUrl}>#${prId}</a> Successfully created</h3>
            <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
          <body></html>`;
        }
      }

      var form = serverWidget.createForm({
        title: "Create Recommendation for PR Result",
      });
      form.addPageInitMessage({
        type: mType,
        title: mTitle,
        message: mMessage,
      });
      context.response.writePage(form);

    }

    return {
      onRequest: onRequest
    };
  });