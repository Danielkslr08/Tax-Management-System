import { Component } from "react";
import styles from "./PageIntro.module.css"

import axios from "axios";
import PropertyComponent from "../../pages/Properties/Properties";
import AdvancedModal from "../AdvancedModal/AdvancedModal";

const API_BASE = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_PORT || 3002}`;

class PageIntro extends Component{

    constructor(){
        super();
        this.state = {
            modalOpen: false,
            cards: []
        }
    }
    
    componentDidMount() {
        if (this.props.user) {
            axios.get(`${API_BASE}/api/user/properties`,
                { 
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
            .then(res => {
                const userProperties = res.data.properties.map(property => ({
                    id: property.id,
                    name: property.name,
                    address: property.address,
                    distance: property.distance,
                    propertyType: property.propertytype
                }));
                this.setState({ cards: userProperties });
            })
            .catch(err => {
                console.error("Failed to fetch latest user data:", err);
            });
        } else {
            // fallback for signed-out users
            this.setState({
                cards: [
                    {
                        name: "Suburban Bungalow",
                        address: "202 Maple Avenue, Mississauga, ON",
                        distance: 18,
                        propertyType: "Main Residence"
                    },
                    {
                        name: "Downtown Loft",
                        address: "101 King Street West, Toronto, ON",
                        distance: 2,
                        propertyType: "Rental Property"
                    },
                    {
                        name: "Lakeview Rental",
                        address: "303 Shoreline Road, Muskoka, ON",
                        distance: 120,
                        propertyType: "Rental Property"
                    },
                    {
                        name: "University Flat",
                        address: "404 College Street, Waterloo, ON",
                        distance: 90,
                        propertyType: "Rental Property"
                    },
                    {
                        name: "Uptown Duplex",
                        address: "505 Eglinton Avenue East, Toronto, ON",
                        distance: 5,
                        propertyType: "Rental Property"
                    },
                    {
                        name: "City Condo",
                        address: "707 Bay Street, Toronto, ON",
                        distance: 1,
                        propertyType: "Rental Property"
                    },
                    {
                        name: "Mountain House",
                        address: "808 Alpine Trail, Blue Mountains, ON",
                        distance: 150,
                        propertyType: "Rental Property"
                    },
                    {
                        name: "Garden Suite",
                        address: "909 Blossom Lane, Brampton, ON",
                        distance: 25,
                        propertyType: "Rental Property"
                    },
                    {
                        name: "Harbourview Apartment",
                        address: "111 Dockside Lane, Hamilton, ON",
                        distance: 65,
                        propertyType: "Rental Property"
                    }
                ]
            });
        }
    }

    updateCard = (index, updatedCard) => {
        if (this.props.user) {
            const id = this.state.cards[index].id
            axios.put(`${API_BASE}/api/properties/${id}`, updatedCard,
                { 
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
            .then(res => {
                console.log("Edit successful:", res.data)
                this.setState(prevState => {
                    const updatedCards = [...prevState.cards];
                    updatedCards[index] = { ...updatedCard, id };
                    return { cards: updatedCards };
                })
            })
            .catch(err => console.error("Edit failed:", err));
        } else {
            this.setState(prevState => {
                const updatedCards = [...prevState.cards];
                updatedCards[index] = updatedCard;
                return { cards: updatedCards };
            })
        }
    };

    deleteCard = (indexToDelete) => {
        if (this.props.user) {
            const id = this.state.cards[indexToDelete].id
            axios.delete(`${API_BASE}/api/properties/${id}`,
                { 
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
            .then(res => {
                console.log("Delete successful:", res.data)
                this.setState(prevState => ({
                    cards: prevState.cards.filter((_, index) => index !== indexToDelete)
                }));
            })
            .catch(err => console.error("Delete failed:", err))
        } else {
            this.setState(prevState => ({
                cards: prevState.cards.filter((_, index) => index !== indexToDelete)
            }))
        }
    }   
    
    modalClicked = () => {
        this.setState({
            modalOpen: !this.state.modalOpen
        })
    }

    saveClicked = (arrayOfInputValues) => {
        if (this.props.page == "Properties") {

            let newCard = {
                name: arrayOfInputValues[0],
                address: arrayOfInputValues[1],
                distance: arrayOfInputValues[2],
                propertyType: arrayOfInputValues[3]
            }

            if (this.props.user) {
                axios.post(`${API_BASE}/api/properties`, {newCard},
                { 
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                .then(res => {
                    console.log("Success:", res.data)
                    newCard.id = res.data.id
                    this.setState(prevState => ({
                        modalOpen: false,
                        cards: [...prevState.cards, newCard]
                    }));
                })
                .catch(err => console.error("Error:", err));
            } else {
                
                this.setState(prevState => ({
                    modalOpen: false,
                    cards: [...prevState.cards, newCard]
                }));
            }
        }   
    }

    displayModal = (modalTitle, card, action, index, cancelFunction) => {
        let newFields;

        if (card != null) {
            newFields = this.props.fields.map((field, i) => ({
                ...field,
                value: Object.values(card)[i] || ""
            }));
        }

        return (
            <AdvancedModal 
                title={modalTitle}
                fields={
                    card == null
                    ? this.props.fields
                    : newFields
                }
                onSave={action == "Add" ? this.saveClicked 
                    : (updatedValues) => {
                        cancelFunction()

                        const updatedCard = {};
                        const cardKeys = Object.keys(card); // same order as original

                        cardKeys.forEach((key, i) => {
                            updatedCard[key] = updatedValues[i];
                        });

                        this.updateCard(index, updatedCard);
                    }
                }
                onCancel={action == "Add" ? this.modalClicked : cancelFunction}
            />
        );
    };

    renderCard = (card, index) => {
        if (this.props.page == "Properties") {
            return(
            <PropertyComponent 
                key={index}
                index={index}

                title={card.name}
                address={card.address}
                distance={card.distance}
                propertyType={card.propertyType}

                modal={this.displayModal}
                onDelete={this.deleteCard}
            />   
            )
        }
    }

    render(){
        return(
            <>
                <div className={styles["properties-header"]}>
                    <div className={styles["properties-text"]}>
                        <h2>{this.props.page}</h2>
                        <p>{this.props.description}</p>
                    </div>
                    <div className={styles["properties-action"]}>
                        <button
                            className="btn blue waves-effect waves-light"
                            onClick ={this.modalClicked} >
                            <i className="material-icons left">add</i>
                            {this.props.buttonText}
                        </button>

                        {this.state.modalOpen && (
                            this.displayModal(this.props.buttonText, null, "Add", null)
                        )}

                    </div>
                </div>
                
                {this.state.cards.map((card, index) => (
                    this.renderCard(card, index)
                ))}
            </>
        );
    }
}

export default PageIntro;
