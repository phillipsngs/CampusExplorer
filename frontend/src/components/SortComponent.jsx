import React, {useEffect, useState} from 'react';
import Form from "react-bootstrap/Form";
import {ACTIONS, COLUMNS, DATASET, DIR, DOWN, KEYS, UP} from "../util/Constants";
import {Col} from "react-bootstrap";
import {RowWrapper} from "./WhereComponents";
import {capitalize} from "../util/Functions";


const SortComponent = ({dispatch, state}) => {
	const [selectedField, setSelectedField] = useState("");
	const [selectedDirection, setSelectedDirection] = useState("UP");


	useEffect(() => {
		let order = {}
		order[DIR] = selectedDirection
		order[KEYS] = [selectedField];
		dispatch({type: ACTIONS.SET_SORT_OPTIONS, payload: order})
	}, [selectedField, selectedDirection]);

	useEffect(() => {
		let order = {}
		order[DIR] = selectedDirection
		order[KEYS] = [selectedField];
		setSelectedField(state[DATASET] + "_" + state[COLUMNS][0]);
	}, [state[COLUMNS]]);

	return (
		<RowWrapper>
			<Col>
				<Form.Label htmlFor="disabledSelect">Select Field to Order On:</Form.Label>
				<Form.Select value={selectedField} size="md" onChange={(e) => {
					setSelectedField(e.target.value);
				}}>
					{
                        state[COLUMNS].map((fieldName, index) => {
							return <option key={index} value={state[DATASET] + "_" + fieldName}>
								{capitalize(fieldName)}
							</option>
						})
					}
				</Form.Select>
			</Col>
			<Col>
				<Form.Label htmlFor="disabledSelect">Order Direction:</Form.Label>
				<Form.Select value={selectedDirection} size="md" onChange={(e) => {
					setSelectedDirection(e.target.value);
				}}>
					<option value={DOWN}> Ascending </option>
					<option value={UP}> Descending </option>
				</Form.Select>
			</Col>
		</RowWrapper>
	);
};

export default SortComponent;
