/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/search'], (log, record, search) => {

    /**
     * Executes the scheduled script
     * @param {Object} scriptContext - The context in which the script is executed
     */
    const execute = (scriptContext) => {
        try {
            // Example: Log a message
            log.debug({
                title: 'Scheduled Script Execution',
                details: 'Scheduled script has started successfully.'
            });

            var today = new Date();
            const offset = 7 * 60 * 60 * 1000; // Jakarta is UTC+7
            today = new Date(today.getTime() + offset);
            // if(today.getDay() == 0){
            //     today = new Date(today.setDate(today.getDate() + 1));
            // }

            
            // var isTodayAHoliday = isHoliday(today);
            
            // if(!isTodayAHoliday){
            //     log.debug('TODAY IS NOT A HOLIDAY', isTodayAHoliday);
            //     return false;
            // }
            

            // // Start with the first holiday's end date + 1
            // var tempDate = new Date(isTodayAHoliday.endDate);
            // // tempDate = new Date(tempDate.getTime() + offset);
            // tempDate.setDate(tempDate.getDate() + 1);  // Move to the next day
            // // Continue the loop until no more holidays are found
            // while (isTodayAHoliday) {
            //     log.debug('Current tempDate being checked', tempDate);  // Log the date

            //     // Check if the new date is a holiday
            //     isTodayAHoliday = isHoliday(new Date(tempDate));  // Pass a new Date instance

            //     if (isTodayAHoliday) {
            //         log.debug('Holiday found:', isTodayAHoliday);

            //         // Update tempDate to the next day after the new holiday’s end date
            //         tempDate = new Date(isTodayAHoliday.endDate);
            //         // tempDate = new Date(tempDate.getTime() + offset);
            //         tempDate.setDate(tempDate.getDate() + 1);  // Move to the next day
            //     }
            // }
            
            // check if today is a holiday
            
            
            // var itemFulfillTrx = searchItemFulfill(today);
            // log.debug('DATA FULFILL', itemFulfillTrx);

            var formattedDate = formatDate(today);

            // Create a search for Item Fulfillment records
            var itemFulfillmentSearch = search.create({
                type: search.Type.ITEM_FULFILLMENT,
                filters: [
                    ['trandate', 'onorafter', formattedDate],  // Filter by transaction date
                    // 'AND',
                    // ['status', 'is', 'packed'],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'tranid',     // Transaction ID
                    'trandate',   // Transaction date
                    'entity',
                    'internalid',     // Internal Id
                    'status',     // Internal Id
                    'statusRef',     // Internal Id
                ]
            });
            itemFulfillmentSearch.run().each(function(result){
                var internalId = result.getValue({name: "internalid"});
                var status = result.getValue({name: "status"});
                var statusRef = result.getValue({name: "statusRef"});
                var trandate = result.getValue({name : 'trandate'});
                
                

                if(status == 'packed'){
                    
                    trandate = new Date(convertToYYYYMMDD(trandate));
                    trandate = new Date(trandate.getTime() + offset);
                    log.debug('TRANSAKSI','INTERNAL ID :'+internalId+ ' || TRANDATE :'+trandate);
                    
                    
    
                    var isAHoliday = isHoliday(trandate);
                
                    if(!isAHoliday){
                        log.debug(' IS NOT A HOLIDAY', isAHoliday);
                        return true;
                    }
                    log.debug('Holiday found 1 :', isAHoliday);
                    
                    

                    var tempDate = new Date(isAHoliday.endDate);
                    // tempDate = new Date(tempDate.getTime() + offset);
                    tempDate = new Date(tempDate.setDate(tempDate.getDate() + 1));  // Move to the next day
                    // Continue the loop until no more holidays are found
                    while (isAHoliday) {
                       
                        // log.debug('Current tempDate being checked', tempDate);  // Log the date
    
                        // Check if the new date is a holiday
                        isAHoliday = isHoliday(new Date(tempDate));  // Pass a new Date instance
    
                        if (isAHoliday) {
                            log.debug('Holiday found:', isAHoliday);
    
                            // Update tempDate to the next day after the new holiday’s end date
                            tempDate = new Date(isAHoliday.endDate);
                            // tempDate = new Date(tempDate.getTime() + offset);
                            tempDate = new Date(tempDate.setDate(tempDate.getDate() + 1));  // Move to the next day
                        }
                    }

                    updateItemFulfill(internalId, tempDate);
                }
                return true;
            });
            

            log.debug({
                title: 'Scheduled Script Completion',
                details: 'Script has completed successfully.'
            });
        } catch (error) {
            log.error({
                title: 'Error executing scheduled script',
                details: error
            });
            throw new Error("Error executing scheduled script", error);
            
        }
    };

    function updateItemFulfill(internalId, newDateValue){
        var formattedDate = formatDate(newDateValue);
        try {
            log.debug('Updating Item Fulfillment', `ID: ${internalId}, New Date: ${newDateValue}`);
            
            // Update the trandate field
            record.submitFields({
                type: record.Type.ITEM_FULFILLMENT,
                id: internalId,
                values: {
                    trandate: formattedDate,
                    // memo : 'Update tanggal transaksi dari schedule script',
                    custbody_rda_do_exp_date : formattedDate
                }
            });
        } catch (error) {
            throw error;
            
        }
    }

    function searchItemFulfill(date){
        try {
            var formattedDate = formatDate(date);

            // Create a search for Item Fulfillment records
            var itemFulfillmentSearch = search.create({
                type: search.Type.ITEM_FULFILLMENT,
                filters: [
                    ['trandate', 'onorafter', formattedDate],  // Filter by transaction date
                    // 'AND',
                    // ['status', 'is', 'packed'],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'tranid',     // Transaction ID
                    'trandate',   // Transaction date
                    'entity',
                    'internalid',     // Internal Id
                    'status',     // Internal Id
                    'statusRef',     // Internal Id
                ]
            });
            var results = [];
            itemFulfillmentSearch.run().each(function(result){
                var internalId = result.getValue({name: "internalid"});
                var status = result.getValue({name: "status"});
                var statusRef = result.getValue({name: "statusRef"});
                var trandate = result.getValue({name : 'trandate'});
                
                
                // if(status == 'packed'){
                //     updateItemFulfill(internalId, newDateValue);
                // }
                results.push({
                    internalId : internalId,
                    status : status,
                    statusRef,
                    trandate
                })
                return true;
            });
            return results;
        } catch (error) {
            log.error({
                title: 'Error search item fulfill',
                details: error
            });
            throw error;
        }
    }
    

    function formatDate(date) {
         // Convert to local time based on timezone offset
        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

        const day = ('0' + localDate.getDate()).slice(-2);
        const month = ('0' + (localDate.getMonth() + 1)).slice(-2);
        const year = localDate.getFullYear();

        return `${day}/${month}/${year}`;
    }

    const convertToYYYYMMDD = (dateString) => {
        const parts = dateString.split('/');  // Split by '/'
        const day = parts[0];
        const month = parts[1];  // Month is already 1-based
        const year = parts[2];
        return `${year}-${month}-${day}`;  // Concatenate in YYYY-MM-DD format
    };

    const isHoliday=(date) =>{
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

        var result = searchPublicHoliday.run().getRange({start : 0, end : 100});

        

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

    return { execute };
});
