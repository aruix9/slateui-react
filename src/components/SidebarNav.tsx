import React from 'react'
import {
  LdSidenav,
  LdSidenavBack,
  LdSidenavHeader,
  LdSidenavHeading,
  LdSidenavNavitem,
  LdSidenavSlider,
  LdSidenavSubnav,
  LdSidenavToggleOutside,
} from '@emdgroup-liquid/liquid/dist/react'

const SidebarNav = () => {
  return (
    <>
      <LdSidenavToggleOutside className='z-10' />
      <LdSidenav
        className='z-20'
        style={{ '--ld-sidenav-width': '18rem' }}
        collapsible
        collapsed
      >
        <LdSidenavHeader href='#' slot='header'>
          Capacity Simulation App
        </LdSidenavHeader>
        <LdSidenavBack slot='top'>
          <LdSidenavNavitem>Capacity Simulation App</LdSidenavNavitem>
        </LdSidenavBack>
        <LdSidenavSlider label='Capacity Simulation App'>
          <LdSidenavNavitem>Mathematical foundations</LdSidenavNavitem>
          <LdSidenavNavitem>Algorithms and data structures</LdSidenavNavitem>
          <LdSidenavNavitem>Artificial intelligence</LdSidenavNavitem>
          <LdSidenavNavitem>Communication and security</LdSidenavNavitem>
        </LdSidenavSlider>
        <LdSidenavNavitem slot='bottom' rounded>
          Student profile
        </LdSidenavNavitem>
      </LdSidenav>
    </>
  )
}

export default SidebarNav
