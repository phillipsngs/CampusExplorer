import {
	InsightData, InsightDatasetEntry,
	InsightError
} from "./IInsightFacade";
import {
	AND,
	ASTERISK,
	EMPTY_STRING,
	EQ,
	GT,
	IS, LT,
	NOT,
	OR,
	UNDERSCORE,
} from "./Constants";
import {Query} from "./Query";

export class QueryExecutor {
	private query: Query;
	private dataset: InsightDatasetEntry[] = [];

	constructor(query: Query) {
		this.query = query;
		this.dataset = query.getDataset();
	}

	public doQuery(): Promise<InsightDatasetEntry[]> {
		let queryResults = this.handleFilter(this.query.getWhere());
		if(queryResults.length >= 0) {
			return Promise.resolve(queryResults);
		} else {
			return Promise.reject(new InsightError("Query returned no results"));
		}
	}

	public handleFilter(query: any): InsightDatasetEntry[] {
		if(AND in query) {
			return this.handleAnd(query[AND]);
		} else if (OR in query) {
			return this.handleOr(query[OR]);
		} else if (NOT in query) {
			return this.handleNot(query[NOT]);
		} else if (LT in query) {
			return this.handleMComparator(LT, query);
		} else if (GT in query) {
			return this.handleMComparator(GT, query);
		} else if (IS in query) {
			return this.handleMComparator(IS, query);
		} else if (EQ in query) {
			return this.handleMComparator(EQ, query);
		}
		return this.query.getDataset();
	}

	public handleAnd(query: any): InsightDatasetEntry[] {
		let results: InsightDatasetEntry[] = [];
		let subResult: InsightDatasetEntry[];
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			if (subResult.length === 0) {
				return subResult;
			} else if (results.length === 0) {
				results = subResult;
			} else {
				results = subResult.filter((entry) => results.includes(entry));
			}
		}
		return results;
	}

	public handleOr(query: any): InsightDatasetEntry[] {
		let results: InsightDatasetEntry[] = [];
		let subResult: InsightDatasetEntry[] = [];
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			for (const entry of subResult) {
				if(!results.includes(entry)) {
					results.push(entry);
				}
			}
		}
		return results;
	}

	public handleNot(query: any): InsightDatasetEntry[]  {
		let subResult: InsightDatasetEntry[] = this.handleFilter(query);
		return this.dataset.filter((entry) => !subResult.includes(entry));
	}

	public handleMComparator(comparator: string, query: any): InsightDatasetEntry[] {
		let keyValueObject = query[comparator];
		let key = Object.keys(keyValueObject)[0];
		let value = keyValueObject[key];
		let field = key.split(UNDERSCORE)[1];

		if (comparator === GT) {
			return this.dataset.filter((entry) => entry.get(field) > value);
		} else if (comparator === LT) {
			return this.dataset.filter((entry) => entry.get(field) < value);
		} else if (comparator === EQ) {
			return this.dataset.filter((entry) => entry.get(field) === value);
		} else if (comparator === IS) {
			return this.dataset.filter((entry) => this.isStringMatched(entry.get(field), value));
		}
		return [];
	}

	public isStringMatched(inputString: string | number, pattern: string): boolean {
		let wildArr = pattern.split(ASTERISK);
		let value = inputString as string;

		if(pattern === value) {
			return true;
		} else if (wildArr.length === 2) {
			if (pattern === ASTERISK) {
				return true;
			} else if(wildArr[0] === EMPTY_STRING && wildArr[1] !== EMPTY_STRING) {
				let substring = wildArr[1];
				let stringToMatch = value.substring(value.length - substring.length, value.length);
				return substring === stringToMatch;
			} else if (wildArr[0] !== EMPTY_STRING && wildArr[1] === EMPTY_STRING) {
				let substring = wildArr[0];
				let stringToMatch = value.substring(0, substring.length);
				return substring === stringToMatch;
			}
		} else if (value.includes(wildArr[1])) {
			return true;
		}
		return false;
	}
}
