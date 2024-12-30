/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    
    function pageInit(context) {
        try{
            log.debug('init masuk');
        var modeCek = context.mode
        log.debug('mode', modeCek)
        if (context.mode === 'copy') {
            var currentRecordObj = records;
        
       
        var cekIf = currentRecordObj.getValue('custbody3');
        log.debug('cekIf', cekIf);
        if(cekIf){
            var searchIf = search.load({
                id: 'customsearch_invoice_line'
            })
            searchIf.filters.push(search.createFilter({name: "internalid", operator: search.Operator.IS, values: cekIf}));
            var searchIfSet = searchIf.run();
            var result = searchIfSet.getRange(0, 100);
           
            var recIfHeader = result[0]
            var soId =  recIfHeader.getValue({
                name: "createdfrom"
            });
            log.debug('soId', soId)
            if(soId){
                var countLine = currentRecordObj.getLineCount({
                    sublistId: 'item'
                }); 
                log.debug('countLine', countLine);
                
                if (countLine > 0) {
                    log.debug('masuk kondisi');
                    
                    // Membentuk array keys dari lineIf
                    var keys = [];
                    if (result.length > 0) {
                        for (var j = 0; j < result.length; j++) {
                            var recIf = result[j]
                            var item = recIf.getValue({
                                name : "item"
                            });
                            log.debug('item', item)
                            var units = recIf.getValue({
                                name: "unitid"
                            });
                            var key = item + "-" + units;
                            keys.push(key);
                            log.debug('key', key);
                        }
                    }
                
                    // Iterasi mundur untuk menghapus baris yang tidak sesuai dengan keys
                    for (var i = countLine - 1; i >= 0; i--) {
                        var currentItem = currentRecordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        var currentUnits = currentRecordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            line: i
                        });
                        var currentKey = currentItem + "-" + currentUnits;
                
                        // Hapus baris jika currentKey tidak ada dalam keys
                        if (!keys.includes(currentKey)) {
                            log.debug('Removing line', i, 'with key', currentKey);
                            currentRecordObj.selectLine({ sublistId: 'item', line: i });
                            currentRecordObj.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
                        }
                    }
                }
                
                
            }
        }
        }
        
        
        }catch(e){
            log.debug('error', e)
        }
        
    }
    return {
        pageInit: pageInit
    };
});
