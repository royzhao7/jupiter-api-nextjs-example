import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import React from 'react'

const Header = () => {
    return (
        <div className="navbar w-full mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
            <div className="flex-none">
                <button className="btn btn-square btn-ghost">
                    <span className="text-4xl">🦤</span>
                </button>
            </div>
            <div className="flex-1 px-2 mx-2">
                <span className="text-lg font-bold">Jupiter</span>

                
            </div>
            <div className="flex-none">
                <WalletMultiButton className="btn btn-ghost" />   
            </div>
        </div>
    )
}

export default Header
