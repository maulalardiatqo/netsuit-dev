/**
 * Copyright (c) 2018 Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "../../common/constants/Constants", "../gateway/PurchaseBudgetFieldsGateway", "../usecase/PurchaseBudgetFieldsUseCase", "N/ui/serverWidget", "N/record", "N/search"], function (_exports, _Constants, _PurchaseBudgetFieldsGateway, _PurchaseBudgetFieldsUseCase, _serverWidget, N_record, N_search) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports._hideBudgetFields = _hideBudgetFields;
  _exports.beforeLoad = void 0;
  _PurchaseBudgetFieldsGateway = _interopRequireDefault(_PurchaseBudgetFieldsGateway);
  _PurchaseBudgetFieldsUseCase = _interopRequireDefault(_PurchaseBudgetFieldsUseCase);
  N_record = _interopRequireWildcard(N_record);
  N_search = _interopRequireWildcard(N_search);

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var __spreadArrays = void 0 && (void 0).__spreadArrays || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) {
      s += arguments[i].length;
    }

    for (var r = Array(s), k = 0, i = 0; i < il; i++) {
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) {
        r[k] = a[j];
      }
    }

    return r;
  };

  function _createPurchaseBudgetFieldsGateway() {
    return new _PurchaseBudgetFieldsGateway["default"]({
      'dependencies': {
        'N/record': N_record,
        'N/search': N_search
      },
      'constants': _Constants.Constants
    });
  }

  function _createPurchaseBudgetFieldsUseCase() {
    return new _PurchaseBudgetFieldsUseCase["default"]({
      'dependencies': {
        AlterBudgetFieldsGateway: _createPurchaseBudgetFieldsGateway()
      }
    });
  } // method to hide Budget Line Fields


  function _hideBudgetFields(list, form, budgetBodyFields, budgetLineFields) {
    // Hiding Body Fields
    budgetBodyFields.forEach(function (budgetBodyField) {
      form.getField(budgetBodyField).updateDisplayType({
        displayType: _serverWidget.FieldDisplayType.HIDDEN
      });
    }); // Hiding Line Fields

    budgetLineFields.forEach(function (budgetLineField) {
      var field = list === null || list === void 0 ? void 0 : list.getField({
        id: budgetLineField
      });

      if (JSON.stringify(field) !== '{}' && field) {
        field.updateDisplayType({
          displayType: _serverWidget.FieldDisplayType.HIDDEN
        });
      }
    });
  }

  var beforeLoad = function beforeLoad(context) {
    var form = context.form;
    var type = context.type;
    var _a = context.UserEventType,
        PRINT = _a.PRINT,
        EMAIL = _a.EMAIL;
    var newRecord = context.newRecord;
    var expSublist = form.getSublist({
      id: 'expense'
    });
    var itemSublist = form.getSublist({
      id: 'item'
    });

    var useCase = _createPurchaseBudgetFieldsUseCase();

    var prefRecord = useCase.getBudgetPreferenceRecord(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.ID);
    var arrBodyFields = [_Constants.Constants.TRAN_BODY_FIELDS.BUDGET_DATE, _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_PERIOD, _Constants.Constants.TRAN_BODY_FIELDS.LAST_BUDGET_CHECK, _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_STATUS_MESSAGE];
    var arrLineFields = [_Constants.Constants.TRAN_LINE_FIELDS.BUDGET_CTRL_LINK, _Constants.Constants.TRAN_LINE_FIELDS.BUDGET_AMOUNT, _Constants.Constants.TRAN_LINE_FIELDS.BUDGET_WARNING, _Constants.Constants.TRAN_LINE_FIELDS.ACTUAL_AMOUNT];

    var arrLineItemFields = __spreadArrays([_Constants.Constants.TRAN_LINE_FIELDS.ITEM_ACCOUNT], arrLineFields);

    var PREF_ENABLE_BUDGET = _Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.PREF_ENABLE_BUDGET;
    var PURCHASE_REQUISITION = N_record.Type.PURCHASE_REQUISITION;
    var isReqType = newRecord.type === PURCHASE_REQUISITION;
    /* (If Budget validation in preference is not enabled or if the record type is Purchase requisition ) and context type is not print[pdf] and email
     then hide all the budget fields in the form
     */

    if ((!prefRecord.getValue(PREF_ENABLE_BUDGET)) && type !== PRINT && type !== EMAIL) {
      expSublist ? _hideBudgetFields(expSublist, form, arrBodyFields, arrLineFields) : _hideBudgetFields(itemSublist, form, arrBodyFields, arrLineFields);

      if (itemSublist) {
        _hideBudgetFields(itemSublist, form, arrBodyFields, arrLineItemFields);
      }
    }
  };

  _exports.beforeLoad = beforeLoad;
});