/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/file'], function(search, file) {
  
  function execute(context) {
    var customerSearch = search.create({
      type: 'customer',
      columns: ['entityid', 'datecreated', 'estimatedbudget'] 
    });
    
    var searchResult = customerSearch.run();
    var results = searchResult.getRange({
      start: 0,
      end: 1000 
    });
    log.debug('result',result)
    var csvString = 'Customer COde,Date Create,Estimasi Budget\n'; 
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      var customerCode = result.getValue({ name: 'entityid' });
      var datecreated = result.getValue({ name: 'datecreated' });
      var budget = result.getValue({ name: 'estimatedbudget' });
      
      csvString += customerCode + ',' + datecreated + ',' + budget + '\n'; 
    }
    
    var fileName = 'customer_data.csv'; 
    var fileObj = file.create({
      name: fileName,
      fileType: file.Type.CSV,
      contents: csvString,
      folder: 3070,
      encoding: file.Encoding.UTF_8
    });
    
    var fileId = fileObj.save();
    log.debug('File ID:', fileId);
  }
  
  return {
    execute: execute
  };
});
