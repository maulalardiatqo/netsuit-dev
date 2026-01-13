/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], (currentRecord) => {

    const SUBLIST_ID = 'recmachcustrecord_link_id_tar';
    const FIELD_TYPE = 'custrecord_tar_type';
    
    const FIELD_PASSENGER_NAME = 'custrecord_tar_passengers_name';
    const FIELD_NON_STAFF = 'custrecord_ter_pssngr_non_staff';
    const FIELD_STAFF_ID = 'custrecord_tar_staff_id'

    const setFieldState = (rec) => {
        const typeValue = rec.getCurrentSublistValue({
            sublistId: SUBLIST_ID,
            fieldId: FIELD_TYPE
        });
        const passNameField = rec.getSublistField({
            sublistId: SUBLIST_ID,
            fieldId: FIELD_PASSENGER_NAME,
            line: rec.getCurrentSublistIndex({ sublistId: SUBLIST_ID })
        });
        const staffId = rec.getSublistField({
            sublistId: SUBLIST_ID,
            fieldId: FIELD_STAFF_ID,
            line: rec.getCurrentSublistIndex({ sublistId: SUBLIST_ID })
        });
        const nonStaffField = rec.getSublistField({
            sublistId: SUBLIST_ID,
            fieldId: FIELD_NON_STAFF,
            line: rec.getCurrentSublistIndex({ sublistId: SUBLIST_ID })
        });
        if (!passNameField || !nonStaffField) return;
        if (typeValue == '1') {
            nonStaffField.isDisabled = true;
            passNameField.isDisabled = false;
            staffId.isDisabled = false
        } 
        else if (typeValue == '2') {
            nonStaffField.isDisabled = false;
            passNameField.isDisabled = true;
            staffId.isDisabled = true
        } 
    };


    const fieldChanged = (scriptContext) => {
        if (scriptContext.sublistId === SUBLIST_ID && scriptContext.fieldId === FIELD_TYPE) {
            setFieldState(scriptContext.currentRecord);
        }
    };


    const lineInit = (scriptContext) => {
        if (scriptContext.sublistId === SUBLIST_ID) {
            setFieldState(scriptContext.currentRecord);
        }
    };

    return {
        fieldChanged: fieldChanged,
        lineInit: lineInit
    };
});