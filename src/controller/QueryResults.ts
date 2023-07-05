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
	private query: Query;
	private queryResults: InsightDatasetEntry[];

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

	private filterEntries(insightResults: InsightResult[]): InsightResult[] {
		return insightResults.map((insightResult: InsightResult) => {
			for(let key in insightResult) {
				if(!this.query.getColumns().includes(key)) {
					delete insightResult[key];
				}
			}
			return insightResult;
		});
	}

	private handleTransformation(queryResult: InsightResult[]): InsightResult[] {
		let transformationBlock = this.query.getTransformations();
		let groupKeyList: string[] = transformationBlock[GROUP];
		let currResult: InsightResult[];
		let groups = this.handleGroup(groupKeyList, queryResult);

		let applyBlock = transformationBlock[APPLY];
		currResult = [...groups.values()].map((group) => this.handleApply(group, applyBlock));
		return currResult;

	}

	private handleGroup(keys: string[], result: InsightResult[]): Map<string, InsightResult[]> {
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

	private handleApply(groups: InsightResult[], applyBlock: any): InsightResult {
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

	private apply(group: InsightResult[], applyBlock: any): string | number {
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

	private sort(results: InsightResult[], direction: string): InsightResult[] {
		let sortFactor = direction === DOWN ? -1 : 1;
		results.sort((a, b) => sortFactor * this.insightEntryComparator(a, b));
		return results;
	}


	private getAvg(results: InsightResult[], col: string): number {
		let total = results.reduce((sum, entry) => Decimal.add(new Decimal(entry[col]), sum), new Decimal(0));
		return Number((total.toNumber() / results.length).toFixed(2));
	}

	private getMin(results: InsightResult[], col: string): number | null {
		return results.reduce((min, entry) => {
			return (entry[col] as number) < min ? (entry[col] as number) : min;
		}, results[0][col] as number);
	}

	private getMax(results: InsightResult[], col: string): number | null {
		return results.reduce((max, entry) => {
			return (entry[col] as number) > max ? (entry[col] as number) : max;
		}, results[0][col] as number);
	}

	private getSum(results: InsightResult[], col: string): number {
		return results.reduce((sum, entry) => sum + (entry[col] as number) , 0);
	}

	private getCount(results: InsightResult[], col: string): number {
		let uniqueFields = new Set(results.map((entry) => entry[col]));
		return uniqueFields.size;
	}

	private insightEntryComparator(a: InsightResult, b: InsightResult): number {
		let orderKeys =  this.query.getOrderKeys();
		for(let key of orderKeys) {
			if ((a[key]) < (b[key])) {
				return -1;
			} else if ((a[key]) > (b[key])) {
				return 1;
			}
		}
		return 0;
	}
}
