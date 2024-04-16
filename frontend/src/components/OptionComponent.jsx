import React, {useEffect, useState} from 'react';
import {ACTIONS, COLUMNS, DATASET} from "../util/Constants";
import {ButtonGroup, Row, ToggleButton} from "react-bootstrap";
import styled from "styled-components";
import Form from "react-bootstrap/Form";
import {capitalize, getDatasetFields} from "../util/Functions";

const ToggleButtonWrapper = styled(ToggleButton)`
	width: 8em;

`
styled(Row)`
	justify-content: space-between;
`;
const ButtonGroupWrapper = styled(ButtonGroup)`
	justify-content: space-between;
	width: 100%;
`

const Wrapper = styled.div`
	width: 100%;
	margin-bottom: 2em;
`


let colArr =[];

export function getSelectedColumns(){
	return colArr;
}
const handleColChange = (event) => {
	// alert(Object.keys(event));
	if(event.currentTarget.checked){
		if(!getSelectedColumns().includes(event.target.defaultValue)){
			colArr.push(event.target.defaultValue);
		}
	} else{
		let index = colArr.indexOf(event.target.defaultValue)
		if(index !== -1){
			colArr.splice(index,1);
		}
	}
}
const OptionComponent = ({dispatch, state}) => {
	const [value, setValue] = useState(getDatasetFields(state[DATASET]).map((element) => false));
	useEffect(() => {
		setValue(state[COLUMNS].map((element) => false));
	}, [state[DATASET]]);

	const handleChange = (val, index) => {
		colArr = [...state[COLUMNS]];
		handleColChange(val); //addds to the array
		let updatedValue = [...value]; //records whether the field has een selected
		updatedValue[index] = !value[index]; //sets it to the opposite
		setValue(updatedValue); //
		dispatch({type: ACTIONS.SET_COLUMNS, payload:colArr});
	};

	return (
		<Wrapper>
			<Row>
				<Form.Label htmlFor="disabledSelect">Choose the Fields to Include in the result:</Form.Label>
			</Row>
			<ButtonGroupWrapper>
				{getDatasetFields(state[DATASET]).map((fieldName,index) => {
					return<>
							<ToggleButtonWrapper
								type="checkbox"
								id={`tbg-btn-${index}`}
								value={fieldName}
								variant="outline-primary"
								checked={value[index]}
								onChange={(e) => handleChange(e, index)}
							>
							{capitalize(fieldName)}
							</ToggleButtonWrapper>

					</>
				})}
			</ButtonGroupWrapper>
		</Wrapper>
	);
};
export default OptionComponent;
