import React, { useState } from 'react';
import "./App.css";

import { GoogleGenerativeAI } from "@google/generative-ai";

export default function App() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const API_KEY = "AIzaSyA3184YLvmoBY_I8E_d92tVaUM7hVk051E";
    const model = new GoogleGenerativeAI(API_KEY).getGenerativeModel({ model: "gemini-1.5-flash" });

    const generateContent = async (prompt) => {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();
            return text;
        } catch (error) {
            console.error("Error generating content:", error);
            return 'Error generating content.';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        const formEle = document.querySelector("form");
        const formData = new FormData(formEle);

        const formDataObj = {};
        formData.forEach((value, key) => {
            formDataObj[key] = value;
        });

        setLoading(true);
        setMessage('');
        
        try {
            const questions = [
                formDataObj.Question1,
                formDataObj.Question2,
                formDataObj.Question3,
                formDataObj.Question4,
                formDataObj.Question5
            ];

            const prompts = questions;

            const responses = await Promise.all(prompts.map(prompt => generateContent(prompt)));

            const combinedData = {
                name: formDataObj.Name,
                email: formDataObj.Email,
                answers: questions.map((question, index) => ({
                    question: question,
                    response: responses[index]
                }))
            };

            console.log('Name:', combinedData.name);
            console.log('Email:', combinedData.email);
            combinedData.answers.forEach((item, index) => {
                console.log(`Question ${index + 1}:`, item.question);
                console.log(`Answer ${index + 1}:`, item.response);
            });

           const sheetData = new URLSearchParams();
            sheetData.append('Name', formDataObj.Name);
            sheetData.append('Email', formDataObj.Email);
            combinedData.answers.forEach((item, index) => {
                sheetData.append(`Question${index + 1}`, item.question);
                sheetData.append(`Answer${index + 1}`, item.response);
            });

            await fetch(
                "https://script.google.com/macros/s/AKfycbxWbIMD3BNowtzmWiW0ElfUUg3Ww1uEcRo-PiYn5fonIsVwkIRXBW0MLG6iKbyGNGw/exec",
                {
                    method: "POST",
                    body: sheetData
                }
            )
            .then((res) => res.text())
            .then((text) => {
                try {
                    const data = JSON.parse(text);
                    console.log('Response Data:', data);
                } catch (error) {
                    console.log('Response Text:', text);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
            
            setMessage('Your answers will be sent to your respective email.');

        } catch (error) {
            console.error("Error fetching responses:", error);
            setMessage('Error fetching responses.');
        } finally {
            setLoading(false);
            formEle.reset(); 
        }
    };

    return (
        <div className="app-container">
            <h1 className="app-title">Your questions are the first step to understanding</h1>
            <div>
                <form className="form" onSubmit={handleSubmit}>
                    <div className="input-container">
                        <input className="input-field" placeholder="Your Full Name *" name="Name" type="text" required />
                    </div>
                    <div className="input-container">
                        <input className="input-field" placeholder="Enter Your Email Here *" name="Email" type="email" required />
                    </div>
                    <div className="input-container">
                        <input className="input-field" placeholder="Question 1 *" name="Question1" type="text" required />
                    </div>
                    <input className="input-field" placeholder="Question 2" name="Question2" type="text" />
                    <input className="input-field" placeholder="Question 3" name="Question3" type="text" />
                    <input className="input-field" placeholder="Question 4" name="Question4" type="text" />
                    <input className="input-field" placeholder="Question 5" name="Question5" type="text" />
                    <button className="submit-button" type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                    {message && <p className="message">{message}</p>}
                </form>
            </div>
        </div>
    );
}

