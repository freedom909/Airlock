import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Listing from './components/listing';
import OAuth from './components/oauth';
import Login from './components/Login';

function Route() {
    return (
        <Router>
            <div>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/listing" element={<Listing />} />
                    <Route path="/oauth" element={<OAuth />} />
                    <Route path="login" element={<Login />}>
                    </Route>
                </Routes>
            </div>
        </Router>
    );
}