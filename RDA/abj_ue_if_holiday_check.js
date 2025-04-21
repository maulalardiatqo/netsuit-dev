/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
    function afterSubmit(context) {
        try {
            var cekType = context.type;
            log.debug('cekType', cekType)
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.PACK) {
                var today = new Date();
                const offset = 7 * 60 * 60 * 1000; // Jakarta is UTC+7
                today = new Date(today.getTime() + offset);
                var rec = context.newRecord;
    
                var result = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var internalId = rec.id
                log.debug('internalId', internalId)
                var status = result.getValue("status");
                var statusRef = result.getValue("statusRef");
                var trandate = result.getValue('trandate');
                log.debug('status', status)
                if(status == 'Shipped'){
                    log.debug('masuk status');
                    trandate = new Date(convertToYYYYMMDD(trandate));
                    trandate = new Date(trandate.getTime() + offset);
                    log.debug('TRANSAKSI','INTERNAL ID :'+internalId+ ' || TRANDATE :'+trandate);
                
                    // Cek apakah trandate adalah hari Sabtu
                    var tempDate;
                    if (trandate.getDay() === 6) { 
                        log.debug('TRANDATE jatuh pada hari Sabtu, menambahkan 2 hari');
                        tempDate = new Date(trandate);
                        tempDate.setDate(tempDate.getDate() + 2); // Jadi Senin
                    } else {
                        var isAHoliday = isHoliday(trandate);
                
                        if(!isAHoliday){
                            log.debug(' IS NOT A HOLIDAY', isAHoliday);
                            return true;
                        }
                        log.debug('Holiday found 1 :', isAHoliday);
                        
                        tempDate = new Date(isAHoliday.endDate);
                        tempDate = new Date(tempDate.setDate(tempDate.getDate() + 1));  // Move to the next day
                        
                        // Continue the loop until no more holidays are found
                        while (isAHoliday) {
                            isAHoliday = isHoliday(new Date(tempDate));  // Check again
                            if (isAHoliday) {
                                log.debug('Holiday found:', isAHoliday);
                                tempDate = new Date(isAHoliday.endDate);
                                tempDate = new Date(tempDate.setDate(tempDate.getDate() + 1));
                            }
                        }
                    }
                    log.debug('tempDate', tempDate)
                    updateItemFulfill(internalId, tempDate);
                }
            }
        }catch(e){
            log.debug('err', e)
        }
    }
    function convertToJakartaUTC(date) {
        const jakartaOffsetMs = 7 * 60 * 60 * 1000;
    
        const utcDateEquivalent = new Date(date.getTime() - jakartaOffsetMs);
    
        return utcDateEquivalent;
    }
    const isHoliday=(date) =>{
        log.debug('date', date)
        log.debug('DAY',date.getDay())
       
        // log.debug('date',date);
        var formattedDate = formatDate(date);
        // log.debug('result Formated date',date);
        
        const customrecordRdaPublicHolidaySearchFilters = [
            ['custrecord_rda_publicholiday_startdate', 'onorbefore', formattedDate],
            'AND',
            ['custrecord_rda_publicholiday_enddate', 'onorafter', formattedDate],
            'AND',
            ['isinactive', 'is', false]
        ];
        var searchPublicHoliday = search.create({
            type : 'customrecord_rda_public_holiday',
            filters: customrecordRdaPublicHolidaySearchFilters,
            columns: [
                search.createColumn({ name: 'custrecord_rda_description' }),
                search.createColumn({ name: 'custrecord_rda_publicholiday_enddate' }),
            ],
        });

        var result = searchPublicHoliday.run().getRange({start : 0, end : 100})
        if(result.length > 0){
            return {
                desc : result[0].getValue({name : 'custrecord_rda_description'}),
                endDate : convertToYYYYMMDD(result[0].getValue({name : 'custrecord_rda_publicholiday_enddate'}))
            }
        }

        if(date.getUTCDay() == 0){
            log.debug('SUNDAY',date);
            return {
                desc : 'Sunday',
                endDate : date
            }
        }

        return false;
    }
    function updateItemFulfill(internalId, newDateValue){
        log.debug('newDateValue', newDateValue)
        var formattedDate = formatDate(newDateValue);
        var jakartaTime = convertToJakartaUTC(newDateValue);
        log.debug('jakartaTime', jakartaTime)
        log.debug('formattedDate', formattedDate)
        try {
            // log.debug('Updating Item Fulfillment', `ID: ${internalId}, New Date: ${newDateValue}`);
            
            // Update the trandate field
            record.submitFields({
                type: record.Type.ITEM_FULFILLMENT,
                id: internalId,
                values: {
                    trandate: jakartaTime,
                    // memo : 'Update tanggal transaksi dari schedule script',
                    custbody_rda_do_exp_date : jakartaTime
                }
            });
        } catch (error) {
            throw error;
            
        }
    }
    const convertToYYYYMMDD = (input) => {
        if (typeof input === 'string') {
            const parts = input.split('/');
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            return `${year}-${month}-${day}`;
        } else if (input instanceof Date) {
            const day = ('0' + input.getDate()).slice(-2);
            const month = ('0' + (input.getMonth() + 1)).slice(-2);
            const year = input.getFullYear();
            return `${year}-${month}-${day}`;
        } else {
            throw new Error('Invalid input for convertToYYYYMMDD');
        }
    }
    function formatDate(date) {
        // UTC offset Jakarta adalah +7 jam
        const jakartaOffset = 7 * 60; // dalam menit
    
        // Ubah ke waktu Jakarta
        const jakartaTime = new Date(date.getTime() + (jakartaOffset * 60000));
    
        const day = ('0' + jakartaTime.getUTCDate()).slice(-2);
        const month = ('0' + (jakartaTime.getUTCMonth() + 1)).slice(-2);
        const year = jakartaTime.getUTCFullYear();
    
        return `${day}/${month}/${year}`;
    }
//     function formatDate(date) {
//         // Convert to local time based on timezone offset
//        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

//        const day = ('0' + localDate.getDate()).slice(-2);
//        const month = ('0' + (localDate.getMonth() + 1)).slice(-2);
//        const year = localDate.getFullYear();

//        return `${day}/${month}/${year}`;
//    }
    return {
        afterSubmit: afterSubmit,
    };
});