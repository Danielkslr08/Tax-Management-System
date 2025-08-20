import { Component } from "react";
import styles from "./ConfirmModal.module.css"

class ConfirmModal extends Component{

    yesClicked = () => {
        this.props.onYes()
    }

    noClicked = () => {
        this.props.onNo()
    }

    displayModal = () => {
        return (
            <>
                <div className={styles["custom-modal-overlay"]}>
                    <div className={styles["custom-modal"]}>
                    <p>{this.props.text || "Are you sure you want to proceed?"}</p>
                    <div className={styles["modal-footer"]}>
                        <button
                        className="btn red"
                        onClick={this.yesClicked}
                        >
                        Yes
                        </button>
                        <button
                        className="btn grey"
                        onClick={this.noClicked}
                        >
                        No
                        </button>
                    </div>
                    </div>
                </div>
            </>
        )
    }

    render(){
        return(
            this.displayModal()
        )
    }
}

export default ConfirmModal;