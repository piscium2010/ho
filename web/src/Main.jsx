import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import '@piscium2010/lime/lime.css'
import { getMovies } from './api'
import { Route, Link, Switch, useParams } from 'react-router-dom'
import MessageBox from './components/MessageBox'

export default function Main(props) {
    const { data } = props
    return (
        <div>
            <Route path='/hohoho' exact component={() => (
                <>
                    <Movies data={data} />
                </>
            )} />
            <Route path='/hohoho/detail/:id' children={<Detail data={data} />} />
        </div>
    )
}

function Movies(props) {
    const { data } = props
    return (
        <>
            {
                data.map((data, i) =>
                    <Movie key={i} data={data} id={i} />
                )
            }
        </>
    )
}

function Movie(props) {
    const { id, data } = props
    const { name, meta } = data
    return (
        <div className='block'>
            <div className='title'>
                <Link to={`/hohoho/detail/${id}`}>
                    <span className='rate'>[豆瓣：{formatRate(meta.douban)}] - </span>&nbsp;{name}
                </Link>
            </div>
        </div>
    )
}

function Detail(props) {
    const { id } = useParams();
    const { data } = props
    const movie = data[id]
    const meta = movie.meta
    const onClick = evt => {
        copyToClipboard(movie.d[0])
        MessageBox.show('链接已复制到剪贴板')
    }
    return (
        <>
            <div className="detail">
                <div className="overview">
                    <div className="left">
                        <img alt='preview' src={movie.imgSrc}></img>
                    </div>
                    <div className="meta">
                        <ul>
                            <li>片名：{meta.name}</li>
                            <li>译名：{meta['t-name']}</li>
                            <li>语言：{meta.language}</li>
                            <li>产地：{meta.country}</li>
                            <li>上映：{meta.year}</li>
                            <li>导演：{meta.director}</li>
                            <li>主演：{meta.leading}</li>
                            <li>类别：{meta.category}</li>
                            <li>标签：{meta.label}</li>
                        </ul>
                    </div>
                </div>
                <p>{meta.summary}</p>
                <div>下载链接</div>
                <div className={`lime-textField-input`} style={{ justifyContent: 'flex-start' }} onClick={onClick}>
                    <div className='download'>{movie.d[0]}</div>
                </div>
            </div>
            <h2 style={{textAlign:'center'}}>
                <Link to='/hohoho'>返回</Link>
            </h2>
        </>
    )
}

function formatRate(str = '') {
    const match = str.match(/(\d|\.)+[^\/]/)
    return match ? match[0] : '6.0'
}

function copyToClipboard(str) {
    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';                 
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =            
      document.getSelection().rangeCount > 0        // Check if there is any content selected previously
        ? document.getSelection().getRangeAt(0)     // Store selection if found
        : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
      document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
      document.getSelection().addRange(selected);   // Restore the original selection
    }
}
