/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { useState } from 'react';

function SectionOne(){
    return(
        <>
        <div 
            css={css`
            margin-top:6.5vh`
            }>
            <h1 
                css={css`
                    font-family: "Outfit",sans-serif;
                    font-size: 2.5em;
                    letter-spacing: 0.04em;
                    word-spacing: 0.2em;
                `
                }>
            Get started with a new project</h1>
        </div>
        </>
    )
}

export default SectionOne;
