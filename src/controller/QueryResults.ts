import {
	InsightDatasetEntry,
	InsightDatasetRoom,
	InsightDatasetSection,
	InsightResult, ResultTooLargeError,
} from "./IInsightFacade";
import {
	APPLY, APPLY_TOKEN_AVG, COUNT, GROUP, MAX,
	MIN, STRING_FIELDS, SUM, DOWN, UNDERSCORE, EMPTY_STRING
} from "./Constants";
import Decimal from "decimal.js";
import {Query} from "./Query";

export class QueryResults {
	public query: Query;
	public queryResults: InsightDatasetEntry[];

	constructor(queryResults: InsightDatasetEntry[], query: Query) {
		this.queryResults = queryResults;
		this.query = query;
	}

	//	filters columns and orders them if required. Returns an insightResult Array.
	public getFormattedResult(): Promise<InsightResult[]> {
		// eslint-disable-next-line max-len
		let result: InsightResult[] = this.queryResults.map((queryResult) => queryResult.prefixJson(this.query.getQueryId()));

		if (this.query.hasTransformations()) {
			result = this.handleTransformation(result);
		}
		if (result.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Query is returning too many results."));
		}

		result = this.sort(result, this.query.getOrderDir());
		result = this.filterEntries(result);
		return Promise.resolve(result);
	}

	public filterEntries(insightResults: any): InsightResult[] {
		return insightResults.map((insightResult: any) => {
			for(let key in insightResult) {
				if(!this.query.getColumns().includes(key)) {
					delete insightResult[key];
				}
			}
			return insightResult;
		});
	}

	public handleTransformation(queryResult: InsightResult[]): InsightResult[] {
		let transformationBlock = this.query.getTransformations();
		let groupKeyList: string[] = transformationBlock[GROUP];
		let currResult: InsightResult[];
		let groups = this.handleGroup(groupKeyList, queryResult);

		let applyBlock = transformationBlock[APPLY];
		currResult = [...groups.values()].map((group) => this.handleApply(group, applyBlock));
		return currResult;

	}

	public handleGroup(keys: string[], result: InsightResult[]): Map<string, InsightResult[]> {
		let keyToGroup = new Map<string, InsightResult[]>();
		for (let section of result) {
			let mapKey = this.createGroupKey(keys, section);
			if(!keyToGroup.has(mapKey)) {
				keyToGroup.set(mapKey, [section]);
			} else {
				keyToGroup.get(mapKey)?.push(section);
			}
		}
		return keyToGroup;
	}


	private createGroupKey(keys: string[], result: InsightResult): string {
		let mapKey = EMPTY_STRING;
		for(let key of keys) {
			mapKey += result[key];
		}
		return mapKey;
	}

	public handleApply(groups: InsightResult[], applyBlock: any): InsightResult {
		let appliedGroups = groups[0]; // can be any random insight result
		if (applyBlock.length === 0) {
			return groups[0];
		}
		for (let applyOperation of applyBlock) {
			let column = Object.keys(applyOperation)[0];
			appliedGroups[column] = this.apply(groups, applyOperation[column]);
		}
		return appliedGroups;
	}

	public apply(group: InsightResult[], applyBlock: any): string | number {
		let applySubBlock = applyBlock;
		let operation = Object.keys(applySubBlock)[0];
		let col = applySubBlock[operation];

		if (operation === APPLY_TOKEN_AVG) {
			return this.getAvg(group,col);
		} else if (operation === MIN) {
			return this.getMin(group, col) as number;
		} else if (operation === MAX){
			return this.getMax(group, col) as number;
		} else if (operation === SUM) {
			return this.getSum(group, col);
		} else if (operation === COUNT) {
			return this.getCount(group, col);
		}
		return 0;
	}

	public sort(results: InsightResult[], direction: string): InsightResult[] {
		let sortFactor = direction === DOWN ? -1 : 1;
		results.sort((a, b) => sortFactor * this.insightResultComparator(a, b, 0));
		return results;
	}


	public getAvg(results: InsightResult[], col: string): number {
		let total = results.reduce((sum, result) => Decimal.add(new Decimal(result[col]), sum), new Decimal(0));
		return Number((total.toNumber() / results.length).toFixed(2));
	}

	public getMin(results: InsightResult[], col: string): number | null {
		return results.reduce((min, entry) => {
			return (entry[col] as number) < min ? (entry[col] as number) : min;
		}, results[0][col] as number);
	}

	public getMax(results: InsightResult[], col: string): number | null {
		return results.reduce((max, entry) => {
			return (entry[col] as number) > max ? (entry[col] as number) : max;
		}, results[0][col] as number);
	}

	public getSum(results: InsightResult[], col: string): number {
		return results.reduce((sum, result) => sum + (result[col] as number) , 0);
	}

	public getCount(results: InsightResult[], col: string): number {
		let uniqueFields = new Set(results.map((entry) => entry[col]));
		return uniqueFields.size;
	}

	public insightResultComparator(a: InsightResult, b: InsightResult, index: number): number {
		let orderKeys =  this.query.getOrderKeys();
		if (index < orderKeys.length) {
			if (STRING_FIELDS.includes(orderKeys[index].split(UNDERSCORE)[1])) {
				if ((a[orderKeys[index]] as string) < (b[orderKeys[index]] as string)) {
					return -1;
				} else if ((a[orderKeys[index]] as string) > (b[orderKeys[index]] as string)) {
					return 1;
				} else {
					return this.insightResultComparator(a, b, index + 1);
				}
			} else {
				if ((a[orderKeys[index]] as number) < (b[orderKeys[index]] as number)) {
					return -1;
				} else if ((a[orderKeys[index]] as number) > (b[orderKeys[index]] as number)) {
					return 1;
				} else {
					return this.insightResultComparator(a, b, index + 1);
				}
			}
		}
		return 0;
	}
}
