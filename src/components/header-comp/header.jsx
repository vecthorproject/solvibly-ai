import { useState } from 'react'
import "./header.css"
import solviblyLogo from "../../graphics/logo/logopng.png"
import solviblyTitleHead from "../../graphics/title-head/titleheadsvg.svg"

function Header(){
    return(
        <>
        <header className="header">
            <div id="head-logo-cont">
              <img src={solviblyLogo} id="logo-img" alt="Logo Solvibly AI" />
            </div>
            <div id="head-title-cont">
              <img src={solviblyTitleHead} id="title-head-svg" alt="Title Solvibly AI" />
            </div>
            <div id="head-links-cont">
              <a class="anchor-link">1st page</a>  
              <a class="anchor-link">2nd page</a>
              <a class="anchor-link">3rd page</a>
            </div>
        </header>
        </>
    )
}

export default Header