import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'

const AppRoutes = () => {
    return (

        <BrowserRouter>
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path='/' element={<Home />} />
                </Route>
                <Route element={<PublicRoute />}>
                    <Route path='/register' element={<Register />} />
                    <Route path='/login' element={<Login />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes