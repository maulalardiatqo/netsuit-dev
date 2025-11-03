/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime"], function(
    record,
    search,
    serverWidget,
    runtime
    ) {
        function createVendor(context, recLoad, idRec){
            try{
                var name = recLoad.getValue('name');
                var addr = recLoad.getValue('custrecord_srf_registered_address');
                var country = "ID";
                var otherName = recLoad.getValue('custrecord_srf_other_name');
                var compWebsite = recLoad.getValue('custrecord_srf_company_website');
                var bcn = recLoad.getValue('custrecord_srf_business_id');
                // data ceo
                var ctCEO = recLoad.getValue('custrecord_srf_name');
                var ttlCeo = 'CEO'
                //data 2
                var contactName = recLoad.getValue('custrecord_srf_contact_name');
                var email = recLoad.getValue('custrecord_srf_email');
                var position = recLoad.getValue('custrecord_srf_position');
                var phone = recLoad.getValue('custrecord_srf_tlp');

                // data sc
                var scCtName = recLoad.getValue('custrecord_srf_sc_contact_name');
                var scEmail = recLoad.getValue('custrecord_srf_sc_email');
                var scPosition = recLoad.getValue('custrecord_srf_sc_position');
                var scTelp = recLoad.getValue('custrecord_srf_sc_telp');

                var bankName = recLoad.getValue('custrecord_srf_bank_name');
                var payye = recLoad.getValue('custrecord_srf_payye');
                var bankAcc = recLoad.getValue('custrecord_srf_bank_acc');
                var npwp = recLoad.getValue('custrecord_srf_npwp');
                var recCreate = record.create({
                    type : 'vendor',
                    isDynamic: true
                });
                recCreate.setValue({
                    fieldId : 'isperson',
                    value : "F"
                })
                recCreate.setValue({
                    fieldId : 'companyname',
                    value : name
                })
                recCreate.setValue({
                    fieldId : 'category',
                    value : 20
                })
                recCreate.setValue({
                    fieldId : 'comments',
                    value : otherName
                })
                recCreate.setValue({
                    fieldId : 'url',
                    value : compWebsite
                })
                recCreate.setValue({
                    fieldId : 'bcn',
                    value : bcn
                })
                
                recCreate.setValue({
                    fieldId : 'custentity_sos_bank_name',
                    value : bankName
                })
                recCreate.setValue({
                    fieldId : 'custentity_sos_bank_account_name',
                    value : payye
                })
                recCreate.setValue({
                    fieldId : 'custentity_sos_bank_account_number',
                    value : bankAcc
                })
                recCreate.setValue({
                    fieldId : 'vatregnumber',
                    value : npwp
                })
                recCreate.setValue({
                    fieldId : 'custentity_created_from',
                    value : idRec
                })

                recCreate.selectNewLine({ sublistId: 'addressbook' });

                let addrSubRec = recCreate.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                });

                addrSubRec.setValue({ fieldId: 'country', value: country });
                addrSubRec.setValue({ fieldId: 'addressee', value: addr });

                recCreate.commitLine({ sublistId: 'addressbook' });

                var vendorId = recCreate.save();
                if(vendorId){
                    const createContact = (params) => {
                        const { name, title, email, phone, vendorId } = params;
                        if (!name && !email && !phone) return null; // skip kalau kosong semua

                        var contactRec = record.create({
                            type: record.Type.CONTACT,
                            isDynamic: true
                        });

                        contactRec.setValue({ fieldId: 'firstname', value: name || '' });
                        contactRec.setValue({ fieldId: 'title', value: title || '' });
                        contactRec.setValue({ fieldId: 'email', value: email || '' });
                        contactRec.setValue({ fieldId: 'phone', value: phone || '' });
                        contactRec.setValue({ fieldId: 'company', value: vendorId });

                        var contactId = contactRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                        log.audit('Contact Created', `${title} - ID: ${contactId}`);
                        return contactId;
                    };

                    const contactIds = [];

                    if (ctCEO) {
                        const ceoId = createContact({
                            name: ctCEO,
                            title: ttlCeo,
                            email: '',
                            phone: '',
                            vendorId
                        });
                        if (ceoId) contactIds.push(ceoId);
                    }

                    if (contactName) {
                        const mainContactId = createContact({
                            name: contactName,
                            title: position,
                            email,
                            phone,
                            vendorId
                        });
                        if (mainContactId) contactIds.push(mainContactId);
                    }

                    if (scCtName) {
                        const scContactId = createContact({
                            name: scCtName,
                            title: scPosition,
                            email: scEmail,
                            phone: scTelp,
                            vendorId
                        });
                        if (scContactId) contactIds.push(scContactId);
                    }
                    record.submitFields({
                            type: 'customrecord_supplier_registration_form',
                            id: idRec,
                            values: { custrecord_vendor_record: vendorId },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                }
            }catch(e){
                log.debug('error create vendor', e)
            }
        }   
        function afterSubmit(context) {
            try {
                if (context.type === context.UserEventType.EDIT){
                    const rec    = context.newRecord;
                    const idRec = rec.id
                    const recOld = context.oldRecord;
                    const recLoad = record.load({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: false
                    });
                    var statusNew = recLoad.getValue('custrecord_srf_status');
                    var statusOld = recOld.getValue('custrecord_srf_status')
                    log.debug('different status', {
                        statusNew : statusNew,
                        statusOld : statusOld
                    })
                    if (statusNew === '2' &&  statusOld === '1') {
                        log.debug('Condition matched', 'Memanggil createVendor...');
                        createVendor(context, recLoad, idRec);
                    }
                }
            }catch(e){
                log.error('Error in afterSubmit', e);
            }
        }
    return{
        afterSubmit : afterSubmit,
    }
});