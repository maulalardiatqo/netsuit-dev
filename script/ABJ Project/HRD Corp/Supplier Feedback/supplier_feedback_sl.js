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

    var userObj = runtime.getCurrentUser();
    var scriptObj = runtime.getCurrentScript();

    function onRequest(context) {

      var request = context.request;
      var response = context.response;

      try {
        var params = request.parameters;
        log.debug('params', params);
        log.debug('user id', userObj.id);

        if (request.method == 'GET' && !params.custom_id) {
          //searching for the SPV records for a particular Bidder/Vendor
          var spvSearchObj = spvSearch(userObj.id);

          //Showing the results based on the search results
          var list = showSPVList(spvSearchObj, scriptObj);
          response.writePage(list);
        }

        if (request.method == 'GET' && params.custom_id) {
          log.debug("SCRIPT in ELSE", "=====ELSE======");
          log.debug("Params.id", params.id);

          var spvSearchObj = spvSearch(userObj.id, params.custom_id);

          var spvFormObj = serverWidget.createForm({
            title: 'Supplier Feedback Form'
          });

          showspvDetails(spvFormObj, spvSearchObj, params);

          response.writePage(spvFormObj);
        }

        if (request.method == 'POST') {
          postFunction(context);
        }
      } catch (ex) {
        log.error(ex.name, ex.message);
        response.write({
          output: ex.message
        });
      }
    }

    /**
     *
     * @param {object} spvSearchObj
     * @param {object} scriptObj
     * @returns
     */
    function showSPVList(spvSearchObj, scriptObj) {
      var list = serverWidget.createList({
        title: 'Supplier Feedback'
      });

      list.addColumn({
        id: 'internalid',
        type: serverWidget.FieldType.TEXT,
        label: 'View',
        align: serverWidget.LayoutJustification.LEFT
      });

      list.addColumn({
        id: 'purchaseorder',
        type: serverWidget.FieldType.TEXT,
        label: 'PURCHASE ORDER (PO) NO',
        align: serverWidget.LayoutJustification.LEFT
      });

      var results = [];
      var suiteletURL = url.resolveScript({
        scriptId: scriptObj.id,
        deploymentId: scriptObj.deploymentId
      });

      spvSearchObj.forEach(function(rs) {
        results.push({
          internalid: "<a href=" + suiteletURL + "&custom_id=" + rs.getValue('internalid') + ">View</a>",
          purchaseorder: rs.getText('custrecord_sol_sfbf_polink')
        });
      });

      list.addRows({
        rows: results
      });

      return list;
    }

    /**
     *
     * @param {object} name
     * @returns
     */
    function selectList(name) {
      return '<td>' +
        '<select name="' + name + '" id="' + name + '">' +
        '<option value="4">4 - Excelent</option>' +
        '<option value="3">3 - Good</option>' +
        '<option value="2">2 - Poor</option>' +
        '<option value="1">1 - Very Poor</option>' +
        '</select>' +
        '</td>';
    }

    /**
     *
     * @param {object} spvFormObj
     * @param {object} spvSearchObj
     * @param {object} spvAttchmentsSearchObj
     * @param {object} params
     */
    function showspvDetails(spvFormObj, spvSearchObj, params) {
      if (spvSearchObj.length > 0) {

        spvFormObj.addField({
          id: 'custpage_internalid',
          type: serverWidget.FieldType.TEXT,
          label: 'Internal ID'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        }).defaultValue = params.custom_id;

        var html_content = spvFormObj.addField({
          id: 'custpage_tabledata',
          type: serverWidget.FieldType.INLINEHTML,
          label: 'Rating Details'
        });

        if (spvSearchObj[0].getValue('custrecord163')) {
          var _tableData = '<div>' +
            '<table>' +
            '<tr>' +
            '<td><b>PURCHASE ORDER (PO) NO.</b></td>' +
            '<td>&nbsp; : &nbsp;</td>' +
            '<td style="color: blue">' + spvSearchObj[0].getText('custrecord_sol_sfbf_polink') + '</td>' +
            '</tr>' +
            '</table>' +
            '<br>' +
            '<br>' +
            '<table>' +
            '<tr>' +
            '<td width="10"><b>1</b></td>' +
            '<td colspan="2"><b>PRODUCT KNOWLEDGE</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR PROCUREMENT`S PRODUCT KNOWLEDGE / CONTRACT TERM / PURCHASING PROCESS</td>' +
            '<td><b>' + spvSearchObj[0].getValue('custrecord157') + '</b></td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>2</b></td>' +
            '<td colspan="2"><b>QUALITY ASSURANCE</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>DO OUR PROCUREMENTS / USERS PROVIDE YOU SUFFICIENT TIME BETWEEN ORDER PLACEMENT AND DELIVERY?</td>' +
            '<td><b>' + spvSearchObj[0].getValue('custrecord158') + '</b></td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>3</b></td>' +
            '<td colspan="2"><b>DELIVERY TIME</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR USER`S INITIATIVE TO ENSURE BEST QUALITY PRODUCTS / SERVICES DELIVERED TO HRD CORP</td>' +
            '<td><b>' + spvSearchObj[0].getValue('custrecord159') + '</b></td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>4</b></td>' +
            '<td colspan="2"><b>ANTI-CORRUPTION INITIATIVE</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR COMMITMENT IN PREVENTING AND FIGHTING CORRUPTION?</td>' +
            '<td><b>' + spvSearchObj[0].getValue('custrecord160') + '</b></td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>5</b></td>' +
            '<td colspan="2"><b>PROFESSIONALISM</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR FOLLOWING TEAM`S POLITENESS AND PROFESSIONALISM IN COMMUNICATION?</td>' +
            '<td><b>' + spvSearchObj[0].getValue('custrecord161') + '</b></td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>6</b></td>' +
            '<td>DO YOU HAVE ANY OTHER SUGGESTION / FEEDBACK ON HOW TO IMPROVE OUR PROCUREMENT PRACTICES / SOURCING INITIATIVES, IN ORDER TO ENHANCE OUR STRATEGIC PROCUREMENT MANAGEMENT AND COST EFFICIENCY</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td><b>' + spvSearchObj[0].getValue('custrecord162') + '</b></td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td></td>' +
            '<td>&nbsp;</td>' +
            '<td style="color: blue"><b>' + spvSearchObj[0].getValue('custrecord164') + '</b></td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '</table>' +
            '</div>';
        } else {
          var _tableData = '<form method="post" class="form-horizontal" action=""><div>' +
            '<table>' +
            '<tr>' +
            '<td><b>PURCHASE ORDER (PO) NO.</b></td>' +
            '<td>&nbsp; : &nbsp;</td>' +
            '<td style="color: blue">' + spvSearchObj[0].getText('custrecord_sol_sfbf_polink') + '</td>' +
            '</tr>' +
            '</table>' +
            '<br>' +
            '<br>' +
            '<table>' +
            '<tr>' +
            '<td width="10"><b>1</b></td>' +
            '<td colspan="2"><b>PRODUCT KNOWLEDGE</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR PROCUREMENT`S PRODUCT KNOWLEDGE / CONTRACT TERM / PURCHASING PROCESS</td>' +
            '<td>' + selectList("custrecord157") + '</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>2</b></td>' +
            '<td colspan="2"><b>QUALITY ASSURANCE</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>DO OUR PROCUREMENTS / USERS PROVIDE YOU SUFFICIENT TIME BETWEEN ORDER PLACEMENT AND DELIVERY?</td>' +
            '<td>' + selectList("custrecord158") + '</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>3</b></td>' +
            '<td colspan="2"><b>DELIVERY TIME</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR USER`S INITIATIVE TO ENSURE BEST QUALITY PRODUCTS / SERVICES DELIVERED TO HRD CORP</td>' +
            '<td>' + selectList("custrecord159") + '</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>4</b></td>' +
            '<td colspan="2"><b>ANTI-CORRUPTION INITIATIVE</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR COMMITMENT IN PREVENTING AND FIGHTING CORRUPTION?</td>' +
            '<td>' + selectList("custrecord160") + '</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>5</b></td>' +
            '<td colspan="2"><b>PROFESSIONALISM</b></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>HOW DO YOU RATE OUR FOLLOWING TEAM`S POLITENESS AND PROFESSIONALISM IN COMMUNICATION?</td>' +
            '<td>' + selectList("custrecord161") + '</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td width="10"><b>6</b></td>' +
            '<td>DO YOU HAVE ANY OTHER SUGGESTION / FEEDBACK ON HOW TO IMPROVE OUR PROCUREMENT PRACTICES / SOURCING INITIATIVES, IN ORDER TO ENHANCE OUR STRATEGIC PROCUREMENT MANAGEMENT AND COST EFFICIENCY</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td><textarea id="custrecord162" name="custrecord162" rows="4" cols="50"></textarea></td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr>' +
            '<td></td>' +
            '<td style="color: blue">&nbsp</td>' +
            '</tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '<tr><td>&nbsp;</td></tr>' +
            '</table>' +
            '<br>' +
            '<button type="submit" style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;">Send Feedback</button>' +
            '</div></form>';
        }

        html_content.defaultValue = _tableData;

        spvFormObj.addButton({
          id: 'custpage_cancel',
          label: 'Back To List',
          functionName: 'history.go(-1)'
        });
      } else {
        var html_content = spvFormObj.addField({
          id: 'no_details_found',
          type: serverWidget.FieldType.INLINEHTML,
          label: 'No Details Found'
        });
        html_content.defaultValue = "<p style='font-size:20px'>No Details Found.</p><br><br>";
      }
    }

    /**
     *
     * @param {number} vendId
     * @param {boolean} showItems
     * @param {number} spvId
     * @returns
     */
    function spvSearch(vendId, spvId) {

      let filters = [
        ['custrecord_sol_sfbf_supname', 'anyof', vendId], 'AND',
        ["isinactive", "is", "F"]
      ];

      if (spvId) {
        filters.push("AND", ["internalid", "anyof", spvId]);
      }

      let columns = [
        search.createColumn({
          name: "internalid",
          label: "Internal ID"
        }),
        search.createColumn({
          name: "custrecord_sol_sfbf_polink",
          label: "PURCHASE ORDER (PO) NO."
        }),
        search.createColumn({
          name: "custrecord157",
          label: "custrecord157"
        }),
        search.createColumn({
          name: "custrecord158",
          label: "custrecord158"
        }),
        search.createColumn({
          name: "custrecord159",
          label: "custrecord159"
        }),
        search.createColumn({
          name: "custrecord160",
          label: "custrecord160"
        }),
        search.createColumn({
          name: "custrecord161",
          label: "custrecord161"
        }),
        search.createColumn({
          name: "custrecord162",
          label: "custrecord162"
        }),
        search.createColumn({
          name: "custrecord163",
          label: "custrecord163"
        }),
        search.createColumn({
          name: "custrecord164",
          label: "custrecord164"
        })
      ];

      let spvSearchObj = search.create({
        type: 'customrecord_sol_supplier_feedback_form',
        filters: filters,
        columns: columns
      }).run().getRange(0, 999);
      log.debug('spvSearchObj length', spvSearchObj.length);

      return spvSearchObj;
    }

    /**
     *
     * @param {object} context
     * @returns
     */
    function postFunction(context) {
      let params = context.request.parameters;
      let internalid = params.custpage_internalid;
      let questionAnswer157 = params.custrecord157;
      let questionAnswer158 = params.custrecord158;
      let questionAnswer159 = params.custrecord159;
      let questionAnswer160 = params.custrecord160;
      let questionAnswer161 = params.custrecord161;
      let questionAnswer162 = params.custrecord162;

      log.debug("internalid", internalid);

      let total = parseFloat(questionAnswer157) + parseFloat(questionAnswer158) + parseFloat(questionAnswer159) + parseFloat(questionAnswer160) + parseFloat(questionAnswer161);
      let percentage = (total / 20) * 100;

      log.debug("answer", {
        custrecord157: questionAnswer157,
        custrecord158: questionAnswer158,
        custrecord159: questionAnswer159,
        custrecord160: questionAnswer160,
        custrecord161: questionAnswer161,
        custrecord162: questionAnswer162,
        total: total,
        percentage: percentage
      });

      let supplierFeedbackData = record.load({
        type: "customrecord_sol_supplier_feedback_form",
        id: internalid,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord157",
        value: questionAnswer157,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord158",
        value: questionAnswer158,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord159",
        value: questionAnswer159,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord160",
        value: questionAnswer160,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord161",
        value: questionAnswer161,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord162",
        value: questionAnswer162,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord163",
        value: total,
      });

      supplierFeedbackData.setValue({
        fieldId: "custrecord164",
        value: percentage,
      });

      let saveID = supplierFeedbackData.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });

      if (saveID) {
        var successMessage = `<html>
          <h3>Thanks for your feedback!</h3>
          <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
        <body></html>`;

        let form = serverWidget.createForm({
          title: "Supplier Feedback",
        });
        form.addPageInitMessage({
          type: message.Type.CONFIRMATION,
          title: "Success!",
          message: successMessage,
        });
        context.response.writePage(form);
      }
    }

    return {
      onRequest: onRequest
    };
  });