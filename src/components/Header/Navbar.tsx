import React from 'react'
import {
  LdHeader,
  LdIcon,
  LdSidenavToggleOutside,
  LdTypo,
} from '@emdgroup-liquid/liquid/dist/react'
import { UserInfo } from '../../types'
import { useNavigate } from 'react-router-dom'

const Navbar: React.FC<{ userInfo: UserInfo | null }> = ({ userInfo }) => {
  const navigate = useNavigate()
  return (
    <header className='ld-header header-container navbarHeader slate-ui-header-container'>
      <div className='ld-header__container relative'>
        <div className='flex items-center justify-center z-0 gap-2 absolute inset-0'>
          <svg
            aria-label='Merck KGaA, Darmstadt, Germany'
            className='ld-header__logo ld-icon'
            viewBox='0 0 24 24'
            fill='none'
          >
            <path
              fill-rule='evenodd'
              clip-rule='evenodd'
              d='M20.5921 7.5H19.1a.2955.2955 0 0 0-.1926.0727l-2.9895 2.6378c-1.0241.9043-2.4024 1.412-3.9177 1.412-1.5796 0-3.0088-.5544-4.0444-1.5266 0 0-2.199-1.9406-2.2179-1.958-.422-.369-1.0028-.624-1.6714-.6379h-1.785C2.126 7.5 2 7.6184 2 7.7645v7.4118c0 .7316.6301 1.3237 1.4083 1.3237h.9133c.1564 0 .2831-.1194.2831-.2661l.0007-2.6375c0-.6893.5987-1.2579 1.3204-1.2579 1.3434 0 2.3067 1.0814 3.177 1.8037 1.0661.8849 1.8871 1.7374 2.8974 1.7374 1.0092 0 1.8306-.8525 2.8966-1.7374.8707-.7223 1.834-1.8037 3.1767-1.8037.718 0 1.3137.5629 1.3208 1.2468v1.591c0 .7316.6305 1.3224 1.4089 1.3224h.6079c.1588 0 .3061.0013.3061.0013.1561 0 .2828-.1194.2828-.2658V8.8237C22 8.0925 21.3692 7.5 20.5921 7.5Z'
              fill='currentcolor'
            />
          </svg>
          <div className='ld-header_site-name ld-typo--h5'>
            Capacity Simulation App
          </div>
        </div>
        {userInfo && (
          <div className='ld-header_site-name ms-auto ld-typo--h566'>
            {userInfo.email}
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
