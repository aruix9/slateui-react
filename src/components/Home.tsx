import { LdBgCells, LdHeader } from '@emdgroup-liquid/liquid/dist/react'
import React from 'react'

function Home() {
  return (
    <div className='bg-thm-ocean-secondary bg-thm-secondary overflow-hidden relative home-page'>
      <div className='relative z-10 home-content px-4 max-w-lg h-screen  mx-20 py-20 flex flex-col justify-center'>
        <hgroup className='mb-12'>
          <h2>Merck KGaA</h2>
          <h4>Darmstadt, Germany</h4>
        </hgroup>
        <LdHeader
          style={{
            borderRadius: '8px',
            '--ld-sp-16': '12px',
            '--ld-header-bg-col': '#FFF',
            '--ld-thm-warning': 'var(--ld-thm-primary)',
          }}
          className='rounded-lg mb-6 w-14 h-14 flex items-center justify-center'
        />
        <h4 className='text-yellow'>
          <strong>Welcome</strong> to the
        </h4>
        <h2 className='mb-6 text-yellow'>IOP platform</h2>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia fugiat
          officia in sequi explicabo, ratione excepturi placeat omnis dolor
          saepe, laboriosam assumenda impedit, repudiandae ut. Placeat
          laudantium voluptatibus quae ad!
        </p>
      </div>
    </div>
  )
}

export default Home
