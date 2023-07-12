/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/url'], function (url) {
    function redirectToCustomRecord() {
      var recordId = 330; 
      var linkURL = url.resolveRecord({
        recordType: 'customrecord330',
        recordId: recordId,
        isEditMode: false,
      });
      window.location.href = linkURL;
    }
  
    return {
      redirectToCustomRecord: redirectToCustomRecord,
    };
  });
  