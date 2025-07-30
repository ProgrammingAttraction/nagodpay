import React,{useState,useEffect} from 'react'
import { Outlet } from "react-router-dom";


const Merchantlayout = () => {

  return (
    <section className=''>
        <Outlet /> {/* This renders the matched child route component */}
    </section>
  )
}

export default Merchantlayout
