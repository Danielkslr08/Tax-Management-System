import { Component } from "react";
import styles from "./Properties.module.css";

import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

class PropertyComponent extends Component{

    constructor(props){
        super(props);
        this.state = {
            modalOpen: false,
            showConfirm: false
        }
    }

    deleteCard = () => {
        this.setState({ showConfirm: true });
    }

    handleDeleteConfirmed = () => {
        this.setState({ showConfirm: false }, () => {
            this.props.onDelete(this.props.index);
        });
    };

    handleDeleteCancelled = () => {
        this.setState({ showConfirm: false });
    };
    
    modalClicked = () => {
        this.setState({
            modalOpen: !this.state.modalOpen
        })
    }

    card = () => {
        return(
        <>
            <div className={styles.card}>
                <div className={styles.left}>
                    <h2>{this.props.title}</h2>
                    <div className={styles.metaRow}>
                        <p><strong>Address:</strong> {this.props.address}</p>
                        <p><strong>Distance:</strong> {this.props.distance} km</p>
                        <p><strong>Property Type:</strong> {this.props.propertyType}</p>
                    </div>
                </div>
                <div className={styles.right}>
                    <i onClick={this.modalClicked} className={`material-icons ${styles.icon} ${styles.edit}`}>edit</i>
                    <i onClick={this.deleteCard} className={`material-icons ${styles.icon} ${styles.delete}`}>delete</i>
                </div>
            </div>

            {this.state.modalOpen && (
                this.props.modal(
                    "Edit Property", 
                    {
                        name: this.props.title,
                        address: this.props.address,
                        distance: this.props.distance,
                        propertyType: this.props.propertyType
                    },
                    "Edit",
                    this.props.index,
                    this.modalClicked
                )
            )}

            {this.state.showConfirm && (
                <ConfirmModal 
                    onYes={this.handleDeleteConfirmed} 
                    onNo={this.handleDeleteCancelled}
                />
            )}

        </>
        );
    }

    render(){
        return(  
            this.card()
        );
    }
}

export default PropertyComponent;