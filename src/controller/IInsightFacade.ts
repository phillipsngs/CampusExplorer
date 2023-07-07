import {UNDERSCORE} from "./Constants";

export enum InsightDatasetKind {
	Sections = "sections",
	Rooms = "rooms",
}
export class InsightData {
	public metaData: InsightDataset;
	public data: InsightDatasetSection[] | InsightDatasetRoom[];
	constructor(
		id: string,
		kind: InsightDatasetKind,
		numRows: number,
		data: InsightDatasetSection[] | InsightDatasetRoom[]) {
		this.metaData = {} as InsightDataset;
		this.metaData.id = id;
		this.metaData.kind = kind;
		this.metaData.numRows = numRows;
		this.data = data;
	}
}

export interface InsightDatasetEntry {
	get(index: string): string | number;
	prefixJson(queryId: string): InsightResult;
}
export class InsightDatasetSection implements InsightDatasetEntry{
	public uuid: string;
	public id: string;
	public title: string;
	public instructor: string;
	public dept: string;
	public year: number;
	public avg: number;
	public pass: number;
	public fail: number;
	public audit: number;

	constructor(
		id: string,
		course: string,
		title: string,
		professor: string,
		subject: string,
		year: number,
		avg: string,
		pass: string,
		fail: string,
		audit: string
	) {
		this.uuid = id;
		this.id = course;
		this.title = title;
		this.instructor = professor;
		this.dept = subject;
		this.year = Number(year);
		this.avg = Number(avg);
		this.pass = Number(pass);
		this.fail = Number(fail);
		this.audit = Number(audit);
	}

	public get(index: string): string | number {
		return (this as any)[index.toLowerCase()];
	}

	public prefixJson(datasetId: string): InsightResult {
		return Object.fromEntries(Object.entries(this).map(([k, v]) => [datasetId + UNDERSCORE + k,  v]));
	}
}

export class InsightDatasetRoom implements InsightDatasetEntry {
	public fullname: string;
	public shortname: string;
	public number: string;
	public name: string;
	public address: string;
	public lat: number;
	public lon: number;
	public seats: number;
	public type: string;
	public furniture: string;
	public href: string;

	constructor(
		fullname: string,
		shortname: string,
		address: string,
		lat: number,
		lon: number,
		number: string,
		seats: number,
		type: string,
		furniture: string,
		href: string
	) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.number = number;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = Number(seats);
		this.type = type;
		this.furniture = furniture;
		this.href = href;
		this.name = this.setName();
	}

	public get(index: string): string | number {
		return (this as any)[index.toLowerCase()];
	}

	private setName(): string {
		return this.shortname + UNDERSCORE + this.number;
	}

	public prefixJson(datasetId: string): InsightResult {
		return Object.fromEntries(Object.entries(this).map(([k, v]) => [datasetId + UNDERSCORE + k,  v]));
	}
}


export interface InsightDataset {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
}


export interface InsightResult {
	[key: string]: string | number;
}

export interface IndexHtmRoomData {
	shortname: string;
	fullname: string;
	address: string;
	relativeFileLink: string;
	lat: number;
	lon: number;
}

export class InsightError extends Error {
	constructor(message?: string) {
		super(message);
		Error.captureStackTrace(this, InsightError);
	}
}

export class NotFoundError extends Error {
	constructor(message?: string) {
		super(message);
		Error.captureStackTrace(this, NotFoundError);
	}
}

export class ResultTooLargeError extends Error {
	constructor(message?: string) {
		super(message);
		Error.captureStackTrace(this, ResultTooLargeError);
	}
}

export interface IInsightFacade {
	/**
	 * Add a dataset to insightUBC.
	 *
	 * @param id  The id of the dataset being added. Follows the format /^[^_]+$/
	 * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
	 * @param kind  The kind of the dataset
	 *
	 * @return Promise <string[]>
	 *
	 * The promise should fulfill on a successful add, reject for any failures.
	 * The promise should fulfill with a string array,
	 * containing the ids of all currently added datasets upon a successful add.
	 * The promise should reject with an InsightError describing the error.
	 *
	 * An id is invalid if it contains an underscore, or is only whitespace characters.
	 * If id is the same as the id of an already added dataset, the dataset should be rejected and not saved.
	 *
	 * After receiving the dataset, it should be processed into a data structure of
	 * your design. The processed data structure should be persisted to disk; your
	 * system should be able to load this persisted value into memory for answering
	 * queries.
	 *
	 * Ultimately, a dataset must be added or loaded from disk before queries can
	 * be successfully answered.
	 */
	addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]>;

	/**
	 * Remove a dataset from insightUBC.
	 *
	 * @param id  The id of the dataset to remove. Follows the format /^[^_]+$/
	 *
	 * @return Promise <string>
	 *
	 * The promise should fulfill upon a successful removal, reject on any error.
	 * Attempting to remove a dataset that hasn't been added yet counts as an error.
	 *
	 * An id is invalid if it contains an underscore, or is only whitespace characters.
	 *
	 * The promise should fulfill the id of the dataset that was removed.
	 * The promise should reject with a NotFoundError (if a valid id was not yet added)
	 * or an InsightError (invalid id or any other source of failure) describing the error.
	 *
	 * This will delete both disk and memory caches for the dataset for the id meaning
	 * that subsequent queries for that id should fail unless a new addDataset happens first.
	 */
	removeDataset(id: string): Promise<string>;

	/**
	 * Perform a query on insightUBC.
	 *
	 * @param query  The query to be performed.
	 *
	 * If a query is incorrectly formatted, references a dataset not added (in memory or on disk),
	 * or references multiple datasets, it should be rejected.
	 *
	 * @return Promise <InsightResult[]>
	 *
	 * The promise should fulfill with an array of results.
	 * The promise should reject with a ResultTooLargeError (if the query returns too many results)
	 * or an InsightError (for any other source of failure) describing the error.
	 */
	performQuery(query: unknown): Promise<InsightResult[]>;

	/**
	 * List all currently added datasets, their types, and number of rows.
	 *
	 * @return Promise <InsightDataset[]>
	 * The promise should fulfill an array of currently added InsightDatasets, and will only fulfill.
	 */
	listDatasets(): Promise<InsightDataset[]>;
}
