import {
	InsightDatasetEntry,
	InsightResult, ResultTooLargeError,
} from "./IInsightFacade";
import {
	APPLY, APPLY_TOKEN_AVG, COUNT, GROUP, MAX,
	MIN, SUM, DOWN, EMPTY_STRING
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

	public getFormattedResult(): Promise<InsightResult[]> {
		let result = this.queryResults.map((entry) => entry.prefixJson(this.query.getQueryId()));

		if (this.query.hasTransformations()) {
			result = this.handleTransformation(result);
		}
		if (result.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Query is returning too many results."));
		}

		result = this.filterEntries(result);
		result = this.sort(result, this.query.getOrderDir());
		return Promise.resolve(result);
	}

	private filterEntries(insightResults: InsightResult[]): InsightResult[] {
		return insightResults.map((insightResult: InsightResult) => {
			return Object.fromEntries(
				Object.entries(insightResult).filter(([k, v]) => this.query.getColumns().includes(k))
			);
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

	private handleGroup(keys: string[], results: InsightResult[]): Map<string, InsightResult[]> {
		let keyToGroup = new Map<string, InsightResult[]>();
		for (let result of results) {
			let mapKey = this.createGroupKey(keys, result);
			if(!keyToGroup.has(mapKey)) {
				keyToGroup.set(mapKey, [result]);
			} else {
				keyToGroup.get(mapKey)?.push(result);
			}
		}
		return keyToGroup;
	}


	private createGroupKey(keys: string[], result: InsightResult): string {
		return keys.reduce((accumulator, key) => accumulator + result[key], EMPTY_STRING);
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


	private getAvg(results: InsightResult[], key: string): number {
		let total = results.reduce((sum, entry) => Decimal.add(new Decimal(entry[key]), sum), new Decimal(0));
		return Number((total.toNumber() / results.length).toFixed(2));
	}

	private getMin(results: InsightResult[], key: string): number | null {
		return results.reduce((min, entry) => {
			return (entry[key] as number) < min ? (entry[key] as number) : min;
		}, results[0][key] as number);
	}

	private getMax(results: InsightResult[], key: string): number | null {
		return results.reduce((max, entry) => {
			return (entry[key] as number) > max ? (entry[key] as number) : max;
		}, results[0][key] as number);
	}

	private getSum(results: InsightResult[], key: string): number {
		return Number(results.reduce((sum, entry) => sum + (entry[key] as number), 0).toFixed(2));
	}

	private getCount(results: InsightResult[], key: string): number {
		let uniqueFields = new Set(results.map((entry) => entry[key]));
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
