/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/error"], function(
    record,
    search,
    serverWidget,
    runtime,
    error
    ) {
        

        function createVendor(context, recLoad, idRec){
            try{
                const COUNTRY_MAP = {
                "Afghanistan": "AF",
                "Albania": "AL",
                "Algeria": "DZ",
                "American Samoa": "AS",
                "Andorra": "AD",
                "Angola": "AO",
                "Anguilla": "AI",
                "Antarctica": "AQ",
                "Antigua and Barbuda": "AG",
                "Argentina": "AR",
                "Armenia": "AM",
                "Aruba": "AW",
                "Australia": "AU",
                "Austria": "AT",
                "Azerbaijan": "AZ",
                "Bahamas": "BS",
                "Bahrain": "BH",
                "Bangladesh": "BD",
                "Barbados": "BB",
                "Belarus": "BY",
                "Belgium": "BE",
                "Belize": "BZ",
                "Benin": "BJ",
                "Bermuda": "BM",
                "Bhutan": "BT",
                "Bolivia": "BO",
                "Bosnia and Herzegovina": "BA",
                "Botswana": "BW",
                "Brazil": "BR",
                "Brunei Darussalam": "BN",
                "Bulgaria": "BG",
                "Burkina Faso": "BF",
                "Burundi": "BI",
                "Cambodia": "KH",
                "Cameroon": "CM",
                "Canada": "CA",
                "Cape Verde": "CV",
                "Cayman Islands": "KY",
                "Central African Republic": "CF",
                "Chad": "TD",
                "Chile": "CL",
                "China": "CN",
                "Colombia": "CO",
                "Comoros": "KM",
                "Congo, Democratic Republic of": "CD",
                "Congo, Republic of": "CG",
                "Cook Islands": "CK",
                "Costa Rica": "CR",
                "Côte d’Ivoire": "CI",
                "Croatia": "HR",
                "Cuba": "CU",
                "Cyprus": "CY",
                "Czech Republic": "CZ",
                "Denmark": "DK",
                "Djibouti": "DJ",
                "Dominica": "DM",
                "Dominican Republic": "DO",
                "Ecuador": "EC",
                "Egypt": "EG",
                "El Salvador": "SV",
                "Equatorial Guinea": "GQ",
                "Eritrea": "ER",
                "Estonia": "EE",
                "Ethiopia": "ET",
                "Fiji": "FJ",
                "Finland": "FI",
                "France": "FR",
                "Gabon": "GA",
                "Gambia": "GM",
                "Georgia": "GE",
                "Germany": "DE",
                "Ghana": "GH",
                "Greece": "GR",
                "Greenland": "GL",
                "Grenada": "GD",
                "Guam": "GU",
                "Guatemala": "GT",
                "Guinea": "GN",
                "Guinea-Bissau": "GW",
                "Guyana": "GY",
                "Haiti": "HT",
                "Honduras": "HN",
                "Hong Kong": "HK",
                "Hungary": "HU",
                "Iceland": "IS",
                "India": "IN",
                "Indonesia": "ID",
                "Iran": "IR",
                "Iraq": "IQ",
                "Ireland": "IE",
                "Israel": "IL",
                "Italy": "IT",
                "Jamaica": "JM",
                "Japan": "JP",
                "Jordan": "JO",
                "Kazakhstan": "KZ",
                "Kenya": "KE",
                "Korea, North": "KP",
                "Korea, South": "KR",
                "Kuwait": "KW",
                "Kyrgyzstan": "KG",
                "Laos": "LA",
                "Latvia": "LV",
                "Lebanon": "LB",
                "Lesotho": "LS",
                "Liberia": "LR",
                "Libya": "LY",
                "Liechtenstein": "LI",
                "Lithuania": "LT",
                "Luxembourg": "LU",
                "Macau": "MO",
                "Madagascar": "MG",
                "Malawi": "MW",
                "Malaysia": "MY",
                "Maldives": "MV",
                "Mali": "ML",
                "Malta": "MT",
                "Marshall Islands": "MH",
                "Martinique": "MQ",
                "Mauritania": "MR",
                "Mauritius": "MU",
                "Mexico": "MX",
                "Micronesia": "FM",
                "Moldova": "MD",
                "Monaco": "MC",
                "Mongolia": "MN",
                "Montenegro": "ME",
                "Morocco": "MA",
                "Mozambique": "MZ",
                "Myanmar (Burma)": "MM",
                "Namibia": "NA",
                "Nauru": "NR",
                "Nepal": "NP",
                "Netherlands": "NL",
                "New Zealand": "NZ",
                "Nicaragua": "NI",
                "Niger": "NE",
                "Nigeria": "NG",
                "Norway": "NO",
                "Oman": "OM",
                "Pakistan": "PK",
                "Palau": "PW",
                "Panama": "PA",
                "Papua New Guinea": "PG",
                "Paraguay": "PY",
                "Peru": "PE",
                "Philippines": "PH",
                "Poland": "PL",
                "Portugal": "PT",
                "Puerto Rico": "PR",
                "Qatar": "QA",
                "Romania": "RO",
                "Russia": "RU",
                "Rwanda": "RW",
                "Saint Kitts and Nevis": "KN",
                "Saint Lucia": "LC",
                "Saint Vincent and the Grenadines": "VC",
                "Samoa": "WS",
                "San Marino": "SM",
                "Saudi Arabia": "SA",
                "Senegal": "SN",
                "Serbia": "RS",
                "Seychelles": "SC",
                "Sierra Leone": "SL",
                "Singapore": "SG",
                "Slovakia": "SK",
                "Slovenia": "SI",
                "Solomon Islands": "SB",
                "Somalia": "SO",
                "South Africa": "ZA",
                "Spain": "ES",
                "Sri Lanka": "LK",
                "Sudan": "SD",
                "Suriname": "SR",
                "Swaziland": "SZ",
                "Sweden": "SE",
                "Switzerland": "CH",
                "Syria": "SY",
                "Taiwan": "TW",
                "Tajikistan": "TJ",
                "Tanzania": "TZ",
                "Thailand": "TH",
                "Togo": "TG",
                "Tonga": "TO",
                "Trinidad and Tobago": "TT",
                "Tunisia": "TN",
                "Turkey": "TR",
                "Turkmenistan": "TM",
                "Tuvalu": "TV",
                "Uganda": "UG",
                "Ukraine": "UA",
                "United Arab Emirates": "AE",
                "United Kingdom": "GB",
                "United States": "US",
                "Uruguay": "UY",
                "Uzbekistan": "UZ",
                "Vanuatu": "VU",
                "Vatican City": "VA",
                "Venezuela": "VE",
                "Vietnam": "VN",
                "Western Sahara": "EH",
                "Yemen": "YE",
                "Zambia": "ZM",
                "Zimbabwe": "ZW"
                };
                var name = recLoad.getValue('name');
                var addr = recLoad.getValue('custrecord_srf_registered_address');
                var countryName = recLoad.getText('custrecord_srf_country');
                log.debug('countryName', countryName)
                var country = COUNTRY_MAP[countryName] || 'ID';
                log.debug('country', country)
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
                    fieldId : 'payablesaccount',
                    value : 110
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
        function beforeSubmit(context){
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            const newRec = context.newRecord;
            const name = newRec.getValue({ fieldId: 'name' });
                log.debug('name', name)
            if (!name) return;

            const recordType = newRec.type;

            const duplicateSearch = search.create({
                type: recordType,
                filters: [
                    ['name', 'is', name],
                    'AND',
                    ['internalid', 'noneof', newRec.id || 0]
                ],
                columns: ['internalid']
            });

            const duplicateExists = duplicateSearch.runPaged({ pageSize: 1 }).count > 0;

            if (duplicateExists) {
                throw `Record dengan name "${name}" sudah ada. Harap gunakan nama lain.`;
            }
        }
        }
    return{
        afterSubmit : afterSubmit,
        beforeSubmit : beforeSubmit
    }
});