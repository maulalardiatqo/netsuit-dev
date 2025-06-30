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
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var today = new Date();
                const offset = 7 * 60 * 60 * 1000; 
                today = new Date(today.getTime() + offset);
                var rec = context.newRecord;
    
                var result = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var internalId = rec.id
                log.debug('internalId', internalId)
                var status = result.getValue("status");
                var trandate = result.getValue('trandate');
                var isLk = result.getValue('custbody_rda_expired');
                log.debug('isLK', isLk)
                log.debug('status', status)
                log.debug('masuk status');
                trandate = new Date(convertToYYYYMMDD(trandate));
                trandate = new Date(trandate.getTime() + offset);
                if (isLk === '2') {
                    // Tambah 3 hari dari trandate
                    let newDate = new Date(trandate);
                    newDate.setDate(newDate.getDate() + 3);
                    log.debug('ISLK 2 - +3 date:', newDate);

                    // Cek kalau hasilnya holiday, cari ke depan sampai bukan holiday
                    let isLibur = isHoliday(newDate);
                    while (isLibur) {
                        log.debug('Tanggal hasil +3 libur:', isLibur);
                        newDate = new Date(isLibur.endDate);
                        newDate.setDate(newDate.getDate() + 1);
                        isLibur = isHoliday(newDate);
                    }

                    log.debug('Final date ISLK 2:', newDate);
                    updateItemFulfill(internalId, newDate);
                    return;
                } else {
                    // Tambah 1 hari dari trandate
                    let newDate = new Date(trandate);
                    newDate.setDate(newDate.getDate() + 1);
                    log.debug('ISLK bukan 2 - +1 date:', newDate);

                    // Cek kalau hasilnya holiday, cari ke depan sampai bukan holiday
                    let isLibur = isHoliday(newDate);
                    while (isLibur) {
                        log.debug('Tanggal hasil +1 libur:', isLibur);
                        newDate = new Date(isLibur.endDate);
                        newDate.setDate(newDate.getDate() + 1);
                        isLibur = isHoliday(newDate);
                    }

                    log.debug('Final date ISLK bukan 2:', newDate);
                    updateItemFulfill(internalId, newDate);
                    return;
                }

                // ===== AKHIR LOGIC BARU =====

                // ===== LOGIC SEBELUMNYA (TETAP UTUH) =====
                let tempDate;
            
                let holidayToday = isHoliday(trandate);
                if (holidayToday) {
                    log.debug('Trandate adalah hari libur:', holidayToday);
                    tempDate = new Date(holidayToday.endDate);
                    tempDate.setDate(tempDate.getDate() + 1);
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
                log.debug('tempDate', tempDate)
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
        } catch(e){
            log.debug('err', e)
        }
    }

    function convertToJakartaUTC(date) {
        const jakartaOffsetMs = 7 * 60 * 60 * 1000;
        const utcDateEquivalent = new Date(date.getTime() - jakartaOffsetMs);
        return utcDateEquivalent;
    }

    const isHoliday = (date) => {
        log.debug('date', date)
        var formattedDate = formatDate(date);

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
            log.debug('SUNDAY', date);
            return {
                desc : 'Sunday',
                endDate : date
            }
        }

        return false;
    }

    function getUTCFromJakartaMidnight(dateStr) {
        const parts = dateStr.split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }

    function updateItemFulfill(internalId, newDateValue){
        const dateObj = newDateValue
        log.debug('dateObj', dateObj)
        try {
            record.submitFields({
                type: record.Type.ITEM_FULFILLMENT,
                id: internalId,
                values: {
                    trandate: dateObj,
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
        const jakartaOffset = 7 * 60;
        const jakartaTime = new Date(date.getTime() + (jakartaOffset * 60000));
        const day = ('0' + jakartaTime.getUTCDate()).slice(-2);
        const month = ('0' + (jakartaTime.getUTCMonth() + 1)).slice(-2);
        const year = jakartaTime.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }

    return {
        afterSubmit: afterSubmit,
    };
});
