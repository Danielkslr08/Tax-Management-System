import { Component } from "react";
import styles from "./AdvancedModal.module.css"

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/*

fields=[
    { value: "first", label: "First Field", type: "input", placeholder: "Enter first..." },
    { value: "second", label: "Second Field", type: "input", placeholder: "Enter second..." },
    { value: "third", label: "Third Field", type: "select", options: ["A", "B", "C"] },
    { value: "fourth", label: "Fourth Field", type: "select", options: ["X", "Y", "Z"] }
]

*/

class AdvancedModal extends Component{

    constructor(props) {
        super(props);
        this.state = {
            fieldValues: (props.fields || []).map(field => field.value ?? "")
        };
        if (typeof props.initialSelectedId === "number") {
            this.selectedId = props.initialSelectedId;
        } else {
            this.selectedId = null; // log an error if needed
        }
        console.log(this.state.fieldValues)
        console.log(props.initialSelectedId)
    }

    idToName = (id) => {
        if (id === "") {
            return ""
        } else {
            const indexOfIdList = this.props.idList.findIndex(idChild => idChild === id);
            const optionName = this.props.fields[0].options[indexOfIdList]
            return optionName;
        }
    }

    triggerVibrate = (element) => {
    
        // Remove the class to reset the animation
        element.classList.remove(styles.vibrateAnim);

        // Trigger reflow to restart animation
        void element.offsetWidth; 

        // Add the animation class back
        element.classList.add(styles.vibrateAnim);
    };

    saveClicked = (event) => {
        const emptyFieldExists = this.state.fieldValues.some(value => value === "");
        if (emptyFieldExists) {
            const saveButton = event.target;
            this.triggerVibrate(saveButton);
        } else {
            this.props.onSave(this.state.fieldValues, this.selectedId);
        }
    }

    cancelClicked = () => {
        this.props.onCancel()
    }

    parseDateWithoutTimezone = (dateString) => {
        // dateString expected format "yyyy-mm-dd"
        const parts = dateString.split("-");
        if (parts.length !== 3) return null;

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // zero-based month
        const day = parseInt(parts[2], 10);

        // Create a Date using year, month, day without timezone shift
        return new Date(year, month, day);
    };

    formSection = (field, index) => {
        return(
            <div className={styles["form-group"]}>
                <label>{field.label}</label>
                {(field.type == "input") ? (
                    <input
                    type={field.label.includes("Distance") ? "text" : "text"} // use text for full control
                    className="browser-default"
                    placeholder={field.placeholder}
                    value={this.state.fieldValues[index]}
                    onChange={(e) => {
                        let value = e.target.value;

                        if (field.label.includes("Distance")) {
                            // Remove everything except digits and single dot
                            value = value.replace(/[^0-9.]/g, "");

                            // Prevent more than one decimal
                            const parts = value.split(".");
                            if (parts.length > 2) {
                                parts.splice(2);
                                value = parts.join(".");
                            }
                        }

                        const updatedValues = [...this.state.fieldValues];
                        updatedValues[index] = value;
                        this.setState({ fieldValues: updatedValues });
                    }}
                    onBlur={(e) => {
                        if (field.label.includes("Distance")) {
                            let num = parseFloat(e.target.value);
                            if (isNaN(num) || num < 0) num = 0;
                            const updatedValues = [...this.state.fieldValues];
                            updatedValues[index] = num.toFixed(2);
                            this.setState({ fieldValues: updatedValues });
                        }
                    }}
                    />
                ) : (field.type === "date") ? (
                    <DatePicker
                    selected={this.state.fieldValues[index] ? this.parseDateWithoutTimezone(this.state.fieldValues[index]) : null}
                    onChange={(date) => {
                        const updatedValues = [...this.state.fieldValues];
                        updatedValues[index] = date?.toISOString().split("T")[0] ?? "";
                        this.setState({ fieldValues: updatedValues });
                    }}
                    className="browser-default"
                    placeholderText={field.placeholder || "Select a date"}
                    dateFormat="yyyy-MM-dd"
                    />
                ) : (
                    <select  
                    className="browser-default" 
                    value={this.state.fieldValues[index]}
                    onChange={(e) => {
                        const updatedValues = [...this.state.fieldValues];
                        const newValue = e.target.value;

                        if (this.props.idList) {
                            updatedValues[index] = parseInt(newValue, 10);
                            this.selectedId = parseInt(newValue, 10);
                        } else {
                            updatedValues[index] = newValue;
                        }
                        this.setState({ fieldValues: updatedValues });
                    }}
                    >
                        <option value="" disabled> Select {field.label}</option>
                        {[...Array(field.options.length)].map((_, i) => (
                            this.props.idList ? 
                            <option key={i} value={this.props.idList[i]}>{field.options[i]}</option> :
                            <option key={i} value={field.options[i]}>{field.options[i]}</option> 
                        ))}
                    </select>
                )}
            </div>
        )
    }

    displayModal = () => {
        return(
            <div className={styles["custom-modal-overlay"]}>
                <div className={styles["custom-modal"]} onClick={(e) => e.stopPropagation()}>
                <h4>{this.props.title}</h4>
                <form className={styles["modal-form"]}>
                    
                    {[...Array(this.props.fields.length)].map((_, i) => (
                        <div key={i}>
                            {this.formSection(this.props.fields[i], i)}
                        </div>
                    ))}

                    <div className={styles["modal-footer"]}>
                    <button type="button" className="btn blue waves-effect waves-light" onClick={this.cancelClicked}>Cancel</button>
                    <button type="button" className="btn blue waves-effect waves-light" onClick={(e) => {this.saveClicked(e)}}>Save</button>
                    </div>
                </form>
                </div>
            </div>
        );
    }

    render(){
        return(
            <>
                {this.displayModal()}
            </>
        )
    }
}

export default AdvancedModal;