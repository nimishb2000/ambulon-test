import React, { Component } from 'react';
import openSocket from "socket.io-client";
import './App.css';

class App extends Component {

    componentDidMount() {

        fetch('https://ambulon.herokuapp.com/connect', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                return res.json();
            })
            .then(res => {
                console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
        const socket = openSocket('https://ambulon.herokuapp.com/');
        socket.on('test', data => {
            console.log(data);
        });
    }

    render() {
        return (
            <div className="App">
                <h1>Welcome to the App</h1>
            </div>
        );
    }
}

export default App;
