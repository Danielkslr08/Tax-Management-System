import { Component } from "react";
import axios from 'axios';

import AdvancedModal from "../components/AdvancedModal/AdvancedModal";

class TextBox extends Component{
    constructor(){
        super();
        this.state = {
            textInput: "",
            count: 0,
            text: "hellooooooo",
            temp: "",
            AdvancedModalOpen: false
        }
    }

    componentDidMount() {
        setTimeout(()=>{  
            this.setState({
                text: "State Changed"
            })
        }, 2000)
        this.fetchAPI();
        const elems = document.querySelectorAll('.modal');
        const instances = window.M.Modal.init(elems);
    }

    fetchAPI = () => {
        const url = 'https://api.openweathermap.org/data/2.5/weather?q=London&units=imperial&appid=e312dbeb8840e51f92334498a261ca1d'
        axios.get(url).then((resp)=>{
            this.setState({
                temp: resp.data.main.temp
            })
        })
    }

    inputChange = (event) => {
        this.setState({
            textInput: event.target.value
        })
    }

    clicked = () => {
        this.setState({
            count: this.state.count + 1
        })
    }

    render() {
        return(
            <>  
                <h2>{this.state.textInput}</h2>
                <input 
                type="text" 
                onChange={this.inputChange}
                placeholder="Enter some text!"
                />
                <button onClick={this.clicked}>{this.state.count}</button>
                <p>{this.state.text}</p>
                <p>{this.state.temp}</p>

                <button data-target="modal1" className="btn modal-trigger waves-effect waves-light">Modal</button>
                <div id="modal1" className="modal">
                    <div className="modal-content">
                        <h4>Modal Header</h4>
                        <p>A bunch of text</p>
                    </div>
                    <div className="modal-footer">
                        <button className="modal-close waves-effect waves-red btn-flat">Cancel</button>
                        <button className="modal-close waves-effect waves-green btn-flat">Save</button>
                    </div>
                </div>
                <button onClick={() => this.setState({AdvancedModalOpen: true})}>Advanced Modal</button>
                {this.state.AdvancedModalOpen && <AdvancedModal 
                    title = "Custom Title"
                    fields={[
                        { value: "first", label: "First Field", type: "input", placeholder: "Enter first..." },
                        { value: "second", label: "Second Field", type: "input", placeholder: "Enter second..." },
                        { value: "", label: "Third Field", type: "select", options: ["A", "B", "C"] },
                        { value: "", label: "Fourth Field", type: "select", options: ["X", "Y", "Z"] },
                        { value: "second", label: "Second Field", type: "input", placeholder: "Enter second..." },
                    ]}
                    onSave={() => this.setState({AdvancedModalOpen: false})}
                    onCancel={() => this.setState({AdvancedModalOpen: false})}
                />
                }
            </>
        );
    }
}

export default TextBox;