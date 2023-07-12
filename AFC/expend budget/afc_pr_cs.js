/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 * Created By: Rangga
 * Date 12/07/2022
 */

define(['N/currentRecord', 'N/record', 'N/search', 'N/runtime', 'N/ui/dialog', ],
  function(currentRecord, record, search, runtime, dialog) {
    var exports = {}

    function numberWithCommas(x) {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
      return x;

    }

    function roundToTwo(num) {
      return +(Math.round(num + "e+2") + "e-2");
    }

    function GetBudgetDetail(budgetalreadyconsumes, budgetalreadyconsumeset, budgetactualamounts,
      budgetactualamountset, BudgetId, BudgetYear, BudgetPeriod, BudgetPeriodText, BudgetAcount, tranid,
      budgetdetail_rfq_itms, budgetdetail_rfq_itmset,
      budgetdetail_rfq_exps, budgetdetail_rfq_expset) {

      try {
        log.debug("DEBUG", "Get Budget Detail");
        log.debug("BudgetId", BudgetId);
        log.debug("BudgetAcount", BudgetAcount);
        var BudgetDetail = search.create({
          type: 'customrecord_abj_budgetdetails',
          columns: ['internalid']
        });

        BudgetDetail.filters.push(search.createFilter({
          name: 'custrecord_abj_budgetheader',
          operator: search.Operator.IS,
          values: BudgetId
        }, ));

        BudgetDetail.filters.push(search.createFilter({
          name: 'custrecord_abj_det_account',
          operator: search.Operator.IS,
          values: BudgetAcount
        }, ));

        var budgetdetailset = BudgetDetail.run();
        BudgetDetail = budgetdetailset.getRange(0, 1);
        log.debug("BudgetDetail To Get", BudgetDetail);

        var budgettoconsume = 0;
        if (BudgetDetail.length > 0) {
          var BudgetDetailId = BudgetDetail[0].getValue({
            name: 'internalid'
          });
          log.debug("BudgetDetailId", BudgetDetailId);
          log.debug("BudgetAcount", BudgetAcount);
          if (BudgetDetailId) {
            var recBudgetDetail = record.load({
              type: 'customrecord_abj_budgetdetails',
              id: BudgetDetailId,
              isDynamic: false
            });
            log.debug("recBudgetDetail", recBudgetDetail);
            var commitamount = Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_jancommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_febcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_marcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_aprcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_maycommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_juncommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_julcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_augcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_sepcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_octcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_novcommit'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_deccommit'
              }) || 0);
            log.debug("commitamount", commitamount);
            var budgetamount = Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_janbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_febbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_marbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_aprbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_maybudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_junbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_julbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_augbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_sepbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_octbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_novbudget'
              }) || 0) +
              Number(recBudgetDetail.getValue({
                fieldId: 'custrecord_abj_det_decbudget'
              }) || 0);
            log.debug("budgetamount", budgetamount);
            budgettoconsume = budgetamount - commitamount;

            for (var i in budgetactualamounts) {
              var budgetactualamount = budgetactualamounts[i];
              var acct_actual = budgetactualamount.getValue({
                name: budgetactualamountset.columns[1]
              });
              if (acct_actual == BudgetAcount) {
                var bdg_actual_amnt = Number(budgetactualamount.getValue({
                  name: budgetactualamountset.columns[2]
                }));
                log.debug("bdg_actual_amnt", bdg_actual_amnt);
                budgettoconsume -= bdg_actual_amnt;
                log.debug("budgettoconsume actual", budgettoconsume);
                break;
              }
            }

            if (tranid) {
              for (var i in budgetalreadyconsumes) {
                var budgetalreadyconsume = budgetalreadyconsumes[i];
                var acct_item = budgetalreadyconsume.getValue({
                  name: budgetalreadyconsumeset.columns[1]
                });
                if (acct_item == BudgetAcount) {
                  budgettoconsume += Number(budgetalreadyconsume.getValue({
                    name: budgetalreadyconsumeset.columns[4]
                  }));
                  log.debug("budgettoconsume budgetalreadyconsumes", budgettoconsume);
                  break;
                }
              }
            }

            if (budgetdetail_rfq_itms) {
              for (var i in budgetdetail_rfq_itms) {
                var budgetdetail_item = budgetdetail_rfq_itms[i];
                var acct_item = budgetdetail_item.getValue({
                  name: budgetdetail_rfq_itmset.columns[1]
                });
                if (acct_item == BudgetAcount) {
                  budgettoconsume += Number(budgetdetail_item.getValue({
                    name: budgetdetail_rfq_itmset.columns[4]
                  }));
                  break;
                }
              }
            }

            if (budgetdetail_rfq_exps) {
              for (var i in budgetdetail_rfq_exps) {
                var budgetdetail_exp = budgetdetail_rfq_exps[i];
                var acct_item = budgetdetail_exp.getValue({
                  name: budgetdetail_rfq_expset.columns[1]
                });
                if (acct_item == BudgetAcount) {
                  budgettoconsume += Number(budgetdetail_exp.getValue({
                    name: budgetdetail_rfq_expset.columns[4]
                  }));
                  break;
                }
              }
            }

          }
        }
      } catch (e) {
        log.debug("Error in Get Budget Detail", e.name + ' : ' + e.message);
      }
      return budgettoconsume;
    }

    function saveRecord(context) {
      var rec = context.currentRecord;
      var rectype = rec.type;
      var returnvar = false;
      log.debug("rectype save record parent", rectype);
      if (rectype == 'customrecord_abj_rfq') {
        log.debug('save RFQ');
        returnvar = saveRecord_rfq(context);
      } else {
        log.debug('save pr po');
        returnvar = saveRecord_pr_po(context);
      }
      return returnvar;
    }

    function validateLine(context) {
      try {
        var rec = context.currentRecord;
        var rectype = rec.type;
        if (rectype == "purchaserequisition") {
          var sublistName = context.sublistId;
          //var sublistFieldName = context.fieldId;
          //if (((sublistName == 'item')&&(sublistFieldName == 'item'))
          //	||((sublistName == 'expense')&&(sublistFieldName == 'category'))) {
          log.debug("sublistName", sublistName);
          if (sublistName == 'item') {
            log.debug("field change", rectype);
            //log.debug("sublistFieldName",sublistFieldName);
            var department = rec.getValue('department');
            var classs = rec.getValue('class');
            var location = rec.getValue('location');
            log.debug("field department", department);
            log.debug("field classs", classs);
            log.debug("field location", location);
            var dept_inline = rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'department',
            }) || '';
            if ((department) && (!dept_inline))
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'department',
                value: department,
                ignoreFieldChange: true
              });
            var classs_inline = rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'class',
            }) || '';
            if ((classs) && (!classs_inline))
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'class',
                value: classs,
                ignoreFieldChange: true
              });
          }
          if ((sublistName == 'item') || (sublistName == 'expense')) {
            var estimatedAmnt = rec.getCurrentSublistValue({
              sublistId: sublistName,
              fieldId: 'estimatedamount',
            }) || 0;
            if (!estimatedAmnt) {
              var alert_estamnt_cant_empty = {
                title: 'Estimated Amount Validation',
                message: "Please specify Estimated Amount"
              };
              dialog.alert(alert_estamnt_cant_empty);
              return false;
            }
          }
        }
        return true;
      } catch (e) {
        log.debug("Error in validate line", e.name + ' : ' + e.message);
      }
    }

    function fieldChanged(context) {
      try {
        var rec = context.currentRecord;
        var rectype = rec.type;
        if (rectype == "purchaserequisition") {
          var sublistName = context.sublistId;
          var sublistFieldName = context.fieldId;
          if (((sublistName == 'item') && (sublistFieldName == 'item')) ||
            ((sublistName == 'expense') && (sublistFieldName == 'category'))) {
            log.debug("field change", rectype);
            log.debug("sublistFieldName", sublistFieldName);
            log.debug("sublistName", sublistName);
            var department = rec.getValue('department');
            var classs = rec.getValue('class');
            var location = rec.getValue('location');
            var project = rec.getValue('custbody_abj_po_proj_name');
            log.debug("field department", department);
            log.debug("field classs", classs);
            log.debug("field location", location);
            if (department)
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'department',
                value: department,
                ignoreFieldChange: true
              });
            if (classs)
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'class',
                value: classs,
                ignoreFieldChange: true
              });
            if (location)
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'location',
                value: location,
                ignoreFieldChange: true
              });
            if (project)
              rec.setCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'customer',
                value: project,
                ignoreFieldChange: true
              });
          }

        }
        return true;
      } catch (e) {
        log.debug("Error in line init", e.name + ' : ' + e.message);
      }
    }

    function saveRecord_rfq(context) {

      var rec = context.currentRecord;
      var rectype = rec.type;
      var recid = rec.id;
      try {
        log.debug(rectype);
        var BudgetYear = rec.getValue('custrecordabj_budyear_tran');
        var BudgetYear_text = rec.getText('custrecordabj_budyear_tran');
        var BudgetPeriod = rec.getValue('custrecord_abj_budperiod_tran');
        var Subsidiary = rec.getValue('custrecord_abj_rfq_subsidiary');
        var RFQType = rec.getText('custrecord_abj_rfq_type');
        log.debug("RFQType", RFQType);
        if (RFQType == 'RFI')
          return true;

        var list_segment = [];
        var Department;
        var Department_text;

        var Class;
        var Class_text;

        var Location;
        var Location_text;
        var item;
        var itemtext;
        var account;
        var accounttext;
        var amount;
        var list_account = [];
        var list_department = [];
        var list_location = [];
        var list_class = [];
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
          var lineTotal = rec.getLineCount({
            sublistId: vsublistid
          });
          for (var i = 0; i < lineTotal; i++) {
            var excludeBudget = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_exclude_budget',
              line: i
            }) || false;
            log.debug("excludeBudget", excludeBudget);
            if (!excludeBudget) {
              Department = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_dept',
                line: i
              });
              Department_text = rec.getSublistText({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_dept',
                line: i
              });
              Class = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_class',
                line: i
              });
              Class_text = rec.getSublistText({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_class',
                line: i
              });
              Location = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_location',
                line: i
              });
              Location_text = rec.getSublistText({
                sublistId: vsublistid,
                fieldId: 'custrecord_abj_rfq_' + fieldsegment + '_location',
                line: i
              });
              log.debug("Location", Location);
              log.debug("Location_text", Location_text);

              amount = Number(rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: fieldidamount,
                line: i
              }));
              if (!Department) Department = '@NONE@';
              if (!Class) Class = '@NONE@';
              if (!Location) Location = '@NONE@';
              if (counter == 0) {
                item = rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'item',
                  line: i
                });
                itemtext = rec.getSublistText({
                  sublistId: vsublistid,
                  fieldId: 'item',
                  line: i
                });
                account = rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'custrecord_abj_rfq_item_account',
                  line: i
                });
                accounttext = rec.getSublistText({
                  sublistId: vsublistid,
                  fieldId: 'custrecord_abj_rfq_item_account',
                  line: i
                });
              } else {
                account = rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'custrecord_abj_rfq_exp_acct',
                  line: i
                });
                accounttext = rec.getSublistText({
                  sublistId: vsublistid,
                  fieldId: 'custrecord_abj_rfq_exp_acct',
                  line: i
                });
                item = account;
                itemtext = accounttext;
              }

              if (list_segment.length === 0) {
                list_segment.push({
                  Department: Department,
                  Class: Class,
                  Location: Location,
                  Department_text: Department_text,
                  Class_text: Class_text,
                  Location_text: Location_text,
                  Account: account,
                  accounttext: accounttext,
                  item: item,
                  itemtext: itemtext,
                  amount: amount
                })
              } else {
                var ceklist_segment = null;
                for (var index = 0; index < list_segment.length; index++) {
                  if ((list_segment[index].Account === account) &&
                    (list_segment[index].Department === Department) &&
                    (list_segment[index].Class === Class) &&
                    (list_segment[index].Location === Location)) {
                    ceklist_segment = index;
                  }
                }
                if (ceklist_segment !== null) {
                  list_segment[ceklist_segment].amount = Number(list_segment[ceklist_segment].amount) + amount;
                } else {
                  list_segment.push({
                    Department: Department,
                    Class: Class,
                    Location: Location,
                    Department_text: Department_text,
                    Class_text: Class_text,
                    Location_text: Location_text,
                    Account: account,
                    accounttext: accounttext,
                    item: item,
                    itemtext: itemtext,
                    amount: amount
                  });
                }
              }
              list_account.push(account);
              list_department.push(Department);
              list_class.push(Class);
              list_location.push(Location);
            }
          }
        }

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

        if (list_account.length > 0 && list_department.length > 0 && list_class.length > 0 && list_location.length > 0) {
          list_account = remove_duplicates_in_list(list_account);
          list_department = remove_duplicates_in_list(list_department);
          list_class = remove_duplicates_in_list(list_class);
          list_location = remove_duplicates_in_list(list_location);

          log.debug("list_account", list_account);
          log.debug("list_department", list_department);
          log.debug("list_class", list_class);
          log.debug("list_location", list_location);

          log.debug("list_segment", list_segment);

          log.debug("BudgetYear", BudgetYear);
          log.debug("BudgetPeriod", BudgetPeriod);
          //var budgetalreadyconsume_ori = search.load({id : 'customsearchafc_pr_budget_amount_yearly'});
          var alertText = '';

          var Budgets = search.create({
            type: 'customrecord_abj_budget_ui',
            columns: ['internalid', 'custrecord_abj_department', 'custrecord_abj_bsegment',
              'custrecord_abj_budlocation'
            ],
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
          log.debug('Budgets', Budgets);

          /*var budgetalreadyconsumes;
          var budgetalreadyconsumeset;
          if (recid) {
          	budgetalreadyconsumes = search.load({id : 'customsearchafc_pr_budget_amount_yearly'});
          	budgetalreadyconsumes.filters.push(search.createFilter(
          		{name: 'account',operator: search.Operator.IS, values: account},
          		));
          	budgetalreadyconsumes.filters.push(search.createFilter(
          		{name: 'custbody_abj_budyear_tran',operator: search.Operator.IS,values: BudgetYear},
          	));
          	budgetalreadyconsumes.filters.push(search.createFilter(
          			{name: 'internalid',operator: search.Operator.IS,values: recid},
          	));
          	budgetalreadyconsumes.filters.push(search.createFilter(
          			{name: 'type',operator: search.Operator.IS,values: searchrectype},
          	));
          	var budgetalreadyconsumeset = budgetalreadyconsumes.run();
          	budgetalreadyconsumes = budgetalreadyconsumeset.getRange(0, 100);
          	log.debug("budgetalreadyconsumes", budgetalreadyconsumes);
          }*/
          var budgetdetail_rfq_exps;
          var budgetdetail_rfq_expset;
          var budgetdetail_rfq_itms;
          var budgetdetail_rfq_itmset;
          if (recid) {
            budgetdetail_rfq_exps = search.load({
              id: 'customsearchafc_rfq_budget_amount_exp',
            });
            budgetdetail_rfq_exps.filters.push(search.createFilter({
              name: 'internalid',
              operator: search.Operator.IS,
              values: recid
            }));

            budgetdetail_rfq_expset = budgetdetail_rfq_exps.run();
            budgetdetail_rfq_exps = budgetdetail_rfq_expset.getRange(0, 100);

            budgetdetail_rfq_itms = search.load({
              id: 'customsearchafc_rfq_budget_amount_item'
            });

            budgetdetail_rfq_itms.filters.push(search.createFilter({
              name: 'internalid',
              operator: search.Operator.IS,
              values: recid
            }, ));

            budgetdetail_rfq_itmset = budgetdetail_rfq_itms.run();
            budgetdetail_rfq_itms = budgetdetail_rfq_itmset.getRange(0, 100);
            log.debug('budgetdetail_rfq_itm0', budgetdetail_rfq_itms);
          }

          var budgetactualamounts = search.load({
            id: 'customsearchafc_budget_actual_amount'
          });
          budgetactualamounts.filters.push(search.createFilter({
            name: 'account',
            operator: search.Operator.ANYOF,
            values: list_account
          }));

          var yearbudget = BudgetYear_text.slice(-4);
          log.debug("yearbudget", yearbudget);
          const formula_year = "SUBSTR({postingperiod},LENGTH({postingperiod})-3,4)";
          budgetactualamounts.filters.push(search.createFilter({
            name: "FORMULATEXT",
            formula: formula_year,
            operator: search.Operator.IS,
            values: yearbudget
          }, ));

          budgetactualamounts.filters.push(search.createFilter({
            name: 'department',
            operator: search.Operator.ANYOF,
            values: list_department
          }, ));
          budgetactualamounts.filters.push(search.createFilter({
            name: 'class',
            operator: search.Operator.ANYOF,
            values: list_class
          }, ));
          budgetactualamounts.filters.push(search.createFilter({
            name: 'location',
            operator: search.Operator.ANYOF,
            values: list_location
          }, ));

          var budgetactualamountset = budgetactualamounts.run();
          budgetactualamounts = budgetactualamountset.getRange(0, 100);
          log.debug("budgetactualamounts1", budgetactualamounts);


          for (var idx in list_segment) {

            var segment = list_segment[idx];
            Department = segment.Department;
            Class = segment.Class;
            Location = segment.Location;
            account = segment.Account;
            item = segment.item;

            Department_text = segment.Department_text;
            Class_text = segment.Class_text;
            Location_text = segment.Location_text;
            accounttext = segment.accounttext;
            itemtext = segment.itemtext;
            amount = segment.amount;

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
              var budgetalreadyconsume = [];
              var budgetalreadyconsumeset;
              /*for (var i in budgetalreadyconsumes) {
              	var budgetalreadyconsume_t = budgetalreadyconsumes[i];
              	var Department_to_check = budgetalreadyconsume_t.getValue({name: budgetalreadyconsumeset.columns[5]})||'@NONE@';
              	var Class_to_check = budgetalreadyconsume_t.getValue({name: budgetalreadyconsumeset.columns[6]})||'@NONE@';
              	var Location_to_check = budgetalreadyconsume_t.getValue({name: budgetalreadyconsumeset.columns[8]})||'@NONE@';
              	if ((Department==Department_to_check)
              		&&(Class==Class_to_check)
              		&&(Location==Location_to_check)) {
              		budgetalreadyconsume.push(budgetalreadyconsume_t);
              		break;
              	}
              }*/
              log.debug('budgetalreadyconsume2', budgetalreadyconsume);

              var budgetactualamount = [];
              for (var i in budgetactualamounts) {
                var budgetactualamount_t = budgetactualamounts[i];
                var Department_to_check = budgetactualamount_t.getValue({
                  name: budgetactualamountset.columns[5]
                }) || '@NONE@';
                var Class_to_check = budgetactualamount_t.getValue({
                  name: budgetactualamountset.columns[6]
                }) || '@NONE@';
                var Location_to_check = budgetactualamount_t.getValue({
                  name: budgetactualamountset.columns[7]
                }) || '@NONE@';
                log.debug('Department_to_check', Department_to_check);
                log.debug('Class_to_check', Class_to_check);
                log.debug('Location_to_check', Location_to_check);
                if ((Department == Department_to_check) &&
                  (Class == Class_to_check) &&
                  (Location == Location_to_check)) {
                  budgetactualamount.push(budgetactualamount_t);
                  break;
                }
              }
              log.debug('budgetactualamount2', budgetactualamount);

              var budgetToConsume = GetBudgetDetail(
                budgetalreadyconsume, budgetalreadyconsumeset,
                budgetactualamount, budgetactualamountset,
                BudgetId, BudgetYear, BudgetPeriod, BudgetPeriodText, account, recid,
                budgetdetail_rfq_itms, budgetdetail_rfq_itmset,
                budgetdetail_rfq_exps, budgetdetail_rfq_expset
              );

              var amountToCheck = amount;

              if (roundToTwo(amountToCheck) > roundToTwo(budgetToConsume)) {

                alertText += "Total amount in account: ''" + accounttext + "''" +
                  "', Item: ''" + itemtext;
                if (Department_text)
                  alertText += "', Department: ''" + Department_text;
                if (Location_text)
                  alertText += "', Location: ''" + Location_text;
                if (Class_text)
                  alertText += "', Class: ''" + Class_text;
                alertText += "'' is " +
                  numberWithCommas(parseFloat(amountToCheck).toFixed(2)) +
                  ", Remaining budget amount " + numberWithCommas(parseFloat(budgetToConsume).toFixed(2)) + "\r\n";
              }
              if (alertText !== "") {
                window.alert(alertText);
                return false;
              }

            } else {
              window.alert('No valid budget found for the combination below,' +
                'please check the Budget Year, Budget period, Class, Department, Item, or Location');
              return false;
            }
          }
        }
        var scriptObj = runtime.getCurrentScript();
        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });
        return true;
      } catch (e) {
        log.debug("Error in Save RFQ", e.name + ' : ' + e.message);
      }
    }

    function saveRecord_pr_po(context) {

      var rec = context.currentRecord;
      var rectype = rec.type;
      var recid = rec.id;
      var ispurchaseorder = (rectype == "purchaseorder");
      var ispurchaserequisition = (rectype == "purchaserequisition");
      try {
        log.debug(rectype);
        var BudgetYear = rec.getValue('custbody_abj_budyear_tran');
        var BudgetYear_text = rec.getText('custbody_abj_budyear_tran');
        var BudgetPeriod = rec.getValue('custbody_abj_budperiod_tran');
        var Subsidiary = rec.getValue('subsidiary');
        var ExchangeRate = rec.getValue('exchangerate');

        var list_segment = [];
        var Department;
        var Department_text;

        var Class;
        var Class_text;

        var Location;
        var Location_text;
        var item;
        var itemtext;
        var account;
        var accounttext;
        var amount;
        var list_account = [];
        var list_department = [];
        var list_location = [];
        var list_class = [];
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
            var excludeBudget = rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custcol_abj_po_exclude_from_budget',
              line: i
            }) || false;
            log.debug("excludeBudget", excludeBudget);
            if (!excludeBudget) {
              Department = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'department',
                line: i
              });
              Department_text = rec.getSublistText({
                sublistId: vsublistid,
                fieldId: 'department',
                line: i
              });
              Class = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'class',
                line: i
              });
              Class_text = rec.getSublistText({
                sublistId: vsublistid,
                fieldId: 'class',
                line: i
              });
              Location = rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: 'location',
                line: i
              });
              Location_text = rec.getSublistText({
                sublistId: vsublistid,
                fieldId: 'location',
                line: i
              });
              log.debug("Location", Location);
              log.debug("Location_text", Location_text);

              var fieldidamount = 'estimatedamount'
              if (ispurchaseorder) {
                fieldidamount = 'amount';
              }
              amount = Number(rec.getSublistValue({
                sublistId: vsublistid,
                fieldId: fieldidamount,
                line: i
              }));
              if (!Department) Department = '@NONE@';
              if (!Class) Class = '@NONE@';
              if (!Location) Location = '@NONE@';
              if (counter == 0) {
                item = rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'item',
                  line: i
                });
                itemtext = rec.getSublistText({
                  sublistId: vsublistid,
                  fieldId: 'item',
                  line: i
                });
                account = rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'custcol_abj_item_expacct',
                  line: i
                });
                accounttext = rec.getSublistText({
                  sublistId: vsublistid,
                  fieldId: 'custcol_abj_item_expacct',
                  line: i
                });
              } else {
                account = rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'account',
                  line: i
                });
                accounttext = rec.getSublistText({
                  sublistId: vsublistid,
                  fieldId: 'account',
                  line: i
                });
                item = account;
                itemtext = accounttext;
              }

              if (list_segment.length === 0) {
                list_segment.push({
                  Department: Department,
                  Class: Class,
                  Location: Location,
                  Department_text: Department_text,
                  Class_text: Class_text,
                  Location_text: Location_text,
                  Account: account,
                  accounttext: accounttext,
                  item: item,
                  itemtext: itemtext,
                  amount: amount
                })
              } else {
                var ceklist_segment = null;
                for (var index = 0; index < list_segment.length; index++) {
                  if ((list_segment[index].Account === account) &&
                    (list_segment[index].Department === Department) &&
                    (list_segment[index].Class === Class) &&
                    (list_segment[index].Location === Location)) {
                    ceklist_segment = index;
                  }
                }
                if (ceklist_segment !== null) {
                  list_segment[ceklist_segment].amount = Number(list_segment[ceklist_segment].amount) + amount;
                } else {
                  list_segment.push({
                    Department: Department,
                    Class: Class,
                    Location: Location,
                    Department_text: Department_text,
                    Class_text: Class_text,
                    Location_text: Location_text,
                    Account: account,
                    accounttext: accounttext,
                    item: item,
                    itemtext: itemtext,
                    amount: amount
                  });
                }
              }
              list_account.push(account);
              list_department.push(Department);
              list_class.push(Class);
              list_location.push(Location);
            }
          }
        }

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
        if (list_account.length > 0 && list_department.length > 0 && list_class.length > 0 && list_location.length > 0) {
          list_account = remove_duplicates_in_list(list_account);
          list_department = remove_duplicates_in_list(list_department);
          list_class = remove_duplicates_in_list(list_class);
          list_location = remove_duplicates_in_list(list_location);

          log.debug("list_account", list_account);
          log.debug("list_department", list_department);
          log.debug("list_class", list_class);
          log.debug("list_location", list_location);

          log.debug("list_segment", list_segment);

          log.debug("BudgetYear", BudgetYear);
          log.debug("BudgetPeriod", BudgetPeriod);
          var searchrectype = 'PurchReq';
          if (ispurchaseorder) {
            searchrectype = 'PurchOrd';
          }
          //var budgetalreadyconsume_ori = search.load({id : 'customsearchafc_pr_budget_amount_yearly'});
          var alertText = '';

          var Budgets = search.create({
            type: 'customrecord_abj_budget_ui',
            columns: ['internalid', 'custrecord_abj_department', 'custrecord_abj_bsegment',
              'custrecord_abj_budlocation'
            ],
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
          log.debug('Budgets', Budgets);

          var budgetalreadyconsumes;
          var budgetalreadyconsumeset;
          if (recid) {
            budgetalreadyconsumes = search.load({
              id: 'customsearchafc_pr_budget_amount_yearly'
            });
            //budgetalreadyconsumes.filters.push(search.createFilter(
            //		{name: 'account',operator: search.Operator.ANYOF, values: list_account},
            //	));
            budgetalreadyconsumes.filters.push(search.createFilter({
              name: 'custbody_abj_budyear_tran',
              operator: search.Operator.IS,
              values: BudgetYear
            }, ));
            budgetalreadyconsumes.filters.push(search.createFilter({
              name: 'internalid',
              operator: search.Operator.IS,
              values: recid
            }, ));
            budgetalreadyconsumes.filters.push(search.createFilter({
              name: 'type',
              operator: search.Operator.IS,
              values: searchrectype
            }, ));
            var budgetalreadyconsumeset = budgetalreadyconsumes.run();
            budgetalreadyconsumes = budgetalreadyconsumeset.getRange(0, 100);
            log.debug("budgetalreadyconsumes", budgetalreadyconsumes);
          }

          var budgetactualamounts = search.load({
            id: 'customsearchafc_budget_actual_amount'
          });
          budgetactualamounts.filters.push(search.createFilter({
            name: 'account',
            operator: search.Operator.ANYOF,
            values: list_account
          }));

          var yearbudget = BudgetYear_text.slice(-4);
          log.debug("yearbudget", yearbudget);
          const formula_year = "SUBSTR({postingperiod},LENGTH({postingperiod})-3,4)";
          budgetactualamounts.filters.push(search.createFilter({
            name: "FORMULATEXT",
            formula: formula_year,
            operator: search.Operator.IS,
            values: yearbudget
          }, ));

          budgetactualamounts.filters.push(search.createFilter({
            name: 'department',
            operator: search.Operator.ANYOF,
            values: list_department
          }, ));
          budgetactualamounts.filters.push(search.createFilter({
            name: 'class',
            operator: search.Operator.ANYOF,
            values: list_class
          }, ));
          budgetactualamounts.filters.push(search.createFilter({
            name: 'location',
            operator: search.Operator.ANYOF,
            values: list_location
          }, ));

          var budgetactualamountset = budgetactualamounts.run();
          budgetactualamounts = budgetactualamountset.getRange(0, 100);
          log.debug("budgetactualamounts1", budgetactualamounts);


          for (var idx in list_segment) {
            //var budgetalreadyconsume= budgetalreadyconsume_ori;
            //var budgetactualamount= budgetactualamount_ori;
            //var Budget= JSON.stringify(Budget_ori);

            var segment = list_segment[idx];
            Department = segment.Department;
            Class = segment.Class;
            Location = segment.Location;
            account = segment.Account;
            item = segment.item;

            Department_text = segment.Department_text;
            Class_text = segment.Class_text;
            Location_text = segment.Location_text;
            accounttext = segment.accounttext;
            itemtext = segment.itemtext;
            amount = segment.amount;

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
              var budgetalreadyconsume = [];
              for (var i in budgetalreadyconsumes) {
                var budgetalreadyconsume_t = budgetalreadyconsumes[i];
                var Department_to_check = budgetalreadyconsume_t.getValue({
                  name: budgetalreadyconsumeset.columns[5]
                }) || '@NONE@';
                var Class_to_check = budgetalreadyconsume_t.getValue({
                  name: budgetalreadyconsumeset.columns[6]
                }) || '@NONE@';
                var Location_to_check = budgetalreadyconsume_t.getValue({
                  name: budgetalreadyconsumeset.columns[8]
                }) || '@NONE@';
                if ((Department == Department_to_check) &&
                  (Class == Class_to_check) &&
                  (Location == Location_to_check)) {
                  budgetalreadyconsume.push(budgetalreadyconsume_t);
                  break;
                }
              }
              log.debug('budgetalreadyconsume2', budgetalreadyconsume);

              var budgetactualamount = [];
              for (var i in budgetactualamounts) {
                var budgetactualamount_t = budgetactualamounts[i];
                var Department_to_check = budgetactualamount_t.getValue({
                  name: budgetactualamountset.columns[5]
                }) || '@NONE@';
                var Class_to_check = budgetactualamount_t.getValue({
                  name: budgetactualamountset.columns[6]
                }) || '@NONE@';
                var Location_to_check = budgetactualamount_t.getValue({
                  name: budgetactualamountset.columns[7]
                }) || '@NONE@';
                log.debug('Department_to_check', Department_to_check);
                log.debug('Class_to_check', Class_to_check);
                log.debug('Location_to_check', Location_to_check);
                if ((Department == Department_to_check) &&
                  (Class == Class_to_check) &&
                  (Location == Location_to_check)) {
                  budgetactualamount.push(budgetactualamount_t);
                  break;
                }
              }
              log.debug('budgetactualamount2', budgetactualamount);

              var budgetToConsume = GetBudgetDetail(
                budgetalreadyconsume, budgetalreadyconsumeset,
                budgetactualamount, budgetactualamountset,
                BudgetId, BudgetYear, BudgetPeriod, BudgetPeriodText, account, recid,
                null, null, null, null);

              var amountToCheck = amount * ExchangeRate;

              if (roundToTwo(amountToCheck) > roundToTwo(budgetToConsume)) {

                alertText += "Total amount in account: ''" + accounttext + "''" +
                  "', Item: ''" + itemtext;
                if (Department_text)
                  alertText += "', Department: ''" + Department_text;
                if (Location_text)
                  alertText += "', Location: ''" + Location_text;
                if (Class_text)
                  alertText += "', Class: ''" + Class_text;
                alertText += "'' is " +
                  numberWithCommas(parseFloat(amountToCheck).toFixed(2)) +
                  ", Remaining budget amount " + numberWithCommas(parseFloat(budgetToConsume).toFixed(2)) + "\r\n";
              }
              if (alertText !== "") {
                window.alert(alertText);
                return false;
              }

            } else {
              window.alert('No valid budget found for the combination below,' +
                'please check the Budget Year, Budget period, Class, Department, Item, or Location');
              return false;
            }
          }
        }
        var scriptObj = runtime.getCurrentScript();
        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });
        return true;
      } catch (e) {
        log.debug("Error in Save Record", e.name + ' : ' + e.message);
      }
    }

    exports.saveRecord = saveRecord;
    exports.validateLine = validateLine;
    exports.fieldChanged = fieldChanged;
    return exports;
  })