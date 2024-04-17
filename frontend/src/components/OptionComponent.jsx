import React, {useEffect, useRef, useState} from 'react';
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


const OptionComponent = ({dispatch, state}) => {
    const [value, setValue] = useState(getDatasetFields(state[DATASET]).map(element => false));
    const selectedColumns = useRef([]);
    useEffect(() => {
        setValue(getDatasetFields(state[DATASET]).map(element => false));
    }, [state[DATASET]]);



    const handleChange = (event, index) => {
        setValue(value.map((isSelected, i) => i === index ? !isSelected : isSelected));
        const { target: {defaultValue}} = event;
        if (event.currentTarget.checked) {
            if (!selectedColumns.current.includes(defaultValue)) {
                selectedColumns.current = getDatasetFields(state[DATASET]).filter((field, i) => value[i] || field === defaultValue);
            }
        } else {
            selectedColumns.current = selectedColumns.current.filter(column => column !== defaultValue);
        }
        dispatch({type: ACTIONS.SET_COLUMNS, payload: selectedColumns.current});
    };

    return (
        <Wrapper>
            <Row>
                <Form.Label htmlFor="disabledSelect">Choose the Fields to Include in the result:</Form.Label>
            </Row>
            <ButtonGroupWrapper>
                {getDatasetFields(state[DATASET]).map((fieldName, index) => {
                    return <>
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
