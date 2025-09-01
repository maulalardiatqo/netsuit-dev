/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record', 'N/log', 'N/error', 'N/format', 'N/search', 'N/runtime'], (record, log, error, format, search, runtime) => {
    const createCashSale = (data) => {
        try {

        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        post: (context) => {
            try{
                log.audit('Received Data', JSON.stringify(context));
            }catch(e){
                log.debug('error', e)
            }
        }
    }
});