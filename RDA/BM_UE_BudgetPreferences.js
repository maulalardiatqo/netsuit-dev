/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "N/search", "N/record", "../useCase/BudgetPreferencesUseCase", "../gateway/BudgetPreferencesGateway", "../../common/constants/Constants", "N/translation", "N/runtime"], function (_exports, search, record, _BudgetPreferencesUseCase, _BudgetPreferencesGateway, _Constants, translation, runtime) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.beforeSubmit = _exports.beforeLoad = void 0;
  search = _interopRequireWildcard(search);
  record = _interopRequireWildcard(record);
  _BudgetPreferencesUseCase = _interopRequireDefault(_BudgetPreferencesUseCase);
  _BudgetPreferencesGateway = _interopRequireDefault(_BudgetPreferencesGateway);
  translation = _interopRequireWildcard(translation);
  runtime = _interopRequireWildcard(runtime);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  var _createGateway = function _createGateway() {
    return new _BudgetPreferencesGateway["default"]({
      dependencies: {
        'N/search': search,
        'N/record': record,
        'N/translation': translation,
        'N/runtime': runtime
      },
      constants: _Constants.Constants
    });
  };

  var useCase = new _BudgetPreferencesUseCase["default"]({
    dependencies: {
      BudgetPreferencesGateway: _createGateway()
    }
  });

  var beforeLoad = function beforeLoad(context) {
    var type = context.type;

    if (type === context.UserEventType.CREATE && useCase.getBudgetPreferencesCount()) {
      var _a = _Constants.Constants.TRANSLATIONS.TRANSLATION_COLLECTION,
          COLLECTION_ID = _a.ID,
          ALERT_MSG_BGT_PREF_ALRD_EXIST = _a.KEYS.ALERT_MSG_BGT_PREF_ALRD_EXIST;
      throw Error(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BGT_PREF_ALRD_EXIST));
    }
  };

  _exports.beforeLoad = beforeLoad;

  var beforeSubmit = function beforeSubmit(context) {
    var type = context.type,
        newRecord = context.newRecord;
    var budgetSearchColumns;
    var budgetSearch;
    var enableBudgetValidation;
    var budgetValidationSource;
    var regex = new RegExp(_Constants.Constants.UTILS.BUDGET_PREFERENCES.REGEX.BUDGET_SEARCH_COLUMNS);
    var _a = _Constants.Constants.TRANSLATIONS.TRANSLATION_COLLECTION,
        COLLECTION_ID = _a.ID,
        _b = _a.KEYS,
        ALERT_MSG_BGT_PREF_NO_DELETE = _b.ALERT_MSG_BGT_PREF_NO_DELETE,
        ALERT_MSG_BUDGET_SEARCH_COLUMN_EMPTY = _b.ALERT_MSG_BUDGET_SEARCH_COLUMN_EMPTY,
        ALERT_MSG_BGT_VALD_SRC_ERROR = _b.ALERT_MSG_BGT_VALD_SRC_ERROR,
        BUDGET_SEARCH_REGX = _b.BUDGET_SEARCH_REGX,
        ALERT_MSG_BGT_PREF_INVALID_FIELD = _b.ALERT_MSG_BGT_PREF_INVALID_FIELD;
    var runtimeObj = useCase.getRuntime();
    var isUserInterface = runtimeObj.executionContext === runtimeObj.ContextType.USER_INTERFACE;

    if (type === context.UserEventType.DELETE && isUserInterface) {
      throw Error(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BGT_PREF_NO_DELETE));
    }

    enableBudgetValidation = newRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.PREF_ENABLE_BUDGET);
    budgetSearchColumns = newRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_SEARCH_COLUMNS);
    budgetSearch = newRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_SEARCH);
    budgetValidationSource = newRecord.getValue(_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_VALIDATION_SOURCE);

    if (enableBudgetValidation && !budgetSearchColumns) {
      throw Error(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BUDGET_SEARCH_COLUMN_EMPTY));
    }

    if (enableBudgetValidation && !budgetValidationSource) {
      throw Error(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BGT_VALD_SRC_ERROR));
    }

    if (budgetSearchColumns && budgetSearch) {
      var regexResult = regex.exec(budgetSearchColumns);

      if (!regexResult || regexResult[0] !== budgetSearchColumns) {
        throw Error(useCase.getTranslationString(COLLECTION_ID, BUDGET_SEARCH_REGX));
      }

      var budgetSearchFields = budgetSearchColumns.split(',');
      var transactionIds_1 = [];
      budgetSearchFields.forEach(function (budgetSearchField) {
        transactionIds_1[transactionIds_1.length] = budgetSearchField.split('|')[0];
      });
      var searchObj = useCase.getSavedSearchResult(budgetSearch);
      var columns_1 = [];
      searchObj.columns.forEach(function (column) {
        columns_1[columns_1.length] = column.name;
      });
      transactionIds_1.forEach(function (transactionId) {
        if (columns_1.indexOf(transactionId) < 0) {
          throw Error(useCase.getTranslationString(COLLECTION_ID, ALERT_MSG_BGT_PREF_INVALID_FIELD).replace('<<id>>', transactionId));
        }
      });
    }
  };

  _exports.beforeSubmit = beforeSubmit;
});