import React,{useState,useEffect} from 'react'
import { Outlet } from "react-router-dom";
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const Mainlayout = () => {

  return (
    <section className=''>
        <Outlet /> {/* This renders the matched child route component */}
    </section>
  )
}

export default Mainlayout
