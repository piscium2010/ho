import 'whatwg-fetch'
import React, { useReducer, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Main from './Main'
import Nav from './Nav'
import { getMovies } from './api'
import './app.less'

function App() {
    const [movies, setMovies] = useState([])
    const [original, setOriginal] = useState([])
    const [search, setSearch] = useState(false)
    useEffect(() => {
        getMovies().then(res => {
            return res.json()
        }).then(data => {
            setMovies(data)
            setOriginal(data)
        })
    }, [])

    return (
        <Router>
            <Nav setMovies={setMovies} setSearch={setSearch} original={original} />
            <div className='main'>
                <h2>{search ? '搜索结果' : '上新'}</h2>
                <Main data={movies} />
            </div>
            <div className="footer">xice1989@qq.com</div>
        </Router >
    )
}

ReactDOM.render(<App />, document.getElementById('app'))