/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/url', 'N/record'], function(url, record) {
    function pageInit(context) {
    }
    function onButtonClick(idRec) {
                      console.log('idRec', idRec);
      var suiteletUrl = url.resolveScript({
        scriptId: 'customscript_abj_lock_cjv_sl',
        deploymentId: 'customdeploy_abj_lock_cjv_sl',
        returnExternalUrl: false
      });
      console.log('suiteurl', suiteletUrl);
      window.location.href = suiteletUrl + "&idrec=" + idRec;
   
    }
    
    return {
    pageInit:pageInit,
    onButtonClick: onButtonClick
    };
  });
  