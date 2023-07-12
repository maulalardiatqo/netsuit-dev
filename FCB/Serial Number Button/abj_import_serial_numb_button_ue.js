/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/url'],

function (record, url)
{
    function beforeLoad(context){
        var form			= context.form;
		var recObj			= context.newRecord;
		var recID			= context.newRecord.id;

        try{
            if(context.type == context.UserEventType.VIEW) {
                var orderStatus		= recObj.getValue('orderstatus');
				var locObj			= recObj.getValue('location');
                log.debug('orderStatus', orderStatus);
            }

        }catch(e) {
			log.debug({title: "Exception Message", details:e.message});
		}
    }
    return {
		beforeLoad : beforeLoad
	}
});