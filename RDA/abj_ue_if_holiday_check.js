/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format"], function(
    record,
    search,
    format
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
                var isLk = result.getValue('custbody_rda_expired');
                log.debug('isLK', isLk)
                log.debug('status', status)
                if (status == 'Shipped') {
                    log.debug('masuk status');
                    trandate = new Date(convertToYYYYMMDD(trandate));
                    trandate = new Date(trandate.getTime() + offset);
                    log.debug('TRANSAKSI','INTERNAL ID :' + internalId + ' || TRANDATE :' + trandate);
                
                    // ===== TAMBAHAN KHUSUS isLk === '2' DAN HARI KHUSUS =====
                    if (isLk === '2') {
                        let isSpecialCase = false;
                
                        // Cek jika trandate adalah hari Sabtu
                        if (trandate.getDay() === 6) {
                            isSpecialCase = true;
                        }
                
                        // Cek jika trandate adalah hari libur
                        if (isHoliday(trandate)) {
                            isSpecialCase = true;
                        }
                
                        // Cek jika besoknya trandate adalah hari libur
                        let besok = new Date(trandate);
                        besok.setDate(besok.getDate() + 1);
                        if (isHoliday(besok)) {
                            isSpecialCase = true;
                        }
                
                        // Jika salah satu kondisi terpenuhi, tambahkan 3 hari kerja
                        if (isSpecialCase) {
                            let workDays = 0;
                            let newDate = new Date(trandate);
                
                            while (workDays < 3) {
                                newDate.setDate(newDate.getDate() + 1);
                                let isWeekend = (newDate.getDay() === 0 || newDate.getDay() === 6);
                                let isLibur = isHoliday(newDate);
                
                                if (!isWeekend && !isLibur) {
                                    workDays++;
                                }
                            }
                
                            log.debug('ISLK 2 -> tempDate (3 hari kerja):', newDate);
                            updateItemFulfill(internalId, newDate);
                            return; // Stop eksekusi lebih lanjut karena tempDate sudah di-set
                        }
                    }
                
                    // ===== LOGIC SEBELUMNYA (TIDAK DIUBAH) =====
                    let tempDate;
                
                    let holidayToday = isHoliday(trandate);
                    if (holidayToday) {
                        log.debug('Trandate adalah hari libur:', holidayToday);
                        tempDate = new Date(holidayToday.endDate);
                        tempDate.setDate(tempDate.getDate() + 1); // Tambah 1 hari dari akhir hari libur
                    } else {
                        tempDate = new Date(trandate);
                    }
                
                    let besokDate = new Date(trandate);
                    besokDate.setDate(besokDate.getDate() + 1);
                    let holidayBesok = isHoliday(besokDate);
                    if (holidayBesok) {
                        log.debug('Besok adalah hari libur:', holidayBesok);
                        tempDate = new Date(holidayBesok.endDate);
                        tempDate.setDate(tempDate.getDate() + 1);
                    }
                
                    if (trandate.getDay() === 6) { 
                        log.debug('TRANDATE jatuh pada hari Sabtu, menambahkan 2 hari');
                        tempDate = new Date(trandate);
                        tempDate.setDate(tempDate.getDate() + 2);
                    }
                
                    if (tempDate.getDay() === 1) {
                        let isMondayHoliday = isHoliday(tempDate);
                        while (isMondayHoliday) {
                            log.debug('Senin adalah hari libur:', isMondayHoliday);
                            tempDate = new Date(isMondayHoliday.endDate);
                            tempDate.setDate(tempDate.getDate() + 1);
                            isMondayHoliday = isHoliday(tempDate);
                        }
                    }
                
                    let isAHoliday = isHoliday(tempDate);
                    while (isAHoliday) {
                        log.debug('Holiday found:', isAHoliday);
                        tempDate = new Date(isAHoliday.endDate);
                        tempDate.setDate(tempDate.getDate() + 1);
                        isAHoliday = isHoliday(tempDate);
                    }
                
                    log.debug('Final tempDate:', tempDate);
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
    function getUTCFromJakartaMidnight(dateStr) {
         // var dateString = '21/04/2025'; // format dd/mm/yyyy

        // Pisahkan jadi bagian2
        const parts = dateStr.split('/'); // ['21', '04', '2025']
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JS month 0-based
        const year = parseInt(parts[2]);
        
        const dateObj = new Date(year, month, day);
       
        

        return dateObj;
    }
    function updateItemFulfill(internalId, newDateValue){
        // const jakartaMidnightDate = new Date(
        //     newDateValue.getUTCFullYear(),
        //     newDateValue.getUTCMonth(),
        //     newDateValue.getUTCDate()
        // );
    
        // // Format jadi DD/MM/YYYY
        // const day = ('0' + jakartaMidnightDate.getDate()).slice(-2);
        // const month = ('0' + (jakartaMidnightDate.getMonth() + 1)).slice(-2);
        // const year = jakartaMidnightDate.getFullYear();
        // const formattedDate = `${day}/${month}/${year}`;
    
        // const dateObj = format.parse({
        //     value: formattedDate,
        //     type: format.Type.DATE
        // });
        const dateObj = newDateValue
        log.debug('dateObj', dateObj)
        // log.debug('formattedDate', formattedDate)
        try {
            // log.debug('Updating Item Fulfillment', `ID: ${internalId}, New Date: ${newDateValue}`);
            
            // Update the trandate field
            record.submitFields({
                type: record.Type.ITEM_FULFILLMENT,
                id: internalId,
                values: {
                    trandate: dateObj,
                    // memo : 'Update tanggal transaksi dari schedule script',
                    custbody_rda_do_exp_date : dateObj
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