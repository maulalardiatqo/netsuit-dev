/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/url'], function (url) {
    function beforeLoad(context) {
      if (context.type === 'view') {
        var recordId = 330; // ID custom record yang ingin ditampilkan
        var linkURL = url.resolveRecord({
          recordType: 'customrecord330',
          recordId: recordId,
          isEditMode: false,
        });
  
        var form = context.form;
        var costAllocateButton = form.addButton({
          id: 'custpage_costallocate',
          label: 'Cost Allocate',
          functionName: "window.location.href='" + linkURL + "';",
        });
      }
    }
  
    return {
      beforeLoad: beforeLoad,
    };
  });
  