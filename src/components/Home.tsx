import { LdBgCells, LdHeader } from '@emdgroup-liquid/liquid/dist/react'
import React from 'react'

function Home() {
  return (
    <div className='slate-ui-container bg-thm-ocean-secondary bg-thm-secondary simulationMasterTable mb-16 w-screen h-screen overflow-hidden relative'>
      <div className='fixed right-0 bottom-0 z-0 w-[700px] aspect-square'>
        <LdBgCells
          type='hexagon'
          style={{
            '--ld-bg-cells-layer-translation-x': '-125%',
            '--ld-bg-cells-layer-translation-y': '110%',
            '--ld-bg-cells-layer-size': '490%',
            '--ld-bg-cells-layer-col': 'var(--ld-thm-ocean-secondary)',
            '--ld-bg-cells-bg-col': 'var(--ld-thm-primary-active)',
            aspectRaio: 1,
          }}
        />
        <img
          src='/home-bg.png'
          alt='Home'
          className='absolute right-6 bottom-6 z-10 w-2xl'
        />
      </div>
      <div className='relative z-10 px-4 max-w-lg h-screen  mx-20 py-20 flex flex-col justify-center'>
        <hgroup className='mb-12'>
          <h2 className='text-3xl'>Merck KGaA</h2>
          <h4 className='text-xl'>Darmstadt, Germany</h4>
        </hgroup>
        <LdHeader
          style={{
            'border-radius': '8px',
            '--ld-sp-16': '12px',
            '--ld-header-bg-col': '#FFF',
            '--ld-thm-warning': 'var(--ld-thm-primary)',
          }}
          className='rounded-lg mb-6 w-14 h-14 flex items-center justify-center'
        />
        <h4 className='text-xl'>
          <strong>Welcome</strong> to the
        </h4>
        <h2 className='mb-6 text-3xl'>IOP platform</h2>
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
