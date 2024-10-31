import {
	IInsightFacade,
	InsightData,
	InsightDataset,
	InsightDatasetKind, InsightDatasetRoom,
	InsightDatasetSection,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import * as fs from "fs-extra";
import {handleReadingRooms, handleReadingSection} from "./ParseUtil";
import {readLocal, writeLocal} from "./DiskUtil";
import {Query} from "./Query";
const DATA = "pair.zip";
export const PATH_TO_ROOT_DATA = "./data/data.json";
export const PATH_TO_ROOT_DATA_FOLDER = "./data";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 */
export default class InsightFacade implements IInsightFacade {
	public insightDataList: InsightData[] = [];
	constructor() {
		if(fs.existsSync(PATH_TO_ROOT_DATA) && fs.existsSync(PATH_TO_ROOT_DATA)) {
			readLocal(PATH_TO_ROOT_DATA, this.insightDataList);
		} else {
			fs.ensureDirSync(PATH_TO_ROOT_DATA_FOLDER);
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let dataset: InsightDatasetSection[] | InsightDatasetRoom[] = [];
		try {
			if(this.insightDataList.some((entry) => (id === entry.metaData.id))) {
				throw new InsightError("The ID already exists");
			}
			if (kind === InsightDatasetKind.Sections && this.isValidId(id)) {
				await handleReadingSection(content, dataset as InsightDatasetSection[]);
			} else if(kind === InsightDatasetKind.Rooms && this.isValidId(id)) {
				await handleReadingRooms(content, dataset as InsightDatasetRoom[]);
			} else {
				return Promise.reject(new InsightError("Invalid insight dataset kind requested"));
			}
			if(dataset.length) { // can be problematic if dataset already has 1 dataset added and a subsequent add crashes (we'd want to reject but it wouldn't)
				this.insightDataList.push(new InsightData(id, kind, dataset.length, dataset));
				writeLocal(PATH_TO_ROOT_DATA, this.insightDataList);
				return Promise.resolve(this.insightDataList.map((entry) => entry.metaData.id));
			}
			return Promise.reject(new InsightError("No sections were found in the inputted file"));
		} catch (error: unknown){
			return Promise.reject(new InsightError((error as Error).message));
		}

	}

	/**
	 * Checks that an ID is valid. An ID is invalid if it contains an underscore, if it's blank, or if it is composed
	 * entirely of whitespace characters.
	 * MODIFIES: None
	 * EFFECTS: Returns an array of the IDs that are currently added to this
	 **/
	public isValidId(id: string): boolean {
		if (id.trim().length === 0) { // blank id or id is all whitespace
			throw new InsightError("The inputted ID is invalid because it is composed only of whitespace.");
		} else if (id.includes("_")) { // id has an underscore
			throw new InsightError("The inputted ID is invalid because it contains an underscore.");
		}
		return true;
	}

	public removeDataset(id: string): Promise<string> {
		try {
			if(this.isValidId(id) && this.insightDataList.some((entry) => entry.metaData.id === id)) {
				for (const index in this.insightDataList) {
					if (this.insightDataList[index].metaData.id === id) {
						this.insightDataList.splice(Number(index), 1);
						 writeLocal(PATH_TO_ROOT_DATA, this.insightDataList);
						 return Promise.resolve(id);
					}
				}
			}
			return Promise.reject(new NotFoundError("dataset with the id {" + id  + "} doesn't exist"));
		} catch (error: unknown) {
			return Promise.reject(new InsightError((error as Error).message));
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.insightDataList.map((insightData) => insightData.metaData));
	}

	public async performQuery(queryObject: unknown): Promise<InsightResult[]> {
		try {
			if (queryObject === null || queryObject === undefined) {
				return Promise.reject(new InsightError("The query doesn't exist"));
			} else {
				let query = new Query(this.insightDataList, queryObject);
				return query.isValidQuery()
					.then(() => query.executeQuery())
					.then((results) => query.transformQueryResults(results))
					.catch((error) => Promise.reject(error));
			}
		} catch (error) {
			return Promise.reject(new InsightError((error as Error).message));
		}
	}
}
