/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/log"], function (record, search, log) {

    function afterSubmit(context) {
        try {
            if (context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT) {
                return;
            }

            var rec = context.newRecord;
            var recType = rec.type;
            var recId = rec.id;

            var isCamAllocation = rec.getValue('custrecord_stc_non_premise_alloction');
            if (!isCamAllocation) return;

            var cekSubtitue = rec.getValue('custrecord_stc_subtitute_sof');
            if (!cekSubtitue) return;

            var recLoad = record.load({
                type: recType,
                id: cekSubtitue
            });
            var receiverValue = recLoad.getValue('custrecord_stc_receiver_from_sof');
            log.debug('receiverValue', receiverValue)
            var receiverArr = [];

            if (receiverValue) {
                if (Array.isArray(receiverValue)) {
                    receiverArr = receiverValue;
                } else {
                    receiverArr = receiverValue.split('\u0005');
                }
            }

            // pastikan recId string
            recId = String(recId);

            // hindari duplicate
            if (receiverArr.indexOf(recId) === -1) {
                receiverArr.push(recId);
            }

            recLoad.setValue({
                fieldId: 'custrecord_stc_receiver_from_sof',
                value: receiverArr
            });

            recLoad.save();

        } catch (e) {
            log.error('afterSubmit error', e);
        }
    }

    return{
        afterSubmit : afterSubmit
    }
});