/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/error", "N/log", "N/search", "N/record", 'N/ui/dialog', 'N/runtime'],
  function(error, log, search, record, dialog, runtime) {

    function updateBudgetDetail(budgetdetail_rfq_exps, budgetdetail_rfq_expset,
      budgetdetail_rfq_items, budgetdetail_rfq_itmset,
      BudgetId, BudgetYear, BudgetPeriod, BudgetPeriodText, BudgetAcount, account_text,
      Department, Class, Location) {

      try {
        log.debug("DEBUG", "Update Budget Detail");
        log.debug("BudgetId", BudgetId);
        log.debug("BudgetAcount", BudgetAcount);
        log.debug("BudgetPeriodText", BudgetPeriodText);
        log.debug("BudgetPeriod", BudgetPeriod);
        var BudgetDetail = search.create({
          type: 'customrecord_abj_budgetdetails',
          columns: ['internalid'],
          filters: [{
              name: 'custrecord_abj_budgetheader',
              operator: 'is',
              values: BudgetId
            },
            {
              name: 'custrecord_abj_det_account',
              operator: 'is',
              values: BudgetAcount
            },
          ]
        }).run().getRange({
          start: 0,
          end: 1
        });
        log.debug("BudgetDetail To Update", BudgetDetail);


        if (BudgetDetail.length > 0) {
          var BudgetDetailId = BudgetDetail[0].getValue({
            name: 'internalid'
          });

          var budgetdetailsbyAccount = search.load({
            id: 'customsearchafc_pr_budget_amount_wo_no'
          });

          const formula_account = "case when {custcol_abj_item_expacct.internalid} is null then " +
            "{account.internalid} else {custcol_abj_item_expacct.internalid} end";
          budgetdetailsbyAccount.filters.push(search.createFilter({
            name: "FORMULANUMERIC",
            formula: formula_account,
            operator: search.Operator.EQUALTO,
            values: BudgetAcount
          }, ));

          budgetdetailsbyAccount.filters.push(search.createFilter({
            name: 'custbody_abj_budyear_tran',
            operator: search.Operator.IS,
            values: BudgetYear
          }, ));

          budgetdetailsbyAccount.filters.push(search.createFilter({
            name: 'custbody_abj_budperiod_tran',
            operator: search.Operator.IS,
            values: BudgetPeriod
          }, ));

          budgetdetailsbyAccount.filters.push(search.createFilter({
            name: 'department',
            operator: search.Operator.IS,
            values: Department
          }, ));

          budgetdetailsbyAccount.filters.push(search.createFilter({
            name: 'class',
            operator: search.Operator.IS,
            values: Class
          }, ));

          budgetdetailsbyAccount.filters.push(search.createFilter({
            name: 'location',
            operator: search.Operator.IS,
            values: Location
          }, ));

          var budgetdetailsbyAccountset = budgetdetailsbyAccount.run();
          var budgetdetailsbyAccount = budgetdetailsbyAccountset.getRange(0, 1);
          log.debug('budgetdetailsbyAccount', budgetdetailsbyAccount);

          var CommitAmount = 0;
          if (budgetdetailsbyAccount.length > 0) {
            //get budget commit amount from pr & po
            log.debug("budgetdetails", budgetdetailsbyAccount);
            CommitAmount = Number(budgetdetailsbyAccount[0].getValue({
              name: budgetdetailsbyAccountset.columns[5]
            }));
            log.debug("CommitAmount pr/po", CommitAmount);
          }

          log.debug("account_text", account_text);

          log.debug("budgetdetail_rfq_exps", budgetdetail_rfq_exps);
          //get budget commit amount from rfq expense
          for (i in budgetdetail_rfq_exps) {
            var budgetdetail_rfq_exp = budgetdetail_rfq_exps[i];
            log.debug("budgetdetails rfq exp", budgetdetail_rfq_exp);
            var acct_item = budgetdetail_rfq_exp.getValue({
              name: budgetdetail_rfq_expset.columns[2]
            });
            if (acct_item == BudgetAcount) {
              var exp_linked_order = budgetdetail_rfq_exp.getValue({
                name: budgetdetail_rfq_expset.columns[4]
              }).trim();
              log.debug("exp_linked_order", exp_linked_order);
              if (exp_linked_order == '') {
                CommitAmount += Number(budgetdetail_rfq_exp.getValue({
                  name: budgetdetail_rfq_expset.columns[3]
                }));
              }
              log.debug("CommitAmount rfq exp", CommitAmount);
              break;
            }
          }

          log.debug("budgetdetail_rfq_items", budgetdetail_rfq_items);
          //get budget commit amount from rfq expense
          for (i in budgetdetail_rfq_items) {
            budgetdetail_rfq_item = budgetdetail_rfq_items[i];
            log.debug("budgetdetails rfq exp", budgetdetail_rfq_exp);
            var acct_item = budgetdetail_rfq_item.getValue({
              name: budgetdetail_rfq_itmset.columns[2]
            });
            if (acct_item == BudgetAcount) {
              var item_linked_order = budgetdetail_rfq_item.getValue({
                name: budgetdetail_rfq_itmset.columns[4]
              }).trim();
              log.debug("exp_linked_order", exp_linked_order);
              if (item_linked_order == '') {
                CommitAmount += Number(budgetdetail_rfq_item.getValue({
                  name: budgetdetail_rfq_itmset.columns[3]
                }));
              }
              log.debug("CommitAmount rfq item", CommitAmount);
              break;
            }
          }

          log.debug("CommitAmount", CommitAmount);
          log.debug("BudgetDetailId", BudgetDetailId);
          log.debug("BudgetAcount", BudgetAcount);
          if (BudgetDetailId) {
            var recBudgetDetail = record.load({
              type: 'customrecord_abj_budgetdetails',
              id: BudgetDetailId,
              isDynamic: false
            });
            log.debug("recBudgetDetail", recBudgetDetail);
            log.debug("custrecord_abj_det_", 'custrecord_abj_det_' + BudgetPeriodText + 'commit');
            recBudgetDetail.setValue({
              fieldId: 'custrecord_abj_det_' + BudgetPeriodText + 'commit',
              value: CommitAmount,
              ignoreFieldChange: true
            });
            var recBudgetDetailId = recBudgetDetail.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            log.debug("recBudgetDetailId", recBudgetDetailId);
          }
        }
      } catch (e) {
        log.debug("Error in Update Budget Detail", e.name + ' : ' + e.message);
      }
    }

    function beforeSubmit(context) {
      var rec = context.newRecord;
      var rectype = rec.type;
      if (rectype == 'customrecord_abj_rfq') {
        beforeSubmit_rfq(context);
      } else {
        beforeSubmit_pr_po(context);
      }
    }

    function beforeLoad(context) {
      var rec = context.newRecord;
      if (context.type == context.UserEventType.COPY) {
        for (var counter = 0; counter < 2; counter++) {
          var vsublistid = 'item';
          if (counter == 1) {
            vsublistid = 'expense';
          }
          var lineTotal = rec.getLineCount({
            sublistId: vsublistid
          });
          for (var i = 0; i < lineTotal; i++) {
            rec.setSublistValue({
              sublistId: vsublistid,
              fieldId: 'custcolafc_pr_rfq_no',
              line: i,
              value: ''
            });
          }
        }
      }
    }

    function beforeSubmit_rfq(context) {
      // to write off the budget amount when user change/edit the budget year/period/account
      log.debug("DEBUG", "before submit RFQ")
      var rec = context.newRecord;
      var oldrec = context.oldRecord;
      var rectype = rec.type;
      try {
        if (((context.type === context.UserEventType.EDIT) || (context.type === context.UserEventType.DELETE))) {
          log.debug("oldrecord1", oldrec);

          var BudgetYear = rec.getValue('custrecordabj_budyear_tran');
          var BudgetPeriod = rec.getValue('custrecord_abj_budperiod_tran');
          var RFQType = rec.getValue('custrecord_abj_rfq_type');
          var oldBudgetYear = oldrec.getValue('custrecordabj_budyear_tran');
          var oldBudgetPeriod = oldrec.getValue('custrecord_abj_budperiod_tran');
          var oldBudgetPeriod_Text = oldrec.getText('custrecord_abj_budperiod_tran').toLowerCase();
          var oldRFQType = oldrec.getValue('custrecord_abj_rfq_type');
          var Subsidiary = rec.getValue('custrecord_abj_rfq_subsidiary');

          for (var counter = 0; counter < 2; counter++) {
            var vsublistid = '';
            var fieldsegment;
            var fieldidamount;
            if (counter == 0) {
              vsublistid = "recmachcustrecord_abj_rfq_item_rfq";
              fieldsegment = 'item';
              fieldidamount = 'custrecord_abj_rfq_item_amt';
            } else {
              vsublistid = "recmachcustrecord_abj_rfq_exp_rfq";
              fieldsegment = 'exp';
              fieldidamount = 'custrecord_abj_rfq_exp_amt';
            }
            log.debug("counter", counter);
            log.debug("vsublistid", vsublistid);
            var lineTotal = oldrec.getLineCount({
              sublistId: vsublistid
            });
            for (var i = 0; i < lineTotal; i++) {

              var Department = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_dept',
                line: i
              });
              var oldDepartment = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_dept',
                line: i
              });

              var Class = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_class',
                line: i
              });
              var oldClass = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_class',
                line: i
              });

              var Location = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_location',
                line: i
              });
              var oldLocation = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_location',
                line: i
              });

              var fieldnameacct = 'custrecord_abj_rfq_item_account';
              if (counter == 1) {
                fieldnameacct = 'custrecord_abj_rfq_exp_acct';
              }
              var account = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: fieldnameacct,
                line: i
              });
              var oldaccount = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: fieldnameacct,
                line: i
              });

              if (!Department) Department = '@NONE@';
              if (!Class) Class = '@NONE@';
              if (!Location) Location = '@NONE@';

              if (!oldDepartment) oldDepartment = '@NONE@';
              if (!oldClass) oldClass = '@NONE@';
              if (!oldLocation) oldLocation = '@NONE@';

              if (((Department !== oldDepartment) && (oldDepartment)) ||
                ((Class !== oldClass) && (oldClass)) ||
                ((account !== oldaccount) && (oldaccount)) ||
                ((Location !== oldLocation) && (oldLocation)) ||
                ((BudgetYear !== oldBudgetYear) && (oldBudgetYear)) ||
                ((RFQType !== oldRFQType) && (oldRFQType)) ||
                ((BudgetPeriod !== oldBudgetPeriod) && (oldBudgetPeriod))) {

                log.debug("RFQType", RFQType);
                log.debug("oldRFQType", oldRFQType);
                log.debug("oldBudgetYear", oldBudgetYear);
                log.debug("oldBudgetPeriod", oldBudgetPeriod);
                log.debug("BudgetYear", BudgetYear);
                log.debug("BudgetPeriod", BudgetPeriod);
                log.debug("Department", Department);
                log.debug("oldDepartment", oldDepartment);
                log.debug("Class", Class);
                log.debug("oldClass", oldClass);
                log.debug("Location", Location);
                log.debug("oldLocation", oldLocation);
                log.debug("account", account);
                log.debug("oldaccount", oldaccount);

                var amount = Number(oldrec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: fieldidamount,
                  line: i
                }));
                log.debug("amount from old rec", amount);

                var BudgetDetail = search.create({
                  type: 'customrecord_abj_budgetdetails',
                  columns: ['internalid', 'custrecord_abj_det_account'],
                  filters: [{
                      name: 'custrecord_abj_year',
                      join: 'custrecord_abj_budgetheader',
                      operator: 'is',
                      values: oldBudgetYear
                    },
                    {
                      name: 'custrecord_abj_bud_status',
                      join: 'custrecord_abj_budgetheader',
                      operator: 'is',
                      values: 1
                    },
                    {
                      name: 'custrecord_abj_subsidiary',
                      join: 'custrecord_abj_budgetheader',
                      operator: 'is',
                      values: Subsidiary
                    },
                    {
                      name: 'custrecord_abj_det_account',
                      operator: 'is',
                      values: oldaccount
                    },
                  ]
                });

                log.debug('Department', oldDepartment);
                BudgetDetail.filters.push(search.createFilter({
                  name: 'custrecord_abj_department',
                  join: 'custrecord_abj_budgetheader',
                  operator: 'is',
                  values: oldDepartment
                }));

                log.debug('Class', oldClass);
                BudgetDetail.filters.push(search.createFilter({
                  name: 'custrecord_abj_bsegment',
                  join: 'custrecord_abj_budgetheader',
                  operator: 'is',
                  values: oldClass
                }));

                log.debug('Location', oldLocation);
                BudgetDetail.filters.push(search.createFilter({
                  name: 'custrecord_abj_budlocation',
                  join: 'custrecord_abj_budgetheader',
                  operator: 'is',
                  values: oldLocation
                }));

                var budgetdetailset = BudgetDetail.run();
                BudgetDetail = budgetdetailset.getRange(0, 100);

                log.debug('BudgetDetail', BudgetDetail);

                if (BudgetDetail.length > 0)
                  DeleteBudgetAmount(oldBudgetPeriod_Text, oldaccount, amount, BudgetDetail, budgetdetailset);
              };
            }
          }
        };
      } catch (e) {
        log.debug('error in before submit RFQ', e.name + ': ' + e.message);
      }
    }

    function beforeSubmit_pr_po(context) {
      // to write off the budget amount when user change/edit the budget year/period/account
      log.debug("DEBUG", "before submit pr/po")
      var rec = context.newRecord;
      var oldrec = context.oldRecord;
      var rectype = rec.type;
      try {
        if (((context.type === context.UserEventType.EDIT) || (context.type === context.UserEventType.DELETE))) {
          log.debug("oldrecord1", oldrec);

          var BudgetYear = rec.getValue('custbody_abj_budyear_tran');
          var BudgetPeriod = rec.getValue('custbody_abj_budperiod_tran');
          var oldBudgetYear = oldrec.getValue('custbody_abj_budyear_tran');
          var oldBudgetPeriod = oldrec.getValue('custbody_abj_budperiod_tran');
          var oldBudgetPeriod_Text = oldrec.getText('custbody_abj_budperiod_tran').toLowerCase();
          var Subsidiary = rec.getValue('subsidiary');
          var ispurchaseorder = (rectype == "purchaseorder");

          for (var counter = 0; counter < 2; counter++) {
            var vsublistid = '';
            if (counter == 0) {
              vsublistid = "item";
            } else {
              vsublistid = "expense";
            }
            log.debug("counter", counter);
            log.debug("vsublistid", vsublistid);
            var lineTotal = oldrec.getLineCount({
              sublistId: vsublistid
            });
            for (var i = 0; i < lineTotal; i++) {

              var Department = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'department',
                line: i
              });
              var oldDepartment = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'department',
                line: i
              });

              var Class = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'class',
                line: i
              });
              var oldClass = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'class',
                line: i
              });

              var Location = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'location',
                line: i
              });
              var oldLocation = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'location',
                line: i
              });

              var fieldnameacct = 'custcol_abj_item_expacct';
              if (counter == 1) {
                fieldnameacct = 'account';
              }
              var account = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: fieldnameacct,
                line: i
              });
              var oldaccount = oldrec.getSublistValue({
                sublistId: vsublistid,
                fieldId: fieldnameacct,
                line: i
              });

              if (!Department) Department = '@NONE@';
              if (!Class) Class = '@NONE@';
              if (!Location) Location = '@NONE@';

              if (!oldDepartment) oldDepartment = '@NONE@';
              if (!oldClass) oldClass = '@NONE@';
              if (!oldLocation) oldLocation = '@NONE@';

              if (((Department !== oldDepartment) && (oldDepartment)) ||
                ((Class !== oldClass) && (oldClass)) ||
                ((account !== oldaccount) && (oldaccount)) ||
                ((Location !== oldLocation) && (oldLocation)) ||
                ((BudgetYear !== oldBudgetYear) && (oldBudgetYear)) ||
                ((BudgetPeriod !== oldBudgetPeriod) && (oldBudgetPeriod))) {

                log.debug("oldBudgetYear", oldBudgetYear);
                log.debug("oldBudgetPeriod", oldBudgetPeriod);
                log.debug("BudgetYear", BudgetYear);
                log.debug("BudgetPeriod", BudgetPeriod);
                log.debug("Department", Department);
                log.debug("oldDepartment", oldDepartment);
                log.debug("Class", Class);
                log.debug("oldClass", oldClass);
                log.debug("Location", Location);
                log.debug("oldLocation", oldLocation);
                log.debug("account", account);
                log.debug("oldaccount", oldaccount);

                var fieldidamount = 'estimatedamount'
                if (ispurchaseorder) {
                  fieldidamount = 'amount';
                }

                var amount = Number(oldrec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: fieldidamount,
                  line: i
                }));
                log.debug("amount from old rec", amount);

                var BudgetDetail = search.create({
                  type: 'customrecord_abj_budgetdetails',
                  columns: ['internalid', 'custrecord_abj_det_account'],
                  filters: [{
                      name: 'custrecord_abj_year',
                      join: 'custrecord_abj_budgetheader',
                      operator: 'is',
                      values: oldBudgetYear
                    },
                    {
                      name: 'custrecord_abj_bud_status',
                      join: 'custrecord_abj_budgetheader',
                      operator: 'is',
                      values: 1
                    },
                    {
                      name: 'custrecord_abj_subsidiary',
                      join: 'custrecord_abj_budgetheader',
                      operator: 'is',
                      values: Subsidiary
                    },
                    {
                      name: 'custrecord_abj_det_account',
                      operator: 'is',
                      values: oldaccount
                    },
                  ]
                });

                log.debug('Department', oldDepartment);
                BudgetDetail.filters.push(search.createFilter({
                  name: 'custrecord_abj_department',
                  join: 'custrecord_abj_budgetheader',
                  operator: 'is',
                  values: oldDepartment
                }));

                log.debug('Class', oldClass);
                BudgetDetail.filters.push(search.createFilter({
                  name: 'custrecord_abj_bsegment',
                  join: 'custrecord_abj_budgetheader',
                  operator: 'is',
                  values: oldClass
                }));

                log.debug('Location', oldLocation);
                BudgetDetail.filters.push(search.createFilter({
                  name: 'custrecord_abj_budlocation',
                  join: 'custrecord_abj_budgetheader',
                  operator: 'is',
                  values: oldLocation
                }));

                var budgetdetailset = BudgetDetail.run();
                BudgetDetail = budgetdetailset.getRange(0, 100);

                log.debug('BudgetDetail', BudgetDetail);

                if (BudgetDetail.length > 0)
                  DeleteBudgetAmount(oldBudgetPeriod_Text, oldaccount, amount, BudgetDetail, budgetdetailset);
              };
            }
          }
        };
      } catch (e) {
        log.debug('error in before submit pr po', e.name + ': ' + e.message);
      }

    }

    function DeleteBudgetAmount(BudgetPeriod_Text, account, Amount, BudgetDetails, budgetdetailset) {

      try {
        log.debug("DEBUG", "DeleteBudgetAmount")
        var BudgetDetailId = 0;
        for (var i in BudgetDetails) {
          BudgetDetail = BudgetDetails[i];
          var acct_item = BudgetDetail.getValue({
            name: budgetdetailset.columns[1]
          });
          if (acct_item == account) {
            BudgetDetailId = BudgetDetail.getValue({
              name: budgetdetailset.columns[0]
            });
            break;
          }
        }

        if (BudgetDetailId) {
          log.debug('BudgetDetailId', BudgetDetailId);
          var recBudgetDetail = record.load({
            type: 'customrecord_abj_budgetdetails',
            id: BudgetDetailId,
            isDynamic: false
          });
          log.debug("recBudgetDetail", recBudgetDetail);
          log.debug("custrecord_abj_det_", 'custrecord_abj_det_' + BudgetPeriod_Text + 'commit');
          var CommitAmount = Number(recBudgetDetail.getValue('custrecord_abj_det_' + BudgetPeriod_Text + 'commit'));
          log.debug("Amount", Amount);
          log.debug("CommitAmount before delete", CommitAmount);
          CommitAmount -= Amount;
          log.debug("CommitAmount after delete", CommitAmount);
          recBudgetDetail.setValue({
            fieldId: 'custrecord_abj_det_' + BudgetPeriod_Text + 'commit',
            value: CommitAmount,
            ignoreFieldChange: true
          });
          var recBudgetDetailId = recBudgetDetail.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
          log.debug("recBudgetDetailId", recBudgetDetailId);
          return recBudgetDetailId;
        }
        var scriptObj = runtime.getCurrentScript();

        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });

      } catch (e) {
        log.debug('error in delete budget amount', e.name + ': ' + e.message);
      }
    }

    function afterSubmit(context) {
      var rec = context.newRecord;
      var rectype = rec.type;
      if (rectype == 'customrecord_abj_rfq') {
        afterSubmit_rfq(context);
      } else {
        afterSubmit_pr_po(context);
      }
    }

    function afterSubmit_rfq(context) {
      log.debug("DEBUG", "After submit RFQ")
      var rec = context.newRecord;
      var oldrec = context.oldRecord;

      var id = rec.id;
      var rectype = rec.type;
      var BudgetYear = rec.getValue('custrecordabj_budyear_tran');
      var BudgetPeriod = rec.getValue('custrecord_abj_budperiod_tran');
      var Subsidiary = rec.getValue('custrecord_abj_rfq_subsidiary');
      // var RFQTypeText = rec.getText('custrecord_abj_rfq_type');
      var RFQType = rec.getValue('custrecord_abj_rfq_type');
      log.debug("RFQType", RFQType);
      if (RFQType == '5')
        return true;

      log.debug("rectype", rectype);
      log.debug("BudgetYear", BudgetYear);
      log.debug("BudgetPeriod", BudgetPeriod);

      try {

        function remove_duplicates_in_list(arr) {
          var uniques = [];
          var itemsFound = {};
          for (var i = 0, l = arr.length; i < l; i++) {
            var stringified = JSON.stringify(arr[i]);
            if (itemsFound[stringified]) {
              continue;
            }
            uniques.push(arr[i]);
            itemsFound[stringified] = true;
          }
          return uniques;
        }

        var list_segment = [];
        var Department;
        var Class;
        var Location;
        var account;
        var account_text;
        var list_department = [];
        var list_location = [];
        var list_class = [];
        var list_acct_to_filter = [];
        for (var counter = 0; counter < 2; counter++) {
          var vsublistid = '';
          var fieldsegment;
          if (counter == 0) {
            vsublistid = "recmachcustrecord_abj_rfq_item_rfq";
            fieldsegment = 'item';
          } else {
            vsublistid = "recmachcustrecord_abj_rfq_exp_rfq";
            fieldsegment = 'exp';
          }
          log.debug("counter", counter);
          log.debug("vsublistid", vsublistid);
          var lineTotal = rec.getLineCount({
            sublistId: vsublistid
          });
          for (var i = 0; i < lineTotal; i++) {
            Department = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_dept',
              line: i
            });
            Class = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_class',
              line: i
            });
            Location = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_location',
              line: i
            });
            var fieldacct = 'custrecord_abj_rfq_item_account';
            if (counter == 1) {
              fieldacct = 'custrecord_abj_rfq_exp_acct'
            }
            account = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: fieldacct,
              line: i
            });
            account_text = rec.getSublistText({
              sublistId: vsublistid,
              fieldId: fieldacct,
              line: i
            });
            if (!Department) Department = '@NONE@';
            if (!Class) Class = '@NONE@';
            if (!Location) Location = '@NONE@';

            list_segment.push({
              Department: Department,
              Class: Class,
              Location: Location,
              Account: account,
              account_text: account_text,
            });

            list_department.push(Department);
            list_class.push(Class);
            list_location.push(Location);
            list_acct_to_filter.push(account);
          }
        }
        list_segment = remove_duplicates_in_list(list_segment);
        log.debug("list_segment", list_segment);
        list_department = remove_duplicates_in_list(list_department);
        list_class = remove_duplicates_in_list(list_class);
        list_location = remove_duplicates_in_list(list_location);
        list_acct_to_filter = remove_duplicates_in_list(list_acct_to_filter);

        log.debug("list_department", list_department);
        log.debug("list_class", list_class);
        log.debug("list_location", list_location);
        log.debug("list_acct_to_filter", list_acct_to_filter);

        var Budgets = search.create({
          type: 'customrecord_abj_budget_ui',
          columns: ['internalid', 'custrecord_abj_department', 'custrecord_abj_bsegment', 'custrecord_abj_budlocation'],
          filters: [{
              name: 'custrecord_abj_subsidiary',
              operator: search.Operator.IS,
              values: Subsidiary
            },
            {
              name: 'custrecord_abj_year',
              operator: search.Operator.IS,
              values: BudgetYear
            },
            {
              name: 'custrecord_abj_bud_status',
              operator: search.Operator.IS,
              values: 1
            },
          ]
        });

        log.debug('Department', Department);
        Budgets.filters.push(search.createFilter({
          name: 'custrecord_abj_department',
          operator: search.Operator.ANYOF,
          values: list_department
        }, ));

        log.debug('Class', Class);
        Budgets.filters.push(search.createFilter({
          name: 'custrecord_abj_bsegment',
          operator: search.Operator.ANYOF,
          values: list_class
        }, ));

        log.debug('Location', Location);
        Budgets.filters.push(search.createFilter({
          name: 'custrecord_abj_budlocation',
          operator: search.Operator.ANYOF,
          values: list_location
        }, ));

        var budgetdetailset = Budgets.run();
        Budgets = budgetdetailset.getRange(0, 100);

        log.debug("Budget", Budgets);

        log.debug('list_acct_to_filter', list_acct_to_filter);

        var budgetdetail_rfq_exps = search.load({
          id: 'customsearchafc_rfq_budget_amount_exp',
        });
        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecordabj_budyear_tran',
          operator: search.Operator.IS,
          values: BudgetYear
        }, ));

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_budperiod_tran',
          operator: search.Operator.IS,
          values: BudgetPeriod
        }, ));

        if (list_acct_to_filter.length > 0) {
          budgetdetail_rfq_exps.filters.push(search.createFilter({
            name: 'custrecord_abj_rfq_exp_acct',
            join: 'custrecord_abj_rfq_exp_rfq',
            operator: search.Operator.ANYOF,
            values: list_acct_to_filter
          }));
          log.debug('filter acc', list_acct_to_filter);
        }

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_exp_dept',
          join: 'custrecord_abj_rfq_exp_rfq',
          operator: search.Operator.ANYOF,
          values: list_department
        }));
        log.debug('list_department', list_department);

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_exp_class',
          join: 'custrecord_abj_rfq_exp_rfq',
          operator: search.Operator.ANYOF,
          values: list_class
        }));
        log.debug('list_class', list_class);

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_exp_location',
          join: 'custrecord_abj_rfq_exp_rfq',
          operator: search.Operator.ANYOF,
          values: list_location
        }));
        log.debug('list_location', list_location);

        var budgetdetail_rfq_expset = budgetdetail_rfq_exps.run();
        budgetdetail_rfq_exps = budgetdetail_rfq_expset.getRange(0, 100);
        log.debug('budgetdetail_rfq_exp0', budgetdetail_rfq_exps);

        var budgetdetail_rfq_itms = search.load({
          id: 'customsearchafc_rfq_budget_amount_item'
        });

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecordabj_budyear_tran',
          operator: search.Operator.IS,
          values: BudgetYear
        }, ));

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_budperiod_tran',
          operator: search.Operator.IS,
          values: BudgetPeriod
        }, ));

        if (list_acct_to_filter.length > 0) {
          budgetdetail_rfq_itms.filters.push(search.createFilter({
            name: 'custrecord_abj_rfq_item_account',
            join: 'custrecord_abj_rfq_item_rfq',
            operator: search.Operator.ANYOF,
            values: list_acct_to_filter
          }));
          log.debug('filter acc item', list_acct_to_filter);
        }

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_item_dept',
          join: 'custrecord_abj_rfq_item_rfq',
          operator: search.Operator.ANYOF,
          values: list_department
        }));
        log.debug('list_department2', list_department);

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_item_class',
          join: 'custrecord_abj_rfq_item_rfq',
          operator: search.Operator.ANYOF,
          values: list_class
        }));
        log.debug('list_class2', list_class);

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_item_location',
          join: 'custrecord_abj_rfq_item_rfq',
          operator: search.Operator.ANYOF,
          values: list_location
        }));
        log.debug('list_location2', list_location);

        var budgetdetail_rfq_itmset = budgetdetail_rfq_itms.run();
        budgetdetail_rfq_itms = budgetdetail_rfq_itmset.getRange(0, 100);
        log.debug('budgetdetail_rfq_itm0', budgetdetail_rfq_itms);

        for (var idx in list_segment) {
          var segment = list_segment[idx];
          Department = segment.Department;
          Class = segment.Class;
          Location = segment.Location;
          account = segment.Account;
          account_text = segment.account_text;
          var BudgetPeriodText = rec.getText('custrecord_abj_budperiod_tran').toLowerCase();

          var BudgetId = 0;
          for (var i in Budgets) {
            var Budget = Budgets[i];
            var Department_to_check = Budget.getValue({
              name: 'custrecord_abj_department'
            }) || '@NONE@';
            var Class_to_check = Budget.getValue({
              name: 'custrecord_abj_bsegment'
            }) || '@NONE@';
            var Location_to_check = Budget.getValue({
              name: 'custrecord_abj_budlocation'
            }) || '@NONE@';
            log.debug('Department_to_check', Department_to_check);
            log.debug('Class_to_check', Class_to_check);
            log.debug('Location_to_check', Location_to_check);
            if ((Department == Department_to_check) &&
              (Class == Class_to_check) &&
              (Location == Location_to_check)) {
              BudgetId = Budget.getValue({
                name: 'internalid'
              });
              log.debug('BudgetId', BudgetId);
              break;
            }
          }

          if (BudgetId) {

            var budgetdetail_rfq_exp = [];
            for (var i in budgetdetail_rfq_exps) {
              var budgetdetail_rfq_exp_t = budgetdetail_rfq_exps[i];
              var Account_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[2]
              }) || '@NONE@';
              var Department_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[5]
              }) || '@NONE@';
              var Class_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[6]
              }) || '@NONE@';
              var Location_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[7]
              }) || '@NONE@';
              if ((Department == Department_to_check) &&
                (Class == Class_to_check) &&
                (Location == Location_to_check)) {
                budgetdetail_rfq_exp.push(budgetdetail_rfq_exp_t);
                break;
              }
            }
            log.debug('budgetdetail_rfq_exp2', budgetdetail_rfq_exp);

            var budgetdetail_rfq_itm = [];
            for (var i in budgetdetail_rfq_itms) {
              var budgetdetail_rfq_itm_t = budgetdetail_rfq_itms[i];
              var Account_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[2]
              }) || '@NONE@';
              var Department_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[5]
              }) || '@NONE@';
              var Class_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[6]
              }) || '@NONE@';
              var Location_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[7]
              }) || '@NONE@';
              if ((Department == Department_to_check) &&
                (Class == Class_to_check) &&
                (Location == Location_to_check)) {
                budgetdetail_rfq_itm.push(budgetdetail_rfq_itm_t);
                break;
              }
            }
            log.debug('budgetdetail_rfq_exp2', budgetdetail_rfq_itm);

            updateBudgetDetail(budgetdetail_rfq_exp, budgetdetail_rfq_expset,
              budgetdetail_rfq_itm, budgetdetail_rfq_itmset,
              BudgetId, BudgetYear, BudgetPeriod, BudgetPeriodText, account, account_text,
              Department, Class, Location);
          }

        }
        var scriptObj = runtime.getCurrentScript();
        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });
      } catch (e) {
        log.debug("Error in After Submit RFQ", e.name + ' : ' + e.message);
      }
    }

    function afterSubmit_pr_po(context) {
      log.debug("DEBUG", "After submit PR_PO")
      var rec = context.newRecord;
      var oldrec = context.oldRecord;

      var id = rec.id;
      var rectype = rec.type;
      var BudgetYear = rec.getValue('custbody_abj_budyear_tran');
      var BudgetPeriod = rec.getValue('custbody_abj_budperiod_tran');
      var Subsidiary = rec.getValue('subsidiary');
      //var Department=rec.getValue('department');
      //var Class=rec.getValue('class');
      //if (!Department) Department='@NONE@';
      //if (!Class) Class='@NONE@';

      log.debug("rectype", rectype);
      log.debug("BudgetYear", BudgetYear);
      log.debug("BudgetPeriod", BudgetPeriod);
      var searchrectype = 'PurchReq';
      if (rectype == 'purchaseorder') {
        searchrectype = 'PurchOrd';
      }

      try {

        function remove_duplicates_in_list(arr) {
          var uniques = [];
          var itemsFound = {};
          for (var i = 0, l = arr.length; i < l; i++) {
            var stringified = JSON.stringify(arr[i]);
            if (itemsFound[stringified]) {
              continue;
            }
            uniques.push(arr[i]);
            itemsFound[stringified] = true;
          }
          return uniques;
        }

        var list_segment = [];
        var Department;
        var Class;
        var Location;
        var account;
        var account_text;
        var list_department = [];
        var list_location = [];
        var list_class = [];
        var list_acct_to_filter = [];
        for (var counter = 0; counter < 2; counter++) {
          var vsublistid = '';
          if (counter == 0) {
            vsublistid = "item";
          } else {
            vsublistid = "expense";
          }
          log.debug("counter", counter);
          log.debug("vsublistid", vsublistid);
          var lineTotal = rec.getLineCount({
            sublistId: vsublistid
          });
          for (var i = 0; i < lineTotal; i++) {
            Department = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'department',
              line: i
            });
            Class = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'class',
              line: i
            });
            Location = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'location',
              line: i
            });
            var fieldacct = 'custcol_abj_item_expacct';
            if (counter == 1) {
              fieldacct = 'account'
            }
            account = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: fieldacct,
              line: i
            });
            account_text = rec.getSublistText({
              sublistId: vsublistid,
              fieldId: fieldacct,
              line: i
            });
            if (!Department) Department = '@NONE@';
            if (!Class) Class = '@NONE@';
            if (!Location) Location = '@NONE@';

            list_segment.push({
              Department: Department,
              Class: Class,
              Location: Location,
              Account: account,
              account_text: account_text,
            });

            list_department.push(Department);
            list_class.push(Class);
            list_location.push(Location);
            list_acct_to_filter.push(account);
          }
        }
        list_segment = remove_duplicates_in_list(list_segment);
        log.debug("list_segment", list_segment);
        list_department = remove_duplicates_in_list(list_department);
        list_class = remove_duplicates_in_list(list_class);
        list_location = remove_duplicates_in_list(list_location);
        list_acct_to_filter = remove_duplicates_in_list(list_acct_to_filter);

        log.debug("list_department", list_department);
        log.debug("list_class", list_class);
        log.debug("list_location", list_location);
        log.debug("list_acct_to_filter", list_acct_to_filter);

        var Budgets = search.create({
          type: 'customrecord_abj_budget_ui',
          columns: ['internalid', 'custrecord_abj_department', 'custrecord_abj_bsegment', 'custrecord_abj_budlocation'],
          filters: [{
              name: 'custrecord_abj_subsidiary',
              operator: search.Operator.IS,
              values: Subsidiary
            },
            {
              name: 'custrecord_abj_year',
              operator: search.Operator.IS,
              values: BudgetYear
            },
            {
              name: 'custrecord_abj_bud_status',
              operator: search.Operator.IS,
              values: 1
            },
          ]
        });

        log.debug('Department', Department);
        Budgets.filters.push(search.createFilter({
          name: 'custrecord_abj_department',
          operator: search.Operator.ANYOF,
          values: list_department
        }, ));

        log.debug('Class', Class);
        Budgets.filters.push(search.createFilter({
          name: 'custrecord_abj_bsegment',
          operator: search.Operator.ANYOF,
          values: list_class
        }, ));

        log.debug('Location', Location);
        Budgets.filters.push(search.createFilter({
          name: 'custrecord_abj_budlocation',
          operator: search.Operator.ANYOF,
          values: list_location
        }, ));

        var budgetdetailset = Budgets.run();
        Budgets = budgetdetailset.getRange(0, 100);

        log.debug("Budget", Budgets);

        log.debug('list_acct_to_filter', list_acct_to_filter);

        var budgetdetail_rfq_exps = search.load({
          id: 'customsearchafc_rfq_budget_amount_exp',
        });
        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecordabj_budyear_tran',
          operator: search.Operator.IS,
          values: BudgetYear
        }, ));

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_budperiod_tran',
          operator: search.Operator.IS,
          values: BudgetPeriod
        }, ));

        if (list_acct_to_filter.length > 0) {
          budgetdetail_rfq_exps.filters.push(search.createFilter({
            name: 'custrecord_abj_rfq_exp_acct',
            join: 'custrecord_abj_rfq_exp_rfq',
            operator: search.Operator.ANYOF,
            values: list_acct_to_filter
          }));
          log.debug('filter acc', list_acct_to_filter);
        }

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_exp_dept',
          join: 'custrecord_abj_rfq_exp_rfq',
          operator: search.Operator.ANYOF,
          values: list_department
        }));
        log.debug('list_department', list_department);

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_exp_class',
          join: 'custrecord_abj_rfq_exp_rfq',
          operator: search.Operator.ANYOF,
          values: list_class
        }));
        log.debug('list_class', list_class);

        budgetdetail_rfq_exps.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_exp_location',
          join: 'custrecord_abj_rfq_exp_rfq',
          operator: search.Operator.ANYOF,
          values: list_location
        }));
        log.debug('list_location', list_location);

        var budgetdetail_rfq_expset = budgetdetail_rfq_exps.run();
        budgetdetail_rfq_exps = budgetdetail_rfq_expset.getRange(0, 100);
        log.debug('budgetdetail_rfq_exp0', budgetdetail_rfq_exps);

        var budgetdetail_rfq_itms = search.load({
          id: 'customsearchafc_rfq_budget_amount_item'
        });

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecordabj_budyear_tran',
          operator: search.Operator.IS,
          values: BudgetYear
        }, ));

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_budperiod_tran',
          operator: search.Operator.IS,
          values: BudgetPeriod
        }, ));

        if (list_acct_to_filter.length > 0) {
          budgetdetail_rfq_itms.filters.push(search.createFilter({
            name: 'custrecord_abj_rfq_item_account',
            join: 'custrecord_abj_rfq_item_rfq',
            operator: search.Operator.ANYOF,
            values: list_acct_to_filter
          }));
          log.debug('filter acc item', list_acct_to_filter);
        }

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_item_dept',
          join: 'custrecord_abj_rfq_item_rfq',
          operator: search.Operator.ANYOF,
          values: list_department
        }));
        log.debug('list_department2', list_department);

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_item_class',
          join: 'custrecord_abj_rfq_item_rfq',
          operator: search.Operator.ANYOF,
          values: list_class
        }));
        log.debug('list_class2', list_class);

        budgetdetail_rfq_itms.filters.push(search.createFilter({
          name: 'custrecord_abj_rfq_item_location',
          join: 'custrecord_abj_rfq_item_rfq',
          operator: search.Operator.ANYOF,
          values: list_location
        }));
        log.debug('list_location2', list_location);

        var budgetdetail_rfq_itmset = budgetdetail_rfq_itms.run();
        budgetdetail_rfq_itms = budgetdetail_rfq_itmset.getRange(0, 100);
        log.debug('budgetdetail_rfq_itm0', budgetdetail_rfq_itms);

        for (var idx in list_segment) {
          var segment = list_segment[idx];
          Department = segment.Department;
          Class = segment.Class;
          Location = segment.Location;
          account = segment.Account;
          account_text = segment.account_text;
          var BudgetPeriodText = rec.getText('custbody_abj_budperiod_tran').toLowerCase();

          var BudgetId = 0;
          for (var i in Budgets) {
            var Budget = Budgets[i];
            var Department_to_check = Budget.getValue({
              name: 'custrecord_abj_department'
            }) || '@NONE@';
            var Class_to_check = Budget.getValue({
              name: 'custrecord_abj_bsegment'
            }) || '@NONE@';
            var Location_to_check = Budget.getValue({
              name: 'custrecord_abj_budlocation'
            }) || '@NONE@';
            log.debug('Department_to_check', Department_to_check);
            log.debug('Class_to_check', Class_to_check);
            log.debug('Location_to_check', Location_to_check);
            if ((Department == Department_to_check) &&
              (Class == Class_to_check) &&
              (Location == Location_to_check)) {
              BudgetId = Budget.getValue({
                name: 'internalid'
              });
              log.debug('BudgetId', BudgetId);
              break;
            }
          }

          if (BudgetId) {

            var budgetdetail_rfq_exp = [];
            for (var i in budgetdetail_rfq_exps) {
              var budgetdetail_rfq_exp_t = budgetdetail_rfq_exps[i];
              var Account_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[2]
              }) || '@NONE@';
              var Department_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[5]
              }) || '@NONE@';
              var Class_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[6]
              }) || '@NONE@';
              var Location_to_check = budgetdetail_rfq_exp_t.getValue({
                name: budgetdetail_rfq_expset.columns[7]
              }) || '@NONE@';
              if ((Department == Department_to_check) &&
                (Class == Class_to_check) &&
                (Location == Location_to_check)) {
                budgetdetail_rfq_exp.push(budgetdetail_rfq_exp_t);
                break;
              }
            }
            log.debug('budgetdetail_rfq_exp2', budgetdetail_rfq_exp);

            var budgetdetail_rfq_itm = [];
            for (var i in budgetdetail_rfq_itms) {
              var budgetdetail_rfq_itm_t = budgetdetail_rfq_itms[i];
              var Account_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[2]
              }) || '@NONE@';
              var Department_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[5]
              }) || '@NONE@';
              var Class_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[6]
              }) || '@NONE@';
              var Location_to_check = budgetdetail_rfq_itm_t.getValue({
                name: budgetdetail_rfq_itmset.columns[7]
              }) || '@NONE@';
              if ((Department == Department_to_check) &&
                (Class == Class_to_check) &&
                (Location == Location_to_check)) {
                budgetdetail_rfq_itm.push(budgetdetail_rfq_itm_t);
                break;
              }
            }
            log.debug('budgetdetail_rfq_exp2', budgetdetail_rfq_itm);

            updateBudgetDetail(budgetdetail_rfq_exp, budgetdetail_rfq_expset,
              budgetdetail_rfq_itm, budgetdetail_rfq_itmset,
              BudgetId, BudgetYear, BudgetPeriod, BudgetPeriodText, account, account_text,
              Department, Class, Location);
          }

        }
        //update status pr
        if (rectype == 'purchaserequisition') {

          var pr_status = rec.getValue('custbody_abj_afc_pr_status');
          if ((pr_status == 'Partially Sourced') ||
            (pr_status == 'Pending Sourcing') ||
            (pr_status == 'Fully Sourced')) {
            var pr_internal_id = id;
            pr_data_to_update = record.load({
              type: 'purchaserequisition',
              id: pr_internal_id,
              isDynamic: true
            });

            var pr_cek_order_complete = search.create({
              type: 'purchaserequisition',
              columns: ['internalid'],
              filters: [{
                  name: 'internalid',
                  operator: 'is',
                  values: pr_internal_id
                },
                {
                  name: 'mainline',
                  operator: 'is',
                  values: false
                },
                {
                  name: 'custcolafc_pr_rfq_no',
                  operator: 'is',
                  values: '@NONE@'
                },
              ]
            }).run().getRange({
              start: 0,
              end: 1
            });

            log.debug("pr_cek_order_complete", pr_cek_order_complete);
            pr_status = 'Fully Sourced';
            if (pr_cek_order_complete.length > 0)
              pr_status = 'Partially Sourced';

            log.debug("pr_status", pr_status);
            pr_data_to_update.setValue({
              fieldId: 'custbody_abj_afc_pr_status',
              value: pr_status,
              ignoreFieldChange: true
            });

            pr_internal_id = pr_data_to_update.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            log.debug("update pr status", pr_internal_id);
          }
        }

        var scriptObj = runtime.getCurrentScript();
        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });
      } catch (e) {
        log.debug("Error in After Submit PR_PO", e.name + ' : ' + e.message);
      }
    }

    return {
      beforeLoad: beforeLoad,
      afterSubmit: afterSubmit,
      beforeSubmit: beforeSubmit,
    };

  });