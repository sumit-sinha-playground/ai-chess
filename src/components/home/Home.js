import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
    const [selectedColor, setSelectedColor] = useState('white');
    const navigate = useNavigate();

    const handleColorChange = (event) => {
        setSelectedColor(event.target.value);
    };

    const handleStartGame = () => {
        navigate(`/game?color=${selectedColor}`);
    };

    return (
        <div className="home-container">
            <div className="home-card">
                <h1 className="home-title">Welcome to AI Chess</h1>
                <div className="color-selection">
                    <h2>Select Color</h2>
                    <div className="radio-group">
                        <label className={`radio-label ${selectedColor === 'white' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                value="white"
                                checked={selectedColor === 'white'}
                                onChange={handleColorChange}
                            />
                            White
                        </label>
                        <label className={`radio-label ${selectedColor === 'black' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                value="black"
                                checked={selectedColor === 'black'}
                                onChange={handleColorChange}
                            />
                            Black
                        </label>
                    </div>
                </div>

                <button className="start-button" onClick={handleStartGame}>
                    Start Game
                </button>
            </div>
        </div>
    );
}

export default Home;
