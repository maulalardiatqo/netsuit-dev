  function saveBankDetail(context){
    var supplierRecord=record.load({
      type: 'vendor',
      id:contextId
    });
     var swiftCode = supplierRecord.getValue({
      fieldId : 'custentity_sol_ven_swift_code'
     });

    var idSUblist = ''
    var objSublist = objRecord.getSublist({
      sublistId: idSUblist
    });
    log.debug('objSublist',objSublist);
    var countSublistSupplier= supplierRecord.getLinecount(idSublist); // get length of line/sublist bank detail // param id sublist
    for(var i =0 ; i < countSublistSupplier ; i++){
      var idBankDetailSublist = supplierRecord.getSublistValue(idSublist,'', i); //param id sublist
      var textFormatFile = supplierRecord.getSublistValue(idSublist,'', i); //param id sublist
      var textFormatSplit = textFormatFile.replace('.','').split("|");
      
      var bankDetailRecord =record.load({
        type: 'customrecord_2663_entity_bank_details',
        id:idBankDetailSublist
      });
      var value = swiftCode == 'PBB' && textFormatSplit[0] == 'PBB' ? 'PBB' : 'IBG' ;

      bankDetailRecord.setValue({
        fieldId : 'custpage_eft_custrecord_2663_entity_bic',
        value : value
      })
      bankDetailRecord.save();
    }
  }
