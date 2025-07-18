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
                const originalTrandate = new Date(convertToYYYYMMDD(trandate));
                trandate = new Date(originalTrandate.getTime() + offset);

                if (isLk === '2') {
                        let newDate = new Date(trandate);
                        let workDaysAdded = 0;

                        // Tambah 4 hari kerja (skip hari libur dan minggu)
                        while (workDaysAdded < 4) {
                            newDate.setDate(newDate.getDate() + 1);
                            let isLibur = isHoliday(newDate);
                            if (!isLibur) {
                                workDaysAdded++;
                            } else {
                                log.debug('Lewati libur:', isLibur);
                            }
                        }

                        // Cek apakah hasilnya weekend
                        if (newDate.getDay() === 6) {
                            log.debug('Final date jatuh Sabtu, tambah 3 hari');
                            newDate.setDate(newDate.getDate() + 5);
                        } else if (newDate.getDay() === 0) {
                            log.debug('Final date jatuh Minggu, tambah 2 hari');
                            newDate.setDate(newDate.getDate() + 4);
                        }

                        log.debug('Final date ISLK 2 (4 hari kerja ke depan):', newDate);
                        updateItemFulfill(internalId, newDate, originalTrandate);
                        return;
                }else {
                    let newDate = new Date(trandate);
                    let workDaysAdded = 0;

                    while (workDaysAdded < 2) {
                        newDate.setDate(newDate.getDate() + 1); // maju 1 hari setiap loop
                        let isLibur = isHoliday(newDate);
                        if (!isLibur) {
                            workDaysAdded++; // hanya dihitung jika bukan libur
                        } else {
                            log.debug('Lewati libur:', isLibur);
                        }
                    }

                    // Setelah dapat newDate 2 hari kerja ke depan, cek weekend
                    if (newDate.getDay() === 6) {
                        log.debug('Final date jatuh Sabtu, tambah 3 hari');
                        newDate.setDate(newDate.getDate() + 3);
                    } else if (newDate.getDay() === 0) {
                        log.debug('Final date jatuh Minggu, tambah 2 hari');
                        newDate.setDate(newDate.getDate() + 2);
                    }

                    log.debug('Final date ISLK bukan 2 (2 hari kerja ke depan):', newDate);
                    updateItemFulfill(internalId, newDate, originalTrandate);
                    return;
                }

                // ===== AKHIR LOGIC BARU =====

                // ===== LOGIC SEBELUMNYA (TETAP UTUH) =====
                let tempDate;
            
                let holidayToday = isHoliday(trandate);
                if (holidayToday) {
                    log.debug('Trandate adalah hari libur:', holidayToday);
                    tempDate = new Date(holidayToday.endDate);
                    tempDate.setDate(tempDate.getDate() + 2);
                } else {
                    tempDate = new Date(trandate);
                }
            
                let besokDate = new Date(trandate);
                besokDate.setDate(besokDate.getDate() + 2);
                let holidayBesok = isHoliday(besokDate);
                if (holidayBesok) {
                    log.debug('Besok adalah hari libur:', holidayBesok);
                    tempDate = new Date(holidayBesok.endDate);
                    tempDate.setDate(tempDate.getDate() + 2);
                }
            
                if (trandate.getDay() === 6) {
                    log.debug('TRANDATE jatuh pada hari Sabtu, menambahkan 3 hari');
                    tempDate = new Date(trandate);
                    tempDate.setDate(tempDate.getDate() + 3);
                }
                log.debug('tempDate', tempDate)
                if (tempDate.getDay() === 1) {
                    let isMondayHoliday = isHoliday(tempDate);
                    while (isMondayHoliday) {
                        log.debug('Senin adalah hari libur:', isMondayHoliday);
                        tempDate = new Date(isMondayHoliday.endDate);
                        tempDate.setDate(tempDate.getDate() + 2);
                        isMondayHoliday = isHoliday(tempDate);
                    }
                }
            
                let isAHoliday = isHoliday(tempDate);
                while (isAHoliday) {
                    log.debug('Holiday found:', isAHoliday);
                    tempDate = new Date(isAHoliday.endDate);
                    tempDate.setDate(tempDate.getDate() + 2);
                    isAHoliday = isHoliday(tempDate);
                }
                log.debug('Final tempDate:', tempDate);
                updateItemFulfill(internalId, tempDate, originalTrandate);
            }
        } catch(e){
            log.debug('err', e)
        }
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

    function updateItemFulfill(internalId, newDateValue, originalTrandate){
        const dateObj = newDateValue
        log.debug('dateObj', dateObj)
        try {
            const values = {
                custbody_rda_so_exp_date: dateObj
            };

            // Update trandate hanya jika originalTrandate adalah hari libur atau Minggu
            const isTrandateHoliday = isHoliday(originalTrandate);
            if (isTrandateHoliday) {
                values.trandate = dateObj;
            }

            record.submitFields({
                type: record.Type.SALES_ORDER,
                id: internalId,
                values: values
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
