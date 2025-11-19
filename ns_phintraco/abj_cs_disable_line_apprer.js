/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {

    function lineInit(context) {
        var rec = context.currentRecord;

        var sublistId = context.sublistId;
        if (sublistId !== "recmachcustrecord_abj_a_id") return;

        // ambil nilai ONLY untuk current line
        var statusValue = rec.getCurrentSublistValue({
            sublistId,
            fieldId: 'custrecord_abj_status_approve'
        });
        console.log('statusValue', statusValue)
        if (statusValue == 2) {
            var fld = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_user_need_approval'
            });
            if (fld) {
                fld.isDisabled = true;
            }
            var fldGroup = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_approval_group'
            });
            if (fldGroup) {
                fldGroup.isDisabled = true;
            }
            var fldStts = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_status_approve'
            });
            if (fldStts) {
                fldStts.isDisabled = true;
            }
            var fldTgl = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_tgl_appprove'
            });
            if (fldTgl) {
                fldTgl.isDisabled = true;
            }
            var fldNotes = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_notes'
            });
            if (fldNotes) {
                fldNotes.isDisabled = true;
            }
            var fldDvc = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_device'
            });
            if (fldDvc) {
                fldDvc.isDisabled = true;
            }
        }else{
            var fld = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_user_need_approval'
            });

            if (fld) {
                fld.isDisabled = false;
            }
            var fldGroup = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_approval_group'
            });
            if (fldGroup) {
                fldGroup.isDisabled = false;
            }
            var fldStts = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_status_approve'
            });
            if (fldStts) {
                fldStts.isDisabled = false;
            }
            var fldTgl = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_tgl_appprove'
            });
            if (fldTgl) {
                fldTgl.isDisabled = false;
            }
            var fldNotes = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_notes'
            });
            if (fldNotes) {
                fldNotes.isDisabled = false;
            }
            var fldDvc = rec.getCurrentSublistField({
                sublistId,
                fieldId: 'custrecord_abj_device'
            });
            if (fldDvc) {
                fldDvc.isDisabled = false;
            }
        }
    }
    function validateDelete(context) {

        var rec = context.currentRecord;
        var sublistId = context.sublistId;

        if (sublistId !== "recmachcustrecord_abj_a_id") return true;

        var line = context.line;

        var statusValue = rec.getCurrentSublistValue({
            sublistId,
            fieldId: 'custrecord_abj_status_approve',
        });

        if (statusValue == 2) {
            alert("Line ini tidak dapat dihapus karena sudah APPROVED.");
            return false; 
        }

        return true;
    }

    return {
        lineInit: lineInit,
        validateDelete : validateDelete
    };

});
