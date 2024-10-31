import {
	APPLY,
	APPLY_TOKENS,
	NUMBER_FIELDS,
	STRING_FIELDS,
	COLUMNS,
	COMPARATOR,
	GROUP,
	LOGIC,
	NOT,
	OPTION_KEYS,
	ORDER,
	ROOMS_FIELD_NAMES,
	SECTION_FIELD_NAMES,
	DIR,
	KEYS,
	DIRECTIONS,
	NUMBER,
	STRING,
	ASTERISK,
	EMPTY_STRING,
	UNDERSCORE,
	WHERE,
	OPTIONS,
	TRANSFORMATIONS, ORDER_KEYS
} from "./Constants";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Query} from "./Query";

export class QueryValidator {
	private query: Query;
	private datasetId: string;

	constructor(query: Query) {
		this.query = query;
		this.datasetId = EMPTY_STRING;
	}

	public isValidQuery(): Promise<boolean> {
		let isValidTransformations = true;
		let isValidQuery = false;
		if (this.hasValidQueryKeys(this.query.getQueryObject())) {
			if(this.query.hasTransformations()) {
				isValidTransformations = this.isValidTransformationsBlock(this.query.getTransformations());
			}

			if (this.query.hasWhere() && this.query.hasOptions()) { // WHERE KEY NOT FOUND OR OPTIONS KEY NOT FOUND
				let isWhereEmpty = Object.keys(this.query.getWhere()).length === 0
					&& !Array.isArray(this.query.getWhere());
				let isValidOptions = this.isValidOptionsBlock(this.query.getOptions()); // validate options first
				let isValidWhere = this.isValidWhereBlock(this.query.getWhere()) || isWhereEmpty;
				isValidQuery = isValidWhere && isValidOptions && isValidTransformations;
			}
			if(isValidQuery) {
				return Promise.resolve(true);
			}
		}
		return Promise.reject(new InsightError("Invalid Query"));
	}

	private hasValidQueryKeys(queryObject: any): boolean {
		let queryKeys = Object.keys(queryObject);
		let [where, options, transformation] = queryKeys;

		if (queryKeys.length === 2) {
			return where === WHERE && options === OPTIONS;
		} else if (queryKeys.length === 3) {
			return where === WHERE && options === OPTIONS && transformation === TRANSFORMATIONS;
		}
		return false;
	}

	private isValidWhereBlock(filter: any): boolean {
		let isValid = true;
		let keys: string[] = Object.keys(filter);
		let key = keys[0];

		if(keys.length !== 1){
			return false;
		} else if(LOGIC.includes(key) && filter[key].length) { // IS {AND, OR}
			return filter[key].reduce((v: boolean, f: any) => v && this.isValidWhereBlock(f), true);
		} else if(COMPARATOR.includes(key)){ // IS {LT, GT, EQ, IS}
			return isValid && this.isValidComparatorEntry(filter[key], key);
		} else if(NOT === key) { // IS {NOT}
			return this.isValidWhereBlock(filter[key]);
		} else {
			return false;
		}
	}

	public isValidComparatorEntry(object: any, comparator: string): boolean {
		let keys = Object.keys(object);
		let key = keys[0];
		let field = key.split(UNDERSCORE)[1];
		let value = object[key];

		if(NUMBER_FIELDS.includes(field) && NUMBER_FIELDS.includes(comparator) && typeof value === NUMBER) {
			return this.isValidKey(key) && keys.length === 1;
		} else if(STRING_FIELDS.includes(field) && STRING_FIELDS.includes(comparator) && typeof value === STRING) {
			return this.isValidWildCard(value) && this.isValidKey(key) && keys.length === 1;
		} else {
			return false;
		}
	}

	private isValidOptionsBlock(optionBlock: any): boolean {
		let optionKeys: string[] = Object.keys(optionBlock);
		let optionsHasValidKeys = this.optionsHasValidKeys(optionBlock); // KEYS ARE IN THE SET COLUMN_KEYS
		let optionsHasColumns = optionKeys.includes(COLUMNS); // HAS COLUMNS
		let isValidColumns = this.isValidColumns(optionBlock[COLUMNS]); // COLUMNS IS AN ARRAY AND EACH ELEMENT IS A STRING, REFERENCES ONE DATASET

		if(optionsHasValidKeys && optionsHasColumns && isValidColumns) {
			this.initializeColumns(optionBlock[COLUMNS]);
			this.datasetId = this.query.getQueryId();
			let optionsHasOrder = optionKeys.includes(ORDER);
			if(!optionsHasOrder) {
				return true;
			} else if (this.isValidOrder(optionBlock[ORDER])){
				this.initializeOrderKeys(optionBlock[ORDER]);
				return this.isAllOrderKeysInColumns();
			}
		}
		return false;
	}

	private optionsHasValidKeys(optionBlock: any): boolean {
		let optionKeys = Object.keys(optionBlock);
		return optionKeys.every((element: any) => OPTION_KEYS.includes(element));
	}

	public isValidColumns(columns: any): boolean {
		if(this.isNonEmptyArrayWithType(columns, STRING)) {
			let applyKeys = this.query.getApplyKeys();
			let groups = this.query.getGroups();
			let columnApplyKeys = columns.filter((key: string) => !key.includes(UNDERSCORE));
			let groupKeys = columns.filter((key: string) => key.includes(UNDERSCORE));
			let isValidApplyKeys = columnApplyKeys.every((key: any) => {
				return (applyKeys.length > 0 ? applyKeys.includes(key) : false);
			});
			this.initializeDatasetId(groupKeys.length > 0 ? groupKeys[0].split(UNDERSCORE)[0] : EMPTY_STRING);
			let isValidNonApplyKeys = groupKeys.every((key: any) => {
				return key.split(UNDERSCORE)[0] === this.datasetId && (groups.length > 0 ? groups.includes(key) : true);
			});
			let isColumnsFieldsMatchInsightKind = this.isKeyArrayForInsightKind(groupKeys); // FIELDS REFERENCED ARE ONES THAT ARE SUPPORTED
			let isDatasetAdded = this.query.isDatasetAdded(this.datasetId);
			if (isValidApplyKeys && isValidNonApplyKeys && isDatasetAdded && isColumnsFieldsMatchInsightKind) {
				this.initializeDatasetId(this.datasetId);
				return true;
			}
		}
		return false;
	}

	private isValidKey(key: any): boolean {
		let keyComponents = key.split(UNDERSCORE);
		let [datasetId, field] = keyComponents;
		let isKeyString = typeof key === STRING;
		let isValidField = SECTION_FIELD_NAMES.includes(field) || ROOMS_FIELD_NAMES.includes(field);
		let isKeyMatchingDatasetId = this.datasetId === datasetId;
		let isKeyValidForDataset = this.isKeyForInsightKind(key);
		return isKeyString && isValidField && isKeyMatchingDatasetId &&
			isKeyValidForDataset && keyComponents.length === 2;
	}

	private isValidWildCard(pattern: string): boolean { // we are considering no pattern to be a valid wildcard pattern
		if(pattern.includes(ASTERISK)) {
			let wildArr = pattern.split(ASTERISK);
			if(pattern[0] === ASTERISK && pattern[pattern.length - 1] === ASTERISK && wildArr.length === 3) { // *string*
				return true;
			} else if(wildArr.length > 2 || (wildArr[0] !== EMPTY_STRING && wildArr[1] !== EMPTY_STRING)) { // more than one * should fail
				return false;
			}
		}
		return true;
	}

	private isValidTransformationsBlock(transformations: any): boolean {
		if(APPLY in transformations && GROUP in transformations && Object.keys(transformations).length === 2) {
			let isValidGroup = this.isValidGroup(transformations[GROUP]); // do group after and set group and check that keys in columns are in apply keys or group
			let isValidApply = this.isValidApply(transformations[APPLY]); // do apply first to set apply keys
			return isValidGroup && isValidApply;
		}
		return false;
	}

	private isValidGroup(groupBlock: any): boolean {
		if(this.isNonEmptyArrayWithType(groupBlock, STRING)) {
			this.initializeDatasetId(groupBlock[0].split(UNDERSCORE)[0]);
			if((groupBlock as string[]).every((key: string) => this.isValidKey(key))) {
				this.query.setGroups(groupBlock);
				return true;
			}
		}
		return false;
	}

	private isValidApply(applyBlock: any): boolean {
		let isArray = Array.isArray(applyBlock);
		if(isArray && applyBlock.length === 0) {
			return true;
		} else if(isArray && applyBlock.length > 0) {
			return applyBlock.reduce((v: boolean, applyRule: any) => v && this.isValidApplyRule(applyRule), true);
		}
		return false;
	}

	private isValidApplyRule(applyRule: any): boolean {
		let hasOneKey = Object.keys(applyRule).length === 1;
		let applyKey = Object.keys(applyRule)[0];
		let isKeyString = typeof applyKey === STRING;
		let applyKeyHasNoUnderscore = !applyKey.includes(UNDERSCORE);
		let isValidKeyLength = applyKey.length > 0;
		let isKeyUnique = !this.query.getApplyKeys().includes(applyKey);
		let isValidApplyKey = hasOneKey && isKeyString && applyKeyHasNoUnderscore && isValidKeyLength && isKeyUnique;

		if (isValidApplyKey && this.isValidApplyRuleEntry(applyRule[applyKey])) {
			this.query.addApplyKey(applyKey);
			return true;
		}
		return false;
	}

	private isValidApplyRuleEntry(applyRuleEntry: any): boolean {
		let entryHasOneKey = Object.keys(applyRuleEntry).length === 1;
		let key = Object.keys(applyRuleEntry)[0];
		let isValidApplyRuleEntryKey = APPLY_TOKENS.includes(key);
		let applyRuleEntryValue = applyRuleEntry[key];
		let isValidApplyRuleEntryValue = this.isValidKey(applyRuleEntryValue);
		let field = applyRuleEntryValue.split(UNDERSCORE)[1];
		let isValidField = (NUMBER_FIELDS.includes(field) && NUMBER_FIELDS.includes(key)) ||
			(STRING_FIELDS.includes(field) && STRING_FIELDS.includes(key));
		return isValidApplyRuleEntryKey && isValidApplyRuleEntryValue && entryHasOneKey && isValidField;
	}

	private isValidOrder(orderValue: any): boolean {
		if(typeof orderValue === STRING) {
			return this.isValidKey(orderValue) || this.query.getColumns().includes(orderValue);
		} else {
			let keys = Object.keys(orderValue);
			let hasTwoKeys = keys.length === 2;
			let isUnique = keys[0] !== keys[1];
			let hasValidKeys = hasTwoKeys && ORDER_KEYS.includes(keys[0]) && ORDER_KEYS.includes(keys[1]) && isUnique;

			if(hasValidKeys && this.isNonEmptyArrayWithType(orderValue[KEYS], STRING)) {
				let isValidDirection = DIRECTIONS.includes(orderValue[DIR]);
				let isKeyAColumnKey = orderValue[KEYS].every((key: any) => this.isValidOrderKeyListEntry(key));
				this.query.setOrderDir(orderValue[DIR]);
				return isValidDirection && isKeyAColumnKey;
			}
		}
		return false;
	}

	private isValidOrderKeyListEntry(key: string): boolean {
		let isValidKey = this.isValidKey(key);
		return isValidKey || (this.query.getApplyKeys().includes(key) || this.query.getColumns().includes(key));
	}

	private initializeOrderKeys(orderKeys: any): void {
		if(typeof orderKeys === STRING){
			this.query.setOrderKeys([orderKeys]);
		} else if(Object.keys(orderKeys).includes(KEYS)) {
			this.query.setOrderKeys(orderKeys[KEYS]);
		}
	}

	private isAllOrderKeysInColumns(): boolean {
		return this.query.getOrderKeys().every((orderKey) => this.query.getColumns().includes(orderKey));
	}

	private isKeyForInsightKind(key: string): boolean {
		let field = key.split(UNDERSCORE)[1];
		if(this.query.getDatasetKind() === InsightDatasetKind.Rooms) {
			return ROOMS_FIELD_NAMES.includes(field);
		} else if (this.query.getDatasetKind() === InsightDatasetKind.Sections) {
			return SECTION_FIELD_NAMES.includes(field);
		}
		return false;
	}

	private isKeyArrayForInsightKind(keys: string[]): boolean {
		return keys.every((key) => this.isKeyForInsightKind(key));
	}

	private initializeDatasetId(datasetId: string): void {
		if(datasetId !== EMPTY_STRING) {
			this.datasetId = datasetId;
			this.query.setQueryId(datasetId);
			this.query.setDataset(datasetId); // maybe move this somewhere
		}
	}

	private initializeColumns(columns: string[]): void {
		this.query.setColumns(columns);
	}

	private isNonEmptyArrayWithType(object: any, type: string): boolean {
		return Array.isArray(object) && object.every((entry) => typeof entry === type) && object.length > 0;
	}
}
