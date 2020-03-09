import React, { useState, useEffect } from 'react'
import { getDB } from './api'

export default function (props) {
    const { original, setMovies, setSearch } = props
    const [keyword, setKeyword] = useState('')
    const onChange = evt => setKeyword(evt.target.value)
    const onKeyDown = evt => {
        if (evt.keyCode === 13) { // enter
            if (keyword) {
                let r = []
                getDB()
                    .then(res => res.json())
                    .then(db => {
                        const found = db.filter(i => i.k.toLowerCase().indexOf(keyword.toLowerCase()) >= 0)
                        r = found.map(f => f.f) // filename
                        return r.length > 0 ? fetch(r[0]) : null
                    }).then(res =>
                        res ? res.json() : res
                    ).then(result => {
                        const movies = result
                            ? result.filter(d => d.name.toLowerCase().indexOf(keyword.toLowerCase()) >= 0)
                            : []
                        setSearch(true)
                        setMovies(movies)
                    })
            } else {
                setSearch(false)
                setMovies(original) // original
            }
        }
    }

    return (
        <nav>
            <h1>影兮兮</h1>
            <div className={`lime-textField-input search`} style={{ justifyContent: 'flex-start' }}>
                <input placeholder='搜索' onChange={onChange} onKeyDown={onKeyDown} />
            </div>
            <div className='profile'></div>
        </nav>
    )
}