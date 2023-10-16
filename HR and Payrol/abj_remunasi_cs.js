/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([
    "N/search",
    "N/currentRecord",
    "N/query",
    "N/record",
    "N/format",
    "N/ui/dialog",
    "N/runtime",
    "N/ui/message",
  ], function(search, currentRecord, query, record, format, dialog, runtime, message) {
    var exports = {};
  
    function pageInit(scriptContext) {
      var form = scriptContext
      var slipGajiSearch = search.create({
        type: 'customrecord_slip_gaji',
        columns: ['internalid', 'name']
      });

    var searchRemunasiSet = slipGajiSearch.runPaged().count;

    slipGajiSearch.run().each(function (row) {
      var currentRecord = scriptContext.currentRecord;
        var name = row.getValue({
            name: "name",
        });
        var internalIDSlip = row.getValue({
            name : 'internalid'
        });
        if(internalIDSlip){
          var recSlip = record.load({
              type : 'customrecord_slip_gaji',
              id: internalIDSlip
          });
          var pendapatanCount = recSlip.getLineCount({
            sublistId : 'recmachcustrecord_msa_remunasipend'
          });
          var potonganCount = recSlip.getLineCount({
              sublistId : 'recmachcustrecord_msa_remunasitry'
          });
        }
        if(pendapatanCount > 0){
          for(var index = 0; index < pendapatanCount; index++){
              var pendapatanid = recSlip.getSublistValue({
                  sublistId : 'recmachcustrecord_msa_remunasipend',
                  fieldId : 'custrecord_msa_slipgaji_pendapatan',
                  line : index,
              });
              var pendapatantext = recSlip.getSublistText({
                  sublistId : 'recmachcustrecord_msa_remunasipend',
                  fieldId : 'custrecord_msa_slipgaji_pendapatan',
                  line : index,
              });

              console.log('pendapatanText', pendapatantext);
              var fieldNamePend = 'custpage_' + pendapatantext.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+'_'+internalIDSlip+'_pendapatan_'+pendapatanid
                console.log('fieldName', fieldNamePend);
                var field = currentRecord.getField({
                  fieldId : fieldNamePend
                });
               field.isDisabled = true;

              
            }
            
        }
        if(potonganCount > 0){
          for(var index = 0; index < potonganCount; index++){
            var potonganid = recSlip.getSublistValue({
              sublistId : 'recmachcustrecord_msa_remunasitry',
              fieldId : 'custrecord_msa_komponen_potongan',
              line : index
            });
            var potonganText = recSlip.getSublistText({
                sublistId : 'recmachcustrecord_msa_remunasitry',
                fieldId : 'custrecord_msa_komponen_potongan',
                line : index
            });
            var fieldNamePot = 'custpage_' + potonganText.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+'_'+internalIDSlip+'_potongan_'+potonganid
          
            var fieldPotongan = currentRecord.getField({
                fieldId : fieldNamePot
            });
            fieldPotongan.isDisabled = true
          }
          
          
        }
        return true

      })
    }

    function fieldChanged(context) {
        var vrecord = context.currentRecord;
        var FieldName = context.fieldId;
        if(FieldName == 'custpage_slip_employee'){
           var employee = vrecord.getValue({
              fieldId : 'custpage_slip_employee'
           });
           console.log('employee', employee);
           if(employee){
            var empRec = search.create({
                type : 'customrecord_msa_remunerasi',
                columns : ['custrecord_remunerasi_employee'],
                filters : [{
                  name : 'custrecord_remunerasi_employee',
                  operator: 'is',
                  values: employee
                }]
            })
            var searEmployee = empRec.runPaged().count;
            console.log('searchEmployee',searEmployee);
            if(searEmployee > 0){
              alert("Employee Yang dipilih sudah tersedia di list Remunerasi ");
              vrecord.setValue({
                fieldId : 'custpage_slip_employee',
                value   : ''
              })
            }
           }
        }
        var slipGajiSearch = search.create({
          type: 'customrecord_slip_gaji',
          columns: ['internalid', 'name']
        });
  
      var searchRemunasiSet = slipGajiSearch.runPaged().count;
  
      slipGajiSearch.run().each(function (row) {
          var name = row.getValue({
              name: "name",
          });
          // var idGroup = 'custpage_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase();
          // var fieldGroup = form.addFieldGroup({
          //     id: 'custpage_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase(),
          //     label: name,
          // });
          
          var internalIDSlip = row.getValue({
              name : 'internalid'
          });
          var chekBoxName = 'custpage_check_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()
          if(FieldName == chekBoxName){
            var chekBoxValue = vrecord.getValue({
                fieldId : chekBoxName
            });
            console.log('chexboxvalue', chekBoxValue);
            if(internalIDSlip){
              var recSlip = record.load({
                  type : 'customrecord_slip_gaji',
                  id: internalIDSlip
              });
              var pendapatanCount = recSlip.getLineCount({
                sublistId : 'recmachcustrecord_msa_remunasipend'
              });
              var potonganCount = recSlip.getLineCount({
                  sublistId : 'recmachcustrecord_msa_remunasitry'
              });
            }
            if(pendapatanCount > 0){
              for(var index = 0; index < pendapatanCount; index++){
                  var pendapatanid = recSlip.getSublistValue({
                      sublistId : 'recmachcustrecord_msa_remunasipend',
                      fieldId : 'custrecord_msa_slipgaji_pendapatan',
                      line : index,
                  });
                  var pendapatantext = recSlip.getSublistText({
                      sublistId : 'recmachcustrecord_msa_remunasipend',
                      fieldId : 'custrecord_msa_slipgaji_pendapatan',
                      line : index,
                  });

                  console.log('pendapatanText', pendapatantext);
                  var fieldNamePend = 'custpage_' + pendapatantext.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+'_'+internalIDSlip+'_pendapatan_'+pendapatanid
                    console.log('fieldName', fieldNamePend);
                    var fieldPendapatan = vrecord.getField({
                      fieldId : fieldNamePend
                    });
                  if(chekBoxValue == true){
                    fieldPendapatan.isDisabled = false
                  }else{
                    fieldPendapatan.isDisabled = true
                  }
                }
                
            }
            if(potonganCount > 0){
              for(var index = 0; index < potonganCount; index++){
                  var potonganid = recSlip.getSublistValue({
                    sublistId : 'recmachcustrecord_msa_remunasitry',
                    fieldId : 'custrecord_msa_komponen_potongan',
                    line : index
                  });
                  var potonganText = recSlip.getSublistText({
                      sublistId : 'recmachcustrecord_msa_remunasitry',
                      fieldId : 'custrecord_msa_komponen_potongan',
                      line : index
                  });
                  var fieldPotonganId = 'custpage_' + potonganText.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+'_'+internalIDSlip+'_potongan_'+potonganid
                  var fieldPotongan = vrecord.getField({
                    fieldId : fieldPotonganId
                });
                  if(chekBoxValue == true){
                    
                    fieldPotongan.isDisabled = false
                  }else{
                    fieldPotongan.isDisabled = true
                  }
              }
            }
          }
          return true
        })

    }
    exports.fieldChanged = fieldChanged;
    exports.pageInit = pageInit;

    return exports;
});